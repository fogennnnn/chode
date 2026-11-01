'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const originalFetch = global.fetch;
  const original = chode.PROVIDERS.rotate;
  chode.PROVIDERS.rotate = {
    name: 'Rotation fixture',
    category: 'keyless',
    requiresKey: null,
    endpoints: [0, 1, 2].map((index) => ({
      type: 'chat',
      url: 'http://localhost/v1/chat/completions',
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (key, messages) => JSON.stringify({ model: 'model-' + index, messages }),
      parse: (data) => data.choices?.[0]?.message?.content
    }))
  };
  let calls = 0;
  global.fetch = async function () {
    const index = calls++;
    const body = index < 2
      ? { choices: [{ message: { content: '', reasoning: 'thinking without a usable answer' }, finish_reason: 'stop' }] }
      : { choices: [{ message: { content: 'third endpoint works' }, finish_reason: 'stop' }] };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const result = await chode.trySingleProvider('rotate', 'prompt', { messages: [] }, 2, {});
    assert.strictEqual(calls, 3, 'all three endpoints are attempted when empty responses consume the retry budget');
    assert.strictEqual(result.result, 'third endpoint works');
    assert.strictEqual(result.pid, 'rotate');

    chode.__resetBoundedForTest();
    const seenModels = [];
    global.fetch = async function (_url, init) {
      const parsedBody = JSON.parse(init.body);
      seenModels.push(parsedBody.model);
      if (parsedBody.model === 'model-0') {
        return new Response(JSON.stringify({ error: { message: 'rate limit' } }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ choices: [{ message: { content: 'ok from ' + parsedBody.model }, finish_reason: 'stop' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };
    await assert.rejects(
      chode.trySingleProvider('rotate', 'prompt', { messages: [] }, 2, { quiet: true }),
      /429/,
      '429 fails fast instead of burning every endpoint bucket'
    );
    assert.deepStrictEqual(seenModels, ['model-0'], '429 does not rotate through endpoints');

    chode.__resetBoundedForTest();
    seenModels.length = 0;
    global.fetch = async function (_url, init) {
      const parsedBody = JSON.parse(init.body);
      seenModels.push(parsedBody.model);
      if (parsedBody.model === 'model-0') {
        return new Response(JSON.stringify({ error: { message: 'busy' } }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ choices: [{ message: { content: 'ok from ' + parsedBody.model }, finish_reason: 'stop' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };
    const after503 = await chode.trySingleProvider('rotate', 'prompt', { messages: [] }, 2, { quiet: true });
    assert.strictEqual(after503.result, 'ok from model-1', '503 on first model rotates to next model bucket');
    const nextCall = await chode.trySingleProvider('rotate', 'prompt', { messages: [] }, 2, { quiet: true });
    assert.strictEqual(nextCall.result, 'ok from model-2', 'next call starts at the following round-robin endpoint');
    assert.deepStrictEqual(seenModels, ['model-0', 'model-1', 'model-2']);

    const steps = chode.parsePlanSteps([
      '1. Create `math.wat` — check: wat2wasm math.wat',
      '2. Create/overwrite `calc.cpp` — check: make all'
    ].join('\n'));
    assert.deepStrictEqual(steps[0].files, ['math.wat'], '.wat files are extracted from plan steps');
    assert.deepStrictEqual(steps[1].overwrites, ['calc.cpp'], 'backtick-quoted create/overwrite paths are extracted');
  } finally {
    global.fetch = originalFetch;
    if (original) chode.PROVIDERS.rotate = original; else delete chode.PROVIDERS.rotate;
  }
  console.log('✓ endpoint rotation reaches every configured endpoint before giving up');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-endpoint-rotation-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 30000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
