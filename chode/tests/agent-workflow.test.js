'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const webContext = require('../web-context');

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
    assert.strictEqual(options.timeoutMs, 120000);
    assert.strictEqual(options.noRateWait, false);
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

  // Prompt-named artifact: the filename in the brief wins over site-copy.html.
  // Saved artifact + UNVERIFIED loop must exit 0 (child asserts status + file).
  {
    const chodePath = path.resolve(__dirname, '..', 'chode.js');
    const namedHtml = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hello</title><style>body{color:blue}</style></head><body><h1>Hello</h1><p>GUEST greets you.</p></body></html>';
    const namedSource = [
      'const chode=require(' + JSON.stringify(chodePath) + ');',
      'const namedHtml=' + JSON.stringify(namedHtml) + ';',
      'chode.__testHooks.callAI=async function(prompt){if(String(prompt).startsWith("[VERIFY WEBSITE]"))return {result:"PASS",provider:"reviewer"};return {result:namedHtml,provider:"mock"};};',
      'chode.cmdAI({prompt:"Create hello.html: a hello page for GUEST with a blue heading.",noWeb:true},{cli:true}).then(function(result){if(!result||result.artifactPath!=="hello.html")process.exitCode=2;});'
    ].join('');
    const namedChild = spawnSync(process.execPath, ['-e', namedSource], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 30000, windowsHide: true
    });
    assert.ifError(namedChild.error);
    assert.ok(fs.existsSync(path.join(process.cwd(), 'hello.html')), 'prompt-named artifact file is written; stdout: ' + namedChild.stdout + ' stderr: ' + namedChild.stderr);
    assert.ok(fs.readFileSync(path.join(process.cwd(), 'hello.html'), 'utf8').includes('GUEST'));
    assert.strictEqual(namedChild.status, 0, 'saved artifact with UNVERIFIED loop must exit 0; stdout: ' + namedChild.stdout + ' stderr: ' + namedChild.stderr);
  }

  // Artifact drafts get patient budgets: a full document cannot be written in
  // 30s, and a 429 rate window must be waited out, not treated as fatal.
  {
    const seen = [];
    const prevCall = hooks.callAI;
    hooks.callAI = async (prompt, sessionId, forceProvider, options) => {
      seen.push(Object.assign({}, options));
      if (String(prompt).startsWith('[VERIFY WEBSITE]')) return { result: 'PASS', provider: 'reviewer', tokens: 1, latency: 1 };
      return { result: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Patient</title><style>body{color:#111}</style></head><body><h1>Patient</h1><p>' + 'Content sentence. '.repeat(20) + '</p></body></html>', provider: 'mock', tokens: 10, latency: 1 };
    };
    try {
      const patient = await chode.cmdAI({ prompt: 'Create one self-contained HTML artifact.', output: 'patient-budgets.html', overwrite: true, noWeb: true });
      assert.ok(seen.length > 0, 'artifact draft call observed');
      assert.ok(seen[0].timeoutMs >= 120000, 'artifact draft gets a full-document timeout, saw ' + seen[0].timeoutMs);
      assert.notStrictEqual(seen[0].noRateWait, true, 'artifact draft waits out rate windows');
      assert.ok(patient && patient.artifactPath === 'patient-budgets.html');
    } finally {
      hooks.callAI = prevCall;
      try { fs.unlinkSync(path.join(process.cwd(), 'patient-budgets.html')); } catch (e) {}
    }
  }

  // Total provider silence must not end the run: the harness waits out the
  // cooldown window and tries again instead of failing the artifact.
  {
    let silentCalls = 0;
    const prevCall = hooks.callAI;
    hooks.callAI = async (prompt, sessionId, forceProvider, options) => {
      silentCalls++;
      if (silentCalls < 3) return null;
      if (String(prompt).startsWith('[VERIFY WEBSITE]')) return { result: 'PASS', provider: 'reviewer', tokens: 1, latency: 1 };
      return { result: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Continued</title><style>body{color:#111}</style></head><body><h1>Continued</h1><p>' + 'Recovered content. '.repeat(20) + '</p></body></html>', provider: 'mock', tokens: 10, latency: 1 };
    };
    try {
      const continued = await chode.cmdAI({ prompt: 'Create one self-contained HTML artifact.', output: 'continued-artifact.html', overwrite: true, noWeb: true });
      assert.ok(continued && continued.artifactPath === 'continued-artifact.html', 'artifact saved after provider silence, got ' + JSON.stringify(continued && continued.artifactPath));
      assert.ok(fs.existsSync(path.join(process.cwd(), 'continued-artifact.html')));
    } finally {
      hooks.callAI = prevCall;
      try { fs.unlinkSync(path.join(process.cwd(), 'continued-artifact.html')); } catch (e) {}
    }
  }

  // Draft repairs exhausted: one agent-workspace build still saves the artifact.
  {
    const prevCall = hooks.callAI, prevAgent = chode.__testHooks.agentArtifactBuild;
    hooks.callAI = async () => ({ result: '<html><body><p>thin</p></body></html>', provider: 'mock', tokens: 1, latency: 1 });
    const agentHtml = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agent built</title><style>body{font-family:system-ui}nav a{margin-right:1em}</style></head><body><nav aria-label="Main"><a href="#home">Home</a><a href="#about">About</a></nav><main id="home"><h1>Agent built</h1><p>' + 'Real content sentence. '.repeat(20) + '</p></main><section id="about"><h2>About</h2><p>' + 'Second section content. '.repeat(10) + '</p></section></body></html>';
    chode.__testHooks.agentArtifactBuild = async () => agentHtml;
    try {
      const via = await chode.cmdAI({ prompt: 'Build me a test website about beacons.', output: 'agent-fallback.html', overwrite: true, noWeb: true });
      assert.ok(via && via.artifactPath === 'agent-fallback.html', 'agent-workspace fallback saves the artifact, got ' + JSON.stringify(via && via.artifactPath));
      assert.ok(fs.readFileSync(path.join(process.cwd(), 'agent-fallback.html'), 'utf8').includes('<nav'), 'saved artifact is the agent-built document');
    } finally {
      hooks.callAI = prevCall;
      if (prevAgent === undefined) delete chode.__testHooks.agentArtifactBuild; else chode.__testHooks.agentArtifactBuild = prevAgent;
      try { fs.unlinkSync(path.join(process.cwd(), 'agent-fallback.html')); } catch (e) {}
    }
  }

  // Empty-answer provider passes must not end the agent-workspace build:
  // the loop retries until the single-file artifact appears (bounded).
  {
    const prevCall = hooks.callAI;
    const agentHtml = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Retried</title><style>body{font-family:system-ui}nav a{margin-right:1em}</style></head><body><nav aria-label="Main"><a href="#home">Home</a><a href="#about">About</a></nav><main id="home"><h1>Retried</h1><p>' + 'Real content sentence. '.repeat(20) + '</p></main><section id="about"><h2>About</h2><p>' + 'Second section content. '.repeat(10) + '</p></section></body></html>';
    let emptiesLeft = 3, wroteFile = false;
    hooks.callAI = async (prompt) => {
      if (!String(prompt).includes('chode-artifact-build.html')) return { result: '<html><body><p>thin</p></body></html>', provider: 'mock', tokens: 1, latency: 1 };
      if (emptiesLeft > 0) { emptiesLeft--; return { result: '', provider: 'mock', tokens: 0, latency: 1 }; }
      if (!wroteFile) { wroteFile = true; return { result: '```tool\n' + JSON.stringify({ tool: 'write', args: { file: 'chode-artifact-build.html', content: agentHtml } }) + '\n```', provider: 'mock', tokens: 10, latency: 1 }; }
      return { result: 'DONE: single file written.', provider: 'mock', tokens: 1, latency: 1 };
    };
    try {
      const via = await chode.cmdAI({ prompt: 'Build me a test website about beacons.', output: 'empty-retry.html', overwrite: true, noWeb: true });
      assert.ok(via && via.artifactPath === 'empty-retry.html', 'agent-workspace build retries past empty answers, got ' + JSON.stringify(via && via.artifactPath));
      assert.ok(fs.readFileSync(path.join(process.cwd(), 'empty-retry.html'), 'utf8').includes('<nav'), 'saved artifact is the retried document');
    } finally {
      hooks.callAI = prevCall;
      try { fs.unlinkSync(path.join(process.cwd(), 'empty-retry.html')); } catch (e) {}
      try { fs.unlinkSync(path.join(process.cwd(), 'chode-artifact-build.html')); } catch (e) {}
    }
  }

  // Tool-less text answers must not repeat the identical prompt: after a
  // pass that produced no tool calls, the next pass carries an explicit
  // write-block nudge (this also keeps the bounded retry off the doom guard).
  {
    const prevCall = hooks.callAI;
    const buildPrompts = [];
    hooks.callAI = async (prompt) => {
      if (!String(prompt).includes('chode-artifact-build.html')) return { result: '<html><body><p>thin</p></body></html>', provider: 'mock', tokens: 1, latency: 1 };
      buildPrompts.push(String(prompt));
      return { result: 'Sure, I will get right on that right away.', provider: 'mock', tokens: 1, latency: 1 };
    };
    try {
      await chode.cmdAI({ prompt: 'Build me a test website about beacons.', output: 'nudge-check.html', overwrite: true, noWeb: true });
      const distinct = new Set(buildPrompts.map(p => p.length + ':' + p.slice(-160)));
      assert.ok(distinct.size >= 2, 'tool-less passes must vary the follow-up prompt, saw ' + buildPrompts.length + ' identical prompts');
      assert.ok(buildPrompts.some(p => /no tool calls/i.test(p)), 'follow-up passes must nudge toward emitting a tool block');
    } finally {
      hooks.callAI = prevCall;
      try { fs.unlinkSync(path.join(process.cwd(), 'nudge-check.html')); } catch (e) {}
      try { fs.unlinkSync(path.join(process.cwd(), 'chode-artifact-build.html')); } catch (e) {}
    }
  }

  // Fallback gate feedback: the retry passes must hear *why* the previous
  // pass failed, not just repeat the base prompt (a 3-file site keeps
  // failing the self-contained gate unless told so).
  {
    const prevCall = hooks.callAI;
    const cleanHtml = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Single</title><style>body{font-family:system-ui}nav a{margin-right:1em}</style></head><body><nav aria-label="Main"><a href="#home">Home</a><a href="#about">About</a></nav><main id="home"><h1>Single</h1><p>' + 'Real content sentence. '.repeat(20) + '</p></main><section id="about"><h2>About</h2><p>' + 'Second section content. '.repeat(10) + '</p></section></body></html>';
    const multiHtml = cleanHtml.replace('</head>', '<link rel="stylesheet" href="styles.css"></head>');
    const fallbackPrompts = [];
    let fbCalls = 0, multiServed = false;
    hooks.callAI = async (prompt) => {
      if (!String(prompt).includes('chode-artifact-build.html')) return { result: '<html><body><p>thin</p></body></html>', provider: 'mock', tokens: 1, latency: 1 };
      fallbackPrompts.push(String(prompt));
      fbCalls++;
      // Even calls end the turn so each pass writes exactly once; the first
      // write is multi-file (gate must complain), later writes are clean.
      if (fbCalls % 2 === 0) return { result: 'DONE: single file written.', provider: 'mock', tokens: 1, latency: 1 };
      const content = !multiServed ? (multiServed = true, multiHtml) : cleanHtml;
      return { result: '```tool\n' + JSON.stringify({ tool: 'write', args: { file: 'chode-artifact-build.html', content } }) + '\n```', provider: 'mock', tokens: 10, latency: 1 };
    };
    try {
      const via = await chode.cmdAI({ prompt: 'Build me a test website about beacons.', output: 'gate-feedback.html', overwrite: true, noWeb: true });
      const nudgePass = fallbackPrompts.find(p => p.includes('[NO TOOL CALLS]'));
      assert.ok(nudgePass && nudgePass.includes('self-contained output references local dependency'), 'retry pass hears the gate complaint, got ' + JSON.stringify(fallbackPrompts.map(p => p.slice(0,120) + ' ... ' + p.slice(-200))));
      assert.ok(via && via.artifactPath === 'gate-feedback.html', 'fallback converges after gate feedback, got ' + JSON.stringify(via && via.artifactPath));
    } finally {
      hooks.callAI = prevCall;
      try { fs.unlinkSync(path.join(process.cwd(), 'gate-feedback.html')); } catch (e) {}
      try { fs.unlinkSync(path.join(process.cwd(), 'chode-artifact-build.html')); } catch (e) {}
    }
  }

  // Accessible names for form controls: the reading-time dogfood page
  // shipped an unlabeled textarea and the validator accepted it.
  const a11yShell = inner => '<!doctype html><html><head><title>A11y</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{}</style></head><body><h1>A11y</h1><p>' + 'x'.repeat(120) + '</p>' + inner + '</body></html>';
  const bareTextarea = a11yShell("<textarea id=\"text\"></textarea>");
  assert.ok(chode.validateHtmlArtifact(bareTextarea, false).includes('accessible names for form controls'), 'bare textarea fails without site-copy mode');
  assert.ok(chode.validateHtmlArtifact(bareTextarea, true).includes('accessible names for form controls'), 'bare textarea fails site-copy mode too');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<label for=\"text\">Text</label><textarea id=\"text\"></textarea>"), false).includes('accessible names for form controls'), false, 'label[for] satisfies the check');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<textarea id=\"text\" aria-label=\"Text\"></textarea>"), false).includes('accessible names for form controls'), false, 'aria-label satisfies the check');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<label>Text<textarea name=\"text\"></textarea></label>"), false).includes('accessible names for form controls'), false, 'wrapping label satisfies the check');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<input type=\"hidden\" value=\"x\">"), false).includes('accessible names for form controls'), false, 'hidden inputs are ignored');
  assert.ok(chode.validateHtmlArtifact(a11yShell("<input type=\"text\" name=\"q\">"), false).includes('accessible names for form controls'), 'unlabeled text input is flagged');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<input type=\"text\" aria-labelledby=\"q-label\">"), false).includes('accessible names for form controls'), false, 'aria-labelledby satisfies the check');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<button>Copy</button>"), false).includes('accessible names for form controls'), false, 'button text counts as a name');
  assert.ok(chode.validateHtmlArtifact(a11yShell("<button></button>"), false).includes('accessible names for form controls'), 'empty button is flagged');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<button aria-label=\"Copy\"></button>"), false).includes('accessible names for form controls'), false, 'button aria-label counts');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<input type=\"submit\" value=\"Send\">"), false).includes('accessible names for form controls'), false, 'submit value counts as a name');
  assert.strictEqual(chode.validateHtmlArtifact(a11yShell("<p>No controls here.</p>"), false).includes('accessible names for form controls'), false, 'pages without controls are unaffected');

  const previousClassificationCall = hooks.callAI;
  const classificationCalls = [];
  try {
    hooks.callAI = async prompt => {
      classificationCalls.push(String(prompt));
      return { result: 'OK', provider: 'mock', tokens: 1, latency: 1 };
    };
    const concise = await chode.cmdAI({ prompt: 'Reply with the single word OK.' });
    assert.strictEqual(concise.result, 'OK');
    assert.strictEqual(classificationCalls.length, 1, 'cmdAI read-only task makes no plan or verifier call');
    assert.ok(classificationCalls[0].includes('[CHODE AGENT TOOLS'), 'model still receives its tool instructions');
    assert.ok(!classificationCalls[0].includes('[PLAN —') && !classificationCalls[0].includes('[VERIFY —'));
  } finally {
    hooks.callAI = previousClassificationCall;
  }

  const previousArtifactCall = hooks.callAI;
  const previousArtifactExitCode = process.exitCode;
  const artifactDisallow = ['write', 'edit', 'exec', 'toolbox', 'task'];
  const deniedArtifactTools = [];
  const artifactCallOptions = [];
  const failedArtifactPath = 'failed-tool-artifact.html';
  const execSideEffectPath = 'artifact-shell-side-effect.txt';
  try {
    let failedArtifactCalls = 0;
    hooks.callAI = async (modelPrompt, sessionId, forceProvider, options) => {
      failedArtifactCalls++;
      artifactCallOptions.push((options && options.disallow) || []);
      if (failedArtifactCalls === 1) {
        return {
          result: '```tool\n' + JSON.stringify([
            { tool: 'write', args: { file: failedArtifactPath, content: 'partial artifact' } },
            { tool: 'exec', args: { cmd: 'echo partial > ' + execSideEffectPath } }
          ]) + '\n```',
          provider: 'mock', tokens: 1, latency: 1
        };
      }
      return { result: 'This is not a complete HTML document.', provider: 'mock', tokens: 1, latency: 1 };
    };
    const deniedAttempt = await chode.cmdAI({
      prompt: 'Create one self-contained HTML artifact.',
      output: failedArtifactPath,
      onTool: event => { if (event.phase === 'done') deniedArtifactTools.push({ tool: event.call.tool, result: event.result }); }
    });
    assert.strictEqual(deniedAttempt, null, 'invalid final artifact is rejected');
    assert.strictEqual(failedArtifactCalls, 3, 'initial draft, then repair, both mocked');
    assert.deepStrictEqual(deniedArtifactTools.map(x => x.tool), ['write', 'exec']);
    assert.ok(deniedArtifactTools.every(x => !x.result.ok && /tool disabled in this mode/.test(x.result.error)), 'artifact-mode mutation and exec tools are denied');
    assert.deepStrictEqual(artifactCallOptions[0], artifactDisallow);
    assert.ok(!artifactCallOptions[0].includes('webfetch') && !artifactCallOptions[0].includes('read'), 'webfetch/read-only tools remain available');
    assert.ok(!fs.existsSync(path.join(process.cwd(), failedArtifactPath)), 'failed artifact leaves no partial output');
    assert.ok(!fs.existsSync(path.join(process.cwd(), execSideEffectPath)), 'denied exec has no shell side effect');

    const preservedPath = 'preserved-artifact.html';
    const preservedContent = 'pre-existing user file';
    fs.writeFileSync(path.join(process.cwd(), preservedPath), preservedContent, 'utf8');
    let preserveCalls = 0;
    hooks.callAI = async () => {
      preserveCalls++;
      return { result: 'still not HTML', provider: 'mock', tokens: 1, latency: 1 };
    };
    const failedOverwrite = await chode.cmdAI({
      prompt: 'Create one self-contained HTML artifact.', output: preservedPath, overwrite: true
    });
    assert.strictEqual(failedOverwrite, null);
    assert.strictEqual(preserveCalls, 2, 'invalid draft and repair are mocked');
    assert.strictEqual(fs.readFileSync(path.join(process.cwd(), preservedPath), 'utf8'), preservedContent, 'failed validation preserves a pre-existing file even with --overwrite');

    const validPath = 'validated-artifact.html';
    const validHtml = '<!doctype html><html><head><title>Validated</title></head><body><h1>Validated artifact</h1></body></html>';
    const expectedHtml = chode.extractHtmlArtifact(validHtml);
    const validToolResults = [];
    let validCalls = 0;
    hooks.callAI = async () => {
      validCalls++;
      if (validCalls === 1) {
        return {
          result: '```tool\n' + JSON.stringify({ tool: 'write', args: { file: validPath, content: 'partial artifact' } }) + '\n```',
          provider: 'mock', tokens: 1, latency: 1
        };
      }
      return { result: validHtml, provider: 'mock', tokens: 1, latency: 1 };
    };
    const validArtifact = await chode.cmdAI({
      prompt: 'Create one self-contained HTML artifact.', output: validPath,
      onTool: event => { if (event.phase === 'done') validToolResults.push(event.result); }
    });
    assert.ok(validArtifact && validArtifact.artifactPath === validPath);
    assert.strictEqual(validToolResults[0].ok, false, 'model-side write remains denied for valid drafts too');
    assert.strictEqual(fs.readFileSync(path.join(process.cwd(), validPath), 'utf8'), expectedHtml, 'only validated final HTML is written');
    assert.strictEqual(process.exitCode, previousArtifactExitCode, 'programmatic artifact paths do not leak an exit code');
  } finally {
    hooks.callAI = previousArtifactCall;
    process.exitCode = previousArtifactExitCode;
  }

  const previousFetchPage = hooks.fetchPage;
  const previousCallAI = hooks.callAI;
  const previousPublicHtml = webContext.fetchPublicHtml;
  const autoFetches = [];
  const toolFetches = [];
  let redirectFinal = null;
  let outputSequence = 0;
  const toolTestArtifact = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tool workflow test</title><style>body{font-family:system-ui}</style></head><body><h1>Summary</h1><p>This complete self-contained artifact gives the page a useful summary with enough visible content to satisfy the workflow quality check.</p></body></html>';
  hooks.fetchPage = async url => {
    autoFetches.push(url);
    return {
      url: redirectFinal || url,
      html: '<title>Auto-inspected source</title><body>Initial context marker.</body>'
    };
  };
  webContext.fetchPublicHtml = async url => {
    toolFetches.push(url);
    return {
      url,
      html: '<title>Mocked webfetch source</title><body>Normal fetch marker.</body>',
      contentType: 'text/html'
    };
  };
  async function runWebfetchPrompt(prompt, url) {
    const modelPrompts = [];
    const toolResults = [];
    let turn = 0;
    hooks.callAI = async modelPrompt => {
      modelPrompts.push(String(modelPrompt));
      turn++;
      if (turn === 1) {
        return {
          result: '```tool\n' + JSON.stringify({ tool: 'webfetch', args: { url } }) + '\n```',
          provider: 'mock', tokens: 2, latency: 1
        };
      }
      return { result: toolTestArtifact, provider: 'mock', tokens: 2, latency: 1 };
    };
    const result = await chode.cmdAI({
      prompt,
      output: 'webfetch-dedupe-' + (++outputSequence) + '.html',
      onTool: event => { if (event.phase === 'done') toolResults.push(event.result); }
    });
    assert.ok(result && result.artifactPath);
    return { modelPrompts, toolResults };
  }
  try {
    let run = await runWebfetchPrompt(
      'Summarize https://example.com/', 'https://EXAMPLE.com:443/#section'
    );
    let modelPrompts = run.modelPrompts;
    assert.strictEqual(autoFetches.length, 1);
    assert.strictEqual(toolFetches.length, 0, 'equivalent URL must not be fetched a second time');
    assert.ok(modelPrompts[0].includes('Initial context marker.'), 'initial inspection is included in task context');
    assert.ok(modelPrompts[1].includes('"alreadyInspected":true'), JSON.stringify(run.toolResults));
    assert.ok(modelPrompts[1].includes('Page content is already in the initial task context; use that source instead of fetching again.'));
    assert.ok(modelPrompts[1].includes('Initial context marker.'),'continuation retains the inspected source');
    assert.ok(!modelPrompts[1].split('[TOOL RESULTS').pop().includes('Initial context marker.'),'dedupe tool result does not duplicate the retained source');
    assert.strictEqual(run.toolResults[0].alreadyInspected, true);
    assert.deepStrictEqual(Object.keys(run.toolResults[0]).sort(), ['alreadyInspected', 'note', 'ok', 'url']);
    assert.strictEqual(run.toolResults[0].url, 'https://EXAMPLE.com:443/#section');

    redirectFinal = 'https://example.com/final';
    run = await runWebfetchPrompt(
      'Summarize https://example.com/redirect', 'https://EXAMPLE.com:443/final#top'
    );
    modelPrompts = run.modelPrompts;
    assert.strictEqual(toolFetches.length, 0, 'redirect-final URL is also in the initial context');
    assert.ok(modelPrompts[1].includes('"alreadyInspected":true'));
    assert.strictEqual(run.toolResults[0].alreadyInspected, true);

    redirectFinal = null;
    run = await runWebfetchPrompt(
      'Summarize https://example.com/', 'https://example.com/other?mode=full'
    );
    modelPrompts = run.modelPrompts;
    assert.deepStrictEqual(toolFetches, ['https://example.com/other?mode=full'], 'different path/query still uses normal fetch');
    assert.ok(modelPrompts[1].includes('Normal fetch marker.'));
    assert.strictEqual(run.toolResults[0].alreadyInspected, undefined);

    run = await runWebfetchPrompt(
      'Summarize the page from the tool result.', 'https://example.com/'
    );
    modelPrompts = run.modelPrompts;
    assert.strictEqual(autoFetches.length, 3, 'later run with no URL does not auto-inspect anything');
    assert.deepStrictEqual(toolFetches, ['https://example.com/other?mode=full', 'https://example.com/']);
    assert.ok(modelPrompts[1].includes('Normal fetch marker.'), 'inspection state does not leak into a later task');
    assert.strictEqual(run.toolResults[0].alreadyInspected, undefined);
  } finally {
    hooks.fetchPage = previousFetchPage;
    hooks.callAI = previousCallAI;
    webContext.fetchPublicHtml = previousPublicHtml;
  }

  const previousExitCode = process.exitCode;
  try {
    hooks.callAI = async () => null;
    const programmaticFailure = await chode.cmdAI({
      prompt: 'Create one self-contained HTML artifact.',
      output: 'programmatic-failure.html'
    });
    assert.strictEqual(programmaticFailure, null);
    assert.strictEqual(process.exitCode, previousExitCode, 'programmatic artifact failure leaves process exit status unchanged');
  } finally {
    hooks.callAI = previousCallAI;
    process.exitCode = previousExitCode;
  }

  function runCliArtifactFailure(mode) {
    const chodePath = path.resolve(__dirname, '..', 'chode.js');
    const validHtml = '<!doctype html><html><head><title>Saved</title></head><body><h1>Saved</h1></body></html>';
    const childSource = [
      'const fs=require("fs");',
      'const chode=require(' + JSON.stringify(chodePath) + ');',
      'const mode=' + JSON.stringify(mode) + ';',
      'const output=mode==="save"?"cannot-save.html":mode+".html";',
      'const validHtml=' + JSON.stringify(validHtml) + ';',
      'if(mode==="save")fs.mkdirSync(output);',
      'let calls=0;',
      'chode.__testHooks.callAI=async function(){calls++;if(mode==="exhausted")return null;if(mode==="invalid")return {result:"not HTML",provider:"mock"};return {result:validHtml,provider:"mock"};};',
      'chode.cmdAI({prompt:"Create one self-contained HTML artifact.",output:output,overwrite:mode==="save"},{cli:true}).then(function(result){var okCalls=mode==="exhausted"?calls>=1:calls===(mode==="invalid"?2:1);if(result!==null||!okCalls)process.exitCode=2;});'
    ].join('');
    return spawnSync(process.execPath, ['-e', childSource], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 30000, windowsHide: true
    });
  }
  for (const [mode, errorText] of [
    ['exhausted', 'No HTML artifact saved: no provider response was returned.'],
    ['invalid', 'No HTML artifact saved: complete HTML document.'],
    ['save', 'Could not save HTML artifact:']
  ]) {
    const child = runCliArtifactFailure(mode);
    assert.ifError(child.error);
    assert.strictEqual(child.status, 1, mode + ' HTML artifact failure must exit 1; stderr: ' + child.stderr);
    assert.ok(child.stderr.includes(errorText), mode + ' failure should explain why no artifact was saved');
  }

  const previousV2ExitCode = process.exitCode;
  try {
    const chodePath = path.resolve(__dirname, '..', 'chode.js');
    const writeEnvelope = '```tool\n{"tool":"write","args":{"file":"cli-unverified.js","content":"module.exports = 1;\\n"}}\n```';
    const v2Source = [
      'const fs=require("fs");',
      'const chode=require(' + JSON.stringify(chodePath) + ');',
      'const writeEnvelope=' + JSON.stringify(writeEnvelope) + ';',
      'let calls=0;',
      'chode.__testHooks.callAI=async function(prompt){calls++;if(String(prompt).includes("[VERIFY"))return null;if(calls===1)return {result:writeEnvelope,provider:"mock"};return {result:"DONE: wrote the file.",provider:"mock"};};',
      'chode.cmdAI({prompt:"Write cli-unverified.js."},{cli:true}).then(function(result){if(!result||!/^DONE/.test(result.result)||!/deterministic checks passed/i.test(result.result)||result.completionStatus!=="VERIFIED"||calls!==3||!fs.existsSync("cli-unverified.js")){process.exitCode=2;return;}console.log(result.result);});'
    ].join('');
    const child = spawnSync(process.execPath, ['-e', v2Source], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 30000, windowsHide: true
    });
    assert.ifError(child.error);
    assert.strictEqual(child.status, 0, 'v2 deterministically certified work must exit 0; stdout: ' + child.stdout + ' stderr: ' + child.stderr);
    assert.ok((child.stdout || '').includes('deterministic checks passed'), 'CLI discloses that verification was local/deterministic');
  } finally {
    process.exitCode = previousV2ExitCode;
  }

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
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 120000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    assert.ok(fs.existsSync(path.join(temp, 'site-copy.html')));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
