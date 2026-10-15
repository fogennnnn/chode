'use strict';

// Plan mode: read-only investigation, mutating tools refused with feedback,
// structured plan saved to .chode/plans/ and printed.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  fs.writeFileSync(path.join(tmp, 'app.js'), 'console.log(1);\n', 'utf8');

  const seen = [];
  chode.__testHooks.callAI = async (prompt) => {
    seen.push(prompt);
    if (seen.length === 1) {
      return {
        result: 'Surveying.\n```tool\n{"tool":"read","args":{"file":"app.js"}}\n```\n```tool\n{"tool":"exec","args":{"cmd":"rm -rf /"}}\n```',
        provider: 'mock', tokens: 10, latency: 1,
      };
    }
    return {
      result: '## Goal\nShip X\n## Findings\nOne file.\n## Plan\n1. Edit app.js\n## Risks\nNone.\n## Verification\nRun tests.',
      provider: 'mock', tokens: 10, latency: 1,
    };
  };
  let res;
  try {
    res = await chode.cmdPlan(['Add feature X']);
  } finally {
    chode.__testHooks.callAI = null;
    chode.__resetBoundedForTest();
  }
  assert.ok(res && res.result.includes('## Plan'), 'plan must print sections');
  assert.ok(seen[1].includes('tool disabled in this mode: exec'), 'exec attempt refused with feedback');
  // The refused call's args echo back (by design), but the denial path —
  // not the destructive-command path — must have handled it.
  assert.ok(!seen[1].includes('denied: destructive command'), 'disallow must trigger before execution');
  const plansDir = path.join(tmp, '.chode', 'plans');
  const files = fs.readdirSync(plansDir).filter((f) => f.endsWith('.md'));
  assert.strictEqual(files.length, 1, 'exactly one plan file saved, got ' + files.join(','));
  const saved = fs.readFileSync(path.join(plansDir, files[0]), 'utf8');
  assert.ok(saved.includes('## Findings') && saved.includes('Add feature X'), 'saved plan has spec + sections');
  assert.ok(!saved.includes('```tool'), 'saved plan has no tool blocks');

  const empty = await chode.cmdPlan([]);
  assert.strictEqual(empty, null, 'empty spec shows usage');

  console.log('✓ plan mode: read-only, disallow feedback, saved plan');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-plan-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
