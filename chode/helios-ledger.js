#!/usr/bin/env node
/**
 * helios-ledger — chode-usable HELIOS ledger helper (zero-dep, Node builtins only).
 *
 * - Canonical JSON content {task, files, result, sha}; sha covers {task,files,result}.
 * - POST https://ai.oooooooooo.se/api/v1/records with `Idempotency-Key: workUnitId`
 *   (retrying with the same key replays — no duplicate leaf).
 * - 429 honors Retry-After with exponential backoff; client paces sends >=600ms
 *   apart so the 100/min ledger limit is respected.
 * - Identity bootstrap mirrors memory.js ensureHeliosIdentity (POST
 *   /api/v1/accounts, 3-32ch username) + token in .chode/config.json
 *   (git-ignored, never logged).
 * - Chatter is stderr-only; stdout carries ONLY pure JSON receipts/payloads.
 */

'use strict';

var https = require('https');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

// ─── Configuration (mirrors memory.js :20-21) ────────────────────────────────

var HELIOS_URL = 'https://ai.oooooooooo.se';
var HELIOS_HOST = 'ai.oooooooooo.se';
var CONFIG_DIR = path.join(process.cwd(), '.chode');
var CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
var SESSION_DIR = path.join(CONFIG_DIR, 'sessions');
var RATE_FILE = path.join(CONFIG_DIR, 'helios-rate.json');

var RECORDS_PATH = '/api/v1/records';
var ACCOUNTS_PATH = '/api/v1/accounts';
var REQUEST_TIMEOUT_MS = 10000; // mirrors memory.js vaultRequest Bearer 10s timeout
var MAX_ATTEMPTS = 5;
var MIN_SEND_GAP_MS = 600; // 100/min ledger limit, client-side pacing
var LEDGER_MODEL = 'chode-ledger/1';

// ─── stderr-only chatter (stdout stays pure receipts) ─────────────────────────

function say(msg) { try { process.stderr.write(String(msg) + '\n'); } catch (e) {} }

// ─── Token load/save + agent hash (mirrors memory.js :38-59) ─────────────────

function loadHeliosToken() {
  try {
    var cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return cfg.heliosToken || null;
  } catch (e) { return null; }
}

function saveHeliosToken(token) {
  var cfgPath = CONFIG_FILE;
  var cfg = { providers: {}, heliosToken: null, omniroute: { port: 20128 } };
  try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (e) {}
  cfg.heliosToken = token; // token value is never printed or logged anywhere here
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
}

function computeAgentHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
}

// ─── Canonical JSON (stable key order, recursive) ─────────────────────────────

function canonicalStringify(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalStringify).join(',') + ']';
  }
  if (typeof value === 'object') {
    var keys = Object.keys(value).sort();
    var parts = [];
    for (var i = 0; i < keys.length; i++) {
      var v = value[keys[i]];
      if (v === undefined || typeof v === 'function') continue; // JSON parity
      parts.push(JSON.stringify(keys[i]) + ':' + canonicalStringify(v));
    }
    return '{' + parts.join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

// ─── Payload construction (pure, offline-testable) ────────────────────────────

function idempotencyKeyFor(workUnit) {
  var id = workUnit && (workUnit.id || workUnit.workUnitId);
  if (!id) throw new Error('helios-ledger: workUnit.id (workUnitId) is required');
  return String(id);
}

function buildContent(workUnit) {
  if (!workUnit || typeof workUnit !== 'object') throw new Error('helios-ledger: workUnit object is required');
  if (!workUnit.task) throw new Error('helios-ledger: workUnit.task is required');
  var core = {
    task: workUnit.task,
    files: workUnit.files || [],
    result: workUnit.result != null ? workUnit.result : ''
  };
  var sha = workUnit.sha || sha256Hex(canonicalStringify(core));
  return { task: core.task, files: core.files, result: core.result, sha: sha };
}

function buildRecordPayload(workUnit, opts) {
  opts = opts || {};
  var key = idempotencyKeyFor(workUnit);
  var content = buildContent(workUnit);
  var canonical = canonicalStringify(content);
  var contentHash = sha256Hex(canonical);
  var body = {
    model: opts.model || LEDGER_MODEL,
    context: opts.context || {},
    content: content,
    content_hash: contentHash
  };
  return { key: key, content: content, canonical: canonical, contentHash: contentHash, body: body };
}

// ─── Backoff (pure, offline-testable) ─────────────────────────────────────────
// 429 honors Retry-After; otherwise exponential base 1s with jitter, capped.

function parseRetryAfterMs(headers, nowMs) {
  try {
    if (!headers) return null;
    var raw = headers['retry-after'] != null ? headers['retry-after']
      : headers['Retry-After'] != null ? headers['Retry-After'] : null;
    if (raw == null || raw === '') return null;
    var s = String(raw).trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10) * 1000;
    var t = Date.parse(s); // HTTP-date form
    if (!isNaN(t)) {
      var now = nowMs != null ? nowMs : Date.now();
      return Math.max(0, t - now);
    }
    return null;
  } catch (e) { return null; }
}

