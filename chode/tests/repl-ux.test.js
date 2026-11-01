'use strict';

const assert = require('assert');

const chode = require('../chode.js');

function main() {
  assert.strictEqual(chode.isValidSessionId('default'), true);
  assert.strictEqual(chode.isValidSessionId('work-2_x'), true);
  for (const bad of ['', '../evil', 'a b', 'x'.repeat(65), null, undefined]) {
    assert.strictEqual(chode.isValidSessionId(bad), false, JSON.stringify(bad) + ' must be rejected');
  }

  const md = chode.renderMarkdown('# Title\nSome **bold** and `code`.\n```js\n- item\n```');
  assert.ok(!md.includes('# Title'), 'heading marker must be styled away');
  assert.ok(md.includes('Title') && md.includes('bold') && md.includes('code'), 'content must survive rendering');
  assert.ok(md.includes('\x1b['), 'rendered output must carry ANSI styling');
  assert.ok(md.includes('···'), 'fences must become rules');

  const plain = chode.renderMarkdown('just text');
  assert.ok(plain.includes('just text'), 'plain text passes through');

  const parsed = chode.parseArgs(['hello', '--no-tools', '--verbose']);
  assert.strictEqual(parsed.noTools, true);
  assert.strictEqual(parsed.verbose, true);
  assert.strictEqual(parsed.prompt, 'hello');

  console.log('✓ repl ux: session ids, markdown render, flags');
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
