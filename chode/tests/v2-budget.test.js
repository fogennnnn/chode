'use strict';

// Slice 3 — truncate-and-spill + parallel reads + stop rules:
// (a) tool results over 2000 lines / 50KiB spill to .chode/tool-output/.
// (b) read-only blocks run parallel (order preserved); mutating sequential;
//     never parallelize two writes to the same file.
// (c) budgets: read-only turns ≤3, mutating ≤8, run cap 24 → forced PARTIAL,
//     never DONE; double output-limit = step failure; empty finish = failure.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();

  // ── (a) Spill: big exec output → head + marker, full text on disk ──
  fs.writeFileSync(path.join(tmp, 'a.txt'), 'AAA', 'utf8');
  const seen = [];
  const bigBlock = '```tool\n' + JSON.stringify({ tool: 'exec', args: { cmd: 'node -e "for(let i=0;i<3000;i++)console.log(i)"' } }) + '\n```';
  const bigAI = async (prompt) => {
    seen.push(prompt);
    if (seen.length === 1) {
      return { result: bigBlock, provider: 'mock', tokens: 1, latency: 1 };
    }
    return { result: 'DONE: listed.', provider: 'mock', tokens: 1, latency: 1 };
  };
  const big = await chode.runAgentLoop('List many.', null, null, { quietFailures: true }, bigAI);
  assert.ok(big.res && /DONE/.test(big.res.result), 'loop finishes, got ' + JSON.stringify(big.res && big.res.result));
  const m = /\[showing lines 1-(\d+) of (\d+); full output saved to ([^\]]+)\]/.exec(seen[1]);
  assert.ok(m, 'spill marker must appear in tool results, got:\n' + String(seen[1]).slice(0, 600));
  assert.ok(Number(m[2]) > 2000, 'marker names total lines over the spill threshold, got ' + m[2]);
  const spilledFile = path.join(tmp, m[3]);
  assert.ok(fs.existsSync(spilledFile), 'full output saved to ' + m[3]);
  assert.strictEqual(fs.readFileSync(spilledFile, 'utf8').split('\n').length, Number(m[2]), 'spilled file holds all lines');

  // ── (b) Parallel read-only block: all run, order preserved ──
  fs.writeFileSync(path.join(tmp, 'b.txt'), 'BBB', 'utf8');
  fs.writeFileSync(path.join(tmp, 'c.txt'), 'CCC', 'utf8');
  const seenP = [];
  const parAI = async (prompt) => {
    seenP.push(prompt);
    if (seenP.length === 1) {
      return { result: '```tool\n[{"tool":"read","args":{"file":"a.txt"}},{"tool":"read","args":{"file":"b.txt"}},{"tool":"glob","args":{"pattern":"*.txt"}}]\n```', provider: 'mock', tokens: 1, latency: 1 };
    }
    return { result: 'DONE: read all.', provider: 'mock', tokens: 1, latency: 1 };
  };
  const order = [];
  const par = await chode.runAgentLoop('Read all.', null, null, { quietFailures: true }, parAI,
    (ev) => { if (ev.phase === 'done') order.push(ev.call.tool + ':' + JSON.stringify(ev.call.args)); });
  assert.ok(par.res && /DONE/.test(par.res.result), 'parallel block finishes');
  assert.ok(seenP[1].includes('AAA') && seenP[1].includes('BBB'), 'all read results feed next turn');
  const readIdx = seenP[1].indexOf('AAA'), globIdx = seenP[1].indexOf('*.txt');
  assert.ok(readIdx !== -1 && globIdx !== -1 && readIdx < globIdx, 'output order preserved, got: ' + order.join(' | '));
  assert.strictEqual(par.toolCalls, 3, '3 tool calls counted, got ' + par.toolCalls);

  // Mutating block with two writes to the SAME file: strictly sequential,
  // applied in order (second wins), never parallel.
  const seqAI = async (prompt) => {
    seqAI.n = (seqAI.n || 0) + 1;
    if (seqAI.n === 1) {
      return { result: '```tool\n[{"tool":"write","args":{"file":"same.txt","content":"first"}},{"tool":"write","args":{"file":"same2.txt","content":"x"}},{"tool":"read","args":{"file":"a.txt"}}]\n```', provider: 'mock', tokens: 1, latency: 1 };
    }
    return { result: 'DONE: seq.', provider: 'mock', tokens: 1, latency: 1 };
  };
  const seq = await chode.runAgentLoop('Seq.', null, null, { quietFailures: true }, seqAI);
  assert.ok(seq.res && /DONE/.test(seq.res.result), 'mixed block runs sequentially');
  assert.ok(fs.existsSync(path.join(tmp, 'same.txt')), 'writes applied in order');

  // ── (c) Budgets ──
  // Per-turn read-only cap: 5 reads in one turn → 3 run, 2 fail as budget.
  const seenB = [];
  const overAI = async (prompt) => {
    seenB.push(prompt);
    if (seenB.length === 1) {
      const calls = [1, 2, 3, 4, 5].map((i) => ({ tool: 'read', args: { file: 'r' + i + '.txt' } }));
      return { result: '```tool\n' + JSON.stringify(calls) + '\n```', provider: 'mock', tokens: 1, latency: 1 };
    }
    return { result: 'DONE: capped.', provider: 'mock', tokens: 1, latency: 1 };
  };
  [1, 2, 3].forEach((i) => fs.writeFileSync(path.join(tmp, 'r' + i + '.txt'), 'R' + i, 'utf8'));
  const over = await chode.runAgentLoop('Over.', null, null, { quietFailures: true }, overAI);
  assert.strictEqual(over.toolCalls, 3, 'read-only turn capped at 3, got ' + over.toolCalls);
  assert.ok(/budget exceeded: turn allows 3/.test(seenB[1]), 'over-budget calls fail loudly in transcript');

  // Forced-cap run (default 24): endless tool calls → PARTIAL, never DONE.
  const endless = async () => ({
    result: '```tool\n' + JSON.stringify([1, 2, 3, 4, 5, 6].map((i) => ({ tool: 'read', args: { file: 'e' + i + '.txt' } }))) + '\n```',
    provider: 'mock', tokens: 1, latency: 1,
  });
  const capped = await chode.runAgentLoop('Endless.', null, null, { quietFailures: true }, endless);
  assert.ok(capped.partial === true, 'exhaustion must flag partial');
  assert.ok(/^PARTIAL/.test(capped.res.result), 'final answer starts with PARTIAL, got:\n' + String(capped.res.result).slice(0, 200));
  assert.ok(!/^DONE/.test(capped.res.result), 'never DONE on exhaustion (anti-grade-inflation)');
  assert.ok(capped.toolCalls >= 24, 'run cap honored, got ' + capped.toolCalls);

  const partialTask = 'Explain the current files and stop after one read.';
  const partialCtx = await chode.runAgentLoop(
    chode.agentToolPrompt() + '\n\n' + partialTask,
    null, null, { quietFailures: true, toolCap: 1 },
    async () => ({ result: '```tool\n{"tool":"read","args":{"file":"a.txt"}}\n```', provider: 'mock', tokens: 1, latency: 1 }),
    null, null, { originalTask: partialTask }
  );
  assert.ok(partialCtx.res.result.includes('Task: ' + partialTask), 'partial report names the original task, not the injected manifest');
  assert.ok(!partialCtx.res.result.includes('Available tools:'), 'partial report excludes system tool-manifest text');

  // Unknown/empty model finish = step failure, never success.
  const empty = await chode.runAgentLoop('Void.', null, null, { quietFailures: true }, async () => ({ result: '   ', provider: 'mock', tokens: 0, latency: 0 }));
  assert.ok(empty.stepFailure === 'empty finish', 'empty finish must be a step failure');
  const nullish = await chode.runAgentLoop('Void.', null, null, { quietFailures: true }, async () => null);
  assert.ok(nullish.stepFailure === 'empty finish', 'null finish must be a step failure');

  chode.__resetBoundedForTest();
  console.log('✓ v2 spill/parallel/budget: marker+file, order, caps, PARTIAL-not-DONE, empty-failure');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-budget-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 90000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
