'use strict';
/**
 * provider-picker.js
 *
 * A dependency-free interactive provider picker for the terminal.
 *
 *   Up/Down (or j/k)  move the cursor
 *   type              search (id, name, model, env key)
 *   Backspace         edit search
 *   f                 cycle the tier filter (all, free, keyless, local, paid, configured)
 *   PgUp/PgDn (or u/d) scroll the window
 *   Enter             select
 *   Esc / q           cancel
 *
 * The interactive logic is split into a pure core (createState / handleKey /
 * render) that is unit-testable without a terminal, and a thin `select()` that
 * wires that core to a raw-mode TTY. When the input is not a TTY, `select()`
 * falls back to a numbered prompt list via a provided `ask`.
 */

const readline = require('readline');
const catalog = require('./provider-catalog');

const FILTERS = ['all', 'free', 'keyless', 'local', 'paid', 'configured'];

function createState(opts = {}) {
  const entries = opts.entries || [];
  const state = {
    entries,
    query: String(opts.query || ''),
    filter: opts.filter || 'all',
    cursor: 0,
    scroll: 0,
    results: [],
    done: null
  };
  applyQuery(state);
  return state;
}

function applyQuery(state) {
  const spec = { query: state.query };
  if (state.filter && state.filter !== 'all') spec.tier = state.filter;
  state.results = catalog.filter(state.entries, spec);
  if (state.cursor >= state.results.length) state.cursor = Math.max(0, state.results.length - 1);
  clampScroll(state);
}

function clampScroll(state, visible) {
  visible = visible || state.visible || 10;
  if (state.scroll > Math.max(0, state.results.length - visible)) state.scroll = Math.max(0, state.results.length - visible);
  if (state.cursor < state.scroll) state.scroll = state.cursor;
  if (state.cursor >= state.scroll + visible) state.scroll = state.cursor - visible + 1;
}

function statusIcon(e) {
  if (e.requiresKey) return e.hasKey ? '\u25CF' : '\u25CB';           // ● configured+key  ○ needs key
  if (e.tier === 'local') return (e.localUp ? '\u25CF' : '\u25D7');   // ● local up  ▸ local down
  return '\u2713';                                                   // ✓ keyless
}

function statusText(e) {
  const bits = [];
  if (e.requiresKey) bits.push(e.hasKey ? 'key set' : 'no key');
  else if (e.tier === 'local') bits.push(e.localUp ? 'local up' : 'local down');
  else bits.push('keyless');
  if (e.configured) bits.push('configured');
  if (e.variants && e.variants.length > 1) bits.push(e.variants.length + ' modes');
  return bits.join(', ');
}

function lineFor(e, selected) {
  const icon = statusIcon(e);
  const idCol = String(e.id).padEnd(20);
  const tierCol = String(e.tier).padEnd(10);
  const marker = selected ? '\u25B6 ' : '  ';
  return marker + icon + ' ' + idCol + tierCol + e.name + '  [' + statusText(e) + ']';
}

/**
 * Pure render. Returns { lines, cursorRow, cursorCol, selected, total, shown }.
 * `columns`/`rows` size the visible window; the list scrolls to keep the cursor.
 */
function render(state, columns = 80, rows = 24) {
  const header = [
    'Chode \u00b7 connect a provider',
    (state.filter === 'all' ? '' : 'filter: ' + state.filter + '  ') + 'search: "' + state.query + '"  \u00b7  ' + state.results.length + ' of ' + state.entries.length,
    'up/down move \u00b7 type to search \u00b7 f filter \u00b7 enter select \u00b7 esc/q cancel'
  ];
  const footer = 2; // blank + hint
  const visible = Math.max(1, rows - header.length - footer);
  state.visible = visible;
  clampScroll(state, visible);
  const start = state.scroll;
  const end = Math.min(state.results.length, start + visible);
  const list = [];
  for (let i = start; i < end; i++) list.push(lineFor(state.results[i], i === state.cursor));
  const pad = [];
  for (let i = end; i < state.results.length; i++) pad.push('');
  const lines = header.concat(list, pad);
  while (lines.length < rows) lines.push('');
  const cursorRow = header.length + (state.cursor - start);
  return {
    lines: lines.slice(0, rows),
    cursorRow: Math.min(cursorRow, rows - 1),
    cursorCol: 1,
    selected: state.results[state.cursor] || null,
    total: state.entries.length,
    shown: state.results.length
  };
}

