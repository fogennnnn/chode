'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Z6Plan, Z6PlanStep, Z6Constraint, Z6_STATUS, Z6_STATUS_LABELS, Z6 } = require('../plan-z6.js');

function test(name, fn) {
  try {
    fn();
    console.log('✓', name);
  } catch (e) {
    console.error('✗', name);
    console.error('  ', e.message);
    process.exitCode = 1;
  }
}

// Z6 arithmetic tests
test('Z6 add wraps correctly', () => {
  assert.strictEqual(Z6.add(2, 3), 5);
  assert.strictEqual(Z6.add(4, 4), 2);  // 8 % 6 = 2
  assert.strictEqual(Z6.add(5, 5), 4);  // 10 % 6 = 4
});

test('Z6 mul wraps correctly', () => {
  assert.strictEqual(Z6.mul(2, 3), 0);  // 6 % 6 = 0
  assert.strictEqual(Z6.mul(4, 4), 4);  // 16 % 6 = 4
});

test('Z6 wrap handles negatives', () => {
  assert.strictEqual(Z6.wrap(-1), 5);
  assert.strictEqual(Z6.wrap(-6), 0);
  assert.strictEqual(Z6.wrap(7), 1);
});

test('Z6 isValid validates range', () => {
  assert.strictEqual(Z6.isValid(0), true);
  assert.strictEqual(Z6.isValid(5), true);
  assert.strictEqual(Z6.isValid(6), false);
  assert.strictEqual(Z6.isValid(-1), false);
  assert.strictEqual(Z6.isValid('3'), false);
});

// Z6Constraint tests
test('Z6Constraint FILE_EXISTS check', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'z6-test-'));
  const testFile = path.join(tmpDir, 'exists.txt');
  fs.writeFileSync(testFile, 'test');
  
  const c = new Z6Constraint(Z6Constraint.Types.FILE_EXISTS, { path: 'exists.txt' });
  assert.strictEqual(c.check({ root: tmpDir }), true);
  assert.strictEqual(c.satisfied, true);
  
  const c2 = new Z6Constraint(Z6Constraint.Types.FILE_EXISTS, { path: 'missing.txt' });
  assert.strictEqual(c2.check({ root: tmpDir }), false);
  assert.strictEqual(c2.satisfied, false);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Z6Constraint FILE_NOT_EXISTS check', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'z6-test-'));
  
  const c = new Z6Constraint(Z6Constraint.Types.FILE_NOT_EXISTS, { path: 'missing.txt' });
  assert.strictEqual(c.check({ root: tmpDir }), true);
  assert.strictEqual(c.satisfied, true);
  
  fs.writeFileSync(path.join(tmpDir, 'exists.txt'), 'test');
  const c2 = new Z6Constraint(Z6Constraint.Types.FILE_NOT_EXISTS, { path: 'exists.txt' });
  assert.strictEqual(c2.check({ root: tmpDir }), false);
  assert.strictEqual(c2.satisfied, false);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Z6Constraint DEPENDENCY_DONE check', () => {
  const c = new Z6Constraint(Z6Constraint.Types.DEPENDENCY_DONE, { stepId: 1 });
  
  assert.strictEqual(c.check({ stepStatus: { 1: Z6_STATUS.PENDING } }), false);
  assert.strictEqual(c.check({ stepStatus: { 1: Z6_STATUS.IN_PROGRESS } }), false);
  assert.strictEqual(c.check({ stepStatus: { 1: Z6_STATUS.DONE } }), true);
});

test('Z6Constraint AND combines correctly', () => {
  const c1 = new Z6Constraint(Z6Constraint.Types.FILE_EXISTS, { path: 'a.txt' });
  const c2 = new Z6Constraint(Z6Constraint.Types.FILE_EXISTS, { path: 'b.txt' });
  c1.satisfied = true;
  c2.satisfied = true;
  assert.strictEqual(Z6Constraint.AND([c1, c2]), true);
  
  c2.satisfied = false;
  assert.strictEqual(Z6Constraint.AND([c1, c2]), false);
});