function nextBackoffMs(attempt, retryAfterMs, rand) {
  // attempt is 1-based (attempt number that just failed).
  var r = typeof rand === 'function' ? rand() : Math.random();
  var jitter = Math.floor(r * 250);
  if (retryAfterMs != null && retryAfterMs >= 0) {
    return Math.min(retryAfterMs + jitter, 60000);
  }
  var exp = 1000 * Math.pow(2, Math.max(0, attempt - 1));
  return Math.min(exp + jitter, 30000);
}

function sleep(ms, sleepFn) {
  if (sleepFn) return sleepFn(ms);
  return new Promise(function (res) { setTimeout(res, ms); });
}

// ─── HTTPS with Bearer + 10s timeout (mirrors memory.js :82-115) ──────────────

function heliosRequest(method, reqPath, token, bodyObj, extraHeaders) {
  return new Promise(function (resolve, reject) {
    var payload = bodyObj != null ? JSON.stringify(bodyObj) : null;
    var headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'chode/1.0 (helios-ledger)'
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (extraHeaders) {
      for (var k in extraHeaders) headers[k] = extraHeaders[k];
    }
    var req = https.request({
      hostname: HELIOS_HOST,
      path: reqPath,
      method: method,
      headers: headers
    }, function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        var parsed = data;
        try { parsed = data ? JSON.parse(data) : null; } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers || {}, body: parsed });
      });
    });
    req.on('error', function (e) { reject(e); });
    req.setTimeout(REQUEST_TIMEOUT_MS, function () { req.destroy(); reject(new Error('timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Identity bootstrap (mirrors memory.js :169-212) ──────────────────────────

function validUsername(name) {
  return typeof name === 'string' && /^[a-zA-Z0-9-]{3,32}$/.test(name);
}

async function createHeliosAccount(username, requestFn) {
  if (!validUsername(username)) throw new Error('helios-ledger: username must be 3-32 chars [a-z0-9-]');
  if (requestFn) return requestFn(username);
  var res = await heliosRequest('POST', ACCOUNTS_PATH, null, { username: username });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error('helios-ledger: account create failed (http ' + res.status + ')');
  }
  if (!res.body || !res.body.token) throw new Error('helios-ledger: account response missing token');
  return res.body;
}

async function ensureHeliosIdentity(opts) {
  opts = opts || {};
  var token = loadHeliosToken();
  if (token) return token;
  if (opts.dryRun) return null; // dry-run never touches the network, not even bootstrap
  var username = 'chode-' + Date.now().toString(36).slice(-6);
  say('  Creating HELIOS identity...');
  var account = await createHeliosAccount(username, opts.requestFn);
  token = account.token;
  saveHeliosToken(token); // stored in git-ignored .chode/config.json, never logged
  say('  Identity created.'); // username/token deliberately not printed
  return token;
}

// ─── 100/min pacing ───────────────────────────────────────────────────────────

async function paceForLimit(sleepFn, nowFn) {
  var now = nowFn ? nowFn() : Date.now();
  var last = 0;
  try { last = JSON.parse(fs.readFileSync(RATE_FILE, 'utf8')).lastSend || 0; } catch (e) {}
  var gap = now - last;
  if (last && gap < MIN_SEND_GAP_MS) await sleep(MIN_SEND_GAP_MS - gap, sleepFn);
}

function markSend(nowFn) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(RATE_FILE, JSON.stringify({ lastSend: nowFn ? nowFn() : Date.now() }), 'utf8');
  } catch (e) {}
}

// ─── heliosRecord(workUnit) ───────────────────────────────────────────────────

async function heliosRecord(workUnit, opts) {
  opts = opts || {};
  var live = opts.live !== false; // callers pass {live:false} for dry-run
  var payload = buildRecordPayload(workUnit, { model: opts.model, context: opts.context });
  var key = payload.key;

  if (!live) {
    // Dry-run: pure preview, zero network (no bootstrap, no POST, no receipt).
    return { dryRun: true, key: key, content: payload.content, canonical: payload.canonical, content_hash: payload.contentHash, body: payload.body };
  }

  var sleepFn = opts.sleepFn || null;
  var nowFn = opts.nowFn || null;
  var requestFn = opts.requestFn || null; // injected transport for offline tests
  var postFn = requestFn || function (pathArg, tokenArg, bodyArg, headersArg) {
    return heliosRequest('POST', pathArg, tokenArg, bodyArg, headersArg);
  };

  var token = await ensureHeliosIdentity({ dryRun: false, requestFn: opts.accountRequestFn });
  var agentHash = token ? computeAgentHash(token) : null;
  if (agentHash && (!opts.context || !opts.context.agent)) {
    payload.body.context = payload.body.context || {};
    payload.body.context.agent = agentHash;
  }

  await paceForLimit(sleepFn, nowFn);
  var lastErr = null;
  for (var attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      markSend(nowFn);
      var res = await postFn(RECORDS_PATH, token, payload.body, { 'Idempotency-Key': key });
      if (res.status === 200 || res.status === 201) {
        var b = res.body || {};
        var receipt = {
          id: b.id || b.record_id || key,
          content_hash: b.content_hash || b.sha256 || payload.contentHash,
          verifiable_at: HELIOS_URL + RECORDS_PATH + '/' + (b.id || b.record_id || key)
        };
        if (opts.persist !== false) saveReceipt(receipt, opts.sessionId);
        return receipt;
      }
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        var waitMs = nextBackoffMs(attempt, parseRetryAfterMs(res.headers, nowFn ? nowFn() : Date.now()));
        lastErr = new Error('helios-ledger: http ' + res.status + ' (attempt ' + attempt + '/' + MAX_ATTEMPTS + ')');
        if (attempt >= MAX_ATTEMPTS) break;
        say('  Rate-limited/transient (http ' + res.status + '), backing off ' + waitMs + 'ms...');
        await sleep(Math.max(waitMs, MIN_SEND_GAP_MS), sleepFn);
        continue;
      }
      throw new Error('helios-ledger: record POST failed (http ' + res.status + ')');
    } catch (e) {
      lastErr = e;
      var msg = String((e && e.message) || e);
      var transient = /timeout|ECONNRESET|fetch failed|ENOTFOUND|ETIMEDOUT/i.test(msg);
      if (!transient || attempt >= MAX_ATTEMPTS) break;
      var waitMs2 = nextBackoffMs(attempt, null);
      say('  Transient error (' + msg.slice(0, 80) + '), backing off ' + waitMs2 + 'ms...');
      await sleep(waitMs2, sleepFn);
    }
  }
  throw lastErr || new Error('helios-ledger: record failed');
}

