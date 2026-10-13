#!/usr/bin/env node
/**
 * ============================================================
 * chode — The Self-Healing Coding Harness
 * Free tiers. HEMO auto-provisioning. Zero lock-in.
 *
 * Routes across 15 providers with automatic key
 * provisioning via HEMO mail. Never stops. Exponential backoff
 * retry, checkpoint recovery, and circuit breaker failover.
 *
 * Usage:
 *   node chode.js ai [prompt]             AI call with auto-fallback routing
 *   node chode.js project <spec>          Run multi-step project
 *   node chode.js scan                    Probe all free-tier providers
 *   node chode.js score                   Show live leaderboard
 *   node chode.js status                  Full health dashboard
 *   node chode.js provision               Auto-request free-tier keys via HEMO
 *   node chode.js auth                    Set or rotate API keys
 *   node chode.js models                  List all providers
 *   node chode.js heal                    Force full re-scan
 *   node chode.js monitor                 Background health monitoring
 *   node chode.js session [list|show|reset] Manage sessions
 *   node chode.js new <name>              Scaffold a Cloudflare Worker
 *   node chode.js deps [check|install]    Manage dependencies
 *   node chode.js init                    One-time setup
 *   node chode.js help
 * ============================================================
 */

'use strict';

const { execSync, spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Paths ─────────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const CONFIG_DIR = path.join(ROOT, '.chode');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SESSION_DIR = path.join(CONFIG_DIR, 'sessions');
const MONITOR_DIR = path.join(CONFIG_DIR, 'monitor');
const LEADERBOARD_FILE = path.join(MONITOR_DIR, 'leaderboard.json');
const CHECKPOINT_FILE = path.join(CONFIG_DIR, 'checkpoint.json');
const PROVIDER_REGISTRY_FILE = path.join(MONITOR_DIR, 'registry.json');
  const USAGE_FILE = path.join(MONITOR_DIR, 'usage.json');
  const USAGE_LOG = path.join(MONITOR_DIR, 'usage.jsonl');
const AFK_TIMEOUT = 90;
const HEALTH_INTERVAL = 30000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 120000;
const PARALLEL_PROVIDERS = 3;
const MAX_RETRY = 5;
const RETRY_BASE_DELAY = 1000;
const AGENTS_FILE = path.join(CONFIG_DIR, 'agents.json');
const TASKS_DIR = path.join(CONFIG_DIR, 'tasks');
const QUEUE_FILE = path.join(CONFIG_DIR, 'queue.json');
const COSTS_FILE = path.join(MONITOR_DIR, 'costs.json');
const METRICS_FILE = path.join(MONITOR_DIR, 'metrics.json');
const HEALTH_INTERVAL_MS = 30000;
const QUEUE_MAX_SIZE = 100;

// ─── Provider Registry (real free-tier endpoints only) ────────────────────────

const PROVIDERS = {

  // ── Truly free tiers (no credit card, email signup only) ──

  groq: {
    name: 'Groq',
    category: 'free_tier',
    requiresKey: 'GROQ_API_KEY',
    qualityScore: 92,
    signupUrl: 'https://console.groq.com/keys',
    freeTier: '14,400 req/day · 6K tokens/min · No CC',
    endpoints: [{
      type: 'chat',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }),
      body: (k, m) => JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: m, max_tokens: 4096 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  cerebras: {
    name: 'Cerebras',
    category: 'free_tier',
    requiresKey: 'CEREBRAS_API_KEY',
    qualityScore: 90,
    signupUrl: 'https://cloud.cerebras.ai/',
    freeTier: '1M tokens/day · 30 req/min · No CC',
    endpoints: [{
      type: 'chat',
      url: 'https://api.cerebras.ai/v1/chat/completions',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }),
      body: (k, m) => JSON.stringify({ model: 'llama-3.1-70b', messages: m, max_tokens: 4096 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  google: {
    name: 'Gemini (Google AI Studio)',
    category: 'free_tier',
    requiresKey: 'GEMINI_API_KEY',
    qualityScore: 94,
    signupUrl: 'https://aistudio.google.com/app/apikey',
    freeTier: '1,500 req/day · 60 req/min · No CC',
    endpoints: [{
      type: 'chat',
      url: k => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${k}`,
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (k, m) => {
        var c = m.map(x => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.content }] }));
        return JSON.stringify({ contents: c, generationConfig: { maxOutputTokens: 4096 } });
      },
      parse: d => d.candidates?.[0]?.content?.parts?.[0]?.text
    }]
  },

  mistral: {
    name: 'Mistral',
    category: 'free_tier',
    requiresKey: 'MISTRAL_API_KEY',
    qualityScore: 88,
    signupUrl: 'https://console.mistral.ai/',
    freeTier: '1B tokens/month · No CC',
    endpoints: [{
      type: 'chat',
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }),
      body: (k, m) => JSON.stringify({ model: 'mistral-small-latest', messages: m, max_tokens: 4096 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  openrouter: {
    name: 'OpenRouter',
    category: 'free_tier',
    requiresKey: 'OPENROUTER_API_KEY',
    qualityScore: 85,
    signupUrl: 'https://openrouter.ai/keys',
    freeTier: '50 req/day free · 1K/day with $10',
    endpoints: [{
      type: 'chat',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k, 'HTTP-Referer': 'https://chode.oooooooooo.se', 'X-Title': 'chode' }),
      body: (k, m) => JSON.stringify({ model: 'free/qwen-2.5-7b-instruct', messages: m, max_tokens: 4096 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  nvidia: {
    name: 'NVIDIA NIM',
    category: 'free_tier',
    requiresKey: 'NVIDIA_API_KEY',
    qualityScore: 86,
    signupUrl: 'https://build.nvidia.com/explore/discover',
    freeTier: '40 req/min · Phone verify · No CC',
    endpoints: [{
      type: 'chat',
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }),
      body: (k, m) => JSON.stringify({ model: 'meta/llama-3.3-70b-instruct', messages: m, max_tokens: 4096 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  cloudflare: {
    name: 'Cloudflare Workers AI',
    category: 'free_tier',
    requiresKey: 'CLOUDFLARE_API_KEY',
    altKey: 'CLOUDFLARE_ACCOUNT_ID',
    qualityScore: 72,
    signupUrl: 'https://dash.cloudflare.com/sign-up/ai',
    freeTier: '10K neurons/day · No CC',
    endpoints: [{
      type: 'chat',
      url: k => `https://api.cloudflare.com/client/v4/accounts/${loadConfig().providers?.cloudflare?.accountId || ''}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      headers: k => ({ 'Authorization': 'Bearer ' + k, 'Content-Type': 'application/json' }),
      body: (k, m) => JSON.stringify({ messages: m }),
      parse: d => d.result?.response
    }]
  },

  deepseek: {
    name: 'DeepSeek',
    category: 'free_tier',
    requiresKey: 'DEEPSEEK_API_KEY',
    qualityScore: 89,
    signupUrl: 'https://platform.deepseek.com/',
    freeTier: 'Generous free tier · No CC',
    endpoints: [{
      type: 'chat',
      url: 'https://api.deepseek.com/v1/chat/completions',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }),
      body: (k, m) => JSON.stringify({ model: 'deepseek-chat', messages: m, max_tokens: 4096 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  cohere: {
    name: 'Cohere',
    category: 'free_tier',
    requiresKey: 'COHERE_API_KEY',
    qualityScore: 80,
    signupUrl: 'https://dashboard.cohere.com/api-keys',
    freeTier: 'Non-commercial only · No CC',
    endpoints: [{
      type: 'chat',
      url: 'https://api.cohere.com/v1/chat',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k, 'x-api-key': k }),
      body: (k, m) => JSON.stringify({ model: 'command-r', messages: m, max_tokens: 1000 }),
      parse: d => d.text
    }]
  },

  agnes: {
    name: 'Agnes AI (2.5 Flash)',
    category: 'free_tier',
    requiresKey: 'CHODE_KEY',
    qualityScore: 95,
    signupUrl: 'https://www.agnes-ai.com/',
    freeTier: 'Generous free tier · Google/GitHub login',
    endpoints: [{
      type: 'chat',
      url: 'https://apihub.agnes-ai.com/v1/chat/completions',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }),
      body: (k, m) => JSON.stringify({ model: 'agnes-2.5-flash', messages: m, max_tokens: 4096 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  ollama: {
    name: 'Ollama (Local)',
    category: 'free_local',
    requiresKey: null,
    qualityScore: 60,
    signupUrl: null,
    freeTier: 'Unlimited · Runs locally',
    endpoints: [{
      type: 'chat',
      url: () => (process.env.OLLAMA_URL || 'http://localhost:11434') + '/api/chat',
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (k, m) => JSON.stringify({ model: process.env.OLLAMA_MODEL || 'qwen2.5', messages: m, stream: false }),
      parse: d => d.message?.content
    }]
  },

  // Keyless providers (explicit-use only — see viable filter: never auto-routed,
  // reachable via --force, visible in score/models, probed by scan).
  // OVHcloud: anonymous tier, verified live 200 (2 req/min/IP). LLM7.io:
  // anonymous tier with `Bearer unused`, verified live 200.
  ovh: {
    name: 'OVHcloud (Keyless)',
    category: 'keyless',
    requiresKey: null,
    qualityScore: 70,
    signupUrl: 'https://www.ovhcloud.com/en/public-cloud/ai-endpoints/',
    freeTier: 'No key · 2 req/min · 70B models',
    endpoints: [{
      type: 'chat',
      url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (k, m) => JSON.stringify({ model: 'Meta-Llama-3_3-70B-Instruct', messages: m, max_tokens: 2048 }),
      parse: d => d.choices?.[0]?.message?.content
    },
    {
      type: 'chat',
      url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (k, m) => JSON.stringify({ model: 'gpt-oss-120b', messages: m, max_tokens: 2048 }),
      parse: d => d.choices?.[0]?.message?.content
    },
    {
      type: 'chat',
      url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (k, m) => JSON.stringify({ model: 'mistral@latest', messages: m, max_tokens: 2048 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  llm7: {
    name: 'LLM7 (Keyless)',
    category: 'keyless',
    requiresKey: null,
    qualityScore: 65,
    signupUrl: 'https://docs.llm7.io/quickstart',
    freeTier: 'No key · anonymous tier · rotating models',
    endpoints: [{
      type: 'chat',
      url: 'https://api.llm7.io/v1/chat/completions',
      headers: () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer unused' }),
      body: (k, m) => JSON.stringify({ model: 'default', messages: m, max_tokens: 2048 }),
      parse: d => d.choices?.[0]?.message?.content
    },
    {
      type: 'chat',
      url: 'https://api.llm7.io/v1/chat/completions',
      headers: () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer unused' }),
      body: (k, m) => JSON.stringify({ model: 'fast', messages: m, max_tokens: 2048 }),
      parse: d => d.choices?.[0]?.message?.content
    },
    {
      type: 'chat',
      url: 'https://api.llm7.io/v1/chat/completions',
      headers: () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer unused' }),
      body: (k, m) => JSON.stringify({ model: 'pro', messages: m, max_tokens: 2048 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  uncloseai: {
    name: 'uncloseai Hermes (Keyless)',
    category: 'keyless',
    requiresKey: null,
    qualityScore: 55,
    signupUrl: 'https://www.uncloseai.com/inference.html',
    freeTier: 'No key · 3 req/s · rotating models',
    endpoints: [{
      type: 'chat',
      url: 'https://hermes.ai.unturf.com/v1/chat/completions',
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (k, m) => JSON.stringify({ model: 'turboderp/Qwen3.8-27B-exl3', messages: m, max_tokens: 2048 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },

  // ── Premium (for reference, requires paid key) ──

  anthropic: {
    name: 'Claude (Anthropic)',
    category: 'paid',
    requiresKey: 'ANTHROPIC_API_KEY',
    qualityScore: 100,
    signupUrl: 'https://console.anthropic.com/',
    freeTier: 'Paid only',
    endpoints: [{
      type: 'chat',
      url: 'https://api.anthropic.com/v1/messages',
      headers: k => ({ 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01' }),
      body: (k, m) => JSON.stringify({ model: 'claude-sonnet-4-20250514', messages: m, max_tokens: 4096 }),
      parse: d => d.content?.[0]?.text
    }]
  },

  openai: {
    name: 'GPT-4o-mini (OpenAI)',
    category: 'paid',
    requiresKey: 'OPENAI_API_KEY',
    qualityScore: 95,
    signupUrl: 'https://platform.openai.com/api-keys',
    freeTier: 'Paid only',
    endpoints: [{
      type: 'chat',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: k => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + k }),
      body: (k, m) => JSON.stringify({ model: 'gpt-4o-mini', messages: m, max_tokens: 4096 }),
      parse: d => d.choices?.[0]?.message?.content
    }]
  },
};

// ─── Custom Providers Overlay (self-updating research) ───────────────────────
// `chode research` probes candidate keyless endpoints and stores working ones
// in .chode/custom-providers.json. Merged once at startup so score / models /
// scan / routing / the viable keyless-only-if-forced rule cover custom entries
// with zero further changes. Never self-modifying: this file is only ever read,
// the overlay file holds all discoveries.
var CUSTOM_PROVIDERS_FILE = path.join(CONFIG_DIR, 'custom-providers.json');
// Standard OpenAI-compatible keyless chat functions. Overlay entries persist as
// data (functions don't survive JSON), so loadCustomProviders() rehydrates them
// from each endpoint's stored url/model/auth scalars.
function keylessChatFns(model, auth) {
  return {
    headers: auth === 'unused'
      ? function() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer unused' }; }
      : function() { return { 'Content-Type': 'application/json' }; },
    body: function(k, m) { return JSON.stringify({ model: model, messages: m, max_tokens: 2048 }); },
    parse: function(d) { return d.choices?.[0]?.message?.content; }
  };
}
function loadCustomProviders() {
  try {
    var raw = JSON.parse(fs.readFileSync(CUSTOM_PROVIDERS_FILE, 'utf8'));
    var out = {};
    var src = (raw && raw.providers) || {};
    for (var id in src) {
      var e = src[id];
      if (!e || !e.name || !e.endpoints || !e.endpoints[0] || !e.endpoints[0].url) continue; // validate: drop junk
      out[id] = e;
      out[id].category = 'keyless';  // forced: overlay entries are always keyless…
      out[id].requiresKey = null;    // …so the viable keyless-only-if-forced rule governs them
      if (!out[id].source) out[id].source = 'research';
      var ep = out[id].endpoints[0];
      if (typeof ep.headers !== 'function' || typeof ep.body !== 'function' || typeof ep.parse !== 'function') {
        var fns = keylessChatFns(ep.model || 'default', ep.auth || 'none');
        ep.headers = fns.headers; ep.body = fns.body; ep.parse = fns.parse;
      }
    }
    return out;
  } catch (e) { return {}; }
}
try { Object.assign(PROVIDERS, loadCustomProviders()); } catch (e) {}

// ─── Dependency Check ──────────────────────────────────────────────────────────

const GLOBAL_DEPS = {
  wrangler: { name: 'Wrangler', cmd: 'wrangler --version', npm: 'wrangler', required: true, check: function() {
    // Available = on PATH, or resolvable via npx without downloading (cached/global/local).
    try { require('child_process').execSync('wrangler --version', {stdio:'pipe'}); return 'bin'; } catch (e) {}
    try { require('child_process').execSync('npx --no-install wrangler --version', {stdio:'pipe'}); return 'npx'; } catch (e) {}
    return false;
  } },
  node: { name: 'Node.js', check: function() { var v = process.version.slice(1); return compareVer(v, '18.0.0') >= 0; }, minVer: '18.0.0' },
  npm: { name: 'npm', cmd: 'npm --version', required: true },
};

// ─── Config ─────────────────────────────────────────────────────────────────────

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return { providers: {}, heliosToken: null, omniroute: { port: 20128 } }; }
}
function saveConfig(cfg) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}
function loadLeaderboard() {
  try { return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8')); }
  catch { return { providers: {}, ranked: [], updated: null }; }
}
function saveLeaderboard(lb) {
  fs.mkdirSync(MONITOR_DIR, { recursive: true });
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(lb, null, 2), 'utf8');
}
function loadSession(id) {
  var sp = path.join(SESSION_DIR, (id || 'default') + '.json');
  try { return JSON.parse(fs.readFileSync(sp, 'utf8')); }
  catch { return { id: id || 'default', messages: [], fallbacks: [], lastProvider: null, createdAt: Date.now() }; }
}
function saveSession(s) {
  // State writes must never kill a live session — degrade silently on disk trouble.
  try {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    fs.writeFileSync(path.join(SESSION_DIR, s.id + '.json'), JSON.stringify(s, null, 2), 'utf8');
  } catch {}
}
function checkpointFileFor(id) {
  var safe = String(id || 'default').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'default';
  return path.join(CONFIG_DIR, 'checkpoint-' + safe + '.json');
}
function loadCheckpoint(taskId) {
  // Per-task files isolate ai vs project (no clobber). No-arg keeps legacy
  // behavior: default file, then legacy file, then most-recent scan.
  try {
    if (taskId) {
      try { return JSON.parse(fs.readFileSync(checkpointFileFor(taskId), 'utf8')); } catch (e) {}
      if (String(taskId) === 'default') { try { return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); } catch (x) {} }
      return null;
    }
    try { return JSON.parse(fs.readFileSync(checkpointFileFor('default'), 'utf8')); } catch (e) {}
    try { return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); } catch (e) {}
    try {
      var files = fs.readdirSync(CONFIG_DIR).filter(function (f) { return f.indexOf('checkpoint-') === 0 && f.slice(-5) === '.json'; });
      var best = null, bestTs = 0;
      for (var i = 0; i < files.length; i++) {
        try { var cp = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, files[i]), 'utf8')); if (cp && cp.ts > bestTs) { bestTs = cp.ts; best = cp; } } catch (x) {}
      }
      return best;
    } catch (e) { return null; }
  } catch (e) { return null; }
}
function saveCheckpoint(cp) {
  try {
    cp = cp || {};
    if (!cp.taskId) cp.taskId = 'default';
    if (!cp.ts) cp.ts = Date.now();
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(checkpointFileFor(cp.taskId), JSON.stringify(cp, null, 2), 'utf8');
  } catch {}
}
function listCheckpoints() {
  var out = [];
  try {
    var files = fs.readdirSync(CONFIG_DIR).filter(function (f) { return f.indexOf('checkpoint-') === 0 && f.slice(-5) === '.json'; });
    for (var i = 0; i < files.length; i++) {
      try { out.push(JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, files[i]), 'utf8'))); } catch (e) {}
    }
  } catch (e) {}
  try { var leg = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); if (leg) out.push(leg); } catch (e) {}
  return out;
}
function loadUsage() {
  // Append-only event log + reduce: concurrent processes can only ADD lines,
  // so no call is ever lost to last-writer-wins (proven live: 2 racing calls).
  var today = new Date().toISOString().slice(0, 10);
  var acc = { day: today, providers: {} };
  function add(pid, tok, lat, err) {
    if (!acc.providers[pid]) acc.providers[pid] = { requests: 0, tokens: 0, latencies: [], errors: 0 };
    var s = acc.providers[pid];
    s.requests++; s.tokens += tok || 0;
    if (lat) { s.latencies.push(lat); if (s.latencies.length > 60) s.latencies = s.latencies.slice(-60); }
    if (err) s.errors++;
  }
  var lines = [];
  try { lines = fs.readFileSync(USAGE_LOG, 'utf8').split('\n'); } catch (e) {}
  var kept = [];
  for (var i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      var ev = JSON.parse(lines[i]);
      var day = ev.t ? new Date(ev.t).toISOString().slice(0, 10) : today;
      if (day !== today) continue; // daily windows, like before
      if (!ev.pid) continue;
      add(ev.pid, ev.tok, ev.lat, ev.err);
      kept.push(lines[i]);
    } catch (e) {}
  }
  // Legacy snapshot counts once as the base (only while no log lines exist yet
  // for today — afterwards the log is the truth and the snapshot stays frozen).
  if (kept.length === 0) {
    try {
      var d = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
      if (d.day === today && d.providers) {
        for (var pid in d.providers) {
          var s = d.providers[pid];
          acc.providers[pid] = { requests: s.requests || 0, tokens: s.tokens || 0, latencies: (s.latencies || []).slice(-60), errors: s.errors || 0 };
        }
      }
    } catch (e) {}
  }
  // Compact oversized logs with today's lines only (rename = atomic).
  try {
    if (lines.length > 5000) {
      var tmp = USAGE_LOG + '.tmp';
      fs.writeFileSync(tmp, kept.join('\n') + (kept.length ? '\n' : ''), 'utf8');
      fs.renameSync(tmp, USAGE_LOG);
    }
  } catch (e) {}
  return acc;
}
function appendUsage(pid, tok, lat, err) {
  // O_APPEND single-line writes from concurrent processes interleave safely.
  try {
    fs.mkdirSync(MONITOR_DIR, { recursive: true });
    fs.appendFileSync(USAGE_LOG, JSON.stringify({ t: Date.now(), pid: pid, tok: tok || 0, lat: lat || 0, err: err ? 1 : 0 }) + '\n', 'utf8');
  } catch (e) {}
}
function saveUsage() {
  // State writes must never kill a live session — degrade silently on disk trouble.
  try { fs.mkdirSync(MONITOR_DIR, { recursive: true }); fs.writeFileSync(USAGE_FILE, JSON.stringify(usageStats, null, 2), 'utf8'); }
  catch {}
}

var usageStats = { day: new Date().toISOString().slice(0, 10), providers: {} };
var rateLimits = {};
var circuitBreakers = {};
// Hydrate persisted stats at startup: without this, `metrics` always reports
// zeros in a fresh process while `costs` (file-backed) shows real data.
try { usageStats = loadUsage(); } catch (e) {}

// ─── Request Queue ─────────────────────────────────────────────────────────────

var requestQueue = [];
var queueProcessing = false;

function loadQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); }
  catch { return { requests: [], createdAt: Date.now() }; }
}
function saveQueue(q) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2), 'utf8');
}
function enqueueRequest(request) {
  var q = loadQueue();
  if (q.requests.length >= QUEUE_MAX_SIZE) {
    warn('Queue full (' + QUEUE_MAX_SIZE + '), dropping oldest request');
    q.requests.shift();
  }
  q.requests.push({ ...request, queuedAt: Date.now() });
  saveQueue(q);
}
function dequeueRequest() {
  var q = loadQueue();
  if (q.requests.length === 0) return null;
  var req = q.requests.shift();
  saveQueue(q);
  return req;
}
function getQueueSize() {
  var q = loadQueue();
  return q.requests.length;
}

// ─── Cost Tracking ─────────────────────────────────────────────────────────────

var costTracker = { total: 0, byProvider: {}, day: new Date().toISOString().slice(0, 10) };

function loadCosts() {
  try {
    var c = JSON.parse(fs.readFileSync(COSTS_FILE, 'utf8'));
    if (c.day !== costTracker.day) c = { total: 0, byProvider: {}, day: costTracker.day };
    return c;
  } catch { return { total: 0, byProvider: {}, day: costTracker.day }; }
}
function saveCosts(c) {
  // State writes must never kill a live session — degrade silently on disk trouble.
  try {
    fs.mkdirSync(MONITOR_DIR, { recursive: true });
    fs.writeFileSync(COSTS_FILE, JSON.stringify(c, null, 2), 'utf8');
  } catch {}
}
function recordCost(provider, tokens, costPerMillion) {
  costTracker = loadCosts();
  var cost = (tokens / 1000000) * (costPerMillion || 0);
  costTracker.total += cost;
  if (!costTracker.byProvider[provider]) costTracker.byProvider[provider] = { requests: 0, tokens: 0, cost: 0 };
  costTracker.byProvider[provider].requests++;
  costTracker.byProvider[provider].tokens += tokens;
  costTracker.byProvider[provider].cost += cost;
  saveCosts(costTracker);
}
function getCostReport() {
  costTracker = loadCosts();
  return {
    day: costTracker.day,
    totalCost: costTracker.total.toFixed(4),
    providers: costTracker.byProvider
  };
}

// ─── Metrics Export ─────────────────────────────────────────────────────────────

function exportMetrics() {
  var metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    queueSize: getQueueSize(),
    costs: getCostReport(),
    providers: Object.keys(PROVIDERS).map(function(pid) {
      var s = usageStats.providers[pid] || { requests: 0, tokens: 0, errors: 0 };
      var cb = getCircuitState(pid);
      return { id: pid, requests: s.requests, tokens: s.tokens, errors: s.errors, circuitState: cb.state, failures: cb.failures };
    })
  };
  fs.mkdirSync(MONITOR_DIR, { recursive: true });
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
  return metrics;
}

function recordUsage(pid, tokens, latency) {
  if (!usageStats.providers[pid]) usageStats.providers[pid] = { requests: 0, tokens: 0, latencies: [], errors: 0 };
  var s = usageStats.providers[pid]; s.requests++; s.tokens += tokens || 0;
  if (latency) s.latencies.push(latency); if (s.latencies.length > 60) s.latencies = s.latencies.slice(-60);
  appendUsage(pid, tokens || 0, latency || 0, 0);
  // Auto-track costs (free tiers = $0, paid tiers tracked if key present)
  var costMap = { groq: 0.10, anthropic: 3.00, openai: 0.15, deepseek: 0.14, agnes: 0.20 };
  var costPerMillion = costMap[pid] || 0;
  if (costPerMillion > 0) recordCost(pid, tokens || 0, costPerMillion);
}
function recordError(pid, error) {
  if (!usageStats.providers[pid]) usageStats.providers[pid] = { requests: 0, tokens: 0, latencies: [], errors: 0 };
  usageStats.providers[pid].errors++;
  if (error && error.indexOf('429') !== -1) recordRateLimit(pid);
  appendUsage(pid, 0, 0, 1);
}
function recordRateLimit(pid) {
  if (!rateLimits[pid]) rateLimits[pid] = { consecutive429: 0, lastReset: Date.now() };
  var r = rateLimits[pid]; r.consecutive429++; r.lastReset = Date.now();
  if (r.consecutive429 >= 3) warn('  Rate limit on ' + (PROVIDERS[pid]?.name || pid) + ' (' + r.consecutive429 + '/3)');
}
function resetRateLimit(pid) { if (rateLimits[pid]) { rateLimits[pid].consecutive429 = 0; } }
function getCircuitState(pid) {
  var cb = circuitBreakers[pid] || { failures: 0, lastFailure: 0, state: 'closed' };
  if (cb.state === 'open' && Date.now() - cb.lastFailure > CIRCUIT_BREAKER_COOLDOWN_MS) { cb.state = 'half-open'; cb.lastFailure = Date.now(); }
  return cb;
}
function recordFailure(pid, error) {
  var cb = circuitBreakers[pid] || { failures: 0, lastFailure: 0, state: 'closed' };
  cb.failures++; cb.lastFailure = Date.now();
  if (cb.failures >= CIRCUIT_BREAKER_THRESHOLD) cb.state = 'open';
  circuitBreakers[pid] = cb; recordError(pid, error);
}
function recordSuccess(pid) {
  var cb = circuitBreakers[pid] || { failures: 0, lastFailure: 0, state: 'closed' };
  cb.failures = 0; cb.state = 'closed'; circuitBreakers[pid] = cb;
}

// ─── Provider Registry (drift detection) ───────────────────────────────────────

function loadProviderRegistry() {
  try { return JSON.parse(fs.readFileSync(PROVIDER_REGISTRY_FILE, 'utf8')); }
  catch { return { endpoints: {}, updated: null }; }
}
function saveProviderRegistry(reg) {
  fs.mkdirSync(MONITOR_DIR, { recursive: true });
  fs.writeFileSync(PROVIDER_REGISTRY_FILE, JSON.stringify(reg, null, 2), 'utf8');
}
function detectDrift(providerId, newUrl) {
  var reg = loadProviderRegistry();
  var newHash = hashStr(newUrl);
  if (!reg.endpoints[providerId]) {
    reg.endpoints[providerId] = { hash: newHash, discoveredAt: new Date().toISOString(), url: newUrl };
    saveProviderRegistry(reg); return { drifted: false, noted: true };
  }
  if (reg.endpoints[providerId].hash !== newHash) {
    var oldUrl = reg.endpoints[providerId].url;
    reg.endpoints[providerId] = { hash: newHash, url: newUrl, driftedAt: new Date().toISOString(), from: oldUrl };
    saveProviderRegistry(reg); return { drifted: true, old: oldUrl, new: newUrl };
  }
  return { drifted: false };
}
function hashStr(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(16);
}

// ─── Work Queue ─────────────────────────────────────────────────────────────────

function loadWorkQueue(id) {
  try { return JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'work_queue_' + id + '.json'), 'utf8')); }
  catch(e) { return null; }
}
function saveWorkQueue(q) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONFIG_DIR, 'work_queue_' + q.id + '.json'), JSON.stringify(q, null, 2), 'utf8');
}
function listWorkQueues() {
  var queues = [];
  try {
    var files = fs.readdirSync(CONFIG_DIR);
    for (var i = 0; i < files.length; i++) {
      if (files[i].startsWith('work_queue_') && files[i].endsWith('.json')) {
        try { queues.push(JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, files[i]), 'utf8'))); } catch(e) {}
      }
    }
  } catch(e) {}
  return queues;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function compareVer(a, b) {
  var pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
    var ca = pa[i] || 0, cb = pb[i] || 0;
    if (ca > cb) return 1; if (ca < cb) return -1;
  }
  return 0;
}

