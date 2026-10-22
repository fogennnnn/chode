'use strict';
// Zero-dependency browser verification for generated sites.
//
// A static HTML review cannot prove that a button works, that a script parses
// at runtime, or that the mobile layout does not overflow. This module serves
// the workspace over a short-lived local HTTP server, drives Chromium through
// the DevTools Protocol (Node 22+ global WebSocket), and reports observable
// failures that the existing repair loop can act on. Screenshots are saved for
// human inspection; canvas pixels are sampled too, so a transparent or uniform
// canvas cannot pass merely by existing. The checks themselves stay deterministic.

const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const zlib = require('zlib');
const { spawn, spawnSync } = require('child_process');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true }
];

const INTERACTION_REQUEST = /\b(?:form|contact\s+form|submit|filter|calculator|todo|shopping|cart|toggle|interactive|click|sign\s*up|signup|booking|reservation|newsletter|login|dashboard|quiz|game|slider|dropdown|search\s+(?:box|field|input)|add\s+(?:item|task|to\s+cart)|create\s+(?:task|item|account))\b/i;
const PRIMARY_ACTION = /\b(?:add|create|submit|save|send|start|search|filter|apply|calculate|toggle|open|close|show|hide|play|pause|next|previous|book|reserve|subscribe|sign\s*up|log\s*in|update|generate|run|check)\b/i;
const DESTRUCTIVE_ACTION = /\b(?:delete|remove|reset|clear|cancel|buy|pay|purchase|logout|log\s*out|sign\s*out|download|unsubscribe|destroy|drop)\b/i;

function timeoutMs(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 20000;
  return Math.max(1000, Math.min(120000, Math.floor(n)));
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function pathExists(file) {
  try { fs.accessSync(file, fs.constants.X_OK); return true; } catch (e) { return false; }
}

function findBrowser() {
  if (process.env.CHODE_CHROMIUM) {
    if (pathExists(process.env.CHODE_CHROMIUM)) return process.env.CHODE_CHROMIUM;
  }
  const names = ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome', 'chrome', 'msedge', 'microsoft-edge'];
  for (const name of names) {
    const found = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], {
      encoding: 'utf8', timeout: 3000, windowsHide: true
    });
    if (found.status === 0) {
      const first = String(found.stdout || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean)[0];
      if (first && pathExists(first)) return first;
    }
  }
  const known = process.platform === 'win32'
    ? [
        path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      ]
    : [
        '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
        '/snap/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      ];
  for (const file of known) {
    if (file && pathExists(file)) return file;
  }
  return null;
}

function available() {
  return typeof WebSocket === 'function' && !!findBrowser();
}

function unavailableReason() {
  if (typeof WebSocket !== 'function') return 'Node.js global WebSocket is unavailable';
  if (!findBrowser()) return 'no supported Chromium/Chrome executable was found';
  return '';
}

function safeFile(root, urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(String(urlPath || '/')); }
  catch (e) { return null; }
  decoded = decoded.split('?')[0].split('#')[0];
  const rel = path.posix.normalize('/' + decoded.replace(/^\/+/, ''));
  if (rel.split('/').includes('..')) return null;
  const full = path.join(root, rel.replace(/^\/+/, ''));
  const rootResolved = path.resolve(root);
  const fullResolved = path.resolve(full);
  if (fullResolved !== rootResolved && !fullResolved.startsWith(rootResolved + path.sep)) return null;
  return fullResolved;
}

function startServer(root, virtual) {
  const pages = virtual || new Map();
  const server = http.createServer(function (req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Method not allowed');
      return;
    }
    let pathname = '/';
    try { pathname = new URL(req.url, 'http://127.0.0.1').pathname; } catch (e) {}
    if (pathname === '/favicon.ico') {
      res.writeHead(204, { 'cache-control': 'no-store' });
      res.end();
      return;
    }
    if (pages.has(pathname)) {
      const body = Buffer.from(String(pages.get(pathname) || ''), 'utf8');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': body.length, 'cache-control': 'no-store' });
      if (req.method === 'HEAD') res.end(); else res.end(body);
      return;
    }
    let file = safeFile(root, pathname);
    if (file) {
      try {
        if (!fs.existsSync(file)) file = null;
        else if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      } catch (e) { file = null; }
    }
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      res.end('Not found');
      return;
    }
    let body;
    try { body = fs.readFileSync(file); }
    catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Read failed');
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': body.length,
      'cache-control': 'no-store'
    });
    if (req.method === 'HEAD') res.end(); else res.end(body);
  });
  return new Promise(function (resolve, reject) {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', function () {
      const address = server.address();
      resolve({ server: server, base: 'http://127.0.0.1:' + address.port });
    });
  });
}

function closeServer(server) {
  return new Promise(function (resolve) {
    if (!server) return resolve();
    try { server.close(function () { resolve(); }); } catch (e) { resolve(); }
  });
}

