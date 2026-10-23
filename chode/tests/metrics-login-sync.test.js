'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const vm = require('vm');
const { spawnSync } = require('child_process');

function loadWorker(mockKv) {
  const root = path.resolve(__dirname, '..');
  let source = fs.readFileSync(path.join(root, 'chode-hq-worker.js'), 'utf8');
  source = source.replace("import INSTALL_ASSETS from './install-assets.js';", '').replace('export default {', 'module.exports = {');
  const sandbox = {
    module: { exports: {} },
    INSTALL_ASSETS: require('../install-assets.js'),
    URL, Request, Response,
    crypto: require('crypto').webcrypto || crypto,
    TextEncoder,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'chode-hq-worker.js' });
  const handler = sandbox.module.exports;
  return {
    async fetch(pathname, options) {
      const req = new Request('https://chode.borken.app' + pathname, options || {});
      return handler.fetch(req, { METRICS_KV: mockKv });
    },
  };
}

function memoryKv() {
  const store = new Map();
  return {
    async get(k) { return store.has(k) ? store.get(k) : null; },
    async put(k, v) { store.set(k, v); },
    async delete(k) { store.delete(k); },
  };
}

async function fixture() {
  const chode = require('../chode.js');
  const now = Date.now();
  const day = (ms) => new Date(ms).toISOString().slice(0, 10);
  const lines = [
    { t: now - 1000, pid: 'kilo', tok: 100, lat: 200, err: 0 },
    { t: now - 2000, pid: 'ovh', tok: 50, lat: 400, err: 1 },
    { t: now - 40 * 86400000, pid: 'kilo', tok: 999, lat: 10, err: 0 },
  ].map((e) => JSON.stringify(e)).join('\n') + '\n';
  fs.mkdirSync(path.join(process.cwd(), '.chode', 'monitor'), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), '.chode', 'monitor', 'usage.jsonl'), lines, 'utf8');

  const exported = chode.metricsExport({ days: 30 });
  assert.strictEqual(exported.schema, 1);
  assert.strictEqual(exported.days, 30);
  assert.strictEqual(exported.totals.requests, 2);
  assert.strictEqual(exported.totals.tokens, 150);
  assert.strictEqual(exported.totals.errors, 1);
  assert.ok(exported.byDay.some((d) => d.day === day(now - 1000) && d.tokens === 150));
  assert.ok(exported.byProvider.some((p) => p.id === 'kilo' && p.tokens === 100));
  assert.ok(exported.byProvider.some((p) => p.id === 'ovh' && p.tokens === 50));

  const login = await chode.cmdLogin(['workstation']);
  assert.strictEqual(login.handle, 'workstation');
  const me = chode.cmdWhoami();
  assert.strictEqual(me.handle, 'workstation');
  const identity = chode.metricsIdentity();
  assert.ok(/^[a-f0-9]{48}$/.test(identity.token));

  let seen = null;
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      seen = { url: req.url, auth: req.headers.authorization, body: JSON.parse(raw) };
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, stored: true, handle: 'workstation', updatedAt: new Date().toISOString() }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const endpoint = 'http://127.0.0.1:' + server.address().port + '/api/metrics';
    const synced = await chode.cmdMetricsSync(['--endpoint', endpoint, '--yes'], exported);
    assert.ok(synced && synced.ok, 'sync succeeds against a local endpoint');
    assert.strictEqual(seen.auth, 'Bearer ' + identity.token);
    assert.strictEqual(seen.body.handle, 'workstation');
    assert.strictEqual(seen.body.exported.schema, 1);
  } finally {
    server.close();
  }
  assert.strictEqual(await chode.cmdMetricsSync(['--endpoint', 'http://127.0.0.1:1/api/metrics', '--yes'], exported), null);

  chode.cmdLogout();
  assert.strictEqual(chode.metricsIdentity(), null);
  assert.strictEqual(await chode.cmdLogin(['bad handle!']), null);

  const kv = memoryKv();
  const worker = loadWorker(kv);
  const page = await worker.fetch('/metrics');
  assert.strictEqual(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes('id="m-handle"') && html.includes('id="m-days"') && html.includes('Tokens per day'));

  const record = { token: 'a'.repeat(48), handle: 'workstation', exported };
  let r = await worker.fetch('/api/metrics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(record) });
  assert.strictEqual(r.status, 200);
  assert.strictEqual((await r.json()).stored, true);

  r = await worker.fetch('/api/metrics');
  assert.strictEqual(r.status, 401);
  r = await worker.fetch('/api/metrics', { headers: { authorization: 'Bearer ' + 'b'.repeat(48) } });
  assert.strictEqual(r.status, 404);
  r = await worker.fetch('/api/metrics', { headers: { authorization: 'Bearer ' + record.token } });
  assert.strictEqual(r.status, 200);
  const got = await r.json();
  assert.strictEqual(got.record.handle, 'workstation');
  assert.strictEqual(got.record.totals.tokens, 150);

  r = await worker.fetch('/api/metrics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: 'short', handle: 'x', exported }) });
  assert.strictEqual(r.status, 400);

  r = await worker.fetch('/api/metrics', { method: 'DELETE', headers: { authorization: 'Bearer ' + record.token } });
  assert.strictEqual(r.status, 200);
  r = await worker.fetch('/api/metrics', { headers: { authorization: 'Bearer ' + record.token } });
  assert.strictEqual(r.status, 404);

  const noKv = loadWorker(null);
  r = await noKv.fetch('/api/metrics', { headers: { authorization: 'Bearer ' + record.token } });
  assert.strictEqual(r.status, 503);

  console.log('PASS metrics login: optional identity, local aggregates, explicit sync, KV-backed graphs');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-metrics-login-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
