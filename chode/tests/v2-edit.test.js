'use strict';

// Slice 2 — edit hardening (opencode edit.ts semantics, stdlib only):
// three-tier match, LF-view CRLF matching, uniqueness enforcement,
// diff preview before write, post-write re-read + diff, immediate failures.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  const w = (f, c) => fs.writeFileSync(path.join(tmp, f), c, 'utf8');
  const edit = (f, o, n, extra) => chode.runAgentTool(
    { tool: 'edit', args: Object.assign({ file: f, oldString: o, newString: n }, extra) },
    { actions: {}, planTargets: [], overwriteTargets: [] });

  // Tier 0 — exact.
  w('doc.txt', 'alpha\nbeta gamma\nomega\n');
  let r = await edit('doc.txt', 'beta gamma', 'BETA');
  assert.ok(r.ok && r.tier === 0, 'exact must hit tier 0, got ' + JSON.stringify(r));
  assert.ok(r.replacements === 1, 'one replacement');
  assert.ok(r.preview && r.preview.includes('-beta gamma') && r.preview.includes('+BETA'), 'preview shows change, got:\n' + r.preview);
  assert.ok(r.diff && r.diff.includes('+BETA'), 'post-write diff ships in result');
  assert.ok(fs.readFileSync(path.join(tmp, 'doc.txt'), 'utf8').includes('BETA'), 'file updated');

  // Tier 1 — unicode/dash/space normalized (em-dash vs hyphen).
  w('dash.txt', 'wait — what\n');
  r = await edit('dash.txt', 'wait - what', 'wait: what');
  assert.ok(r.ok && r.tier === 1, 'dash-fold must hit tier 1, got ' + JSON.stringify(r));
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'dash.txt'), 'utf8'), 'wait: what\n');
  // Tier 1 — non-breaking space vs plain space.
  w('nbsp.txt', 'a b\n');
  r = await edit('nbsp.txt', 'a b', 'a-b');
  assert.ok(r.ok && r.tier === 1, 'nbsp-fold must hit tier 1, got ' + JSON.stringify(r));

  // Tier 2 — trailing-whitespace line match.
  w('trail.txt', 'hello\n');
  r = await edit('trail.txt', 'hello   ', 'hi');
  assert.ok(r.ok && r.tier === 2, 'trailing-ws must hit tier 2, got ' + JSON.stringify(r));
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'trail.txt'), 'utf8'), 'hi\n');

  // Multiline normalized run.
  w('multi.txt', 'one — two\nthree four\n');
  r = await edit('multi.txt', 'one - two\nthree four', '1\n2');
  assert.ok(r.ok && r.tier === 1, 'multiline normalized run must hit tier 1, got ' + JSON.stringify(r));

  // Uniqueness: multiple matches without replaceAll = step failure.
  w('dup.txt', 'foo one\nfoo two\n');
  r = await edit('dup.txt', 'foo', 'bar');
  assert.ok(!r.ok && /multiple matches|replaceAll/.test(r.error), 'ambiguous edit must fail, got ' + JSON.stringify(r));
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'dup.txt'), 'utf8'), 'foo one\nfoo two\n', 'failed edit writes nothing');
  r = await edit('dup.txt', 'foo', 'bar', { replaceAll: true });
  assert.ok(r.ok && r.replacements === 2, 'replaceAll replaces all, got ' + JSON.stringify(r));
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'dup.txt'), 'utf8'), 'bar one\nbar two\n');

  // CRLF: LF-view matching, EOL preserved, no CRs leak into diffs.
  fs.writeFileSync(path.join(tmp, 'crlf.txt'), 'line one\r\nline two\r\n', 'utf8');
  r = await edit('crlf.txt', 'line one\nline two', 'line 1\nline 2');
  assert.ok(r.ok, 'CRLF must match LF oldString, got ' + JSON.stringify(r));
  const rawCrlf = fs.readFileSync(path.join(tmp, 'crlf.txt'), 'utf8');
  assert.strictEqual(rawCrlf, 'line 1\r\nline 2\r\n', 'CRLF preserved, got ' + JSON.stringify(rawCrlf));
  assert.ok(r.diff.indexOf('\r') === -1, 'diff must not leak CRs');

  // Immediate step failures.
  w('imm.txt', 'keep\n');
  r = await edit('imm.txt', '', 'x');
  assert.ok(!r.ok && /empty oldString/.test(r.error), 'empty oldString must fail, got ' + JSON.stringify(r));
  r = await edit('imm.txt', 'keep', 'keep');
  assert.ok(!r.ok && /identical/.test(r.error), 'identical old/new must fail, got ' + JSON.stringify(r));
  r = await edit('imm.txt', 'missing-needle', 'x');
  assert.ok(!r.ok && /not found/.test(r.error), 'missing needle must fail');
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'imm.txt'), 'utf8'), 'keep\n', 'failures write nothing');

  chode.__resetBoundedForTest();
  console.log('✓ v2 edit: tiers 0/1/2, uniqueness, CRLF, preview + post-write diff, immediate failures');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-edit-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
