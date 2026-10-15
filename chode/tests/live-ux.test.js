'use strict';

const assert = require('assert');

const chode = require('../chode.js');

function collector() {
  const parts = [];
  const filter = chode.createToolStreamFilter((s) => parts.push(s));
  return { parts, filter, text: () => parts.join('') };
}

function main() {
  // 1. Plain prose passes through untouched.
  let c = collector();
  c.filter.push('Hello world\nSecond line');
  c.filter.flush();
  assert.strictEqual(c.text(), 'Hello world\nSecond line');

  // 2. A complete tool fence is suppressed, prose around it survives.
  c = collector();
  c.filter.push('Thinking…\n```tool\n{"tool":"read","args":{"file":"a.txt"}}\n```\nDone.');
  c.filter.flush();
  assert.strictEqual(c.text(), 'Thinking…\nDone.');

  // 3. Opener split across chunks.
  c = collector();
  c.filter.push('Start ```t');
  c.filter.push('ool\n{"tool":"glob","args":{}}\n``` end');
  c.filter.flush();
  assert.strictEqual(c.text(), 'Start  end');

  // 4. Closer split across chunks.
  c = collector();
  c.filter.push('A ```tool\n{"a":1}\n``');
  c.filter.push('` B');
  c.filter.flush();
  assert.strictEqual(c.text(), 'A  B');

  // 5. <tool> tag form suppressed.
  c = collector();
  c.filter.push('X <tool>{"tool":"read","args":{}}</tool> Y');
  c.filter.flush();
  assert.strictEqual(c.text(), 'X  Y');

  // 6. Unclosed fence at end of turn is dropped, not leaked.
  c = collector();
  c.filter.push('Visible ```tool\n{"tool":"exec"');
  c.filter.flush();
  assert.strictEqual(c.text(), 'Visible ');

  // 7. Ordinary code fences stream through.
  c = collector();
  c.filter.push('Example:\n```js\nconst x = 1;\n```\nNice.');
  c.filter.flush();
  assert.strictEqual(c.text(), 'Example:\n```js\nconst x = 1;\n```\nNice.');

  // 8. Trailing partial opener is held, then flushed intact at turn end.
  c = collector();
  c.filter.push('Backticks: ``');
  c.filter.flush();
  assert.strictEqual(c.text(), 'Backticks: ``');

  // 9. Picker resolution.
  const ids = ['default', 'Work-2', 'research'];
  assert.strictEqual(chode.resolvePickerSelection('2', ids), 1);
  assert.strictEqual(chode.resolvePickerSelection(' 3 ', ids), 2);
  assert.strictEqual(chode.resolvePickerSelection('research', ids), 2);
  assert.strictEqual(chode.resolvePickerSelection('WORK-2', ids), 1);
  assert.strictEqual(chode.resolvePickerSelection('0', ids), -1);
  assert.strictEqual(chode.resolvePickerSelection('9', ids), -1);
  assert.strictEqual(chode.resolvePickerSelection('nope', ids), -1);
  assert.strictEqual(chode.resolvePickerSelection('', ids), -1);
  assert.strictEqual(chode.resolvePickerSelection('1', []), -1);

  console.log('✓ live ux: stream filter suppresses tool blocks, picker resolves');
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
