'use strict';

// Slice 5 — providers (keyless-first reroute):
// Kilo primary keyless drafter, LLM7 secondary/overflow, OVH kept.
// Draft lane Kilo → OVH → LLM7; verifier lane never equals the drafter.
// Probe-before-trust: named models verified live before routing (scan
// pattern); scan covers the new endpoints. No other new providers.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');

  // ── Config shape: keyless-first lane ──
  const ids = Object.keys(chode.PROVIDERS);
  assert.ok(ids.includes('kilo') && ids.includes('ovh') && ids.includes('llm7'), 'lane present');
  assert.ok(ids.indexOf('kilo') < ids.indexOf('ovh') && ids.indexOf('ovh') < ids.indexOf('llm7'),
    'draft lane order Kilo → OVH → LLM7, got ' + ids.filter((i) => ['kilo', 'ovh', 'llm7'].includes(i)).join(','));
  const kilo = chode.PROVIDERS.kilo, ovh = chode.PROVIDERS.ovh, llm7 = chode.PROVIDERS.llm7;
  assert.strictEqual(kilo.requiresKey, null, 'kilo keyless');
  assert.strictEqual(kilo.category, 'keyless');
  assert.strictEqual(kilo.endpoints[0].url, 'https://api.kilo.ai/api/gateway/chat/completions');
  assert.ok(kilo.endpoints[0].body(null, [{ role: 'user', content: 'say ok' }]).includes('kilo-auto/free'), 'kilo named model');
  assert.ok(kilo.qualityScore > ovh.qualityScore && ovh.qualityScore > llm7.qualityScore,
    'lane scores Kilo>OVH>LLM7, got ' + [kilo.qualityScore, ovh.qualityScore, llm7.qualityScore].join(','));
  assert.strictEqual(llm7.requiresKey, null, 'llm7 anonymous');
  assert.strictEqual(llm7.endpoints[0].url, 'https://api.llm7.io/v1/chat/completions');
  assert.strictEqual(llm7.endpoints[0].headers().Authorization, 'Bearer unused', 'llm7 anonymous tier');
  const known = ['groq', 'cerebras', 'google', 'mistral', 'openrouter', 'nvidia', 'cloudflare', 'deepseek', 'cohere', 'agnes', 'github', 'ollama', 'kilo', 'ovh', 'llm7', 'uncloseai', 'anthropic', 'openai'];
  assert.deepStrictEqual(ids.slice().sort(), known.slice().sort(), 'no other new providers in this pass');

  // GitHub Models is authenticated, including when an environment token exists.
  const github = chode.PROVIDERS.github;
  assert.equal(github.requiresKey, 'GITHUB_TOKEN');
  assert.equal(github.category, 'free_tier');
  assert.equal(github.endpoints[0].headers('selected-token').Authorization, 'Bearer selected-token');
  assert(!require('../provider-capacity').free(github));
  assert.equal(chode.parseArgs(['--verifier', 'llm7', 'Build']).verifier, 'llm7');
  assert.equal(chode.parseArgs(['--verifier=ovh']).verifier, 'ovh');
  for(const argv of [['--verifier'], ['--verifier='], ['--verifier', '--free'], ['--verifier=missing']])assert(chode.parseArgs(argv).invalidVerifier, JSON.stringify(argv));
  await assert.rejects(chode.cmdAI(['--verifier=missing', 'Build']), /known-provider/);
  await assert.rejects(chode.cmdAI(['--free', '--verifier=github', 'Build']), /keyless or local/);
  const oldToken=process.env.GITHUB_TOKEN;
  try {
    process.env.GITHUB_TOKEN='synthetic-test-token';
    chode.__resetBoundedForTest();
    const called=[];
    chode.__testHooks.trySingle=async pid=>{called.push(pid);return {pid,result:'fixture',latency:1,tokens:1};};
    const excluded=await chode.callWithBestProvider('Strict free github exclusion',null,'github',{freeOnly:true,quietFailures:true,noRateWait:true,maxRetries:1});
    assert(!called.includes('github'),'strict free mode excludes GitHub even with token');
    assert(!excluded||excluded.provider!=='github');
  } finally {if(oldToken===undefined)delete process.env.GITHUB_TOKEN;else process.env.GITHUB_TOKEN=oldToken;chode.__testHooks.trySingle=null;}

  // ── Routing: Kilo first, OVH overflow, LLM7 second overflow (no network) ──
  function writeRank(rankedIds) {
    chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: rankedIds.map((id) => ({ id, score: 100 })) });
  }
  const baseOpts = { quietFailures: true, maxRetries: 2, timeoutMs: 100, noRateWait: true };
  chode.__resetBoundedForTest();
  writeRank(['kilo', 'ovh', 'llm7']);
  let order = [];
  chode.__testHooks.trySingle = async (pid) => { order.push(pid); return { pid, result: 'ok-' + pid, latency: 1, tokens: 2 }; };
  let r = await chode.callWithBestProvider('kilo first ' + Date.now(), null, null, baseOpts);
  assert.strictEqual(r.provider, 'kilo', 'keyless draft starts at Kilo, got ' + r.provider);
  assert.strictEqual(order[0], 'kilo', 'Kilo tried first, got ' + order.join(','));

  chode.__resetBoundedForTest();
  writeRank(['kilo', 'ovh', 'llm7']);
  order = [];
  chode.__testHooks.trySingle = async (pid) => {
    order.push(pid);
    if (pid === 'kilo') throw new Error('429_rate_limited');
    return { pid, result: 'ok-' + pid, latency: 1, tokens: 2 };
  };
  r = await chode.callWithBestProvider('kilo overflow ' + Date.now(), null, null, baseOpts);
  assert.strictEqual(r.provider, 'ovh', 'Kilo 429 overflows to OVH, got ' + r.provider);

  chode.__resetBoundedForTest();
  writeRank(['kilo', 'ovh', 'llm7']);
  chode.__testHooks.trySingle = async (pid) => {
    if (pid === 'kilo' || pid === 'ovh') throw new Error('429_rate_limited');
    return { pid, result: 'ok-' + pid, latency: 1, tokens: 2 };
  };
  r = await chode.callWithBestProvider('llm7 overflow ' + Date.now(), null, null, baseOpts);
  assert.strictEqual(r.provider, 'llm7', 'Kilo+OVH 429 overflow to LLM7, got ' + r.provider);

  // ── Verifier lane: never equals the drafter, prefers keyed families ──
  for (const pid of Object.keys(chode.PROVIDERS)) {
    const v = chode.pickVerifierId(pid);
    assert.ok(v && v !== pid && chode.PROVIDERS[v], 'verifier differs from ' + pid + ', got ' + v);
  }
  const keyName = chode.PROVIDERS.cloudflare.requiresKey;
  const priorKey = process.env[keyName];
  try {
    process.env[keyName] = 'synthetic-fixture-key';
    assert.ok(chode.PROVIDERS[chode.pickVerifierId('kilo')].requiresKey, 'configured keyed family preferred');
  } finally { if (priorKey === undefined) delete process.env[keyName]; else process.env[keyName] = priorKey; }

  chode.__resetBoundedForTest();
  console.log('✓ v2 providers: kilo lane, OVH/LLM7 overflow, verifier separation');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-providers-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