// Z6PlanStep tests
test('Z6PlanStep initial state', () => {
  const step = new Z6PlanStep(0, 'Test step');
  assert.strictEqual(step.status, Z6_STATUS.PENDING);
  assert.strictEqual(step.startedAt, null);
  assert.strictEqual(step.completedAt, null);
  assert.strictEqual(step.error, null);
});

test('Z6PlanStep state transitions', () => {
  const step = new Z6PlanStep(0, 'Test step');
  
  step.start();
  assert.strictEqual(step.status, Z6_STATUS.IN_PROGRESS);
  assert.ok(step.startedAt);
  
  step.complete();
  assert.strictEqual(step.status, Z6_STATUS.DONE);
  assert.ok(step.completedAt);
});

test('Z6PlanStep fail records error', () => {
  const step = new Z6PlanStep(0, 'Test step');
  step.start();
  step.fail('Something went wrong');
  assert.strictEqual(step.status, Z6_STATUS.FAILED);
  assert.strictEqual(step.error, 'Something went wrong');
  assert.ok(step.completedAt);
});

test('Z6PlanStep canExecute checks dependencies', () => {
  const plan = new Z6Plan([
    { id: 0, description: 'Step 0' },
    { id: 1, description: 'Step 1', dependsOn: [0] }
  ]);
  
  const step0 = plan.getStep(0);
  const step1 = plan.getStep(1);
  
  assert.strictEqual(step0.canExecute(plan), true);
  assert.strictEqual(step1.canExecute(plan), false);  // dep not done
  
  step0.start();
  step0.complete();
  
  assert.strictEqual(step1.canExecute(plan), true);
});

test('Z6PlanStep canExecute checks preconditions', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'z6-test-'));
  const step = new Z6PlanStep(0, 'Test', {
    pre: [new Z6Constraint(Z6Constraint.Types.FILE_EXISTS, { path: 'required.txt' })]
  });
  
  const plan = new Z6Plan([step]);
  assert.strictEqual(step.canExecute(plan), false);  // file doesn't exist
  
  fs.writeFileSync(path.join(tmpDir, 'required.txt'), 'test');
  // Update constraint context
  step.preConditions[0].check({ root: tmpDir });
  assert.strictEqual(step.canExecute(plan), true);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Z6Plan tests
test('Z6Plan creation and serialization', () => {
  const plan = new Z6Plan([
    { id: 0, description: 'Step 0' },
    { id: 1, description: 'Step 1' }
  ], { prompt: 'Test prompt' });
  
  assert.strictEqual(plan.steps.length, 2);
  assert.strictEqual(plan.status, Z6_STATUS.PENDING);
  assert.ok(plan.id);
  assert.ok(plan.hash);
  assert.ok(plan.selfHash);
  
  const serialized = plan.serialize();
  assert.strictEqual(serialized.steps.length, 2);
  assert.strictEqual(serialized.originalPrompt, 'Test prompt');
  assert.ok(serialized.hash);
  assert.ok(serialized.selfHash);
});

test('Z6Plan integrity verification', () => {
  const plan = new Z6Plan([{ id: 0, description: 'Step 0' }]);
  
  const integrity = plan.verifyIntegrity();
  assert.strictEqual(integrity.hashValid, true);
  assert.strictEqual(integrity.selfHashValid, true);
  
  // Tamper with data
  plan.steps[0].description = 'Tampered';
  const integrity2 = plan.verifyIntegrity();
  assert.strictEqual(integrity2.hashValid, false);
  assert.strictEqual(integrity2.selfHashValid, false);
});

test('Z6Plan getNextExecutable returns first executable step', () => {
  const plan = new Z6Plan([
    { id: 0, description: 'Step 0' },
    { id: 1, description: 'Step 1', dependsOn: [0] }
  ]);
  
  const next = plan.getNextExecutable();
  assert.strictEqual(next.id, 0);
  
  plan.startStep(0);
  plan.completeStep(0);
  
  const next2 = plan.getNextExecutable();
  assert.strictEqual(next2.id, 1);
});

