'use strict';

// Piped stdin must drive the REPL (not hang on the key gate) and exit 0
// on EOF. Uses spawn input (real newlines) to avoid shell quoting quirks.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'chode.js');

function fixture() {
  const run = (input) => spawnSync(process.execPath, [CLI], {
    cwd: process.cwd(),
    input,
    encoding: 'utf8',
    timeout: 60000,
    windowsHide: true,
  });

  // Slash commands over a pipe, then EOF.
  let r = run('status\n/queue\n/tools\n');
  assert.strictEqual(r.status, 0, 'piped REPL must exit 0\n' + (r.stderr || ''));
  const out = (r.stdout || '') + (r.stderr || '');
  assert.ok(out.includes('Providers:'), 'status must run over a pipe');
  assert.ok(out.includes('Queued tasks'), '/queue must run over a pipe');
  assert.ok(out.includes('Agent tools:'), '/tools must run over a pipe');
  assert.ok(out.includes('Session kept'), 'EOF must close the session cleanly');

  // Bare EOF with no input still exits 0 without hanging on the key gate.
  r = run('');
  assert.strictEqual(r.status, 0, 'empty pipe must exit 0, not hang');
  assert.ok(((r.stdout || '') + (r.stderr || '')).includes("I'm chode"), 'banner must print');

  console.log('✓ repl pipe: commands run, EOF exits cleanly, no key-gate hang');
}

if (process.argv[2] === '--fixture') {
  try {
    fixture();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-repl-pipe-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 120000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
