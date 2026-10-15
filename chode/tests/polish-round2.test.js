'use strict';

// Polish round 2: update squat guard, agents validation/traversal,
// memory compress hang fix, key-mask minimization.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'chode.js');

function cli(cwd, args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (r.error) throw r.error;
  return (r.stdout || '') + (r.stderr || '');
}

async function fixture() {
  const tmp = process.cwd();

  // 1. Update must never direct users at the squatted registry package.
  const upd = cli(tmp, ['update']);
  assert.ok(!upd.includes('npm update -g chode'), 'update must not recommend the squatted package');

  // 2. Agents validation matrix.
  let out = cli(tmp, ['agents', 'add']);
  assert.ok(/Usage/.test(out), 'add without id must show usage');
  out = cli(tmp, ['agents', 'add', 'x', '--type', 'bogus']);
  assert.ok(/Unknown agent type/.test(out), 'bogus type rejected');
  out = cli(tmp, ['agents', 'add', 'dup', '--type', 'local']);
  assert.ok(/Agent added/.test(out), 'valid add works');
  out = cli(tmp, ['agents', 'add', 'dup', '--type', 'local']);
  assert.ok(/already exists/.test(out), 'duplicate ids rejected');
  out = cli(tmp, ['agents', 'add', 's1', '--type', 'ssh']);
  assert.ok(/need --host/.test(out), 'ssh without host rejected');
  out = cli(tmp, ['agents', 'add', 'h1', '--type', 'http', '--host', 'example.com', '--tls']);
  assert.ok(/Agent added/.test(out), 'http+tls add works');
  const agents = JSON.parse(fs.readFileSync(path.join(tmp, '.chode', 'agents.json'), 'utf8'));
  assert.strictEqual(agents.agents.find((a) => a.id === 'h1').tls, true, 'tls flag persisted');
  out = cli(tmp, ['agents', 'run', 'nosuch', 'hi']);
  assert.ok(/Unknown agent/.test(out), 'unknown agent fails cleanly');
  out = cli(tmp, ['agents', 'status', '../../evil']);
  assert.ok(/Task not found/.test(out), 'traversal taskId must not escape TASKS_DIR');
  out = cli(tmp, ['agents', 'status']);
  assert.ok(/No tasks yet/.test(out), 'empty task list handled');

  // 3. Memory sweep: due deletions run, future ones wait, no 24h timers.
  const mem = require('../memory.js');
  const past = Date.now() - 1000;
  const future = Date.now() + 99999999;
  fs.mkdirSync(path.join(tmp, '.chode'), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, '.chode', 'memory_state.json'),
    JSON.stringify({ sessions: {}, pendingDeletes: [{ key: 'k-past', deleteAfter: past }, { key: 'k-future', deleteAfter: future }] }),
    'utf8'
  );
  const deleted = [];
  const res = await mem.sweepPendingDeletes(async (k) => { deleted.push(k); });
  assert.deepStrictEqual(deleted, ['k-past'], 'only due deletions run');
  assert.deepStrictEqual([res.swept, res.kept], [1, 1]);
  const kept = JSON.parse(fs.readFileSync(path.join(tmp, '.chode', 'memory_state.json'), 'utf8'));
  assert.deepStrictEqual(kept.pendingDeletes.map((p) => p.key), ['k-future']);
  const memSrc = fs.readFileSync(path.join(__dirname, '..', 'memory.js'), 'utf8');
  assert.ok(!/setTimeout\([^,]+,\s*86400000/.test(memSrc), 'no 24h process-pinning timers may remain');

  // 4. Key display shows last-4 only.
  fs.writeFileSync(
    path.join(tmp, '.chode', 'config.json'),
    JSON.stringify({ providers: { t: { key: 'SECRET0123456789' } } }),
    'utf8'
  );
  out = cli(tmp, ['auth']);
  assert.ok(out.includes('...6789'), 'last-4 shown');
  assert.ok(!out.includes('SECR'), 'key prefix must not leak');

  console.log('✓ polish round2: update guard, agents validation, sweep, mask');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-polish-r2-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 120000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
