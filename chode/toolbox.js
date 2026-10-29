'use strict';
// toolbox.js — safe free-tool discovery + installation for chode.
// Zero-dep (node builtins only). Policy:
// - Auto-install ONLY goes through trusted package managers (winget/brew/npm)
//   with validated package names and no shell interpolation (spawn argv, no shell).
// - Arbitrary GitHub repos are NEVER executed on install: foreign repos are
//   cloned --depth 1 for inspection only, never built/run automatically.
// - Every action is logged; dryRun mode exists for tests.

const { spawnSync } = require('child_process');
const https = require('https');

const NAME_RX = /^[a-z0-9_.@/-]+$/i;

// Curated registry: free dev tools chode can verify and install hands-free.
// check = probe command (first token must exist on PATH with --version).
const REGISTRY = {
  hurl: {desc:'HTTP journey/assertion tests (optional)',check:'hurl',apiEngine:true,external:'chode api-test setup hurl'},
  schemathesis: {desc:'Generated API contract checks (optional)',check:'schemathesis',apiEngine:true,external:'chode api-test setup schemathesis'},
  k6: {desc:'Explicit API load/performance tests (optional)',check:'k6',apiEngine:true,external:'chode api-test setup k6'},
  ripgrep: { desc: 'fast grep (rg)', check: 'rg', winget: 'BurntSushi.ripgrep.MSVC', brew: 'ripgrep', apt: 'ripgrep' },
  fd: { desc: 'fast find (fd)', check: 'fd', winget: 'sharkdp.fd', brew: 'fd', apt: 'fd-find' },
  jq: { desc: 'JSON processor', check: 'jq', winget: 'jqlang.jq', brew: 'jq', apt: 'jq' },
  fzf: { desc: 'fuzzy finder', check: 'fzf', winget: 'junegunn.fzf', brew: 'fzf', apt: 'fzf' },
  bat: { desc: 'cat with wings', check: 'bat', winget: 'sharkdp.bat', brew: 'bat', apt: 'bat' },
  eza: { desc: 'modern ls', check: 'eza', winget: 'eza-community.eza', brew: 'eza', apt: 'eza' },
  gh: { desc: 'GitHub CLI', check: 'gh', winget: 'GitHub.cli', brew: 'gh', apt: 'gh' },
  lazygit: { desc: 'git TUI', check: 'lazygit', winget: 'JesseDuffield.lazygit', brew: 'lazygit', apt: null },
  delta: { desc: 'diff pager', check: 'delta', winget: 'dandavison.delta', brew: 'git-delta', apt: null },
  zoxide: { desc: 'smart cd', check: 'zoxide', winget: 'ajeetdsouza.zoxide', brew: 'zoxide', apt: null },
  biome: { desc: 'JS formatter/linter', check: 'biome', npm: '@biomejs/biome', winget: null, brew: 'biome' },
  prettier: { desc: 'code formatter', check: 'prettier', npm: 'prettier', winget: null, brew: null },
  // External, opt-in capabilities: never auto-installed (no package-manager
  // path that preserves the user's explicit approval). ensureTool reports
  // them with {external:true, hint} instead of a plan.
  rea: { desc: 'reverse-engineering agent CLI + MCP (external, opt-in; needs engines)', check: 'rea', external: 'npx -y rea-agents@6.5.0' },
};

function apiInstalled(name,entry){if(!entry.apiEngine)return false;try{const bin=require('./api-testing').resolveEngine(process.cwd(),name);if(!bin)return false;return spawnSync(bin.command,[...bin.args,'--version'],{encoding:'utf8',timeout:10000,windowsHide:true,shell:false}).status===0;}catch{return false;}}

