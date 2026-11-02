'use strict';

// Z6P handoff persistence: the save -> resume loop used by chode.js.
// Previously saveHandoffToMemory called localMemory.storeMessage (which never
// existed), so every handoff save silently failed and no resume was possible.
// Runs in-process with a temp cwd so .chode/memory stays out of the repo.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function fixture() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-handoff-test-'));
  const originalCwd = process.cwd();
  try {
    process.chdir(tempDir);
    const z6 = require('../z6-integration');
    const { Z6_STATUS } = require('../plan-z6');
    const sessionId = 'handoff-session-' + Date.now();

    // 1: serialize -> save -> load roundtrip
    const plan = z6.legacyToZ6Plan([
      { index: 0, text: 'make a', files: ['a.js'] },
      { index: 1, text: 'test it', files: ['b.js'] }
    ], sessionId);
    assert.strictEqual(plan.steps.length, 2);
    plan.startStep(0);
    plan.completeStep(0);
    const handoff = z6.serializeHandoff(plan, { provider: 'kilo' });
    assert.ok(handoff.handoffId, 'serializeHandoff must return handoffId');
    assert.strictEqual(await z6.saveHandoffToMemory(sessionId, handoff), true);

    const loaded = await z6.loadHandoffFromMemory(sessionId, handoff.handoffId);
    assert.ok(loaded, 'handoff must load back from memory');
    const resumed = z6.deserializeHandoff(loaded, sessionId);
    assert.strictEqual(resumed.valid, true, 'resumed handoff must verify');
    assert.strictEqual(resumed.plan.steps[0].status, Z6_STATUS.DONE);
    assert.strictEqual(resumed.plan.steps[1].status, Z6_STATUS.PENDING);
    console.log('✓ save/load roundtrip preserves plan state');

    // 2: plan id is session-scoped so resume maps onto the right session
    assert.strictEqual(String(resumed.plan.id), sessionId);
    console.log('✓ plan id is session-keyed');

    // 3: tampering with the stored handoff is rejected (null return)
    const metaPath = path.join(tempDir, '.chode', 'memory', 'sessions', sessionId, 'meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    meta.handoff.state.plan.steps[0].status = Z6_STATUS.FAILED; // hash now stale
    fs.writeFileSync(metaPath, JSON.stringify(meta));
    const tampered = await z6.loadHandoffFromMemory(sessionId, handoff.handoffId);
    assert.strictEqual(tampered, null, 'tampered handoff must fail closed');
    console.log('✓ tampered handoff rejected');

    // 4: chode-shaped updatePlanFromActions (single call) marks in-progress
    const livePlan = z6.legacyToZ6Plan([{ index: 0, text: 'edit', files: ['x.js'] }], sessionId);
    z6.updatePlanFromActions(livePlan, { tool: 'edit', args: { file: 'x.js' } }, { ok: true, file: 'x.js' });
    assert.strictEqual(livePlan.steps[0].status, 1);
    console.log('✓ chode call-shape marks step in-progress');

    // 5: edit records are no longer silently dropped
    const editPlan = z6.legacyToZ6Plan([{ index: 0, text: 'edit', files: ['y.js'] }], sessionId);
    z6.updatePlanFromActions(editPlan, { edits: [{ file: 'y.js' }] });
    assert.strictEqual(editPlan.steps[0].status, 1);
    console.log('✓ edit records tracked');
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  fixture().catch(e => {
    console.error('z6 handoff persistence test failed: ' + e.message);
    process.exitCode = 1;
  });
}
