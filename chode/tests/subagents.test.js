'use strict';

// Isolated subagents: fresh session, no shared history, no nesting,
// bounded steps, parent-visible result.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();
  fs.writeFileSync(path.join(tmp, 'data.txt'), 'hello', 'utf8');

  // Route by side, mirroring separate model contexts: the subagent preamble
  // marks child turn 1; exactly one child follow-up comes next; a prompt
  // carrying the subagent result ('"agent":"sub_') belongs to the parent.
  const childPrompts = [];
  const parentPrompts = [];
  let childTurns = 0;
  let parentTurns = 0;
  const aiCall = async (prompt) => {
    const p = String(prompt);
    const isChild = p.includes('[SUBAGENT') || (childTurns === 1 && !p.includes('"agent":"sub_'));
    if (isChild) {
      childPrompts.push(p);
      childTurns++;
      if (childTurns === 1) {
        return { result: 'Checking.\n```tool\n{"tool":"read","args":{"file":"data.txt"}}\n```', provider: 'mock', tokens: 5, latency: 1 };
      }
      return { result: 'Found: hello', provider: 'mock', tokens: 5, latency: 1 };
    }
    parentPrompts.push(p);
    parentTurns++;
    if (parentTurns === 1) {
      return { result: 'Delegating PARENT-SECRET-XYZ.\n```tool\n{"tool":"task","args":{"prompt":"count files","label":"counter"}}\n```', provider: 'mock', tokens: 5, latency: 1 };
    }
    return { result: 'Done: hello', provider: 'mock', tokens: 5, latency: 1 };
  };

  // 1. Full delegation round-trip with isolation + separate session file.
  const looped = await chode.runAgentLoop('Do it.', 'parent-sess', null, { quietFailures: true }, aiCall);
  assert.ok(looped.res && looped.res.result.includes('Done: hello'), 'parent must finish from subagent result');
  assert.strictEqual(looped.actions.tasks, 1, 'parent records one subagent task');
  assert.ok(!looped.res.result.includes('```tool'), 'no tool blocks leak');
  assert.ok(childPrompts.length >= 2, 'child ran its own turns');
  assert.ok(childPrompts.every((p) => !p.includes('PARENT-SECRET-XYZ')), 'child never sees parent context');
  assert.ok(parentPrompts[1].includes('Found: hello'), 'child result feeds the parent');
  const sessions = fs.readdirSync(path.join(tmp, '.chode', 'sessions'));
  assert.ok(sessions.some((f) => f.startsWith('sub_')), 'subagent owns an isolated session file, got: ' + sessions.join(','));

  // 2. Nesting guard: a child requesting task gets an error, not a grandchild.
  let nestedTurns = 0;
  const nestedAI = async (prompt) => {
    nestedTurns++;
    if (String(prompt).includes('[SUBAGENT') && nestedTurns === 1) {
      return { result: '```tool\n{"tool":"task","args":{"prompt":"recurse"}}\n```', provider: 'mock', tokens: 1, latency: 1 };
    }
    return { result: 'Finished solo.', provider: 'mock', tokens: 1, latency: 1 };
  };
  const sub = await chode.runSubagent('recurse test', {}, nestedAI, null);
  assert.ok(sub.result && sub.result.includes('Finished solo.'), 'nested task must not spawn');
  assert.ok(sub.steps <= 8, 'bounded');

  // 3. Direct runSubagent shape.
  const direct = await chode.runSubagent('quick', { label: 'q' }, async () => ({ result: 'R', provider: 'm', tokens: 1, latency: 1 }), null);
  assert.ok(direct.sessionId.startsWith('sub_') && direct.result === 'R' && direct.steps === 1);

  // 4. Disallow list enforced with feedback.
  const seen = [];
  const disAI = async (prompt) => {
    seen.push(prompt);
    if (seen.length === 1) return { result: '```tool\n{"tool":"exec","args":{"cmd":"echo hi"}}\n```', provider: 'mock', tokens: 1, latency: 1 };
    return { result: 'Understood.', provider: 'mock', tokens: 1, latency: 1 };
  };
  await chode.runAgentLoop('T.', null, null, { quietFailures: true, disallow: ['exec'] }, disAI);
  assert.ok(seen[1].includes('tool disabled in this mode: exec'), 'disallowed tools get feedback');

  chode.__resetBoundedForTest();
  console.log('✓ subagents: isolation, nesting guard, shape, disallow');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-subagents-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
