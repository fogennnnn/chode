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
  const prompts = [];
  let wroteBroken = false;
  let wroteFixed = false;

  process.env.CHODE_COMPLETION_ROUNDS = '2';
  chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: [] });
  chode.__testHooks.callAI = async function (prompt) {
    const p = String(prompt);
    prompts.push(p);
    if (p.includes('[VERIFY')) return null;
    if (p.includes('[REPAIR')) return { provider: 'draft', result: 'The failed check needs another attempt.' };
    if (p.includes('[CONTINUE COMPLETION')) {
      if (!wroteFixed) {
        wroteFixed = true;
        return { provider: 'draft', result: block('edit', { file: 'round.js', oldString: 'module.exports = ;', newString: 'module.exports = 42;' }) };
      }
      return { provider: 'draft', result: 'Finished round.js.' };
    }
    if (p.includes('[TOOL RESULTS')) return { provider: 'draft', result: 'I think it is ready.' };
    if (!wroteBroken) {
      wroteBroken = true;
      return { provider: 'draft', result: block('write', { file: 'round.js', content: 'module.exports = ;\n' }) };
    }
    return { provider: 'draft', result: 'I think it is ready.' };
  };

  let result;
  try {
    result = await chode.cmdAI({ prompt: 'Write round.js exporting 42.', noMemory: true }, { cli: false });
  } finally {
    chode.__testHooks.callAI = null;
    delete process.env.CHODE_COMPLETION_ROUNDS;
  }

  assert(result, 'cmdAI returns a result');
  assert.strictEqual(result.completionStatus, 'VERIFIED', 'the outer completion loop finishes after repair');
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'round.js'), 'utf8'), 'module.exports = 42;\n');
  assert.ok(prompts.some((p) => p.includes('[CONTINUE COMPLETION')), 'an incomplete build receives a continuation prompt');
  assert.ok(!prompts.some((p) => p.includes('CONTINUE COMPLETION') && p.includes('undefined')), 'continuation carries no undefined failure text');
  assert.ok(/deterministic checks passed/i.test(result.result), 'the final answer discloses local/deterministic certification');
  assert.ok(!result.queuedId, 'a completed build is not queued');

  console.log('✓ completion rounds: failed build continues in the same run, writes the fix and finishes locally certified');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-completion-rounds-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
