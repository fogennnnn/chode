'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  const prompts = [];
  const block = (tool, args) => '```tool\n' + JSON.stringify({ tool, args }) + '\n```';

  const ai = async function (prompt) {
    const p = String(prompt);
    prompts.push(p);
    if (p.includes('[PLAN')) {
      return {
        provider: 'planner',
        result: [
          '1. Create a.js — check: node --check a.js',
          '2. Create b.js — check: node --check b.js',
          '3. Create c.js — check: node --check c.js'
        ].join('\n')
      };
    }
    if (p.includes('[DELEGATED TASK')) {
      const match = p.match(/You own ONLY these files: (\[[^\n]+\])/);
      assert(match, 'delegated prompt lists owned files');
      const files = JSON.parse(match[1]);
      return {
        provider: 'worker-' + files[0],
        result: files.map((file) => block('write', {
          file: file,
          content: file === 'a.js' ? 'module.exports = "a";\n' : file === 'b.js' ? 'module.exports = "b";\n' : 'module.exports = "c";\n'
        })).join('\n')
      };
    }
    if (p.includes('[VERIFY')) return { provider: 'reviewer', result: 'PASS' };
    return { provider: 'worker', result: 'Finished the delegated work.' };
  };

  const result = await chode.runAgentLoop(
    'Create a.js, b.js and c.js; each exports a short string.',
    null,
    null,
    { quietFailures: true, v2: true, orchestrate: true, noMemory: true },
    ai,
    null,
    null,
    { originalTask: 'Create a.js, b.js and c.js; each exports a short string.' }
  );

  assert.strictEqual(result.completionStatus, 'VERIFIED', 'integrated delegated files verify');
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'a.js'), 'utf8'), 'module.exports = "a";\n');
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'b.js'), 'utf8'), 'module.exports = "b";\n');
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'c.js'), 'utf8'), 'module.exports = "c";\n');
  assert(prompts.filter((p) => p.includes('[DELEGATED TASK')).length >= 3, 'independent plan steps run as delegated tasks');
  assert(result.actions.writes.includes('a.js'), 'delegated writes are merged into parent actions');
  assert(result.actions.writes.includes('b.js'));
  assert(result.actions.writes.includes('c.js'));
  assert(!prompts.some((p) => p.includes('outside delegated file scope')), 'delegated workers stay inside their file scope');

  const denied = await chode.runAgentTool(
    { tool: 'write', args: { file: 'outside.js', content: 'module.exports = 1;\n' } },
    { actions: {}, scopeTargets: ['a.js'] }
  );
  assert.strictEqual(denied.ok, false, 'delegated writes outside the owned scope are denied');
  assert(!fs.existsSync(path.join(tmp, 'outside.js')), 'denied delegated write creates no file');

  const units = chode.orchestrator.buildUnits([
    { index: 1, text: 'Create app.js', files: ['app.js'], check: '' },
    { index: 2, text: 'Create style.css', files: ['style.css'], check: '' },
    { index: 3, text: 'Edit app.js', files: ['app.js'], check: '' }
  ]);
  assert.strictEqual(units.length, 2, 'steps that share a file stay in one unit');
  assert.deepStrictEqual(units[0].files, ['app.js']);
  assert.strictEqual(units[0].steps.length, 2);

  const parsed = chode.parsePlanSteps([
    '1. Create index.html — check: open index.html in browser',
    '2. Create styles.css — check: open index.html to see styling',
    '3. Create app.js — check: node --check app.js',
    '4. Edit index.html to link styles.css and app.js — check: open index.html',
    '5. Edit app.js to add listeners — check: interact with the app',
    '6. Edit styles.css for a centered card — check: resize the window'
  ].join('\n'));
  const split = chode.orchestrator.buildUnits(parsed);
  assert.strictEqual(split.length, 3, 'check text references do not merge independent file owners');
  assert.deepStrictEqual(split.map((unit) => unit.files), [['index.html'], ['styles.css'], ['app.js']]);

  console.log('✓ orchestrator: disjoint plan steps run as scoped parallel workers and integrate before verification');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-orchestrator-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
