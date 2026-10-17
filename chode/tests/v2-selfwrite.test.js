'use strict';

// BUG-V2-SELFWRITE: chode's own state under .chode/ (sessions, checkpoints,
// plans, snapshots metadata, tool-output spills, jobs records) must NEVER
// count as task mutations — not in actions, not in snapshots, not in
// verify/facts. Real workspace writes still detected exactly as before.
// Zero network.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  const ctx = () => ({ actions: {}, planTargets: [], overwriteTargets: [] });

  // ── Central predicate ──
  for (const p of ['.chode/sessions/x.json', '.chode/checkpoint.json', '.chode/tool-output/tool_1.txt',
    '.chode/jobs/job_1.json', '.chode/plans/plan-a.md', '.chode/snapshots/snap_x.json', '.chode',
    path.join(tmp, '.chode', 'sessions', 'y.json')]) {
    assert.strictEqual(chode.isSelfStatePath(p), true, p + ' must be self-state');
  }
  for (const p of ['index.html', 'src/a.js', '.env', 'chode-data.txt', 'sub/.chode/x.txt', '']) {
    assert.strictEqual(chode.isSelfStatePath(p), false, p + ' must NOT be self-state');
  }
  assert.deepStrictEqual(
    chode.taskMutationFiles(['index.html', '.chode/sessions/s.json', 'src/a.js', '.chode/jobs/j.json', null, '']),
    ['index.html', 'src/a.js'], 'mutation diff keeps real files only');

  // ── .chode writes succeed but never count as task mutations ──
  let r = await chode.runAgentTool({ tool: 'write', args: { file: '.chode/probe.txt', content: 'state' } }, ctx());
  assert.ok(r.ok, 'harness-state write itself stays allowed, got ' + JSON.stringify(r));
  const acts = { actions: {} };
  await chode.runAgentTool({ tool: 'write', args: { file: '.chode/probe2.txt', content: 'state' } }, acts);
  assert.deepStrictEqual(acts.actions.writes || [], [], 'self-state writes unrecorded, got ' + JSON.stringify(acts.actions.writes));
  fs.writeFileSync(path.join(tmp, 'real-edit.txt'), 'before', 'utf8');
  const acts2 = { actions: {} };
  await chode.runAgentTool({ tool: 'edit', args: { file: '.chode/probe.txt', oldString: 'state', newString: 'state2' } }, acts2);
  await chode.runAgentTool({ tool: 'edit', args: { file: 'real-edit.txt', oldString: 'before', newString: 'after' } }, acts2);
  assert.deepStrictEqual(acts2.actions.edits, ['real-edit.txt'], 'self-state edits unrecorded, got ' + JSON.stringify(acts2.actions.edits));

  // ── Snapshots skip .chode entries; user files still restore ──
  fs.writeFileSync(path.join(tmp, 'index.html'), '<h1>hi</h1>', 'utf8');
  fs.mkdirSync(path.join(tmp, '.chode', 'sessions'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '.chode', 'sessions', 's.json'), '{}', 'utf8');
  const snap = chode.takeSnapshot('selfwrite fixture', ['index.html', '.chode/sessions/s.json'], null);
  assert.ok(snap && snap.id, 'snapshot taken');
  assert.deepStrictEqual(Object.keys(snap.files), ['index.html'], 'snapshot holds user files only, got ' + Object.keys(snap.files).join(','));
  fs.writeFileSync(path.join(tmp, 'index.html'), 'corrupted', 'utf8');
  const rr = chode.restoreSnapshot(snap.id, {});
  assert.ok(rr.ok && rr.restored.includes('index.html'), 'restore bookkeeping intact');
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'index.html'), 'utf8'), '<h1>hi</h1>', 'user file restored');

  // ── Gate + facts see exactly the real files ──
  fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'src', 'a.js'), 'console.log(1);\n', 'utf8');
  const gate = await chode.cheapVerifyGate([], { writes: ['index.html', '.chode/sessions/s.json'], edits: ['src/a.js', '.chode/jobs/j.json'] });
  assert.ok(gate.pass, 'gate passes on real files, got ' + JSON.stringify(gate.failed));
  assert.deepStrictEqual(gate.checks.map((c) => c.check).sort(),
    ['file exists + non-trivial: index.html', 'file exists + non-trivial: src/a.js'].sort(),
    'gate checks exactly the real files, got ' + JSON.stringify(gate.checks));
  const onlySelf = await chode.cheapVerifyGate([], { writes: ['.chode/sessions/s.json'], edits: [] });
  assert.ok(!onlySelf.pass && onlySelf.failed.some((c) => /no writes\/edits observed/.test(c.detail)),
    '.chode-only run diffs EMPTY at the gate, got ' + JSON.stringify(onlySelf.failed));
  const facts = chode.toolObservedFacts('req', [], { writes: ['index.html', '.chode/sessions/s.json'], edits: ['src/a.js'] });
  assert.ok(facts.includes('index.html') && facts.includes('src/a.js'), 'facts keep real files');
  assert.ok(!facts.includes('.chode'), 'facts exclude self-state:\n' + facts);

  // ── SLICE 1 fixture guard intact ──
  r = await chode.runAgentTool({ tool: 'write', args: { file: 'x.test.js', content: 'x' } }, ctx());
  assert.ok(!r.ok && /read-only/.test(r.error), 'fixture guard still denies, got ' + JSON.stringify(r));

  // ── Waste guard: one-sentence no-refetch line in the prompt ──
  assert.ok(chode.agentToolPrompt().includes('Do not re-fetch a URL already present in context; reuse the in-context content unless the task explicitly needs a fresh copy.'),
    'prompt must carry the no-refetch line');

  chode.__resetBoundedForTest();
  console.log('✓ v2 selfwrite: .chode excluded at every layer, real writes exact, guards intact');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-selfwrite-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
