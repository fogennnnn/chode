'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { LocalMemoryManager, Z6_STATE, COMPRESSION_THRESHOLD } = require('../local-memory.js');

async function fixture() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-memory-test-'));
  const originalCwd = process.cwd();
  
  try {
    process.chdir(tempDir);
    
    // Test 1: Create session
    const memory = new LocalMemoryManager();
    const session1 = memory.getOrCreateSession('test-session-1', { test: true });
    assert.strictEqual(session1.id, 'test-session-1');
    assert.strictEqual(session1.stateVector.length, 6);
    console.log('✓ Session creation works');
    
    // Test 2: Add messages
    memory.addMessage('test-session-1', 'user', 'Hello');
    memory.addMessage('test-session-1', 'assistant', 'Hi there');
    const session2 = memory.getOrCreateSession('test-session-1');
    assert.strictEqual(session2.messages.length, 2);
    assert.ok(session2.messages[0].hash);
    assert.ok(session2.messages[0].selfHash);
    console.log('✓ Message storage with hash integrity works');
    
    // Test 3: Handoff state
    const handoff = {
      step: 2,
      status: 'in-progress',
      lastProvider: 'kilo',
      nextStep: 'verify'
    };
    memory.setHandoff('test-session-1', handoff);
    const retrieved = memory.getHandoff('test-session-1');
    assert.strictEqual(retrieved.step, 2);
    assert.strictEqual(retrieved.lastProvider, 'kilo');
    assert.ok(retrieved.hash);
    assert.ok(retrieved.selfHash);
    console.log('✓ Handoff state storage works');
    
    // Test 4: State vector updates
    memory.updateStateVector('test-session-1', { STEP: 3, STATUS: 1, CAPACITY: 4 });
    const state = memory.getStateVector('test-session-1');
    assert.strictEqual(state[Z6_STATE.STEP], 3);
    assert.strictEqual(state[Z6_STATE.STATUS], 1);
    assert.strictEqual(state[Z6_STATE.CAPACITY], 4);
    console.log('✓ Z6 state vector updates work');
    
    // Test 5: Plan storage
    const plan = {
      steps: [
        { id: 0, description: 'Step 1', status: 3 },
        { id: 1, description: 'Step 2', status: 0 }
      ],
      hash: 'test-hash'
    };
    memory.setPlan('test-session-1', plan);
    const retrievedPlan = memory.getPlan('test-session-1');
    assert.strictEqual(retrievedPlan.steps.length, 2);
    console.log('✓ Plan storage works');
    
    // Test 6: List sessions
    memory.getOrCreateSession('test-session-2');
    const sessions = memory.listSessions();
    assert.strictEqual(sessions.length, 2);
    console.log('✓ Session listing works');
    
    // Test 7: Session summary
    const summary = memory.getSessionSummary('test-session-1');
    assert.strictEqual(summary.messageCount, 2);
    assert.ok(summary.hash);
    assert.ok(summary.selfHash);
    console.log('✓ Session summary works');
    
    // Test 8: Compression
    const memory2 = new LocalMemoryManager();
    const extraMessages = 10;
    for (let i = 0; i < COMPRESSION_THRESHOLD * 2 + extraMessages; i++) {
      memory2.addMessage('compress-test', 'user', `Message ${i}`);
    }
    const compressed = memory2.getOrCreateSession('compress-test');
    // After compression: 1 summary + COMPRESSION_THRESHOLD messages, then extraMessages added
    // So total should be: 1 + 20 + 10 = 31, which is < 45 (original)
    assert.ok(compressed.messages.length < COMPRESSION_THRESHOLD * 2 + extraMessages);
    assert.ok(compressed.messages.some(m => m.content && m.content.includes('SUMMARY')));
    console.log('✓ Session compression works');
    
    // Test 9: Export
    const exported = memory.exportSession('test-session-1');
    assert.ok(exported.id);
    assert.ok(exported.messages);
    assert.ok(exported.hash);
    console.log('✓ Session export works');
    
    // Test 10: Verify integrity
    const verification = memory.verifySession('test-session-1');
    assert.strictEqual(verification.valid, true);
    assert.ok(verification.hash);
    console.log('✓ Session integrity verification works');
    
    // Test 11: Delete session
    memory.deleteSession('test-session-2');
    memory.deleteSession('compress-test');
    const afterDelete = memory.listSessions();
    assert.strictEqual(afterDelete.length, 1);
    console.log('✓ Session deletion works');
    
    // Test 12: Z6 modulo wrapping
    memory.updateStateVector('test-session-1', { STEP: 10, STATUS: -1 });
    const wrapped = memory.getStateVector('test-session-1');
    assert.strictEqual(wrapped[Z6_STATE.STEP], 10 % 6); // Should wrap to 4
    assert.strictEqual(wrapped[Z6_STATE.STATUS], 5); // -1 % 6 = 5 in JS, but we want 5
    console.log('✓ Z6 state wrapping works');
    
    // Test 13: Tamper detection (hash is now stale after the flip)
    const metaPath = path.join(tempDir, '.chode', 'memory', 'sessions', 'test-session-1', 'meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    meta.handoff.step = 99;
    fs.writeFileSync(metaPath, JSON.stringify(meta));
    
    const tampered = memory.verifySession('test-session-1');
    assert.strictEqual(tampered.valid, false, 'tampered session must be invalid');
    assert.strictEqual(tampered.reason, 'hash_mismatch');
    let threw = null;
    try { memory.getOrCreateSession('test-session-1'); } catch (e) { threw = e; }
    assert.ok(threw, 'getOrCreateSession must throw on tampered session');
    assert.ok(/hash mismatch/.test(threw.message), 'expected hash mismatch, got: ' + threw.message);
    
    console.log('✓ Tamper detection works');
    
    console.log('\n✓ All local-memory tests passed');
    
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[2] === '--fixture') {
  fixture().catch(error => { console.error(error); process.exitCode = 1; });
} else {
  const { spawnSync } = require('child_process');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-memory-test-runner-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], {
      cwd: temp,
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true
    });
    if (child.error) throw new Error(child.error.message);
    if (child.status !== 0) {
      console.error(child.stderr);
      process.exitCode = 1;
    } else {
      console.log(child.stdout);
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
