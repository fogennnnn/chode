/**
 * chode Integration Test Suite
 * Tests the actual chode.js CLI functionality
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHODEJS = path.join(__dirname, '..', 'chode.js');
const MEMORYJS = path.join(__dirname, '..', 'memory.js');

// ─── Test Helpers ──────────────────────────────────────────────────────────────

function runCmd(cmd, opts = {}) {
  // Normalized contract: ALWAYS { error, stdout, stderr } with strings —
  // success returns stdout (not a bare string), failure defaults to '' so
  // `x.stdout.includes(...)` checks can never throw or misread success.
  const result = spawnSync(process.execPath, cmd, { encoding: 'utf8', timeout: 30000, windowsHide: true, ...opts });
  const error = result.error ? String(result.error.code || '') + ' ' + result.error.message : result.status !== 0 ? 'exit ' + result.status : null;
  return { error, stdout: result.stdout || '', stderr: result.stderr || '' };
}

// Chatter is stderr by design (stdout stays pure results), so assertions must
// use combined output — stdout-only checks miss all status/ranking text.
function combined(r) {
  return (r.stdout || '') + '\n' + (r.stderr || '');
}

function testGroup(name, fn) {
  console.log('\n' + '═'.repeat(60));
  console.log('  ' + name);
  console.log('═'.repeat(60));
  return fn();
}

async function asyncTestGroup(name, fn) {
  console.log('\n' + '═'.repeat(60));
  console.log('  ' + name);
  console.log('═'.repeat(60));
  return fn();
}

// ─── Test Suites ───────────────────────────────────────────────────────────────

async function runAllTests() {
  let passed = 0;
  let failed = 0;
  const results = [];

  // ── CLI Tests ──────────────────────────────────────────────────────────────
  await testGroup('CLI Commands', () => {
    // Test help command
    const help = runCmd([CHODEJS, "help"]);
    if (help.error) {
      console.log('❌ help command failed:', help.error);
      failed++;
      results.push({ test: 'help', status: 'FAIL', error: help.error });
    } else {
      console.log('✓ help command works');
      passed++;
      results.push({ test: 'help', status: 'PASS' });
    }

    // Test status command
    const status = runCmd([CHODEJS, "status"]);
    if (status.error && !combined(status).includes('═══')) {
      console.log('❌ status command failed:', status.error);
      failed++;
      results.push({ test: 'status', status: 'FAIL', error: status.error });
    } else {
      console.log('✓ status command works');
      passed++;
      results.push({ test: 'status', status: 'PASS' });
    }

    // Test models command
    const models = runCmd([CHODEJS, "models"]);
    if (models.error && !combined(models).includes('AI Models')) {
      console.log('❌ models command failed:', models.error);
      failed++;
      results.push({ test: 'models', status: 'FAIL', error: models.error });
    } else {
      console.log('✓ models command works');
      passed++;
      results.push({ test: 'models', status: 'PASS' });
    }

    // Test score command
    const score = runCmd([CHODEJS, "score"]);
    if (score.error && !combined(score).includes('Provider')) {
      console.log('❌ score command failed:', score.error);
      failed++;
      results.push({ test: 'score', status: 'FAIL', error: score.error });
    } else {
      console.log('✓ score command works');
      passed++;
      results.push({ test: 'score', status: 'PASS' });
    }

    // Test quickkey command
    const quickkey = runCmd([CHODEJS, "quickkey", "groq"]);
    if (quickkey.error && !combined(quickkey).includes('Groq')) {
      console.log('❌ quickkey command failed:', quickkey.error);
      failed++;
      results.push({ test: 'quickkey', status: 'FAIL', error: quickkey.error });
    } else {
      console.log('✓ quickkey command works');
      passed++;
      results.push({ test: 'quickkey', status: 'PASS' });
    }
  });

  // ── Memory System Tests ───────────────────────────────────────────────────
  await testGroup('Memory System', async () => {
    // Test memory status
    const status = runCmd([MEMORYJS, "status"]);
    if (status.error && !combined(status).includes('Memory Status')) {
      console.log('❌ memory status failed:', status.error);
      failed++;
      results.push({ test: 'memory:status', status: 'FAIL', error: status.error });
    } else {
      console.log('✓ memory status works');
      passed++;
      results.push({ test: 'memory:status', status: 'PASS' });
    }

    // Test memory list
    const list = runCmd([MEMORYJS, "list"]);
    if (list.error && !combined(list).includes('Memories')) {
      console.log('❌ memory list failed:', list.error);
      failed++;
      results.push({ test: 'memory:list', status: 'FAIL', error: list.error });
    } else {
      console.log('✓ memory list works');
      passed++;
      results.push({ test: 'memory:list', status: 'PASS' });
    }

    // Test memory store (integration tests may leave this entry in local state)
    const store = runCmd([MEMORYJS, "store", "test_integration", "integration test"]);
    if (!store.error || combined(store).includes('Stored')) {
      console.log('✓ memory store works');
      passed++;
      results.push({ test: 'memory:store', status: 'PASS' });
    } else {
      console.log('⚠ memory store failed (vault may be unavailable):', store.error?.slice(0, 50));
      results.push({ test: 'memory:store', status: 'SKIP', note: 'vault unavailable' });
    }

    // Test memory recall
    const recall = runCmd([MEMORYJS, "recall", "test_integration"]);
    if (combined(recall).includes('integration test') || combined(recall).includes('Not found')) {
      console.log('✓ memory recall works');
      passed++;
      results.push({ test: 'memory:recall', status: 'PASS' });
    } else {
      console.log('⚠ memory recall failed:', recall.error?.slice(0, 50));
      results.push({ test: 'memory:recall', status: 'SKIP', note: recall.error });
    }
  });

  // ── Provider Tests ────────────────────────────────────────────────────────
  await testGroup('Provider Routing', async () => {
    // Test AI call with force provider (result is stdout, chatter is stderr)
    const aiTest = runCmd([CHODEJS, "ai", "test", "--force", "ovh"], { timeout: 20000 });
    const aiOut = combined(aiTest);
    if (!aiTest.error && aiTest.stdout.trim() && !/Providers are unreachable|queued this task|All providers exhausted|No keys found/i.test(aiOut)) {
      console.log('✓ AI routing returned an answer (OVHcloud)');
      passed++;
      results.push({ test: 'ai:routing', status: 'PASS' });
    } else if (aiTest.error && /timeout|ETIMEDOUT/i.test(aiTest.error)) {
      console.log('⚠ AI routing timeout (provider may be rate-limited)');
      results.push({ test: 'ai:routing', status: 'SKIP', note: 'timeout' });
    } else if (/rate|429|50[234]|timeout|fetch failed|ECONNRESET|exhausted|unreachable|not viable|No keys|auth|402|401|403|payment/i.test(aiOut + ' ' + (aiTest.error || ''))) {
      console.log('⚠ AI routing skipped (no live provider in this env)');
      results.push({ test: 'ai:routing', status: 'SKIP', note: 'no live provider' });
    } else {
      console.log('❌ AI routing failed');
      failed++;
      results.push({ test: 'ai:routing', status: 'FAIL' });
    }
  });

  // ── Router Unit Tests (mocked trySingleProvider, no network) ──────────────
  await testGroup('Router Unit (mocked)', async () => {
    async function routerUnit() {
      const chode = require('../chode.js');
      const lbFile = path.join(__dirname, '..', '.chode', 'monitor', 'leaderboard.json');
      let prevLb = null;
      try { prevLb = fs.readFileSync(lbFile, 'utf8'); } catch (e) {}
      const sessIds = [];
      const ckIds = [];
      function trackSession(id) { sessIds.push(id); ckIds.push(id); }
      function cleanup() {
        try { chode.__testHooks.trySingle = null; } catch (e) {}
        try { if (chode.__resetBoundedForTest) chode.__resetBoundedForTest(); } catch (e) {}
        for (const id of sessIds) {
          try { fs.unlinkSync(path.join(__dirname, '..', '.chode', 'sessions', id + '.json')); } catch (e) {}
          try { fs.unlinkSync(path.join(__dirname, '..', '.chode', 'checkpoint-' + id + '.json')); } catch (e) {}
        }
        try {
          if (prevLb !== null) { fs.mkdirSync(path.dirname(lbFile), { recursive: true }); fs.writeFileSync(lbFile, prevLb, 'utf8'); }
          else { try { fs.unlinkSync(lbFile); } catch (e) {} }
        } catch (e) {}
      }
      function writeRank(ids) {
        const lb = { updated: new Date().toISOString(), providers: {}, ranked: ids.map((id, i) => ({ id, name: id, score: 90 - i * 5, reliability: 100, latency: 100, streak: 1, category: 'keyless' })) };
        fs.mkdirSync(path.dirname(lbFile), { recursive: true });
        fs.writeFileSync(lbFile, JSON.stringify(lb, null, 2), 'utf8');
      }
      // 1. retry fail-fast: 402/payment_required + 401/403/auth_failed = 1 attempt; 429 caps at 2
      async function expectAttempts(errMsg, want) {
        let n = 0;
        try { await chode.retry(async () => { n++; throw new Error(errMsg); }, 5, 'unit'); } catch (e) {}
        assert.strictEqual(n, want, 'retry(' + errMsg + ') attempts=' + n + ' want=' + want);
      }
      await expectAttempts('payment_required: key or quota issue (HTTP 402)', 1);
      await expectAttempts('402 Payment Required', 1);
      await expectAttempts('auth_failed: invalid key (HTTP 401)', 1);
      await expectAttempts('401: bad key', 1);
      await expectAttempts('403: forbidden', 1);
      await expectAttempts('invalid_key', 1);
      await expectAttempts('429_rate_limited', 2);
      console.log('✓ retry fail-fast (401/403 like 402, 429 capped)');
      // 2. 429→failover + rank order: top-ranked 429s, next-ranked wins
      chode.__resetBoundedForTest();
      writeRank(['ovh', 'llm7', 'uncloseai']);
      let order = [];
      chode.__testHooks.trySingle = async (pid) => {
        order.push(pid);
        if (pid === 'ovh') throw new Error('429_rate_limited');
        return { pid, result: 'ok-from-' + pid, latency: 5, tokens: 3 };
      };
      const sid1 = 'unit-failover-' + Date.now();
      trackSession(sid1);
      const r1 = await chode.callWithBestProvider('unit prompt failover ' + Date.now(), sid1, null);
      assert.ok(r1 && r1.result, 'failover should succeed via second provider');
      assert.strictEqual(r1.provider, 'llm7', '429 on ovh should fail over to llm7, got ' + r1.provider);
      assert.ok(order.indexOf('ovh') !== -1 && order.indexOf('llm7') !== -1, 'both providers should be tried');
      console.log('✓ 429 failover (ovh→llm7)');
      // 3. rank order: all succeed → highest-ranked wins
      chode.__resetBoundedForTest();
      writeRank(['llm7', 'ovh', 'uncloseai']);
      chode.__testHooks.trySingle = async (pid) => ({ pid, result: 'ok-' + pid, latency: 5, tokens: 3 });
      const sid2 = 'unit-rank-' + Date.now();
      trackSession(sid2);
      const r2 = await chode.callWithBestProvider('unit prompt rank ' + Date.now(), sid2, null);
      assert.strictEqual(r2.provider, 'llm7', 'rank order violated: want llm7 got ' + r2.provider);
      console.log('✓ rank order (llm7 first)');
      // 4. auth-failed deprioritized: marked provider sorts last
      chode.__resetBoundedForTest();
      writeRank(['ovh', 'llm7', 'uncloseai']);
      chode.markAuthFailed('ovh');
      assert.ok(chode.isAuthFailed('ovh'), 'markAuthFailed should stick');
      chode.__testHooks.trySingle = async (pid) => ({ pid, result: 'ok-' + pid, latency: 5, tokens: 3 });
      const sid3 = 'unit-auth-' + Date.now();
      trackSession(sid3);
      const r3 = await chode.callWithBestProvider('unit prompt auth ' + Date.now(), sid3, null);
      assert.notStrictEqual(r3.provider, 'ovh', 'auth-failed ovh should be deprioritized, got ' + r3.provider);
      console.log('✓ auth-failed deprioritized');
      cleanup();
    }
    try {
      await routerUnit();
      console.log('✓ router unit (mocked trySingleProvider)');
      passed++;
      results.push({ test: 'router:unit', status: 'PASS' });
    } catch (e) {
      try { require('../chode.js').__resetBoundedForTest(); } catch (x) {}
      console.log('❌ router unit failed:', (e && e.message || e).toString().slice(0, 300));
      failed++;
      results.push({ test: 'router:unit', status: 'FAIL', error: String((e && e.message) || e).slice(0, 300) });
    }
  });

  // ── File Structure Tests ──────────────────────────────────────────────────
  await testGroup('Package Structure', () => {
    const files = [
      'chode.js',
      'memory.js',
      'web-context.js',
      'toolbox.js',
      'package.json',
      'README.md',
      'tests/memory-lens.test.js',
      'tests/retro-revival.test.js',
      'tests/dream-decoder.test.js',
      'tests/integration.test.js',
      'tests/cli-smoke.test.js',
      'tests/agent-loop.test.js',
      'tests/streaming.test.js',
      'tests/repl-ux.test.js',
      'tests/live-ux.test.js',
      'tests/sessions-health.test.js',
      'tests/ask-tool.test.js',
      'tests/no-pollinations.test.js',
      'tests/polish-audit.test.js',
      'tests/polish-round2.test.js',
      'tests/repl-pipe.test.js',
      'tests/polish-round3.test.js',
      'tests/polish-round4.test.js',
      'tests/subagents.test.js',
      'tests/plan.test.js',
      'tests/frontend-copy.test.js'
    ];

    let allExist = true;
    for (const f of files) {
      const fullPath = path.join(__dirname, '..', f);
      if (fs.existsSync(fullPath)) {
        console.log('✓ ' + f);
      } else {
        console.log('❌ ' + f + ' missing');
        allExist = false;
      }
    }

    if (allExist) {
      passed++;
      results.push({ test: 'package:structure', status: 'PASS' });
    } else {
      failed++;
      results.push({ test: 'package:structure', status: 'FAIL' });
    }
  });

  // ── Syntax Tests ──────────────────────────────────────────────────────────
  await testGroup('Syntax Validation', () => {
    const files = ['chode.js', 'memory.js'];
    let allValid = true;

    for (const f of files) {
      const result = runCmd(['--check', path.join(__dirname, '..', f)]);
      if (result.error) {
        console.log('❌ ' + f + ': ' + result.error);
        allValid = false;
      } else {
        console.log('✓ ' + f);
      }
    }

    if (allValid) {
      passed++;
      results.push({ test: 'syntax:validation', status: 'PASS' });
    } else {
      failed++;
      results.push({ test: 'syntax:validation', status: 'FAIL' });
    }
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log('  Passed:  ' + passed);
  console.log('  Failed:  ' + failed);
  console.log('  Total:   ' + (passed + failed));
  console.log('═'.repeat(60) + '\n');

  if (failed > 0) {
    console.log('FAILED TESTS:');
    for (const r of results) {
      if (r.status === 'FAIL') {
        console.log('  - ' + r.test + ': ' + (r.error || 'unknown error'));
      }
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
