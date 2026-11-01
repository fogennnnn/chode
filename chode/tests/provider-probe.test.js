'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-probe-'));
const oldCwd = process.cwd();
process.chdir(dir);
const oldFetch = global.fetch;
(async () => {
  try {
    const e = require('../chode');
    let calls = 0;
    global.fetch = async () => {
      calls++;
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] })
      };
    };
    const id = 'probe-test';
    e.PROVIDERS[id] = {
      name: 'Probe Test',
      category: 'keyless',
      requiresKey: null,
      endpoints: [{
        type: 'chat',
        url: 'http://localhost:9/v1/chat/completions',
        headers: () => ({ 'Content-Type': 'application/json' }),
        body: () => JSON.stringify({ messages: [] }),
        parse: (d) => d.choices?.[0]?.message?.content
      }]
    };
    const result = await e.probeProvider(id, e.PROVIDERS[id].endpoints[0], {});
    assert.equal(result.ok, true, 'probe should succeed, got ' + JSON.stringify(result));
    assert.equal(calls, 1, 'probe should make exactly one HTTP request');
    console.log('PASS: provider probe reports success instead of an internal scope error');
  } finally {
    global.fetch = oldFetch;
    process.chdir(oldCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
