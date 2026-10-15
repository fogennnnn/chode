'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

const repo = path.resolve(__dirname, '..');
const cli = path.join(repo, 'chode.js');
let checks = 0;

function verify(value, message) {
  checks++;
  assert.ok(value, message);
}

function equal(actual, expected, message) {
  checks++;
  assert.strictEqual(actual, expected, message);
}

function run(args, cwd) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true
  });
  if (result.error) throw result.error;
  equal(result.status, 0, [args.join(' '), result.stdout, result.stderr].join('\n'));
  return (result.stdout || '') + (result.stderr || '');
}

async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-cli-smoke-'));
  try {
    const syntax = spawnSync(process.execPath, ['--check', cli], { encoding: 'utf8' });
    equal(syntax.status, 0, syntax.stderr);
    verify(/chode/.test(run(['help'], temp)), 'help should identify chode');
    verify(/Groq|Gemini|Mistral/.test(run(['models'], temp)), 'models should list providers');
    const quickkey = run(['quickkey', 'groq'], temp);
    verify(/Groq/.test(quickkey), 'quickkey should show provider setup');
    verify(process.platform === 'win32' ? /PowerShell: \$env:GROQ_API_KEY/.test(quickkey) : /export GROQ_API_KEY/.test(quickkey), 'quickkey should show platform-appropriate environment syntax');
    verify(/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(run(['util', 'uuid'], temp)), 'uuid helper should return UUID');
    verify(/8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4/i.test(run(['util', 'hash', 'sha256', 'hi'], temp)), 'hash helper should return SHA-256');
    verify(/All dependencies healthy/.test(run(['deps'], temp)), 'dependency check should run');
    verify(/sessions cleared/i.test(run(['session', 'reset'], temp)), 'reset should tolerate missing session directory');
    verify(/Session not found/i.test(run(['session', 'show', 'missing-session'], temp)), 'missing session should be reported');
    verify(/Invalid session id/.test(run(['session', 'show', '..\\outside'], temp)), 'session paths should be rejected');

    const projects = [
      ['api-status-demo', 'api-status-demo'],
      ['Budget Tracker', 'budget-tracker'],
      ['docs_site', 'docs_site'],
      ['99-status', '99-status'],
      ['Edge.Check', 'edge-check']
    ];
    for (const [input, slug] of projects) {
      run(['new', input], temp);
      const project = path.join(temp, slug);
      const workerPath = path.join(project, 'worker.js');
      const workerTestPath = path.join(project, 'worker.test.js');
      verify(fs.existsSync(workerPath), slug + ': worker.js exists');
      verify(fs.existsSync(workerTestPath), slug + ': worker.test.js exists');
      verify(fs.existsSync(path.join(project, 'wrangler.toml')), slug + ': wrangler config exists');
      verify(fs.existsSync(path.join(project, 'package.json')), slug + ': package metadata exists');
      const packageJson = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8'));
      equal(packageJson.name, slug, slug + ': package name');
      equal(packageJson.type, 'module', slug + ': ESM mode');
      equal(packageJson.scripts.test, 'node --test', slug + ': offline test script');
      const workerCheck = spawnSync(process.execPath, ['--check', workerPath], { cwd: project, encoding: 'utf8' });
      equal(workerCheck.status, 0, slug + ': worker syntax (' + workerCheck.stderr + ')');
      const testRun = spawnSync(process.execPath, ['--test', workerTestPath], { cwd: project, encoding: 'utf8', timeout: 15000 });
      equal(testRun.status, 0, slug + ': generated route suite (' + testRun.stdout + testRun.stderr + ')');

      const worker = await import(pathToFileURL(workerPath).href + '?project=' + encodeURIComponent(slug));
      const home = await worker.default.fetch(new Request('https://example.test/'), {});
      equal(home.status, 200, slug + ': home status');
      verify((await home.text()).includes('<h1>' + slug + '</h1>'), slug + ': title rendered');
      verify(/text\/html/.test(home.headers.get('content-type')), slug + ': HTML content type');
      const status = await worker.default.fetch(new Request('https://example.test/api/status'), {});
      equal(status.status, 200, slug + ': status endpoint');
      const body = await status.json();
      equal(body.service, slug, slug + ': status service name');
      verify(body.ok === true && Number.isFinite(body.ts), slug + ': status response shape');
      verify(/application\/json/.test(status.headers.get('content-type')), slug + ': JSON content type');
      equal(status.headers.get('cache-control'), 'no-store', slug + ': no-store status response');
      equal(status.headers.get('x-content-type-options'), 'nosniff', slug + ': status security header');
      const notFound = await worker.default.fetch(new Request('https://example.test/missing'), {});
      equal(notFound.status, 404, slug + ': unknown route');
      equal(await notFound.text(), 'Not found', slug + ': 404 body');
      const method = await worker.default.fetch(new Request('https://example.test/', { method: 'POST' }), {});
      equal(method.status, 405, slug + ': unsupported method');
      equal(method.headers.get('allow'), 'GET, HEAD', slug + ': supported method hint');
    }

    run(['new', 'smoke-skill', '--skill'], temp);
    const skill = fs.readFileSync(path.join(temp, 'skills', 'smoke-skill', 'SKILL.md'), 'utf8');
    verify(skill.includes('name: smoke-skill'), 'skill scaffold metadata');
    verify(skill.includes('## Usage'), 'skill scaffold usage section');
    verify(JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8')).files.includes('helios-ledger.js'), 'npm package includes HELIOS command module');
    verify(JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8')).files.includes('nosignups.js'), 'npm package includes no-signup command module');
    verify(JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8')).files.includes('web-context.js'), 'npm package includes automatic page inspector');
    verify(JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8')).files.includes('toolbox.js'), 'npm package includes tool auto-installer');
    console.log('✓ dogfood builds: 5 Worker projects + skill scaffold');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }

  console.log('✓ CLI smoke tests passed (' + checks + ' assertions)');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
