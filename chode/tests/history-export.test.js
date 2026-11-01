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

  // Export: per-minute files, named by minute bucket, same-minute appends.
  var t = 1700000000000; // falls in minute 1699999980000
  var minute = t - (t % 60000);
  const n = chode.exportDroppedMessages([
    { role: 'user', content: 'first', ts: t },
    { role: 'assistant', content: 'second', ts: t + 10, provider: 'ovh' }, // same minute → appends
    { role: 'user', content: 'next-minute', ts: t + 61000 },
    { role: 'user', content: 'third' }, // no ts → still exports, current minute
    { role: 'assistant', content: '' }, // empty dropped silently
  ]);
  assert.strictEqual(n, 4, 'export count, got ' + n);
  const files = fs.readdirSync(path.join(tmp, '.chode', 'history')).sort();
  assert.ok(files.some(f => f === minute + '.txt'), 'minute-bucket file: ' + JSON.stringify(files));
  const first = fs.readFileSync(path.join(tmp, '.chode', 'history', minute + '.txt'), 'utf8');
  assert.ok(first.includes('[user · ' + new Date(t).toISOString()) && first.includes('first'), 'role + ISO header + body: ' + first.split('\n')[0]);
  assert.ok(first.includes('[assistant · ') && first.includes('provider: ovh') && first.includes('second'), 'two entries appended in one file');
  assert.ok(files.some(f => String(minute + 60000) + '.txt' === f && fs.readFileSync(path.join(tmp, '.chode', 'history', f), 'utf8').includes('next-minute')), 'next minute is its own file');

  // Travel: empty-dir message, list, range filter by timestamp.
  const emptyDir = path.join(tmp, 'empty-project');
  fs.mkdirSync(emptyDir, { recursive: true });
  const empty = spawnSync(process.execPath, [CLI, 'travel'], { cwd: emptyDir, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((empty.stdout + empty.stderr).includes('No exported history yet'), 'travel empty message: ' + (empty.stdout + empty.stderr));

  const list = spawnSync(process.execPath, [CLI, 'travel'], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((list.stdout + list.stderr).includes(minute + '.txt'), 'travel lists exported file: ' + (list.stdout + list.stderr));

  const none = spawnSync(process.execPath, [CLI, 'travel', String(minute + 120000), String(minute + 180000)], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((none.stdout + none.stderr).includes('No exported messages in that span'), 'travel empty span: ' + (none.stdout + none.stderr));

  const span = spawnSync(process.execPath, [CLI, 'travel', String(minute), String(minute + 120000)], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  const out = span.stdout + span.stderr;
  assert.ok(out.includes('first') && out.includes('second') && out.includes('next-minute'), 'travel prints content in span: ' + out);
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