function launchBrowser(bin, userDataDir, waitMs) {
  return new Promise(function (resolve, reject) {
    const args = [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      '--metrics-recording-only',
      '--safebrowsing-disable-auto-update',
      '--user-data-dir=' + userDataDir,
      '--remote-debugging-port=0',
      'about:blank'
    ];
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    let stderr = '';
    let settled = false;
    const timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      try { child.kill('SIGKILL'); } catch (e) {}
      reject(new Error('Chromium did not expose a DevTools endpoint: ' + stderr.slice(-800)));
    }, waitMs);
    child.once('error', function (error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', function (code) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error('Chromium exited before DevTools was ready (code ' + code + '): ' + stderr.slice(-800)));
    });
    child.stderr.on('data', function (chunk) {
      stderr += String(chunk);
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ child: child, wsUrl: match[1] });
      }
    });
  });
}

class CDP {
  constructor(wsUrl, waitMs) {
    this.wsUrl = wsUrl;
    this.waitMs = waitMs;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.events = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      const timer = setTimeout(function () { reject(new Error('DevTools WebSocket connection timed out')); }, this.waitMs);
      ws.onopen = () => { clearTimeout(timer); resolve(this); };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('DevTools WebSocket connection failed')); };
      ws.onmessage = (event) => this._message(event);
      ws.onclose = () => {
        for (const item of this.pending.values()) {
          clearTimeout(item.timer);
          item.reject(new Error('DevTools connection closed'));
        }
        this.pending.clear();
      };
    });
  }

  _message(event) {
    let message;
    try {
      const raw = typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8');
      message = JSON.parse(raw);
    } catch (e) { return; }
    if (message.id && this.pending.has(message.id)) {
      const item = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(item.method + ': ' + (message.error.message || 'DevTools error')));
      else item.resolve(message.result || {});
      return;
    }
    if (!message.method) return;
    this.events.push(message);
    for (const listener of Array.from(this.listeners)) {
      if (listener.method !== message.method) continue;
      if (listener.sessionId && listener.sessionId !== message.sessionId) continue;
      this.listeners.delete(listener);
      clearTimeout(listener.timer);
      listener.resolve(message.params || {});
    }
  }

  send(method, params, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(method + ' timed out'));
      }, this.waitMs);
      this.pending.set(id, { resolve: resolve, reject: reject, timer: timer, method: method });
      const message = { id: id, method: method, params: params || {} };
      if (sessionId) message.sessionId = sessionId;
      try { this.ws.send(JSON.stringify(message)); }
      catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e);
      }
    });
  }

  waitFor(method, sessionId, waitMs) {
    return new Promise((resolve, reject) => {
      const listener = {
        method: method,
        sessionId: sessionId || null,
        resolve: resolve,
        reject: reject,
        timer: null
      };
      listener.timer = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(method + ' timed out'));
      }, Math.max(1000, Number(waitMs) || this.waitMs));
      this.listeners.add(listener);
    });
  }

  close() {
    try { this.ws.close(); } catch (e) {}
  }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression: expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true
  }, sessionId);
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception && (result.exceptionDetails.exception.description || result.exceptionDetails.exception.value);
    throw new Error(String(description || result.exceptionDetails.text || 'page evaluation failed').slice(0, 500));
  }
  return result.result ? result.result.value : undefined;
}

const STATE_EXPR = `(() => {
  const parts = [document.documentElement.outerHTML, location.href];
  for (const el of document.querySelectorAll('input,textarea,select')) {
    parts.push(el.tagName + ':' + (el.type || '') + ':' + (el.checked ? '1' : '0') + ':' + (el.value || ''));
  }
  const s = parts.join('\\u0001');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) + ':' + s.length;
})()`;

