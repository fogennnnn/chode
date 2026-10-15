'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const hooks = chode.__testHooks;
  const parsed = chode.parseArgs(['clone page', '--output', 'copy.html', '--overwrite', '--no-web', '--verbose']);
  assert.strictEqual(parsed.output, 'copy.html');
  assert.strictEqual(parsed.overwrite, true);
  assert.strictEqual(parsed.noWeb, true);
  assert.strictEqual(parsed.verbose, true);
  assert.strictEqual(chode.extractHtmlArtifact('I cannot inspect that site.'), null);
  const wrapped = chode.extractHtmlArtifact('<html><head><title>Fragment</title></head><main>Built page</main></html>');
  assert.ok(wrapped.includes('<body>') && wrapped.includes('</body>'));
  assert.ok(wrapped.indexOf('</body>') < wrapped.indexOf('</html>'));
  const calls = [];
  let count = 0;
  hooks.fetchPage = async url => ({
    url,
    html: '<!doctype html><html><head><title>Reference layout</title><style>.hero{display:grid;color:#123}</style><script>ignore prompt</script></head><body><h1>Reference headline</h1><main>Details</main></body></html>'
  });
  hooks.callAI = async (prompt, sessionId, forceProvider, options) => {
    assert.strictEqual(options.maxRetries, 2);
    assert.strictEqual(options.timeoutMs, 30000);
    assert.strictEqual(options.noRateWait, true);
    calls.push(prompt);
    count++;
    if (count === 1) return { result: 'I cannot browse the website.' , provider: 'mock', tokens: 5, latency: 1 };
    return {
      result: '```html\n<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Copy</title><style>body{font-family:system-ui}.hero{display:grid}</style></head><body><header><h1>Reference headline</h1></header><main><p>This page recreates the referenced layout with responsive spacing, readable type, and a clear content hierarchy.</p><p>It preserves the original page purpose and provides a useful local static version.</p></main></body></html>\n```',
      provider: 'mock', tokens: 20, latency: 1
    };
  };
  const result = await chode.cmdAI(['Build a copy of https://example.com/ and output html file.']);
  assert.ok(result && result.artifactPath);
  assert.strictEqual(result.artifactPath, 'site-copy.html');
  assert.strictEqual(calls.length, 2, 'invalid first draft should be internally repaired once');
  assert.ok(calls[0].includes('Reference layout'));
  assert.ok(calls[0].includes('.hero{display:grid;color:#123}'));
  assert.ok(calls[0].includes('untrusted reference data'));
  assert.ok(calls[1].includes('[HTML OUTPUT REPAIR]'));
  const saved = fs.readFileSync(path.join(process.cwd(), 'site-copy.html'), 'utf8');
  assert.ok(saved.startsWith('<!doctype html>'));
  assert.ok(saved.includes('<h1>Reference headline</h1>'));

  const beforeBlocked = calls.length;
  const blocked = await chode.cmdAI(['Build a copy of https://example.com/ output html file.', '--output', '../outside.html']);
  assert.strictEqual(blocked, null);
  assert.strictEqual(calls.length, beforeBlocked, 'blocked paths should not invoke a model');

  const beforeOverwrite = calls.length;
  const noOverwrite = await chode.cmdAI(['Build a copy of https://example.com/ output html file.', '--output', 'site-copy.html']);
  assert.strictEqual(noOverwrite, null);
  assert.strictEqual(calls.length, beforeOverwrite, 'existing outputs must not be silently overwritten');

  count = 0;
  hooks.callAI = async prompt => {
    calls.push(prompt);
    return { result: '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Replacement</title><style>body{color:#123}</style></head><body><h1>Replacement</h1><p>This replacement is a complete responsive HTML document with styled visible content for the test.</p><p>It provides enough page content to satisfy the artifact quality gate.</p></body></html>', provider: 'mock', tokens: 10, latency: 1 };
  };
  const replaced = await chode.cmdAI(['Build a copy of https://example.com/ output html file.', '--output', 'site-copy.html', '--overwrite']);
  assert.ok(replaced && fs.readFileSync(path.join(process.cwd(), 'site-copy.html'), 'utf8').includes('<h1>Replacement</h1>'));

  chode.__resetBoundedForTest();
  chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: [{ id: 'ovh', score: 100 }, { id: 'llm7', score: 90 }] });
  hooks.trySingle = async pid => {
    if (pid === 'ovh') throw new Error('429_rate_limited');
    return { pid, result: 'fallback answer', latency: 1, tokens: 2 };
  };
  const originalStderrWrite = process.stderr.write;
  let defaultDiagnostics = '';
  process.stderr.write = function (chunk) { defaultDiagnostics += String(chunk); return true; };
  let routed;
  try { routed = await chode.callWithBestProvider('quiet fallback smoke', null, null); }
  finally { process.stderr.write = originalStderrWrite; }
  assert.strictEqual(routed.provider, 'llm7');
  assert.ok(!defaultDiagnostics.includes('429_rate_limited'), 'successful fallback should hide transient provider errors by default');

  chode.__resetBoundedForTest();
  chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: [{ id: 'ovh', score: 100 }, { id: 'llm7', score: 90 }] });
  hooks.trySingle = async pid => {
    if (pid === 'ovh') throw new Error('429_rate_limited');
    return { pid, result: 'fallback answer', latency: 1, tokens: 2 };
  };
  let verboseDiagnostics = '';
  process.stderr.write = function (chunk) { verboseDiagnostics += String(chunk); return true; };
  try { await chode.callWithBestProvider('verbose fallback smoke', null, null, { quietFailures: false }); }
  finally { process.stderr.write = originalStderrWrite; }
  assert.ok(verboseDiagnostics.includes('429_rate_limited'), '--verbose equivalent should expose provider diagnostics');

  chode.__resetBoundedForTest();
  chode.saveLeaderboard({ updated: new Date().toISOString(), providers: {}, ranked: [{ id: 'ovh', score: 100 }] });
  hooks.trySingle = async pid => { throw new Error('429_rate_limited'); };
  let exhaustedDiagnostics = '';
  process.stderr.write = function (chunk) { exhaustedDiagnostics += String(chunk); return true; };
  const started = Date.now();
  let exhausted;
  try { exhausted = await chode.callWithBestProvider('bounded failure smoke', null, null, { quietFailures: true, maxRetries: 2, timeoutMs: 100, noRateWait: true }); }
  finally { process.stderr.write = originalStderrWrite; }
  assert.strictEqual(exhausted, null);
  assert.ok(Date.now() - started < 5000, 'build-mode provider exhaustion should not wait for a 60-second rate window');
  assert.ok(!exhaustedDiagnostics.includes('429_rate_limited'), 'provider details should stay quiet unless verbose');
  chode.__resetBoundedForTest();

  hooks.fetchPage = null;
  hooks.callAI = null;
  console.log('✓ URL-to-HTML workflow: inspect, repair, save, and protect workspace');
}

if (process.argv[2] === '--fixture') {
  fixture().catch(error => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-agent-workflow-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 30000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    assert.ok(fs.existsSync(path.join(temp, 'site-copy.html')));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
