'use strict';
const assert = require('assert/strict');
const http = require('http');
const {base, discover} = require('../local-models');
(async () => {
  assert.equal(base('http://localhost:11434/'), 'http://localhost:11434');
  for (const url of ['file:///etc/passwd', 'http://user:pass@localhost', 'http://localhost/?token=x'])
    assert.equal((await discover({url})).reason, 'invalid-url');
  let mode = 'valid', seen;
  const server = http.createServer((req, res) => {
    seen = req.url;
    if (mode === 'hang') return;
    if (mode === 'http') { res.writeHead(503); res.end(); return; }
    if (mode === 'large') { res.end('x'.repeat(1024 * 1024 + 1)); return; }
    res.end(mode === 'invalid' ? '{}' : mode === 'empty' ? '{"models":[]}' :
      JSON.stringify({models: [{name: 'coder:latest'}, {model: 'coder:latest'}, {name: 'bad\nname'}]}));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/prefix/';
  try {
    assert.deepEqual(await discover({url}), {ok: true, models: ['coder:latest'], reason: null});
    assert.equal(seen, '/prefix/api/tags');
    // Exercise the real CLI against a custom base; no curl or model inference.
    const {spawn} = require('child_process');
    const run = command => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [require('path').join(__dirname, '..', 'chode.js'), command],
        {cwd: require('os').tmpdir(), env: {...process.env, OLLAMA_URL: url}, windowsHide: true});
      let output = '';
      child.stdout.on('data', data => output += data);
      child.stderr.on('data', data => output += data);
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve(output) : reject(Error(output)));
    });
    assert.match(await run('models'), /coder:latest/);
    assert.match(await run('status'), /Ollama: running/);
    for (const [value, reason] of [['http','http-503'],['large','response-too-large'],['invalid','invalid-response'],['empty','no-models'],['hang','timeout']]) {
      mode = value;
      assert.equal((await discover({url, timeoutMs: 100})).reason, reason);
    }
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  assert.equal((await discover({url, timeoutMs:100})).ok, false);
  console.log('PASS local discovery: custom base, schema, size, HTTP, deadline and connection failure');
})().catch(error => { console.error(error); process.exitCode = 1; });

