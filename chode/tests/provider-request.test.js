'use strict';
const assert = require('assert/strict'), http = require('http');
const {request} = require('../provider-request');
(async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/hang') { res.writeHead(200, {'Content-Type':'application/json'});res.write('{');return; }
    if (req.url === '/large') { res.end(JSON.stringify({text:'x'.repeat(2000)}));return; }
    if (req.url === '/declared') { res.writeHead(200,{'Content-Length':'100000'});res.write(' ');return; }
    if (req.url === '/invalid') { res.end('not json');return; }
    res.end('{"models":[]}');
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try {
    assert.deepEqual(await (await request(fetch,base,{},null)).json(),{models:[]});
    for(const suffix of ['/large','/declared']) await assert.rejects(request(fetch,base+suffix,{},null,{maxBytes:1024}),/size limit/);
    await assert.rejects(request(fetch,base+'/invalid',{},null),/invalid JSON/);
    await assert.rejects(request(fetch,base+'/hang',{},null,{timeoutMs:60}),/timed out/);
    const control=new AbortController();const pending=request(fetch,base+'/hang',{},control.signal);setTimeout(()=>control.abort(),40);await assert.rejects(pending,/cancelled/);
    // Neither a broken fetch adapter nor hung/rejected reader cancellation may block setup.
    await assert.rejects(request(()=>new Promise(()=>{}),base,{},null,{timeoutMs:30}),/timed out/);
    for(const cancel of [()=>new Promise(()=>{}),()=>Promise.reject(Error('cancel rejected'))]) {
      await assert.rejects(request(async()=>({body:{getReader:()=>({read:()=>new Promise(()=>{}),cancel})}}),base,{},null,{timeoutMs:30}),/timed out/);
    }
    control.abort();await assert.rejects(request(fetch,base,{},control.signal),/cancelled/);
    let saved=false, answers=['current','Test connection'];
    const engine={PROVIDERS:{fixture:{name:'Fixture',category:'keyless',endpoints:[{url:base+'/chat/completions',headers:()=>({}),body:()=>'{"model":"fixture"}',parse:()=> 'OK'}]}},loadConfig:()=>({providers:{}}),saveConfig:()=>saved=true};
    await assert.rejects(require('../provider-connect').run(engine,{provider:'fixture',ask:async()=>answers.shift(),fetch:async target=>target.endsWith('/models')?{ok:true,json:async()=>({data:[]})}:{ok:true,headers:{get:()=>String(5*1024*1024)}}}),/Connection test failed \(.+\)/);
    assert.equal(saved,false,'oversized connection response must not save settings');
    console.log('PASS provider requests: bounded real HTTP bodies, invalid JSON, total deadline, cancellation and hung fetch/read/cancel adapters');
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