// ─── Receipt persistence (next to session) ────────────────────────────────────

function saveReceipt(receipt, sessionId) {
  var safe = String((receipt && receipt.id) || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'unknown';
  var file = path.join(SESSION_DIR, 'helios-' + safe + '.json');
  try {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    var doc = { id: receipt.id, content_hash: receipt.content_hash, verifiable_at: receipt.verifiable_at };
    if (sessionId) doc.session = sessionId;
    doc.recordedAt = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(doc, null, 2), 'utf8');
  } catch (e) { say('  Warning: could not persist receipt (' + String((e && e.message) || e).slice(0, 80) + ')'); }
  return file;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
// Default is dry-run: prints canonical payload + key, NO network write.
// Explicit --live performs the real ledger write + persists the receipt.

function parseCli(argv) {
  var out = { live: false, file: null, task: null, result: null, id: null, session: null };
  argv = argv || [];
  for (var i = 0; i < argv.length; i++) {
    var a = String(argv[i]);
    if (a === '--live') out.live = true;
    else if (a === '--dry-run') out.live = false;
    else if (a === '--file' && argv[i + 1]) out.file = argv[++i];
    else if (a === '--task' && argv[i + 1]) out.task = argv[++i];
    else if (a === '--result' && argv[i + 1]) out.result = argv[++i];
    else if (a === '--id' && argv[i + 1]) out.id = argv[++i];
    else if (a === '--session' && argv[i + 1]) out.session = argv[++i];
  }
  return out;
}

function defaultWorkUnit(flags) {
  if (flags.file) {
    try {
      var raw = fs.readFileSync(path.isAbsolute(flags.file) ? flags.file : path.join(process.cwd(), flags.file), 'utf8');
      var parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.workUnitId)) return parsed;
      return {
        id: flags.id || ('work-' + Date.now().toString(36)),
        task: flags.task || 'helios-record',
        files: parsed.files || [],
        result: parsed.result != null ? parsed.result : raw.slice(0, 4000)
      };
    } catch (e) { throw new Error('helios-ledger: cannot read --file ' + flags.file + ' (' + String((e && e.message) || e).slice(0, 80) + ')'); }
  }
  return {
    id: flags.id || ('work-' + Date.now().toString(36)),
    task: flags.task || 'helios-record dry-run',
    files: [],
    result: flags.result != null ? flags.result : 'ok'
  };
}

