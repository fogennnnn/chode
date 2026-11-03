'use strict';
/**
 * provider-catalog.js
 *
 * A single data-driven view of every provider chode can connect to.
 *
 * It unifies three sources into one browsable list:
 *   1. the built-in registry (PROVIDERS, including saved "setup" customs),
 *   2. the community directory profiles (provider-directory.json), and
 *   3. saved custom connections (already folded into PROVIDERS by reloadConnections).
 *
 * Each entry carries live status (is it configured? is a key resolvable? how
 * many models? which tier?) and, for providers that offer more than one way to
 * authenticate, an ordered list of access `variants` (e.g. OVH: "free, no key"
 * plus "API key / credits").
 *
 * The module is dependency-light and synchronous so it can drive both the
 * terminal picker and the TUI picker. It never performs network I/O: callers
 * pass in already-discovered data (e.g. the Ollama model list) when they want
 * richer local status.
 */

const directory = require('./provider-directory');
const credentials = require('./provider-credentials');

// Canonical tier labels, in display order.
const TIERS = ['free', 'keyless', 'local', 'paid', 'configured'];

function categoryToTier(category) {
  switch (category) {
    case 'free_tier': return 'free';
    case 'keyless': return 'keyless';
    case 'free_local': return 'local';
    case 'paid': return 'paid';
    case 'configured': return 'configured';
    default: return 'configured';
  }
}

function normalizeBase(url) {
  try { return String(url || '').replace(/\/+$/, '').replace(/\/chat\/completions$/i, ''); }
  catch (e) { return String(url || ''); }
}

function baseOfBuiltIn(p) {
  const ep = p && p.endpoints && p.endpoints[0];
  const u = typeof ep && ep.url === 'function' ? null : ep && ep.url;
  return u ? normalizeBase(u) : null;
}

function baseOfProfile(profile) {
  return profile && profile.baseUrl ? normalizeBase(profile.baseUrl) : null;
}

// Build the variant list for a provider. Free/no-key variants sort first so the
// zero-setup path is always the default, which is what "free tiers first" means.
function variantsFor({ requiresKey, keyEnv, tier, modelCount, freeTier, pricedModels }) {
  const variants = [];
  if (!requiresKey) {
    variants.push({
      label: tier === 'local' ? 'Local (no key)' : 'No key (free)',
      tier: tier === 'local' ? 'local' : 'keyless',
      requiresKey: false,
      keyEnv: null,
      note: freeTier || (tier === 'local' ? 'Uses your running local server.' : 'Anonymous / keyless access.'),
      modelCount: modelCount
    });
  } else {
    variants.push({
      label: 'API key (' + (keyEnv || 'key') + ')',
      tier: tier === 'free' ? 'free' : 'paid',
      requiresKey: true,
      keyEnv: keyEnv || null,
      note: pricedModels ? 'Uses account credits / pricing.' : 'Authenticated account access.',
      modelCount: modelCount
    });
  }
  return variants;
}

/**
 * Build the unified catalog.
 *
 * @param {object} engine  the chode module (for PROVIDERS, loadConfig, loadProviderSettings)
 * @param {object} [opts]
 *   @param {object} [opts.env]        env map used for key resolution (default process.env)
 *   @param {Array}  [opts.localModels] discovered local model ids (e.g. Ollama)
 *   @param {boolean}[opts.probeLocal]  set true to mark the local server as up (caller verified)
 * @returns {Array} catalog entries
 */
