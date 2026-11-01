'use strict';

// File checkpoints: snapshot before mutation, restore after, prune old,
// optionally truncate the session. Hermetic via fixture temp workspace.

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

  // 1. Snapshot captures pre-images incl. not-yet-existing files.
  fs.writeFileSync(path.join(tmp, 'a.txt'), 'v1', 'utf8');
  const s1 = chode.takeSnapshot('test turn', ['a.txt', 'new.txt', '.env', '../evil.txt'], 'sess1');
  assert.ok(s1 && s1.id.startsWith('snap_'), 'snapshot recorded');
  assert.strictEqual(s1.files['a.txt'], 'v1');
  assert.strictEqual(s1.files['new.txt'], null, 'missing files captured as null');
  assert.ok(!('..\\evil.txt' in s1.files || '../evil.txt' in s1.files), 'outside files skipped');
  assert.ok(!('.env' in s1.files), 'secret files skipped');
  assert.strictEqual(s1.msgCount, 0, 'missing session normalizes to zero messages');

  // 2. Restore brings back originals and removes created files.
  fs.writeFileSync(path.join(tmp, 'a.txt'), 'v2', 'utf8');
  fs.writeFileSync(path.join(tmp, 'new.txt'), 'created', 'utf8');
  const r1 = chode.restoreSnapshot(s1.id, {});
  assert.ok(r1.ok && r1.restored.length === 2, 'both files restored, got ' + JSON.stringify(r1));
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'a.txt'), 'utf8'), 'v1');
  assert.ok(!fs.existsSync(path.join(tmp, 'new.txt')), 'created file removed');

  // 3. Agent writes snapshot automatically; rewind undoes them.
  let out = cli(tmp, ['tool', 'write', 'b.txt', 'hello', '--yes']).out;
  assert.ok(out.includes('Wrote'), 'manual write works, got:\n' + out.slice(0, 200));
  fs.writeFileSync(path.join(tmp, 'b.txt'), 'changed', 'utf8');
  const snaps = chode.listSnapshots();
  assert.ok(snaps.some((s) => s.label === 'manual write'), 'manual mutation snapshotted');
  const back = chode.restoreSnapshot(snaps.find((s) => s.label === 'manual write').id, {});
  assert.ok(back.ok);
  assert.ok(!fs.existsSync(path.join(tmp, 'b.txt')), 'b.txt did not exist at snapshot time');

  // 4. Session truncation is opt-in.
  const msgs = (n) => Array.from({ length: n }, (_, i) => ({ role: 'user', content: 'm' + i }));
  chode.saveSession({ id: 'sess1', messages: msgs(5), fallbacks: [] });
  const s2 = chode.takeSnapshot('with session', ['a.txt'], 'sess1');
  assert.strictEqual(s2.msgCount, 5);
  chode.saveSession({ id: 'sess1', messages: msgs(8), fallbacks: [] });
  chode.restoreSnapshot(s2.id, {});
  assert.strictEqual(chode.loadSession('sess1').messages.length, 8, 'code-only rewind keeps conversation');
  chode.restoreSnapshot(s2.id, { withSession: true });
  assert.strictEqual(chode.loadSession('sess1').messages.length, 5, '--with-session truncates');

  // 5. Bounds and bad input.
  assert.strictEqual(chode.takeSnapshot('empty', [], null), null);
  assert.strictEqual(chode.takeSnapshot('empty', ['.env'], null), null);
  assert.strictEqual(chode.restoreSnapshot('../../x', {}).ok, false);
  assert.strictEqual(chode.restoreSnapshot('snap_nope', {}).ok, false);
  for (let i = 0; i < 25; i++) chode.takeSnapshot('fill ' + i, ['a.txt'], null);
  assert.ok(chode.listSnapshots().length <= 20, 'snapshots pruned to cap');
  const listed = chode.listSnapshots();
  assert.ok(listed[0].ts >= listed[listed.length - 1].ts, 'newest first');

  // 6. CLI surface.
  out = cli(tmp, ['rewind']).out;
  assert.ok(out.includes('Checkpoints'), 'rewind lists');
  out = cli(tmp, ['rewind', 'snap_nope']).out;
  assert.ok(out.includes('unknown snapshot'), 'bad id reported');

  chode.__resetBoundedForTest();
  console.log('✓ rewind: snapshot, restore, prune, session truncation, CLI');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-rewind-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 120000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
