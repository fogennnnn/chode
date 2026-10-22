'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');

  // 1. Tool-call parsing: fenced JSON, arrays, <tool> tags, dedupe, cap.
  const mixed = [
    'Looking at the repo.',
    '```tool',
    '{"tool":"read","args":{"file":"hello.txt"}}',
    '```',
    '```tool',
    '[{"tool":"read","args":{"file":"hello.txt"}},{"tool":"bogus","args":{}}]',
    '```',
    '<tool>{"tool":"glob","args":{"pattern":"*.txt"}}</tool>',
    '```tool',
    'not json',
    '```'
  ].join('\n');
  const parsed = chode.parseToolCalls(mixed);
  assert.strictEqual(parsed.length, 2, 'should dedupe and drop unknown/invalid, got ' + JSON.stringify(parsed));
  assert.strictEqual(parsed[0].tool, 'read');
  assert.strictEqual(parsed[1].tool, 'glob');
  const stripped = chode.stripToolBlocks(mixed + '\nFinal answer here.');
  assert.ok(!stripped.includes('```tool') && !stripped.includes('<tool>'), 'display text must not leak tool blocks');
  assert.ok(stripped.includes('Final answer here.'), 'user text must survive stripping');

  // 2. Workspace guards (ROOT is the temp fixture dir).
  fs.writeFileSync(path.join(process.cwd(), 'hello.txt'), 'hello world', 'utf8');
  const outside = chode.toolExec('write', { file: '../outside.txt', content: 'x' }, { approved: true });
  assert.ok(!outside.ok, 'outside workspace writes must be denied');
  const secret = chode.toolExec('write', { file: '.env', content: 'K=x' }, { approved: true });
  assert.ok(!secret.ok, 'secret writes must be denied');
  const secretRead = chode.toolExec('read', { file: '.env' });
  assert.ok(!secretRead.ok, 'secret reads must be denied');
  const destructive = chode.toolExec('exec', { cmd: 'rm -rf /' }, { approved: true });
  assert.ok(!destructive.ok, 'destructive commands must be denied');
  const needConfirm = chode.toolExec('exec', { cmd: 'node --version' });
  assert.ok(!needConfirm.ok && needConfirm.needConfirm, 'manual exec without --yes must ask first');

  // 3. Full loop: read -> write + exec -> final answer.
  const seen = [];
  const scripted = [
    'First I will inspect.\n```tool\n{"tool":"read","args":{"file":"hello.txt"}}\n```',
    'Now building.\n```tool\n[{"tool":"write","args":{"file":"out.txt","content":"built from hello"}},{"tool":"exec","args":{"cmd":"node --version"}}]\n```',
    'Done. Created out.txt and verified the toolchain.'
  ];
  const aiCall = async (prompt) => {
    seen.push(prompt);
    const step = seen.length - 1;
    return { result: scripted[Math.min(step, scripted.length - 1)], provider: 'mock', tokens: 5, latency: 1 };
  };
  const looped = await chode.runAgentLoop('Build the thing.', null, null, { quietFailures: true }, aiCall);
  assert.ok(looped && looped.res, 'loop must return a result');
  assert.strictEqual(looped.steps, 3, 'loop should take exactly 3 steps, got ' + looped.steps);
  assert.ok(looped.actions.reads >= 1, 'loop should record reads');
  assert.ok(looped.actions.writes.includes('out.txt'), 'loop should record the write, got ' + JSON.stringify(looped.actions.writes));
  assert.ok(looped.actions.execs.length >= 1, 'loop should record exec');
  assert.ok(fs.existsSync(path.join(process.cwd(), 'out.txt')), 'agent write must land on disk');
  assert.strictEqual(fs.readFileSync(path.join(process.cwd(), 'out.txt'), 'utf8'), 'built from hello');
  assert.ok(!looped.res.result.includes('```tool'), 'final answer must not leak tool blocks');
  assert.ok(looped.res.result.includes('Done'), 'final answer must survive');
  assert.ok(seen[1].includes('hello world'), 'tool results must feed the next step');

  // Unsupported Harmony control output is a protocol failure, never a final
  // answer. In particular, an unknown git tool call is not dispatched.
  const malformedHarmony = '<|start|>assistant<|channel|>commentary to=tool{"tool":"git","args":{"cmd":"status"}}<|call|>';
  const malformed = await chode.runAgentLoop('Reply with OK.', null, null,
    { quietFailures: true, v2: true }, async () => ({ result: malformedHarmony, provider: 'mock', tokens: 1, latency: 1 }));
  assert.strictEqual(malformed.completionStatus, 'FAILED');
  assert.ok(/^FAILED: PROTOCOL_ERROR/.test(malformed.res.result), malformed.res.result);
  assert.strictEqual(malformed.actions.execs.length, 0, 'unknown git call never reaches exec');
  assert.strictEqual(malformed.toolCalls, 0, 'malformed tool envelope dispatches no tools');

  const fencedExample = 'Example only:\n```text\n' + malformedHarmony + '\n```\nDo not execute the example.';
  const documented = await chode.runAgentLoop('Explain the protocol example.', null, null,
    { quietFailures: true, v2: true }, async () => ({ result: fencedExample, provider: 'mock', tokens: 1, latency: 1 }));
  assert.strictEqual(documented.completionStatus, 'NOT_REQUIRED', 'fenced code example is not treated as a protocol envelope');
  assert.ok(documented.res.result.includes(malformedHarmony), 'ordinary code example remains in the answer');

  // 4. Doom-loop stays bounded: same tool request forever must not hang.
  const stuck = async () => ({ result: '```tool\n{"tool":"read","args":{"file":"hello.txt"}}\n```', provider: 'mock', tokens: 1, latency: 1 });
  const bounded = await chode.runAgentLoop('Stuck task.', null, null, { quietFailures: true }, stuck);
  assert.ok(bounded.steps <= 8, 'loop must stay bounded, got ' + bounded.steps);

  // 5. Empty provider answers are recovery, not a doom loop: identical
  // prompts that keep coming back empty must keep reaching a provider.
  // (Non-empty repeats still abort — pinned below.)
  chode.__resetBoundedForTest();
  let emptyAttempts = 0;
  const prevTry = chode.__testHooks.trySingle;
  chode.__testHooks.trySingle = async () => { emptyAttempts++; return { pid: 'kilo', result: '' }; };
  try {
    for (let i = 0; i < 3; i++) await chode.callWithBestProvider('Same empty prompt.', null, 'kilo', { quietFailures: true });
  } finally { chode.__testHooks.trySingle = prevTry; }
  assert.strictEqual(emptyAttempts, 3, 'three identical empty-answer calls must all try a provider, got ' + emptyAttempts);
  chode.__resetBoundedForTest();
  let fullAttempts = 0;
  const prevTry2 = chode.__testHooks.trySingle;
  chode.__testHooks.trySingle = async () => { fullAttempts++; return { pid: 'kilo', result: 'same answer' }; };
  try {
    for (let i = 0; i < 3; i++) await chode.callWithBestProvider('Same full prompt.', null, 'kilo', { quietFailures: true });
  } finally { chode.__testHooks.trySingle = prevTry2; }
  assert.strictEqual(fullAttempts, 2, 'three identical answered calls must abort on the third, got ' + fullAttempts);

  chode.__resetBoundedForTest();
  console.log('✓ agent loop: parse, guards, 3-step build, bounded doom-loop');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-agent-loop-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 30000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    assert.ok(fs.existsSync(path.join(temp, 'out.txt')), 'fixture must produce out.txt in temp workspace');
    assert.ok(!fs.existsSync(path.join(os.tmpdir(), 'outside.txt')), 'outside writes must never escape temp');
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