function say(msg, color) {
  var palette = { white: '\x1b[38;5;252m', cyan: '\x1b[38;5;87m', green: '\x1b[38;5;82m',
    yellow: '\x1b[38;5;220m', red: '\x1b[38;5;203m', dim: '\x1b[38;5;240m',
    purple: '\x1b[38;5;141m', bright: '\x1b[38;5;195m' };
  // Status chatter goes to stderr: stdout carries ONLY command results,
  // so `ai "..." > file` and pipes compose cleanly (Unix-correct).
  process.stderr.write((palette[color] || palette.white) + msg + '\x1b[0m');
}
function ok(msg)   { say('  ✓  ' + msg + '\n', 'green'); }
function warn(msg) { say('  !  ' + msg + '\n', 'yellow'); }
function fail(msg) { say('  ✗  ' + msg + '\n', 'red'); }
function info(msg, color) { say(msg.slice(-1) === '\n' ? msg : msg + '\n', color || 'cyan'); }
function scan(msg) { say('  ~  ' + msg + '\n', 'purple'); }
function progress(msg) { process.stderr.write('\r  ▶  ' + msg + '   '); }

function run(cmd, opts) {
  opts = opts || {};
  try { return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts }); }
  catch (e) { if (opts.silent) throw new Error(e.stderr || e.message); throw e; }
}

// ─── DNS & Network Helpers ─────────────────────────────────────────────────────

var dnsCache = {};
async function resolveHost(host) {
  if (dnsCache[host]) return dnsCache[host];
  return new Promise((resolve) => {
    const dns = require('dns');
    dns.lookup(host, (err, ip) => {
      if (err) {
        dnsCache[host] = null;
        resolve(null);
      } else {
        dnsCache[host] = ip;
        resolve(ip);
      }
    });
  });
}

async function fetchWithFallback(url, opts = {}) {
  var timeout = opts.timeout || 15000;
  try {
    return await fetch(url, { ...opts, signal: AbortSignal.timeout(timeout) });
  } catch (e) {
    if (e.message.indexOf('Abort') !== -1) {
      throw new Error('timeout_after_' + timeout + 'ms');
    }
    throw e;
  }
}

// ─── Retry with Exponential Backoff ────────────────────────────────────────────

async function retry(fn, maxRetries, label) {
  maxRetries = maxRetries || MAX_RETRY;
  label = label || 'operation';
  var lastErr = null;
  for (var attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      // 402/payment_required + 401/403/auth_failed never resolve by waiting:
      // fail fast, no retries. (Circuit breaker still records via recordFailure.)
      if (e.message && (e.message.indexOf('payment_required') !== -1 || e.message.indexOf('402') !== -1 ||
        e.message.indexOf('401') !== -1 || e.message.indexOf('403') !== -1 || e.message.indexOf('auth_failed') !== -1 ||
        e.message.indexOf('invalid_key') !== -1)) throw e;
      var retryable = e.message && (
        e.message.indexOf('429') !== -1 || e.message.indexOf('rate') !== -1 ||
        e.message.indexOf('timeout') !== -1 || e.message.indexOf('ECONNRESET') !== -1 ||
        e.message.indexOf('fetch failed') !== -1 ||
        e.message.indexOf('502') !== -1 || e.message.indexOf('503') !== -1 || e.message.indexOf('504') !== -1
      );
      // 429s fail fast after a single retry: failover + circuit breaker own
      // recovery. Retrying one provider 5x with backoff burns ~15s (seen live
      // with Mistral) while the whole parallel batch waits on it.
      // Same cap for 5xx: transient blips deserve one retry, dead services don't burn quota.
      var rateLimited = e.message && (e.message.indexOf('429') !== -1 || e.message.indexOf('rate') !== -1 ||
        e.message.indexOf('502') !== -1 || e.message.indexOf('503') !== -1 || e.message.indexOf('504') !== -1);
      if (rateLimited && attempt >= 2) throw e;
      if (!retryable || attempt >= maxRetries) {
        if (attempt >= maxRetries) fail('  ' + label + ' failed after ' + maxRetries + ' attempts: ' + e.message.split('\n')[0]);
        throw e;
      }
      var delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 500;
      info('  -> ' + label + ' failed (attempt ' + attempt + '/' + maxRetries + '), retrying in ' + Math.round(delay/1000) + 's...');
      await new Promise(function(r) { setTimeout(r, delay); });
    }
  }
}

// ─── Bounded Core: guards + doom-loop + secrets + minimal tools ──────────────
// Zero-dep (Node builtins only). stdout stays pure results; chatter is stderr.

var authFailedProviders = {};
function markAuthFailed(pid) { try { authFailedProviders[pid] = Date.now(); } catch (e) {} }
function isAuthFailed(pid) {
  if (!authFailedProviders[pid]) return false;
  if (Date.now() - authFailedProviders[pid] > 600000) { delete authFailedProviders[pid]; return false; }
  return true;
}

var doomHistory = [];
function doomCheck(tool, prompt) {
  var key = String(tool || 'ai') + ' ' + String(prompt || '');
  doomHistory.push({ key: key, ts: Date.now() });
  if (doomHistory.length > 10) doomHistory = doomHistory.slice(-10);
  var n = 0;
  for (var i = doomHistory.length - 1; i >= 0; i--) {
    if (doomHistory[i].key === key) n++;
    else break;
  }
  if (n >= 3) {
    fail('  Doom-loop guard: same ' + tool + ' x3 - aborting. Hint: change args, run `scan`/`status`, or check keys.');
    doomHistory = [];
    return true;
  }
  return false;
}

function isSecretPath(fp) {
  try {
    var norm = String(fp || '').replace(/\\/g, '/');
    var base = norm.split('/').pop() || '';
    if (base === '.env' || base.indexOf('.env.') === 0 || base.slice(-4) === '.env') return true;
    var home = '';
    try { home = os.homedir().replace(/\\/g, '/'); } catch (e) {}
    if (home && (norm === home + '/.env' || norm.indexOf(home + '/.env') === 0)) return true;
    if (norm === '.env' || norm === '~/.env' || norm.indexOf('/.env') !== -1) return true;
  } catch (e) {}
  return false;
}
function isDestructiveTarget(fp) {
  try {
    var abs = path.isAbsolute(fp) ? path.normalize(fp) : path.normalize(path.join(ROOT, fp));
    var root = path.normalize(ROOT);
    if (abs !== root && abs.indexOf(root + path.sep) !== 0) return true;
  } catch (e) { return true; }
  return false;
}

// Minimal tools (capped at 4, zero-dep, no MCP/LSP). Keep @file inline working.
var TOOL_PERMISSIONS = { grep: 'allow', glob: 'allow', read: 'allow', edit: 'ask' };
var TOOLS = {
  grep: { desc: 'regex search files (capped)', perm: 'allow' },
  glob: { desc: 'filename match (*, **)', perm: 'allow' },
  read: { desc: 'read text file (100KB cap, secrets denied)', perm: 'allow' },
  edit: { desc: 'exact-string replace (asks first, destructive denied)', perm: 'ask' }
};
function toolPermit(name, target) {
  if (!TOOLS[name]) return { ok: false, error: 'unknown tool: ' + name };
  var perm = TOOL_PERMISSIONS[name] || TOOLS[name].perm || 'deny';
  if (target && isSecretPath(target)) return { ok: false, error: 'denied: secret path (' + target + ')' };
  if (target && isDestructiveTarget(target)) return { ok: false, error: 'denied: destructive/outside workspace (' + target + ')' };
  if (perm === 'deny') return { ok: false, error: 'denied by policy: ' + name };
  if (perm === 'ask') return { ok: false, needConfirm: true, error: 'needs-confirm: ' + name + ' requires --yes' };
  return { ok: true };
}
function toolWalk(dir, out, depth) {
  out = out || []; depth = depth || 0;
  if (depth > 6 || out.length > 500) return out;
  var entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (AUDIT_SKIP_DIRS.indexOf(e.name) !== -1) continue;
    var full = path.join(dir, e.name);
    if (e.isDirectory()) toolWalk(full, out, depth + 1);
    else if (e.isFile()) { out.push(full); if (out.length > 500) break; }
  }
  return out;
}
function toolGlob(pattern) {
  var rx = new RegExp('^' + String(pattern || '').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '§§').replace(/\*/g, '[^/\\\\]*').replace(/§§/g, '.*').replace(/\?/g, '[^/\\\\]') + '$');
  var files = toolWalk(ROOT, [], 0);
  var out = [];
  for (var i = 0; i < files.length; i++) {
    var rel = path.relative(ROOT, files[i]).replace(/\\/g, '/');
    if (rx.test(rel) || rx.test(files[i].replace(/\\/g, '/'))) { out.push(rel); if (out.length >= 100) break; }
  }
  return out;
}
function toolGrep(re, dir) {
  var gate = toolPermit('grep', dir); if (!gate.ok) return gate;
  var rx;
  try { rx = new RegExp(re); } catch (e) { return { ok: false, error: 'bad regex' }; }
  var base = dir ? (path.isAbsolute(dir) ? dir : path.join(ROOT, dir)) : ROOT;
  var files = toolWalk(base, [], 0).slice(0, 200);
  var hits = [];
  for (var i = 0; i < files.length; i++) {
    if (isSecretPath(files[i])) continue;
    try {
      if (fs.statSync(files[i]).size > AUDIT_MAX_BYTES) continue;
      var lines = fs.readFileSync(files[i], 'utf8').split('\n');
      for (var ln = 0; ln < lines.length; ln++) {
        if (rx.test(lines[ln])) { hits.push(path.relative(ROOT, files[i]) + ':' + (ln + 1) + ':' + lines[ln].slice(0, 160)); if (hits.length >= 50) return { ok: true, hits: hits }; }
      }
    } catch (e) {}
  }
  return { ok: true, hits: hits };
}
function toolRead(fp) {
  if (isSecretPath(fp)) return { ok: false, error: 'denied: secret path' };
  if (isDestructiveTarget(fp)) return { ok: false, error: 'denied: outside workspace' };
  var full = path.isAbsolute(fp) ? fp : path.join(ROOT, fp);
  try {
    var st = fs.statSync(full);
    if (!st.isFile() || st.size > 100 * 1024) return { ok: false, error: 'unreadable or >100KB' };
    var raw = fs.readFileSync(full, 'utf8');
    if (raw.indexOf(' ') !== -1) return { ok: false, error: 'binary, refusing' };
    return { ok: true, content: raw };
  } catch (e) { return { ok: false, error: 'cannot read: ' + fp }; }
}
function toolEdit(file, oldStr, newStr, opts) {
  opts = opts || {};
  var gate = toolPermit('edit', file);
  if (!gate.ok && !opts.approved) return gate;
  if (isSecretPath(file)) return { ok: false, error: 'denied: secret path' };
  if (isDestructiveTarget(file)) return { ok: false, error: 'denied: outside workspace' };
  var full = path.isAbsolute(file) ? file : path.join(ROOT, file);
  try {
    var raw = fs.readFileSync(full, 'utf8');
    if (raw.indexOf(oldStr) === -1) return { ok: false, error: 'oldString not found' };
    fs.writeFileSync(full, raw.replace(oldStr, newStr), 'utf8');
    return { ok: true };
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 200) }; }
}
function toolExec(name, args, opts) {
  opts = opts || {};
  if (!TOOLS[name]) return { ok: false, error: 'unknown tool (max 4: grep/glob/read/edit)' };
  if (doomCheck(name, JSON.stringify(args || {}))) return { ok: false, error: 'doom-loop aborted' };
  if (name === 'grep') return toolGrep(args && args.pattern, args && args.dir);
  if (name === 'glob') return { ok: true, files: toolGlob(args && args.pattern) };
  if (name === 'read') return toolRead(args && args.file);
  if (name === 'edit') return toolEdit(args && args.file, args && args.oldString, args && args.newString, opts);
  return { ok: false, error: 'unknown tool' };
}
var __testHooks = { trySingle: null };

