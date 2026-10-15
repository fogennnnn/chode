'use strict';

const assert = require('assert');

const chode = require('../chode.js');

const realFetch = global.fetch;

function sseResponse(frames) {
  const enc = new TextEncoder();
  const queue = frames.map((f) => enc.encode(f));
  return {
    ok: true,
    status: 200,
    headers: { get: (k) => (String(k).toLowerCase() === 'content-type' ? 'text/event-stream' : null) },
    body: {
      getReader: () => {
        let i = 0;
        return {
          read: async () => (i < queue.length ? { done: false, value: queue[i++] } : { done: true }),
          cancel: async () => {},
        };
      },
    },
  };
}

function jsonResponse(obj) {
  return {
    ok: true,
    status: 200,
    headers: { get: (k) => (String(k).toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => obj,
  };
}

function errResponse(status, text) {
  return { ok: false, status, text: async () => text || '', headers: { get: () => null } };
}

const endpoint = { parse: (d) => d.choices[0].message.content };
const body = JSON.stringify({ model: 'm', messages: [{ role: 'user', content: 'hi' }] });

async function main() {
  // sseDelta shapes.
  assert.strictEqual(chode.sseDelta({ choices: [{ delta: { content: 'a' } }] }), 'a');
  assert.strictEqual(chode.sseDelta({ choices: [{ text: 'b' }] }), 'b');
  assert.strictEqual(chode.sseDelta({ choices: [{ message: { content: 'c' } }] }), 'c');
  assert.strictEqual(chode.sseDelta({}), '');

  // 1. SSE accumulation with live tokens.
  global.fetch = async () => sseResponse([
    'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n',
    ': heartbeat\n',
    'data: {"choices":[{"delta":{"content":"world"}}]}\n\ndata: [DONE]\n\n',
  ]);
  const seen = [];
  const r1 = await chode.tryStreamChat('ovh', 'https://x/chat', {}, body, { onToken: (c) => seen.push(c) }, Date.now(), endpoint);
  assert.strictEqual(r1.result, 'Hello world');
  assert.deepStrictEqual(seen, ['Hello ', 'world']);

  // 2. Provider ignores stream:true and returns full JSON instead.
  global.fetch = async () => jsonResponse({ choices: [{ message: { content: 'full answer' } }] });
  const seen2 = [];
  const r2 = await chode.tryStreamChat('ovh', 'https://x/chat', {}, body, { onToken: (c) => seen2.push(c) }, Date.now(), endpoint);
  assert.strictEqual(r2.result, 'full answer');
  assert.deepStrictEqual(seen2, ['full answer']);

  // 3. Rate limit fails fast with noFallback (preserves failover).
  global.fetch = async () => errResponse(429, 'slow down');
  await assert.rejects(
    chode.tryStreamChat('ovh', 'https://x/chat', {}, body, {}, Date.now(), endpoint),
    (e) => e.message === '429_rate_limited' && e.noFallback === true
  );

  // 4. Plain 400 (e.g. stream:true rejected) falls back to buffered call.
  global.fetch = async () => errResponse(400, 'stream unsupported');
  await assert.rejects(
    chode.tryStreamChat('ovh', 'https://x/chat', {}, body, {}, Date.now(), endpoint),
    (e) => /^400:/.test(e.message) && !e.noFallback
  );

  // 5. End-to-end plumbing: onToken flows router -> provider -> display.
  chode.PROVIDERS.__teststream = {
    name: 'Test Stream',
    category: 'keyless',
    requiresKey: null,
    qualityScore: 1,
    endpoints: [{
      type: 'chat',
      url: 'http://localhost:9/chat',
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (k, m) => JSON.stringify({ model: 'm', messages: m }),
      parse: (d) => d.choices[0].message.content,
    }],
  };
  // Live routing writes leaderboard + usage state: back both up so the
  // test never mutates the developer's real workspace state.
  const fs = require('fs');
  const path = require('path');
  const stateDir = path.join(__dirname, '..', '.chode', 'monitor');
  const backedUp = {};
  for (const f of ['leaderboard.json', 'usage.jsonl', 'usage.json']) {
    try { backedUp[f] = fs.readFileSync(path.join(stateDir, f)); } catch (e) { backedUp[f] = null; }
  }
  try {
    global.fetch = async () => sseResponse(['data: {"choices":[{"delta":{"content":"streamed ok"}}]}\n\ndata: [DONE]\n']);
    chode.__resetBoundedForTest();
    const tokens = [];
    const routed = await chode.callWithBestProvider('plumbing check', null, '__teststream', {
      quietFailures: true,
      onToken: (c) => tokens.push(c),
    });
    assert.ok(routed && routed.result === 'streamed ok', 'streamed answer must win, got ' + JSON.stringify(routed && routed.result));
    assert.deepStrictEqual(tokens, ['streamed ok']);
    console.log('✓ streaming: sse, json-fallback, fail-fast, plumbing');
  } finally {
    delete chode.PROVIDERS.__teststream;
    chode.__resetBoundedForTest();
    global.fetch = realFetch;
    for (const f of Object.keys(backedUp)) {
      const full = path.join(stateDir, f);
      try {
        if (backedUp[f] === null) { fs.rmSync(full, { force: true }); }
        else fs.writeFileSync(full, backedUp[f]);
      } catch (e) {}
    }
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
