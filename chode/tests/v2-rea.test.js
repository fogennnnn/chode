'use strict';

// REA tool: manifest/dispatch, arg building + timeout clamp, path guards,
// GHIDRA fast-fail, provider_unavailable honesty, evidence trimming + spill,
// doctor parsing, prompt line, VERIFY facts. Zero network, zero heavyweight:
// the rea binary is mocked via __testHooks.reaSpawn — real npx/ghidra never runs.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const hooks = chode.__testHooks;
  const tmp = process.cwd();
  const savedGhidra = process.env.GHIDRA_INSTALL_DIR;
  if (!process.env.GHIDRA_INSTALL_DIR) process.env.GHIDRA_INSTALL_DIR = tmp;

  const spawned = [];
  function mockSpawn(reply) {
    spawned.length = 0;
    hooks.reaSpawn = (cmd, argv, opts) => {
      spawned.push({ cmd, argv, opts });
      return typeof reply === 'function' ? reply(cmd, argv, opts) : reply;
    };
  }

  // Dummy local PE (content never executed — spawn is mocked).
  fs.writeFileSync(path.join(tmp, 'sample.dll'), 'MZ' + 'x'.repeat(100), 'utf8');

  // ── Manifest + dispatch wiring ──
  assert.ok(chode.TOOLS.rea && /read-only/i.test(chode.TOOLS.rea.desc) && /never writes/i.test(chode.TOOLS.rea.desc),
    'rea in manifest as read-only, got ' + JSON.stringify(chode.TOOLS.rea));
  const parsed = chode.parseToolCalls('```tool\n{"tool":"rea","args":{"action":"analyze","path":"sample.dll"}}\n```');
  assert.strictEqual(parsed.length, 1, 'rea blocks parse');
  assert.strictEqual(parsed[0].tool, 'rea');
  const deferred = chode.toolExec('rea', { action: 'doctor' });
  assert.ok(deferred.async && !deferred.ok, 'sync toolExec defers rea to the agent loop');

  // ── Arg building + timeout clamp (argv, never shell) ──
  let spec = chode.reaArgv('analyze', 'C:\\t\\a.dll', undefined);
  assert.strictEqual(spec.cmd, 'npx', 'spawned via npx');
  assert.deepStrictEqual(spec.argv, ['-y', 'rea-agents@6.5.0', 'analyze', 'C:\\t\\a.dll', '--provider', 'ghidra', '--format', 'json']);
  assert.strictEqual(spec.timeoutMs, 600000, 'generous default timeout');
  assert.strictEqual(chode.reaClampTimeout(99999999), 1800000, 'timeout capped');
  assert.strictEqual(chode.reaClampTimeout('garbage'), 600000, 'bad timeout falls back');
  assert.strictEqual(chode.reaClampTimeout(-5), 600000, 'non-positive falls back');
  spec = chode.reaArgv('doctor', '', 60000);
  assert.ok(spec.argv.includes('doctor') && spec.timeoutMs === 60000, 'doctor argv + override');

  // ── Path guardrails: machine-readable, no spawn ──
  mockSpawn({ status: 0, stdout: '{}', stderr: '' });
  for (const [args, code] of [
    [{ action: 'analyze', path: '' }, 'ERR_REA_EMPTY_PATH'],
    [{ action: 'analyze', path: 'https://example.com/a.dll' }, 'ERR_REA_REMOTE_PATH'],
    [{ action: 'analyze', path: '\\\\srv\\share\\a.dll' }, 'ERR_REA_UNC_PATH'],
    [{ action: 'analyze', path: 'missing.dll' }, 'ERR_REA_NOT_FOUND'],
  ]) {
    const r = await chode.toolReaAsync(args);
    assert.ok(!r.ok && r.code === code, JSON.stringify(args) + ' → ' + code + ', got ' + JSON.stringify(r));
  }
  assert.strictEqual(spawned.length, 0, 'rejected targets must never spawn');
  assert.strictEqual((await chode.toolReaAsync({ action: 'bogus' })).code, 'ERR_REA_BAD_ACTION');

  // ── Missing GHIDRA_INSTALL_DIR: exact fast-fail, no run ──
  delete process.env.GHIDRA_INSTALL_DIR;
  try {
    const r = await chode.toolReaAsync({ action: 'analyze', path: 'sample.dll' });
    assert.ok(!r.ok && r.code === 'ERR_REA_NO_GHIDRA_DIR', 'analyze fast-fails, got ' + JSON.stringify(r));
    assert.strictEqual(r.error, 'GHIDRA_INSTALL_DIR is not set in this process. Set it at user level to C:\\tools\\ghidra_12.1.4_PUBLIC (and JAVA_HOME to a JDK 17+) and restart this process, then rerun.');
    const d = await chode.toolReaAsync({ action: 'doctor' });
    assert.ok(!d.ok && d.code === 'ERR_REA_NO_GHIDRA_DIR' && d.error === r.error, 'doctor fast-fails identically');
    assert.strictEqual(spawned.length, 0, 'fast-fail must not spawn');
  } finally {
    process.env.GHIDRA_INSTALL_DIR = tmp;
  }

  // ── provider_unavailable surfaces honestly, never faked ──
  mockSpawn({ status: 1, stdout: '', stderr: 'Error: ghidra provider unavailable (Hopper is macOS-only)' });
  let r = await chode.toolReaAsync({ action: 'analyze', path: 'sample.dll' });
  assert.ok(!r.ok && r.code === 'ERR_REA_PROVIDER_UNAVAILABLE' && r.available === false, 'stderr shape, got ' + JSON.stringify(r));
  assert.ok(/^provider_unavailable:/.test(r.error), 'machine-readable prefix');
  assert.ok(!('evidence' in r), 'no synthesized evidence on failure');
  mockSpawn({ status: 0, stdout: JSON.stringify({ provider_available: false, error: 'no backend' }), stderr: '' });
  r = await chode.toolReaAsync({ action: 'analyze', path: 'sample.dll' });
  assert.ok(!r.ok && r.code === 'ERR_REA_PROVIDER_UNAVAILABLE', 'JSON flag shape, got ' + JSON.stringify(r));

  // ── Evidence trimming: counts present, limitations preserved ──
  const evidenceJson = {
    sha256: 'abc123',
    format: 'pe',
    arch: 'x86-64',
    segments: [{}, {}, {}, {}, {}],
    procedure_count: 42,
    string_count: 1337,
    limitations: ['packed section skipped', 'no symbols'],
  };
  mockSpawn({ status: 0, stdout: JSON.stringify(evidenceJson), stderr: '' });
  r = await chode.toolReaAsync({ action: 'analyze', path: 'sample.dll' });
  assert.ok(r.ok, 'analyze ok, got ' + JSON.stringify(r));
  assert.deepStrictEqual(
    [r.evidence.digest, r.evidence.format, r.evidence.arch, r.evidence.segments, r.evidence.procedures, r.evidence.strings],
    ['abc123', 'pe', 'x86-64', 5, 42, 1337], 'trimmed evidence, got ' + JSON.stringify(r.evidence));
  assert.deepStrictEqual(r.evidence.limitations, ['packed section skipped', 'no symbols'], 'limitations preserved');
  assert.ok(r.full && r.full.sha256 === 'abc123', 'small full JSON returned inline');
  assert.ok(spawned[0].cmd === 'npx' && Array.isArray(spawned[0].argv) && spawned[0].argv[0] === '-y', 'spawn argv, no shell');

  // ── Full JSON >50KiB spills via the existing spill mechanism ──
  const big = Object.assign({}, evidenceJson, { strings_blob: 's'.repeat(60 * 1024) });
  mockSpawn({ status: 0, stdout: JSON.stringify(big), stderr: '' });
  r = await chode.toolReaAsync({ action: 'analyze', path: 'sample.dll' });
  assert.ok(r.ok && r.evidence.procedures === 42, 'evidence still trimmed on spill');
  assert.ok(r.spilledTo && r.spilledTo.startsWith('.chode/tool-output/'), 'spill path, got ' + r.spilledTo);
  assert.ok(!('full' in r), 'oversize full JSON not inlined');
  assert.ok(fs.existsSync(path.join(tmp, r.spilledTo)), 'spilled file on disk');
  assert.ok(JSON.parse(fs.readFileSync(path.join(tmp, r.spilledTo), 'utf8')).sha256 === 'abc123', 'spilled file holds full JSON');

  // ── doctor: healthy/unhealthy parsing, failing names only ──
  mockSpawn({ status: 0, stdout: JSON.stringify({ checks: [{ name: 'ghidra', ok: true }, { name: 'java', ok: true }] }), stderr: '' });
  let d = await chode.toolReaAsync({ action: 'doctor' });
  assert.ok(d.ok && d.healthy === true && d.failing.length === 0, 'healthy, got ' + JSON.stringify(d));
  mockSpawn({ status: 1, stdout: JSON.stringify({ checks: [{ name: 'ghidra', ok: true }, { name: 'java', ok: false }] }), stderr: '' });
  d = await chode.toolReaAsync({ action: 'doctor' });
  assert.ok(d.ok && d.healthy === false && d.failing.length === 1 && d.failing[0] === 'java', 'unhealthy names only, got ' + JSON.stringify(d));

  // ── Agent-loop dispatch + VERIFY facts ──
  mockSpawn({ status: 0, stdout: JSON.stringify(evidenceJson), stderr: '' });
  const ctx = { actions: {} };
  const looped = await chode.runAgentTool({ tool: 'rea', args: { action: 'analyze', path: 'sample.dll' } }, ctx);
  assert.ok(looped.ok && looped.evidence.digest === 'abc123', 'loop dispatch, got ' + JSON.stringify(looped).slice(0, 200));
  const facts = chode.toolObservedFacts('Is sample.dll packed?', [], ctx.actions);
  assert.ok(facts.includes('digest=abc123') && facts.includes('procedures=42') && facts.includes('strings=1337'), 'VERIFY facts carry rea evidence:\n' + facts);

  // ── Prompt knowledge loop ──
  const prompt = chode.agentToolPrompt();
  assert.ok(prompt.includes('rea {action:analyze|doctor'), 'Available-tools line lists rea');
  assert.ok(/rea tool/i.test(prompt) && /tool-observed facts/i.test(prompt), 'capability line treats evidence as facts');

  hooks.reaSpawn = null;
  if (savedGhidra === undefined) delete process.env.GHIDRA_INSTALL_DIR;
  else process.env.GHIDRA_INSTALL_DIR = savedGhidra;
  chode.__resetBoundedForTest();
  console.log('✓ rea: manifest, argv/clamp, guards, fast-fail, honesty, trim+spill, doctor, facts');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-rea-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
