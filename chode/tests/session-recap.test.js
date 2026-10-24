'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');

  // Builder: verified run with changes.
  let lines = chode.sessionSummary(
    { completionStatus: 'VERIFIED', provider: 'kilo', tokens: 102, latency: 3100, browserVerification: { skipped: false } },
    { writes: ['index.html', 'app.js'], edits: ['app.js', 'styles.css'] },
    { acceptanceTest: 'acceptance.cjs', verbose: true }
  );
  assert.strictEqual(lines[0], 'Done: Verified');
  assert.ok(lines.some((l) => l === 'Files: wrote index.html, app.js; edited styles.css'), JSON.stringify(lines));
  assert.ok(lines.some((l) => /acceptance passed/.test(l) && /browser passed/.test(l)), JSON.stringify(lines));

  // Builder: quiet no-change continue.
  lines = chode.sessionSummary(
    { completionStatus: 'VERIFIED', provider: 'local', tokens: 0 },
    { writes: [], edits: [] },
    { acceptanceTest: 'acceptance.cjs', verbose: false }
  );
  assert.strictEqual(lines[0], 'Done: Verified');
  assert.ok(lines.includes('Files: no changes'), JSON.stringify(lines));
  assert.ok(lines.some((l) => /Model: local/.test(l)), JSON.stringify(lines));

  // Builder: partial with queued retry.
  lines = chode.sessionSummary(
    { completionStatus: 'PARTIAL', partial: true, queuedId: 'pend_1', provider: 'unavailable' },
    { writes: ['a.js'] },
    {}
  );
  assert.ok(lines[0].startsWith('Done: Queued'), JSON.stringify(lines));
  assert.ok(lines.some((l) => l.indexOf('/retry pend_1') !== -1), JSON.stringify(lines));
  assert.ok(!lines.some((l) => l.indexOf('chode ai --resume') !== -1), 'queued work points at its retry id: ' + JSON.stringify(lines));

  // Builder: failed run.
  lines = chode.sessionSummary({ completionStatus: 'FAILED', provider: 'ovh' }, {}, {});
  assert.strictEqual(lines[0], 'Done: Failed');

  // Builder: null-safe.
  assert.deepStrictEqual(chode.sessionSummary(null, null, null), []);

  // One-shot path: recap lands on stderr, stdout stays the bare answer.
  chode.__testHooks.callAI = async () => ({ provider: 'mock', result: 'hi', tokens: 3, latency: 4 });
  let err = '';
  const realWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, enc, cb) => { err += String(chunk); return realWrite(chunk, enc, cb); };
  let out = '';
  const realLog = console.log;
  console.log = (msg) => { out += String(msg) + '\n'; };
  try {
    await chode.cmdAI(['Say hi.', '--no-memory', '--no-web'], { cli: true });
  } finally {
    console.log = realLog;
    process.stderr.write = realWrite;
    chode.__testHooks.callAI = null;
  }
  assert.ok(err.includes('Done: Answered (no verification required)'), 'recap status on stderr: ' + err);
  assert.ok(err.includes('Files: no changes'), 'recap files on stderr: ' + err);
  assert.ok(!out.includes('Done:'), 'stdout stays the bare answer: ' + out);
  console.log('PASS session recap: builder lines for verified/partial/failed runs plus stderr-only one-shot recap');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-session-recap-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
