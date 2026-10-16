'use strict';

// Regression test for BUG-REA-SUBSTANCE (found by sys1 live run):
// valid evidence whose stderr mentions "Hopper is macOS-only" was
// misclassified provider_unavailable. Substantive evidence (ids, subject,
// or counts) means the provider RAN; only evidence-free output can be
// provider_unavailable. Zero network, zero ghidra (mocked spawn).

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  const savedGhidra = process.env.GHIDRA_INSTALL_DIR;
  if (!process.env.GHIDRA_INSTALL_DIR) process.env.GHIDRA_INSTALL_DIR = 'C:\\tools\\ghidra_12.1.4_PUBLIC';
  fs.writeFileSync(path.join(tmp, 'sample.dll'), 'MZ' + 'x'.repeat(64), 'utf8');

  // Informational hopper chatter + real substance => success, not unavailable.
  chode.__testHooks.reaSpawn = () => ({
    status: 0,
    stdout: JSON.stringify({
      evidence_id: 'ev_live',
      subject: { name: 'sample.dll', digest: { sha256: 'deadbeef' } },
      segments: [{ name: '.text' }],
      procedure_count: 10,
      string_count: 20,
    }),
    stderr: 'note: Hopper is macOS-only, skipped',
  });
  let r;
  try {
    r = await chode.toolReaAsync({ action: 'analyze', path: 'sample.dll' });
  } finally {
    chode.__testHooks.reaSpawn = null;
  }
  assert.ok(r.ok === true, 'substantive evidence must succeed, got ' + JSON.stringify(r).slice(0, 300));
  assert.strictEqual(r.evidence.procedures, 10, 'counts trimmed, got ' + JSON.stringify(r.evidence));

  // Evidence-free + provider text => still honestly unavailable.
  chode.__testHooks.reaSpawn = () => ({ status: 1, stdout: '', stderr: 'ghidra provider unavailable' });
  try {
    r = await chode.toolReaAsync({ action: 'analyze', path: 'sample.dll' });
  } finally {
    chode.__testHooks.reaSpawn = null;
  }
  assert.ok(!r.ok && r.code === 'ERR_REA_PROVIDER_UNAVAILABLE', 'empty output stays unavailable, got ' + JSON.stringify(r));

  // Live shape pins (whoami.exe, REA 6.5.0): nested subject digest object +
  // normalized_result scope for counts. Never String() an object.
  chode.__testHooks.reaSpawn = () => ({
    status: 0,
    stdout: JSON.stringify({
      subject: { name: 'a.exe', digest: { sha256: 'abc9' }, format: 'pe', architecture: 'x86_64' },
      normalized_result: { segments: [{ name: '.text' }], segment_count: 1, procedure_count: 7, string_count: 9 },
    }),
    stderr: '',
  });
  try {
    r = await chode.toolReaAsync({ action: 'analyze', path: 'sample.dll' });
  } finally {
    chode.__testHooks.reaSpawn = null;
  }
  assert.ok(r.ok === true, 'live shape succeeds, got ' + JSON.stringify(r).slice(0, 300));
  assert.strictEqual(r.evidence.digest, 'abc9', 'nested digest dug out, got ' + JSON.stringify(r.evidence.digest));
  assert.strictEqual(r.evidence.procedures, 7, 'normalized_result procedures');
  assert.strictEqual(r.evidence.strings, 9, 'normalized_result strings');
  assert.strictEqual(r.evidence.segments, 1, 'normalized_result segments');
  assert.strictEqual(r.evidence.arch, 'x86_64', 'subject architecture');

  // reaHasSubstance unit pins.
  assert.strictEqual(chode.reaHasSubstance({ evidence_id: 'x' }), true);
  assert.strictEqual(chode.reaHasSubstance({ subject: { name: 'a' } }), true);
  assert.strictEqual(chode.reaHasSubstance({ procedure_count: 0 }), true);
  assert.strictEqual(chode.reaHasSubstance({ note: 'hopper macos-only' }), false);
  assert.strictEqual(chode.reaHasSubstance({}), false);

  if (savedGhidra === undefined) delete process.env.GHIDRA_INSTALL_DIR;
  else process.env.GHIDRA_INSTALL_DIR = savedGhidra;
  chode.__resetBoundedForTest();
  console.log('✓ rea-substance: evidence beats chatter, empty stays unavailable');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-rea-substance-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
