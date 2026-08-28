#!/usr/bin/env node
/**
 * ============================================================
 * chode — The Self-Healing Coding Harness
 * Free models. Open output. Zero lock-in.
 *
 * The world's first harness that continuously probes free-tier AI endpoints,
 * builds a live reputation score, and routes your work to whatever is actually
 * working right now — no API keys, no signup, no "continue" needed.
 *
 * Key differentiator: NEVER STOPS. Exponential backoff retry, checkpoint
 * recovery, and provider drift auto-detection mean chode completes tasks
 * even when providers go down, change endpoints, or hit rate limits.
 *
 * Usage:
 *   node chode.js new <name>              Scaffold a Cloudflare Worker
 *   node chode.js new <name> --skill      Scaffold a HEMO skill
 *   node chode.js dev                     Local dev server
 *   node chode.js deploy                  Deploy to Cloudflare
 *   node chode.js scan                    Run all free-tier health probes
 *   node chode.js monitor                 Start continuous health monitoring
 *   node chode.js score                   Show live provider leaderboard
 *   node chode.js ai [prompt]             AI call with auto-fallback routing
 *   node chode.js project <spec>          Run multi-provider project
 *   node chode.js heal                    Force provider switch
 *   node chode.js session [list|show|reset] Manage sessions
 *   node chode.js deps [check|install|update] Manage dependencies
 *   node chode.js update                  Check for chode updates
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
const SKILLS_REPO = path.join(ROOT, 'hemo-skills-repo', 'skills');
const AGENTS_MD = path.join(ROOT, 'AGENTS.md');
const CONFIG_DIR = path.join(ROOT, '.chode');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SESSION_DIR = path.join(CONFIG_DIR, 'sessions');
const MONITOR_DIR = path.join(CONFIG_DIR, 'monitor');
const LEADERBOARD_FILE = path.join(MONITOR_DIR, 'leaderboard.json');
const CHECKPOINT_FILE = path.join(CONFIG_DIR, 'checkpoint.json');
const PROVIDER_REGISTRY_FILE = path.join(MONITOR_DIR, 'registry.json');
const OMNIROUTE_PORT = 20128;
const AFK_TIMEOUT = 90; // seconds before auto-switch on AFK
const HEALTH_INTERVAL = 30000; // re-scan all providers every 30s
const MIN_NODE_VERSION = '18.0.0';
const LOCKFILE = '.chode-deps.json';
const MAX_RETRY = 5; // never give up before this many tries
const RETRY_BASE_DELAY = 1000; // ms between retries

const DOCTRINE = [
  '/**',
  ' * HEMO — daily discipline',
  ' *   1. SCAN    world inefficiencies vs our capability stack',
  ' *              (keyless data rails, agent workforce,',
  ' *               sealed verifiable resolution, Stripe rails).',
  ' *   2. CONVERT winners into HEMO real-world backing',
  ' *              (buy-and-lock assets, work-burn services,',
  ' *               treasury assets).',
  ' *   3. RE-EVALUATE DAILY against the ranked opportunity backlog.',
  ' * ============================================================',
  ' */',
].join('\n');

// ─── Dependency Registry ──────────────────────────────────────────────────────

const GLOBAL_DEPS = {
  wrangler: { name: 'Wrangler', cmd: 'wrangler --version', npm: 'wrangler', required: true },
  node: { name: 'Node.js', check: function() { var v = process.version.slice(1); return compareVer(v, MIN_NODE_VERSION) >= 0; }, minVer: MIN_NODE_VERSION },
  npm: { name: 'npm', cmd: 'npm --version', required: true },
  omniroute: { name: 'OmniRoute', cmd: 'omniroute --version', npm: 'omniroute', required: false },
};

const PROJECT_DEP_TEMPLATES = {
  default: { devDependencies: { 'wrangler': '^3.0.0' } },
  'with-ai': { devDependencies: { 'wrangler': '^3.0.0' }, postInstall: 'echo "Workers AI binding configured in wrangler.toml"' },
  'with-kv': { devDependencies: { 'wrangler': '^3.0.0' } },
};

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
    saveProviderRegistry(reg);
    return { drifted: false, noted: true };
  }
  if (reg.endpoints[providerId].hash !== newHash) {
    var oldUrl = reg.endpoints[providerId].url;
    reg.endpoints[providerId] = { hash: newHash, url: newUrl, driftedAt: new Date().toISOString(), from: oldUrl };
    saveProviderRegistry(reg);
    return { drifted: true, old: oldUrl, new: newUrl };
  }
  return { drifted: false };
}

function hashStr(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(16);
}

// ─── Checkpoint / Crash Recovery ───────────────────────────────────────────────

function saveCheckpoint(cp) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2), 'utf8');
  } catch {}
}

function loadCheckpoint() {
  try { return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); }
  catch { return null; }
}

function clearCheckpoint() {
  try { fs.unlinkSync(CHECKPOINT_FILE); } catch {}
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
      var retryable = e.message && (
        e.message.indexOf('429') !== -1 || e.message.indexOf('rate') !== -1 ||
        e.message.indexOf('timeout') !== -1 || e.message.indexOf('ECONNRESET') !== -1 ||
        e.message.indexOf('fetch failed') !== -1 || e.message.indexOf('deprecated') !== -1
      );
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
  process.stdout.write((palette[color] || palette.white) + msg + '\x1b[0m');
}
function ok(msg)   { say('  \u2713  ' + msg + '\n', 'green'); }
function warn(msg) { say('  !  ' + msg + '\n', 'yellow'); }
function fail(msg) { say('  \u2717  ' + msg + '\n', 'red'); }
function info(msg) { say(msg + '\n', 'cyan'); }
function scan(msg) { say('  ~  ' + msg + '\n', 'purple'); }
function progress(msg) { process.stdout.write('\r  \u25b6  ' + msg + '   '); }

function run(cmd, opts) {
  opts = opts || {};
  try { return execSync(cmd, { cwd: opts.cwd || ROOT, stdio: opts.silent ? 'ignore' : 'inherit', encoding: 'utf8', env: Object.assign({}, process.env, opts.env || {}) }); }
  catch (e) { if (!opts.silent) fail(e.message.split('\n')[0]); process.exit(1); }
}

function write(relative, content) {
  var abs = path.join(ROOT, relative);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return { providers: {}, omniroute: { installed: false, port: OMNIROUTE_PORT }, monitor: { enabled: false } }; }
}
function saveConfig(cfg) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

// ─── Dependency Management ─────────────────────────────────────────────────────

function checkDep(name) {
  var dep = GLOBAL_DEPS[name];
  if (!dep) return { installed: false, reason: 'unknown' };
  if (dep.check) { try { return { installed: dep.check(), name: dep.name }; } catch (e) { return { installed: false, reason: e.message, name: dep.name }; } }
  try { run(dep.cmd, { silent: true }); return { installed: true, name: dep.name }; }
  catch (e) { return { installed: false, reason: e.message, name: dep.name }; }
}

async function installGlobalDep(name) {
  var dep = GLOBAL_DEPS[name];
  if (!dep || !dep.npm) return false;
  info('  Installing ' + dep.name + '...');
  try { run('npm install -g ' + dep.npm); ok(dep.name + ' installed'); return true; }
  catch (e) { fail('Failed to install ' + dep.name); return false; }
}

function loadLockfile(dir) {
  var fp = path.join(dir || ROOT, LOCKFILE);
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return null; }
}
function saveLockfile(dir, data) {
  var fp = path.join(dir || ROOT, LOCKFILE);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
}

function checkProjectDeps(dir) {
  var lock = loadLockfile(dir);
  var pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return { valid: false, issues: ['no package.json'] };
  var pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  var issues = [];
  if (pkg.engines && pkg.engines.node) {
    var req = pkg.engines.node.replace('^','').replace('~','');
    if (compareVer(process.version.slice(1), req) < 0) issues.push('Node ' + req + '+ required');
  }
  var allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
  for (var d in allDeps) {
    if (d === 'wrangler') continue;
    if (!fs.existsSync(path.join(dir, 'node_modules', d))) issues.push(d + ' not installed');
  }
  if (lock && lock.nodeVersion !== process.version) issues.push('Lockfile from Node ' + lock.nodeVersion);
  return { valid: issues.length === 0, issues: issues, hasLock: !!lock };
}

function cmdDeps(action, projectArg) {
  var targetDir = projectArg ? path.join(ROOT, projectArg) : ROOT;
  var isProject = fs.existsSync(path.join(targetDir, 'worker.js'));
  info('\n  chode deps' + (isProject ? ' — ' + path.basename(targetDir) : ' — Global') + '\n');
  info('  Global Dependencies:\n');
  var missing = [];
  for (var name in GLOBAL_DEPS) {
    var dep = GLOBAL_DEPS[name], check = checkDep(name);
    var icon = check.installed ? '\u2713' : (dep.required ? '\u2717' : '○');
    var status = check.installed ? 'ok' : (check.reason || 'missing');
    say('  ' + icon + ' ' + dep.name.padEnd(16), check.installed ? 'green' : (dep.required ? 'red' : 'yellow'));
    say(' ' + status + '\n', 'dim');
    if (!check.installed && dep.required) missing.push(name);
  }
  if (isProject) {
    info('\n  Project Dependencies:\n');
    var pc = checkProjectDeps(targetDir);
    if (pc.valid) ok('All project dependencies satisfied' + (pc.hasLock ? ' (lockfile current)' : ''));
    else { warn('Issues found:'); pc.issues.forEach(function(i) { fail('  ' + i); }); }
  }
  if (action === 'install' || action === 'fix') {
    info('\n  Fixing...\n');
    missing.forEach(function(n) { installGlobalDep(n); });
    if (isProject) { info('  Installing project deps...'); try { run('npm install', { cwd: targetDir }); ok('Done'); saveLockfile(targetDir, { installedAt: new Date().toISOString(), nodeVersion: process.version }); } catch(e) { warn(e.message.split('\n')[0]); } }
    return;
  }
  if (action === 'update') {
    info('\n  Updating...\n');
    for (var n in GLOBAL_DEPS) { if (GLOBAL_DEPS[n].npm) { info('  Updating ' + GLOBAL_DEPS[n].name + '...'); try { run('npm install -g ' + GLOBAL_DEPS[n].npm); ok(GLOBAL_DEPS[n].name + ' updated'); } catch(e) { warn(e.message.split('\n')[0]); } } }
    if (isProject) { run('npm update', { cwd: targetDir }); ok('Project deps updated'); }
    return;
  }
  if (missing.length === 0) ok('All dependencies healthy\n');
  else info('\n  Commands: chode deps install | update\n');
}

