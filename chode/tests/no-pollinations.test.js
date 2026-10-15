'use strict';

// Pollinations was removed from the maintained CLI and must never return:
// users repeatedly ran stale copies whose bootstrap fallback hit it.
// This test bans the name from canonical sources and bans any provider
// registered under the `bootstrap` category.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const STRICT = ['chode.js', 'web-context.js', 'toolbox.js', 'package.json'];

for (const file of STRICT) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  // The ban-test filename itself contains the banned substring; manifests
  // legitimately list it as a test entry. Strip that before asserting.
  const src = fs.readFileSync(full, 'utf8').replace(/no-pollinations\.test\.js/gi, '');
  assert.ok(!/pollinat/i.test(src), file + ' must not reference Pollinations');
}

// README may name this very test file, but must never present Pollinations
// as a provider, fallback, endpoint, or signup option.
const readme = path.join(root, 'README.md');
if (fs.existsSync(readme)) {
  const src = fs.readFileSync(readme, 'utf8');
  assert.ok(!/pollinat[\w-]*\s*[(|:.—–-]/i.test(src.replace(/no-pollinations\.test\.js/gi, '')), 'README.md must not present Pollinations as a provider/fallback');
  assert.ok(!/pollinat[\w-]*\s+(provider|fallback|endpoint|signup|key|api)/i.test(src), 'README.md must not present Pollinations as a provider/fallback');
}

const chode = require('../chode.js');
for (const [id, p] of Object.entries(chode.PROVIDERS)) {
  assert.notStrictEqual(p && p.category, 'bootstrap', id + ' must not be a bootstrap provider');
  for (const ep of ((p && p.endpoints) || [])) {
    const url = typeof ep.url === 'function' ? String(ep.url('')) : String(ep.url || '');
    assert.ok(!/pollinat/i.test(url), id + ' endpoint must not point at Pollinations');
  }
}

console.log('✓ no-pollinations: canonical sources clean, no bootstrap providers');