function all(engine, opts = {}) {
  const env = opts.env || process.env;
  const providers = (engine && engine.PROVIDERS) || {};
  const config = (engine && typeof engine.loadConfig === 'function') ? engine.loadConfig(true) : {};
  const settingsFor = (id) => (engine && typeof engine.loadProviderSettings === 'function')
    ? engine.loadProviderSettings(id, false)
    : ((config.providers && config.providers[id]) || {});

  const byId = new Map();

  // 1) built-in registry + saved customs (source 'setup')
  for (const [id, p] of Object.entries(providers)) {
    if (!p || p.category === 'bootstrap') continue;
    const tier = categoryToTier(p.category);
    const keyEnv = p.requiresKey || null;
    const key = credentials.resolve(p, settingsFor(id), env);
    const isLocal = p.category === 'free_local';
    const modelCount = (p.endpoints && p.endpoints.length) || 1;
    byId.set(id, {
      id,
      name: p.name || id,
      source: p.source === 'setup' ? 'setup' : 'builtin',
      category: p.category,
      tier,
      keyEnv,
      requiresKey: !!keyEnv,
      configured: !!(config.providers && config.providers[id]) || p.source === 'setup',
      hasKey: !!key,
      modelCount,
      hasFreeModels: tier === 'keyless' || tier === 'local',
      doc: p.signupUrl || null,
      signupUrl: p.signupUrl || null,
      baseUrl: baseOfBuiltIn(p),
      local: isLocal,
      localUp: isLocal ? (opts.probeLocal === true || (Array.isArray(opts.localModels) && opts.localModels.length > 0)) : null,
      verification: p.source === 'setup' ? 'Saved connection; account access is yours to verify.' : 'Built-in route; free tier / keyless as labelled.',
      _models: null,
      variants: variantsFor({ requiresKey: !!keyEnv, keyEnv, tier, modelCount, freeTier: p.freeTier })
    });
  }

  // 2) community directory profiles
  const merged = new Set();
  for (const profile of directory.list()) {
    const base = baseOfProfile(profile);
    // Merge a keyed directory twin into a matching keyless built-in as a variant
    // (e.g. ovh + ovhcloud, agnes + agnes). Key on identical base URL.
    if (base && profile.env && !profile.local) {
      for (const existing of byId.values()) {
        if (!existing.requiresKey && existing.baseUrl && existing.baseUrl === base) {
          const models = (profile.models || []);
          existing.variants.push({
            label: 'API key (' + (profile.env || 'key') + ')',
            tier: 'paid',
            requiresKey: true,
            keyEnv: profile.env || null,
            note: 'Authenticated account access; uses account credits / pricing.',
            modelCount: models.length,
            profileId: profile.id
          });
          existing.hasPaidVariant = true;
          existing._models = models;
          if (!existing.doc) existing.doc = profile.doc;
          merged.add(profile.id);
          break;
        }
      }
    }
    if (merged.has(profile.id)) continue; // folded in as a variant above
    if (byId.has(profile.id)) {
      // Same id as a built-in: keep the built-in entry, but fold in the richer
      // directory model list + doc so the picker can search/filter models.
      const existing = byId.get(profile.id);
      const models = (profile.models || []);
      existing._models = models.length ? models : existing._models;
      if (models.length) existing.modelCount = models.length;
      if (models.some(m => m && m.zeroTokenPrice)) existing.hasFreeModels = true;
      if (profile.doc && !existing.doc) existing.doc = profile.doc;
      continue;
    }
    const keyEnv = profile.env || null;
    const tier = profile.local ? 'local' : (keyEnv ? 'configured' : 'keyless');
    const models = (profile.models || []);
    byId.set(profile.id, {
      id: profile.id,
      name: profile.name || profile.id,
      source: 'directory',
      category: profile.local ? 'free_local' : (keyEnv ? 'configured' : 'keyless'),
      tier,
      keyEnv,
      requiresKey: !!keyEnv && !profile.local,
      configured: !!(config.providers && config.providers[profile.id]),
      hasKey: keyEnv ? !!credentials.resolve({ requiresKey: keyEnv }, settingsFor(profile.id), env) : false,
      modelCount: models.length,
      hasFreeModels: models.some(m => m && m.zeroTokenPrice) || !!profile.local,
      doc: profile.doc || null,
      signupUrl: null,
      baseUrl: base,
      local: !!profile.local,
      localUp: profile.local ? (opts.probeLocal === true || (Array.isArray(opts.localModels) && opts.localModels.length > 0)) : null,
      verification: profile.verification || 'community-listed; authenticated access not independently verified',
      _models: models,
      variants: variantsFor({
        requiresKey: !!keyEnv && !profile.local,
        keyEnv: profile.local ? null : keyEnv,
        tier: profile.local ? 'local' : (keyEnv ? 'paid' : 'keyless'),
        modelCount: models.length,
        freeTier: profile.local ? 'Local server.' : undefined,
        pricedModels: models.some(m => m && (m.inputPrice || m.outputPrice))
      })
    });
  }

  const entries = [...byId.values()];
  // Stable, useful ordering: by tier (free/keyless/local first), then name.
  const tierRank = Object.fromEntries(TIERS.map((t, i) => [t, i]));
  entries.sort((a, b) => ((tierRank[a.tier] ?? 99) - (tierRank[b.tier] ?? 99)) || a.name.localeCompare(b.name));
  return entries;
}

/**
 * Filter catalog entries.
 * @param {Array} entries
 * @param {object} [f]
 *   @param {string} [f.query]   case-insensitive match on id/name/model ids
 *   @param {string} [f.tier]    one of TIERS
 *   @param {boolean}[f.configured] only configured
 *   @param {boolean}[f.hasKey]  only those with a resolvable key
 *   @param {boolean}[f.free]    only free/keyless/local tiers
 */
function filter(entries, f = {}) {
  const q = String(f.query || '').toLowerCase();
  const freeTiers = new Set(['free', 'keyless', 'local']);
  return entries.filter(e => {
    if (f.tier && e.tier !== f.tier) return false;
    if (f.free && !freeTiers.has(e.tier)) return false;
    if (f.configured && !e.configured) return false;
    if (f.hasKey && !e.hasKey) return false;
    if (q) {
      const models = (e._models || []).map(m => m && m.id).join(' ');
      const hay = (e.id + ' ' + e.name + ' ' + (e.keyEnv || '') + ' ' + models).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Find an entry by exact id or case-insensitive id/name. */
function find(entries, idOrName) {
  const q = String(idOrName || '').toLowerCase();
  if (!q) return null;
  return entries.find(e => e.id === q) || entries.find(e => e.id.toLowerCase() === q) ||
    entries.find(e => e.name.toLowerCase() === q) || null;
}

module.exports = { all, filter, find, TIERS, categoryToTier, variantsFor };
