'use strict';

// Regression test for BUG-REA-RUNNER (found by sys1 live run):
// shell-free spawnSync('npx', …) dies with ENOENT on Windows because npx is
// npx.cmd. Core now resolves node+npx-cli.js on the real-spawn path while
// the mock hook keeps seeing cmd 'npx' (argv contract unchanged).
// Zero network, zero ghidra: resolution is filesystem-only, rewrite is pure.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const savedGhidra = process.env.GHIDRA_INSTALL_DIR;
  if (!process.env.GHIDRA_INSTALL_DIR) process.env.GHIDRA_INSTALL_DIR = 'C:\\tools\\ghidra_12.1.4_PUBLIC';

  // Runner resolves to something directly executable in this env.
  const runner = chode.resolveReaRunner();
  assert.ok(!runner.error, 'runner must resolve, got ' + runner.error);
  assert.ok(runner.cmd && fs.existsSync(runner.cmd), 'runner cmd exists: ' + runner.cmd);
  assert.ok(Array.isArray(runner.prefix), 'prefix is argv array');

  // Pure rewrite: npx contract in, executable route out.
  const spec = chode.reaArgv('analyze', 'C:\\t\\a.dll', undefined);
  assert.strictEqual(spec.cmd, 'npx', 'recorded contract still cmd npx');
  const routed = chode.reaRunnerArgv(spec.cmd, spec.argv);
  assert.ok(!routed.error, 'rewrite must succeed, got ' + routed.error);
  assert.strictEqual(routed.cmd, runner.cmd, 'rewritten to resolved runner');
  assert.deepStrictEqual(routed.argv.slice(0, runner.prefix.length), runner.prefix, 'prefix first');
  assert.deepStrictEqual(routed.argv.slice(runner.prefix.length), spec.argv, 'recorded argv preserved verbatim');
  assert.ok(!/\.cmd$/i.test(routed.cmd), 'never routes through a .cmd shim (needs a shell)');

  // Non-npx commands pass through untouched.
  assert.deepStrictEqual(chode.reaRunnerArgv('node', ['--version']), { cmd: 'node', argv: ['--version'] });

  // The rewritten route really executes shell-free: run node --version
  // through the SAME code path (no npx, no network, no ghidra).
  const r = require('child_process').spawnSync(routed.cmd, ['--version'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true,
  });
  assert.strictEqual(r.status, 0, 'resolved node executes, got ' + (r.error && r.error.message));
  assert.ok(/^v\d+\./.test(String(r.stdout).trim()), 'node version out, got ' + JSON.stringify(r.stdout));

  // Mock hook still observes the stable contract (existing v2-rea asserts this).
  let seen = null;
  chode.__testHooks.reaSpawn = (cmd, argv) => { seen = { cmd, argv }; return { status: 0, stdout: '{}', stderr: '' }; };
  try {
    await chode.toolReaAsync({ action: 'doctor' });
  } finally {
    chode.__testHooks.reaSpawn = null;
  }
  assert.ok(seen && seen.cmd === 'npx', 'mock sees cmd npx, got ' + JSON.stringify(seen && seen.cmd));

  if (savedGhidra === undefined) delete process.env.GHIDRA_INSTALL_DIR;
  else process.env.GHIDRA_INSTALL_DIR = savedGhidra;
  chode.__resetBoundedForTest();
  console.log('✓ rea-runner: node+npx-cli.js resolution, pure rewrite, shell-free exec, stable mock contract');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-rea-runner-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
