'use strict';

// Slice 6 — core tools (keyless GET + JSON only, stdlib https):
// dev-recon, geocode, weather, forex. Each: timeout, output cap, quiet
// failures. Tests mock __testHooks.httpsGet — never hit the network.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

async function fixture() {
  const chode = require('../chode.js');
  const hooks = chode.__testHooks;
  const seen = [];
  function mock(map) {
    hooks.httpsGet = async (host, urlPath, headers, timeoutMs) => {
      seen.push({ host, urlPath, headers, timeoutMs });
      const key = host + urlPath.split('?')[0];
      if (map[key]) return map[key]();
      return { ok: false, error: 'HTTP 404' };
    };
  }

  // ── TOOLS manifest follows the existing definition pattern ──
  for (const t of ['dev-recon', 'geocode', 'weather', 'forex']) {
    assert.ok(chode.TOOLS[t] && chode.TOOLS[t].desc, t + ' in manifest');
  }
  for (const c of chode.parseToolCalls('```tool\n[{"tool":"dev-recon","args":{"action":"search","query":"x"}},{"tool":"geocode","args":{"query":"y"}},{"tool":"weather","args":{"lat":1,"lon":2}},{"tool":"forex","args":{}}]\n```')) {
    assert.ok(chode.TOOLS[c.tool], c.tool + ' parses');
  }

  // ── dev-recon: github search + repo/commits + cdnjs + endoflife.date ──
  mock({
    'api.github.com/search/repositories': () => ({
      ok: true, status: 200,
      data: { items: [{ full_name: 'a/b', stargazers_count: 42, html_url: 'https://github.com/a/b', description: 'd' }] },
    }),
    'api.github.com/repos/a/b': () => ({ ok: true, status: 200, data: { stargazers_count: 42, description: 'd', updated_at: '2026-01-01' } }),
    'api.github.com/repos/a/b/commits': () => ({ ok: true, status: 200, data: [{ sha: 'abc1234', commit: { message: 'fix it\nbody', author: { date: '2026-01-02' } } }] }),
    'api.cdnjs.com/libraries': () => ({ ok: true, status: 200, data: { results: [{ name: 'jquery', latest: 'https://x/3.js', description: 'lib' }] } }),
    'endoflife.date/api/nodejs.json': () => ({ ok: true, status: 200, data: { latest: '22', eol: '2027-04-30', latestReleaseDate: '2026-01-01' } }),
  });
  let r = await chode.toolDevReconAsync({ action: 'search', query: 'http client' });
  assert.ok(r.ok && r.repos.length === 1 && r.repos[0].fullName === 'a/b', 'github search, got ' + JSON.stringify(r));
  assert.ok(seen[0].headers['User-Agent'] === 'chode/1.0', 'github UA header');
  assert.ok(typeof seen[0].timeoutMs === 'number', 'timeout plumbed');
  r = await chode.toolDevReconAsync({ action: 'repo', repo: 'a/b' });
  assert.ok(r.ok && r.commits[0].sha === 'abc1234' && r.commits[0].msg === 'fix it', 'repo + commits, got ' + JSON.stringify(r));
  r = await chode.toolDevReconAsync({ action: 'cdnjs', query: 'jquery' });
  assert.ok(r.ok && r.libraries[0].name === 'jquery', 'cdnjs, got ' + JSON.stringify(r));
  r = await chode.toolDevReconAsync({ action: 'eol', product: 'nodejs' });
  assert.ok(r.ok && r.latest === '22', 'endoflife, got ' + JSON.stringify(r));
  assert.strictEqual((await chode.toolDevReconAsync({ action: 'repo', repo: 'nope' })).ok, false, 'bad repo fails closed, no network');
  assert.strictEqual((await chode.toolDevReconAsync({ action: 'bogus' })).ok, false, 'unknown action fails closed');

  // ── geocode: nominatim, User-Agent chode/1.0, 1 RPS throttle ──
  mock({
    'nominatim.openstreetmap.org/search': () => ({ ok: true, status: 200, data: [{ display_name: 'Oslo, Norway', lat: '59.91', lon: '10.75', type: 'city' }] }),
  });
  seen.length = 0;
  r = await chode.toolGeocodeAsync({ query: 'Oslo' });
  assert.ok(r.ok && r.results[0].lat === '59.91', 'geocode hit, got ' + JSON.stringify(r));
  assert.strictEqual(seen[0].headers['User-Agent'], 'chode/1.0', 'nominatim UA must be chode/1.0');
  const t0 = Date.now();
  await chode.toolGeocodeAsync({ query: 'Oslo' });
  const gap = Date.now() - t0;
  assert.ok(gap >= 800, '1 RPS throttle enforced, gap ' + gap + 'ms');
  assert.strictEqual((await chode.toolGeocodeAsync({})).ok, false, 'empty query fails closed');

  // ── weather: open-meteo + weather.gov fallback ──
  mock({
    'api.open-meteo.com/v1/forecast': () => ({
      ok: true, status: 200,
      data: { current: { temperature_2m: 12.5, relative_humidity_2m: 60, weather_code: 1, wind_speed_10m: 9 }, daily: { temperature_2m_max: [14], temperature_2m_min: [6], precipitation_probability_max: [20] } },
    }),
  });
  r = await chode.toolWeatherAsync({ lat: 59.9, lon: 10.7 });
  assert.ok(r.ok && r.source === 'open-meteo' && r.current.tempC === 12.5 && r.today.maxC === 14, 'open-meteo, got ' + JSON.stringify(r));
  mock({
    'api.open-meteo.com/v1/forecast': () => ({ ok: false, error: 'HTTP 500' }),
    'api.weather.gov/points/40,-74': () => ({ ok: true, status: 200, data: { properties: { forecast: 'https://api.weather.gov/gridpoints/OKX/1,1/forecast' } } }),
    'api.weather.gov/gridpoints/OKX/1,1/forecast': () => ({ ok: true, status: 200, data: { properties: { periods: [{ name: 'Tonight', temperature: 50, shortForecast: 'Clear', detailedForecast: 'Clear skies.' }] } } }),
  });
  r = await chode.toolWeatherAsync({ lat: 40, lon: -74 });
  assert.ok(r.ok && r.source === 'weather.gov' && r.periods[0].tempF === 50, 'weather.gov fallback, got ' + JSON.stringify(r));
  assert.strictEqual((await chode.toolWeatherAsync({ lat: 999, lon: 0 })).ok, false, 'bad coords fail closed');

  // ── forex: open.er-api.com, symbol cap ──
  mock({
    'open.er-api.com/v6/latest/USD': () => ({
      ok: true, status: 200,
      data: { result: 'success', base_code: 'USD', time_last_update_utc: 'now', rates: { EUR: 0.9, NOK: 10.5, SEK: 9.5 } },
    }),
  });
  r = await chode.toolForexAsync({ base: 'USD', symbols: 'EUR,NOK' });
  assert.ok(r.ok && r.rates.EUR === 0.9 && r.rates.NOK === 10.5 && r.rates.SEK === undefined, 'symbol cap, got ' + JSON.stringify(r));

  // ── quiet failures: HTTP errors never throw ──
  mock({});
  for (const call of [
    chode.toolDevReconAsync({ action: 'search', query: 'x' }),
    chode.toolGeocodeAsync({ query: 'x' }),
    chode.toolWeatherAsync({ lat: 1, lon: 1 }),
    chode.toolForexAsync({}),
  ]) {
    const out = await call;
    assert.strictEqual(out.ok, false, 'quiet failure, got ' + JSON.stringify(out));
  }

  // ── agent-loop dispatch for all four (unit-level, mocked network) ──
  mock({
    'api.github.com/search/repositories': () => ({ ok: true, status: 200, data: { items: [] } }),
    'nominatim.openstreetmap.org/search': () => ({ ok: true, status: 200, data: [] }),
    'api.open-meteo.com/v1/forecast': () => ({ ok: true, status: 200, data: { current: {}, daily: {} } }),
    'open.er-api.com/v6/latest/USD': () => ({ ok: true, status: 200, data: { result: 'success', rates: {} } }),
  });
  const ctx = { actions: {} };
  assert.ok((await chode.runAgentTool({ tool: 'dev-recon', args: { action: 'search', query: 'x' } }, ctx)).ok, 'loop dev-recon');
  assert.ok((await chode.runAgentTool({ tool: 'geocode', args: { query: 'x' } }, ctx)).ok, 'loop geocode');
  assert.ok((await chode.runAgentTool({ tool: 'weather', args: { lat: 1, lon: 1 } }, ctx)).ok, 'loop weather');
  assert.ok((await chode.runAgentTool({ tool: 'forex', args: {} }, ctx)).ok, 'loop forex');

  hooks.httpsGet = null;
  chode.__resetBoundedForTest();
  console.log('✓ v2 core tools: dev-recon, geocode(+throttle), weather(+fallback), forex — mocked, quiet');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-v2-corelib-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
