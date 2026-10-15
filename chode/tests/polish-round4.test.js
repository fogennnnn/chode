'use strict';

// Polish round 4: async dispatch can never crash on unhandled rejection,
// --force is case-insensitive, and local agents run end-to-end.
// Filesystem-touching parts run in a temp workspace via --fixture so the
// repo's own .chode state is never mutated by tests.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'chode.js');

function cli(cwd, args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (r.error) throw r.error;
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();

  // 1. runCommand converts async throws into clean CLI errors.
  const writes = [];
  const originalWrite = process.stderr.write;
  process.stderr.write = function (chunk) { writes.push(String(chunk)); return true; };
  let settled = false;
  try {
    chode.runCommand('boomcmd', async () => { throw new Error('boom-x'); });
    await new Promise((resolve) => setTimeout(resolve, 50));
    settled = true;
  } finally {
    process.stderr.write = originalWrite;
  }
  assert.ok(settled, 'runCommand must settle without crashing the process');
  assert.ok(writes.join('').includes('boomcmd failed: boom-x'), 'failure must surface as CLI error');

  // 2. --force normalizes case before routing.
  chode.__resetBoundedForTest();
  chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: [{ id: 'ovh', score: 100 }] });
  const seenPids = [];
  chode.__testHooks.trySingle = async (pid) => {
    seenPids.push(pid);
    return { pid, result: 'ok', latency: 1, tokens: 1 };
  };
  const r = await chode.callWithBestProvider('case check', null, 'OVH', { quietFailures: true });
  assert.ok(r && r.provider === 'ovh', 'force must normalize case, got ' + JSON.stringify(r && r.provider));
  assert.deepStrictEqual(seenPids, ['ovh']);
  chode.__resetBoundedForTest();

  // 3. Local agent contract end-to-end: script gets <taskId> <task> argv,
  // stdout becomes the recorded output, exit 0 marks completion.
  fs.writeFileSync(path.join(tmp, 'agent-echo.js'), 'console.log("agent-ok " + process.argv[3]);\n', 'utf8');
  let out = cli(tmp, ['agents', 'add', 'local1', '--type', 'local', '--command', 'node', '--args', 'agent-echo.js']).out;
  assert.ok(out.includes('Agent added') && out.includes('<taskId> <task>'), 'add documents the argv contract');
  const stored = JSON.parse(fs.readFileSync(path.join(tmp, '.chode', 'agents.json'), 'utf8'));
  assert.deepStrictEqual(stored.agents.find((a) => a.id === 'local1').args, ['agent-echo.js'], '--args persisted');
  out = cli(tmp, ['agents', 'run', 'local1', 'do it']).out;
  const m = out.match(/Task dispatched: (task_\S+)/);
  assert.ok(m, 'run reports the task id, got:\n' + out.slice(0, 300));
  const taskId = m[1];
  let rec = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try { rec = JSON.parse(fs.readFileSync(path.join(tmp, '.chode', 'tasks', taskId + '.json'), 'utf8')); } catch (e) { /* not written yet */ }
    if (rec && rec.status !== 'pending') break;
  }
  assert.ok(rec && rec.status === 'completed', 'local agent must complete, got ' + JSON.stringify(rec && rec.status));
  assert.ok(String(rec.result.output || '').includes('agent-ok do it'), 'stdout recorded on the task');
  out = cli(tmp, ['agents', 'status', taskId]).out;
  assert.ok(out.includes('completed') && out.includes('agent-ok'), 'status shows result');

  console.log('✓ polish round4: dispatch guard, force normalization, local agent e2e');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const meta = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.ok(/^\d+\.\d+\.\d+$/.test(meta.version), 'version must be semver');
  assert.ok(meta.keywords.includes('hemo'), 'keywords must not carry typos');
  for (const f of ['chode.js', 'memory.js', 'web-context.js', 'toolbox.js', 'nosignups.js', 'helios-ledger.js']) {
    assert.ok(meta.files.includes(f), 'npm package must ship ' + f);
  }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-polish-r4-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 120000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