/**
 * Pure key handler. Mutates `state`; returns 'result' | 'cancel' | null.
 * `key` is a readline keypress key object; `text` is the raw char.
 */
function handleKey(state, key = {}, text = '') {
  const k = key.name || '';
  const ctrl = !!key.ctrl;
  if (k === 'escape' || (k === 'c' && ctrl) || text === 'q' && k === 'q') { state.done = null; return 'cancel'; }
  if (k === 'return' || k === 'enter') { state.done = state.results[state.cursor] ? { id: state.results[state.cursor].id, entry: state.results[state.cursor], variantIndex: 0 } : null; return state.done ? 'result' : null; }
  if (k === 'up' || (text === 'k' && !ctrl)) { state.cursor = Math.max(0, state.cursor - 1); clampScroll(state); return null; }
  if (k === 'down' || (text === 'j' && !ctrl)) { state.cursor = Math.min(state.results.length - 1, state.cursor + 1); clampScroll(state); return null; }
  if (k === 'pageup' || text === 'u') { state.cursor = Math.max(0, state.cursor - (state.visible || 10)); clampScroll(state); return null; }
  if (k === 'pagedown' || text === 'd') { state.cursor = Math.min(state.results.length - 1, state.cursor + (state.visible || 10)); clampScroll(state); return null; }
  if (text === 'f' && k === 'f') { state.filter = FILTERS[(FILTERS.indexOf(state.filter) + 1) % FILTERS.length]; state.cursor = 0; applyQuery(state); return null; }
  if (k === 'backspace' || k === 'delete') { state.query = state.query.slice(0, -1); applyQuery(state); return null; }
  if (k === 'tab') { state.cursor = Math.min(state.results.length - 1, state.cursor + 1); clampScroll(state); return null; }
  // printable char -> type-to-search
  if (text && !ctrl && text.length === 1 && text >= ' ') { state.query += text; state.cursor = 0; applyQuery(state); return null; }
  return null;
}

/**
 * Interactive selection. Uses raw-mode keypress on `input`/`output`.
 * Returns {id, entry, variantIndex} or null (cancelled / no selection).
 * If `input` is not a TTY, falls back to a numbered `ask` list.
 */
async function select(input, output, opts = {}) {
  const entries = opts.entries || [];
  if (!entries.length) return null;
  if (!input.isTTY || !output.isTTY) return fallback(input, output, entries, opts);

  const state = createState({ entries, query: opts.query, filter: opts.filter });
  let closed = false;
  input.setRawMode(true);
  readline.emitKeypressEvents(input);

  return await new Promise(resolve => {
    function paint() {
      const r = render(state, output.columns || 80, output.rows || 24);
      const rows = r.lines.map((l, i) => (i === r.cursorRow ? '\x1b[7m' + l + '\x1b[27m' : l));
      output.write('\x1b[H' + rows.map(l => l + '\x1b[K').join('\r\n') + '\r\n\x1b[0m');
    }
    function onKey(text, key) {
      const effect = handleKey(state, key, text);
      if (effect === 'cancel') return finish(null);
      if (effect === 'result') return finish(state.done);
      paint();
    }
    function finish(result) {
      if (closed) return; closed = true;
      try { input.setRawMode(false); } catch (e) {}
      input.removeListener('keypress', onKey);
      output.removeListener('resize', paint);
      output.write('\x1b[?25h');
      resolve(result);
    }
    input.on('keypress', onKey);
    output.on('resize', paint);
    paint();
  });
}

async function fallback(input, output, entries, opts) {
  const ask = opts.ask || (async q => (opts.askFn ? opts.askFn(q) : null));
  const state = createState({ entries, query: opts.query, filter: opts.filter });
  const items = state.results.map(e => e.id).concat(['cancel']);
  const answer = await ask({ title: 'Select a provider (type an id or a number):', options: items.slice(0, 40) });
  if (answer == null) return null;
  const n = Number(answer);
  let entry = (Number.isInteger(n) && n >= 1 && n <= state.results.length) ? state.results[n - 1]
    : state.results.find(e => e.id.toLowerCase() === String(answer).toLowerCase());
  if (!entry) return null;
  return { id: entry.id, entry, variantIndex: 0 };
}

module.exports = { select, render, handleKey, createState, applyQuery, lineFor, statusIcon, statusText, FILTERS };