const SNAPSHOT = `(() => {
  const visible = (el) => {
    if (!el || el.disabled) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  };
  const nameOf = (el) => String(
    el.getAttribute('aria-label') ||
    el.getAttribute('title') ||
    (el.labels && el.labels.length ? Array.from(el.labels).map(l => l.textContent).join(' ') : '') ||
    el.textContent ||
    el.value ||
    el.getAttribute('name') ||
    el.getAttribute('placeholder') ||
    ''
  ).replace(/\\s+/g, ' ').trim().slice(0, 120);
  const labelFor = (el) => {
    if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title')) return true;
    if (el.labels && el.labels.length) return true;
    if (el.closest('label')) return true;
    return false;
  };
  const fieldData = [...document.querySelectorAll('input,textarea,select')].filter(visible).map((el, index) => {
    el.setAttribute('data-chode-field', String(index));
    return {
      index: index,
      tag: el.tagName.toLowerCase(),
      type: String(el.getAttribute('type') || '').toLowerCase(),
      name: nameOf(el),
      labelled: labelFor(el),
      required: !!el.required
    };
  });
  const buttons = [...document.querySelectorAll('button,[role="button"],input[type="submit"],input[type="button"]')].filter(visible).map((el, index) => {
    el.setAttribute('data-chode-action', String(index));
    return {
      index: index,
      tag: el.tagName.toLowerCase(),
      type: String(el.getAttribute('type') || '').toLowerCase(),
      name: nameOf(el),
      disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true'
    };
  });
  const images = [...document.images].filter(visible).map((img) => ({
    src: String(img.currentSrc || img.src || '').slice(0, 300),
    alt: img.getAttribute('alt'),
    broken: !!img.complete && img.naturalWidth === 0
  }));
  const missingAnchors = [];
  for (const a of document.querySelectorAll('a[href^="#"]')) {
    const href = a.getAttribute('href');
    if (!href || href === '#') continue;
    let id;
    try { id = decodeURIComponent(href.slice(1)); } catch (e) { id = href.slice(1); }
    if (!id) continue;
    if (!document.getElementById(id) && !document.getElementsByName(id).length) missingAnchors.push(id);
  }
  const canvases = [...document.querySelectorAll('canvas')].filter((el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 1 && rect.height > 1;
  }).map((el, index) => {
    const rect = el.getBoundingClientRect();
    const item = { index: index, width: el.width, height: el.height, displayWidth: Math.round(rect.width), displayHeight: Math.round(rect.height), sample: null };
    try {
      const area = Number(el.width) * Number(el.height);
      if (area > 0 && area <= 16000000) {
        const ctx = el.getContext('2d');
        if (ctx) {
          const data = ctx.getImageData(0, 0, el.width, el.height).data;
          const step = Math.max(1, Math.floor(Math.sqrt(area / 6000)));
          let opaque = 0, pixels = 0, sum = 0, sumSq = 0, min = 255, max = 0;
          const colors = new Set();
          for (let y = 0; y < el.height; y += step) {
            for (let x = 0; x < el.width; x += step) {
              const i = (y * el.width + x) * 4;
              const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
              if (a > 8) opaque++;
              colors.add((r >> 4) + ',' + (g >> 4) + ',' + (b >> 4) + ',' + (a >> 6));
              const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              sum += l; sumSq += l * l; pixels++;
              if (l < min) min = l;
              if (l > max) max = l;
            }
          }
          item.sample = { kind: '2d', pixels: pixels, opaque: opaque, ratio: pixels ? opaque / pixels : 0, colors: colors.size, variance: pixels ? sumSq / pixels - Math.pow(sum / pixels, 2) : 0, range: max - min };
        }
      }
    } catch (error) { item.sample = { kind: 'unreadable', error: String(error && error.message || error).slice(0, 160) }; }
    return item;
  });
  const root = document.documentElement;
  return {
    ready: document.readyState,
    title: String(document.title || '').trim(),
    bodyText: document.body ? String(document.body.innerText || '').replace(/\\s+/g, ' ').trim() : '',
    forms: document.forms.length,
    fields: fieldData,
    buttons: buttons,
    images: images,
    missingAnchors: [...new Set(missingAnchors)],
    canvases: canvases,
    overflow: Math.max(root.scrollWidth, document.body ? document.body.scrollWidth : 0) - root.clientWidth,
    href: location.href,
    hash: (() => {
      const parts = [root.outerHTML, location.href];
      for (const el of document.querySelectorAll('input,textarea,select')) {
        parts.push(el.tagName + ':' + (el.type || '') + ':' + (el.checked ? '1' : '0') + ':' + (el.value || ''));
      }
      const s = parts.join('\\u0001');
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return (h >>> 0) + ':' + s.length;
    })()
  };
})()`;

const PREPARE = `((index) => {
  const visible = (el) => {
    if (!el || el.disabled) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  };
  const setValue = (el, value) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value') && Object.getOwnPropertyDescriptor(proto, 'value').set;
    if (setter) setter.call(el, value); else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  for (const el of [...document.querySelectorAll('input,textarea,select')].filter(visible)) {
    const type = String(el.getAttribute('type') || '').toLowerCase();
    if (type === 'hidden' || type === 'file' || type === 'password') continue;
    if (type === 'checkbox' || type === 'radio') {
      if (!el.checked) el.click();
      continue;
    }
    if (el.tagName === 'SELECT') {
      if (el.options.length > 1 && !el.value) el.selectedIndex = 1;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      continue;
    }
    if (el.value) continue;
    let value = 'Test value';
    if (type === 'email') value = 'test@example.com';
    else if (type === 'url') value = 'https://example.com';
    else if (type === 'tel') value = '555-0100';
    else if (type === 'number') value = '2';
    else if (type === 'date') value = new Date().toISOString().slice(0, 10);
    else if (type === 'time') value = '12:00';
    else if (type === 'search') value = 'test';
    else if (el.tagName === 'TEXTAREA') value = 'This is a test message with enough detail to exercise the form.';
    setValue(el, value);
  }
  const buttons = [...document.querySelectorAll('button,[role="button"],input[type="submit"],input[type="button"]')].filter(visible);
  const target = buttons[index];
  if (!target) return { ok: false, reason: 'button disappeared before the check' };
  target.setAttribute('data-chode-action', String(index));
  if (target.form && target.form.getAttribute('action')) {
    const action = target.form.getAttribute('action');
    if (/^(?:[a-z][\\w+.-]*:|\\/\\/)/i.test(action)) return { ok: false, reason: 'form action is external: ' + action.slice(0, 200) };
  }
  return { ok: true, label: String(target.getAttribute('aria-label') || target.textContent || target.value || '').replace(/\\s+/g, ' ').trim().slice(0, 100) };
})(INDEX)`;

