'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const block = (tool, args) => '```tool\n' + JSON.stringify({ tool, args }) + '\n```';

  // Gate level: a passing acceptance test certifies a run that changed nothing.
  fs.writeFileSync('done.js', 'module.exports = 1;\n');
  fs.writeFileSync('acceptance.cjs', "const assert = require('assert');assert.strictEqual(require('./done.js'), 1);console.log('done acceptance passed');\n");
  let gate = await chode.cheapVerifyGate([], { writes: [], edits: [], execs: [] }, { acceptanceTest: 'acceptance.cjs' });
  assert(gate.pass, 'passing acceptance must certify a no-change run: ' + JSON.stringify(gate.failed));
  assert(gate.checks.some((c) => /no changes needed/.test(c.detail) && c.ok), 'no-change certification is recorded');

  // Loop level: a "continue" turn that only reads and verifies must finish VERIFIED.
  let calls = 0;
  const result = await chode.runAgentLoop(
    'Fix anything broken in done.js, otherwise change nothing.',
    null,
    null,
    { v2: true, noMemory: true, acceptanceTest: 'acceptance.cjs' },
    async function (prompt) {
      calls++;
      const p = String(prompt);
      if (p.includes('[VERIFY')) return { provider: 'reviewer', result: 'PASS' };
      if (p.includes('[PLAN')) return { provider: 'planner', result: '1. Read done.js — check: node --check done.js' };
      if (p.includes('[TOOL RESULTS')) return { provider: 'reader', result: 'done.js already exports 1; nothing to change.' };
      return { provider: 'reader', result: block('read', { file: 'done.js' }) };
    },
    null,
    null,
    { originalTask: 'Fix anything broken in done.js, otherwise change nothing.' }
  );
  assert.strictEqual(result.completionStatus, 'VERIFIED', 'no-op continue must verify, got ' + result.completionStatus);
  assert.ok(!result.partial, 'no-op continue is not partial');
  assert.ok(calls >= 2 && calls <= 6, 'no-op continue stays within a few model calls, saw ' + calls);
  assert.strictEqual(require(path.resolve('done.js')), 1, 'implementation untouched');
  console.log('✓ continue with no changes: passing acceptance certifies the untouched workspace');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-noop-continue-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
