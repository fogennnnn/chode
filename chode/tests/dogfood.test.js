'use strict';

// Dogfood quality gate: chode must perform a REAL task and the test
// independently verifies the artifact — never trusts chode's self-report.
// Lesson ported from opencode: every step gets an independent check.
//
// Task: write reverse-words.js (argv file -> lines with word order reversed),
// run it against a known sample, produce correct output.
// Teeth: file must exist, be non-trivial, RUN, and be CORRECT.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'chode.js');
const SAMPLE = 'hello world\nfoo bar baz\n';
const EXPECTED = 'world hello\nbaz bar foo\n';

function fixture() {
  const tmp = process.cwd();
  fs.writeFileSync(path.join(tmp, 'sample.txt'), SAMPLE, 'utf8');

  const prompt = 'Write reverse-words.js in the current directory: it reads a file path '
    + 'from process.argv, prints each line with word order reversed. '
    + 'Then run it on sample.txt and show the output. '
    + 'Do NOT create, modify, or overwrite sample.txt or any other existing file '
    + '— only read sample.txt. Keep line order unchanged; reverse word order '
    + 'within each line.';
  const r = spawnSync(process.execPath, [CLI, 'ai', prompt, '--yes'],
    { cwd: tmp, encoding: 'utf8', timeout: 180000, windowsHide: true });
  const out = (r.stdout || '') + (r.stderr || '');
  assert.ok(!r.error, 'chode ai run must complete, got: ' + (r.error && r.error.message));

  // 1. Artifact exists and is non-trivial (stub detector).
  const target = path.join(tmp, 'reverse-words.js');
  assert.ok(fs.existsSync(target), 'reverse-words.js must be written, chode said:\n' + out.slice(-800));
  const size = fs.statSync(target).size;
  assert.ok(size > 200, 'artifact must be substantive, got ' + size + ' bytes');

  // 2. Independent verification: RUN the produced code ourselves.
  const run = spawnSync(process.execPath, [target, path.join(tmp, 'sample.txt')],
    { cwd: tmp, encoding: 'utf8', timeout: 30000, windowsHide: true });
  assert.strictEqual(run.status, 0, 'produced code must execute, stderr:\n' + (run.stderr || '').slice(0, 500));

  // 3. CORRECTNESS: output must match expected reversal (trailing newline
  // tolerant — console.log-per-line idiom adds one; content is what's graded).
  const norm = (s) => String(s || '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
  assert.strictEqual(norm(run.stdout), norm(EXPECTED),
    'produced code must be correct, got:\n' + JSON.stringify(run.stdout));
  console.log('✓ dogfood: real task written, executed, and correct (' + size + ' bytes)');
}

if (process.argv[2] === '--fixture') {
  try { fixture(); } catch (e) { console.error(e); process.exitCode = 1; }
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-dogfood-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'],
      { cwd: temp, encoding: 'utf8', timeout: 240000, windowsHide: true });
    if (child.error) throw new Error(child.error.message);
    const combined = (child.stdout || '') + (child.stderr || '');
    assert.strictEqual(child.status, 0, combined.slice(-2000));
    console.log((child.stdout || '').trim().split('\n').pop());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
