'use strict';
// Test for dual-consensus.js — verifies the dual-perspective consensus pattern
// works at both micro (per-call) and macro (full generation) levels.

var assert = require('assert');
var dual = require('../dual-consensus.js');

// ── Mock aiCall that returns results based on prompt content ──
function makeMockAiCall(scenarios) {
  return async function mockAiCall(prompt, sessionId, force, opts) {
    var p = String(prompt || '');
    for (var i = 0; i < scenarios.length; i++) {
      var s = scenarios[i];
      if (p.indexOf(s.match || '') !== -1) {
        return { result: s.result, provider: 'mock', tokens: 10, latency: 50 };
      }
    }
    return { result: 'Default response for: ' + p.slice(0, 50), provider: 'mock', tokens: 10, latency: 50 };
  };
}

// ── Test 1: Both perspectives PASS → output accepted ──
async function testBothPass() {
  var aiCall = makeMockAiCall([
    { match: '[VERIFY', result: 'PASS', provider: 'mock' },
    { match: 'prompt-faithfulness reviewer', result: 'PASS', provider: 'mock' },
    { match: 'code-correctness reviewer', result: 'PASS', provider: 'mock' }
  ]);
  var wrapped = dual.wrapAiCall(aiCall, 's1', null, {}, 'Write a hello world function');
  var res = await wrapped('Write a hello world function', 's1', null, {});
  assert.ok(res._dualConsensus && res._dualConsensus.agreed, 'Test 1: dual consensus should agree');
  assert.ok(res._dualConsensus.attempts >= 1, 'Test 1: should have attempt count');
  console.log('✓ Test 1: Both perspectives PASS → output accepted (attempts:', res._dualConsensus.attempts, ')');
}

// ── Test 2: Perspective FAILS → retry until agree ──
async function testRetryOnDisagreement() {
  var state = { generationCount: 0, faithCount: 0, codeCount: 0 };
  var aiCall = async function mockAiCall(prompt, sessionId, force, opts) {
    var p = String(prompt || '');
    if (p.indexOf('prompt-faithfulness reviewer') !== -1) {
      state.faithCount++;
      return { result: 'PASS', provider: 'mock', tokens: 5, latency: 30 };
    }
    if (p.indexOf('code-correctness reviewer') !== -1) {
      state.codeCount++;
      // First code review fails, subsequent ones pass
      if (state.codeCount === 1) return { result: 'FAIL: syntax error', provider: 'mock', tokens: 5, latency: 30 };
      return { result: 'PASS', provider: 'mock', tokens: 5, latency: 30 };
    }
    // Generation calls
    state.generationCount++;
    if (state.generationCount === 1) return { result: 'const x = 1;;; broken syntax', provider: 'mock', tokens: 10, latency: 50 };
    return { result: 'const x = 1;', provider: 'mock', tokens: 10, latency: 50 };
  };
  var wrapped = dual.wrapAiCall(aiCall, 's2', null, {}, 'Write a variable');
  var res = await wrapped('Write a variable', 's2', null, {});
  assert.ok(res._dualConsensus && res._dualConsensus.agreed, 'Test 2: should eventually agree after retry');
  assert.ok(state.generationCount >= 2, 'Test 2: should have generated at least twice (initial + retry)');
  assert.ok(state.codeCount >= 2, 'Test 2: should have run code review at least twice');
  console.log('✓ Test 2: Disagreement → retry → agreement (generations:', state.generationCount, 'code reviews:', state.codeCount, ')');
}

// ── Test 3: Exhausted retries → returns last result flagged ──
async function testExhaustedRetries() {
  var aiCall = async function mockAiCall(prompt, sessionId, force, opts) {
    var p = String(prompt || '');
    if (p.indexOf('prompt-faithfulness reviewer') !== -1) return { result: 'FAIL: missing requirement', provider: 'mock', tokens: 5, latency: 30 };
    if (p.indexOf('code-correctness reviewer') !== -1) return { result: 'FAIL: syntax error', provider: 'mock', tokens: 5, latency: 30 };
    return { result: 'always broken code;;;', provider: 'mock', tokens: 10, latency: 50 };
  };
  var wrapped = dual.wrapAiCall(aiCall, 's3', null, {}, 'Write broken code');
  var res = await wrapped('Write broken code', 's3', null, {});
  assert.ok(res._dualConsensus && res._dualConsensus.agreed === false, 'Test 3: should be flagged as not agreed');
  assert.ok(res._dualConsensus.attempts > dual.MAX_DUAL_RETRIES, 'Test 3: should have exhausted retries');
  console.log('✓ Test 3: Exhausted retries → flagged as not agreed (attempts:', res._dualConsensus.attempts, ')');
}

// ── Test 4: dualConsensus function directly ──
async function testDualConsensusDirect() {
  var aiCall = async function mockAiCall(prompt, sessionId, force, opts) {
    var p = String(prompt || '');
    if (p.indexOf('prompt-faithfulness reviewer') !== -1) return { result: 'PASS', provider: 'mock', tokens: 5, latency: 30 };
    if (p.indexOf('code-correctness reviewer') !== -1) return { result: 'PASS', provider: 'mock', tokens: 5, latency: 30 };
    return { result: 'review default', provider: 'mock', tokens: 5, latency: 30 };
  };
  var consensus = await dual.dualConsensus(aiCall, 's4', null, {}, 'original prompt', 'console.log("hello");');
  assert.ok(consensus.agreed, 'Test 4: direct dualConsensus should agree');
  assert.ok(consensus.faithOk && consensus.codeOk, 'Test 4: both perspectives should be OK');
  console.log('✓ Test 4: direct dualConsensus() works correctly');
}

// ── Test 5: MAX_DUAL_RETRIES is configurable ──
async function testConfigurableRetries() {
  assert.ok(Number.isInteger(dual.MAX_DUAL_RETRIES) && dual.MAX_DUAL_RETRIES >= 0, 'Test 5: MAX_DUAL_RETRIES should be a non-negative integer');
  console.log('✓ Test 5: MAX_DUAL_RETRIES =', dual.MAX_DUAL_RETRIES, '(configurable via CHODE_DUAL_MAX_RETRIES env)');
}

// ── Run all tests ──
async function main() {
  await testBothPass();
  await testRetryOnDisagreement();
  await testExhaustedRetries();
  await testDualConsensusDirect();
  await testConfigurableRetries();
  console.log('\nAll dual-consensus tests passed.');
}

main().catch(function (e) {
  console.error('TEST FAILED:', e);
  process.exit(1);
});
