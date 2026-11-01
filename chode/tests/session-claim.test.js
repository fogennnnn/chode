'use strict';

// Session claim: a second chode in the same folder must not mirror the
// first one's turns. claimSession() holds a live pid-lock; a lock owned by
// a LIVE foreign pid returns a fresh unique session, a stale/dead-pid lock
// is claimable again (crash-safe), and unclaimed sessions are claimed in
// place. Hermetic via temp cwd (tests run with cwd = temp dir).

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CLI = process.argv[2] || path.join(__dirname, '..', 'chode.js');
process.chdir(os.tmpdir()); // isolated .chode
const chode = require(CLI);

const lockFile = path.join(process.cwd(), '.chode', 'sessions', 'default.lock');

// 1. Unclaimed session: claimed in place.
let claim = chode.claimSession('default');
assert.strictEqual(claim.id, 'default', 'free session keeps its id');
assert.strictEqual(claim.taken, false, 'free session not taken');
assert.ok(fs.existsSync(lockFile), 'lock file written');
let lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
assert.strictEqual(lock.pid, process.pid, 'lock records our pid');

// 2. Live foreign owner: fresh unique session instead of a takeover.
const sleeper = spawn(process.execPath, ['-e', 'setTimeout(function(){}, 4000);'], { stdio: 'ignore' });
lock = { pid: sleeper.pid, ts: Date.now() };
fs.writeFileSync(lockFile, JSON.stringify(lock), 'utf8');
const foreign = chode.claimSession('default');
assert.strictEqual(foreign.taken, true, 'live foreign pid => taken');
assert.strictEqual(foreign.owner, 'default', 'owner is the contested id');
assert.ok(/^auto-[a-z0-9]+-[a-z0-9]+$/.test(foreign.id), 'fresh id is auto-<ts>-<rand>: ' + foreign.id);

// 3. Dead-pid lock: claimable again (crash-safe).
sleeper.kill();
// Wait until the child is actually gone, then use its pid as a dead owner.
setTimeout(function () {
  const dead = chode.claimSession('default');
  // sleeper's pid just died (pid reuse in 600ms is astronomically unlikely):
  assert.strictEqual(dead.taken, false, 'dead-pid lock is claimable again');
  assert.strictEqual(dead.id, 'default', 'dead lock reclaims the same id');

  // 4. Own-pid lock: we already own it - no fresh diversion.
  const own = JSON.stringify({ pid: process.pid, ts: Date.now() });
  fs.writeFileSync(lockFile, own, 'utf8');
  const reclaim = chode.claimSession('default');
  assert.strictEqual(reclaim.taken, false, 'own-pid lock is not taken');
  assert.strictEqual(reclaim.id, 'default', 'own claim keeps the id');

  // 5. Overwrite doesn't break the session file listing shape (.lock ignored by .json scans).
  assert.ok(!fs.existsSync(path.join(process.cwd(), '.chode', 'sessions', 'default.json')), 'claim does not create a session file');

  console.log('session-claim: all assertions passed');
  process.exit(0);
}, 600);