const CHANGE_SELECT = `(() => {
  const visible = (el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 1 && rect.height > 1;
  };
  const select = [...document.querySelectorAll('select')].filter(visible).find((el) => el.options.length > 1);
  if (!select) return { ok: false, reason: 'no select control' };
  const before = select.selectedIndex;
  select.selectedIndex = before === 0 ? 1 : 0;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true };
})()`;

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
function decodePng(buffer) {
  const data = Buffer.from(buffer || []);
  if (data.length < 24 || data.readUInt32BE(0) !== 0x89504e47 || data.toString('ascii', 12, 16) !== 'IHDR') throw new Error('not a PNG');
  let offset = 8, width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const body = data.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4); depth = body[8]; colorType = body[9]; interlace = body[12];
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') break;
  }
  if (!width || !height || depth !== 8 || interlace !== 0) throw new Error('unsupported PNG layout');
  const bpp = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!bpp) throw new Error('unsupported PNG color type ' + colorType);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  if (raw.length < (stride + 1) * height) throw new Error('truncated PNG data');
  const pixels = Buffer.alloc(width * height * 4);
  let previous = Buffer.alloc(stride);
  let at = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[at++];
    const row = Buffer.from(raw.subarray(at, at + stride));
    at += stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = previous[x];
      const upLeft = x >= bpp ? previous[x - bpp] : 0;
      if (filter === 1) row[x] = (row[x] + left) & 255;
      else if (filter === 2) row[x] = (row[x] + up) & 255;
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) row[x] = (row[x] + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) throw new Error('unsupported PNG filter ' + filter);
    }
    for (let x = 0; x < width; x++) {
      const source = x * bpp, target = (y * width + x) * 4;
      if (colorType === 6) { pixels[target] = row[source]; pixels[target + 1] = row[source + 1]; pixels[target + 2] = row[source + 2]; pixels[target + 3] = row[source + 3]; }
      else if (colorType === 2) { pixels[target] = row[source]; pixels[target + 1] = row[source + 1]; pixels[target + 2] = row[source + 2]; pixels[target + 3] = 255; }
      else if (colorType === 4) { pixels[target] = row[source]; pixels[target + 1] = row[source]; pixels[target + 2] = row[source]; pixels[target + 3] = row[source + 1]; }
      else { pixels[target] = row[source]; pixels[target + 1] = row[source]; pixels[target + 2] = row[source]; pixels[target + 3] = 255; }
    }
    previous = row;
  }
  return { width: width, height: height, pixels: pixels };
}
function imageStats(image) {
  const width = image && image.width, height = image && image.height, pixels = image && image.pixels;
  if (!width || !height || !pixels) throw new Error('empty image');
  const step = Math.max(1, Math.floor(Math.sqrt(width * height / 6000)));
  const colors = new Set();
  let opaque = 0, samples = 0, sum = 0, sumSq = 0, min = 255, max = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
      if (a > 8) opaque++;
      colors.add((r >> 4) + ',' + (g >> 4) + ',' + (b >> 4) + ',' + (a >> 6));
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sum += l; sumSq += l * l; samples++;
      if (l < min) min = l;
      if (l > max) max = l;
    }
  }
  return { pixels: samples, opaque: opaque, ratio: samples ? opaque / samples : 0, colors: colors.size, variance: samples ? sumSq / samples - Math.pow(sum / samples, 2) : 0, range: max - min };
}
function visualVerdict(stats) {
  if (!stats) return { blank: true, detail: 'no pixels were sampled' };
  const blank = stats.opaque === 0 || (stats.colors <= 2 && stats.variance < 2 && stats.range < 8);
  return { blank: blank, detail: stats.colors + ' colour samples, ' + Math.round((stats.ratio || 0) * 100) + '% opaque, luma spread ' + Math.round(stats.range || 0) };
}
async function captureCanvas(cdp, sessionId, index) {
  const rect = await evaluate(cdp, sessionId, `(() => { const el = document.querySelectorAll('canvas')[${Number(index) || 0}]; if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, scrollX: window.scrollX, scrollY: window.scrollY }; })()`);
  if (!rect || rect.width < 2 || rect.height < 2) return null;
  const width = Math.min(2000, Math.floor(rect.width)), height = Math.min(2000, Math.floor(rect.height));
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true, clip: { x: rect.x + rect.scrollX, y: rect.y + rect.scrollY, width: width, height: height, scale: 1 } }, sessionId);
  return decodePng(Buffer.from(shot.data || '', 'base64'));
}
async function visualChecks(cdp, sessionId, snapshot, label, viewport, add) {
  const canvases = (snapshot && snapshot.canvases) || [];
  for (const canvas of canvases) {
    if (canvas.displayWidth < 80 || canvas.displayHeight < 80) continue;
    const name = 'canvas ' + (canvas.index + 1) + ' (' + canvas.width + 'x' + canvas.height + ')';
    let stats = canvas.sample && canvas.sample.kind === '2d' ? canvas.sample : null;
    if (!stats) {
      try { const image = await captureCanvas(cdp, sessionId, canvas.index); stats = image ? imageStats(image) : null; }
      catch (error) { add('Browser visual: ' + label + ' (' + viewport.name + ') — ' + name, false, 'canvas pixels could not be inspected: ' + String((error && error.message) || error).slice(0, 220)); continue; }
    }
    const verdict = visualVerdict(stats);
    add('Browser visual: ' + label + ' (' + viewport.name + ') — ' + name, !verdict.blank, verdict.blank ? 'canvas appears blank or uniform; ' + verdict.detail : verdict.detail);
  }
}

