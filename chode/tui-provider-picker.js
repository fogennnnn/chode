'use strict';
/**
 * tui-provider-picker.js
 *
 * The native in-TUI provider picker screen. Two stages:
 *   1. provider  — the full unified catalog (search + tier filter)
 *   2. variant   — for providers with multiple access modes (e.g. OVH free vs
 *                  OVH API key/credits), choose which mode to set up.
 *
 * Pure state + key + render, so it is unit-testable without a terminal. The
 * TUI (workspace-view / workspace-tui) drives it and renders `render()`'s
 * output into the workspace body area.
 */

const catalog = require('./provider-catalog');
const FILTERS = ['all', 'free', 'keyless', 'local', 'paid', 'configured'];

function create(entries) {
  const s = { stage: 'provider', entries: entries || [], query: '', filter: 'all', cursor: 0, scroll: 0, results: [], entry: null, vcursor: 0 };
  filterResults(s);
  return s;
}

function filterResults(s) {
  const spec = { query: s.query };
  if (s.filter && s.filter !== 'all') spec.tier = s.filter;
  s.results = catalog.filter(s.entries, spec);
  if (s.cursor >= s.results.length) s.cursor = Math.max(0, s.results.length - 1);
  clamp(s, s.visible || 10);
}

function clamp(s, visible) {
  visible = visible || 10;
  const list = s.stage === 'variant' ? (s.entry && s.entry.variants) : s.results;
  const len = list.length;
  if (s.scroll > Math.max(0, len - visible)) s.scroll = Math.max(0, len - visible);
  const cur = s.stage === 'variant' ? s.vcursor : s.cursor;
  if (cur < s.scroll) s.scroll = cur;
  if (cur >= s.scroll + visible) s.scroll = cur - visible + 1;
}

function providerIcon(e) {
  if (e.requiresKey) return e.hasKey ? '\u25CF' : '\u25CB';
  if (e.tier === 'local') return (e.localUp ? '\u25CF' : '\u25D7');
  return '\u2713';
}
function variantIcon(v) { return v.requiresKey ? '\u25CB' : '\u2713'; }
function providerStatus(e) {
  const b = [];
  if (e.requiresKey) b.push(e.hasKey ? 'key set' : 'no key');
  else if (e.tier === 'local') b.push(e.localUp ? 'local up' : 'local down');
  else b.push('keyless');
  if (e.configured) b.push('configured');
  if (e.variants && e.variants.length > 1) b.push(e.variants.length + ' modes');
  return b.join(', ');
}
function providerLine(e, selected) {
  return (selected ? '\u25B6 ' : '  ') + providerIcon(e) + ' ' + String(e.id).padEnd(18) + String(e.tier).padEnd(9) + e.name + '  [' + providerStatus(e) + ']';
}
function variantLine(v, selected) {
  return (selected ? '\u25B6 ' : '  ') + variantIcon(v) + ' ' + v.label + (v.note ? '  \u2014  ' + v.note : '');
}

/**
 * Pure key handler. Mutates `s`; returns {type:'select',id,variantIndex,wizardId}
 * | {type:'cancel'} | null.
 */
function handle(s, key = {}, text = '') {
  const k = key.name || '', ctrl = !!key.ctrl;
  if (s.stage === 'variant') {
    const n = s.entry.variants.length;
    if (k === 'escape' || (k === 'c' && ctrl) || text === 'b') {
      s.stage = 'provider';
      const idx = s.results.findIndex(e => e.id === s.entry.id);
      s.cursor = Math.max(0, idx); s.entry = null; clamp(s, s.visible || 10);
      return null;
    }
    if (k === 'up' || (text === 'k' && !ctrl)) { s.vcursor = Math.max(0, s.vcursor - 1); return null; }
    if (k === 'down' || (text === 'j' && !ctrl)) { s.vcursor = Math.min(n - 1, s.vcursor + 1); return null; }
    if (k === 'return' || k === 'enter') {
      const v = s.entry.variants[s.vcursor];
      return { type: 'select', id: s.entry.id, variantIndex: s.vcursor, wizardId: (v && v.profileId) ? v.profileId : s.entry.id };
    }
    return null;
  }
  // stage: provider
  if (k === 'escape' || (k === 'c' && ctrl)) return { type: 'cancel' };
  if (k === 'return' || k === 'enter') {
    const e = s.results[s.cursor]; if (!e) return null;
    if (e.variants && e.variants.length > 1) { s.stage = 'variant'; s.entry = e; s.vcursor = 0; s.scroll = 0; return null; }
    return { type: 'select', id: e.id, variantIndex: 0, wizardId: e.id };
  }
  if (k === 'up' || (text === 'k' && !ctrl)) { s.cursor = Math.max(0, s.cursor - 1); clamp(s, s.visible || 10); return null; }
  if (k === 'down' || (text === 'j' && !ctrl)) { s.cursor = Math.min(s.results.length - 1, s.cursor + 1); clamp(s, s.visible || 10); return null; }
  if (k === 'pageup' || text === 'u') { s.cursor = Math.max(0, s.cursor - 10); clamp(s, s.visible || 10); return null; }
  if (k === 'pagedown' || text === 'd') { s.cursor = Math.min(s.results.length - 1, s.cursor + 10); clamp(s, s.visible || 10); return null; }
  if (text === 'f' && k === 'f') { s.filter = FILTERS[(FILTERS.indexOf(s.filter) + 1) % FILTERS.length]; s.cursor = 0; filterResults(s); return null; }
  if (k === 'backspace' || k === 'delete') { s.query = s.query.slice(0, -1); filterResults(s); return null; }
  if (text && !ctrl) { let changed = false; for (const ch of String(text)) if (ch.length === 1 && ch >= ' ') { s.query += ch; changed = true; } if (changed) { s.cursor = 0; filterResults(s); } }
  return null;
}

/**
 * Pure render. Returns { lines (exactly bodyHeight strings, pre-fit), cursorRow (0-based) }.
 */
function render(s, mainWidth, bodyHeight) {
  s.visible = Math.max(1, bodyHeight - 4);
  const lines = [];
  const push = (t) => lines.push(t);
  if (s.stage === 'variant') {
    push('  ' + s.entry.name + ' \u00b7 choose access mode');
    push('');
    const list = s.entry.variants;
    clamp(s, s.visible);
    for (let i = s.scroll; i < Math.min(list.length, s.scroll + s.visible); i++) push('  ' + variantLine(list[i], i === s.vcursor));
    push('');
    push('  up/down choose \u00b7 enter select \u00b7 b/esc back');
  } else {
    push('  Connect a provider');
    push('  ' + (s.filter === 'all' ? '' : 'filter: ' + s.filter + '  ') + 'search: "' + s.query + '"  \u00b7  ' + s.results.length + ' of ' + s.entries.length);
    push('');
    clamp(s, s.visible);
    for (let i = s.scroll; i < Math.min(s.results.length, s.scroll + s.visible); i++) push('  ' + providerLine(s.results[i], i === s.cursor));
    push('');
    push('  up/down move \u00b7 type search \u00b7 f filter \u00b7 enter select \u00b7 esc cancel');
  }
  while (lines.length < bodyHeight) lines.push('');
  // cursor row: find the highlighted line
  let cursorRow = 0;
  for (let i = 0; i < lines.length; i++) if (lines[i].slice(0, 4).includes('\u25B6')) { cursorRow = i; break; }
  return { lines: lines.slice(0, bodyHeight).map(l => String(l)), cursorRow };
}

module.exports = { create, handle, render, filterResults, FILTERS };