async function cmdHeliosRecord(argv) {
  var flags = parseCli(argv);
  var workUnit = defaultWorkUnit(flags);
  if (!flags.live) {
    var preview = await heliosRecord(workUnit, { live: false });
    // stdout: pure payload preview only. Everything else is stderr.
    console.log(JSON.stringify({ mode: 'dry-run', key: preview.key, content: preview.content, canonical: preview.canonical, content_hash: preview.content_hash, note: 'no network write; rerun with --live to record' }, null, 2));
    say('  Dry-run: no ledger write. Use --live for a real write.');
    return preview;
  }
  var receipt = await heliosRecord(workUnit, { live: true, sessionId: flags.session || undefined });
  // stdout: pure receipt only.
  console.log(JSON.stringify(receipt, null, 2));
  return receipt;
}

try {
  module.exports = {
    HELIOS_URL: HELIOS_URL,
    RECORDS_PATH: RECORDS_PATH,
    canonicalStringify: canonicalStringify,
    sha256Hex: sha256Hex,
    idempotencyKeyFor: idempotencyKeyFor,
    buildContent: buildContent,
    buildRecordPayload: buildRecordPayload,
    parseRetryAfterMs: parseRetryAfterMs,
    nextBackoffMs: nextBackoffMs,
    loadHeliosToken: loadHeliosToken,
    saveHeliosToken: saveHeliosToken,
    computeAgentHash: computeAgentHash,
    ensureHeliosIdentity: ensureHeliosIdentity,
    heliosRecord: heliosRecord,
    saveReceipt: saveReceipt,
    cmdHeliosRecord: cmdHeliosRecord
  };
} catch (e) {}

if (require.main === module) {
  cmdHeliosRecord(process.argv.slice(2)).catch(function (e) {
    say('  helios-record failed: ' + String((e && e.message) || e).split('\n')[0]);
    process.exit(1);
  });
}
