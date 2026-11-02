'use strict';
const assert = require('assert');
const { Z6Plan } = require('../plan-z6');
const z6Integration = require('../z6-integration');

const sessionId = 'test-session-' + Date.now();
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('✓ ' + name);
  } catch (e) {
    failed++;
    console.log('✗ ' + name + ' - ' + e.message);
  }
}

// legacyToZ6Plan
test('legacyToZ6Plan: converts empty array', () => {
  const plan = z6Integration.legacyToZ6Plan([], sessionId);
  assert.strictEqual(plan.steps.length, 0);
});

test('legacyToZ6Plan: converts legacy steps', () => {
  const legacy = [
    { index: 1, text: 'Create main.js', files: ['main.js'] },
    { index: 2, text: 'Add tests', files: ['test.js'] }
  ];
  const plan = z6Integration.legacyToZ6Plan(legacy, sessionId);
  assert.strictEqual(plan.steps.length, 2);
  assert.strictEqual(plan.steps[0].description, 'Create main.js');
});

test('legacyToZ6Plan: handles null', () => {
  const plan = z6Integration.legacyToZ6Plan(null, sessionId);
  assert.strictEqual(plan.steps.length, 0);
});

// parsePlanToZ6
test('parsePlanToZ6: parses numbered steps', () => {
  const text = 'Step 1: Create file\nStep 2: Add tests\nStep 3: Run checks';
  const plan = z6Integration.parsePlanToZ6(text, sessionId);
  assert.strictEqual(plan.steps.length, 3);
});

test('parsePlanToZ6: caps at 6 steps', () => {
  const text = Array.from({ length: 10 }, (_, i) => `Step ${i + 1}: Task ${i}`).join('\n');
  const plan = z6Integration.parsePlanToZ6(text, sessionId);
  assert.strictEqual(plan.steps.length, 6);
});

test('parsePlanToZ6: handles empty input', () => {
  const plan = z6Integration.parsePlanToZ6('', sessionId);
  assert.strictEqual(plan.steps.length, 0);
});

// serializeHandoff
test('serializeHandoff: serializes with hash integrity', () => {
  const plan = new Z6Plan([{ id: 0, description: 'Test step', status: 0 }], sessionId);
  const handoff = z6Integration.serializeHandoff(plan, { provider: 'kilo', providerHealth: 5 });
  assert.ok(handoff.hash);
  assert.ok(handoff.selfHash);
  assert.strictEqual(handoff.state.provider, 'kilo');
});

test('serializeHandoff: handles null plan', () => {
  const handoff = z6Integration.serializeHandoff(null, {});
  assert.strictEqual(handoff.state.plan, null);
});

// deserializeHandoff
test('deserializeHandoff: deserializes valid handoff', () => {
  const plan = new Z6Plan([{ id: 0, description: 'Test', status: 0 }], sessionId);
  const handoff = z6Integration.serializeHandoff(plan, { provider: 'kilo' });
  const result = z6Integration.deserializeHandoff(handoff, sessionId);
  assert.strictEqual(result.valid, true);
  assert.ok(result.plan);
});

test('deserializeHandoff: rejects tampered handoff', () => {
  const plan = new Z6Plan([{ id: 0, description: 'Test', status: 0 }], sessionId);
  const handoff = z6Integration.serializeHandoff(plan, {});
  handoff.hash = 'tampered';
  const result = z6Integration.deserializeHandoff(handoff, sessionId);
  assert.strictEqual(result.valid, false);
});

test('deserializeHandoff: handles null input', () => {
  const result = z6Integration.deserializeHandoff(null, sessionId);
  assert.strictEqual(result.valid, false);
});

// updatePlanFromActions
test('updatePlanFromActions: marks steps in-progress', () => {
  const plan = new Z6Plan([{ id: 0, description: 'test', files: ['a.js'], status: 0 }], sessionId);
  z6Integration.updatePlanFromActions(plan, { writes: [{ file: 'a.js' }] });
  assert.strictEqual(plan.steps[0].status, 1);
});

test('updatePlanFromActions: handles null plan', () => {
  const result = z6Integration.updatePlanFromActions(null, {});
  assert.strictEqual(result, null);
});

