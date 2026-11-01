'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const root = process.cwd();

  // 1. Todo file routing.
  assert.ok(chode.todosFile('default').endsWith(path.join('.chode', 'todos.json')));
  assert.ok(chode.todosFile('work-2').endsWith(path.join('.chode', 'todos-work-2.json')));
  assert.strictEqual(chode.todosFile('../evil'), chode.todosFile('default'));
  assert.strictEqual(chode.todosFile(''), chode.todosFile('default'));

  // 2. Session isolation: same text in three scopes stays separate.
  const a = chode.toolTodo({ action: 'add', text: 'alpha task' }, { session: 'alpha' });
  const b = chode.toolTodo({ action: 'add', text: 'beta task' }, { session: 'beta' });
  const d = chode.toolTodo({ action: 'add', text: 'default task' });
  assert.ok(a.ok && b.ok && d.ok);
  const la = chode.toolTodo({ action: 'list' }, { session: 'alpha' });
  const lb = chode.toolTodo({ action: 'list' }, { session: 'beta' });
  const ld = chode.toolTodo({ action: 'list' });
  assert.ok(la.todos.some((t) => t.text === 'alpha task'));
  assert.ok(!la.todos.some((t) => t.text === 'beta task'), 'sessions must not leak into each other');
  assert.ok(lb.todos.some((t) => t.text === 'beta task'));
  assert.ok(ld.todos.some((t) => t.text === 'default task'));
  assert.ok(fs.existsSync(path.join(root, '.chode', 'todos-alpha.json')));
  assert.ok(!fs.existsSync(path.join(root, '.chode', 'todos-beta.json.tmp')), 'no stray files');

  // 3. Health prediction from a synthetic usage log.
  const now = 1_800_000_000_000;
  const lines = [];
  for (let i = 0; i < 3; i++) lines.push(JSON.stringify({ t: now - i * 60_000, pid: 'ovh', tok: 10, lat: 200, err: 1 }));
  lines.push(JSON.stringify({ t: now - 60_000, pid: 'mistral', tok: 10, lat: 150, err: 0 }));
  lines.push(JSON.stringify({ t: now - 2 * 3_600_000, pid: 'llm7', tok: 10, lat: 150, err: 1 }));
  fs.mkdirSync(path.join(root, '.chode', 'monitor'), { recursive: true });
  fs.writeFileSync(path.join(root, '.chode', 'monitor', 'usage.jsonl'), lines.join('\n') + '\n', 'utf8');
  const warnings = chode.healthWarnings(now);
  assert.strictEqual(warnings.length, 1, 'only recent repeat failures warn, got ' + JSON.stringify(warnings));
  assert.strictEqual(warnings[0].pid, 'ovh');
  assert.ok(/3\/3/.test(warnings[0].reason), 'reason cites the window tally');

  // 4. Empty log means no predictions.
  fs.writeFileSync(path.join(root, '.chode', 'monitor', 'usage.jsonl'), '', 'utf8');
  assert.deepStrictEqual(chode.healthWarnings(now), []);

  // 5. Line renderer styles whole lines even when split across chunks.
  const parts = [];
  const lr = chode.createLineStreamRenderer((s) => parts.push(s));
  lr.push('# Head');
  lr.push('ing\n**bo');
  lr.push('ld** ok\n```js\ncode\n```\nplain');
  assert.ok(parts.length >= 2, 'complete lines must emit before flush');
  lr.flush();
  const out = parts.join('');
  assert.ok(out.includes('Heading') && !out.includes('# Heading'), 'headings render styled');
  assert.ok(out.includes('bold') && !out.includes('**'), 'bold markers render away');
  assert.ok(out.includes('···'), 'fences become rules');
  assert.ok(out.endsWith('plain'), 'trailing partial line flushes at end');

  // 6. Incomplete lines wait for their newline.
  const held = [];
  const lr2 = chode.createLineStreamRenderer((s) => held.push(s));
  lr2.push('half a line');
  assert.strictEqual(held.length, 0, 'partial lines must not emit early');
  lr2.push(' completed\n');
  assert.ok(held.join('').includes('half a line completed'));

  chode.__resetBoundedForTest();
  console.log('✓ sessions+health: scoped todos, predictions, live line rendering');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-sessions-health-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 30000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
