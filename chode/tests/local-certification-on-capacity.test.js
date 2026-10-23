'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  process.env.CHODE_BROWSER_CHECK = '0';
  process.env.CHODE_COMPLETION_ROUNDS = '2';
  const chode = require('../chode.js');
  const capacity = require('../provider-capacity').create(path.join(process.cwd(), '.chode/provider-capacity'));
  const block = (tool, args) => '```tool\n' + JSON.stringify({ tool, args }) + '\n```';
  fs.writeFileSync('acceptance.cjs', [
    "'use strict';",
    "const assert = require('assert');",
    "assert.strictEqual(require('./app.js'), 42);",
    "console.log('app exports 42');",
    ''
  ].join('\n'));
  for (const id of Object.keys(chode.PROVIDERS)) delete chode.PROVIDERS[id];
  chode.PROVIDERS.fixture = { name: 'Free fixture', category: 'keyless', requiresKey: null, endpoints: [] };
  chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: [] });
  let calls = 0;
  chode.__testHooks.callAI = async function (prompt) {
    calls++;
    if (prompt.includes('[VERIFY')) throw new Error('local certification must not request a model verifier');
    if (calls === 1) {
      return { provider: 'fixture', result: block('write', { file: 'app.js', content: 'module.exports = 42;\n' }) };
    }
    capacity.record('fixture', 120000);
    return null;
  };
  let result;
  try {
    result = await chode.cmdAI({
      prompt: 'Write app.js exporting 42.',
      acceptanceTest: 'acceptance.cjs',
      free: true,
      noMemory: true
    }, { cli: false });
  } finally {
    chode.__testHooks.callAI = null;
    delete process.env.CHODE_BROWSER_CHECK;
    delete process.env.CHODE_COMPLETION_ROUNDS;
  }
  assert(result, 'cmdAI returns a result');
  assert.strictEqual(calls, 2, 'two model calls: one implementation, one capacity failure');
  assert.strictEqual(result.completionStatus, 'VERIFIED', 'passing acceptance must certify saved work when providers cool down');
  assert.ok(!result.partial, 'certified work is not partial');
  assert.strictEqual(result.provider, 'fixture', 'author identity is preserved');
  assert.match(result.result, /deterministic checks passed locally/);
  assert.strictEqual(require(path.resolve('app.js')), 42);
  console.log('✓ passing acceptance certifies saved work during provider capacity pause');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-local-certification-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
