'use strict';

// Background jobs: start detached from the CLI lifetime, capture output to
// the log, stop on demand, reconcile dead processes. The fixture process
// itself holds the tree alive while polling (the same way a real terminal
// session does), so completion is observable here.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'chode.js');

function cli(cwd, args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (r.error) throw r.error;
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

async function fixture() {
  // NOTE: jobs are started in-process (not via spawned CLI) so the
  // supervisor's tree stays alive while polling — the same condition a
  // real terminal session provides. One-shot CLI spawns exit immediately,
  // which is exactly what the feature is for; reads go through the CLI.
  const chode = require('../chode.js');
  const tmp = process.cwd();
  fs.writeFileSync(path.join(tmp, 'job-quick.js'), 'console.log("job-output-ok");\n', 'utf8');
  fs.writeFileSync(path.join(tmp, 'job-slow.js'), 'setTimeout(() => {}, 60000);\n', 'utf8');

  // 1. Start returns immediately with a watchable id.
  const started = chode.startBackgroundJob('node job-quick.js');
  assert.ok(started.ok && started.job, 'bg start reports an id, got: ' + JSON.stringify(started));
  const quickId = started.job;

  // 2. Quick job completes with captured output.
  let out = '';
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    out = cli(tmp, ['jobs', quickId]).out;
    if (out.includes('[done]')) break;
  }
  assert.ok(out.includes('[done]'), 'quick job must reach done, got:\n' + out.slice(0, 400));
  assert.ok(out.includes('job-output-ok'), 'log output attached on show');

  // 3. Slow job can be stopped mid-flight.
  const startedSlow = chode.startBackgroundJob('node job-slow.js');
  assert.ok(startedSlow.ok, 'slow bg start works');
  const slowId = startedSlow.job;
  out = cli(tmp, ['jobs', slowId]).out;
  assert.ok(out.includes('[running]'), 'slow job running, got:\n' + out.slice(0, 300));
  out = cli(tmp, ['jobs', 'stop', slowId]).out;
  assert.ok(out.includes('Job stopped'), 'stop confirms, got:\n' + out.slice(0, 300));
  out = cli(tmp, ['jobs', slowId]).out;
  assert.ok(out.includes('[killed]'), 'stopped job shows killed');
  chode.__resetBoundedForTest();

  // 4. Validation paths stay clean.
  assert.ok(cli(tmp, ['jobs', 'nosuch']).out.includes('Unknown job'));
  assert.ok(cli(tmp, ['jobs', 'stop', 'nosuch']).out.includes('Unknown job'));
  assert.ok(cli(tmp, ['jobs', 'stop', quickId]).out.includes('not running'), 'stopping a finished job explains itself');
  assert.ok(cli(tmp, ['jobs']).out.includes('Background jobs'), 'list renders');

  // 5. Destructive commands never reach the background.
  out = cli(tmp, ['tool', 'exec', 'rm -rf /', '--bg', '--yes']).out;
  assert.ok(out.includes('denied: destructive command'), 'bg path enforces the denylist');

  console.log('✓ jobs: lifecycle, capture, stop, validation');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-jobs-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 120000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
