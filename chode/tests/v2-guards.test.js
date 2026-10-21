'use strict';

// Slice 1 — overwrite guards (construction guarantees):
// (a) workspace escape = step failure before any other check.
// (b) fixture/test/sample inputs read-only unless the plan step declares them.
// (c) no whole-file write to an existing file without "create/overwrite".
// (d) snapshot-before-mutation stays automatic every mutating step.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  const ctx = () => ({ actions: {}, planTargets: [], overwriteTargets: [] });

  // ── (a) Path resolution: escape = step failure BEFORE any other check ──
  let r = await chode.runAgentTool({ tool: 'write', args: { file: '../outside.txt', content: 'x' } }, ctx());
  assert.ok(!r.ok && /outside workspace/.test(r.error), 'relative escape must fail, got ' + JSON.stringify(r));
  r = await chode.runAgentTool({ tool: 'edit', args: { file: '../outside.txt', oldString: 'a', newString: 'b' } }, ctx());
  assert.ok(!r.ok && /outside workspace/.test(r.error), 'edit escape must fail, got ' + JSON.stringify(r));
  const absOutside = path.join(os.tmpdir(), 'chode-v2-escape-' + Date.now() + '.txt');
  r = await chode.runAgentTool({ tool: 'write', args: { file: absOutside, content: 'x' } }, ctx());
  assert.ok(!r.ok && /outside workspace/.test(r.error), 'absolute escape must fail, got ' + JSON.stringify(r));
  assert.ok(!fs.existsSync(absOutside), 'escaped write must never land on disk');
  // Escape wins over every other check (even a 300KB body that would trip caps).
  r = await chode.runAgentTool({ tool: 'write', args: { file: '..\\..\\evil.txt', content: 'x'.repeat(300 * 1024) } }, ctx());
  assert.ok(!r.ok && /outside workspace/.test(r.error), 'escape must precede size caps, got ' + String(r.error).slice(0, 80));
  assert.ok(chode.resolveWorkspaceTarget('../x').ok === false, 'resolveWorkspaceTarget flags ..');
  assert.ok(chode.resolveWorkspaceTarget('ok.txt').ok === true, 'resolveWorkspaceTarget allows inside');

  // ── (b) Fixture/test/sample inputs read-only by default ──
  const protectedFiles = ['my.test.js', 'foo.spec.js', 'out.expected.json', 'sample.txt'];
  fs.mkdirSync(path.join(tmp, 'fixtures'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'samples'), { recursive: true });
  for (const f of protectedFiles.concat(['fixtures/data.json', 'samples/x.txt'])) {
    assert.ok(chode.isFixturePath(f), f + ' must be classified fixture-protected');
  }
  assert.ok(!chode.isFixturePath('src/app.js'), 'normal source must not be protected');
  assert.ok(!chode.isFixturePath('reverse-words.js'), 'task artifact must not be protected');
  for (const f of ['species.html', 'special.css', 'inspection.js', 'contest-entry.txt', 'latest-news.md']) {
    assert.ok(!chode.isFixturePath(f), f + ' merely contains a fixture substring and must not be protected');
  }
  for (const f of protectedFiles) {
    const w = await chode.runAgentTool({ tool: 'write', args: { file: f, content: 'new' } }, ctx());
    assert.ok(!w.ok && /read-only/.test(w.error), f + ' write must be denied, got ' + JSON.stringify(w));
    fs.writeFileSync(path.join(tmp, f), 'orig', 'utf8');
    const e = await chode.runAgentTool({ tool: 'edit', args: { file: f, oldString: 'orig', newString: 'changed' } }, ctx());
    assert.ok(!e.ok && /read-only/.test(e.error), f + ' edit must be denied, got ' + JSON.stringify(e));
    assert.strictEqual(fs.readFileSync(path.join(tmp, f), 'utf8'), 'orig', f + ' must be untouched');
  }
  // Explicit declaration of that exact path overrides (last-match-wins).
  const declared = { actions: {}, planTargets: ['my.test.js'], overwriteTargets: ['my.test.js'] };
  fs.rmSync(path.join(tmp, 'my.test.js'));
  r = await chode.runAgentTool({ tool: 'write', args: { file: 'my.test.js', content: 'declared' } }, declared);
  assert.ok(r.ok, 'declared fixture target must be writable, got ' + JSON.stringify(r));
  assert.ok(chode.planAllowsFixture('my.test.js', ['other.js', 'my.test.js']), 'last-match-wins allows declared');
  assert.ok(!chode.planAllowsFixture('my.test.js', ['other.js']), 'undeclared stays denied');

  // ── (c) No whole-file write to an existing file without create/overwrite ──
  fs.writeFileSync(path.join(tmp, 'real.txt'), 'keep me', 'utf8');
  r = await chode.runAgentTool({ tool: 'write', args: { file: 'real.txt', content: 'clobber' } }, ctx());
  assert.ok(!r.ok && /create\/overwrite/.test(r.error), 'existing-file write must demand declaration, got ' + JSON.stringify(r));
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'real.txt'), 'utf8'), 'keep me', 'existing file must be untouched');
  r = await chode.runAgentTool({ tool: 'edit', args: { file: 'real.txt', oldString: 'keep me', newString: 'edited' } }, ctx());
  assert.ok(r.ok, 'edit is the default for existing files, got ' + JSON.stringify(r));
  fs.writeFileSync(path.join(tmp, 'real.txt'), 'keep me', 'utf8');
  const ow = { actions: {}, planTargets: ['real.txt'], overwriteTargets: ['real.txt'] };
  r = await chode.runAgentTool({ tool: 'write', args: { file: 'real.txt', content: 'overwritten' } }, ow);
  assert.ok(r.ok, 'create/overwrite declaration must permit, got ' + JSON.stringify(r));
  // New files still write freely.
  r = await chode.runAgentTool({ tool: 'write', args: { file: 'brand-new.js', content: 'fresh' } }, ctx());
  assert.ok(r.ok, 'new-file write must succeed, got ' + JSON.stringify(r));

  // parsePlanSteps: numbered steps naming files + check, cap 6.
  const steps = chode.parsePlanSteps('1. Create app.js — check: node --check app.js\n2. create/overwrite real.txt — check: tests pass\n3. Update docs.md');
  assert.strictEqual(steps.length, 3, 'must parse 3 steps');
  assert.ok(steps[0].files.includes('app.js'), 'step must name files, got ' + JSON.stringify(steps[0]));
  assert.ok(steps[1].overwrites.includes('real.txt'), 'must parse create/overwrite, got ' + JSON.stringify(steps[1]));

  // ── (d) Snapshot-before-mutation stays automatic every mutating step ──
  const aiCall = async (prompt) => {
    if (String(prompt).includes('TOOL RESULTS')) return { result: 'DONE: written.', provider: 'mock', tokens: 1, latency: 1 };
    return { result: '```tool\n{"tool":"write","args":{"file":"snap-check.txt","content":"v1"}}\n```', provider: 'mock', tokens: 1, latency: 1 };
  };
  const before = new Set(chode.listSnapshots().map((s) => s.id));
  await chode.runAgentLoop('Write snap-check.', null, null, { quietFailures: true }, aiCall);
  const after = chode.listSnapshots().filter((s) => !before.has(s.id));
  assert.ok(after.length >= 1, 'mutating turn must snapshot, got ' + after.length);
  assert.ok(after.some((s) => /agent turn/.test(s.label)), 'snapshot labeled per mutating turn');

  chode.__resetBoundedForTest();
  console.log('✓ v2 guards: escape-first, fixture read-only, overwrite declarations, auto-snapshot');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-guards-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
