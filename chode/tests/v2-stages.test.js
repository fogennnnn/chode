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

  // Classification must use the original task, not the tool manifest or
  // automatic context prepended to the model's execution prompt.
  const okTask = 'Reply with the single word OK.';
  const okCalls = [];
  const okLoop = await chode.runAgentLoop(
    chode.agentToolPrompt() + '\n\n[AUTOMATIC WEB INSPECTION context]\n\n' + okTask,
    null, null, V2,
    async prompt => { okCalls.push(String(prompt)); return { result: 'OK', provider: 'mock', tokens: 1, latency: 1 }; },
    null, null, { originalTask: okTask }
  );
  assert.strictEqual(okLoop.classify.kind, 'readonly', 'manifest verbs do not contaminate read-only classification');
  assert.strictEqual(okLoop.planSkipped, true);
  assert.strictEqual(okLoop.verifySkipped, true);
  assert.strictEqual(okLoop.completionStatus, 'NOT_REQUIRED');
  assert.strictEqual(okCalls.length, 1, 'read-only task uses no plan or verifier calls');
  assert.ok(okCalls[0].includes('[CHODE AGENT TOOLS'), 'enriched prompt remains available for actual model execution');
  assert.ok(!okCalls[0].includes('[PLAN —'), 'read-only execution prompt does not trigger a plan stage');

  const pageTask = 'Build a page from the source, recreate its layout, copy its content, and save it as index.html.';
  const pageCalls = [];
  const pageLoop = await chode.runAgentLoop(
    chode.agentToolPrompt() + '\n\n[AUTOMATIC WEB INSPECTION context]\n\n' + pageTask,
    null, null, V2,
    async prompt => {
      pageCalls.push(String(prompt));
      if (String(prompt).includes('[PLAN')) return { result: '1. Create index.html — check: file exists', provider: 'mock', tokens: 1, latency: 1 };
      return { result: '', provider: 'mock', tokens: 0, latency: 0 };
    },
    null, null, { originalTask: pageTask }
  );
  assert.strictEqual(pageLoop.classify.kind, 'multistep', 'page build/copy/save request stays multi-step');
  assert.strictEqual(pageLoop.classify.mutating, true);
  assert.ok(['recreate', 'copy', 'save'].every(v => pageLoop.classify.verbs.includes(v)), 'web-copy verbs are classified explicitly');
  assert.strictEqual(pageLoop.planSkipped, false, 'actual page task still plans');
  assert.strictEqual(pageLoop.verifySkipped, true, 'empty mocked draft exits before verification');
  assert.strictEqual(pageCalls.filter(p => p.includes('[PLAN')).length, 1);
  assert.ok(pageCalls[0].includes(pageTask), 'plan receives only the original task');
  assert.ok(!pageCalls[0].includes('[CHODE AGENT TOOLS') && !pageCalls[0].includes('[AUTOMATIC WEB INSPECTION'), 'plan excludes tool and page-context injection');
  assert.ok(pageCalls[1].includes('[CHODE AGENT TOOLS'), 'actual execution still receives the enriched prompt');

  // ── different-model rule: verifier never equals the drafter ──
  const verifierKey = chode.PROVIDERS.cloudflare.requiresKey;
  const previousKey = process.env[verifierKey];
  try {
    process.env[verifierKey] = 'synthetic-fixture-key';
    const vd = chode.pickVerifierId('ovh');
    assert.ok(vd && vd !== 'ovh' && chode.PROVIDERS[vd].requiresKey, 'configured keyed verifier preferred');
  } finally { if (previousKey === undefined) delete process.env[verifierKey]; else process.env[verifierKey] = previousKey; }
  const reachableVerifier = chode.pickVerifierId('ovh');
  assert.ok(reachableVerifier && reachableVerifier !== 'ovh');
  if (!Object.values(chode.PROVIDERS).some(p => p.requiresKey && process.env[p.requiresKey])) {
    assert.ok(!chode.PROVIDERS[reachableVerifier].requiresKey, 'without configured keys prefer an available keyless verifier');
  }
  assert.strictEqual(chode.parseVerifyVerdict('PASS').verdict, 'PASS');
  assert.strictEqual(chode.parseVerifyVerdict('FAIL: missing check in app.js').check, 'missing check in app.js');
  assert.strictEqual(chode.parseVerifyVerdict('The verifier says PASS').verdict, 'UNCLEAR', 'prose containing PASS is not a verdict');
  assert.strictEqual(chode.parseVerifyVerdict('PASS\nMore details').verdict, 'UNCLEAR', 'verdict must be one exact protocol line');

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
  const singleTask = 'Fix the typo in app.js.';
  const single = await chode.runAgentLoop(chode.agentToolPrompt() + '\n\n' + singleTask, null, 'ovh', V2, singleAI,
    null, null, { originalTask: singleTask });
  assert.strictEqual(single.planSkipped, true, 'single-step must skip PLAN');
  assert.ok(single.toolCalls <= 3, 'single-step ≤3 tool calls, got ' + single.toolCalls);
  assert.strictEqual(single.verifySkipped, false, 'mutating task must verify');
  assert.strictEqual(single.verifyVerdict, 'PASS', 'verifier PASS, got ' + single.verifyVerdict);
  assert.strictEqual(single.completionStatus, 'VERIFIED');
  const verifyCall = seenS.find((s) => s.prompt.includes('[VERIFY'));
  assert.ok(verifyCall, 'exactly one verifier LLM call');
  assert.ok(verifyCall.force && verifyCall.force !== 'ovh', 'verifier uses a DIFFERENT provider via force, got ' + verifyCall.force);
  assert.ok(verifyCall.prompt.includes('Request:\n' + singleTask), 'verifier gets the original user request');
  assert.ok(!verifyCall.prompt.includes('[CHODE AGENT TOOLS'), 'verifier excludes tool-manifest instructions');
  assert.ok(!verifyCall.prompt.includes('fixed the typo') || verifyCall.prompt.includes('request:'), 'verifier gets request, not drafter prose');
  assert.ok(single.res.result.includes('DONE'), 'PASS keeps the DONE answer');

  // A successful model-written no-op self-test is only local evidence. If
  // the independent verifier is unavailable, a mutating task stays UNVERIFIED.
  const selfTestTask = 'Write generated-parser.js and package.json with a self-test.';
  const selfTestCalls = [];
  const selfTestAI = async prompt => {
    const p = String(prompt);
    selfTestCalls.push(p);
    if (p.includes('[PLAN')) {
      return { result: '1. Create generated-parser.js — check: npm test', provider: 'mock', tokens: 1, latency: 1 };
    }
    if (p.includes('[VERIFY')) return null;
    if (p.includes('[TOOL RESULTS')) return { result: 'DONE: parser and self-test are ready.', provider: 'mock', tokens: 1, latency: 1 };
    const parser = "if(process.argv.includes('--self-test'))process.exit(0);\nmodule.exports={parseCsv:function(line){return line.split(',')}};\n";
    const pkg = JSON.stringify({ scripts: { test: 'node generated-parser.js --self-test' } });
    return {
      result: '```tool\n' + JSON.stringify([
        { tool: 'write', args: { file: 'generated-parser.js', content: parser } },
        { tool: 'write', args: { file: 'package.json', content: pkg } }
      ]) + '\n```',
      provider: 'mock', tokens: 1, latency: 1
    };
  };
  const selfTestLoop = await chode.runAgentLoop(selfTestTask, null, null, V2, selfTestAI);
  assert.ok(fs.statSync(path.join(tmp, 'generated-parser.js')).size > 0, 'generated output exists and is nonempty');
  assert.strictEqual(selfTestLoop.verifyVerdict, null, 'missing verifier remains the actual verifier result');
  assert.strictEqual(selfTestLoop.verifySkipped, false, 'independent verifier was attempted');
  assert.strictEqual(selfTestLoop.completionStatus, 'UNVERIFIED');
  assert.ok(/^UNVERIFIED:/.test(selfTestLoop.res.result), selfTestLoop.res.result);
  assert.ok(!/^DONE/.test(selfTestLoop.res.result), 'local no-op self-test cannot certify completion');
  assert.strictEqual(selfTestLoop.repairRounds, 0, 'verifier unavailability is terminal, with no repair calls');
  assert.strictEqual(selfTestCalls.filter(p => p.includes('[VERIFY')).length, 1);
  assert.strictEqual(selfTestCalls.filter(p => p.includes('[REPAIR')).length, 0);

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
  const repairTask = 'Migrate ok.txt to v2.';
  const failed = await chode.runAgentLoop(chode.agentToolPrompt() + '\n\n' + repairTask, null, null, V2, failAI,
    null, null, { originalTask: repairTask });
  assert.strictEqual(failed.verifyVerdict, 'FAIL', 'verdict FAIL, got ' + failed.verifyVerdict);
  assert.strictEqual(failed.completionStatus, 'FAILED');
  assert.ok(failed.repairRounds <= 2 && failed.repairRounds >= 1, 'REPAIR bounded ≤2, got ' + failed.repairRounds);
  assert.ok(/^FAILED/.test(failed.res.result), 'must report FAILED, got:\n' + String(failed.res.result).slice(0, 200));
  assert.ok(failed.res.result.includes('content wrong in ok.txt'), 'FAILED enumerates failed checks');
  assert.ok(!/^DONE/.test(failed.res.result), 'FAILED must never claim DONE');
  const repairPrompt = seenR.find(p => p.includes('[REPAIR round'));
  assert.ok(repairPrompt && repairPrompt.includes('Original request: ' + repairTask), 'repair retains original task reference');
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
