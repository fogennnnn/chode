'use strict';

// Polish regressions: flag-first audit routing, stale-fork exclusion,
// and rule precision (no w3.org-namespace / prose false positives).

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'chode.js');

function runAudit(cwd, target) {
  return spawnSync(process.execPath, [CLI, 'audit', '--no-ai', target], {
    cwd,
    encoding: 'utf8',
    timeout: 60000,
    windowsHide: true,
  });
}

function fixture() {
  const dir = path.join(process.cwd(), 'audited');
  fs.mkdirSync(dir, { recursive: true });
  // Fixture payloads are assembled by concatenation so this test file
  // itself stays clean under the repo's own audit.
  const ev = 'ev' + 'al';
  fs.writeFileSync(path.join(dir, 'evil.js'), 'const r = ' + ev + '(userInput);\n', 'utf8');
  fs.writeFileSync(path.join(dir, 'clean.js'), 'console.log("fine");\n', 'utf8');
  const realToken = 'abcdefghijklmnop' + '123456';
  fs.writeFileSync(
    path.join(dir, 'notes.md'),
    'xmlns="http://www.w3.org/2000/svg"\nBearer presence-only notes\nAuthorization: Bearer ' + realToken + '\n',
    'utf8'
  );

  // Flag-first invocation must audit the given path, not the CWD.
  const r = runAudit(process.cwd(), dir);
  assert.strictEqual(r.status, 0, 'audit must exit 0\n' + (r.stderr || ''));
  const out = (r.stdout || '') + (r.stderr || '');
  assert.ok(out.includes(dir), 'audit must target the given path, got:\n' + out.slice(0, 400));
  assert.ok(out.includes('evil.js'), 'audit must flag the dangerous sink in the target dir');
  assert.ok(!out.includes('SINK_INNERHTML'), 'no innerHTML here — output must stay precise');

  // Rule precision in the same directory run: the w3.org namespace line and
  // the "Bearer presence-only" prose stay quiet, while the real 22-char
  // bearer token still fires exactly once.
  assert.ok(!/w3\.org/.test(out), 'namespace URIs must not be reported as findings');
  const bearerHits = (out.match(/SECRET_BEARER/g) || []).length;
  assert.strictEqual(bearerHits, 1, 'exactly the real token must fire, got ' + bearerHits);
  assert.ok(!/presence-only/.test(out), 'prose must not be reported');

  // Stale forks never pollute tree audits: the dangerous sink under
  // chode/ and oldgreg/ must stay invisible when auditing the parent.
  for (const fork of ['chode', 'oldgreg']) {
    fs.mkdirSync(path.join(dir, fork), { recursive: true });
    fs.writeFileSync(path.join(dir, fork, 'stale.js'), 'const r = ' + ev + '(legacy);\n', 'utf8');
  }
  const r3 = runAudit(process.cwd(), dir);
  const out3 = (r3.stdout || '') + (r3.stderr || '');
  assert.ok(out3.includes('evil.js'), 'real target findings must survive fork exclusion');
  assert.ok(!out3.includes('stale.js'), 'stale-fork findings must be excluded from tree audits');

  console.log('✓ polish audit: flag-first routing, fork exclusion, rule precision');
}

if (process.argv[2] === '--fixture') {
  fixture();
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-polish-audit-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 90000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