function eventUrlMap(events) {
  const map = new Map();
  for (const event of events || []) {
    if (event.method === 'Network.requestWillBeSent') {
      map.set(event.params.requestId, event.params.request && event.params.request.url);
    }
  }
  return map;
}

function resourcePath(url) {
  try { return new URL(url).pathname; } catch (e) { return String(url || '').slice(0, 200); }
}

function ignoredResource(url) {
  const text = String(url || '');
  return /\/favicon\.ico(?:$|[?#])/i.test(text) || /\.map(?:$|[?#])/i.test(text);
}

function browserProblems(events, from) {
  const slice = (events || []).slice(from || 0);
  const urls = eventUrlMap(slice);
  const problems = [];
  const add = (kind, detail) => {
    const text = kind + ': ' + detail;
    if (!problems.includes(text)) problems.push(text);
  };
  for (const event of slice) {
    const params = event.params || {};
    if (event.method === 'Runtime.exceptionThrown') {
      const details = params.exceptionDetails || {};
      const exception = details.exception || {};
      add('runtime error', String(exception.description || exception.value || details.text || 'uncaught exception').replace(/\s+/g, ' ').slice(0, 500));
    } else if (event.method === 'Runtime.consoleAPICalled' && (params.type === 'error' || params.type === 'assert')) {
      const args = (params.args || []).map((arg) => String(arg.value != null ? arg.value : (arg.description || arg.type || ''))).join(' ');
      if (args.trim()) add('console error', args.replace(/\s+/g, ' ').slice(0, 500));
    } else if (event.method === 'Log.entryAdded') {
      const entry = params.entry || {};
      const text = String(entry.text || '');
      if (entry.level !== 'error') continue;
      if (/Failed to load resource/i.test(text)) continue;
      if (entry.source === 'javascript' || /(?:Uncaught|ReferenceError|TypeError|SyntaxError|RangeError|Error:)/i.test(text)) {
        add('page error', text.replace(/\s+/g, ' ').slice(0, 500));
      }
    } else if (event.method === 'Network.responseReceived') {
      const response = params.response || {};
      const url = String(response.url || '');
      if (response.status >= 400 && !ignoredResource(url)) {
        add('HTTP ' + response.status, resourcePath(url));
      }
    } else if (event.method === 'Network.loadingFailed') {
      const url = String(urls.get(params.requestId) || '');
      const error = String(params.errorText || 'resource failed').replace(/\s+/g, ' ').slice(0, 300);
      if (ignoredResource(url)) continue;
      if (/ERR_ABORTED|ERR_BLOCKED_BY_CLIENT/i.test(error)) continue;
      add('asset failed', (url ? resourcePath(url) + ' — ' : '') + error);
    }
  }
  return problems;
}

function chooseActions(snapshot, request) {
  const seen = new Set();
  const actions = [];
  const candidates = (snapshot.buttons || []).filter(function (button) {
    if (button.disabled || button.type === 'reset') return false;
    if (DESTRUCTIVE_ACTION.test(button.name || '')) return false;
    return true;
  });
  const primary = candidates.filter(function (button) {
    if (PRIMARY_ACTION.test(button.name || '')) return true;
    return (snapshot.forms || 0) > 0 && (button.type === 'submit' || button.tag === 'button');
  });
  for (const button of primary) {
    const key = button.index + ':' + button.name;
    if (seen.has(key)) continue;
    seen.add(key);
    actions.push(button);
    if (actions.length >= 2) break;
  }
  return actions;
}

async function navigate(cdp, sessionId, url, waitMs) {
  const loaded = cdp.waitFor('Page.loadEventFired', sessionId, waitMs);
  let navigationError = '';
  try {
    const result = await cdp.send('Page.navigate', { url: url }, sessionId);
    if (result.errorText) navigationError = String(result.errorText);
  } catch (e) {
    navigationError = String((e && e.message) || e);
  }
  let loadedOk = true;
  try { await loaded; }
  catch (e) { loadedOk = false; }
  await sleep(250);
  return { loaded: loadedOk, error: navigationError };
}

async function capture(cdp, sessionId, file) {
  await cdp.send('Page.bringToFront', {}, sessionId);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(shot.data || '', 'base64'));
  return file;
}

async function inspectViewport(cdp, sessionId, baseUrl, page, viewport, options, add) {
  const label = page.label || page.path || 'page';
  const captureStart = cdp.events.length;
  const reported = new Set();
  const unseen = function (problems) {
    return (problems || []).filter(function (problem) {
      if (reported.has(problem)) return false;
      reported.add(problem);
      return true;
    });
  };
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: !!viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height
  }, sessionId);
  try { await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: !!viewport.mobile, maxTouchPoints: viewport.mobile ? 5 : 1 }, sessionId); } catch (e) {}
  const nav = await navigate(cdp, sessionId, baseUrl, options.timeoutMs);
  add('Browser loads: ' + label + ' (' + viewport.name + ')', nav.loaded && !nav.error, nav.error || (nav.loaded ? 'load event fired' : 'load event did not fire'));
  let snapshot = null;
  const shotPath = path.join(options.screenshotsDir, page.fileName + '-' + viewport.name + '.png');
  try { snapshot = await evaluate(cdp, sessionId, SNAPSHOT); }
  catch (e) { add('Browser DOM: ' + label + ' (' + viewport.name + ')', false, String((e && e.message) || e)); }
  if (snapshot) {
    add('Browser content: ' + label + ' (' + viewport.name + ')', snapshot.bodyText.length >= 1, snapshot.bodyText.length + ' visible characters; title ' + (snapshot.title ? JSON.stringify(snapshot.title.slice(0, 80)) : '(missing)'));
    const unlabeled = (snapshot.fields || []).filter(function (field) { return !field.labelled; });
    if ((snapshot.fields || []).length) {
      add('Browser accessible controls: ' + label + ' (' + viewport.name + ')', unlabeled.length === 0,
        unlabeled.length ? unlabeled.map(function (field) { return (field.tag || 'field') + (field.name ? ' "' + field.name + '"' : ''); }).join(', ') + ' need a visible label or aria-label' : 'all visible controls have a label');
    }
    const unlabeledButtons = (snapshot.buttons || []).filter(function (button) { return !button.name; });
    if (unlabeledButtons.length) add('Browser accessible buttons: ' + label + ' (' + viewport.name + ')', false, unlabeledButtons.length + ' visible button(s) have no text or aria-label');
    const broken = (snapshot.images || []).filter(function (image) { return image.broken; });
    if (broken.length) add('Browser images: ' + label + ' (' + viewport.name + ')', false, broken.map(function (image) { return image.src; }).join(', '));
    if ((snapshot.missingAnchors || []).length) add('Browser anchors: ' + label + ' (' + viewport.name + ')', false, 'missing target for #' + snapshot.missingAnchors.join(', #'));
    if (viewport.mobile || viewport.name === 'desktop') {
      add('Browser layout: ' + label + ' (' + viewport.name + ')', snapshot.overflow <= 2, snapshot.overflow > 2 ? 'horizontal overflow ' + snapshot.overflow + 'px' : 'no horizontal overflow');
    }
    try {
      await capture(cdp, sessionId, shotPath);
      add('Browser screenshot: ' + label + ' (' + viewport.name + ')', true, path.relative(options.root, shotPath));
      options.screenshots.push(shotPath);
    } catch (e) {
      add('Browser screenshot: ' + label + ' (' + viewport.name + ')', false, String((e && e.message) || e).slice(0, 300));
    }
  }
  const interactionExpected = INTERACTION_REQUEST.test(String(options.request || ''));
  let actionsRun = false;
  if (snapshot) {
    const actions = chooseActions(snapshot, options.request);
    if (interactionExpected && !actions.length) {
      const hasSelect = (snapshot.fields || []).some(function (field) { return field.tag === 'select'; });
      if (!hasSelect) {
        add('Browser interactions: ' + label, false, 'the request asks for interaction but no usable button or select was found');
      }
    }
    for (const action of actions) {
      actionsRun = true;
      const interactionStart = cdp.events.length;
      const reload = await navigate(cdp, sessionId, baseUrl, options.timeoutMs);
      if (!reload.loaded) {
        add('Browser interaction: ' + label + ' — ' + (action.name || 'button'), false, 'page did not reload for the interaction check');
        continue;
      }
      let prepared;
      try { prepared = await evaluate(cdp, sessionId, PREPARE.replace('INDEX', String(action.index))); }
      catch (e) { prepared = { ok: false, reason: String((e && e.message) || e) }; }
      if (!prepared || !prepared.ok) {
        add('Browser interaction: ' + label + ' — ' + (prepared && prepared.label || action.name || 'button'), false, prepared && prepared.reason || 'could not prepare the interaction');
        continue;
      }
      const before = await evaluate(cdp, sessionId, '({ href: location.href, hash: ' + STATE_EXPR + ' })');
      let clicked = true;
      const dialogSeen = cdp.waitFor('Page.javascriptDialogOpening', sessionId, 1500).then(async function () {
        try { await cdp.send('Page.handleJavaScriptDialog', { accept: true }, sessionId); } catch (e) {}
        return true;
      }).catch(function () { return false; });
      try {
        clicked = await evaluate(cdp, sessionId, '(() => { const el = document.querySelector("[data-chode-action=\\"' + String(action.index) + '\\"]"); if (!el) return false; el.focus(); el.click(); return true; })()');
      } catch (e) { clicked = false; }
      const sawDialog = await Promise.race([dialogSeen, sleep(700).then(function () { return false; })]);
      await sleep(350);
      let after = null;
      try { after = await evaluate(cdp, sessionId, '({ href: location.href, hash: ' + STATE_EXPR + ' })'); }
      catch (e) {}
      const changed = !!(sawDialog || (after && (after.href !== before.href || after.hash !== before.hash)));
      add('Browser interaction: ' + label + ' — ' + (action.name || 'button'), !!clicked && changed,
        !clicked ? 'button could not be clicked' : sawDialog ? 'click opened a dialog' : changed ? 'click changed the page or URL' : 'click produced no visible change and no navigation');
      const problems = unseen(browserProblems(cdp.events, interactionStart));
      if (problems.length) add('Browser interaction errors: ' + label + ' — ' + (action.name || 'button'), false, problems.slice(0, 4).join(' | '));
    }
    if (interactionExpected && !actions.length) {
      const hasSelect = (snapshot.fields || []).some(function (field) { return field.tag === 'select'; });
      if (hasSelect) {
        actionsRun = true;
        const interactionStart = cdp.events.length;
        const before = await evaluate(cdp, sessionId, STATE_EXPR);
        let changed = false;
        try { await evaluate(cdp, sessionId, CHANGE_SELECT); } catch (e) {}
        await sleep(500);
        try {
          const after = await evaluate(cdp, sessionId, STATE_EXPR);
          changed = after !== before;
        } catch (e) {}
        add('Browser interaction: ' + label + ' — select control', changed, changed ? 'selecting an option changed the page' : 'selecting an option produced no visible change');
        const problems = unseen(browserProblems(cdp.events, interactionStart));
        if (problems.length) add('Browser interaction errors: ' + label + ' — select control', false, problems.slice(0, 4).join(' | '));
      }
    }
  }
  if (snapshot) {
    let finalSnapshot = null;
    try { finalSnapshot = await evaluate(cdp, sessionId, SNAPSHOT); }
    catch (e) {}
    if (actionsRun) {
      try { await capture(cdp, sessionId, shotPath); }
      catch (e) {}
    }
    if (finalSnapshot) {
      try { await visualChecks(cdp, sessionId, finalSnapshot, label, viewport, add); }
      catch (e) { add('Browser visual: ' + label + ' (' + viewport.name + ')', false, String((e && e.message) || e).slice(0, 300)); }
    }
  }
  const problems = unseen(browserProblems(cdp.events, captureStart));
  if (problems.length) add('Browser errors: ' + label + ' (' + viewport.name + ')', false, problems.slice(0, 8).join(' | '));
}

