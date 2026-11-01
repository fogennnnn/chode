'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const block = (tool, args) => '```tool\n' + JSON.stringify({ tool, args }) + '\n```';
  let wrote = false;
  process.env.CHODE_COMPLETION_ROUNDS = '2';
  process.env.CHODE_MAX_MODEL_CALLS = '2';
  chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: [] });
  chode.__testHooks.callAI = async function (prompt) {
    const p = String(prompt);
    if (p.includes('[VERIFY')) return null;
    if (p.includes('[TOOL RESULTS')) return { provider: 'draft', result: 'The file is complete.' };
    if (!wrote) {
      wrote = true;
      return { provider: 'draft', result: block('write', { file: 'ok.js', content: 'module.exports = 42;\n' }) };
    }
    return { provider: 'draft', result: 'The file is complete.' };
  };
  let result;
  try {
    result = await chode.cmdAI({ prompt: 'Write ok.js exporting 42.', noMemory: true, free: true }, { cli: false });
  } finally {
    chode.__testHooks.callAI = null;
    delete process.env.CHODE_COMPLETION_ROUNDS;
    delete process.env.CHODE_MAX_MODEL_CALLS;
  }
  assert(result, 'cmdAI returns a result');
  assert.strictEqual(result.completionStatus, 'VERIFIED', 'budget exhaustion must not downgrade a verified build');
  assert.ok(!result.partial, 'verified build is not partial');
  assert.ok(!result.queuedId, 'verified build is not queued for retry');
  assert.strictEqual(fs.readFileSync('ok.js', 'utf8'), 'module.exports = 42;\n');
  console.log('✓ verified result survives model-budget exhaustion');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-verified-budget-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
