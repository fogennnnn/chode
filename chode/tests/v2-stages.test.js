'use strict';

// Slice 4 — classify/plan/verify/repair stages in runAgentLoop:
// (a) CLASSIFY heuristic, no LLM. (b) PLAN 1 call multi-step only, cap 6,
//     no tools, skipped single-step/read-only. (c) VERIFY mutating only:
//     cheap pre-gate, else 1 LLM call with a DIFFERENT provider/model on
//     facts only → PASS or FAIL:<check>; no DONE without PASS.
// (d) REPAIR ≤2 rounds then FAILED enumerating failed checks.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  const V2 = { quietFailures: true, v2: true };

  // ── (a) CLASSIFY: heuristic, no LLM call ──
  let c = chode.classifyTask('Show me the README');
  assert.strictEqual(c.kind, 'readonly', 'read-only prompt, got ' + c.kind);
  c = chode.classifyTask('Fix the typo in app.js');
  assert.strictEqual(c.kind, 'mutating', 'single file+verb single-step, got ' + c.kind);
  assert.strictEqual(c.multi, false, 'single-step must not be multi');
  c = chode.classifyTask('Clone the repo, build it and migrate the config');
  assert.strictEqual(c.kind, 'multistep', 'clone/build/migrate words, got ' + c.kind);
  c = chode.classifyTask('Read a.txt and read b.txt and read c.txt');
  assert.strictEqual(c.kind, 'multistep', '≥3 files referenced, got ' + c.kind);
  c = chode.classifyTask('Write app.js and update docs.md');
  assert.strictEqual(c.kind, 'multistep', '≥2 verbs, got ' + c.kind);

  // ── different-model rule: verifier never equals the drafter ──
  const vd = chode.pickVerifierId('ovh');
  assert.ok(vd && vd !== 'ovh' && chode.PROVIDERS[vd], 'verifier must differ, got ' + vd);
  assert.ok(chode.PROVIDERS[vd].requiresKey, 'verifier lane prefers keyed families, got ' + vd);
  assert.strictEqual(chode.parseVerifyVerdict('PASS').verdict, 'PASS');
  assert.strictEqual(chode.parseVerifyVerdict('FAIL: missing check in app.js').check, 'missing check in app.js');

  // ── single-step mutating task: PLAN skipped, ≤3 tool calls, VERIFY runs ──
  fs.writeFileSync(path.join(tmp, 'app.js'), 'console.log(1);\n', 'utf8');
  const seenS = [];
  const singleAI = async (prompt, sessionId, forceProvider) => {
    seenS.push({ prompt: String(prompt), force: forceProvider || null });
    const p = String(prompt);
    if (p.includes('[VERIFY')) return { result: 'PASS', provider: 'ovh', tokens: 1, latency: 1 };
    if (seenS.filter((s) => !s.prompt.includes('[VERIFY')).length === 1) {
      return { result: '```tool\n{"tool":"edit","args":{"file":"app.js","oldString":"console.log(1);","newString":"console.log(2);"}}\n```', provider: 'ovh', tokens: 1, latency: 1 };
    }
    return { result: 'DONE: fixed the typo.', provider: 'ovh', tokens: 1, latency: 1 };
  };
  const single = await chode.runAgentLoop('Fix the typo in app.js.', null, 'ovh', V2, singleAI);
  assert.strictEqual(single.planSkipped, true, 'single-step must skip PLAN');
  assert.ok(single.toolCalls <= 3, 'single-step ≤3 tool calls, got ' + single.toolCalls);
  assert.strictEqual(single.verifySkipped, false, 'mutating task must verify');
  assert.strictEqual(single.verifyVerdict, 'PASS', 'verifier PASS, got ' + single.verifyVerdict);
  const verifyCall = seenS.find((s) => s.prompt.includes('[VERIFY'));
  assert.ok(verifyCall, 'exactly one verifier LLM call');
  assert.ok(verifyCall.force && verifyCall.force !== 'ovh', 'verifier uses a DIFFERENT provider via force, got ' + verifyCall.force);
  assert.ok(!verifyCall.prompt.includes('fixed the typo') || verifyCall.prompt.includes('request:'), 'verifier gets request, not drafter prose');
  assert.ok(single.res.result.includes('DONE'), 'PASS keeps the DONE answer');

  // ── read-only task: no writes, VERIFY skipped, no snapshots ──
  const snapsBefore = new Set(chode.listSnapshots().map((s) => s.id));
  const roAI = async (prompt) => {
    const p = String(prompt);
    if (p.includes('[TOOL RESULTS')) return { result: 'Found it: console.log.', provider: 'mock', tokens: 1, latency: 1 };
    return { result: '```tool\n{"tool":"read","args":{"file":"app.js"}}\n```', provider: 'mock', tokens: 1, latency: 1 };
  };
  const ro = await chode.runAgentLoop('Show me app.js.', null, null, V2, roAI);
  assert.strictEqual(ro.classify.kind, 'readonly', 'read-only classification');
  assert.deepStrictEqual(ro.actions.writes, [], 'read-only task must not write');
  assert.strictEqual(ro.verifySkipped, true, 'read-only task skips VERIFY');
  assert.strictEqual(ro.planSkipped, true, 'read-only task skips PLAN');
  const snapsAfter = chode.listSnapshots().filter((s) => !snapsBefore.has(s.id));
  assert.strictEqual(snapsAfter.length, 0, 'read-only task takes no snapshots');

  // ── multi-step task: PLAN runs once, cap 6, targets feed guards ──
  let planCalls = 0;
  const multiAI = async (prompt) => {
    const p = String(prompt);
    if (p.includes('[PLAN')) {
      planCalls++;
      return { result: '1. Create app2.js — check: node --check app2.js\n2. Write docs.md — check: file exists\n3. Update readme.md — check: file exists', provider: 'mock', tokens: 5, latency: 1 };
    }
    if (p.includes('[VERIFY')) return { result: 'PASS', provider: 'ovh', tokens: 1, latency: 1 };
    multiAI.n = (multiAI.n || 0) + 1;
    if (multiAI.n === 1) return { result: '```tool\n{"tool":"write","args":{"file":"app2.js","content":"console.log(2);\\n"}}\n```', provider: 'mock', tokens: 1, latency: 1 };
    if (multiAI.n === 2) {
      return { result: '```tool\n[{"tool":"write","args":{"file":"docs.md","content":"# docs\\n"}},{"tool":"write","args":{"file":"readme.md","content":"# readme\\n"}}]\n```', provider: 'mock', tokens: 1, latency: 1 };
    }
    return { result: 'DONE: built all three.', provider: 'mock', tokens: 1, latency: 1 };
  };
  const multi = await chode.runAgentLoop('Build app2.js, write docs.md and update readme.md.', null, null, V2, multiAI);
  assert.strictEqual(planCalls, 1, 'PLAN costs exactly 1 LLM call');
  assert.strictEqual(multi.planSkipped, false, 'multi-step must plan');
  assert.ok(multi.planSteps.length === 3 && multi.planSteps.length <= 6, 'steps parsed + capped, got ' + multi.planSteps.length);
  assert.ok(['app2.js', 'docs.md', 'readme.md'].every((f) => fs.existsSync(path.join(tmp, f))), 'planned files written');
  assert.strictEqual(multi.verifyVerdict, 'PASS');

  // ── VERIFY FAIL → REPAIR (restore named snapshot) → FAILED enumerated ──
  fs.writeFileSync(path.join(tmp, 'ok.txt'), 'v1\n', 'utf8');
  const snap = chode.takeSnapshot('v2 stages fixture', ['ok.txt'], null);
  assert.ok(snap && snap.id, 'fixture snapshot taken');
  const seenR = [];
  const failAI = async (prompt) => {
    const p = String(prompt);
    seenR.push(p);
    if (p.includes('[PLAN')) return { result: '1. Migrate ok.txt to v2 — check: content is v2', provider: 'mock', tokens: 1, latency: 1 };
    if (p.includes('[VERIFY')) return { result: 'FAIL: content wrong in ok.txt, restore ' + snap.id, provider: 'ovh', tokens: 1, latency: 1 };
    if (p.includes('[REPAIR')) return { result: 'Tried the fix.', provider: 'mock', tokens: 1, latency: 1 };
    failAI.n = (failAI.n || 0) + 1;
    if (failAI.n === 1) return { result: '```tool\n{"tool":"edit","args":{"file":"ok.txt","oldString":"v1","newString":"v2"}}\n```', provider: 'mock', tokens: 1, latency: 1 };
    return { result: 'DONE: all good.', provider: 'mock', tokens: 1, latency: 1 };
  };
  const failed = await chode.runAgentLoop('Migrate ok.txt to v2.', null, null, V2, failAI);
  assert.strictEqual(failed.verifyVerdict, 'FAIL', 'verdict FAIL, got ' + failed.verifyVerdict);
  assert.ok(failed.repairRounds <= 2 && failed.repairRounds >= 1, 'REPAIR bounded ≤2, got ' + failed.repairRounds);
  assert.ok(/^FAILED/.test(failed.res.result), 'must report FAILED, got:\n' + String(failed.res.result).slice(0, 200));
  assert.ok(failed.res.result.includes('content wrong in ok.txt'), 'FAILED enumerates failed checks');
  assert.ok(!/^DONE/.test(failed.res.result), 'FAILED must never claim DONE');
  assert.strictEqual(fs.readFileSync(path.join(tmp, 'ok.txt'), 'utf8'), 'v1\n', 'named snapshot restored during repair');

  chode.__resetBoundedForTest();
  console.log('✓ v2 stages: classify, plan-once, verify-different-model, repair-then-FAILED');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-stages-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 90000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