function pageDescriptor(root, file) {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  const rel = path.relative(root, abs);
  return {
    path: rel,
    label: rel || path.basename(abs),
    fileName: String(rel || path.basename(abs)).replace(/[^a-z0-9._-]+/gi, '-'),
    urlPath: '/' + String(rel || path.basename(abs)).split(path.sep).map(encodeURIComponent).join('/')
  };
}

async function run(options) {
  options = options || {};
  const root = path.resolve(options.root || process.cwd());
  const checks = [];
  const screenshots = [];
  const add = function (check, ok, detail) {
    checks.push({ check: check, ok: !!ok, detail: String(detail == null ? '' : detail).slice(0, 1500) });
  };
  const reason = unavailableReason();
  if (process.env.CHODE_BROWSER_CHECK === '0') {
    return { ok: true, skipped: true, reason: 'browser verification disabled by CHODE_BROWSER_CHECK=0', checks: [], failures: [], screenshots: [] };
  }
  if (reason) {
    return { ok: true, skipped: true, reason: reason, checks: [], failures: [], screenshots: [] };
  }
  const pages = (options.pages || []).slice(0, Math.max(1, Math.min(5, Number(options.maxPages) || 3)));
  if (!pages.length) return { ok: true, skipped: true, reason: 'no HTML page was available for browser verification', checks: [], failures: [], screenshots: [] };
  const virtual = new Map();
  const descriptors = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page && typeof page.html === 'string') {
      const key = '/__chode_virtual_' + i + '.html';
      virtual.set(key, page.html);
      descriptors.push({
        path: page.name || ('virtual-' + i + '.html'),
        label: page.label || page.name || ('virtual-' + i + '.html'),
        fileName: String(page.name || ('virtual-' + i + '.html')).replace(/[^a-z0-9._-]+/gi, '-'),
        urlPath: key
      });
    } else if (page && page.path) {
      const descriptor = pageDescriptor(root, page.path);
      if (descriptor.path && !descriptor.path.startsWith('..') && !path.isAbsolute(descriptor.path)) descriptors.push(descriptor);
    }
  }
  if (!descriptors.length) return { ok: true, skipped: true, reason: 'no in-workspace HTML page was available for browser verification', checks: [], failures: [], screenshots: [] };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotsDir = options.screenshotsDir || path.join(root, '.chode', 'visual', stamp);
  fs.mkdirSync(screenshotsDir, { recursive: true });
  const waitMs = timeoutMs(options.timeoutMs);
  const browserPath = findBrowser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-browser-'));
  let child = null;
  let cdp = null;
  let targetId = null;
  let serverInfo = null;
  const startedAt = Date.now();
  try {
    serverInfo = await startServer(root, virtual);
    const browser = await launchBrowser(browserPath, userDataDir, Math.min(waitMs, 15000));
    child = browser.child;
    cdp = await new CDP(browser.wsUrl, waitMs).connect();
    const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
    targetId = created.targetId;
    const attached = await cdp.send('Target.attachToTarget', { targetId: targetId, flatten: true });
    const sessionId = attached.sessionId;
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Log.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);
    for (const page of descriptors) {
      const url = serverInfo.base + page.urlPath;
      for (const viewport of VIEWPORTS) {
        if (Date.now() - startedAt > Math.max(waitMs * 4, 60000)) {
          add('Browser verification time limit: ' + page.label, false, 'stopped after ' + Math.round((Date.now() - startedAt) / 1000) + 's');
          break;
        }
        try {
          await inspectViewport(cdp, sessionId, url, page, viewport, {
            root: root,
            request: options.request || '',
            timeoutMs: waitMs,
            screenshotsDir: screenshotsDir,
            screenshots: screenshots
          }, add);
        } catch (e) {
          add('Browser verification: ' + page.label + ' (' + viewport.name + ')', false, String((e && e.message) || e).slice(0, 500));
        }
      }
    }
  } catch (e) {
    add('Browser verification', false, String((e && e.message) || e).slice(0, 800));
  } finally {
    try { if (cdp && targetId) await cdp.send('Target.closeTarget', { targetId: targetId }); } catch (e) {}
    try { if (cdp) cdp.close(); } catch (e) {}
    try { if (child && child.exitCode === null) child.kill('SIGKILL'); } catch (e) {}
    try { if (serverInfo && serverInfo.server) await closeServer(serverInfo.server); } catch (e) {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
  const failed = checks.filter(function (check) { return !check.ok; });
  return {
    ok: failed.length === 0,
    skipped: false,
    reason: '',
    checks: checks,
    failures: failed.map(function (check) { return check.check + (check.detail ? ' — ' + check.detail : ''); }),
    screenshots: screenshots
  };
}

function htmlFiles(root, files) {
  const out = [];
  const seen = new Set();
  for (const file of files || []) {
    if (!/\.html?$/i.test(String(file))) continue;
    const abs = path.isAbsolute(file) ? file : path.join(root, file);
    const rel = path.relative(root, abs);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) continue;
    if (seen.has(rel)) continue;
    try { if (!fs.statSync(abs).isFile()) continue; } catch (e) { continue; }
    seen.add(rel);
    out.push(rel);
  }
  if (!out.length) {
    for (const name of ['index.html', 'Index.html', 'index.htm']) {
      const abs = path.join(root, name);
      try { if (fs.statSync(abs).isFile()) { out.push(name); break; } } catch (e) {}
    }
  }
  return out;
}