// ─── Health Monitor ────────────────────────────────────────────────────────────

var monitorInterval = null;
var monitorState = { running: false };

async function startHealthMonitor() {
  if (monitorInterval) return;
  monitorState.running = true;
  info('  🩺 Health monitor started (scans every ' + (HEALTH_INTERVAL_MS/1000) + 's)\n');
  
  async function tick() {
    if (!monitorState.running) return;
    try {
      var lb = loadLeaderboard();
      var now = Date.now();
      // Auto-heal: close circuit breakers for providers idle > 5min
      for (var pid in circuitBreakers) {
        var cb = circuitBreakers[pid];
        if (cb.state === 'open' && now - cb.lastFailure > 300000) {
          cb.state = 'half-open';
          info('  🔄 Auto-healed: ' + (PROVIDERS[pid]?.name || pid) + ' circuit reset\n');
        }
      }
      // Periodic full scan every 5 minutes
      if (lb.updated && now - new Date(lb.updated).getTime() > 300000) {
        info('  ~ Auto-scanning providers...\n');
        await runFullScan(false);
      }
      // Export metrics
      exportMetrics();
    } catch(e) {
      // Silent fail - don't crash monitor
    }
  }
  
  tick(); // Run immediately
  monitorInterval = setInterval(tick, HEALTH_INTERVAL_MS);
}

function stopHealthMonitor() {
  monitorState.running = false;
  if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null; }
}

async function probeProvider(pid, endpoint) {
  var config = PROVIDERS[pid];
  if (!config) return { ok: false, error: 'unknown' };
  var key = null;
  if (config.requiresKey) {
    key = process.env[config.requiresKey] || null;
    if (!key && loadConfig().providers?.[pid]?.key) key = loadConfig().providers[pid].key;
  }
  if (config.requiresKey && !key) return { ok: false, error: 'missing_key', skipped: true };

  var t0 = Date.now();
  try {
    var url = typeof endpoint.url === 'function' ? (endpoint.url(key) || endpoint.url) : endpoint.url;
    var drift = detectDrift(pid, url);
    if (drift.drifted) info('  ~  Drift: ' + config.name + ' updated (' + drift.old + ' -> ' + drift.new + ')');

    // DNS check for critical providers
    var host = url.replace('https://', '').replace('http://', '').split('/')[0];
    var dnsResult = await resolveHost(host);
    if (!dnsResult && host.indexOf('localhost') === -1) {
      return { ok: false, latency: Date.now()-t0, error: 'dns_failed', host: host };
    }

    if (endpoint.type === 'simple') {
      var resp = await fetchWithFallback(url, { method: 'GET', timeout: endpoint.timeout || 10000 });
      var ms = Date.now() - t0;
      var body = await resp.text();
      if (resp.ok && body && body.length > 3) return { ok: true, latency: ms, status: resp.status };
      return { ok: false, latency: ms, error: 'empty', status: resp.status };
    }

    var body = endpoint.body(key, [{ role: 'user', content: 'say ok' }]);
    var headers = endpoint.headers(key);
    var resp = await fetchWithFallback(url, { method: 'POST', headers: headers, body: body, timeout: endpoint.timeout || 15000 });
    var ms = Date.now() - t0;
    var data = await resp.json().catch(() => ({}));
    if (resp.status === 200 && data.choices?.[0]?.message) return { ok: true, latency: ms, status: 200 };
    if (resp.status === 429 || data.error?.code === 'rate_limit_exceeded') return { ok: false, latency: ms, error: 'rate_limited', status: 429 };
    if (resp.status === 402) return { ok: false, latency: ms, error: 'payment_required', status: 402 };
    if (resp.status === 401 || resp.status === 403) return { ok: false, latency: ms, error: 'auth_failed', status: resp.status };
    if (resp.status === 410 || data.type === 'Gone') return { ok: false, latency: ms, error: 'deprecated', status: 410 };
    return { ok: false, latency: ms, error: data.error?.message || 'http_' + resp.status, status: resp.status };
  } catch (e) {
    return { ok: false, latency: Date.now()-t0, error: e.message };
  }
}

async function runFullScan(verbose) {
  scan('Scanning ' + Object.keys(PROVIDERS).length + ' providers...');
  var lb = loadLeaderboard();
  lb.providers = lb.providers || {};
  lb.updated = new Date().toISOString();
  for (var i = 0; i < Object.keys(PROVIDERS).length; i++) {
    var pid = Object.keys(PROVIDERS)[i];
    var config = PROVIDERS[pid];
    if (verbose) progress(pid + '...');
    var result = await probeProvider(pid, config.endpoints[0]);
    var stats = lb.providers[pid] || { probes: 0, successes: 0, totalLatency: 0, lastOk: null, streak: 0 };
    stats.lastProbe = new Date().toISOString();
    stats.lastStatus = result.ok ? 'ok' : (result.error || 'error');
    if (result.ok) { stats.successes++; stats.probes++; stats.totalLatency += result.latency||0; stats.lastOk = new Date().toISOString(); stats.streak = (stats.streak||0)+1; stats.avgLatency = stats.totalLatency/stats.successes; }
    else { stats.streak = 0; stats.lastError = result.error; stats.probes++; }
    lb.providers[pid] = stats;
  }
  // Prune providers removed from the registry (e.g. retired bootstraps) so
  // ghosts never rank, display, or linger in the leaderboard file.
  for (var pid in lb.providers) { if (!PROVIDERS[pid]) delete lb.providers[pid]; }
  var scored = [];
  for (var pid in lb.providers) {
    var s = lb.providers[pid];
    if (!s.lastProbe) continue;
    var q = PROVIDERS[pid] ? (PROVIDERS[pid].qualityScore||50) : 50;
    var rel = s.probes>0 ? (s.successes/s.probes)*100 : 0;
    var lat = s.avgLatency>0 ? Math.max(0,100-s.avgLatency/100) : 50;
    var rec = s.lastOk ? Math.min(100,100-((Date.now()-new Date(s.lastOk).getTime())/60000)*2) : 0;
    scored.push({ id:pid, name:PROVIDERS[pid]?.name||pid, score:Math.round(q*.35+rel*.30+lat*.20+rec*.15), reliability:Math.round(rel), latency:s.avgLatency, streak:s.streak, category:PROVIDERS[pid]?.category||'?' });
  }
  scored.sort(function(a,b){return b.score-a.score;});
  lb.ranked = scored;
  saveLeaderboard(lb);
  return scored;
}

// ─── Core Router: callWithBestProvider ─────────────────────────────────────────

async function callWithBestProvider(prompt, sessionId, forceProvider, opts) {
  opts = opts || {}; // {waited:true} set on the single rate-window retry pass
  if (doomCheck(forceProvider ? 'ai:' + forceProvider : 'ai', prompt)) return null;
  var lb = loadLeaderboard();
  var session = sessionId ? loadSession(sessionId) : null;
  if (!session) session = { id: sessionId||'default', messages: [], fallbacks: [], createdAt: Date.now() };

  // Build candidate list: force-specific, then ranked, then all.
  // There is NO keyless-AI fallback: with zero keys the CLI must NEVER place
  // an AI call without a key (see the zero-key early return below).
  var allProviderIds = Object.keys(PROVIDERS);
  var candidates = forceProvider ? [forceProvider] : (lb.ranked && lb.ranked.length > 0 ? lb.ranked.map(r=>r.id) : allProviderIds);

  // If leaderboard doesn't include all providers, supplement with missing ones
  // (skipped when forcing: --force means ONLY that provider, not plus everything)
  var candidateSet = {};
  candidates.forEach(function(pid){ candidateSet[pid] = true; });
  if (!forceProvider) { allProviderIds.forEach(function(pid){ if(!candidateSet[pid]) candidates.push(pid); }); }

  // Filter: viable = has key or local-running, circuit closed, not rate-limited.
  // When forcing, the candidate list IS the forced provider (local passes the filter).
  var viable = candidates.filter(function(pid) {
    var p = PROVIDERS[pid]; if (!p) return false;
    if (p.requiresKey) {
      var hasKey = !!(process.env[p.requiresKey] || (loadConfig().providers?.[pid]?.key));
      if (!hasKey) return false;
    } else if (p.category === 'free_local') {
      // Skip local providers that aren't running
      try {
        var url = typeof p.endpoints[0].url === 'function' ? p.endpoints[0].url() : p.endpoints[0].url;
        var host = url.replace('http://','').replace('https://','').split('/')[0];
        if (host.indexOf('localhost') !== -1 || host.indexOf('127.0.0.1') !== -1) {
          require('child_process').execSync('curl -s --max-time 2 ' + url.split(':')[2].replace('//','') + '/api/tags',{stdio:'pipe'});
        }
      } catch(e) { return false; }
    } else if (p.category === 'keyless') {
      // Remote keyless entries auto-route in rank order (Ollama-first rule
      // still applies above). Rate limits + circuit breaker below bound them;
      // the zero-key path falls back to ranked key guidance if all fail.
    }
    // NOTE: keyless entries carry no credentials; failures are cheap and safe.
    if (rateLimits[pid] && rateLimits[pid].consecutive429 >= 3) return false;
    var cb = getCircuitState(pid);
    if (cb.state === 'open') return false;
    return true;
  });

  // Rule 1 (audit fix): routing must respect leaderboard rank — sort viable by
  // leaderboard score desc using lb.ranked order, not registry insertion order.
  // Auth-failed providers sort last (deprioritized, still tried if nothing else).
  var rankPos = {};
  (lb.ranked || []).forEach(function(r, i){ rankPos[r.id] = i; });
  viable.sort(function(a, b){
    var aAuth = isAuthFailed(a) ? 1 : 0, bAuth = isAuthFailed(b) ? 1 : 0;
    if (aAuth !== bAuth) return aAuth - bAuth;
    var ra = (rankPos[a] !== undefined) ? rankPos[a] : 1e9;
    var rb = (rankPos[b] !== undefined) ? rankPos[b] : 1e9;
    return ra - rb;
  });
  // Rule 2: a running local Ollama is always cheapest/fastest/private — move it
  // to the very front whenever present in the viable list.
  var ollamaIdx = viable.indexOf('ollama');
  if (ollamaIdx > 0) { viable.splice(ollamaIdx, 1); viable.unshift('ollama'); }

  if (viable.length === 0 && !forceProvider) {
    // ZERO-KEY PATH: no viable providers and none forced. Do NOT call any
    // endpoint — no waiting, no retries, no fetch on this path. This early
    // return sits before any fetch below, so zero network calls can happen.
    info('  No keys found.\n');
    var ollamaUp = false;
    try { require('child_process').execSync('curl -s --max-time 2 http://localhost:11434/api/tags', { stdio: 'pipe' }); ollamaUp = true; } catch (e) {}
    if (ollamaUp) info('  Local Ollama: running and preferred\n');
    else info('  Local Ollama: not running (install: winget install Ollama.Ollama)\n');
    info('  Get a free key (ranked order — pick the first you can):\n');
    var keyWallOrder = ['groq', 'google', 'cerebras', 'deepseek', 'openrouter', 'cloudflare', 'agnes'];
    for (var wi = 0; wi < keyWallOrder.length; wi++) {
      var wp = PROVIDERS[keyWallOrder[wi]];
      if (wp && wp.signupUrl) info('    ' + wp.name.padEnd(28) + wp.signupUrl + '  =>  chode auth ' + keyWallOrder[wi] + ' <key>\n');
    }
    info('  Or run: chode provision\n');
    return null;
  }
  if (viable.length === 0) {
    fail('  Forced provider is not viable (no key, circuit open, rate-limited, or local down).');
    return null;
  }
  info('  Trying ' + viable.length + ' provider(s)...\n');

  // Try in parallel batches
  var result = null, usedProvider = null, sawRateLimit = false;
  var batchSize = Math.min(PARALLEL_PROVIDERS, viable.length);

  for (var batchStart = 0; batchStart < viable.length; batchStart += batchSize) {
    var batch = viable.slice(batchStart, batchStart + batchSize);
    var tryFn = (__testHooks && __testHooks.trySingle) || trySingleProvider;
    var batchResults = await Promise.all(batch.map(function(pid) {
      return tryFn(pid, prompt, session).catch(function(e) {
        return { pid: pid, error: (e && e.message ? e.message : String(e)).split('\n')[0] };
      });
    }));

    for (var j = 0; j < batchResults.length; j++) {
      var r = batchResults[j];
      if (r && r.result) {
        result = r;
        usedProvider = r.pid;
        recordSuccess(r.pid);
        break;
      } else if (r && r.error) {
        if (/429|rate_limit|rate-limited|50[234]|timeout|fetch failed|ECONNRESET/.test(r.error)) sawRateLimit = true;
        if (/401|403|auth_failed|invalid_key/.test(r.error)) markAuthFailed(r.pid);
        if (r.error.indexOf('deprecated_410') !== -1) {
          warn('  ' + (PROVIDERS[r.pid]?.name||r.pid) + ' deprecated (410), skipping...');
        } else if (r.error.indexOf('payment_required') !== -1) {
          warn('  ' + (PROVIDERS[r.pid]?.name||r.pid) + ': key or quota issue (' + r.error + ')');
        } else if (/401|403|auth_failed|invalid_key/.test(r.error)) {
          warn('  ' + (PROVIDERS[r.pid]?.name||r.pid) + ': auth failed, deprioritized (' + r.error + ')');
        } else {
          warn('  ' + (PROVIDERS[r.pid]?.name||r.pid) + ': ' + r.error);
        }
        recordFailure(r.pid, r.error);
      }
    }
    if (result) break;
  }

  if (!result) {
    // Rate-window waiter: when EVERYTHING failed transiently, wait out the
    // shortest known window once (60s) and retry a single pass — this turns
    // abandonment into late completion. Bounded: exactly one wait per call.
    if (sawRateLimit && !opts.waited) {
      info('\n  Rate limits hit everywhere — waiting 60s for windows to reset, then one more pass...\n');
      for (var w = 60; w > 0; w -= 15) { info('  ...' + w + 's\n', 'dim'); await new Promise(function(rr){setTimeout(rr, 15000);}); }
      info('  Retrying now.\n');
      return await callWithBestProvider(prompt, sessionId, forceProvider, { waited: true });
    }
    fail('\n  All providers exhausted.');
    info('\n  Get a free key in 10 seconds (no credit card):\n');
    for (var i = 0; i < allProviderIds.length; i++) {
      var cp = PROVIDERS[allProviderIds[i]];
      if (cp && cp.signupUrl) {
        info('    ' + cp.name.padEnd(20) + ' → ' + cp.signupUrl);
      }
    }
    info('\n  Then: chode auth <provider> [your-key]\n');
    info('  Or run: chode provision\n');
    return null;
  }

  session.lastProvider = usedProvider;
  session.messages.push({ role:'user', content:prompt, ts:Date.now() });
  session.messages.push({ role:'assistant', content:result.result, ts:Date.now(), provider:usedProvider });
  if (session.messages.length > 50) session.messages = session.messages.slice(-50);
  session.id = session.id || sessionId || 'default';
  // Ephemeral (sessionId null: audit/plan internals) never touches disk —
  // only real sessions persist, so internals can't clobber ai/project resume.
  if (sessionId) saveSession(session);
  if (sessionId) saveCheckpoint({ taskId: sessionId, lastProvider: usedProvider, lastPrompt: prompt, lastResult: result.result, ts: Date.now() });
  recordUsage(usedProvider, result.tokens||0, result.latency||0);

  return { result: result.result, provider: usedProvider, providerName: PROVIDERS[usedProvider]?.name, latency: result.latency, tokens: result.tokens || 0 };
}