test('Z6Plan state transitions', () => {
  const plan = new Z6Plan([
    { id: 0, description: 'Step 0' },
    { id: 1, description: 'Step 1' }
  ]);
  
  assert.strictEqual(plan.status, Z6_STATUS.PENDING);
  
  plan.startStep(0);
  assert.strictEqual(plan.status, Z6_STATUS.IN_PROGRESS);
  assert.strictEqual(plan.currentStep, 0);
  
  plan.completeStep(0);
  assert.strictEqual(plan.getStep(0).status, Z6_STATUS.DONE);
  
  plan.startStep(1);
  plan.completeStep(1);
  
  assert.strictEqual(plan.status, Z6_STATUS.DONE);
  assert.strictEqual(plan.isComplete(), true);
});

test('Z6Plan getProgress returns accurate counts', () => {
  const plan = new Z6Plan([
    { id: 0, description: 'Step 0' },
    { id: 1, description: 'Step 1' },
    { id: 2, description: 'Step 2' },
    { id: 3, description: 'Step 3' }
  ]);
  
  let progress = plan.getProgress();
  assert.strictEqual(progress.total, 4);
  assert.strictEqual(progress.done, 0);
  assert.strictEqual(progress.percentComplete, 0);
  
  plan.startStep(0);
  plan.completeStep(0);
  plan.startStep(1);
  plan.completeStep(1);
  
  progress = plan.getProgress();
  assert.strictEqual(progress.done, 2);
  assert.strictEqual(progress.percentComplete, 50);
  
  plan.failStep(2, 'Failed');
  plan.skipStep(3);
  
  progress = plan.getProgress();
  assert.strictEqual(progress.failed, 1);
  assert.strictEqual(progress.isComplete, true);
  assert.strictEqual(plan.status, Z6_STATUS.FAILED);
});

test('Z6Plan toVisual produces formatted output', () => {
  const plan = new Z6Plan([
    { id: 0, description: 'First step' },
    { id: 1, description: 'Second step', dependsOn: [0] }
  ]);
  
  const visual = plan.toVisual();
  assert.ok(visual.includes('Plan:'));
  assert.ok(visual.includes('Progress:'));
  assert.ok(visual.includes('Step 0'));
  assert.ok(visual.includes('Step 1'));
});

test('Z6Plan fromSerialized reconstructs plan', () => {
  const original = new Z6Plan([
    { id: 0, description: 'Step 0' },
    { id: 1, description: 'Step 1', dependsOn: [0] }
  ], { prompt: 'Test' });
  
  original.startStep(0);
  original.completeStep(0);
  
  const serialized = original.serialize();
  const reconstructed = Z6Plan.fromSerialized(serialized);
  
  assert.strictEqual(reconstructed.id, original.id);
  assert.strictEqual(reconstructed.steps.length, 2);
  assert.strictEqual(reconstructed.getStep(0).status, Z6_STATUS.DONE);
  assert.strictEqual(reconstructed.getStep(1).status, Z6_STATUS.PENDING);
});

test('Z6Plan handles step failures correctly', () => {
  const plan = new Z6Plan([
    { id: 0, description: 'Step 0' },
    { id: 1, description: 'Step 1', dependsOn: [0] }
  ]);
  
  plan.failStep(0, 'Critical error');
  
  assert.strictEqual(plan.getStep(0).status, Z6_STATUS.FAILED);
  assert.strictEqual(plan.getStep(1).status, Z6_STATUS.PENDING);
  assert.strictEqual(plan.isComplete(), false);  // Step 1 still pending
  
  // Step 1 should not be executable (dep failed)
  const next = plan.getNextExecutable();
  assert.strictEqual(next, null);
});

console.log('\nZ6Plan tests complete');