async function checkWorkspace(root, request, files, options) {
  options = options || {};
  if (options.browserCheck === false) return { ok: true, skipped: true, reason: 'browser verification disabled', checks: [], failures: [], screenshots: [] };
  const pages = htmlFiles(root, files).slice(0, Math.max(1, Math.min(5, Number(options.maxPages) || 3))).map(function (file) {
    return { path: file };
  });
  if (!pages.length) return { ok: true, skipped: true, reason: 'no HTML page was written, so there was nothing to exercise in a browser', checks: [], failures: [], screenshots: [] };
  return run({
    root: root,
    request: request,
    pages: pages,
    maxPages: options.maxPages || 3,
    timeoutMs: options.timeoutMs,
    screenshotsDir: options.screenshotsDir
  });
}

async function checkHtml(html, options) {
  options = options || {};
  if (typeof html !== 'string' || !html.trim()) return { ok: true, skipped: true, reason: 'empty document', checks: [], failures: [], screenshots: [] };
  return run({
    root: options.root || process.cwd(),
    request: options.request || '',
    pages: [{ html: html, name: options.name || 'artifact.html', label: options.name || 'artifact.html' }],
    maxPages: 1,
    timeoutMs: options.timeoutMs,
    screenshotsDir: options.screenshotsDir
  });
}

module.exports = {
  available: available,
  unavailableReason: unavailableReason,
  run: run,
  checkWorkspace: checkWorkspace,
  checkHtml: checkHtml,
  findBrowser: findBrowser,
  decodePng: decodePng,
  imageStats: imageStats,
  visualVerdict: visualVerdict,
  VIEWPORTS: VIEWPORTS
};