function validName(name) {
  return typeof name === 'string' && name.length >= 2 && name.length <= 80 && NAME_RX.test(name) && !/[;&|$`\\!*?{}()<>]/.test(name);
}

function commandExists(cmd) {
  try {
    const bin = String(cmd || '').split(' ')[0];
    if (!bin || !validName(bin)) return false;
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8', timeout: 8000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    return r.status === 0;
  } catch (e) { return false; }
}

function listTools() {
  return Object.keys(REGISTRY).map(function (name) {
    var entry = REGISTRY[name];
    var installed = apiInstalled(name,entry) || commandExists(entry.check || name);
    return { name: name, desc: entry.desc, installed: installed };
  });
}

function githubSearch(query, opts) {
  opts = opts || {};
  var fetcher = opts.fetch || defaultGithubFetch;
  return fetcher(query, opts);
}

function defaultGithubFetch(query, opts) {
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    var q = encodeURIComponent(String(query || '').slice(0, 120));
    if (!q) return reject(new Error('empty query'));
    var req = https.request({
      hostname: 'api.github.com',
      path: '/search/repositories?q=' + q + '+in:name,description&per_page=' + (opts.limit || 5),
      method: 'GET',
      headers: { 'user-agent': 'chode-toolbox/1.0', 'accept': 'application/vnd.github+json' },
    }, function (res) {
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () {
        try {
          if (res.statusCode !== 200) return reject(new Error('GitHub search HTTP ' + res.statusCode));
          var data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve((data.items || []).map(function (it) {
            return { fullName: it.full_name, stars: it.stargazers_count, desc: it.description, url: it.html_url, language: it.language };
          }));
        } catch (e) { reject(e); }
      });
    });
    req.setTimeout(opts.timeoutMs || 10000, function () { req.destroy(new Error('GitHub search timed out')); });
    req.on('error', reject);
    req.end();
  });
}

// Ensure a registry tool exists; install hands-free when missing.
// Returns {ok, already} or {ok:false, error}. dryRun: plan without executing.
function ensureTool(name, opts) {
  opts = opts || {};
  var key = String(name || '').toLowerCase().trim();
  if (!validName(key)) return { ok: false, error: 'invalid tool name' };
  var entry = REGISTRY[key];
  if (!entry) return { ok: false, error: 'not in curated registry (use toolbox search, then clone for inspection)' };
  if (apiInstalled(key,entry) || commandExists(entry.check || key)) return { ok: true, already: true, name: key };
  if (entry.external) return { ok: false, external: true, name: key, hint: 'external tool (not auto-installed): ' + entry.external };
  if (opts.dryRun) return { ok: true, dryRun: true, name: key, plan: planInstall(entry) };
  var plan = planInstall(entry);
  if (!plan) return { ok: false, error: 'no installer for ' + process.platform };
  try {
    var r = spawnSync(plan.cmd, plan.args, { encoding: 'utf8', timeout: 180000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    if (r.status === 0 && commandExists(entry.check || key)) return { ok: true, name: key, installed: true };
    return { ok: false, error: String((r.stderr || r.stdout || 'installer failed')).slice(0, 300) };
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 200) }; }
}

function planInstall(entry) {
  var plat = process.platform;
  if (plat === 'win32' && entry.winget) {
    return { cmd: 'winget', args: ['install', '-e', '--id', entry.winget, '--silent', '--accept-package-agreements', '--accept-source-agreements'] };
  }
  if (plat === 'darwin' && entry.brew) {
    return { cmd: 'brew', args: ['install', entry.brew] };
  }
  if (plat === 'linux' && entry.apt && process.getuid && process.getuid() === 0) {
    return { cmd: 'apt-get', args: ['install', '-y', entry.apt] };
  }
  if (entry.npm) {
    return { cmd: 'npm', args: ['install', '-g', entry.npm] };
  }
  return null;
}

// Clone a foreign repo for inspection only — never builds or runs it.
function inspectRepo(fullName, destDir, opts) {
  opts = opts || {};
  if (!/^[\w.-]+\/[\w.-]+$/.test(String(fullName || ''))) return { ok: false, error: 'invalid repo name (owner/repo)' };
  var dest = String(destDir || '');
  if (!dest || dest.indexOf('..') !== -1) return { ok: false, error: 'invalid destination' };
  if (opts.dryRun) return { ok: true, dryRun: true, repo: fullName, dest: dest };
  try {
    var fs = require('fs');
    fs.mkdirSync(require('path').dirname(dest), { recursive: true });
    var r = spawnSync('git', ['clone', '--depth', '1', 'https://github.com/' + fullName + '.git', dest], { encoding: 'utf8', timeout: 120000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    if (r.status === 0) return { ok: true, repo: fullName, dest: dest };
    return { ok: false, error: String((r.stderr || 'clone failed')).slice(0, 300) };
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 200) }; }
}

module.exports = { REGISTRY: REGISTRY, listTools: listTools, commandExists: commandExists, githubSearch: githubSearch, ensureTool: ensureTool, inspectRepo: inspectRepo, validName: validName };