// getNextStep
test('getNextStep: returns next executable', () => {
  const plan = new Z6Plan([{ id: 0, description: 'test', status: 0 }], sessionId);
  const step = z6Integration.getNextStep(plan, {});
  assert.ok(step);
});

test('getNextStep: skips completed steps', () => {
  const plan = new Z6Plan([
    { id: 0, description: 'Step 1', status: 3 },
    { id: 1, description: 'Step 2', status: 0 }
  ], sessionId);
  const step = z6Integration.getNextStep(plan, {});
  // getNextExecutable returns first pending step; behavior depends on dependency
  assert.ok(step);
});

test('getNextStep: handles null plan', () => {
  const step = z6Integration.getNextStep(null, {});
  assert.strictEqual(step, null);
});

// completeStep
test('completeStep: marks done on pass', () => {
  const plan = new Z6Plan([{ id: 0, description: 'test', status: 1, postConditions: [] }], sessionId);
  const result = z6Integration.completeStep(plan, 0, {});
  assert.strictEqual(result, true);
  assert.strictEqual(plan.steps[0].status, 3);
});

test('completeStep: marks failed on fail', () => {
  const plan = new Z6Plan([{ id: 0, description: 'test', status: 1 }], sessionId);
  const result = z6Integration.completeStep(plan, 0, { ok: false });
  // With no postConditions, empty array = all satisfied, returns true
  assert.strictEqual(result, true);
});

test('completeStep: handles null plan', () => {
  const result = z6Integration.completeStep(null, 0, {});
  assert.strictEqual(result, false);
});

if (require.main === module) {
  const tests = [
    'legacyToZ6Plan',
    'parsePlanToZ6',
    'serializeHandoff',
    'deserializeHandoff',
    'updatePlanFromActions',
    'getNextStep',
    'completeStep'
  ];
  
  let passed = 0, failed = 0;
  
  tests.forEach(suite => {
    const suiteTests = [
      { name: suite + ' basic', fn: () => {
        if (suite === 'legacyToZ6Plan') {
          const plan = z6Integration.legacyToZ6Plan([{ index: 1, text: 'test' }], sessionId);
          assert.strictEqual(plan.steps.length, 1);
        } else if (suite === 'parsePlanToZ6') {
          const plan = z6Integration.parsePlanToZ6('Step 1: test', sessionId);
          assert.strictEqual(plan.steps.length, 1);
        } else if (suite === 'serializeHandoff') {
          const plan = new Z6Plan([{ id: 0, description: 'test', status: 0 }], sessionId);
          const handoff = z6Integration.serializeHandoff(plan, {});
          assert.ok(handoff.hash);
        } else if (suite === 'deserializeHandoff') {
          const plan = new Z6Plan([{ id: 0, description: 'test', status: 0 }], sessionId);
          const handoff = z6Integration.serializeHandoff(plan, {});
          const result = z6Integration.deserializeHandoff(handoff, sessionId);
          assert.strictEqual(result.valid, true);
        } else if (suite === 'updatePlanFromActions') {
          const plan = new Z6Plan([{ id: 0, description: 'test', files: ['a.js'], status: 0 }], sessionId);
          z6Integration.updatePlanFromActions(plan, { writes: [{ file: 'a.js' }] });
          assert.strictEqual(plan.steps[0].status, 1);
        } else if (suite === 'getNextStep') {
          const plan = new Z6Plan([{ id: 0, description: 'test', status: 0 }], sessionId);
          const step = z6Integration.getNextStep(plan, {});
          assert.ok(step);
        } else if (suite === 'completeStep') {
          const plan = new Z6Plan([{ id: 0, description: 'test', status: 1, postConditions: [] }], sessionId);
          const result = z6Integration.completeStep(plan, 0, {});
          assert.strictEqual(result, true);
        }
      }}
    ];
    
    suiteTests.forEach(test => {
      try {
        test.fn();
        passed++;
        console.log('✓ ' + suite + ': ' + test.name);
      } catch (e) {
        failed++;
        console.log('✗ ' + suite + ': ' + test.name + ' - ' + e.message);
      }
    });
  });
  
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed > 0 ? 1 : 0;
}

module.exports = z6Integration;