async function trySingleProvider(pid, prompt, session, maxRetries) {
  var config = PROVIDERS[pid];
  if (!config) throw new Error('unknown_provider');
  var key = config.requiresKey ? (process.env[config.requiresKey] || (loadConfig().providers?.[pid]?.key)) : null;
  // Endpoint rotation: each retry attempt tries the NEXT endpoint (separate
  // rate-limit buckets, e.g. per-model limits). Budgets unchanged — rotation
  // replaces waiting, it never multiplies attempts.
  var epIdx = 0;

  var t0 = Date.now();
  var msgs = session.messages.length > 0 ? session.messages.concat([{role:'user',content:prompt}]) : [{role:'user',content:prompt}];

  return await retry(async function() {
    var endpoint = config.endpoints[epIdx++ % config.endpoints.length];
    var url = typeof endpoint.url === 'function' ? (endpoint.url(key) || endpoint.url) : endpoint.url;
    detectDrift(pid, url);

    // Check DNS before attempting request
    var host = url.replace('https://', '').replace('http://', '').split('/')[0];
    if (host.indexOf('localhost') === -1) {
      var dnsOk = await resolveHost(host);
      if (!dnsOk) throw new Error('dns_failed:' + host);
    }
    if (endpoint.type === 'simple') {
      var resp = await fetchWithFallback(url, { signal: AbortSignal.timeout(endpoint.timeout||15000) });
      var body = await resp.text();
      if (resp.ok && body && body.length > 2) return { pid:pid, result:body, latency:Date.now()-t0, tokens:Math.ceil(body.length/4) };
      throw new Error('empty_response (' + resp.status + ')');
    } else {
      var chatBody = endpoint.body(key, msgs);
      var chatHeaders = endpoint.headers(key);
      var resp = await fetchWithFallback(url, { method:'POST', headers:chatHeaders, body:chatBody, signal:AbortSignal.timeout(endpoint.timeout||15000) });
      var data = await resp.json().catch(()=>({}));
      if (resp.status === 200 && data.choices?.[0]?.message?.content) {
        return { pid:pid, result:endpoint.parse(data), latency:Date.now()-t0, tokens:Math.ceil(data.choices[0].message.content.length/4) };
      }
      if (resp.status === 410 || data.type === 'Gone') throw new Error('deprecated_410');
      // 402/403 = payment_required, 401 = auth_failed: both fail fast (no
      // retries — waiting never fixes billing/quota/keys). Caller surfaces
      // the 'key or quota issue' / 'auth failed' wording to the user.
      if (resp.status === 402 || resp.status === 403) throw new Error('payment_required: key or quota issue (HTTP ' + resp.status + ')');
      if (resp.status === 401) throw new Error('auth_failed: invalid key (HTTP 401)');
      if (resp.status === 429) throw new Error('429_rate_limited');
      var authHint = data.error?.message || '';
      if (authHint && /invalid.*key|unauthorized|auth/i.test(authHint)) throw new Error('auth_failed: ' + authHint.slice(0, 120));
      throw new Error(resp.status + ':' + authHint);
    }
  }, maxRetries || MAX_RETRY, 'call to ' + (config?.name || pid));
}

// ─── Security Audit ────────────────────────────────────────────────────────────
// `chode audit [path]` scans CODE for leaked secrets and dangerous patterns
// (`scan` probes providers — different thing). Deterministic first, optional AI
// remediation second, markdown threat report always. Zero deps.

var AUDIT_SKIP_DIRS = ['.git', 'node_modules', '.chode', '.wrangler', 'dist', 'build', '.next'];
var AUDIT_MAX_FILES = 200;
var AUDIT_MAX_BYTES = 200 * 1024;

