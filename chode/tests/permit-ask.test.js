'use strict';
// Permission ask-first: agent tool permission denials ask the user via
// ctx.onAsk when available instead of stopping the work. Granted = retry
// once with a one-time grant; denied = stop that branch; no onAsk (or ask
// cap reached) = today's hard denial, unchanged.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-permit-ask-'));
const cwd = process.cwd();
process.chdir(tmp);

function grantAll(questions) {
  return async function (q) {
    questions.push(String(q && q.question || ''));
    return { ok: true, selected: 'Allow once', index: 1 };
  };
}
function denyAll(questions) {
  return async function (q) {
    questions.push(String(q && q.question || ''));
    return { ok: true, selected: 'Deny', index: 0 };
  };
}

(async () => {
  const e = require('../chode.js');
  // Outside-workspace fixture: sibling of the workspace root.
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-permit-outside-'));
  const outsideFile = path.join(outsideDir, 'secret-plans.txt');
  fs.writeFileSync(outsideFile, 'outside content\n');

  // 1. Read outside workspace, user grants -> content flows, one question.
  let questions = [];
  let r = await e.runAgentTool({ tool: 'read', args: { file: outsideFile } }, { actions: {}, onAsk: grantAll(questions) });
  assert(r.ok, 'granted outside read should succeed: ' + JSON.stringify(r).slice(0, 200));
  assert.match(String(r.content || ''), /outside content/);
  assert.strictEqual(questions.length, 1, 'exactly one permission question, got ' + questions.length);
  assert.match(questions[0], /outside the workspace/);

  // 2. Same call again -> grant remembered, no second question.
  r = await e.runAgentTool({ tool: 'read', args: { file: outsideFile } }, { actions: {}, onAsk: grantAll(questions), permit: undefined });
  assert(r.ok, 'second read without shared ctx re-asks (fresh ctx)');
  assert.strictEqual(questions.length, 2);
  const shared = { actions: {}, onAsk: grantAll(questions) };
  await e.runAgentTool({ tool: 'read', args: { file: outsideFile } }, shared);
  const before = questions.length;
  r = await e.runAgentTool({ tool: 'read', args: { file: outsideFile } }, shared);
  assert(r.ok);
  assert.strictEqual(questions.length, before, 'one-time grant must not re-ask in the same run');

  // 3. Read outside workspace, user denies -> stops that branch.
  questions = [];
  r = await e.runAgentTool({ tool: 'read', args: { file: outsideFile } }, { actions: {}, onAsk: denyAll(questions) });
  assert(!r.ok, 'denied read must fail');
  assert.match(String(r.error || ''), /denied by user/);
  assert.strictEqual(questions.length, 1);
  // Denial remembered: no second question for the same key.
  r = await e.runAgentTool({ tool: 'read', args: { file: outsideFile } }, { actions: {}, onAsk: denyAll(questions), permit: undefined });
  assert(!r.ok);

  // 4. No onAsk (headless) -> today's hard denial, unchanged, nothing asked.
  r = await e.runAgentTool({ tool: 'read', args: { file: outsideFile } }, { actions: {} });
  assert(!r.ok);
  assert.match(String(r.error || ''), /denied: outside workspace/);
  assert(!/denied by user/.test(String(r.error || '')));

  // 5. Secret paths are never askable, even with onAsk present.
  questions = [];
  const envFile = path.join(tmp, '.env');
  fs.writeFileSync(envFile, 'KEY=abc\n');
  r = await e.runAgentTool({ tool: 'read', args: { file: '.env' } }, { actions: {}, onAsk: grantAll(questions) });
  assert(!r.ok);
  assert.match(String(r.error || ''), /denied: secret path/);
  assert.strictEqual(questions.length, 0, 'secret paths must never trigger a question');

  // 6. Write outside workspace, granted -> file written.
  questions = [];
  const outTarget = path.join(outsideDir, 'agent-note.txt');
  r = await e.runAgentTool({ tool: 'write', args: { file: outTarget, content: 'granted write\n' } }, { actions: {}, onAsk: grantAll(questions) });
  assert(r.ok, 'granted outside write should succeed: ' + JSON.stringify(r).slice(0, 200));
  assert.strictEqual(fs.readFileSync(outTarget, 'utf8'), 'granted write\n');
  assert.strictEqual(questions.length, 1);

  // 7. Delegated scope denial, granted -> scope extends, write succeeds.
  questions = [];
  fs.writeFileSync(path.join(tmp, 'owned.js'), 'module.exports=1;\n');
  const scopeCtx = { actions: {}, scopeTargets: ['owned.js'], onAsk: grantAll(questions) };
  r = await e.runAgentTool({ tool: 'write', args: { file: 'extra.js', content: 'module.exports=2;\n' } }, scopeCtx);
  assert(r.ok, 'granted scope extension should succeed: ' + JSON.stringify(r).slice(0, 200));
  assert(scopeCtx.scopeTargets.indexOf('extra.js') !== -1, 'grant extends the delegated scope');
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'extra.js'), 'utf8'), 'module.exports=2;\n');

  // 8. Ask cap: distinct denials stop asking after the cap, original error survives.
  questions = [];
  const capCtx = { actions: {}, onAsk: grantAll(questions) };
  for (let i = 0; i < 5; i++) {
    r = await e.runAgentTool({ tool: 'read', args: { file: path.join(outsideDir, 'missing-' + i + '.txt') } }, capCtx);
    assert(!r.ok);
  }
  assert(questions.length <= 3, 'ask cap must bound user questions, got ' + questions.length);
  assert.match(String(r.error || ''), /cannot read|denied: outside workspace/, 'post-cap denial keeps its original error');

  // 9. Blocked exec command, granted -> gate bypassed (command itself then runs and fails on its own terms).
  questions = [];
  r = await e.runAgentTool({ tool: 'exec', args: { cmd: 'bcdedit' } }, { actions: {}, onAsk: grantAll(questions) });
  assert(!/denied: destructive command/.test(String((r && r.error) || '')), 'grant must bypass the destructive-command gate: ' + JSON.stringify(r).slice(0, 200));
  assert.strictEqual(questions.length, 1);

  console.log('PASS permit-ask: denials ask first, granted retries once, denied stops, headless unchanged');
})().catch((err) => { console.error(err); process.exitCode = 1; }).finally(() => {
  process.chdir(cwd);
  fs.rmSync(tmp, { recursive: true, force: true });
});
