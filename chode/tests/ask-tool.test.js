'use strict';

const assert = require('assert');

const chode = require('../chode.js');

async function main() {
  // autoAsk: default honored, first picked otherwise, garbage rejected.
  let r = chode.autoAsk({ question: 'Pick', options: [{ label: 'a' }, { label: 'b' }], default: 1 });
  assert.deepStrictEqual([r.ok, r.selected, r.index, r.auto], [true, 'b', 1, true]);
  r = chode.autoAsk({ question: 'Pick', options: ['x', 'y'] });
  assert.deepStrictEqual([r.ok, r.selected, r.index], [true, 'x', 0]);
  r = chode.autoAsk({ question: 'Pick', options: ['x'], default: 9 });
  assert.strictEqual(r.index, 0, 'out-of-range default clamps');
  assert.strictEqual(chode.autoAsk({ question: 'Pick', options: [] }).ok, false);
  assert.strictEqual(chode.autoAsk({ options: [{ label: 'a' }] }).ok, false);

  // Manual dispatcher gates ask behind approval like edit/write/exec.
  const gated = chode.toolExec('ask', { question: 'Q', options: [{ label: 'a' }] });
  assert.ok(!gated.ok && gated.needConfirm, 'unapproved ask must ask first');
  const approved = chode.toolExec('ask', { question: 'Q', options: [{ label: 'a' }] }, { approved: true });
  assert.ok(approved.ok && approved.selected === 'a');

  // parseToolCalls recognizes ask blocks.
  const calls = chode.parseToolCalls('```tool\n{"tool":"ask","args":{"question":"Q?","options":[{"label":"yes"},{"label":"no"}]}}\n```');
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].tool, 'ask');

  // Headless loop auto-picks the default and continues to a clean answer.
  const seen = [];
  const aiCall = async (prompt) => {
    seen.push(prompt);
    if (seen.length === 1) {
      return { result: 'Need direction.\n```tool\n{"tool":"ask","args":{"question":"Which?","options":[{"label":"fast"},{"label":"safe"}],"default":1}}\n```', provider: 'mock', tokens: 5, latency: 1 };
    }
    return { result: 'Going with it.', provider: 'mock', tokens: 5, latency: 1 };
  };
  const looped = await chode.runAgentLoop('Do the thing.', null, null, { quietFailures: true }, aiCall);
  assert.ok(looped.res && looped.res.result.includes('Going with it.'));
  assert.strictEqual(looped.actions.asks, 1);
  assert.ok(!looped.res.result.includes('```tool'), 'ask blocks must not leak into answers');
  assert.ok(seen[1].includes('"selected":"safe"'), 'headless pick (default 1) must reach the next turn');

  // Interactive onAsk wins over auto-pick when provided.
  let asked = 0;
  const aiCall2 = async (prompt) => {
    if (!asked) {
      asked++;
      return { result: '```tool\n{"tool":"ask","args":{"question":"Q?","options":[{"label":"a"},{"label":"b"}]}}\n```', provider: 'mock', tokens: 1, latency: 1 };
    }
    return { result: 'Done.', provider: 'mock', tokens: 1, latency: 1 };
  };
  const looped2 = await chode.runAgentLoop(
    'T.', null, null, { quietFailures: true }, aiCall2, null,
    async () => ({ ok: true, selected: 'b', index: 1 })
  );
  assert.ok(looped2.res.result.includes('Done.'));
  assert.strictEqual(looped2.actions.asks, 1);

  chode.__resetBoundedForTest();
  console.log('✓ ask tool: auto-pick, gating, headless + interactive loop paths');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
