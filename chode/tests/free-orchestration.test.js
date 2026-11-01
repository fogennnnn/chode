'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  const block = (tool, args) => '```tool\n' + JSON.stringify({ tool, args }) + '\n```';

  let delegated = 0;
  let inFlight = 0;
  let maxInFlight = 0;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function mockAI(prompt) {
    const p = String(prompt);
    if (p.includes('[TOOL RESULTS')) return { provider: 'worker', result: 'Finished my owned files.' };
    if (p.includes('[VERIFY')) return { provider: 'reviewer', result: 'PASS' };
    if (p.includes('[PLAN')) {
      return {
        provider: 'planner',
        result: [
          '1. Create/overwrite a.js — check: node --check a.js',
          '2. Create/overwrite b.js — check: node --check b.js',
          '3. Create/overwrite c.js — check: node --check c.js'
        ].join('\n')
      };
    }
    if (p.includes('[DELEGATED TASK')) {
      delegated++;
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await sleep(20);
      const match = p.match(/You own ONLY these files: (\[[^\]]*\])/);
      const files = match ? JSON.parse(match[1]) : [];
      const calls = files.map((file) => block('write', { file: file, content: 'module.exports = ' + JSON.stringify(file) + ';\n' })).join('\n');
      inFlight--;
      return { provider: 'worker-' + (files[0] || 'x'), result: calls };
    }
    return { provider: 'writer', result: 'Ready to verify.' };
  }

  chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: [] });
  chode.__testHooks.callAI = mockAI;
  let result;
  try {
    result = await chode.cmdAI({ prompt: 'Create a.js, b.js and c.js; each exports its own name.', free: true, noMemory: true }, { cli: false });
  } finally {
    chode.__testHooks.callAI = null;
  }
  assert.strictEqual(result.completionStatus, 'VERIFIED', 'free multi-file build verifies, got ' + result.completionStatus);
  assert(delegated >= 3, 'free runs must fan out to scoped workers, saw ' + delegated + ' delegated calls');
  assert(maxInFlight >= 2, 'free workers must run in parallel, saw max ' + maxInFlight + ' in flight');
  assert.strictEqual(require(path.join(tmp, 'a.js')), 'a.js');
  assert.strictEqual(require(path.join(tmp, 'b.js')), 'b.js');
  assert.strictEqual(require(path.join(tmp, 'c.js')), 'c.js');
  console.log('PASS free orchestration: parallel scoped workers build and verify without keys');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-free-orchestration-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
