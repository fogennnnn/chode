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

  // Benchmark claims must stay tied to their protocol and recorded evidence.
  const section = src.split('id="compare"')[1].split('<section class="cta-section">')[0];
  assert.ok(section.includes('No directly comparable Chode leaderboard score yet'));
  const full=JSON.parse(fs.readFileSync(path.join(__dirname,'../benchmarks/results/full-python-production-1.9.28-2026-10-28.json'),'utf8'));
  assert.equal(full.results.length,34);assert.equal(full.results.filter(r=>r.passed).length,20);
  assert.ok(section.includes('20 of 34 solved')&&section.includes('14 failed')&&section.includes('not the full six-language Aider leaderboard'));
  assert.ok(!/<h3>\s*(?:Claude Code|OpenCode)\s*<\/h3>/.test(section), 'no adjacent competitor score cards');
  assert.ok(!/\d+(?:\.\d+)?%|&plusmn;/.test(section.replace(/<[^>]*>/g,' ')), 'no full-leaderboard percentage implied from pilots');
  for (const [name, solved, calls, seconds] of [['checked',4,12,420],['pilot',1,6,210]]) {
    const record=JSON.parse(fs.readFileSync(path.join(__dirname,'../benchmarks/results/polyglot-python-'+name+'-1.9.24-2026-10-28.json'),'utf8'));
    assert.strictEqual(record.results.filter(r=>r.passed).length,solved);
    assert.strictEqual(record.protocol.tasks.length,5);
    assert.strictEqual(record.protocol.modelCallsPerTask,calls);
    assert.strictEqual(record.protocol.wallMsPerTask,seconds*1000);
    assert.ok(section.includes(solved+' of 5 tasks solved'));
  }
  const build=JSON.parse(fs.readFileSync(path.join(__dirname,'../benchmarks/results/reservations-1.9.27-2026-10-28.json'),'utf8'));
  assert.strictEqual(build.applicationTasks,1);assert.strictEqual(build.acceptanceChecks,35);
  assert.strictEqual(build.generation.code,0);assert.strictEqual(build.chodeStatus,'VERIFIED');assert.strictEqual(build.testsUnchanged,true);
  assert.ok(section.includes('one private development task, not 35 benchmark tasks'));

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
  const pkgVersion = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version;
  assert.ok(src.includes('id="rel-ver">v' + pkgVersion + '<'), 'badge fallback matches package version ' + pkgVersion);
  assert.ok(!src.includes('version: "1.'), 'no hardcoded status version; use releaseVersion()');

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
