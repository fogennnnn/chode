'use strict';

// History export + native memory: messages that age out of the working
// context append to .chode/history/<minuteMs>.txt (one file per minute);
// the same act writes a first-10-words label for that minute into
// index.json. `chode timeline` lists the labeled timeline, spans read back,
// fresh sessions import the recent minutes on restart. Hermetic via temp cwd.

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

  // Labeler: deterministic FIRST-10-WORDS label (headers skipped), no LLM.
  var label = chode.minuteLabel('[user · 2023-11-14T22:40:00.000Z]\nRetail prices for the coordinator passed the district audit checklist today');
  assert.strictEqual(label, 'retail prices for the coordinator passed the district audit checklist today'.split(' ').slice(0, 10).join(' '),
    'unexpected label: "' + label + '"');
  assert.strictEqual(chode.minuteLabel('[user · 2023-11-14T22:40:00.000Z]\nfirst'), 'first', 'short minute label falls back to its words');
  var labels = JSON.parse(fs.readFileSync(path.join(tmp, '.chode', 'history', 'index.json'), 'utf8'));
  var mlabel = labels[String(minute)] || '';
  assert.strictEqual(mlabel, 'first second', 'minute label = first words of the bodies, headers skipped: ' + mlabel);

  // Travel: empty-dir message, list, range filter by timestamp.
  const emptyDir = path.join(tmp, 'empty-project');
  fs.mkdirSync(emptyDir, { recursive: true });
  const empty = spawnSync(process.execPath, [CLI, 'travel'], { cwd: emptyDir, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((empty.stdout + empty.stderr).includes('No exported history yet'), 'travel empty message: ' + (empty.stdout + empty.stderr));
  const emptyMem = spawnSync(process.execPath, [CLI, 'timeline'], { cwd: emptyDir, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((emptyMem.stdout + emptyMem.stderr).includes('Timeline is empty'), 'timeline empty message: ' + (emptyMem.stdout + emptyMem.stderr));

  const list = spawnSync(process.execPath, [CLI, 'travel'], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  const listed = list.stdout + list.stderr;
  assert.ok(listed.includes(minute + '.txt'), 'travel lists exported file: ' + listed);
  assert.ok(listed.includes(labels[String(minute)]), 'travel shows the minute label: ' + listed);

  const memList = spawnSync(process.execPath, [CLI, 'timeline'], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  const memOut = memList.stdout + memList.stderr;
  assert.ok(memOut.includes(labels[String(minute)]), 'timeline shows labels: ' + memOut);
  assert.ok(memOut.includes('Read a span'), 'timeline span hint: ' + memOut);

  const none = spawnSync(process.execPath, [CLI, 'travel', String(minute + 120000), String(minute + 180000)], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.ok((none.stdout + none.stderr).includes('No exported messages in that span'), 'travel empty span: ' + (none.stdout + none.stderr));

  const span = spawnSync(process.execPath, [CLI, 'travel', String(minute), String(minute + 120000)], { cwd: tmp, encoding: 'utf8', timeout: 60000, windowsHide: true });
  const out = span.stdout + span.stderr;
  assert.ok(out.includes('first') && out.includes('second') && out.includes('next-minute'), 'travel prints content in span: ' + out);
  assert.ok(!out.includes('third'), 'span excludes out-of-range ts: ' + out);

  // Restart import: fresh session gets one memory-recall message; repeat
  // seeding is a no-op.
  var sid = 'seed-' + Date.now().toString(36);
  assert.strictEqual(chode.seedRecentMemory(sid), true, 'fresh session seeded');
  var seeded = chode.loadSession(sid);
  assert.strictEqual(seeded.messages.length, 1, 'one seed message, got ' + seeded.messages.length);
  assert.strictEqual(seeded.messages[0].kind, 'memory-recall', 'seed kind');
  assert.ok(seeded.messages[0].content.includes(labels[String(minute)]), 'seed body lists labeled minutes');
  assert.ok(seeded.messages[0].content.includes('first'), 'seed body includes recent minute text');
  assert.strictEqual(chode.seedRecentMemory(sid), false, 'second seed is a no-op');

  // Overflow flush exports what leaves the working set.
  var sid2 = 'flush-' + Date.now().toString(36);
  chode.loadSession(sid2);
  chode.saveSession({ id: sid2, messages: Array.from({ length: 55 }, (_, i) => ({ role: 'user', content: 'old-' + i, ts: t + i })) });
  assert.strictEqual(chode.flushSessionOverflow(sid2), 5, 'flush exported 5 messages');
  var kept = chode.loadSession(sid2);
  assert.strictEqual(kept.messages.length, 50, '50 kept after flush');
  assert.ok(!fs.readFileSync(path.join(tmp, '.chode', 'history', String(t - (t % 60000)) + '.txt'), 'utf8').includes('old-50'), 'kept tail not exported');
}

if (process.argv.includes('--fixture')) {
  try {
    runFixture();
    console.log('✓ history export: minute files + deterministic labels + memory + restart seed');
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
