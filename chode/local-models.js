'use strict';
const http = require('http');
const https = require('https');

function base(value = process.env.OLLAMA_URL || 'http://localhost:11434') {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw Error('OLLAMA_URL must be an HTTP(S) base URL without credentials, query or fragment.');
  return url.href.replace(/\/+$/, '');
}

// No subprocess or shell; bound both response bytes and total elapsed time.
function discover(options = {}) {
  return new Promise(resolve => {
    let target;
    try { target = new URL(base(options.url) + '/api/tags'); }
    catch { resolve({ok: false, models: [], reason: 'invalid-url'}); return; }
    let settled = false, request, timer;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const fail = reason => finish({ok: false, models: [], reason});
    timer = setTimeout(() => { fail('timeout'); request?.destroy(); }, options.timeoutMs || 2000);
    try {
      request = (target.protocol === 'https:' ? https : http).get(target, response => {
        if (response.statusCode !== 200) { fail('http-' + response.statusCode); response.destroy(); return; }
        const chunks = []; let size = 0;
        response.on('data', chunk => {
          size += chunk.length;
          if (size > 1024 * 1024) { fail('response-too-large'); response.destroy(); return; }
          chunks.push(chunk);
        });
        response.on('error', () => fail('connection'));
        response.on('end', () => {
          if (settled) return;
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (!Array.isArray(data.models)) { fail('invalid-response'); return; }
            const models = [...new Set(data.models.map(m => m && (m.name || m.model))
              .filter(name => typeof name === 'string' && name.length <= 200 && !/[\s\x00-\x1f]/.test(name)))].slice(0, 500);
            finish({ok: true, models, reason: models.length ? null : 'no-models'});
          } catch { fail('invalid-response'); }
        });
      });
      request.on('error', () => fail('connection'));
    } catch { fail('connection'); }
  });
}
module.exports = {base, discover};
