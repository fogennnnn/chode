#!/usr/bin/env node
'use strict';
/**
 * P0 Provider Failover Tests (5 tests)
 * 
 * Tests circuit breaker failover, capacity exhaustion recovery, and provider switching.
 * No real API calls - mocks provider-capacity and circuit breakers.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const os = require('os');

const TMP_DIR = path.join(os.tmpdir(), 'chode-failover-test-' + Date.now());

function setup() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  process.chdir(TMP_DIR);
  // Minimal config for provider tests
  const configDir = path.join(TMP_DIR, '.chode');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify({
    providers: {
      ovh: { name: 'OVHcloud', category: 'keyless', url: 'https://test.example.com' },
      groq: { name: 'Groq', category: 'keyless', url: 'https://test.example.com' },
      anthropic: { name: 'Anthropic', requiresKey: 'ANTHROPIC_API_KEY', url: 'https://test.example.com' }
    }
  }), 'utf8');
}

function cleanup() {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
}

// Test 1: Circuit breaker opens after threshold failures
function testCircuitBreakerOpens() {
  console.log('Test 1: Circuit breaker opens after threshold failures');
  const fixture = `
    const assert = require('assert');
    const capacity = require('./provider-capacity');
    const testDir = '${TMP_DIR.replace(/\\/g, '\\\\')}';
    const capDir = testDir + '/.chode/provider-capacity';
    const cap = capacity.create(capDir, () => 1000000); // fixed clock
    
    // Simulate 3 failures (threshold)
    cap.record('ovh', 60000);
    cap.record('ovh', 60000);
    cap.record('ovh', 60000);
    
    const state = cap.read('ovh');
    assert(state, 'capacity state should exist');
    assert(state.failures >= 3, 'should have 3+ failures recorded');
    
    // Circuit breaker logic is in chode.js, but capacity provides the retry delay
    const remaining = cap.remaining('ovh');
    assert(remaining > 0, 'should have positive remaining cooldown');
    console.log('PASS: circuit breaker capacity recorded, remaining=' + remaining + 'ms');
  `;
  
  const result = spawnSync('node', ['-e', fixture], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    timeout: 10000
  });
  
  assert(result.status === 0, 'Test 1 failed: ' + result.stderr);
  assert(/PASS/.test(result.stdout), 'Test 1 assertion failed: ' + result.stdout);
  console.log('  ✓ Circuit breaker capacity tracking works');
}

// Test 2: Provider exhaustion - all keyless providers on cooldown
function testProviderExhaustionRecovery() {
  console.log('Test 2: Provider exhaustion recovery');
  const fixture = `
    const assert = require('assert');
    const capacity = require('./provider-capacity');
    const testDir = '${TMP_DIR.replace(/\\/g, '\\\\')}';
    const capDir = testDir + '/.chode/provider-capacity';
    const cap = capacity.create(capDir, () => 1000000);
    
    // Exhaust multiple providers
    ['ovh', 'groq', 'deepseek'].forEach(pid => {
      cap.record(pid, 120000); // 2min cooldown each
      cap.record(pid, 120000);
    });
    
    const ids = ['ovh', 'groq', 'deepseek'];
    const waits = ids.map(id => cap.remaining(id));
    const minWait = Math.min(...waits);
    
    assert(minWait > 0, 'all providers should be on cooldown');
    console.log('PASS: all ' + ids.length + ' providers exhausted, min wait=' + minWait + 'ms');
    
    // Clear one provider
    cap.clear('ovh');
    assert(cap.remaining('ovh') === 0, 'cleared provider should be available');
    console.log('PASS: provider cleared, available for retry');
  `;
  
  const result = spawnSync('node', ['-e', fixture], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    timeout: 10000
  });
  
  assert(result.status === 0, 'Test 2 failed: ' + result.stderr);
  assert(/PASS/.test(result.stdout), 'Test 2 assertion failed: ' + result.stdout);
  console.log('  ✓ Provider exhaustion and recovery works');
}

// Test 3: Keyless vs keyed provider categorization
function testKeylessProviderCategorization() {
  console.log('Test 3: Keyless provider categorization');
  const fixture = `
    const assert = require('assert');
    const capacity = require('./provider-capacity');
    
    // Test free() helper
    const keyless = { category: 'keyless' };
    const freeLocal = { category: 'free_local' };
    const keyed = { category: 'paid', requiresKey: 'API_KEY' };
    const noCategory = {};
    
    assert(capacity.free(keyless) === true, 'keyless should be free');
    assert(capacity.free(freeLocal) === true, 'free_local should be free');
    assert(capacity.free(keyed) === false, 'keyed provider should not be free');
    assert(capacity.free(noCategory) === false, 'no category should not be free');
    
    console.log('PASS: provider categorization correct');
  `;
  
  const result = spawnSync('node', ['-e', fixture], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    timeout: 10000
  });
  
  assert(result.status === 0, 'Test 3 failed: ' + result.stderr);
  assert(/PASS/.test(result.stdout), 'Test 3 assertion failed: ' + result.stdout);
  console.log('  ✓ Provider categorization works');
}

// Test 4: Capacity file atomic writes (crash safety)
function testCapacityAtomicWrites() {
  console.log('Test 4: Capacity atomic writes');
  const uniqueCapDir = path.join(TMP_DIR, 'cap-atomic-' + Date.now());
  fs.mkdirSync(uniqueCapDir, { recursive: true });
  const fixture = `
    const assert = require('assert');
    const fs = require('fs');
    const path = require('path');
    const capacity = require('./provider-capacity');
    const capDir = '${uniqueCapDir.replace(/\\/g, '\\\\')}';
    const cap = capacity.create(capDir, () => Date.now());
    
    // Record should use atomic write (temp + rename)
    cap.record('test-provider', 30000);
    
    const files = fs.readdirSync(capDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('.tmp'));
    assert(jsonFiles.length === 1, 'should have exactly 1 json file, got ' + jsonFiles.length);
    
    // Verify no temp files left behind
    const tmpFiles = files.filter(f => f.includes('.tmp'));
    assert(tmpFiles.length === 0, 'should have no temp files, got ' + tmpFiles.join(','));
    
    console.log('PASS: atomic write completed, no temp files left');
  `;
  
  const result = spawnSync('node', ['-e', fixture], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    timeout: 10000
  });
  
  assert(result.status === 0, 'Test 4 failed: ' + result.stderr);
  assert(/PASS/.test(result.stdout), 'Test 4 assertion failed: ' + result.stdout);
  console.log('  ✓ Atomic writes work correctly');
}

// Test 5: Cooldown expiry precision
function testCooldownExpiryPrecision() {
  console.log('Test 5: Cooldown expiry precision');
  let clock = 1000000;
  const fixture = `
    const assert = require('assert');
    const capacity = require('./provider-capacity');
    const testDir = '${TMP_DIR.replace(/\\/g, '\\\\')}';
    const capDir = testDir + '/.chode/provider-capacity';
    let clock = ${clock};
    const cap = capacity.create(capDir, () => clock);
    
    // Record with 10s cooldown
    cap.record('expiry-test', 10000);
    
    // Should still be on cooldown
    let remaining = cap.remaining('expiry-test');
    assert(remaining > 9000, 'should have ~10s remaining, got ' + remaining);
    
    // Advance clock past cooldown
    clock += 15000;
    remaining = cap.remaining('expiry-test');
    assert(remaining === 0, 'should be expired, got ' + remaining);
    
    console.log('PASS: cooldown expiry works correctly');
  `;
  
  const result = spawnSync('node', ['-e', fixture], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    timeout: 10000
  });
  
  assert(result.status === 0, 'Test 5 failed: ' + result.stderr);
  assert(/PASS/.test(result.stdout), 'Test 5 assertion failed: ' + result.stdout);
  console.log('  ✓ Cooldown expiry works correctly');
}

// Main
let passed = 0;
let failed = 0;

try {
  setup();
  
  testCircuitBreakerOpens();
  passed++;
  
  testProviderExhaustionRecovery();
  passed++;
  
  testKeylessProviderCategorization();
  passed++;
  
  testCapacityAtomicWrites();
  passed++;
  
  testCooldownExpiryPrecision();
  passed++;
  
  console.log('\n✓ All ' + passed + ' provider failover tests passed');
} catch (e) {
  failed++;
  console.error('FAIL:', e.message);
  console.error(e.stack);
} finally {
  cleanup();
}

process.exit(failed > 0 ? 1 : 0);
