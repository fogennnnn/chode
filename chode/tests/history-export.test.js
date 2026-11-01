'use strict';

// History export: messages that age out of the working context drop to
// .chode/history/<timestamp>.txt (timestamp = the message's own ts); travel
// reads a span back. Hermetic via temp cwd (CONFIG_DIR roots on process.cwd()).

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'chode.js');

function runFixture() {
  const tmp = process.cwd();
  const chode = require(CLI);

  // Export: one file per message, named by its own ts, collision gets -2.
  var t = 1700000000000;
  const n = chode.exportDroppedMessages([
    { role: 'user', content: 'first', ts: t },
    { role: 'assistant', content: 'second', ts: t, provider: 'ovh' },
    { role: 'user', content: 'third' }, // no ts → still exports, current ms
    { role: 'assistant', content: '' }, // empty dropped silently
  ]);
  assert.strictEqual(n, 3, 'export count, got ' + n);
  const files = fs.readdirSync(path.join(tmp, '.chode', 'history')).sort();
  assert.strictEqual(files.length, 3, 'one file per exported message, got ' + JSON.stringify(files));
  assert.ok(files.some(f => f === t + '.txt'), 'primary file named by timestamp: ' + JSON.stringify(files));
  assert.ok(files.some(f => f === t + '-2.txt'), 'collision suffixed: ' + JSON.stringify(files));
  const first = fs.readFileSync(path.join(tmp, '.chode', 'history', t + '.txt'), 'utf8');
  assert.ok(first.startsWith('role: user |'), 'role header: ' + first.split('\n')[0]);
  assert.ok(first.includes(new Date(t).toISOString()), 'ISO date header');
  assert.ok(first.includes('first'), 'body preserved');
  const second = fs.readFileSync(path.join(tmp, '.chode', 'history', t + '-2.txt'), 'utf8');
  assert.ok(second.includes('provider: ovh') && second.includes('second'), 'provider + body preserved');

  // Travel: empty-dir message, list, range filter by timestamp.
  const emptyDir = path.join(tmp, 'empty-project');
  fs.mkdirSync(emptyDir, { recursive: true });
  const empty = spawnSync(process.execPath, [CLI, 'travel'], { cwd: emptyDir, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((empty.stdout + empty.stderr).includes('No exported history yet'), 'travel empty message: ' + (empty.stdout + empty.stderr));

  const list = spawnSync(process.execPath, [CLI, 'travel'], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((list.stdout + list.stderr).includes(t + '.txt'), 'travel lists exported file: ' + (list.stdout + list.stderr));

  const none = spawnSync(process.execPath, [CLI, 'travel', String(t + 1000), String(t + 2000)], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((none.stdout + none.stderr).includes('No exported messages in that span'), 'travel empty span: ' + (none.stdout + none.stderr));

  const span = spawnSync(process.execPath, [CLI, 'travel', String(t), String(t)], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  const out = span.stdout + span.stderr;
  assert.ok(out.includes('first') && out.includes('second'), 'travel prints content in span: ' + out);
  assert.ok(!out.includes('third'), 'span excludes out-of-range ts: ' + out);
}

if (process.argv.includes('--fixture')) {
  try {
    runFixture();
    console.log('✓ history export: timestamped drop files + travel spans');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-hist-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw child.error;
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