var AUDIT_RULES = [
  { id: 'SECRET_AWS_KEY',        sev: 'HIGH', re: /AKIA[0-9A-Z]{16}/ },
  { id: 'SECRET_GITHUB_TOKEN',   sev: 'HIGH', re: /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/ },
  { id: 'SECRET_SLACK_TOKEN',    sev: 'HIGH', re: /xox[baprs]-[A-Za-z0-9-]+/ },
  { id: 'SECRET_ANTHROPIC_KEY',  sev: 'HIGH', re: /sk-ant-[A-Za-z0-9\-_]{10,}/ },
  { id: 'SECRET_OPENAI_KEY',     sev: 'HIGH', re: /sk-(?!ant-)[A-Za-z0-9]{20,}/ },
  { id: 'SECRET_PRIVATE_KEY',    sev: 'HIGH', re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { id: 'SECRET_NPM_TOKEN',      sev: 'HIGH', re: /_authToken\s*=\s*\S+/ },
  { id: 'SECRET_PASSWORD_ASSIGN',sev: 'MEDIUM', re: /(password|passwd|secret)\s*[:=]\s*['"][^'"]{4,}['"]/i },
  { id: 'SECRET_APIKEY_ASSIGN',  sev: 'MEDIUM', re: /api[_-]?key\s*[:=]\s*['"][^'"]{6,}['"]/i },
  { id: 'SECRET_BEARER',         sev: 'MEDIUM', re: /Bearer\s+[A-Za-z0-9\-._~+/=]{12,}/ },
  { id: 'SINK_EVAL',             sev: 'HIGH', re: /\beval\s*\(/ },
  { id: 'SINK_NEW_FUNCTION',     sev: 'HIGH', re: /\bnew\s+Function\s*\(/ },
  { id: 'SINK_EXEC_INTERPOLATED',sev: 'MEDIUM', re: /exec(Sync)?\s*\([^)]*\$\{/ },
  { id: 'SINK_INNERHTML',        sev: 'MEDIUM', re: /\.innerHTML\s*=/ },
  { id: 'CRYPTO_MD5',            sev: 'LOW', re: /createHash\(\s*['"]md5['"]\s*\)/ },
  { id: 'TRANSPORT_HTTP',        sev: 'LOW', re: /http:\/\/(?!localhost|127\.0\.0\.1)/ }
];

function auditCollectFiles(dir, out) {
  out = out || [];
  var entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (var i = 0; i < entries.length; i++) {
    if (out.length >= AUDIT_MAX_FILES) break;
    var e = entries[i];
    var full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (AUDIT_SKIP_DIRS.indexOf(e.name) !== -1) continue;
      auditCollectFiles(full, out);
    } else if (e.isFile()) {
      if (/^audit-report-.*\.md$/i.test(e.name)) continue; // our own reports, not findings
      if (/\.(png|jpe?g|gif|ico|woff2?|ttf|zip|exe|node|lock)$/i.test(e.name)) continue;
      try { if (fs.statSync(full).size > AUDIT_MAX_BYTES) continue; } catch (x) { continue; }
      out.push(full);
    }
  }
  return out;
}

function auditMask(ruleId, match) {
  if (ruleId.indexOf('SECRET') === 0 && match.length > 10) {
    return match.slice(0, 6) + '…<redacted:' + (match.length - 6) + ' chars>';
  }
  return match.length > 160 ? match.slice(0, 160) + '…' : match;
}

function auditScanFile(full, rel) {
  var findings = [];
  var text;
  try { text = fs.readFileSync(full, 'utf8'); } catch (e) { return findings; }
  if (text.indexOf('\u0000') !== -1) return findings; // binary
  var lines = text.split('\n');
  for (var ln = 0; ln < lines.length; ln++) {
    var line = lines[ln];
    for (var r = 0; r < AUDIT_RULES.length; r++) {
      var rule = AUDIT_RULES[r];
      rule.re.lastIndex = 0;
      var m = rule.re.exec(line);
      if (m) {
        findings.push({ rule: rule.id, sev: rule.sev, file: rel, line: ln + 1, excerpt: auditMask(rule.id, m[0]) });
        break; // one finding per line keeps reports readable
      }
    }
  }
  return findings;
}

function auditNpm(dir) {
  // Best-effort: needs package.json; never throws, never blocks the report.
  try {
    if (!fs.existsSync(path.join(dir, 'package.json'))) return { ok: false, reason: 'no package.json' };
    var raw = require('child_process').execSync('npm audit --json --no-update-notifier', { cwd: dir, stdio: 'pipe', timeout: 60000 }).toString();
    var data = JSON.parse(raw);
    var v = (data.metadata && data.metadata.vulnerabilities) || {};
    return { ok: true, critical: v.critical || 0, high: v.high || 0, moderate: v.moderate || 0, info: v.info || 0 };
  } catch (e) {
    var msg = (e.message || String(e)).split('\n')[0];
    return { ok: false, reason: msg.slice(0, 120) };
  }
}

var SEV_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

async function cmdAudit(target, flags) {
  flags = flags || {};
  if (target && target.slice(0, 2) === '--') target = null; // flags aren't paths
  var dir = path.resolve(target || '.');
  info('\n  chode audit — secrets + dangerous patterns (+ optional AI review)\n');
  info('  Target: ' + dir + '\n');

  var files = auditCollectFiles(dir, []);
  info('  Scanned ' + files.length + ' files (skipped: ' + AUDIT_SKIP_DIRS.join(', ') + ')\n');

  var findings = [];
  files.forEach(function (full) {
    var rel = path.relative(dir, full) || full;
    findings = findings.concat(auditScanFile(full, rel));
  });
  findings.sort(function (a, b) {
    return (SEV_ORDER[a.sev] - SEV_ORDER[b.sev]) || (a.file < b.file ? -1 : 1);
  });

  var counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  findings.forEach(function (f) { counts[f.sev]++; });
  info('  Findings: ' + findings.length + ' (HIGH ' + counts.HIGH + ' / MEDIUM ' + counts.MEDIUM + ' / LOW ' + counts.LOW + ')\n');
  findings.slice(0, 20).forEach(function (f) {
    say('  [' + f.sev + '] ' + f.rule + '  ' + f.file + ':' + f.line, f.sev === 'HIGH' ? 'red' : 'white');
    info('         ' + f.excerpt + '\n', 'dim');
  });
  if (findings.length > 20) info('  …and ' + (findings.length - 20) + ' more (see report)\n');

  var npm = auditNpm(dir);
  if (npm.ok) info('  npm audit: critical ' + npm.critical + ' / high ' + npm.high + ' / moderate ' + npm.moderate + '\n');
  else info('  npm audit: unavailable (' + npm.reason + ')\n');

  var aiSection = 'AI review skipped (--no-ai).';
  var aiProvider = null;
  if (!flags['no-ai']) {
    var top = findings.slice(0, 10).map(function (f) { return f.sev + ' ' + f.rule + ' ' + f.file + ':' + f.line + ' :: ' + f.excerpt; }).join('\n');
    var prompt = 'You are a security reviewer. These deterministic findings came from a static scan of a real repo (excerpts already redacted):\n' + (top || '(no static findings)') + '\nnpm audit: ' + JSON.stringify(npm) + '\nFor each finding: confirm or downgrade the severity in one clause, give a one-line exploit scenario, and the minimal fix. End with a 5-line executive summary for the repo owner. Be concrete, no generic advice.';
    try {
      var air = await callWithBestProvider(prompt, null, null);
      if (air && air.result) { aiSection = air.result; aiProvider = air.providerName || air.provider; }
      else aiSection = 'AI review unavailable — all providers failed. Deterministic findings above still stand.';
    } catch (e) { aiSection = 'AI review errored (' + (e.message || e).toString().split('\n')[0] + '). Deterministic findings above still stand.'; }
  }
  if (aiProvider) info('\n  AI review by: ' + aiProvider + '\n');

  var stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  var reportFile = path.join(dir, 'audit-report-' + stamp + '.md');
  var L = [];
  L.push('# Threat report — `' + dir + '`');
  L.push('');
  L.push('- Generated: ' + new Date().toISOString() + ' by `chode audit` (deterministic scan' + (aiProvider ? ' + AI review by ' + aiProvider : ', AI skipped/unavailable') + ')');
  L.push('- Files scanned: ' + files.length + ' (skipped dirs: ' + AUDIT_SKIP_DIRS.join(', ') + ')');
  L.push('- Findings: ' + findings.length + ' (HIGH ' + counts.HIGH + ' / MEDIUM ' + counts.MEDIUM + ' / LOW ' + counts.LOW + ')');
  L.push('- npm audit: ' + (npm.ok ? ('critical ' + npm.critical + ' / high ' + npm.high + ' / moderate ' + npm.moderate + ' / info ' + npm.info) : ('unavailable (' + npm.reason + ')')));
  L.push('');
  L.push('## Findings');
  L.push('');
  L.push('| Severity | Rule | Location | Excerpt |');
  L.push('|---|---|---|---|');
  findings.forEach(function (f) {
    L.push('| ' + f.sev + ' | ' + f.rule + ' | `' + f.file + ':' + f.line + '` | `' + f.excerpt.replace(/`/g, "'").replace(/\|/g, '/') + '` |');
  });
  if (findings.length === 0) L.push('| — | — | _clean_ | _no rule matched_ |');
  L.push('');
  L.push('## AI remediation');
  L.push('');
  L.push(aiSection);
  L.push('');
  L.push('---');
  L.push('_Secrets in excerpts are masked. Rotate anything listed under SECRET_* immediately — masking does not un-leak them._');
  try { fs.writeFileSync(reportFile, L.join('\n'), 'utf8'); } catch (e) { fail('  Could not write report: ' + e.message); return findings; }
  ok('  Threat report saved: ' + reportFile + '\n');
  return findings;
}

// ─── Commands ──────────────────────────────────────────────────────────────────

function cmdModels() {
  info('\n  AI Models\n  ' + '─'.repeat(50) + '\n');
  var providers = Object.keys(PROVIDERS);
  // Single Ollama reachability probe shared by every row (one probe, not N).
  var ollamaUp = false;
  try { require('child_process').execSync('curl -s --max-time 2 http://localhost:11434/api/tags', { stdio: 'pipe' }); ollamaUp = true; } catch (e) {}
  for (var i = 0; i < providers.length; i++) {
    var pid = providers[i];
    var p = PROVIDERS[pid];
    // WHY each provider is (un)usable — reason tokens appended to every row.
    var reasons = [];
    var hasKey = p.requiresKey ? !!(process.env[p.requiresKey] || (loadConfig().providers?.[pid]?.key)) : true;
    if (p.requiresKey) reasons.push(hasKey ? 'key set' : 'no key');
    else if (pid === 'ollama') { hasKey = ollamaUp; reasons.push(ollamaUp ? 'local up' : 'local down'); }
    else if (p.category === 'keyless') { hasKey = true; reasons.push('keyless'); }
    var cbm = getCircuitState(pid);
    if (cbm.state === 'open') reasons.push('circuit open');
    if (rateLimits[pid] && rateLimits[pid].consecutive429 >= 3) reasons.push('rate-limited');
    var icon = hasKey ? '\u2713' : '\u25cb';
    var tier = p.category === 'free_tier' ? 'FREE' : (p.category === 'free_local' ? 'LOCAL' : (p.category === 'keyless' ? 'KEYLESS' : (p.category === 'bootstrap' ? 'BOOTSTRAP' : 'PAID')));
    say('  ' + icon + ' ' + pid.padEnd(14), hasKey?'green':'white');
    info('  ' + p.name.padEnd(28) + tier.padEnd(9) + ' [' + reasons.join(', ') + ']', 'dim');
  }
  info('\n  Quick start:\n    chode scan        Discover working providers\n    chode ai "hello"  Test auto-routing\n    chode provision   Auto-request free-tier keys\n');
}

async function cmdScan() {
  info('\n  chode scan — Full free-tier health probe\n');
  info('  Testing all ' + Object.keys(PROVIDERS).length + ' providers...\n');
  var scored = await runFullScan(true);
  showQuickScore();
  var lb = loadLeaderboard();
  info('\n  Per-provider:\n');
  scored.forEach(function(r) {
    var st = (lb.providers && lb.providers[r.id] && lb.providers[r.id].lastStatus) || '?';
    var lat = lb.providers && lb.providers[r.id] && lb.providers[r.id].avgLatency;
    var line;
    if (st === 'ok') line = '  ✓ ' + r.name.padEnd(28) + Math.round(lat || r.latency || 0) + 'ms';
    else if (st === 'missing_key') line = '  ○ ' + r.name.padEnd(28) + 'SKIPPED (no key)';
    else line = '  x ' + r.name.padEnd(28) + String(st).slice(0, 40);
    info(line + '\n', 'dim');
  });
  return scored;
}

// ─── Offline Utilities ─────────────────────────────────────────────────────────
// Deterministic local transforms: no network (except mermaid render), no quota,
// no keys. Results print to stdout (composable); problems go to stderr.

function utilInput(parts) {
  if (!parts || parts.length === 0) return '';
  var first = String(parts[0]);
  if (first.charAt(0) === '@' && first.length > 1) {
    var fp = first.slice(1);
    if (isSecretPath(fp)) { fail('  util: denied secret path (/.env blocked by default): ' + fp + '\n'); return null; }
    if (isDestructiveTarget(fp)) { fail('  util: denied outside workspace: ' + fp + '\n'); return null; }
    var full = path.isAbsolute(fp) ? fp : path.join(ROOT, fp);
    try {
      var st = fs.statSync(full);
      if (!st.isFile() || st.size > 200 * 1024) { fail('  util: file unreadable or >200KB: ' + fp + '\n'); return null; }
      var raw = fs.readFileSync(full, 'utf8');
      if (raw.indexOf('\u0000') !== -1) { fail('  util: binary file, refusing: ' + fp + '\n'); return null; }
      return raw;
    } catch (e) { fail('  util: cannot read file: ' + fp + '\n'); return null; }
  }
  if (first === '-') {
    if (process.stdin.isTTY) { fail('  util: no piped stdin\n'); return null; }
    try { return fs.readFileSync(0, 'utf8'); } catch (e) { fail('  util: stdin read failed\n'); return null; }
  }
  return parts.join(' ');
}

async function cmdUtil(argv) {
  argv = argv || [];
  var sub = String(argv[0] || '').toLowerCase();
  var op = String(argv[1] || '').toLowerCase();
  var rest = argv.slice(2);
  var s;
  if (sub === 'b64' && op === 'encode') { s = utilInput(rest); if (s === null) return; console.log(Buffer.from(s, 'utf8').toString('base64')); return; }
  if (sub === 'b64' && op === 'decode') { s = utilInput(rest); if (s === null) return; try { console.log(Buffer.from(String(s).trim(), 'base64').toString('utf8')); } catch (e) { fail('  util: invalid base64\n'); } return; }
  if (sub === 'hash' && ['md5', 'sha1', 'sha256', 'sha512'].indexOf(op) !== -1) { s = utilInput(rest); if (s === null) return; try { console.log(require('crypto').createHash(op).update(s, 'utf8').digest('hex')); } catch (e) { fail('  util: hash failed\n'); } return; }
  if (sub === 'uuid') { console.log(require('crypto').randomUUID()); return; }
  if (sub === 'jwt' && op === 'decode') {
    s = utilInput(rest); if (s === null) return;
    try {
      var prt = String(s).trim().split('.');
      if (prt.length < 2) throw new Error('badshape');
      var b64u = function (x) { return Buffer.from(x.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); };
      var head = JSON.parse(b64u(prt[0])), pay = JSON.parse(b64u(prt[1]));
      if (pay.exp) pay.exp_human = new Date(pay.exp * 1000).toISOString();
      console.log(JSON.stringify({ header: head, payload: pay }, null, 2));
    } catch (e) { fail('  util: invalid JWT\n'); }
    return;
  }
  if (sub === 'json' && (op === 'pretty' || op === 'minify')) {
    s = utilInput(rest); if (s === null) return;
    try { var o = JSON.parse(s); console.log(op === 'pretty' ? JSON.stringify(o, null, 2) : JSON.stringify(o)); } catch (e) { fail('  util: invalid JSON\n'); }
    return;
  }
  if (sub === 'url' && op === 'encode') { s = utilInput(rest); if (s === null) return; console.log(encodeURIComponent(s)); return; }
  if (sub === 'url' && op === 'decode') { s = utilInput(rest); if (s === null) return; try { console.log(decodeURIComponent(s)); } catch (e) { fail('  util: invalid encoding\n'); } return; }
  if (sub === 'tokens' && op === 'estimate') {
    s = utilInput(rest); if (s === null) return;
    console.log('~' + Math.ceil(s.length / 4) + ' tokens (heuristic: chars/4, not a real tokenizer)');
    return;
  }
  if (sub === 'mermaid' && op === 'render') {
    var mp = rest.slice();
    var mout = 'mermaid.svg';
    var oi = mp.indexOf('--out');
    if (oi !== -1) { if (mp[oi + 1]) mout = mp[oi + 1]; mp.splice(oi, 2); }
    var msrc = utilInput(mp.length ? mp : ['']);
    if (!msrc) { fail('  util: missing mermaid source\n'); return; }
    try {
      var mresp = await fetch('https://kroki.io/mermaid/svg', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: msrc, signal: AbortSignal.timeout(25000) });
      if (!mresp.ok) throw new Error('http ' + mresp.status);
      var svg = await mresp.text();
      if (svg.indexOf('<svg') === -1) throw new Error('not svg');
      fs.writeFileSync(mout, svg, 'utf8');
      ok('  Rendered ' + mout + ' (' + svg.length + ' bytes)\n');
    } catch (e) { warn('  Kroki render failed (' + String(e.message || e).split('\n')[0] + '). Try it live: https://mermaid.live\n'); }
    return;
  }
  info('\n  chode util — offline deterministic helpers (results on stdout)\n' +
    '    b64 encode|decode <text|@file>\n' +
    '    hash md5|sha1|sha256|sha512 <text|@file>\n' +
    '    jwt decode <token>\n' +
    '    json pretty|minify <file|->\n' +
    '    url encode|decode <text>\n' +
    '    uuid\n' +
    '    tokens estimate <text|@file>   (heuristic: chars/4)\n' +
    '    mermaid render <file.mmd> [--out out.svg]\n');
}

function cmdTool(argv) {
  // Minimal tools (max 4, zero-dep, no MCP/LSP). Results on stdout, chatter stderr.
  argv = argv || [];
  var name = String(argv[0] || 'list').toLowerCase();
  var approved = argv.indexOf('--yes') !== -1;
  if (name === 'list' || !TOOLS[name]) {
    info('\n  chode tool — minimal local tools (max 4)\n');
    for (var k in TOOLS) info('    ' + k.padEnd(6) + TOOLS[k].desc + '  [' + (TOOL_PERMISSIONS[k] || TOOLS[k].perm) + ']\n', 'dim');
    info('  Usage: chode tool read <file> | glob <pat> | grep <re> [dir] | edit <file> <old> <new> --yes\n');
    info('  Secrets (~/.env) denied by default; destructive (outside workspace) always denied.\n');
    return;
  }
  if (name === 'read') {
    var r = toolExec('read', { file: argv[1] });
    if (r.ok) console.log(r.content); else fail('  tool read: ' + r.error + '\n');
    return;
  }
  if (name === 'glob') {
    var g = toolExec('glob', { pattern: argv[1] || '**/*.js' });
    console.log((g.files || []).join('\n'));
    return;
  }
  if (name === 'grep') {
    if (!argv[1]) { fail('  Usage: chode tool grep <regex> [dir]\n'); return; }
    var gr = toolExec('grep', { pattern: argv[1], dir: argv[2] });
    if (!gr.ok) { fail('  tool grep: ' + gr.error + '\n'); return; }
    console.log((gr.hits || []).join('\n'));
    return;
  }
  if (name === 'edit') {
    if (!argv[1] || argv[2] === undefined || argv[3] === undefined) { fail('  Usage: chode tool edit <file> <old> <new> --yes\n'); return; }
    var er = toolExec('edit', { file: argv[1], oldString: argv[2], newString: argv[3] }, { approved: approved });
    if (er.ok) ok('  Edited ' + argv[1] + '\n');
    else if (er.needConfirm) warn('  tool edit asks first: rerun with --yes to confirm.\n');
    else fail('  tool edit: ' + er.error + '\n');
    return;
  }
}

async function cmdResearch() {
  // Self-updating provider research: re-probe known keyless endpoints and admit
  // newly-working candidates into the overlay. Report only — never auto-removes
  // anything, never throws (exit 0 always). Probes are sequential with a 3s gap
  // (rate-limit politeness); a 429 is reported as rate-limited, never retried.
  info('\n  chode research — Probe candidate keyless providers\n');
  try {
    // Seed candidates copy the EXACT working shapes of the registry `ovh`
    // (anonymous POST) and `llm7` (`Bearer unused` POST) entries. The model/auth
    // data twins mirror what body()/headers() send — functions don't survive
    // JSON, so the overlay persists those scalars for rehydration on load.
    var seeds = [
      { id: 'ovh',
        name: 'OVHcloud (Keyless)', category: 'keyless', requiresKey: null, qualityScore: 70,
        signupUrl: 'https://www.ovhcloud.com/en/public-cloud/ai-endpoints/',
        freeTier: 'No key · 2 req/min · 70B models',
        endpoints: [{
          type: 'chat',
          url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
          headers: () => ({ 'Content-Type': 'application/json' }),
          body: (k, m) => JSON.stringify({ model: 'Meta-Llama-3_3-70B-Instruct', messages: m, max_tokens: 2048 }),
          parse: d => d.choices?.[0]?.message?.content,
          model: 'Meta-Llama-3_3-70B-Instruct', auth: 'none'
        }] },
      { id: 'llm7',
        name: 'LLM7 (Keyless)', category: 'keyless', requiresKey: null, qualityScore: 65,
        signupUrl: 'https://docs.llm7.io/quickstart',
        freeTier: 'No key · anonymous tier · rotating models',
        endpoints: [{
          type: 'chat',
          url: 'https://api.llm7.io/v1/chat/completions',
          headers: () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer unused' }),
          body: (k, m) => JSON.stringify({ model: 'default', messages: m, max_tokens: 2048 }),
          parse: d => d.choices?.[0]?.message?.content,
          model: 'default', auth: 'unused'
        }] }
    ];
    function endpointUrlOf(p) {
      try {
        var u = p.endpoints[0].url;
        var s = (typeof u === 'function') ? (u(null) || u) : u;
        return (typeof s === 'string') ? s : String(s);
      } catch (e) { return null; }
    }
    // Known endpoint URLs across registry + overlay (overlay merged at startup).
    var knownByUrl = {};
    for (var pid in PROVIDERS) {
      var u = endpointUrlOf(PROVIDERS[pid]);
      if (u) knownByUrl[u] = pid;
    }
    var now = new Date().toISOString();
    var overlay = { updated: now, providers: {} };
    try {
      var prev = JSON.parse(fs.readFileSync(CUSTOM_PROVIDERS_FILE, 'utf8'));
      if (prev && prev.providers) overlay.providers = prev.providers;
    } catch (e) {}
    var added = [], reverified = [], skipped = [], failed = [];
    for (var i = 0; i < seeds.length; i++) {
      var seed = seeds[i];
      var surl = endpointUrlOf(seed);
      var knownPid = knownByUrl[surl] || null;
      if (i > 0) await new Promise(function(r) { setTimeout(r, 3000); }); // 3s gap between probes
      var res;
      if (knownPid) {
        // Skip-if-known: never re-add; re-probe to refresh lastVerified.
        skipped.push(knownPid);
        res = await probeProvider(knownPid, PROVIDERS[knownPid].endpoints[0]);
        if (res.ok) {
          reverified.push(knownPid);
          if (overlay.providers[knownPid]) overlay.providers[knownPid].lastVerified = now;
        } else {
          failed.push(knownPid + ' (' + (res.error || 'probe failed') + ')');
        }
      } else {
        // Unknown: probe via the existing probeProvider() under a temp id.
        var tmpId = '__research_' + seed.id;
        PROVIDERS[tmpId] = seed;
        try { res = await probeProvider(tmpId, seed.endpoints[0]); }
        finally { delete PROVIDERS[tmpId]; }
        if (res.ok) {
          var ep0 = seed.endpoints[0];
          overlay.providers[seed.id] = {
            name: seed.name, category: 'keyless', requiresKey: null,
            qualityScore: seed.qualityScore, signupUrl: seed.signupUrl, freeTier: seed.freeTier,
            endpoints: [{ type: 'chat', url: (typeof ep0.url === 'function' ? endpointUrlOf(seed) : ep0.url), model: ep0.model, auth: ep0.auth }],
            addedAt: now, lastVerified: now, source: 'research'
          };
          PROVIDERS[seed.id] = seed; // live for the rest of this process
          knownByUrl[surl] = seed.id;
          added.push(seed.id);
        } else {
          failed.push(seed.id + ' (' + (res.error || 'probe failed') + ')');
        }
      }
    }
    overlay.updated = now;
    try { fs.mkdirSync(CONFIG_DIR, { recursive: true }); fs.writeFileSync(CUSTOM_PROVIDERS_FILE, JSON.stringify(overlay, null, 2), 'utf8'); } catch (e) {}
    function showList(title, items, mark) {
      info('  ' + title + ' (' + items.length + '):\n');
      if (items.length === 0) { info('    (none)\n', 'dim'); return; }
      for (var k = 0; k < items.length; k++) info('    ' + mark + ' ' + items[k] + '\n', 'dim');
    }
    showList('ADDED', added, '+');
    showList('RE-VERIFIED', reverified, '~');
    showList('SKIPPED-known', skipped, '=');
    showList('FAILED', failed, 'x');
    info('  Overlay: ' + CUSTOM_PROVIDERS_FILE + '\n');
  } catch (e) {
    warn('  Research report failed but the CLI survives: ' + String((e && e.message) || e).split('\n')[0]);
  }
}

function cmdScore() {
  var lb = loadLeaderboard();
  if (!lb.ranked||lb.ranked.length===0) { warn('No scan data. Run `chode scan` first.'); return; }
  info('\n  chode score — Live Provider Leaderboard\n  Updated: '+(lb.updated?new Date(lb.updated).toLocaleString():'never')+'\n');
  info('  Rank  Provider'.padEnd(30)+'Score  Rel      Latency  Tier\n');
  info('  '+'─'.repeat(72)+'\n');
  for (var i=0;i<lb.ranked.length;i++) {
    var r=lb.ranked[i], icon=r.score>=70?'\u2713':(r.score>=40?'○':'x'),
         cat=r.category==='free_tier'?'FREE':(r.category==='free_local'?'LOCAL':(r.category==='keyless'?'KEYLESS':(r.category==='bootstrap'?'BOOTSTRAP':'PAID'))),
         lat=r.latency?Math.round(r.latency)+'ms':'---';
    say('  '+icon+' #'+String(i+1).padEnd(3)+' '+r.name.padEnd(22), r.score>=70?'green':'white');
    info(' '+String(r.score).padStart(3)+'    '+String(r.reliability).padStart(3)+'%       '+lat.padEnd(8)+' '+cat+'\n','dim');
  }
  info('\n  Top: '+(lb.ranked[0]?.name||'none')+'\n');
}

function cmdStatus() {
  var lb = loadLeaderboard();
  var usage = loadUsage();
  info('\n  ═══ chode Status ═══\n');
  info('  Providers:\n');
  // Single Ollama reachability probe shared by the row below and the summary
  // line — previously the row claimed ✓ ready while the summary said down.
  var ollamaUp = false;
  try { require('child_process').execSync('curl -s http://localhost:11434/api/tags',{encoding:'utf8',stdio:'pipe'}); ollamaUp = true; } catch (e) {}
  for (var pid in PROVIDERS) {
    var p = PROVIDERS[pid];
    var hasKey = !p.requiresKey || !!(process.env[p.requiresKey] || (loadConfig().providers?.[pid]?.key));
    if (pid === 'ollama') hasKey = ollamaUp;
    var cb = getCircuitState(pid);
    var icon = hasKey ? '✓' : '○';
    var status = hasKey ? 'ready' : (pid === 'ollama' ? 'not running' : 'no key');
    if (cb && cb.state === 'open') { status += ' [CIRCUIT OPEN]'; icon = '⚠'; }
    else if (cb && cb.failures > 0) { status += ' ('+cb.failures+' failures)'; }
    var usg = usage.providers[pid];
    var uStr = usg ? usg.requests+'req '+usg.tokens+'tok '+usg.errors+'err' : '';
    say('  '+icon+' '+pid.padEnd(16), icon==='✓'?'green':'white');
    info('   '+p.name.padEnd(24)+status.padEnd(30)+uStr+'\n','dim');
  }
  // Provider-research staleness nudge (one line — no other status changes).
  try {
    var ovInfo = JSON.parse(fs.readFileSync(CUSTOM_PROVIDERS_FILE, 'utf8'));
    if (!ovInfo.updated || (Date.now() - new Date(ovInfo.updated).getTime() > 30 * 24 * 3600 * 1000)) info('  Provider research stale — run: chode research\n', 'dim');
  } catch (e) { info('  Provider research stale — run: chode research\n', 'dim'); }
  var cp = loadCheckpoint();
  if (cp) info('\n  Last Checkpoint: provider='+(PROVIDERS[cp.lastProvider]?.name||cp.lastProvider)+' ts='+new Date(cp.ts).toLocaleString()+'\n','yellow');
  try {
    var allCps = listCheckpoints().filter(function (c) { return c && c.taskId && (!cp || c.taskId !== cp.taskId); }).slice(0, 3);
    for (var ci = 0; ci < allCps.length; ci++) info('  Checkpoint [' + allCps[ci].taskId + ']: step=' + (allCps[ci].stepIndex != null ? allCps[ci].stepIndex : '-') + ' ts=' + new Date(allCps[ci].ts).toLocaleString() + '\n', 'dim');
  } catch (e) {}
  var queues = listWorkQueues();
  if (queues.length > 0) {
    info('\n  Active Projects:\n');
    for (var k=0;k<queues.length;k++) {
      var q=queues[k], done=q.steps?q.steps.filter(function(s){return s.done;}).length:0;
      info('    ['+q.id+'] '+done+'/'+(q.steps?q.steps.length:0)+' steps'+(q.completed?' ✓ DONE':'')+'\n','dim');
    }
  }
  info(ollamaUp ? '\n  Ollama: running ✓\n' : '\n  Ollama: not running (install: winget install Ollama.Ollama)\n');
  info('  Commands: chode ai "prompt" | chode provision | chode status | chode scan\n');
}

function resolveFileContext(text) {
  return String(text).replace(/(^|\s)@(\S+)/g, function (full, pre, p) {
    var clean = p.replace(/[,.;:!?)\]]+$/, '');
    if (isSecretPath(clean)) { warn('  @' + clean + ' denied (secret path blocked by default) — left as-is'); return full; }
    if (isDestructiveTarget(clean)) { warn('  @' + clean + ' denied (outside workspace) — left as-is'); return full; }
    var fp = path.isAbsolute(clean) ? clean : path.join(ROOT, clean);
    var body = null;
    try {
      var st = fs.statSync(fp);
      if (st.isFile() && st.size <= 100 * 1024) {
        var raw = fs.readFileSync(fp, 'utf8');
        if (raw.indexOf('\u0000') === -1) body = raw;
      }
    } catch (e) {}
    if (body === null) { warn('  @' + clean + ' unreadable or >100KB — left as-is'); return full; }
    return pre + '[Context from ' + clean + ']\n```\n' + body + '\n```\n[end context]';
  });
}

async function cmdAI(rawArgs) {
  // Accepts argv arrays (one-shot CLI) or option objects (interactive REPL —
  // parseArgs would mangle an object into an empty prompt and nest REPLs).
  var args = Array.isArray(rawArgs) ? parseArgs(rawArgs) : (rawArgs || {});
  var sessionId = args.session || args[0];
  var prompt = args.prompt;
  // @file context (opencode-style): @path tokens are read (cap 100KB, text
  // only) and inlined so the model sees the file. Unreadable paths stay
  // untouched in the prompt with one warning each.
  if (prompt && prompt.indexOf('@') !== -1) {
    prompt = resolveFileContext(prompt);
  }
  var force = args.force;
  var resume = args.resume;
  var fromRepl = !Array.isArray(rawArgs);

  // Checkpoint recovery (per-task files: ai vs project never clobber).
  var checkpoint = loadCheckpoint(sessionId || 'default');
  if (resume && !prompt && checkpoint && checkpoint.lastPrompt) {
    info('\n  Resuming from checkpoint (' + new Date(checkpoint.ts).toLocaleString() + ')\n');
    info('  Last provider: ' + checkpoint.lastProvider + '\n');
    var restoredSession = loadSession(checkpoint.taskId || sessionId || 'default');
    if (restoredSession.messages.length > 0) {
      info('  Restoring ' + restoredSession.messages.length + ' messages from session\n');
    }
    sessionId = checkpoint.taskId || sessionId || 'default';
    prompt = '[RESUME] Previous conversation context restored. Continue from where we left off.';
  } else if (checkpoint && checkpoint.lastPrompt && !prompt && !resume) {
    info('\n  Resuming from checkpoint (' + new Date(checkpoint.ts).toLocaleString() + ')\n');
    info('  Last provider: ' + checkpoint.lastProvider + '\n');
    var restoredSession = loadSession(checkpoint.taskId || 'default');
    if (restoredSession.messages.length > 0) {
      info('  Restoring ' + restoredSession.messages.length + ' messages from session\n');
    }
    // Route through the stored session so its history actually reaches the call
    // (previously the messages were assigned to a dead global and dropped).
    sessionId = checkpoint.taskId || 'default';
    prompt = '[RESUME] Previous conversation context restored. Continue from where we left off.';
  }

  if (!sessionId && !prompt) {
    sessionId = 'default'; // REPL path defaults so default.json history actually saves
    // ── REPL UI (Phase 2, bounded) ──────────────────────────────────────
    // readline only (Node builtin, zero-dep kept). Prompt + editing live on
    // stderr so stdout stays pure results for pipes. Chunked writes below are
    // stderr-only by design; stdout is NEVER chunked/streamed (single write).
    var readline = require('readline');
    info('\n  ── chode session ──\n');
    var lastSession = loadSession(null);
    if (lastSession.messages.length > 0) info('  state: continuing (' + lastSession.messages.length + ' messages kept)\n', 'dim');
    else info('  state: fresh (no messages yet)\n', 'dim');
    showQuickScore();
    info('  Type a prompt, or one of: exit · heal · scan · score · status · checkpoint · clear · help\n', 'dim');
    info('  Local helpers: !<cmd> runs here as context · /compact shortens history here (no extra call)\n', 'dim');
    info('  Empty line is ignored. End a line with \\ to continue on the next line.\n', 'dim');

    // Streamed-feel: many small stderr writes. Stdout untouched (pure results).
    function replStderr(msg, color) {
      var palette = { white: '\x1b[38;5;252m', cyan: '\x1b[38;5;87m', green: '\x1b[38;5;82m',
        yellow: '\x1b[38;5;220m', red: '\x1b[38;5;203m', dim: '\x1b[38;5;240m',
        purple: '\x1b[38;5;141m', bright: '\x1b[38;5;195m' };
      var open = palette[color] || palette.white;
      var close = '\x1b[0m';
      try { process.stderr.write(open); } catch (e) {}
      var CH = 48;
      for (var i = 0; i < msg.length; i += CH) {
        try { process.stderr.write(msg.slice(i, i + CH)); } catch (e) { break; }
      }
      try { process.stderr.write(close); } catch (e) {}
    }

    function printReplHelp() {
      info('  ── help ──\n', 'dim');
      info('  Type a prompt and press Enter. An empty line does nothing.\n', 'dim');
      info('  exit (or quit) — leave; the saved resume point is cleared\n', 'dim');
      info('  heal (or switch) — re-check providers, then keep going\n', 'dim');
      info('  scan — probe providers and rebuild the ranking\n', 'dim');
      info('  score — show the current ranking\n', 'dim');
      info('  status — show provider health and session state\n', 'dim');
      info('  checkpoint — show the saved resume point, if any\n', 'dim');
      info('  clear — remove the saved resume point\n', 'dim');
      info('  !<cmd> — run a shell command here; output stays here as context for the next prompt\n', 'dim');
      info('  /compact — shorten saved history here to the last 20 messages (local only, no extra call)\n', 'dim');
      info('  Tip: end a line with \\ to continue on the next line (for pasting multi-line text).\n', 'dim');
    }

    var REPL_COMMANDS = ['exit', 'quit', 'heal', 'switch', 'scan', 'score', 'status', 'checkpoint', 'clear', 'help', '/compact'];
    function replCompleter(line) {
      if (line.charAt(0) === '!') return [[], line];
      var hits = REPL_COMMANDS.filter(function (c) { return c.indexOf(line) === 0; });
      return [hits.length ? hits : REPL_COMMANDS.slice(), line];
    }
    // Pipe-safety: prompt + editing on stderr, never stdout.
    var rl = readline.createInterface({ input: process.stdin, output: process.stderr, prompt: '  > ', completer: replCompleter, historySize: 200 });

    var afkTimer = null;
    function armAfk() {
      if (afkTimer) clearTimeout(afkTimer);
      afkTimer = setTimeout(function () {
        var lb = loadLeaderboard();
        var fastest = lb.ranked && lb.ranked.length > 0 ? lb.ranked[0].id : null;
        if (fastest) info('\n  [AFK — switching to: ' + (PROVIDERS[fastest]?.name || fastest) + ']\n');
        else info('\n  [AFK — run `chode scan` to discover providers]\n');
        try { rl.prompt(true); } catch (e) {}
        armAfk();
      }, AFK_TIMEOUT * 1000);
    }

    var pending = '';
    var shellContext = '';
    rl.on('close', function () {
      // Ctrl+C / Ctrl+D: leave the resume point alone so `--resume` still works.
      // (`exit`/`quit` below clears it — that distinction is intentional.)
      if (afkTimer) clearTimeout(afkTimer);
      info('  Session kept — --resume will pick it up. Goodbye.\n');
      process.exit(0);
    });
    rl.on('line', function (raw) {
      if (afkTimer) clearTimeout(afkTimer);
      raw = String(raw == null ? '' : raw);
      // Multiline paste: a trailing single `\` continues on the next line.
      if (/\\\s*$/.test(raw) && !/\\\\\s*$/.test(raw)) {
        pending += raw.replace(/\\\s*$/, '') + '\n';
        try { rl.setPrompt('  ... '); } catch (e) {}
        armAfk();
        try { rl.prompt(); } catch (e) {}
        return;
      }
      var full = (pending + raw).trim();
      pending = '';
      try { rl.setPrompt('  > '); } catch (e) {}
      if (!full) { armAfk(); try { rl.prompt(); } catch (e) {} return; }
      // Shell escape: `!cmd` runs locally, output stays here (stderr-only).
      if (full.charAt(0) === '!') {
        var shellCmd = full.slice(1).trim();
        if (!shellCmd) { info('  Use: !<command> — runs here, output stays here as context.\n', 'dim'); armAfk(); try { rl.prompt(); } catch (e) {} return; }
        try {
          var out = require('child_process').execSync(shellCmd, { encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
          var shown = String(out == null ? '' : out);
          if (!shown.trim()) shown = '(no output)';
          shellContext = '[Shell `!' + shellCmd + '` output]\n' + String(out == null ? '' : out).slice(0, 4000) + '\n[end shell output]';
          var disp = shown.length > 4000 ? shown.slice(0, 4000) + '\n…(truncated, first 4000 chars shown)' : shown;
          info('  ── shell: !' + shellCmd + ' ──\n', 'dim');
          replStderr('  ' + disp.replace(/\n/g, '\n  ') + (disp.slice(-1) === '\n' ? '' : '\n'), 'dim');
        } catch (e) {
          var emsg = String((e && e.message) || e).split('\n')[0].slice(0, 500);
          var estd = '';
          try { if (e.stdout) estd += String(e.stdout).slice(0, 1500); if (e.stderr) estd += String(e.stderr).slice(0, 1500); } catch (x) {}
          warn('  Shell failed: ' + emsg);
          if (String(estd).trim()) replStderr('  ' + String(estd).replace(/\n/g, '\n  ').slice(0, 2000) + '\n', 'dim');
        }
        armAfk(); try { rl.prompt(); } catch (e2) {} return;
      }
      // Local-only history shortening: no LLM call, no quota used.
      if (full === '/compact' || full.indexOf('/compact ') === 0) {
        try {
          var KEEP = 20;
          var s = loadSession('default');
          var n = (s.messages || []).length;
          if (n <= KEEP) info('  Nothing to shorten — ' + n + ' messages kept. No extra call was made.\n', 'dim');
          else {
            s.messages = s.messages.slice(-KEEP);
            saveSession(s);
            info('  Shortened history here: ' + n + ' → ' + s.messages.length + ' messages. No extra call was made.\n');
          }
        } catch (e) { warn('  Could not shorten history here: ' + String((e && e.message) || e).split('\n')[0]); }
        armAfk(); try { rl.prompt(); } catch (e2) {} return;
      }
      if (full === 'exit' || full === 'quit') { if (afkTimer) clearTimeout(afkTimer); clearCheckpoint(); info('  Resume point cleared. Goodbye.\n'); process.exit(0); return; }
      if (full === 'help' || full === '?') { printReplHelp(); armAfk(); try { rl.prompt(); } catch (e) {} return; }
      if (full === 'heal' || full === 'switch') { info('  Re-checking providers…\n'); cmdScan().then(function () { armAfk(); try { rl.prompt(); } catch (e) {} }, function (e) { warn('Scan failed but the session survives: ' + (e && e.message ? e.message.split('\n')[0] : e)); armAfk(); try { rl.prompt(); } catch (e2) {} }); return; }
      if (full === 'scan') { cmdScan().then(function () { armAfk(); try { rl.prompt(); } catch (e) {} }, function (e) { warn('Scan failed but the session survives: ' + (e && e.message ? e.message.split('\n')[0] : e)); armAfk(); try { rl.prompt(); } catch (e2) {} }); return; }
      if (full === 'score') { cmdScore(); armAfk(); try { rl.prompt(); } catch (e) {} return; }
      if (full === 'status') { cmdStatus(); armAfk(); try { rl.prompt(); } catch (e) {} return; }
      if (full === 'checkpoint') { var cp = loadCheckpoint('default'); var all = listCheckpoints(); info(cp ? '  Checkpoint: ' + JSON.stringify(cp).slice(0, 2000) + '\n' : '  No checkpoint saved.\n'); if (all.length > 1) info('  (' + all.length + ' resume points saved; `clear` clears this session only)\n', 'dim'); armAfk(); try { rl.prompt(); } catch (e) {} return; }
      if (full === 'clear') { clearCheckpoint('default'); info('  Checkpoint cleared.\n'); armAfk(); try { rl.prompt(); } catch (e) {} return; }
      replStderr('  → Contacting provider (parallel routing, ' + MAX_RETRY + ' tries)…\n', 'cyan');
      var effectivePrompt = shellContext ? '[Local shell output as context]\n' + shellContext + '\n[end context]\n\n' + full : full;
      shellContext = '';
      cmdAI({ session: sessionId, prompt: effectivePrompt, force: force, resume: resume }).then(function (res) {
        if (res) {
          // PIPE-SAFETY: stdout carries ONLY this single result write. No chunking, no color, no streaming on stdout — rejected by design.
          console.log('\n  ' + res.result + '\n');
          try {
            var cr2 = getCostReport();
            replStderr('  ── routed via ' + (res.providerName || res.provider) + ' (' + res.provider + ') · ' + (res.tokens || 0) + ' tok · ' + (res.latency || 0) + 'ms · spend today $' + (cr2.totalCost || '0') + ' ──\n', 'dim');
          } catch (e) {}
        } else {
          replStderr('  No answer this time. Try `scan` or `status` to check providers.\n', 'dim');
        }
        armAfk(); try { rl.prompt(); } catch (e) {}
      }, function (e) {
        // The harness never exits itself: a failed request warns and re-prompts.
        warn('Request failed but the session survives: ' + (e && e.message ? e.message.split('\n')[0] : e));
        replStderr('  Hint: `scan` re-checks providers, `status` shows health. If keys are missing, exit and run `chode auth <provider> <key>`.\n', 'dim');
        armAfk(); try { rl.prompt(); } catch (e2) {}
      });
    });
    armAfk();
    try { rl.prompt(); } catch (e) {}
    return;
  }

  if (!sessionId) sessionId = 'default'; // one-shot saves too, so --resume works
  if (!prompt) { info('  No prompt given. Type one, or run `node chode.js` for interactive.\n'); return null; }
  if (!fromRepl) info('  → Calling AI (parallel routing, ' + MAX_RETRY + ' retries)...\n');
  var res = await callWithBestProvider(prompt, sessionId, force);
  if (fromRepl) return res; // REPL outer handles display (padded stdout + stderr cost)
  if (res) {
    // PIPE-SAFETY: single stdout write stays pure for `> file` and pipes; cost line below is stderr-only.
    console.log(res.result);
    try { var cr1 = getCostReport(); info('  ── routed via ' + (res.providerName || res.provider) + ' (' + res.provider + ') · ' + (res.tokens || 0) + ' tok · ' + (res.latency || 0) + 'ms · spend today $' + (cr1.totalCost || '0') + ' ──\n', 'dim'); } catch (e) {}
    info('  Continue: `node chode.js` for interactive, or `node chode.js ai --resume` to pick up this session.\n');
  }
  return res;
}

function parseArgs(argv) {
  var r = { session:null, prompt:'', force:null, resume:false };
  for (var i=0;i<argv.length;i++) {
    if (argv[i]==='--session'&&argv[i+1]) r.session=argv[++i];
    else if (argv[i]==='--force'&&argv[i+1]) r.force=argv[++i];
    else if (argv[i]==='--resume') r.resume=true;
    else if (!argv[i].startsWith('--')) r.prompt+=(r.prompt?' ':'')+argv[i];
  }
  return r;
}

function clearCheckpoint(taskId) {
  // Per-task clear: ai exit never wipes project checkpoints.
  try {
    if (taskId) { try { fs.unlinkSync(checkpointFileFor(taskId)); } catch (e) {} return; }
    try { fs.unlinkSync(checkpointFileFor('default')); } catch (e) {}
    try { fs.unlinkSync(CHECKPOINT_FILE); } catch (e) {}
  } catch (e) {}
}

async function cmdProject(spec) {
  info('\n  chode project — Multi-provider orchestration\n');

  var steps;
  try { steps = JSON.parse(spec); }
  catch { steps = null; }

  if (!steps) {
    info('  Scanning providers...\n');
    var scored = await runFullScan(false); showQuickScore();
    info('\n  Decomposing: "' + spec + '"\n');
    var planResult = await callWithBestProvider('Break into numbered steps (one per line, no explanations): ' + spec, null, null);
    if (!planResult) { warn('Planning failed. Using defaults.'); steps = [{desc:'Analyze:'+spec},{desc:'Plan'},{desc:'Execute'}]; }
    else {
      var lines = planResult.result.split('\n').filter(function(l){return l.trim();});
      steps = lines.map(function(l,i){return {desc:l.trim(),index:i+1};});
    }
  } else if (Array.isArray(steps)) {
    steps = steps.map(function(s,i){ return (typeof s === 'string') ? {desc:s,index:i+1} : s; });
  } else {
    // Parsed JSON but not an array (e.g. a bare number) — treat as one step.
    steps = [{ desc: (steps && steps.desc) || spec, index: 1 }];
  }

  var qid = 'proj_' + Date.now();
  var q = loadWorkQueue(qid);
  if (!q) {
    q = { id: qid, spec: spec, steps: steps.map(function(s){ return {desc:s.desc,done:false,result:null,provider:null,error:null}; }), startedAt: Date.now() };
    saveWorkQueue(q);
  }

  return await runProjectSteps(q);
}

async function runProjectSteps(q) {
  var startIdx = 0;
  for (var i = 0; i < q.steps.length; i++) { if (!q.steps[i].done) { startIdx = i; break; } }

  info('  Plan: ' + q.steps.length + ' steps (starting at ' + (startIdx+1) + ')\n');
  var results = [];

  for (var i = startIdx; i < q.steps.length; i++) {
    var step = q.steps[i];
    if (!step.desc) {
      warn('  ['+(i+1)+'/'+q.steps.length+'] Skipping step with missing description');
      q.steps[i].error = 'missing_desc';
      results.push({step:i+1,error:'missing_desc'});
      continue;
    }
    info('\n  ['+(i+1)+'/'+q.steps.length+'] ' + step.desc.slice(0,60));

    saveCheckpoint({ taskId: q.id, stepIndex: i, stepDesc: step.desc, ts: Date.now() });

    // One fresh scan per project (done at plan time); per step reuse the cached
    // leaderboard — re-probing every step burns the keyless rate limits we measure.
    var lbNow = loadLeaderboard();
    var scored = (lbNow.ranked && lbNow.ranked.length > 0) ? lbNow.ranked : await runFullScan(false);
    var topProvs = scored.slice(0, PARALLEL_PROVIDERS).map(function(r){return r.id;});
    // Sequential attempts with early exit. One routing pass is already internally
    // parallel + resilient; fanning out N full passes burns N× quota (seen live:
    // 3 concurrent passes 429'd a 2 req/min tier).
    var stepResult = null, stepProvider = null, lastErr = null;
    for (var a = 0; a < topProvs.length && !stepResult; a++) {
      try {
        var attempt = await callWithBestProvider(step.desc, q.id, topProvs[a]);
        if (attempt && attempt.result) { stepResult = attempt.result; stepProvider = attempt.provider; }
      } catch (e) { lastErr = e; }
    }
    if (!stepResult && lastErr) { warn('  Step attempts failed: ' + String((lastErr && lastErr.message) || lastErr).split('\n')[0]); }

    if (stepResult) {
      ok('  Done via ' + (PROVIDERS[stepProvider]?.name||stepProvider));
      q.steps[i].done = true; q.steps[i].result = stepResult; q.steps[i].provider = stepProvider;
      q.completedSteps = (q.completedSteps||0) + 1;
      results.push({step:i+1,result:stepResult.slice(0,300),provider:stepProvider});
    } else {
      warn('  Failed — no provider succeeded');
      q.steps[i].error = 'all_failed';
      results.push({step:i+1,error:'all_failed'});
    }
    saveWorkQueue(q);
  }

  q.completed = results.every(function(r){return r.result;});
  q.completedAt = Date.now();
  saveWorkQueue(q);

  info('\n  Complete: ' + results.filter(function(r){return r.result;}).length + '/' + results.length + ' steps\n');
  info('  Resume: chode project --resume ' + q.id + '\n');
  return results;
}

async function cmdProjectResume(qid) {
  var q = loadWorkQueue(qid);
  if (!q) { fail('Not found: ' + qid); return; }
  var done = (q.steps || []).filter(function(s){return s.done;}).length;
  info('\n  Resuming: ' + qid + ' (' + done + '/' + q.steps.length + ' done)\n');
  if (q.completed || (q.steps.length > 0 && done === q.steps.length)) { ok('  Project already complete. Nothing to resume.\n'); return; }
  await runProjectSteps(q);
}

async function cmdHeal() {
  info('\n  chode heal — Force provider diagnostics\n');
  // Reset all circuit breakers
  circuitBreakers = {};
  rateLimits = {};
  await runFullScan(true);
  showQuickScore();
}

function cmdSession(action, sidArg) {
  var sid = sidArg || process.argv[4];
  var sessions=[];
  try {
    var files = fs.readdirSync(SESSION_DIR);
    for (var i=0;i<files.length;i++) {
      if (files[i].endsWith('.json')) {
        try { sessions.push(JSON.parse(fs.readFileSync(path.join(SESSION_DIR,files[i]),'utf8'))); } catch(e) {}
      }
    }
  } catch(e) {}
  if (action === 'list' || !action) {
    info('\n  Sessions (' + sessions.length + '):\n');
    if (sessions.length === 0) { info('  No sessions yet. Start one with: chode ai\n'); return; }
    for (var j=0;j<sessions.length;j++) {
      var s=sessions[j];
      info('  ' + s.id.padEnd(16) + ' msgs:' + String(s.messages?s.messages.length:0).padEnd(4) + ' provider:' + (s.lastProvider||'none').padEnd(12) + ' created:' + new Date(s.createdAt).toLocaleString() + '\n','dim');
    }
  } else if (action === 'show' && sid) {
    var sess = loadSession(sid);
    info('\n  Session: ' + sess.id + ' (' + sess.messages.length + ' messages)\n');
    for (var k=0;k<sess.messages.length;k++) {
      var m=sess.messages[k];
      var role=m.role==='user'?'you':'AI';
      info('  ['+role+'] '+m.content.slice(0,100)+(m.content.length>100?'...':'')+(m.provider?' ('+m.provider+')':'')+'\n','dim');
    }
  } else if (action === 'reset') {
    try { fs.unlinkSync(path.join(SESSION_DIR, 'default.json')); info('  Default session cleared.\n'); }
    catch(e) { info('  No default session to clear.\n'); }
    var allSessions = fs.readdirSync(SESSION_DIR).filter(function(f){return f.endsWith('.json');});
    for (var r=0;r<allSessions.length;r++) {
      try { fs.unlinkSync(path.join(SESSION_DIR, allSessions[r])); } catch(e) {}
    }
    ok('All sessions cleared (' + allSessions.length + ' removed)\n');
  }
}

async function cmdAuthSet(providerArg, keyArg) {
  var config = PROVIDERS[providerArg];
  if (!config || !config.requiresKey) {
    fail('  Unknown provider: ' + providerArg + '\n');
    info('  Keyed providers:\n');
    for (var pid in PROVIDERS) {
      if (PROVIDERS[pid].requiresKey) info('    ' + pid.padEnd(15) + PROVIDERS[pid].name + '\n', 'dim');
    }
    return;
  }
  var cfg = loadConfig();
  cfg.providers = cfg.providers || {};
  if (keyArg === '--remove' || keyArg === 'remove') {
    if (cfg.providers[providerArg] && cfg.providers[providerArg].key) {
      delete cfg.providers[providerArg].key;
      if (Object.keys(cfg.providers[providerArg]).length === 0) delete cfg.providers[providerArg];
      saveConfig(cfg);
      ok('  Removed saved key for ' + config.name + '\n');
    } else info('  No saved key for ' + config.name + ' — nothing to remove.\n');
    return;
  }
  if (!keyArg) { fail('  Usage: chode auth ' + providerArg + ' [your-key]  (or --remove)\n'); return; }
  // Validate BEFORE saving: invalid keys are refused, never stored.
  info('  Validating key with ' + config.name + '...\n');
  var check;
  try { check = await validateKey(providerArg, keyArg); }
  catch (e) { check = { valid: false, error: 'connection_failed' }; }
  if (!check.valid) { fail('  ' + getErrorMessage(check.error) + ' Key NOT saved.\n'); return; }
  cfg.providers[providerArg] = cfg.providers[providerArg] || {};
  cfg.providers[providerArg].key = keyArg;
  saveConfig(cfg);
  if (check.error === 'rate_limited') warn('  Key saved (provider is rate-limiting right now).\n');
  else ok('  Key saved for ' + config.name + '!\n');
}

async function cmdAuth(providerArg, keyArg) {
  info('\n  chode auth — Manage API keys\n');
  if (providerArg) return await cmdAuthSet(providerArg, keyArg);
  var providers = loadConfig().providers || {};
  if (Object.keys(providers).length === 0) {
    info('  No keys configured.\n');
    info('  Free-tier keys (no CC required):\n');
    for (var pid in PROVIDERS) {
      var p = PROVIDERS[pid];
      if (p.category === 'free_tier' && p.signupUrl) {
        info('    ' + p.name.padEnd(30) + p.freeTier + '\n    ' + '    ' + p.signupUrl + '\n','dim');
      }
    }
    info('\n  Set a key: chode auth groq [your-key-here]\n');
    info('  Or auto-provision: chode provision\n');
    return;
  }
  info('  Configured keys:\n');
  for (var pid in providers) {
    var p = providers[pid];
    var masked = p.key ? p.key.slice(0,4) + '...' + p.key.slice(-4) : '(none)';
    var icon = p.key ? '✓' : '○';
    say('  ' + icon + ' ' + pid + '\n', p.key ? 'green' : 'white');
    info('    Key: ' + masked + '\n','dim');
  }
  info('\n  Update: chode auth <provider> <new-key>\n');
  info('  Remove: chode auth <provider> --remove\n');
}

// ─── Key Validation ─────────────────────────────────────────────────────────────
async function validateKey(providerId, key) {
  var config = PROVIDERS[providerId];
  if (!config) return { valid: false, error: 'unknown_provider' };
  
  var endpoint = config.endpoints[0];
  var url = typeof endpoint.url === 'function' ? endpoint.url(key) : endpoint.url;
  var headers = endpoint.headers(key);
  var body = endpoint.body(key, [{role:'user',content:'test'}]);
  
  try {
    var resp = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
      signal: AbortSignal.timeout(5000)
    });
    
    var data = await resp.json().catch(() => ({}));
    
    if (resp.status === 200 && data.choices?.[0]) {
      return { valid: true, provider: providerId };
    }
    
    if (resp.status === 401) return { valid: false, error: 'invalid_key' };
    if (resp.status === 402 || resp.status === 403) return { valid: false, error: 'payment_required' };
    if (resp.status === 429) return { valid: true, error: 'rate_limited' };
    return { valid: false, error: 'http_' + resp.status };
  } catch (e) {
    return { valid: false, error: e.message.includes('timeout') ? 'timeout' : 'connection_failed' };
  }
}

function getErrorMessage(errorCode) {
  var messages = {
    'unknown_provider': 'Unknown provider',
    'invalid_key': 'Invalid API key. Check and try again.',
    'payment_required': 'Payment required — key or quota issue. Check billing/quota, then retry with a fresh key.',
    'rate_limited': 'Key valid but rate-limited. Try again later.',
    'timeout': 'Request timed out. Check your connection.',
    'connection_failed': 'Cannot connect to provider. Check internet.'
  };
  return messages[errorCode] || 'Unknown error: ' + errorCode;
}

async function cmdProvision(providerArg) {
  info('\n  chode provision — Auto-request free-tier API keys\n');
  // Get all free-tier providers that need keys
  var providers = [];
  var existing = loadConfig().providers || {};
  for (var pid in PROVIDERS) {
    var p = PROVIDERS[pid];
    if (p.category === 'free_tier' && p.requiresKey) {
      if (!existing[pid] || !existing[pid].key) {
        providers.push(pid);
      }
    }
  }
  if (providerArg && providers.indexOf(providerArg) === -1) { warn('Unknown provider: ' + providerArg); info('  Available: ' + providers.join(', ') + '\n'); return; }
  if (providerArg) providers = [providerArg];

  if (providers.length === 0) { ok('No keys to provision. All free-tier providers have keys.\n'); return; }

  info('  Requesting keys for: ' + providers.map(function(p){return PROVIDERS[p]?.name||p;}).join(', ') + '\n');
  info('  Note: HEMO mail may not be available from all environments.\n');
  info('  You will need to sign up at each provider and run: chode auth <provider> <key>\n\n');

  var sent = 0;
  for (var i=0;i<providers.length;i++) {
    var pid = providers[i];
    var config = PROVIDERS[pid];
    info('  ['+(i+1)+'/'+providers.length+'] ' + config.name + ':\n');
    info('    Signup: ' + (config.signupUrl||'N/A') + '\n');
    info('    Free tier: ' + (config.freeTier||'Check docs') + '\n\n');
    sent++;
  }

  info('  To activate, run for each provider:\n');
  for (var j=0;j<providers.length;j++) {
    info('    chode auth ' + providers[j] + ' [your-api-key]\n');
  }
  info('  Or use environment variables:\n');
  for (var k=0;k<providers.length;k++) {
    var cp = PROVIDERS[providers[k]];
    if (cp && cp.requiresKey) {
      info('    export ' + cp.requiresKey + '=[your-key]\n');
    }
  }
}

async function provisionViaHelio(providerId) {
  // Try HEMO mail to request a free-tier key
  // Note: HEMO mail may not be accessible from all environments
  var token = loadHeliosToken();
  if (!token) {
    info('    Creating HEMO agent identity...');
    token = await createHeliosAgent();
    if (!token) return null;
  }
  var config = PROVIDERS[providerId];
  if (!config) return null;
  info('\n    Sending key request for ' + config.name + ' to HEMO mail...\n');
  try {
    // Check if HEMO mail is reachable
    var dns = require('dns');
    await new Promise(function(resolve, reject) {
      dns.resolve('hemo-mail.oooooooooo.se', function(err) {
        if (err) reject(new Error('HEMO mail unreachable: ' + err.message));
        else resolve();
      });
    });
    var r = await fetch('https://hemo-mail.oooooooooo.se/api/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        to: 'keys@oooooooooo.se',
        subject: '[CHODE] Key request: ' + config.name,
        text: 'Provider: ' + config.name + ' (' + providerId + ')\n' +
              'Endpoint: ' + (typeof config.endpoints[0].url === 'function' ? 'see docs' : config.endpoints[0].url) + '\n' +
              'Free tier: ' + (config.freeTier||'check docs') + '\n' +
              'Signup: ' + (config.signupUrl||'') + '\n\n' +
              'Auto-provisioned by chode on ' + new Date().toISOString()
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) { var e2 = await r.text(); warn('HEMO mail send failed: ' + e2.slice(0,80)); return null; }
    return { ok: true };
  } catch (e) {
    warn('HEMO mail unavailable (' + e.message + '). Use manual signup:\n');
    var cfg = PROVIDERS[providerId];
    if (cfg && cfg.signupUrl) info('    ' + cfg.name + ' → ' + cfg.signupUrl + '\n');
    info('    Then run: chode auth ' + providerId + ' [your-key]\n');
    return null;
  }
}

function cmdNew(name, flags) {
  if (!name) { fail('  Usage: chode new <name> [--skill]\n'); return; }
  var slug = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) { fail('  Could not derive a project name from "' + name + '". Use letters, numbers, - or _.\n'); return; }
  if (flags.skill) return cmdNewSkill(slug);
  checkAndInstallDeps(ROOT);
  var featHtml = ['Production grade','HEMO integrated','Self-healing AI'].map(function(f){return '    <li style="padding:4px 0;color:#aab">• '+f+'</li>';}).join('\n');
  var htmlDoc = [
    '<!DOCTYPE html>',
    '<html lang="en"><head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width,initial-scale=1">',
    '  <title>'+slug+' — chode</title>',
    '  <meta name="description" content="'+slug+' — self-healing Cloudflare Worker">',
    '  <style>',
    '    :root{--g:#22dd55;--bg:#0a0a0a;--text:#dff0e2;--muted:#7fa88a;--fm:"IBM Plex Mono",monospace;}',
    '    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
    '    body{background:#000;color:var(--text);font-family:var(--fm);min-height:100vh;display:flex;align-items:center;justify-content:center}',
    '    .container{text-align:center;padding:40px}',
    '    h1{font-size:clamp(32px,5vw,64px);color:var(--g);margin-bottom:16px}',
    '    p{color:var(--muted);font-size:16px;line-height:1.6}',
    '    .badge{display:inline-block;background:rgba(34,221,85,.1);border:1px solid rgba(34,221,85,.3);border-radius:20px;padding:6px 16px;font-size:12px;color:var(--g);margin-top:20px}',
    '  </style>',
    '</head><body>',
    '<div class="container">',
    '  <h1>'+slug+'</h1>',
    '  <p>Scaffolded by chode — self-healing AI harness</p>',
    '  <div class="badge">Powered by chode · '+new Date().getFullYear()+'</div>',
    '</div></body></html>'
  ].join('\n');
  var escaped = htmlDoc.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$/g,'\\$');
  var lines = [
    'const PAGE = `' + escaped + '`;',
    '',
    'export default {',
    '  async fetch(request, env) {',
    "    const url = new URL(request.url);",
    "    if (url.pathname === '/' || url.pathname === '/index.html') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } });",
    "    if (url.pathname === '/api/status') return new Response(JSON.stringify({ ok: true, service: '" + slug + "', ts: Date.now() }), { headers: { 'content-type': 'application/json' } });",
    "    return new Response('Not found', { status: 404 });",
    '  },',
    '};'
  ].join('\n');
  write(slug+'/worker.js', lines);
  write(slug+'/wrangler.toml', ['name = "'+slug+'"','main = "worker.js"','compatibility_date = "2024-09-23"','','[vars]','SERVICE_NAME = "'+slug+'"',''].join('\n'));
  write(slug+'/package.json', '{\n  "name": "'+slug+'",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "npx wrangler dev",\n    "deploy": "npx wrangler deploy"\n  }\n}\n');
  ok('Scaffolded '+slug+'/');
  info('  worker.js      — self-healing AI worker\n');
  info('  Next: cd '+slug+' && npx wrangler dev\n');
}

function cmdNewSkill(slug) {
  var md = ['---','name: '+slug,'type: technique','description: >','  '+slug.replace(/-/g,' ')+' — HEMO skill.','---','',
    '# '+slug,'',slug.replace(/-/g,' ')+' is a HEMO economy skill.',
    '','## Usage','','```','chode skills install '+slug,'```','',
    '## Conventions','- Follow the HEMO doctrine','- Rate-limit aware'].join('\n');
  write('skills/'+slug+'/SKILL.md', md);
  ok('Scaffolded skill: '+slug);
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function checkAndInstallDeps(dir) {
  for (var name in GLOBAL_DEPS) {
    var dep = GLOBAL_DEPS[name];
    var ok = false, via = '';
    if (dep.check) { try { var r = dep.check(); ok = !!r; via = (typeof r === 'string' && r !== 'bin') ? ' (via ' + r + ')' : ''; } catch (e) { ok = false; } }
    else if (dep.cmd) { try { execSync(dep.cmd, {stdio:'pipe'}); ok = true; } catch (e) { ok = false; } }
    if (!ok && dep.required) fail('Missing: ' + dep.name + ' — run `chode deps install` (or just use `npx ' + name + '`, it auto-downloads)');
    else if (ok && via) info('  Found ' + dep.name + via + '\n');
  }
}

async function cmdQuickKey(providerId) {
  var config = PROVIDERS[providerId];
  if (!config) {
    fail('Unknown provider: ' + providerId);
    info('\n  Available providers:');
    for (var pid in PROVIDERS) {
      var p = PROVIDERS[pid];
      if (p.requiresKey) info('    ' + pid.padEnd(15) + p.name + ' → ' + p.signupUrl);
    }
    return;
  }
  info('\n  ' + config.name + '\n');
  info('  Free tier: ' + (config.freeTier||'Check docs') + '\n');
  info('  Signup: ' + (config.signupUrl||'N/A') + '\n');
  info('  Command to save key:\n');
  info('    chode auth ' + providerId + ' [your-api-key]\n\n');
  info('  Or set environment variable:\n');
  info('    export ' + (config.requiresKey||providerId.toUpperCase() + '_API_KEY') + '=[your-key]\n');
}

async function cmdUpdate() {
  info('\n  chode update — Checking for updates...\n');
  try {
    var latest = execSync('npm view chode version',{encoding:'utf8'}).trim().replace(/['"]/g,'');
    var current = JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8')).version||'0.0.0';
    if (compareVer(current, latest) >= 0) { ok('chode is up to date (' + current + ')'); }
    else { warn('Update available: ' + current + ' → ' + latest); info('  Run: npm update -g chode\n'); }
  } catch(e) { warn('Update check failed (' + String((e.message||e)).split('\n')[0].slice(0,120) + '). Check network or run: npm view chode version'); }
}

function cmdInit() {
  info('\n  chode init — One-time setup\n');
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  fs.mkdirSync(MONITOR_DIR, { recursive: true });
  var cfg = loadConfig();
  if (!cfg.heliosToken) {
    info('  Creating HEMO agent identity...\n');
    createHeliosAgent().then(function(token) {
      if (token) ok('HEMO agent ready');
      else info('  HEMO agent creation skipped (run manually if needed)\n');
      nextStep();
    });
  } else { nextStep(); }
  function nextStep() {
    info('\n  Setup complete. Next steps:\n');
    info('    chode scan          Discover working free-tier providers\n');
    info('    chode provision     Auto-request free API keys via HEMO mail\n');
    info('    chode ai            Start AI session with auto-routing\n');
    info('    chode status        Full health dashboard\n');
  }
}

async function createHeliosAgent() {
  var existing = loadHeliosToken();
  if (existing) return existing;
  info('  Creating HEMO agent identity via HELIOS...');
  var username = 'chode-' + Date.now().toString(36).slice(-6);
  try {
    var r = await fetch('https://ai.oooooooooo.se/api/v1/accounts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username }), signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) { var e = await r.text(); fail('HELIOS create failed: ' + e.slice(0,100)); return null; }
    var d = await r.json();
    if (d.token) { saveHeliosToken(d.token); ok('HEMO agent created: ' + username); return d.token; }
    fail('HELIOS response missing token'); return null;
  } catch (e) { fail('HELIOS unreachable: ' + e.message); return null; }
}

function loadHeliosToken() { var cfg = loadConfig(); return cfg.heliosToken; }
function saveHeliosToken(token) { var cfg = loadConfig(); cfg.heliosToken = token; saveConfig(cfg); }

function showQuickScore() {
  var lb = loadLeaderboard();
  if (!lb.ranked||lb.ranked.length===0) { info('  ○ No scan data yet. Run `chode scan`.'); return; }
  var top = lb.ranked[0];
  var icon = top.score >= 70 ? '✓' : (top.score >= 40 ? '○' : 'x');
  info('  ' + icon + ' Top: ' + top.name + ' (score ' + top.score + ', ' + top.reliability + '% reliable)\n');
}

async function cmdMonitor() {
  info('\n  chode monitor — Background health monitor\n');
  info('  Starting monitor (Ctrl+C to stop)...\n');
  startHealthMonitor();
  
  // Keep process alive
  process.on('SIGINT', function() {
    stopHealthMonitor();
    info('\n  Monitor stopped.\n');
    process.exit(0);
  });
  
  info('  Monitor running. Metrics: .chode/monitor/metrics.json\n');
  info('  Commands: chode costs | chode metrics | chode queue\n');
  
  // Keep alive
  await new Promise(function() {});
}

async function cmdCosts() {
  var report = getCostReport();
  info('\n  Cost Report — ' + report.day + '\n');
  info('  Total: $' + report.totalCost + '\n');
  if (Object.keys(report.providers).length === 0) {
    info('  No costs tracked yet.\n');
    return;
  }
  info('\n  By Provider:\n');
  for (var pid in report.providers) {
    var p = report.providers[pid];
    info('    ' + pid.padEnd(15) + p.requests + ' reqs  ' + p.tokens + ' tokens  $' + p.cost.toFixed(4) + '\n');
  }
}

async function cmdMetrics() {
  var metrics = exportMetrics();
  info('\n  Metrics Export\n');
  info('  Uptime: ' + Math.round(process.uptime()) + 's\n');
  info('  Queue: ' + metrics.queueSize + ' pending\n');
  info('  Costs: $' + (metrics.costs.totalCost || '0') + '\n');
  info('\n  Provider Health:\n');
  for (var i = 0; i < metrics.providers.length; i++) {
    var p = metrics.providers[i];
    var icon = p.circuitState === 'open' ? '✗' : (p.errors > 0 ? '○' : '✓');
    info('    ' + icon + ' ' + p.id.padEnd(15) + p.requests + 'req  ' + p.tokens + 'tok  ' + p.errors + 'err  [' + p.circuitState + ']\n');
  }
  info('\n  Full metrics: .chode/monitor/metrics.json\n');
}

async function cmdQueue() {
  var q = loadQueue();
  info('\n  Request Queue\n');
  info('  Pending: ' + q.requests.length + '/' + QUEUE_MAX_SIZE + '\n');
  if (q.requests.length === 0) {
    info('  Queue empty.\n');
    return;
  }
  info('\n  Recent requests:\n');
  for (var i = Math.max(0, q.requests.length - 5); i < q.requests.length; i++) {
    var r = q.requests[i];
    info('    [' + i + '] ' + r.prompt.slice(0, 50) + '...\n');
  }
}

function cmdDeps(action, projectArg) {
  action = action || 'check';
  info('\n  chode deps — ' + action + '\n');
  var missing = [];
  for (var name in GLOBAL_DEPS) {
    var dep = GLOBAL_DEPS[name];
    var depOk = false, status = 'not found';
    if (dep.check) { depOk = dep.check(); status = depOk ? 'ok' : 'MISSING'; }
    else if (dep.cmd) { try { execSync(dep.cmd, {stdio:'pipe'}); depOk = true; status = 'ok'; } catch(e) { status = 'MISSING'; } }
    if (!depOk && dep.required) missing.push(name);
    var icon = depOk ? '✓' : '✗';
    say('  ' + icon + ' ' + dep.name, ok?'green':'red');
    info('  ' + status + '\n','dim');
  }
  if (action === 'install' || action === 'fix') {
    info('\n  Installing missing dependencies...\n');
    missing.forEach(function(n) { info('  Installing ' + GLOBAL_DEPS[n].name + '...'); try { run('npm install -g ' + GLOBAL_DEPS[n].npm); ok(GLOBAL_DEPS[n].name + ' installed'); } catch(e) { warn(e.message.split('\n')[0]); } });
  }
  if (missing.length === 0) ok('All dependencies healthy\n');
  else info('\n  Commands: chode deps install | update\n');
}

function cmdHelp() {
  info(`
  chode — The Self-Healing Coding Harness
  Free tiers. HEMO auto-provisioning. Zero lock-in.

  AI (routes to best free-tier provider, NEVER STOPS):
    chode ai "prompt"             One-shot with parallel fallback
    chode ai --resume             Resume interrupted session
    chode ai --force <provider>   Force specific provider
    chode ai @file "prompt"        Include file contents as context
    chode project "<spec>"        Multi-step project orchestration
    chode project --resume <id>   Resume interrupted project

  Health & Discovery:
    chode status                  Full health dashboard
    chode scan                    Probe ALL providers, build leaderboard
    chode score                   Show current rankings
    chode heal                    Force full re-scan (clear circuit breakers)
    chode research                Re-probe keyless endpoints, grow overlay

  Security:
    chode audit [path]            Scan code for secrets & dangerous patterns
    chode audit [path] --no-ai    Skip AI review (deterministic report only)

  Keys & Provisioning:
    chode auth                    View/set API keys
    chode provision               Auto-request free-tier keys via HEMO mail
    chode quickkey <provider>     Show signup link and instructions
    chode models                  List all registered providers

  Project Management:
    chode new <name>              Scaffold a Cloudflare Worker
    chode new <name> --skill      Scaffold a HEMO skill
    chode deps [check|install]    Dependency management
    chode session [list|show|reset] Manage sessions
    chode agents [list|add|run]   Spawn subagents on remote/local machines
    chode skills [list|install]   List or verify local skills
    chode skills web              Curated no-signup browser tools

  Other:
    chode monitor                 Background health monitor (every 30s)
    chode costs                   Show cost tracking report
    chode metrics                 Export system metrics
    chode queue                   Show request queue status
    chode nosignups               No-signup AI tools & prompt engineering
    chode util <subcommand>       Offline helpers: b64, hash, uuid, jwt, json, url, tokens, mermaid
    chode tool <grep|glob|read|edit> Minimal local tools (edit asks, secrets denied)
    chode update                  Check for chode updates
    chode init                    One-time setup
  `);
}

// ─── Entry ─────────────────────────────────────────────────────────────────────

process.title = 'chode';

function cmdSkills(action, slug) {
  var dir = path.join(ROOT, 'skills');
  var found = [];
  try {
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isDirectory()) continue;
      var name = entries[i].name;
      var meta = { slug: name, installed: false };
      try {
        var txt = fs.readFileSync(path.join(dir, name, 'SKILL.md'), 'utf8');
        var m = txt.match(/^name:\s*(.+)$/m);
        meta.installed = true;
        meta.name = m ? m[1].trim() : name;
      } catch (e) { meta.error = 'missing SKILL.md'; }
      found.push(meta);
    }
  } catch (e) {}
  if ((!action || action === 'list') && !slug) {
    info('\n  Skills (' + found.length + '):\n');
    if (found.length === 0) { info('  None yet. Scaffold one with: chode new <name> --skill\n'); return; }
    found.forEach(function (s) {
      say('  ' + (s.installed ? '✓' : 'x') + ' ' + s.slug.padEnd(20), s.installed ? 'green' : 'white');
      info('  ' + (s.installed ? (s.name || s.slug) : (s.error || 'broken')) + '\n', 'dim');
    });
    return;
  }
  var target = slug || action;
  if (action === 'install' || (!slug && action)) {
    var f = path.join(dir, target, 'SKILL.md');
    if (fs.existsSync(f)) { ok('  Skill ready: ' + target + '\n'); info('  Reference it in prompts as skills/' + target + '/SKILL.md\n'); }
    else fail('  No such skill: ' + target + '. Scaffold with: chode new ' + target + ' --skill\n');
    return;
  }
  if (action === 'web') {
    info('\n  Curated browser skills (no signup, open in your browser — nothing automated):\n');
    var groups = [
      ['Image / OCR-adjacent', [['Squoosh', 'https://squoosh.app/'], ['ClearCanvas AI', 'https://clearcanvasai.vercel.app/'], ['Stirling-PDF', 'https://stirling.com/app'], ['BentoPDF', 'https://www.bentopdf.com/']]],
      ['Dev', [['Hoppscotch', 'https://hoppscotch.io/'], ['CyberChef', 'https://gchq.github.io/CyberChef/'], ['JSON Crack', 'https://jsoncrack.com/'], ['HappyFormatter', 'https://happyformatter.com/'], ['HappyTokenizer', 'https://happytokenizer.com/'], ['SQLChef', 'https://jonathanwalker.github.io/SQLChef/'], ['GitReverse', 'https://www.gitreverse.com/']]],
      ['Diagrams', [['Mermaid Live', 'https://mermaid.live'], ['Kroki', 'https://kroki.io'], ['Excalidraw', 'https://excalidraw.com'], ['draw.io', 'https://app.diagrams.net'], ['Markmap', 'https://markmap.js.org']]],
      ['Local / browser LLM', [['WebLLM', 'https://webllm.mlc.ai/'], ['Forge', 'https://modelplayground.dev']]],
      ['Transfer', [['PairDrop', 'https://pairdrop.net/'], ['LocalSend-Web', 'https://web.localsend.org/']]]
    ];
    groups.forEach(function (g) {
      info('\n  ' + g[0] + ':\n');
      g[1].forEach(function (t) { info('    ' + t[0].padEnd(16) + t[1] + '\n', 'dim'); });
    });
    info('\n  Agent guidance: prefer `chode util` for deterministic transforms; emit Mermaid then `chode util mermaid render`; heavy OCR/PDF goes to Stirling/Bento/Squoosh; WebLLM only when all network providers fail.\n');
    return;
  }
  info('  Usage: chode skills [list|install <name>]\n');
}

var args = process.argv.slice(2);
var cmd = args[0];
var flags = {};
for(var i=0;i<args.length;i++){if(args[i].indexOf('--')===0){var parts=args[i].slice(2).split('=');flags[parts[0]]=parts[1]!==undefined?parts[1]:true;}}

var dispatch = {
  init:       cmdInit,
  new:        function(){cmdNew(args[1],flags);},
   scan:       function(){(async function(){await cmdScan();})();},
   research:   function(){(async function(){await cmdResearch();})();},
  audit:      function(){(async function(){await cmdAudit(args[1],flags);})();},
  score:      cmdScore,
  ai:         function(){(async function(){await cmdAI(args.slice(1));})();},
  project:    function(){(async function(){var a=args.slice(1);if(a[0]==='--resume'&&a[1])await cmdProjectResume(a[1]);else await cmdProject(a.join(' '));})();},
  heal:       function(){(async function(){await cmdHeal();})();},
  session:    function(){cmdSession(args[1],args[2]);},
  auth:       function(){(async function(){await cmdAuth(args[1],args[2]);})();},
  provision:  function(){(async function(){await cmdProvision(args[1]);})();},
  models:     cmdModels,
  status:     cmdStatus,
  deps:       function(){cmdDeps(args[1],args[2]);},
  update:     cmdUpdate,
  help:       cmdHelp,
  agents:     function(){cmdAgents(args[1]);},
  quickkey:   function(){cmdQuickKey(args[1]);},
  monitor:    function(){(async function(){await cmdMonitor();})();},
  costs:      function(){(async function(){await cmdCosts();})();},
  metrics:    function(){(async function(){await cmdMetrics();})();},
  queue:      function(){(async function(){await cmdQueue();})();},
  skills:     function(){cmdSkills(args[1],args[2]);},
  nosignups:  function(){const ns=require('./nosignups.js');ns.cmdNoSignups(args[1]);},
  util:       function(){(async function(){await cmdUtil(args.slice(1));})();},
  tool:       function(){cmdTool(args.slice(1));},
};

if (require.main === module) {
if(dispatch[cmd]){dispatch[cmd]();}
else if(cmd){fail('Unknown command: '+cmd);info('  Run `chode help` for usage.');process.exit(1);}
else{(async function(){
  // Startup: greet, then check for keys
  console.log('\n  I\'m chode\n');
  
  // Start health monitor in background
  startHealthMonitor();
  
  var hasKeys = hasAnyProviderKey();
  if (!hasKeys) {
    info('  No API keys found. Let\'s get you one.\n');
    info('  Pick your path:\n');
    info('    1  Sign up for Groq (fastest, 30 seconds, no credit card)\n');
    info('    2  Sign up for Google Gemini (free, 1,500 requests/day)\n');
    info('    3  Sign up for DeepSeek (generous free tier, no CC)\n');
    info('    4  Use local Ollama (no key, runs on this machine)\n');
    info('    5  Skip setup, try anyway\n\n');
    info('  Your choice? (1/2/3/4/5) ');
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', async function(chunk) {
      var choice = chunk.toString().trim();
      if (choice === '1') {
        info('  Opening Groq signup: https://console.groq.com/keys\n');
        info('  After signing up, paste your key:\n');
        process.stdin.once('data', async function(keyChunk) {
          var key = keyChunk.toString().trim();
          if (key) {
            var cfg = loadConfig();
            cfg.providers = cfg.providers || {};
            cfg.providers.groq = { key: key };
            saveConfig(cfg);
            ok('Key saved! Starting AI session...\n');
            await cmdAI([]);
          } else {
            fail('No key provided. Run `chode auth groq [key]` to set it.\n');
            process.exit(0);
          }
        });
      } else if (choice === '2') {
        info('  Opening Google AI Studio: https://aistudio.google.com/app/apikey\n');
        info('  After signing up, paste your key:\n');
        process.stdin.once('data', async function(keyChunk) {
          var key = keyChunk.toString().trim();
          if (key) {
            var cfg = loadConfig();
            cfg.providers = cfg.providers || {};
            cfg.providers.google = { key: key };
            saveConfig(cfg);
            ok('Key saved! Starting AI session...\n');
            await cmdAI([]);
          } else {
            fail('No key provided. Run `chode auth google [key]` to set it.\n');
            process.exit(0);
          }
        });
      } else if (choice === '3') {
        info('  Opening DeepSeek signup: https://platform.deepseek.com/\n');
        info('  After signing up, paste your key:\n');
        process.stdin.once('data', async function(keyChunk) {
          var key = keyChunk.toString().trim();
          if (key) {
            var cfg = loadConfig();
            cfg.providers = cfg.providers || {};
            cfg.providers.deepseek = { key: key };
            saveConfig(cfg);
            ok('Key saved! Starting AI session...\n');
            await cmdAI([]);
          } else {
            fail('No key provided. Run `chode auth deepseek [key]` to set it.\n');
            process.exit(0);
          }
        });
      } else if (choice === '4') {
        info('  Local Ollama is tried first whenever it is running (install: winget install Ollama.Ollama).\n');
        info('  For better results, run: chode provision\n\n');
        await cmdAI([]);
      } else if (choice === '5') {
        info('  Starting without keys. Some providers won\'t work.\n');
        info('  To fix: chode auth groq [your-key]\n\n');
        await cmdAI([]);
      }
    });
  } else {
    await cmdAI([]);
  }
  info('\n  Monitor running. Commands: chode metrics | chode costs | chode queue\n');
})();}
} // end require.main guard (require-safe for unit tests)

function __resetBoundedForTest() {
  authFailedProviders = {};
  doomHistory = [];
  for (var k in circuitBreakers) delete circuitBreakers[k];
  for (var k2 in rateLimits) delete rateLimits[k2];
  if (__testHooks) __testHooks.trySingle = null;
}
try {
  module.exports = {
    PROVIDERS: PROVIDERS, TOOLS: TOOLS, TOOL_PERMISSIONS: TOOL_PERMISSIONS,
    callWithBestProvider: callWithBestProvider, trySingleProvider: trySingleProvider, retry: retry,
    loadLeaderboard: loadLeaderboard, saveLeaderboard: saveLeaderboard,
    loadCheckpoint: loadCheckpoint, saveCheckpoint: saveCheckpoint, checkpointFileFor: checkpointFileFor, listCheckpoints: listCheckpoints,
    doomCheck: doomCheck, isSecretPath: isSecretPath, isAuthFailed: isAuthFailed, markAuthFailed: markAuthFailed,
    toolExec: toolExec, toolPermit: toolPermit,
    __testHooks: __testHooks, __resetBoundedForTest: __resetBoundedForTest
  };
} catch (e) {}

function hasAnyProviderKey() {
  var cfg = loadConfig();
  var providers = cfg.providers || {};
  for (var pid in providers) {
    if (providers[pid].key && providers[pid].key.length > 5) return true;
  }
  return false;
}

// ─── Subagent System ───────────────────────────────────────────────────────────
// chode can spawn subagents on remote servers or local machines

function loadAgents() {
  try { return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8')); }
  catch { return { agents: [], tasks: [] }; }
}
function saveAgents(agents) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), 'utf8');
}

function spawnAgent(agentId, task) {
  var agents = loadAgents();
  var agent = agents.agents.find(function(a) { return a.id === agentId; });
  if (!agent) throw new Error('Unknown agent: ' + agentId);
  
  var taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  var taskRecord = {
    id: taskId,
    agentId: agentId,
    task: task,
    status: 'pending',
    created: new Date().toISOString(),
    result: null,
    error: null
  };
  
  fs.mkdirSync(TASKS_DIR, { recursive: true });
  fs.writeFileSync(path.join(TASKS_DIR, taskId + '.json'), JSON.stringify(taskRecord, null, 2));
  
  if (agent.type === 'local') {
    dispatchLocalAgent(agent, task, taskId);
  } else if (agent.type === 'ssh') {
    dispatchSSHAgent(agent, task, taskId);
  } else if (agent.type === 'http') {
    dispatchHTTPAgent(agent, task, taskId);
  }
  
  return taskRecord;
}

function dispatchLocalAgent(agent, task, taskId) {
  var cmd = agent.command || 'node';
  var args = agent.args || [];
  var env = Object.assign({}, process.env, agent.env || {});
  
  var child = spawn(cmd, args.concat([taskId, task]), {
    cwd: agent.cwd || ROOT,
    env: env,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  var output = '';
  var error = '';
  
  child.stdout.on('data', function(data) { output += data.toString(); });
  child.stderr.on('data', function(data) { error += data.toString(); });
  
  child.on('close', function(code) {
    var result = { taskId: taskId, exitCode: code, output: output, error: error, completed: new Date().toISOString() };
    var taskFile = path.join(TASKS_DIR, taskId + '.json');
    try {
      var task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
      task.status = code === 0 ? 'completed' : 'failed';
      task.result = result;
      fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
    } catch(e) {}
  });
}

function dispatchSSHAgent(agent, task, taskId) {
  var sshCmd = 'ssh';
  var sshArgs = [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ConnectTimeout=10',
    agent.host,
    agent.command || 'bash',
    '-c', 'cd ' + agent.remoteDir + ' && node ' + agent.scriptPath + ' ' + taskId + ' "' + task.replace(/"/g, '\\"') + '"'
  ];
  
  try {
    var result = execSync(sshCmd + ' ' + sshArgs.join(' '), { encoding: 'utf8', timeout: 60000 });
    var taskFile = path.join(TASKS_DIR, taskId + '.json');
    var task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    task.status = 'completed';
    task.result = { output: result, completed: new Date().toISOString() };
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
  } catch(e) {
    var taskFile = path.join(TASKS_DIR, taskId + '.json');
    var task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    task.status = 'failed';
    task.error = e.message;
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
  }
}

function dispatchHTTPAgent(agent, task, taskId) {
  var url = 'http://' + agent.host + ':' + (agent.port || 3000) + '/task';
  var body = JSON.stringify({ taskId: taskId, task: task, timestamp: Date.now() });
  
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (agent.token || '') },
    body: body,
    signal: AbortSignal.timeout(30000)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    var taskFile = path.join(TASKS_DIR, taskId + '.json');
    var task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    task.status = data.status || 'completed';
    task.result = data;
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
  })
  .catch(function(e) {
    var taskFile = path.join(TASKS_DIR, taskId + '.json');
    var task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    task.status = 'failed';
    task.error = e.message;
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
  });
}

async function cmdAgents(subcmd) {
  var agents = loadAgents();
  
  if (subcmd === 'list' || !subcmd) {
    info('\n  Registered Agents:\n');
    if (agents.agents.length === 0) {
      info('  No agents registered.\n');
      info('  Add one: chode agents add <id> --type local --command node\n');
      return;
    }
    for (var i = 0; i < agents.agents.length; i++) {
      var a = agents.agents[i];
      var icon = a.enabled !== false ? '✓' : '○';
      var type = a.type === 'ssh' ? 'SSH' : (a.type === 'http' ? 'HTTP' : 'LOCAL');
      say('  ' + icon + ' ' + a.id.padEnd(12), a.enabled !== false ? 'green' : 'white');
      info('  [' + type + '] ' + (a.host || 'localhost') + (a.command ? ' → ' + a.command : ''), 'dim');
    }
    info('\n  Commands: chode agents add | remove | run | status\n');
  }
  else if (subcmd === 'add') {
    var id = args[2]; // 'linux-server' is at args[2] since args[0]='agents', args[1]='add'
    var type = 'local';
    var command = 'node';
    var host = null;
    var token = null;
    
    for (var j = 3; j < args.length; j++) {
      if (args[j] === '--type' && args[j+1]) { type = args[++j]; }
      else if (args[j] === '--command' && args[j+1]) { command = args[++j]; }
      else if (args[j] === '--host' && args[j+1]) { host = args[++j]; }
      else if (args[j] === '--token' && args[j+1]) { token = args[++j]; }
    }
    
    agents.agents.push({
      id: id,
      type: type,
      command: command,
      host: host,
      token: token,
      enabled: true,
      created: new Date().toISOString()
    });
    saveAgents(agents);
    ok('Agent added: ' + id + ' (' + type + ')');
  }
  else if (subcmd === 'remove') {
    var id = args[2];
    agents.agents = agents.agents.filter(function(a) { return a.id !== id; });
    saveAgents(agents);
    ok('Agent removed: ' + id);
  }
  else if (subcmd === 'run') {
    var agentId = args[2];
    var taskText = args.slice(3).join(' ');
    if (!taskText) { fail('Usage: chode agents run <agent-id> "task description"'); return; }
    
    info('\n  Dispatching task to ' + agentId + '...\n');
    try {
      var result = spawnAgent(agentId, taskText);
      ok('Task dispatched: ' + result.id);
      info('  Status: chode agents status ' + result.id + '\n');
    } catch(e) {
      fail(e.message);
    }
  }
  else if (subcmd === 'status') {
    var taskId = args[2];
    if (!taskId) {
      info('\n  Recent Tasks:\n');
      // Derive from task files: completion handlers update the files, so the
      // files (not the registry array) are the truth. Newest first, cap 20.
      var tasks = [];
      try {
        var tf = fs.readdirSync(TASKS_DIR).filter(function(f){return f.indexOf('task_')===0 && f.endsWith('.json');});
        tf.sort().reverse();
        tasks = tf.slice(0, 20).map(function(f){ try { return JSON.parse(fs.readFileSync(path.join(TASKS_DIR,f),'utf8')); } catch(e) { return null; } }).filter(Boolean);
      } catch (e) {}
      if (tasks.length === 0) { info('  No tasks yet.\n'); return; }
      for (var k = 0; k < tasks.length; k++) {
        var t = tasks[k];
        var statusIcon = t.status === 'completed' ? '✓' : (t.status === 'failed' ? '✗' : '○');
        say('  ' + statusIcon + ' ' + t.id.slice(-8), t.status === 'completed' ? 'green' : (t.status === 'failed' ? 'red' : 'white'));
        info('  ' + t.agentId + ' - ' + t.task.slice(0, 40) + '...', 'dim');
      }
    } else {
      var taskFile = path.join(TASKS_DIR, taskId + '.json');
      try {
        var task = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
        info('\n  Task: ' + task.id + '\n');
        info('  Agent: ' + task.agentId + '\n');
        info('  Task: ' + task.task + '\n');
        info('  Status: ' + task.status + '\n');
        if (task.result) info('  Result: ' + (task.result.output || '').slice(0, 200) + '\n');
        if (task.result && task.result.error) info('  Stderr: ' + String(task.result.error).slice(0, 300) + '\n');
        if (task.error) info('  Error: ' + task.error + '\n');
      } catch(e) {
        fail('Task not found: ' + taskId);
      }
    }
  }
}
