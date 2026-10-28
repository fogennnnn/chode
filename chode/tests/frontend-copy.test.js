'use strict';

// Frontend honesty + hygiene for the live landing worker (chode-hq-worker.js).
// Pure source-text assertions (hermetic) plus a syntax check. Every claim a
// visitor can read must match the shipped CLI; nothing vaporware may ship.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const WORKER = path.join(__dirname, '..', 'chode-hq-worker.js');

function main() {
  const src = fs.readFileSync(WORKER, 'utf8');

  // Banned: vaporware, stale fallback, squatter install path, dead anchors.
  for (const banned of [
    'OmniRoute', '136 models', 'Kiro', 'secz6', 'boundaries-bg',
    'Pollinat', 'npm install -g chode', 'squid-anchor',
  ]) {
    assert.ok(!src.includes(banned), 'landing must not contain: ' + banned);
  }

  // Exactly the 17 configured providers, each with an honest tier label.
  const chips = src.match(/<div class="provider-chip">/g) || [];
  assert.strictEqual(chips.length, 17, 'must render 17 provider chips, got ' + chips.length);
  for (const name of ['>Kilo<', '>Groq<', '>Cerebras<', '>Gemini<', '>Mistral<', '>OpenRouter<', '>NVIDIA NIM<', '>Cloudflare AI<', '>DeepSeek<', '>Cohere<', '>Agnes AI<', '>Ollama<', '>OVHcloud<', '>LLM7<', '>uncloseai<', '>Claude<', '>GPT-4o mini<']) {
    assert.ok(src.includes(name), 'chip missing: ' + name);
  }
  assert.ok(!src.includes('bootstrap</span>'), 'no stale bootstrap tier labels');

  // Terminal demo must describe real CLI behavior.
  assert.ok(src.includes('Browser check · desktop + mobile'), 'demo shows real browser verification');
  assert.ok(src.includes('Session saved'), 'demo shows session persistence');
  assert.ok(!src.includes('Generated worker.js'), 'demo must not invent file generation');

  // Discoverability + hygiene markers.
  assert.ok(src.includes('rel="icon"'), 'favicon present (kills /favicon.ico 404 noise)');
  assert.ok(src.includes('og:url'), 'og:url present');
  assert.ok(src.includes('twitter:card'), 'twitter card present');
  assert.ok(src.includes('skip-link'), 'skip link present');
  assert.ok((src.match(/x-content-type-options/g) || []).length >= 2, 'nosniff on responses');
  assert.ok(src.includes('referrer-policy'), 'referrer policy present');
  assert.ok(src.includes('header-title{display:none}'), 'mobile keeps nav, collapses title');
  assert.ok(!src.includes('.header-nav{display:none}'), 'mobile must not hide navigation');
  assert.ok(src.includes('querySelectorAll(\'.code-block\')'), 'copy buttons auto-wire to every snippet');
  assert.ok(src.includes('id="rel-ver"'), 'hero badge has a version element');
  assert.ok(src.includes("fetch('/api/release'"), 'hero badge tracks the live release');

  // The worker itself must parse.
  const check = spawnSync(process.execPath, ['--check', WORKER], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  assert.strictEqual(check.status, 0, 'worker syntax: ' + (check.stderr || ''));

  console.log('✓ frontend copy: honest claims, hygiene markers, syntax');
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
