'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');

  // todo lifecycle stays inside the temp workspace (.chode/todos.json).
  const added = chode.toolExec('todo', { action: 'add', text: 'write more tests' });
  assert.ok(added.ok && added.id, 'todo add must succeed');
  const listed = chode.toolExec('todo', { action: 'list' });
  assert.ok(listed.ok && listed.todos.some(t => t.id === added.id), 'todo list must include the new item');
  assert.ok(chode.toolExec('todo', { action: 'done', id: added.id }).ok, 'todo done must succeed');
  assert.ok(chode.toolExec('todo', { action: 'list' }).todos.every(t => t.id !== added.id), 'done items leave the open list');
  assert.ok(!chode.toolExec('todo', { action: 'add' }).ok, 'empty todo text must be rejected');

  // pending queue round-trips through the workspace config dir.
  const task = chode.queuePendingTask('rebuild the landing page', 'test-reason');
  assert.ok(task.id, 'queued task needs an id');
  const back = chode.loadPendingTasks();
  assert.ok(back.some(t => t.id === task.id && t.prompt === 'rebuild the landing page'), 'queue must persist the task');

  // agent prompt format covers the new tools.
  const calls = chode.parseToolCalls([
    '```tool',
    '{"tool":"todo","args":{"action":"add","text":"x"}}',
    '```',
    '```tool',
    '{"tool":"webfetch","args":{"url":"https://example.com"}}',
    '```',
    '<tool>{"tool":"toolbox","args":{"action":"list"}}</tool>'
  ].join('\n'));
  assert.deepStrictEqual(calls.map(c => c.tool), ['todo', 'webfetch', 'toolbox']);

  // async tools fail closed offline without hanging.
  const badFetch = await chode.toolWebfetchAsync('not-a-url');
  assert.strictEqual(badFetch.ok, false, 'garbage URL must fail closed');
  assert.strictEqual((await chode.toolWebsearchAsync('')).ok, false, 'empty search must fail closed');
  assert.strictEqual((await chode.toolGithubAsync({ action: 'readme', repo: 'nope' })).ok, false, 'bad repo must fail closed');

  // toolbox ensure asks first without approval, never executes blindly.
  const toolbox = require('../toolbox');
  const originalEnsure = toolbox.ensureTool;
  let ask;
  try {
    toolbox.ensureTool = (name, options) => {
      assert.strictEqual(options.dryRun, true, 'unapproved ensure may only preview installation');
      return { ok: true, plan: { cmd: 'installer', args: [name] } };
    };
    ask = chode.toolExec('toolbox', { action: 'ensure', name: 'ripgrep' });
  } finally { toolbox.ensureTool = originalEnsure; }
  assert.ok(!ask.ok && ask.needConfirm, 'unapproved installation needs confirmation');

  // unknown tools stay unknown.
  assert.strictEqual(chode.toolExec('teleport', {}).ok, false);

  chode.__resetBoundedForTest();
  console.log('✓ interactive tools: todo, queue, formats, closed failures, confirm gates');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-interactive-tools-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 30000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
