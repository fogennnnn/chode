'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const cli = path.resolve(__dirname, '../chode.js');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-lifecycle-'));
try {
  const script = `
    const chode = require(${JSON.stringify(cli)});
    let active = 0, count = 0;
    chode.__testHooks.callAI = async (prompt) => {
      if (++active > 1) throw new Error('overlapping requests');
      const id = ++count;
      await new Promise(r => setTimeout(r, 25));
      active--;
      return { result: 'ANSWER_' + id, provider: 'fixture' };
    };
    chode.cmdAI([]);
  `;
  const r = spawnSync(process.execPath, ['-e', script], { cwd: temp, input: 'hello\nhi\n', encoding: 'utf8', timeout: 15000, windowsHide: true });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('ANSWER_1') && r.stdout.includes('ANSWER_2'), 'EOF must wait for both queued answers');
  assert.ok(r.stdout.indexOf('ANSWER_1') < r.stdout.indexOf('ANSWER_2'), 'prompts run in order');
  assert.ok(!r.stdout.includes('\x1b'), 'redirected answers remain plain');
  assert.ok(!r.stderr.includes('\x1b'), 'redirected diagnostics remain plain');
  assert.ok(!r.stderr.includes('overlapping requests'));
  console.log('✓ REPL lifecycle: ordered prompts, EOF drain, pure piped answers');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