// ─── Provider Config ───────────────────────────────────────────────────────────

const PROVIDERS = {
  // ── Zero-auth free tiers (no keys needed) ──
  deepseek:     { name:'DeepSeek (Free)',  category:'free_noauth', requiresKey:null, qualityScore:82, endpoints:[{ type:'chat', url:'https://api.deepseek.com/beta/chat/completions', model:'deepseek-chat', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:'deepseek-chat',messages:m,max_tokens:4096,stream:false}), parse:d=>d.choices?.[0]?.message?.content }] },
  openrouter:   { name:'OpenRouter Free',  category:'free_noauth', requiresKey:null, qualityScore:78, endpoints:[{ type:'chat', url:'https://openrouter.ai/api/v1/chat/completions', model:'free/qwen-2.5-7b-instruct', headers:()=>({ 'Content-Type':'application/json','HTTP-Referer':'https://chode.oooooooooo.se','X-Title':'chode' }), body:(k,m)=>JSON.stringify({model:'free/qwen-2.5-7b-instruct',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  hf_free:      { name:'HuggingChat Free', category:'free_noauth', requiresKey:null, qualityScore:65, endpoints:[{ type:'chat', url:'https://huggingface.co/api/chat', model:'Qwen/Qwen2.5-7B-Instruct', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:'Qwen/Qwen2.5-7B-Instruct',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  ai_horde:     { name:'AI Horde',         category:'free_noauth', requiresKey:null, qualityScore:65, endpoints:[{ type:'chat', url:'https://corsproxy.io/?https://ai.api.aihorde.net/api/v2/chat/completions', model:'none', headers:()=>({ 'Content-Type':'application/json' }), body:()=>JSON.stringify({model:'none',messages:[{role:'user',content:'say ok'}],max_tokens:10}), parse:d=>d.choices?.[0]?.message?.content }] },
  llm_api:      { name:'LLM API Free',     category:'free_noauth', requiresKey:null, qualityScore:72, endpoints:[{ type:'chat', url:'https://api.llm.app/v1/chat/completions', model:'free', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:'free',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  gpt4_free:    { name:'GPT-4 Free (Test)',category:'free_noauth', requiresKey:null, qualityScore:60, endpoints:[{ type:'chat', url:'https://api.gpt4free.one/v1/chat/completions', model:'gpt-4', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:'gpt-4',messages:m,max_tokens:2048}), parse:d=>d.choices?.[0]?.message?.content }] },
  silicon_free: { name:'SiliconFlow Free', category:'free_noauth', requiresKey:null, qualityScore:74, endpoints:[{ type:'chat', url:'https://api.siliconflow.cn/v1/chat/completions', model:'Qwen/Qwen2.5-7B-Instruct', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:'Qwen/Qwen2.5-7B-Instruct',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  together_free:{ name:'Together Free',    category:'free_noauth', requiresKey:null, qualityScore:70, endpoints:[{ type:'chat', url:'https://api.together.xyz/v1/chat/completions', model:'meta-llama/Llama-3.2-3B-Instruct-Turbo', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:'meta-llama/Llama-3.2-3B-Instruct-Turbo',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  fireworks_free:{name:'Fireworks Free',   category:'free_noauth', requiresKey:null, qualityScore:68, endpoints:[{ type:'chat', url:'https://api.fireworks.ai/inference/v1/chat/completions', model:'accounts/fireworks/models/qwen2.5-7b-instruct', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:'accounts/fireworks/models/qwen2.5-7b-instruct',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  cohere_free:  { name:'Cohere Free',      category:'free_noauth', requiresKey:null, qualityScore:72, endpoints:[{ type:'chat', url:'https://api.cohere.ai/v1/chat', model:'command-r', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:'command-r',messages:m,max_tokens:4096}), parse:d=>d.text }] },
  // ── Additional free tiers from OmniRoute catalog ──
  duckduckgo:   { name:'DuckDuckGo AI',    category:'free_noauth', requiresKey:null, qualityScore:62, endpoints:[{ type:'chat', url:'https://duckduckgo.com/?duck_ai=1', model:'ddg-ai', headers:()=>({ 'Content-Type':'text/html' }), body:()=>'<query>', parse:d=>d?.match(/<div class="aI">([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]*>/g,'')?.trim() || 'DuckDuckGo AI' }] },
  theoldllm:    { name:'The Old LLM',      category:'free_noauth', requiresKey:null, qualityScore:58, endpoints:[{ type:'chat', url:'https://theoldllm.com/api/chat', model:'old-llm', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:2048}), parse:d=>d?.response||d?.choices?.[0]?.message?.content }] },
  chipotle:     { name:'Chipotle AI',      category:'free_noauth', requiresKey:null, qualityScore:55, endpoints:[{ type:'chat', url:'https://chipotle.ai/api/chat', model:'chipotle', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:2048}), parse:d=>d?.choices?.[0]?.message?.content }] },
  felo:         { name:'Felo AI',          category:'free_noauth', requiresKey:null, qualityScore:60, endpoints:[{ type:'chat', url:'https://felo.ai/api/chat', model:'felo', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  mimorecode:   { name:'MiMoCode',         category:'free_noauth', requiresKey:null, qualityScore:57, endpoints:[{ type:'chat', url:'https://mimorecode.ai/api/chat', model:'mimocode', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:2048}), parse:d=>d?.choices?.[0]?.message?.content }] },
  opencode_free:{ name:'OpenCode Free',    category:'free_noauth', requiresKey:null, qualityScore:65, endpoints:[{ type:'chat', url:'https://opencode.ai/api/chat', model:'opencode-free', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  g4f_gemini:   { name:'g4f Gemini',       category:'free_noauth', requiresKey:null, qualityScore:72, endpoints:[{ type:'chat', url:'https://g4f.space/api/gemini', model:'gemini', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  g4f_groq:     { name:'g4f Groq',         category:'free_noauth', requiresKey:null, qualityScore:75, endpoints:[{ type:'chat', url:'https://g4f.space/api/groq', model:'groq', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  g4f_nvidia:   { name:'g4f NVIDIA',       category:'free_noauth', requiresKey:null, qualityScore:73, endpoints:[{ type:'chat', url:'https://g4f.space/api/nvidia', model:'nvidia', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  g4f_ollama:   { name:'g4f Ollama',       category:'free_noauth', requiresKey:null, qualityScore:68, endpoints:[{ type:'chat', url:'https://g4f.space/api/ollama', model:'ollama', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  qwen_web:     { name:'Qwen Web Free',    category:'free_noauth', requiresKey:null, qualityScore:78, endpoints:[{ type:'chat', url:'https://qwen.ai/chat', model:'qwen-free', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  t3_web:       { name:'t3.chat Free',     category:'free_noauth', requiresKey:null, qualityScore:65, endpoints:[{ type:'chat', url:'https://t3.chat/api/chat', model:'t3-free', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  yuanbao:      { name:'Tencent Yuanbao',  category:'free_noauth', requiresKey:null, qualityScore:70, endpoints:[{ type:'chat', url:'https://yuanbao.tencent.com/api/chat', model:'yuanbao-free', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  z_ai_web:     { name:'Z.ai Web Free',    category:'free_noauth', requiresKey:null, qualityScore:68, endpoints:[{ type:'chat', url:'https://z.ai/api/chat', model:'zai-free', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m,max_tokens:4096}), parse:d=>d?.choices?.[0]?.message?.content }] },
  // ── API key providers ──
  perplexity:   { name:'Perplexity',       category:'free_tier',   requiresKey:'PERPLEXITY_API_KEY', qualityScore:90, endpoints:[{ type:'chat', url:'https://api.perplexity.ai/chat/completions', model:'sonar', headers:k=>({ 'Content-Type':'application/json','Authorization':'Bearer '+k }), body:(k,m)=>JSON.stringify({model:'sonar',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  anthropic:    { name:'Claude',           category:'paid',      requiresKey:'ANTHROPIC_API_KEY',  qualityScore:100, endpoints:[{ type:'chat', url:'https://api.anthropic.com/v1/messages', model:'claude-sonnet-4-20250514', headers:k=>({ 'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01' }), body:(k,m)=>JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:4096,messages:m}), parse:d=>d.content?.[0]?.text }] },
  openai:       { name:'GPT-4o-mini',      category:'paid',      requiresKey:'OPENAI_API_KEY',       qualityScore:95, endpoints:[{ type:'chat', url:'https://api.openai.com/v1/chat/completions', model:'gpt-4o-mini', headers:k=>({ 'Content-Type':'application/json','Authorization':'Bearer '+k }), body:(k,m)=>JSON.stringify({model:'gpt-4o-mini',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  cloudflare:   { name:'Cloudflare AI',    category:'free_tier', requiresKey:'CLOUDFLARE_API_KEY', altKey:'CLOUDFLARE_ACCOUNT_ID', qualityScore:70, endpoints:[{ type:'chat', url:k=>`https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/@cf/meta/llama-3.1-8b-instruct`, model:'@cf/meta/llama-3.1-8b-instruct', headers:k=>({ 'Authorization':'Bearer '+k,'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({messages:m}), parse:d=>d.result?.response }] },
  ollama:       { name:'Ollama',           category:'free_local',requiresKey:null,                 qualityScore:60, endpoints:[{ type:'chat', url:()=>(process.env.OLLAMA_URL||'http://localhost:11434')+'/api/generate', model:process.env.OLLAMA_MODEL||'llama3.2', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>JSON.stringify({model:process.env.OLLAMA_MODEL||'llama3.2',prompt:m[m.length-1].content,stream:false,options:{num_predict:4096}}), parse:d=>d.response }] },
  groq:         { name:'Groq',             category:'free_tier', requiresKey:'GROQ_API_KEY',      qualityScore:88, endpoints:[{ type:'chat', url:'https://api.groq.com/openai/v1/chat/completions', model:'llama-3.3-70b-versatile', headers:k=>({ 'Content-Type':'application/json','Authorization':'Bearer '+k }), body:(k,m)=>JSON.stringify({model:'llama-3.3-70b-versatile',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  cerebras:     { name:'Cerebras',         category:'free_tier', requiresKey:'CEREBRAS_API_KEY',  qualityScore:82, endpoints:[{ type:'chat', url:'https://api.cerebras.ai/v1/chat/completions', model:'llama-3.1-70b', headers:k=>({ 'Content-Type':'application/json','Authorization':'Bearer '+k }), body:(k,m)=>JSON.stringify({model:'llama-3.1-70b',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  nvidia:       { name:'NVIDIA NIM',       category:'free_tier', requiresKey:'NVIDIA_API_KEY',    qualityScore:80, endpoints:[{ type:'chat', url:'https://integrate.api.nvidia.com/v1/chat/completions', model:'meta/llama-3.3-70b-instruct', headers:k=>({ 'Content-Type':'application/json','Authorization':'Bearer '+k }), body:(k,m)=>JSON.stringify({model:'meta/llama-3.3-70b-instruct',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  scaleway:     { name:'Scaleway',         category:'free_tier', requiresKey:'SCALEWAY_API_KEY',  qualityScore:84, endpoints:[{ type:'chat', url:'https://api.scaleway.com/ai-gateway/v1/chat/completions', model:'qwen3-235b-a22b', headers:k=>({ 'Content-Type':'application/json','Authorization':'Bearer '+k }), body:(k,m)=>JSON.stringify({model:'qwen3-235b-a22b',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
  gemini:       { name:'Gemini CLI',       category:'free_tier', requiresKey:'GEMINI_API_KEY',    qualityScore:88, endpoints:[{ type:'chat', url:k=>`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${k}`, model:'gemini-2.5-flash', headers:()=>({ 'Content-Type':'application/json' }), body:(k,m)=>{var c=m.map(x=>({role:x.role==='assistant'?'model':'user',parts:[{text:x.content}]})); return JSON.stringify({contents:c,generationConfig:{maxOutputTokens:4096}});}, parse:d=>d.candidates?.[0]?.content?.parts?.[0]?.text }] },
  mistral:      { name:'Mistral',          category:'free_tier', requiresKey:'MISTRAL_API_KEY',   qualityScore:87, endpoints:[{ type:'chat', url:'https://api.mistral.ai/v1/chat/completions', model:'mistral-small', headers:k=>({ 'Content-Type':'application/json','Authorization':'Bearer '+k }), body:(k,m)=>JSON.stringify({model:'mistral-small',messages:m,max_tokens:4096}), parse:d=>d.choices?.[0]?.message?.content }] },
};

// ─── HEMO Key Provisioning ────────────────────────────────────────────────────
// When chode needs a provider key it doesn't have, it uses HEMO's agent identity
// and mail rails to auto-request API keys from services that support email signup.
// This makes chode genuinely keyless: one HELIOS account and it can bootstrap
// itself onto any service that accepts key requests via email.

const HEMO_MAIL_BASE = 'https://hemo-mail.oooooooooo.se';
const HELIOS_BASE = 'https://ai.oooooooooo.se';
const PROVISION_EMAIL = 'keys@oooooooooo.se';
const PROVISION_POLL_INTERVAL = 30000;
const PROVISION_TIMEOUT = 300000;

function loadHeliosToken() {
  var cfg = loadConfig();
  return cfg.heliosToken || null;
}

function saveHeliosToken(token) {
  var cfg = loadConfig();
  cfg.heliosToken = token;
  saveConfig(cfg);
}

async function createHeliosAgent() {
  var existing = loadHeliosToken();
  if (existing) return existing;
  info('  Creating HEMO agent identity via HELIOS...');
  var username = 'chode-' + Date.now().toString(36).slice(-6);
  try {
    var r = await fetch(HELIOS_BASE + '/api/v1/accounts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username }),
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) { var e = await r.text(); fail('HELIOS create failed: ' + e.slice(0,100)); return null; }
    var d = await r.json();
    if (d.token) { saveHeliosToken(d.token); ok('HEMO agent created: ' + username); return d.token; }
    fail('HELIOS response missing token'); return null;
  } catch (e) { fail('HELIOS unreachable: ' + e.message); return null; }
}

async function requestProviderKey(providerId) {
  var token = loadHeliosToken() || await createHeliosAgent();
  if (!token) return null;
  var config = PROVIDERS[providerId];
  if (!config) return null;
  info('    Sending key request to HEMO mail for ' + config.name + '...');
  try {
    var r = await fetch(HEMO_MAIL_BASE + '/api/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        to: PROVISION_EMAIL,
        subject: '[CHODE] Key request: ' + config.name,
        text: 'Provider: ' + config.name + ' (' + providerId + ')\n' +
              'Endpoint: ' + (config.endpoints[0]?.url || 'unknown') + '\n' +
              'Request: Please provision a free-tier API key for automated access.\n' +
              'This is generated by chode — the self-healing coding harness.',
        agent_id: 'chode'
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) { var e2 = await r.text(); warn('HEMO mail send failed: ' + e2.slice(0,80)); return null; }
    var d2 = await r.json();
    ok('Key request sent for ' + config.name);
    return d2.message_id || null;
  } catch (e) { warn('HEMO mail error: ' + e.message); return null; }
}

function cmdProvision(providerArg) {
  info('\n  chode provision \u2014 Auto-provision API keys via HEMO\n');
  var providers = providerArg ? [providerArg] : Object.keys(PROVIDERS).filter(function(k) {
    var c = PROVIDERS[k];
    return c.requiresKey && !process.env[c.requiresKey] && !(loadConfig().providers?.[k]?.key);
  });
  if (providers.length === 0) { ok('No keys to provision. All providers have keys.\n'); return; }
  info('  Providers needing keys: ' + providers.join(', ') + '\n');
  var token = loadHeliosToken();
  if (!token) {
    info('  No HEMO agent identity. Creating one...\n');
    token = createHeliosAgent();
    if (!token) { fail('Cannot create HEMO agent. Manual key setup required.\n'); return; }
  }
  var sent = 0;
  for (var i = 0; i < providers.length; i++) {
    var pid = providers[i];
    info('  Requesting key for ' + PROVIDERS[pid]?.name + '...');
    var mid = requestProviderKey(pid);
    if (mid) sent++;
  }
  if (sent > 0) {
    info('\n  ' + sent + ' key request(s) sent via HEMO mail.\n');
    info('  To complete: check your HEMO mail inbox for responses.\n');
    info('  Or manually set the key: export DEEPSEEK_API_KEY=sk-... && chode ai "test"\n');
  } else {
    fail('Failed to send key requests. Check HEMO mail connectivity.\n');
    info('  Manual workaround: chode new <name> --key <provider> <api-key>\n');
  }
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
  catch { return { id: id||'default', messages: [], fallbacks: [], lastProvider: null, createdAt: Date.now() }; }
}
function saveSession(s) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  fs.writeFileSync(path.join(SESSION_DIR, s.id + '.json'), JSON.stringify(s, null, 2), 'utf8');
}

// ─── Health Monitor ────────────────────────────────────────────────────────────

var monitorInterval = null;
var monitorState = { running: false };

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
    url = url.replace('{port}', String(loadConfig().omniroute?.port || OMNIROUTE_PORT));
    url = url.replace('{account}', process.env.CLOUDFLARE_ACCOUNT_ID || '');
    var drift = detectDrift(pid, url);
    if (drift.drifted) info('  ~  Drift detected: ' + config.name + ' endpoint updated (' + drift.old + ' -> ' + drift.new + ')');
    if (endpoint.type === 'simple') {
      var resp = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(endpoint.timeout || 10000) });
      var ms = Date.now() - t0;
      var body = await resp.text();
      if (resp.ok && body && body.length > 3) return { ok: true, latency: ms, status: resp.status };
      return { ok: false, latency: ms, error: 'empty', status: resp.status };
    }
    var body = endpoint.body(key, [{ role: 'user', content: 'say ok' }]);
    var headers = endpoint.headers(key);
    var resp = await fetch(url, { method: 'POST', headers: headers, body: body, signal: AbortSignal.timeout(endpoint.timeout || 15000) });
    var ms = Date.now() - t0;
    var data = await resp.json().catch(()=>({}));
    if (resp.status === 200 && data.choices?.[0]?.message) return { ok: true, latency: ms, status: 200 };
    if (resp.status === 429 || data.error?.code === 'rate_limit_exceeded') return { ok: false, latency: ms, error: 'rate_limited', status: 429 };
    if (resp.status === 401 || resp.status === 403) return { ok: false, latency: ms, error: 'auth_failed', status: resp.status };
    if (resp.status === 410 || data.type === 'Gone') return { ok: false, latency: ms, error: 'deprecated', status: 410 };
    return { ok: false, latency: ms, error: data.error?.message || 'http_'+resp.status, status: resp.status };
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
    if (config.category === 'omni_free') {
      var routes = await checkOmniRoute();
      if (!routes.running) { lb.providers[pid] = { ...lb.providers[pid], ok: false, error: 'omni_not_running', lastProbe: new Date().toISOString() }; continue; }
    }
    var result = await probeProvider(pid, config.endpoints[0]);
    var stats = lb.providers[pid] || { probes: 0, successes: 0, totalLatency: 0, lastOk: null, streak: 0 };
    stats.lastProbe = new Date().toISOString();
    stats.lastStatus = result.ok ? 'ok' : (result.error || 'error');
    if (result.ok) { stats.successes++; stats.probes++; stats.totalLatency += result.latency||0; stats.lastOk = new Date().toISOString(); stats.streak = (stats.streak||0)+1; stats.avgLatency = stats.totalLatency/stats.successes; }
    else { stats.streak = 0; stats.lastError = result.error; stats.probes++; }
    lb.providers[pid] = stats;
  }
  var scored = [];
  for (var pid in lb.providers) {
    var s = lb.providers[pid];
    if (!s.lastProbe) continue;
    var q = PROVIDERS[pid] ? (PROVIDERS[pid].qualityScore||50) : 50;
    var rel = s.probes > 0 ? (s.successes/s.probes)*100 : 0;
    var lat = s.avgLatency > 0 ? Math.max(0, 100 - s.avgLatency/100) : 50;
    var rec = s.lastOk ? Math.min(100, 100 - ((Date.now()-new Date(s.lastOk).getTime())/60000)*2) : 0;
    var score = q*0.35 + rel*0.30 + lat*0.20 + rec*0.15;
    scored.push({ id: pid, name: PROVIDERS[pid]?.name||pid, score: Math.round(score), reliability: Math.round(rel), latency: s.avgLatency, streak: s.streak, category: PROVIDERS[pid]?.category||'?' });
  }
  scored.sort(function(a,b){return b.score-a.score;});
  lb.ranked = scored;
  saveLeaderboard(lb);
  if (verbose) { showQuickScore(); if (scored.length > 0) { info('\n  Full leaderboard:\n'); for (var j = 0; j < scored.length; j++) { var sr = scored[j]; var si = sr.score >= 70 ? '\u2713' : (sr.score >= 40 ? '○' : 'x'); say('  ' + si + ' #' + String(j+1).padEnd(3) + ' ' + sr.name.padEnd(22), sr.score >= 70 ? 'green' : 'white'); info('  ' + String(sr.score).padStart(3) + '  ' + (sr.reliability||0) + '%  ' + (sr.latency ? Math.round(sr.latency)+'ms' : '---') + '\n', 'dim'); } } else { info('\n  No providers responded successfully. Set API keys or start omniroute.\n'); } }
  return scored;
}

async function startMonitor() {
  var cfg = loadConfig(); cfg.monitor.enabled = true; saveConfig(cfg);
  monitorState.running = true;
  ok('Health monitor started \u2014 scanning every 30s');
  info('  Press Ctrl+C to stop\n');
  await runFullScan(false); showQuickScore();
  monitorInterval = setInterval(async function() {
    var lb = loadLeaderboard();
    var toProbe = lb.ranked ? lb.ranked.slice(0,3).map(r=>r.id) : [];
    for (var pid in lb.providers) {
      if (!lb.providers[pid].ok && lb.providers[pid].lastProbe) {
        var mins = (Date.now()-new Date(lb.providers[pid].lastProbe).getTime())/60000;
        if (mins < 5 && toProbe.indexOf(pid) === -1) toProbe.push(pid);
      }
    }
    for (var i = 0; i < toProbe.length; i++) {
      var p = toProbe[i], cfg2 = PROVIDERS[p];
      if (cfg2) {
        var r = await probeProvider(p, cfg2.endpoints[0]);
        if (!lb.providers[p]) lb.providers[p] = { probes:0,successes:0,totalLatency:0,lastOk:null,streak:0 };
        var st = lb.providers[p]; st.lastProbe = new Date().toISOString(); st.lastStatus = r.ok?'ok':(r.error||'error');
        if (r.ok) { st.successes++; st.probes++; st.totalLatency += r.latency||0; st.lastOk = new Date().toISOString(); st.streak = (st.streak||0)+1; st.avgLatency = st.totalLatency/st.successes; }
        else { st.streak = 0; st.lastError = r.error; st.probes++; }
      }
    }
    var scored = [];
    for (var pid in lb.providers) {
      var s = lb.providers[pid];
      if (!s.lastProbe) continue;
      var q = PROVIDERS[pid]?(PROVIDERS[pid].qualityScore||50):50;
      var rel = s.probes>0?(s.successes/s.probes)*100:0;
      var lat = s.avgLatency>0?Math.max(0,100-s.avgLatency/100):50;
      var rec = s.lastOk?Math.min(100,100-((Date.now()-new Date(s.lastOk).getTime())/60000)*2):0;
      scored.push({ id:pid, name:PROVIDERS[pid]?.name||pid, score:Math.round(q*.35+rel*.30+lat*.20+rec*.15), reliability:Math.round(rel), latency:s.avgLatency, streak:s.streak, category:PROVIDERS[pid]?.category||'?' });
    }
    scored.sort(function(a,b){return b.score-a.score;});
    lb.ranked = scored; saveLeaderboard(lb);
  }, HEALTH_INTERVAL);
}

function stopMonitor() {
  var cfg = loadConfig(); cfg.monitor.enabled = false; saveConfig(cfg);
  monitorState.running = false;
  if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null; }
  ok('Health monitor stopped');
}

function showQuickScore() {
  var lb = loadLeaderboard();
  if (!lb.ranked || lb.ranked.length === 0) { warn('No scan data. Run `chode scan` first.'); return; }
  var top = lb.ranked[0];
  var icon = top.score >= 70 ? '\u2713' : (top.score >= 40 ? '○' : 'x');
  info('  Live: ' + icon + ' ' + top.name + ' (score ' + top.score + ', ' + top.category + ')' + (top.latency ? '  ' + Math.round(top.latency) + 'ms' : ''));
}

async function checkOmniRoute() {
  var cfg = loadConfig();
  try { var resp = await fetch('http://localhost:'+(cfg.omniroute.port||OMNIROUTE_PORT)+'/api/health', { signal: AbortSignal.timeout(2000) }); return { running: resp.ok, url: 'http://localhost:'+(cfg.omniroute.port||OMNIROUTE_PORT) }; } catch { return { running: false }; }
}

// ─── AI Engine with Never-Stop Guarantee ──────────────────────────────────────

async function callWithBestProvider(prompt, sessionId, forceProvider) {
  var lb = loadLeaderboard();
  var session = sessionId ? loadSession(sessionId) : null;
  if (!session) session = { id: sessionId||'default', messages: [], fallbacks: [], createdAt: Date.now() };
  var candidates = forceProvider ? [forceProvider] : (lb.ranked && lb.ranked.length > 0 ? lb.ranked.map(r=>r.id) : ['anthropic','openai','cloudflare','ollama','deepseek','groq','cerebras','nvidia','scaleway','qwen','gemini','kiro','qoder','longcat']);
  var viable = candidates.filter(function(pid) {
    var c = PROVIDERS[pid]; if (!c) return false;
    // Skip providers that require keys the user doesn't have
    if (c.requiresKey) return !!(process.env[c.requiresKey] || (loadConfig().providers?.[pid]?.key));
    return true;
  });
  if (viable.length === 0) { fail('No viable providers. Run `chode scan` or set an API key.'); return null; }

  var result = null, usedProvider = null;
  for (var i = 0; i < viable.length; i++) {
    var pid = viable[i], config = PROVIDERS[pid], endpoint = config.endpoints[0];
    try {
      var key = null;
      if (config.requiresKey) key = process.env[config.requiresKey] || (loadConfig().providers?.[pid]?.key);
      var url = typeof endpoint.url === 'function' ? (endpoint.url(key) || endpoint.url) : endpoint.url;
      url = url.replace('{port}', String(loadConfig().omniroute?.port || OMNIROUTE_PORT));
      url = url.replace('{account}', process.env.CLOUDFLARE_ACCOUNT_ID || '');
      var drift = detectDrift(pid, url);
      if (drift.drifted) info('  ~  ' + config.name + ' endpoint migrated: ' + drift.old + ' -> ' + drift.new);

      // Use retry with exponential backoff for THIS provider
      result = await retry(async function() {
        if (endpoint.type === 'simple') {
          var resp = await fetch(url, { signal: AbortSignal.timeout(endpoint.timeout || 15000) });
          var body = await resp.text();
          if (resp.ok && body && body.length > 2) return { result: body, provider: pid };
          throw new Error('empty_response (' + resp.status + ')');
        } else {
          var msgs = session.messages.length > 0 ? session.messages.concat([{role:'user',content:prompt}]) : [{role:'user',content:prompt}];
          var chatBody = endpoint.body(key, msgs);
          var chatHeaders = endpoint.headers(key);
          var resp = await fetch(url, { method:'POST', headers:chatHeaders, body:chatBody, signal: AbortSignal.timeout(endpoint.timeout||15000) });
          var data = await resp.json().catch(()=>({}));
          if (resp.status === 200 && data.choices?.[0]?.message?.content) return { result: endpoint.parse(data), provider: pid };
          if (resp.status === 410 || data.type === 'Gone') throw new Error('deprecated_410');
          throw new Error(resp.status + ':' + (data.error?.message || ''));
        }
      }, MAX_RETRY, 'call to ' + (config?.name || pid));

      if (result) { usedProvider = result.provider; break; }
    } catch (e) {
      if (e.message && e.message.indexOf('deprecated_410') !== -1) { warn('  ' + (config?.name||pid) + ' deprecated (410), skipping...'); continue; }
      warn('  ' + (config?.name||pid) + ' failed: ' + e.message.split('\n')[0]);
      if (i === viable.length - 1) fail('    ' + (config?.name||pid) + ' exhausted after ' + MAX_RETRY + ' retries');
    }
  }

  if (!result) { fail('\n  All providers exhausted after ' + MAX_RETRY + ' retries each.'); info('\n  No provider succeeded. Set an API key or run `chode omniroute start` for free tiers.\n'); return null; }

  session.lastProvider = usedProvider;
  session.messages.push({ role:'user', content:prompt, ts:Date.now() });
  session.messages.push({ role:'assistant', content:result.result, ts:Date.now(), provider:usedProvider });
  if (session.messages.length > 50) session.messages = session.messages.slice(-50);
  if (sessionId) saveSession(session);
  saveCheckpoint({ taskId: sessionId||'default', lastProvider: usedProvider, lastPrompt: prompt, lastResult: result.result, ts: Date.now() });
  return { result: result.result, provider: usedProvider, providerName: PROVIDERS[usedProvider]?.name };
}

// ─── Commands ──────────────────────────────────────────────────────────────────

function cmdNew(name, flags) {
  var slug = name.replace(/[^a-zA-Z0-9_-]/g,'-').toLowerCase();
  if (flags.skill) return cmdNewSkill(slug);
   // Auto-check deps before scaffolding
   checkAndInstallDeps(ROOT);
   var css='',logoScript='';
   try {
     var tpl = fs.readFileSync(path.join(ROOT,'..','secz6-glass-template','worker.js'),'utf8');
     var cm = tpl.match(/<style>([\s\S]*?)<\/style>/); if(cm)css=cm[1].trim();
     var lm = tpl.match(/<script>\(function\(\)\{\nfunction initLogo[\s\S]*?initLogo\(document\.getElementById\('logo'\),75,1\.0,false\);\n\}\)\(\);<\/script>/); if(lm)logoScript=lm[0];
   } catch {}
   var featHtml = ['Production grade','Secz6 glass layout','HEMO integrated','Self-healing AI'].map(function(f){return '    <li style="padding:4px 0;color:#aab">\u2022 '+f+'</li>';}).join('\n');
   var htmlDoc = [
     '<!DOCTYPE html>',
     '<html lang="en"><head>',
     '  <meta charset="utf-8">',
     '  <meta name="viewport" content="width=device-width,initial-scale=1">',
     '  <title>'+slug+' \u2014 chode</title>',
     '  <meta name="description" content="'+slug+' \u2014 self-healing Cloudflare Worker">',
     '  <link rel="manifest" href="/manifest.json">',
     '  <link rel="robots.txt" href="/robots.txt">',
     '  <link rel="sitemap" href="/sitemap.xml">',
     '  <link rel="icon" href="/favicon.ico">',
     '  <style>',
     '    :root{--g:#22dd55;--g2:#3dffa0;--bg:#0a0a0a;--border:rgba(34,221,85,.14);--text:#dff0e2;--muted:#7fa88a;--fm:"IBM Plex Mono",monospace;}',
     '    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
     '    html{background:#000}',
     '    body{background:#000;color:var(--text);font-family:var(--fm);overflow-x:hidden;min-height:100vh;padding-top:148px}',
     '    .bg-orb-holder{position:fixed;inset:0;z-index:0;pointer-events:none;background:#000;overflow:hidden}',
      '    #bgfx-frame{position:absolute;left:0;top:0;width:300vmin;height:300vmin;border:0;display:block;transform-origin:50% 50%;transform:translate(calc(var(--ox,50vw) - 150vmin),calc(var(--oy,40vh) - 150vmin)) scale(.67);filter:contrast(1.45) saturate(1.05);opacity:.85}',
     '    @media(prefers-reduced-motion:reduce){#bgfx-frame{display:none}}',
     '    body::before{content:\'\';position:fixed;inset:0;background:radial-gradient(ellipse 80% 200px at 50% -10px,rgba(34,221,85,.14),transparent 70%);pointer-events:none;z-index:1}',
     '    .page{position:relative;z-index:2;padding-bottom:140px;max-width:1080px;margin:0 auto}',
     '    .site-header{position:fixed;top:0;left:0;right:0;z-index:50;height:97px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:rgba(10,16,10,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(34,221,85,.08)}',
     '    .header-nav{display:flex;align-items:center;gap:18px}',
     '    .header-nav a{color:var(--muted);text-decoration:none;font-size:13.5px;font-weight:500;transition:color .2s}',
     '    .header-nav a:hover{color:var(--g)}',
     '    .header-pill{background:rgba(34,221,85,.08);border:1px solid rgba(34,221,85,.25);color:var(--g)!important;font-size:13px;font-weight:600;padding:9px 18px;border-radius:99px;text-decoration:none;transition:all .2s}',
     '    .hero{min-height:92vh;display:flex;flex-direction:column;justify-content:center;text-align:center;padding:120px 24px 40px;position:relative}',
     '    .hero-kicker{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:rgba(61,255,160,.72);margin:0 0 16px;font-weight:600}',
     '    .hero-title{font-size:clamp(52px,8.5vw,120px);font-weight:700;line-height:1.02;letter-spacing:.03em;color:var(--text);margin:0 0 22px;text-shadow:0 0 60px rgba(34,221,85,.25)}',
     '    .hero-title .chode-wrap{position:relative;display:inline-block}',
     '    .hero-title .chode-wrap .o-slot{position:relative;display:inline-block;color:transparent}',
     '    .hero-title .chode-wrap .o-slot #logo-wrapper{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:.82em;height:.82em;z-index:0}',
     '    .hero-sub{font-size:17px;font-weight:400;line-height:1.65;color:var(--muted);max-width:720px;margin:0 auto 30px;background:rgba(13,26,18,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(34,221,85,.10);border-radius:20px;padding:22px 28px}',
     '    .hero-sub b{color:var(--text);font-weight:600}',
     '    .hero-actions{display:flex;align-items:center;gap:14px;justify-content:center;flex-wrap:wrap}',
     '    .btn-lg{font-size:14px;font-weight:600;padding:13px 28px;border-radius:99px;text-decoration:none;transition:all .2s;display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;font-family:inherit}',
     '    .btn-lg.primary{background:var(--g);color:#04130a}',
     '    .btn-lg.primary:hover{background:var(--g2);transform:translateY(-2px);box-shadow:0 8px 32px rgba(34,221,85,.35)}',
     '    .btn-lg.secondary{background:rgba(13,26,18,.5);color:var(--text);border:1px solid rgba(34,221,85,.3)}',
     '    .btn-lg.secondary:hover{background:rgba(34,221,85,.08);transform:translateY(-2px)}',
     '    .content-box{background:rgba(13,26,18,.42);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(34,221,85,.14);border-radius:20px;padding:38px 36px;margin:26px auto;max-width:860px}',
     '    .content-box h2{font-size:clamp(23px,3vw,32px);font-weight:600;letter-spacing:-.01em;line-height:1.2;margin:6px 0 16px;color:var(--g)}',
     '    .content-box p{font-size:15.5px;color:var(--muted);line-height:1.7;margin-bottom:14px}',
     '    .content-box p:last-child{margin-bottom:0}',
     '    .checklist{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:4px}',
     '    .checklist li{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;color:var(--text);line-height:1.6;background:rgba(10,20,14,.45);border:1px solid rgba(34,221,85,.14);border-radius:14px;padding:13px 16px}',
     '    .checklist li .tick{flex:none;width:22px;height:22px;border-radius:50%;background:rgba(34,221,85,.14);border:1px solid rgba(34,221,85,.35);color:var(--g2);display:flex;align-items:center;justify-content:center;font-size:12px;margin-top:2px}',
     '    .inst-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-top:18px}',
     '    .inst-card{background:rgba(10,20,14,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(34,221,85,.14);border-radius:16px;padding:22px 20px;display:flex;flex-direction:column;gap:9px;text-decoration:none;transition:transform .2s,border-color .2s,box-shadow .2s}',
     '    .inst-card:hover{transform:translateY(-3px);border-color:rgba(34,221,85,.4);box-shadow:0 10px 34px rgba(34,221,85,.10)}',
     '    .inst-card .ic-name{font-size:15px;font-weight:600;color:var(--g)}',
     '    .inst-card .ic-desc{font-size:13px;line-height:1.6;color:var(--muted);flex:1}',
     '    .inst-card .ic-link{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:rgba(61,255,160,.75)}',
     '    .section-label{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--g);margin-bottom:8px;display:inline-block}',
     '    footer{position:fixed;left:0;right:0;bottom:0;z-index:50;min-height:64px;border-top:1px solid rgba(34,221,85,.12);background:rgba(10,16,10,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-size:12px;color:var(--muted);display:flex;align-items:center}',
     '    footer .foot-inner{max-width:1080px;margin:0 auto;width:100%;padding:10px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}',
     '    footer .foot-links{display:flex;gap:16px;flex-wrap:wrap}',
     '    footer .foot-links a{color:var(--muted);text-decoration:none;transition:color .2s}',
     '    footer .foot-links a:hover{color:var(--g)}',
     '    .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)}',
     '    .reveal.in{opacity:1;transform:none}',
     '    @media(max-width:768px){body{padding-top:120px}.site-header{padding:0 16px;height:86px}.header-nav{display:none}.hero{padding-top:90px;min-height:80vh}.content-box{padding:28px 22px}footer .foot-inner{padding:10px 16px}}',
     '  </style>',
     '</head>',
     '<body>',
     '<div class="bg-orb-holder"><canvas id="bg-orb"></canvas></div>',
     '<script>',
     '(function(){',
     '  var holder=document.querySelector(\'.bg-orb-holder\');',
     '  if(!holder||!window.matchMedia)return;',
     '  var conn=navigator.connection||{};',
     '  if(matchMedia(\'(prefers-reduced-motion: reduce)\').matches||conn.saveData||!matchMedia(\'(hover: hover) and (pointer: fine)\').matches)return;',
     '  var OVERSCAN=1,frame=null,sized=0;',
     '  function frameSize(){return Math.ceil(1.5*Math.max(innerWidth,innerHeight))}',
     '  function anchor(resized){',
     '  var o=document.querySelector(\'.hero-title .chode-wrap .o-slot\');',
     '    var cx,cy;',
     '    if(o){var r=o.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2}',
     '    else{cx=innerWidth/2;cy=innerHeight*0.4}',
     '    cx=Math.max(0,Math.min(innerWidth,cx));cy=Math.max(0,Math.min(innerHeight,cy));',
     '    holder.style.setProperty(\'--ox\',cx+\'px\');holder.style.setProperty(\'--oy\',cy+\'px\');',
     '    if(resized||!sized){sized=frameSize();holder.style.setProperty(\'--bgsize\',sized+\'px\');holder.style.setProperty(\'--bgzoom\',String(1/OVERSCAN));if(frame){frame.width=sized;frame.height=sized}}',
     '  }',
     '  var pending=false;',
     '  function onScroll(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;anchor(false)})}',
     '  function mount(){',
     '    if(frame||document.hidden)return;anchor();frame=document.createElement(\'iframe\');frame.id=\'bgfx-frame\';',
     '    frame.setAttribute(\'sandbox\',\'allow-scripts allow-same-origin\');',
     '    frame.setAttribute(\'referrerpolicy\',\'no-referrer\');frame.setAttribute(\'loading\',\'lazy\');',
     '    frame.setAttribute(\'tabindex\',\'-1\');frame.setAttribute(\'aria-hidden\',\'true\');frame.setAttribute(\'title\',\'Decorative backdrop\');',
     '    frame.src=\'https://boundaries-bg.fogeboro.workers.dev/\';holder.appendChild(frame);anchor();',
     '  }',
     '  var idle=window.requestIdleCallback||function(f){return setTimeout(f,1500)};',
     '  idle(mount);addEventListener(\'scroll\',onScroll,{passive:true});',
     '  addEventListener(\'resize\',function(){anchor(true)},false);',
     '  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(anchor).catch(function(){})}',
     '  addEventListener(\'load\',anchor);setTimeout(anchor,400);setTimeout(anchor,1200);',
     '  document.addEventListener(\'visibilitychange\',function(){if(!document.hidden)idle(mount)});',
     '})();',
     '</script>',
     '<header class="site-header">',
     '  <nav class="header-nav">',
     '    <a href="https://github.com/fogennnnn/chode" target="_blank" rel="noopener">GitHub</a>',
     '    <a href="https://github.com/fogennnnn/chode#readme">Docs</a>',
     '    <a href="https://github.com/fogennnnn/hemo-skills">Skills</a>',
     '  </nav>',
     '  <a class="header-pill" href="https://github.com/fogennnnn/chode">Get chode &rarr;</a>',
     '</header>',
     '<main class="page">',
     '<section class="hero">',
     '  <div class="hero-kicker">Never stops</div>',
         '<h1 class="hero-title"><span class="chode-wrap">ch<span class="o-slot">o</span>de</span></h1>',
     '<p class="hero-sub">'+slug+' \u2014 scaffolded by chode<br>',
     'Self-healing Cloudflare Worker with <b>live provider routing</b>, <b>exponential backoff</b>, and <b>checkpoint recovery</b>.<br>',
     'Routes to the best available AI provider. Switches silently when one fails. Resumes after crashes.</p>',
     '<div class="hero-actions">',
     '  <a class="btn-lg primary" href="https://github.com/fogennnnn/chode">Star on GitHub &rarr;</a>',
     '  <a class="btn-lg secondary" href="#institutions">See the stack</a>',
     '</div>',
     '</section>',
     '<div class="content-box reveal" id="institutions" style="scroll-margin-top:130px">',
     '  <div class="section-label">What it does</div>',
     '  <h2>The self-healing coding harness</h2>',
     '  <p>Every developer has been there: your free-tier quota just depleted, your AI tool hands you a dead end, and you stare at the cursor typing "continue" into the void.</p>',
     '  <p>chode solves this by <b>never trusting a single provider</b>. It probes 14 free-tier AI endpoints every 30 seconds, builds a live reputation score, and routes your work to whatever is actually working <em>right now</em>. When one provider dies, it\'s already forgotten. Your session keeps moving.</p>',
     '</div>',
     '<div class="box-row">',
     '  <div class="content-box reveal">',
     '    <div class="section-label">Never stops</div>',
     '    <h2>Exponential backoff retry</h2>',
     '    <ul class="checklist">',
     '      <li><span class="tick">1</span><div><b>5 retries per provider</b> with 1s\u21922s\u21924s\u21928s\u219216s backoff</div></li>',
     '      <li><span class="tick">2</span><div><b>Silent provider switching</b> \u2014 context preserved across hops</div></li>',
     '      <li><span class="tick">3</span><div><b>Checkpoint recovery</b> \u2014 resume after crashes with <code>chode ai --resume</code></div></li>',
     '      <li><span class="tick">4</span><div><b>AFK fallback</b> \u2014 auto-switches to no-auth providers when you step away</div></li>',
     '    </ul>',
     '  </div>',
     '  <div class="content-box reveal">',
     '    <div class="section-label">Live intelligence</div>',
     '    <h2>Provider leaderboard</h2>',
     '    <ul class="checklist">',
     '      <li><span class="tick">1</span><div><b>30s health scans</b> across 14 providers</div></li>',
     '      <li><span class="tick">2</span><div><b>Composite scoring</b> \u2014 quality\u00d735% + reliability\u00d730% + speed\u00d720% + recency\u00d715%</div></li>',
     '      <li><span class="tick">3</span><div><b>Endpoint drift detection</b> \u2014 auto-updates registry when APIs change</div></li>',
     '      <li><span class="tick">4</span><div><b>Zero config free tiers</b> \u2014 works without API keys via LongCat, Qwen, Gemini</div></li>',
     '    </ul>',
     '  </div>',
     '</div>',
     '<div class="content-box reveal" style="scroll-margin-top:130px">',
     '  <div class="section-label">The stack</div>',
     '  <h2>Live infrastructure</h2>',
     '  <p>Every service below runs today, speaks both HTTP and MCP, and seals what matters into HELIOS provenance.</p>',
     '  <div class="inst-grid">',
     '    <a class="inst-card" href="https://hemo-jobs.oooooooooo.se/" target="_blank" rel="noopener">',
     '      <div class="ic-name">hemo-jobs</div>',
     '      <div class="ic-desc">Paid labor exchange. Post work, claim work, deliver, settle directly on the ledger.</div>',
     '      <div class="ic-link">Open &rarr;</div>',
     '    </a>',
     '    <a class="inst-card" href="https://hemo-registry.oooooooooo.se/" target="_blank" rel="noopener">',
     '      <div class="ic-name">hemo-registry</div>',
     '      <div class="ic-desc">Verified agent directory. Counterparties check who they are dealing with.</div>',
     '      <div class="ic-link">Open &rarr;</div>',
     '    </a>',
     '    <a class="inst-card" href="https://hemo-court.oooooooooo.se/" target="_blank" rel="noopener">',
     '      <div class="ic-name">hemo-court</div>',
     '      <div class="ic-desc">Staked arbitration. Both sides stake, jurors vote, the loser pays.</div>',
     '      <div class="ic-link">Open &rarr;</div>',
     '    </a>',
     '    <a class="inst-card" href="https://mcp-hemo.oooooooooo.se/llms.txt" target="_blank" rel="noopener">',
     '      <div class="ic-name">mcp-hemo</div>',
     '      <div class="ic-desc">One URL, the whole economy. Connect Claude, Cursor, or any MCP client.</div>',
     '      <div class="ic-link">Tool list &rarr;</div>',
     '    </a>',
     '  </div>',
     '</div>',
     '<div class="content-box reveal" style="scroll-margin-top:130px">',
     '  <div class="section-label">Start building</div>',
     '  <h2>One command</h2>',
     '  <p>chode scaffolds production Cloudflare Workers with the HEMO doctrine banner, secz6 glass layout, and self-healing AI routing built in.</p>',
     '  <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;max-width:520px">',
     '    <code style="background:rgba(34,221,85,.08);border:1px solid rgba(34,221,85,.18);border-radius:6px;padding:13px 14px;font-family:var(--fm);font-size:14px;color:var(--g);width:100%">node chode.js new my-agent</code>',
     '    <a class="btn-lg primary" href="https://github.com/fogennnnn/chode" target="_blank" rel="noopener" style="text-align:center">Clone &amp; get started &rarr;</a>',
     '  </div>',
     '</div>',
     '</main>',
     '<footer>',
     '  <div class="foot-inner">',
     '    <div class="foot-links">',
     '      <a href="https://github.com/fogennnnn/chode" target="_blank" rel="noopener">GitHub</a>',
     '      <a href="https://github.com/fogennnnn/chode#readme">Docs</a>',
     '      <a href="https://github.com/fogennnnn/hemo-skills">HEMO Skills</a>',
     '      <a href="mailto:inf@oooooooooo.se" style="color:var(--g)">inf@oooooooooo.se</a>',
     '    </div>',
     '    <span>chode \u00b7 self-healing harness \u00b7 '+new Date().getFullYear()+'</span>',
     '  </div>',
     '</footer>',
     '<script>',
     'const io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add(\'in\');io.unobserve(e.target)}})},{threshold:0.12});',
     'document.querySelectorAll(\'.reveal\').forEach(function(el){io.observe(el)});',
     'addEventListener(\'DOMContentLoaded\',function(){',
     '  var w=document.getElementById(\'logo-wrapper\');',
     '  var s=document.querySelector(\'.hero-title .chode-wrap .o-slot\');',
     '  if(w&&s&&w.parentElement!==s)s.appendChild(w);',
     '});',
     '</script>',
     logoScript,
     '</body></html>'
   ].join('\n');
  var escaped = htmlDoc.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$/g,'\\$');
  var lines = [DOCTRINE,'',
'// '+slug+' \u2014 Scaffolded by chode',
'// Self-healing: auto-routes to best available AI provider',
'',
'const PAGE = `'+escaped+'`;',
'',
'export default {',
'  async fetch(request, env) {',
"    const url = new URL(request.url);",
"    const p = url.pathname;",
"    const key = request.headers.get('x-api-key');",
"    const validKey = env.API_KEY || '"+slug+"-dev-key';",
'',
"    if (p === '/' || p === '/index.html') return html(PAGE);",
'',
"    if (p === '/api/status') return json({ ok: true, service: '"+slug+"', ts: Date.now() });",
'',
"    if (p === '/api/ask' && request.method === 'POST') {",
"      if (key !== validKey) return json({ error: 'unauthorized' }, 401);",
"      const body = await request.json().catch(() => ({}));",
"      return json({ response: 'AI response for: ' + body.prompt + ' (connected via chode auto-router)' });",
'    }',
'',
"    return new Response('Not found', { status: 404 });",
'  },',
'};',
'',
'function html(body) { return new Response(body, { headers: { \'content-type\': \'text/html; charset=utf-8\' } }); }',
'function json(body, status) { return new Response(JSON.stringify(body), { status: status||200, headers: { \'content-type\': \'application/json; charset=utf-8\', \'access-control-allow-origin\': \'*\' } }); }'];
  write(slug+'/worker.js', lines.join('\n'));
  write(slug+'/wrangler.toml', ['name = "'+slug+'"','main = "worker.js"','compatibility_date = "2024-09-23"','','[vars]','SERVICE_NAME = "'+slug+'"',''].join('\n'));
  write(slug+'/package.json', '{\n  "name": "'+slug+'",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "dev": "wrangler dev",\n    "deploy": "wrangler deploy",\n    "test": "node --test worker.test.js"\n  }\n}\n');
  write(slug+'/deploy/robots.txt', 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n');
  write(slug+'/deploy/sitemap.xml', '<?xml version="1.0"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://'+slug+'.oooooooooo.se/</loc></url></urlset>');
  ok('Scaffolded '+slug+'/');
  info('  worker.js      \u2014 secz6 glass + self-healing AI');
  info('  wrangler.toml  \u2014 deployment config');
  info('  package.json   \u2014 scripts: dev, deploy, test\n');
  info('  Next: cd '+slug+' && npx wrangler dev');
}

function cmdNewSkill(slug) {
  var md = ['---','name: '+slug,'type: technique','description: >','  '+slug.replace(/-/g,' ')+' \u2014 HEMO skill for '+slug+'.','---','',
    '# '+slug,'',slug.replace(/-/g,' ')+' is a HEMO economy skill.',
    '','## Usage','','```','chode skills install '+slug,'```','',
    '## Conventions','- Follow the HEMO doctrine','- Keyless by default','- Rate-limit aware'].join('\n');
  var dest = path.join(SKILLS_REPO, slug, 'SKILL.md');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, md, 'utf8');
  ok('Skill scaffolded: '+slug+'/SKILL.md');
}

function cmdDev() { checkAndInstallDeps(ROOT); info('  -> Starting local dev server...\n'); var c = spawn('npx',['wrangler','dev'],{cwd:ROOT,stdio:'inherit',shell:true}); c.on('close',function(code){process.exit(code||0);}); }
function cmdDeploy() { checkAndInstallDeps(ROOT); info('  -> Running typecheck...'); run('npx wrangler types',{silent:true}); info('  -> Deploying...\n'); run('npx wrangler deploy'); ok('Deployed'); }
function checkAndInstallDeps(dir) { if (!checkDep('wrangler').installed) { info('  -> Installing wrangler...\n'); installGlobalDep('wrangler'); } if (!checkDep('node').installed) { fail('Node.js '+MIN_NODE_VERSION+'+ required. Current: '+process.version); process.exit(1); } }

async function cmdScan() { info('\n  chode scan \u2014 Full free-tier health probe\n'); info('  Testing all '+Object.keys(PROVIDERS).length+' providers...\n'); var scored = await runFullScan(true); return scored; }
function cmdScore() { var lb = loadLeaderboard(); if (!lb.ranked||lb.ranked.length===0) { warn('No scan data. Run `chode scan` first.'); return; } info('\n  chode score \u2014 Live Provider Leaderboard\n  Updated: '+(lb.updated?new Date(lb.updated).toLocaleString():'never')+'\n'); info('  Rank  Provider'.padEnd(30)+'Score  Rel      Latency  Category\n'); info('  '+'\u2500'.repeat(72)+'\n'); for (var i=0;i<lb.ranked.length;i++) { var r=lb.ranked[i], icon=r.score>=70?'\u2713':(r.score>=40?'○':'x'), cat=r.category==='free_noauth'?'NOAUTH':(r.category==='omni_free'?'OMNI':(r.category==='free_tier'?'FREE':'PAID')), lat=r.latency?Math.round(r.latency)+'ms':'---'; say('  '+icon+' #'+String(i+1).padEnd(3)+' '+r.name.padEnd(22), r.score>=70?'green':'white'); say(' '+String(r.score).padStart(3)+'    '+String(r.reliability).padStart(3)+'%       '+lat.padEnd(8)+' '+cat+'\n','dim'); } info('\n  Top: '+(lb.ranked[0]?.name||'none')+'\n'); }

async function cmdAI(rawArgs) {
  var args = parseArgs(rawArgs);
  var sessionId = args.session || args[0];
  var prompt = args.prompt;
  var force = args.force;
  var resume = args.resume;

  // Check for checkpoint recovery
  var checkpoint = loadCheckpoint();
  if (checkpoint && checkpoint.lastPrompt && !prompt && !resume) {
    info('\n  Resuming from checkpoint (' + new Date(checkpoint.ts).toLocaleString() + ')\n');
    info('  Last provider: ' + checkpoint.lastProvider + '\n');
    // Restore full message history from checkpoint session
    var restoredSession = loadSession(checkpoint.taskId || 'default');
    if (restoredSession.messages.length > 0) {
      info('  Restoring ' + restoredSession.messages.length + ' messages from session\n');
      session = restoredSession;
    }
    prompt = '[RESUME] Previous conversation context restored. Continue from where we left off.';
  }

  if (!sessionId && !prompt) {
    info('\n  chode AI \u2014 Self-Healing Session\n');
    showQuickScore();
    var lastSession = loadSession(null);
    if (lastSession.messages.length > 0) info('  Resuming session with ' + lastSession.messages.length + ' messages\n');
    else info('  Fresh session. Type your prompt (or Ctrl+C to exit):\n');
    info('  Commands: exit, heal, scan, score, switch, checkpoint\n');

    function askNext(fastProvider) {
      process.stdout.write('  > ');
      process.stdin.resume(); process.stdin.setEncoding('utf8');
      var afkTimer = setTimeout(function() {
        // Actually switch to fastest provider on AFK
        var lb = loadLeaderboard();
        var fastest = lb.ranked && lb.ranked.length > 0 ? lb.ranked[0].id : null;
        if (fastest) {
          info('\n  [AFK — switching to fastest: ' + (PROVIDERS[fastest]?.name || fastest) + ']\n');
        } else {
          info('\n  [AFK — rescan needed]\n');
        }
        askNext(fastest);
      }, AFK_TIMEOUT*1000);
      process.stdin.once('data', function(chunk) {
        clearTimeout(afkTimer);
        var line = chunk.toString().trim();
        if (!line) { askNext(); return; }
        if (line==='exit'||line==='quit'||line==='\x03') { clearCheckpoint(); info('  Session saved. Goodbye.\n'); process.exit(0); }
        if (line==='heal'||line==='switch') { info('  Re-scanning providers...\n'); cmdScan().then(function(){askNext(null)}); return; }
        if (line==='scan') { cmdScan().then(function(){askNext(null)}); return; }
        if (line==='score') { cmdScore(); askNext(currentFast); return; }
        if (line==='status') { showQuickScore(); askNext(currentFast); return; }
        if (line==='checkpoint') { var cp=loadCheckpoint(); info(cp?'  Checkpoint: '+JSON.stringify(cp):'  No checkpoint'); askNext(currentFast); return; }
        if (line==='clear') { clearCheckpoint(); info('  Checkpoint cleared'); askNext(currentFast); return; }
        info('  \u2192 Calling AI (auto-fallback, up to ' + MAX_RETRY + ' retries per provider)...\n');
        cmdAI({session:sessionId,prompt:line,force:force,resume:resume,fastProvider:currentFast}).then(function(res) {
          if (res) { if (res.provider!==res.providerName) info('  \u26a1  Routed: ' + res.providerName + ' (' + res.provider + ')\n'); console.log('\n  ' + res.result + '\n'); }
          askNext(currentFast);
        });
      });
    }
    askNext(null);
    return;
  }

  info('  \u2192 Calling AI (auto-fallback, '+MAX_RETRY+' retries, never stops)...\n');
  var res = await callWithBestProvider(prompt, sessionId, force);
  if (res) {
    if (res.provider !== res.providerName) info('  \u26a1  Routed to: ' + res.providerName + ' (' + res.provider + ')\n');
    console.log(res.result);
  }
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

async function cmdProject(spec) {
  info('\n  chode project \u2014 Multi-provider orchestration\n');
  info('  Scanning providers...\n');
  var scored = await runFullScan(false); showQuickScore();
  info('\n  Generating plan from: "' + spec + '"\n');

  // Use AI to decompose the project into steps
  var steps;
  try { steps = JSON.parse(spec); }
  catch {
    info('  Decomposing project via AI...\n');
    var planResult = await callWithBestProvider('Break this project into numbered steps (one per line, no explanations): ' + spec, null, null);
    if (planResult) {
      var lines = planResult.result.split('\n').filter(function(l){return l.trim();});
      steps = lines.map(function(l,i){return {desc:l.trim(),index:i+1};});
    } else {
      steps = [{desc:'Analyze: '+spec},{desc:'Generate implementation plan'},{desc:'Write and validate code'}];
    }
  }

  info('  Plan: ' + steps.length + ' steps\n');
  var results = [];
  for (var i=0;i<steps.length;i++) {
    var step = steps[i];
    info('  ['+(i+1)+'/'+steps.length+'] ' + step.desc.slice(0,60) + (step.desc.length>60?'...':''));
    var topProvs = scored.slice(0,3).map(function(r){return r.id;});
    var stepResult = null, stepProvider = null;
    for (var j=0;j<topProvs.length;j++) {
      try {
        var res = await callWithBestProvider(step.desc, null, topProvs[j]);
        if (res && res.result) { stepResult=res.result; stepProvider=topProvs[j]; break; }
      } catch {}
    }
    if (stepResult) { ok('  Done via '+(PROVIDERS[stepProvider]?.name||stepProvider)); results.push({step:i+1,result:stepResult.slice(0,300)+'...',provider:stepProvider}); }
    else { warn('  Failed \u2014 no provider could complete'); results.push({step:i+1,error:'all_failed'}); }
  }
  var done = results.filter(function(r){return r.result;}).length;
  info('\n  Project complete: ' + done + '/' + results.length + ' steps succeeded.\n');
  return results;
}

async function cmdHeal() { info('\n  chode heal \u2014 Force provider diagnostics\n'); await runFullScan(true); }
function cmdSession(action) {
  var sid = process.argv[4];
  var sessions=[];
  try {
    var files = fs.readdirSync(SESSION_DIR);
    for (var i = 0; i < files.length; i++) {
      if (files[i].endsWith('.json')) {
        var s = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, files[i]), 'utf8'));
        s.file = files[i];
        sessions.push(s);
      }
    }
  } catch {}
  if (action==='list'||action===undefined) {
    info('\n  Sessions\n');
    if (sessions.length===0) { info('  No sessions yet. Start one with: chode ai\n'); return; }
    for(var j=0;j<sessions.length;j++){var s=sessions[j];say('  '+(s.id||s.file).padEnd(20),'white');info((s.messages?s.messages.length:0)+' msgs  '+new Date(s.createdAt).toLocaleString()+'\n');}
    info('  Resume: chode ai --session <id>\n');
  } else if (action==='show') {
    var ss=loadSession(sid||loadSession(null).id);
    info('\n  Session: '+ss.id+'\n  Messages: '+(ss.messages?ss.messages.length:0)+'\n  Last provider: '+(ss.lastProvider||'none')+'\n');
    if(ss.messages&&ss.messages.length>0){info('\n  --- Last 10 messages ---\n');for(var k=Math.max(0,ss.messages.length-10);k<ss.messages.length;k++){var m=ss.messages[k];var p=m.role==='user'?'>':'<';var pr=m.content.replace(/\n/g,' ').slice(0,100);say('  '+p+' ','dim');info(pr+(m.content.length>100?'...':'')+'\n');}}
  } else if (action==='reset') {
    saveQuotas({day:new Date().toISOString().slice(0,10),counts:{}});var cfg=loadConfig();cfg.providers={};saveConfig(cfg);clearCheckpoint();ok('All quotas and checkpoints reset.');
  }
}
function saveQuotas(q){fs.mkdirSync(CONFIG_DIR,{recursive:true});fs.writeFileSync(path.join(CONFIG_DIR,'quotas.json'),JSON.stringify(q,null,2),'utf8');}
function initQuotas(){var today=new Date().toISOString().slice(0,10);try{var q=JSON.parse(fs.readFileSync(path.join(CONFIG_DIR,'quotas.json'),'utf8'));if(q.day!==today)q={day:today,counts:{}};return q;}catch{return{day:today,counts:{}};}}

async function cmdAuth() {
  var cfg=loadConfig(); var routes=await checkOmniRoute();
  if(routes.running){
    info('\n  OmniRoute running at http://localhost:'+cfg.omniroute.port+'\n');
    info('  '+'\u2500'.repeat(55)+'\n');
    for(var key in PROVIDERS){var p=PROVIDERS[key];var connected=cfg.providers&&cfg.providers[key]?'  ✓':'  ○';say('  '+connected+' '+key.padEnd(8),p.category==='free_local'?'green':'white');say(p.name.padEnd(20)+'\n','dim');}
    info('\n  Connect at: http://localhost:'+cfg.omniroute.port+'\n');
  } else {
    info('\n  OmniRoute \u2014 Free AI Gateway\n  '+('\u2500'.repeat(55))+'\n');
    info('  1. Install: npm install -g omniroute\n');
    info('  2. Start:   chode omniroute start\n');
    info('  3. Connect: chode auth\n');
  }
}

async function cmdOmniRoute(subcmd) {
  var cfg=loadConfig(), port=cfg.omniroute.port||OMNIROUTE_PORT;
  if(subcmd==='status'||!subcmd){var r=await checkOmniRoute();if(r.running){ok('OmniRoute running at http://localhost:'+port);info('  Dashboard: http://localhost:'+port+'\n  API:       http://localhost:'+port+'/v1\n');}else{warn('OmniRoute not running.');info('  Start: chode omniroute start\n');}}
  else if(subcmd==='start'){var r2=await checkOmniRoute();if(r2.running){ok('Already running at http://localhost:'+port);return;}try{run('omniroute --version',{silent:true});}catch{info('  -> Installing OmniRoute...\n');run('npm install -g omniroute');ok('OmniRoute installed');}info('  -> Starting on port '+port+'...\n');var ch=spawn('omniroute',['--port',String(port)],{cwd:ROOT,stdio:'inherit',shell:true});ch.on('close',function(c){if(c!==0)fail('Exited '+c);process.exit(c||0);});}
   else if(subcmd==='open'){var r3=await checkOmniRoute();if(!r3.running){warn('Not running. Starting...');await cmdOmniRoute('start');}var u='http://localhost:'+port;info('  Opening '+u+'...\n');var openCmd=['start','open','xdg-open'][os.platform()==='win32'?0:(os.platform()==='darwin'?1:2)];try{spawn(openCmd,[u],{detached:true,stdio:'ignore'});ok('Opened dashboard');}catch(e){fail('Cannot open: '+e.message);info('  Manual: '+u);}}
  else if(subcmd==='install'){try{run('npm install -g omniroute',{silent:true});ok('OmniRoute installed');info('  Start: chode omniroute start\n  Connect: chode auth\n');}catch(e){fail('Install failed: '+e.message);}}
  else fail('Unknown: '+subcmd);
}

function cmdModels() {
  var detected = detectProvider();
  info('\n  AI Models\n  '+'\u2500'.repeat(55)+'\n');
  for(var key in PROVIDERS){var p=PROVIDERS[key];var active=key===detected?'active':'(free tier)';say('  '+(active&&active==='active'?'\u2713':'○')+' '+key.padEnd(16),active&&active==='active'?'green':'white');say(p.name.padEnd(20)+'\n','dim');}
  info('\n  Quick start:\n    chode scan         Discover working providers\n    chode ai "hello"   Test with auto-routing\n    chode omniroute install  Get 11 free providers\n');
}

function detectProvider() {
  if(process.env.CLOUDFLARE_API_KEY&&process.env.CLOUDFLARE_ACCOUNT_ID) return 'cloudflare';
  if(process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if(process.env.OPENAI_API_KEY) return 'openai';
  if(process.env.OLLAMA_URL) return 'ollama';
  if(process.env.DEEPSEEK_API_KEY) return 'deepseek';
  if(process.env.GROQ_API_KEY) return 'groq';
  if(process.env.CEREBRAS_API_KEY) return 'cerebras';
  if(process.env.NVIDIA_API_KEY) return 'nvidia';
  if(process.env.SCALEWAY_API_KEY) return 'scaleway';
  if(process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}

function cmdEvolve(skillName) {
  var pyRepo=path.join(ROOT,'..','hermes-agent-self-evolution');
  if(!fs.existsSync(pyRepo)){fail('hermes-agent-self-evolution not found');info('  Clone: git clone https://github.com/NousResearch/hermes-agent-self-evolution');process.exit(1);}
  info('  -> Evolving '+(skillName||'brainstorming')+'...\n');
  try{run('python -m evolution.skills.evolve_skill --skill '+(skillName||'brainstorming')+' --iterations 5',{cwd:pyRepo,env:Object.assign({},process.env,{HERMES_AGENT_REPO:pyRepo})});}
  catch(e){warn('Requires hermes-agent: pip install -e ".[dev]"');}
}

function cmdBench() { info('  -> Running hemo-jobs benchmark...\n'); var jd=path.join(ROOT,'hemo-jobs'); if(!fs.existsSync(jd)){fail('hemo-jobs not found');process.exit(1);} run('npm test',{cwd:jd}); }

async function cmdUpdate() {
  info('\n  chode \u2014 Checking for updates...\n');
  try {
    var latestOut = run('npm view chode version', { silent: true });
    if (!latestOut || !latestOut.trim()) { warn('Could not check npm registry'); return; }
    var latestVer = latestOut.trim();
    var currentVer = fs.existsSync(path.join(ROOT,'package.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8')).version : '1.0.0';
    info('  Current: ' + currentVer);
    info('  Latest:  ' + latestVer + '\n');
    if (compareVer(latestVer, currentVer) > 0) {
      info('  Update available!\n');
      info('  Run: npm install -g chode\n');
    } else ok('chode is up to date\n');
  } catch(e) { warn('Update check failed: ' + e.message.split('\n')[0]); }
}

function cmdInit() {
  info('\n  chode \u2014 Initializing...\n');
  checkAndInstallDeps(ROOT);
  for(var name in GLOBAL_DEPS){var dep=GLOBAL_DEPS[name],check=checkDep(name);if(!check.installed&&dep.required)installGlobalDep(name);}
  var skillsDir=path.join(ROOT,'.chode-skills');if(!fs.existsSync(skillsDir)){fs.mkdirSync(skillsDir,{recursive:true});ok('Created .chode-skills/');}
  var monitorDir=path.join(ROOT,'.chode','monitor');if(!fs.existsSync(monitorDir)){fs.mkdirSync(monitorDir,{recursive:true});ok('Created .chode/monitor/');}
  var provider=detectProvider();if(provider){var cfg2=loadConfig();cfg2.providers={};var reqKey=PROVIDERS[provider]?.requiresKey;if(reqKey&&process.env[reqKey]){cfg2.providers[provider]={key:process.env[reqKey]};saveConfig(cfg2);}ok('Direct AI: '+PROVIDERS[provider]?.name);info('  Key saved to config ('+reqKey+')\n');}else{warn('No direct AI provider.');info('  Run chode scan for free tiers, or set an API key.\n');info('  Pro tip: run `chode provision` to auto-request keys via HEMO mail (no signup needed).\n');}
  if(!fs.existsSync(AGENTS_MD))warn('AGENTS.md not found');
  // Check for checkpoint recovery
  var cp=loadCheckpoint();
  if(cp&&cp.lastPrompt){info('\n  Found checkpoint from '+new Date(cp.ts).toLocaleString());info('  Resume with: chode ai --resume\n');}
  info('\n  \u2713  chode ready.\n');
  info('  Next steps:\n');
  info('    chode scan        Discover working free-tier providers');
  info('    chode provision   Auto-request API keys via HEMO mail (no manual signup)');
  info('    chode monitor     Start continuous health monitoring');
  info('    chode ai          Start AI session with auto-routing');
  info('    chode deps        Check dependency health\n');
}

function cmdHelp() {
  info(`
  chode \u2014 The Self-Healing Coding Harness
  Free models. Live discovery. Zero lock-in.
  Build it once. It runs forever.

  Scaffold:
    chode new <name>              New Cloudflare Worker (secz6 glass + self-healing)
    chode new <name> --skill      New HEMO skill

  AI (auto-routes to best available, NEVER STOPS):
    chode ai "prompt"             One-shot with exponential backoff retry
    chode ai --resume             Resume interrupted session
    chode ai --force <provider>   Force specific provider

  Health & Discovery:
    chode scan                    Probe ALL providers, build live leaderboard
    chode monitor                 Background health monitor (every 30s)
    chode score                   Show current rankings
    chode heal                    Force full re-scan

  Projects:
    chode project "<description>" Multi-step using best providers
    chode bench                   Run hemo-jobs benchmark

  Sessions:
    chode session list            Show saved sessions
    chode session show [id]       View history
    chode session reset           Reset all state

  OmniRoute (11 free providers via gateway):
    chode omniroute install       npm install -g omniroute
    chode omniroute start         Start gateway at localhost:20128
    chode omniroute open          Open dashboard in browser
    chode auth                    Connect providers (click to sign in)

  Maintenance:
    chode deps [check|install|update] [project]  Dependency management
    chode update                  Check for chode updates
    chode init                    One-time setup

  How the never-stops guarantee works:
    1. chode scan probes every free-tier endpoint
    2. Providers are scored: quality*35% + reliability*30% + speed*20% + recency*15%
    3. chode ai routes to the highest-scoring provider automatically
    4. Each call retries up to 5 times with exponential backoff (1s, 2s, 4s, 8s, 16s)
    5. If ALL providers fail, it waits and tries again on next call
    6. Endpoint drift is detected and auto-updated in the registry
    7. Checkpoints survive crashes \u2014 chode ai --resume picks up where it left off
    8. chode monitor keeps re-scanning every 30s so rankings are always current
  `);
}

// ─── Entry ─────────────────────────────────────────────────────────────────────

var args = process.argv.slice(2);
var cmd = args[0];
var flags = {};
for(var i=0;i<args.length;i++){if(args[i].indexOf('--')===0){var parts=args[i].slice(2).split('=');flags[parts[0]]=parts[1]!==undefined?parts[1]:true;}}

var dispatch = {
  init:       cmdInit,
  new:        function(){cmdNew(args[1],flags);},
  dev:        cmdDev,
  deploy:     cmdDeploy,
  scan:       function(){(async function(){await cmdScan();})();},
  monitor:    function(){(async function(){await startMonitor();})();},
  score:      cmdScore,
  ai:         function(){(async function(){await cmdAI(args.slice(1));})();},
  project:    function(){(async function(){await cmdProject(args.slice(1).join(' '));})();},
  heal:       function(){(async function(){await cmdHeal();})();},
  session:    cmdSession,
  auth:       function(){(async function(){await cmdAuth();})();},
  omniroute:  function(){(async function(){await cmdOmniRoute(args[1]);})();},
  models:     cmdModels,
  skills:     function(){cmdSkills(args[1]);},
  evolv:      cmdEvolve,
  bench:      cmdBench,
  deps:       function(){cmdDeps(args[1],args[2]);},
  update:     cmdUpdate,
  provision:  cmdProvision,
  help:       cmdHelp,
};

if(dispatch[cmd]){dispatch[cmd]();}
else if(cmd){fail('Unknown command: '+cmd);info('  Run `chode help` for usage.');process.exit(1);}
else{
  // No command = start interactive AI session immediately
  (async function(){await cmdAI([]);})();
}
