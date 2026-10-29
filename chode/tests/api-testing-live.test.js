'use strict';
// Real tool binaries against a real local API. Never calls a model or public API.
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const entry=process.env.CHODE_API_TEST_ENTRY||path.resolve(__dirname,'../chode.js'),appDir=path.dirname(entry),tools=require(path.join(appDir,'api-testing.js'));
async function main(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'chode API integration '));let server;const oldSecret=process.env.API_TEST_SECRET;process.env.API_TEST_SECRET='api-test-native-secret-value';
  const cases=[],requests=[];let next=0;const items=new Map();
  try{
    if(process.argv.includes('--install'))for(const id of Object.keys(tools.engines)){const setup=await tools.setup(root,id);assert(setup.ok,JSON.stringify(setup));}
    const status=await tools.doctor(root);assert(status.engines.every(x=>x.installed),'Install all engines first, or use --install: '+JSON.stringify(status));
    server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');requests.push(req.method+' '+u.pathname);res.setHeader('Content-Type','application/json');const reply=(code,value)=>{res.writeHead(code);res.end(JSON.stringify(value));};
      if(u.pathname.startsWith('/schema-')&&req.method!=='GET'){res.setHeader('Allow','GET');return reply(405,{error:'method not allowed'});}
      if(u.pathname==='/schema-good')return reply(200,{ok:true});if(u.pathname==='/schema-bad')return reply(200,{ok:'not-a-boolean'});
      if(u.pathname==='/secret')return reply(200,{token:process.env.API_TEST_SECRET});
      if(u.pathname==='/slow'){fs.writeFileSync(path.join(root,'slow-request'),'started');const timer=setTimeout(()=>reply(200,{ok:true}),20000);res.once('close',()=>{clearTimeout(timer);fs.writeFileSync(path.join(root,'slow-closed'),'closed');});return;}
      if(u.pathname==='/items'&&req.method==='POST'){let body='';req.on('data',chunk=>body+=chunk);return req.on('end',()=>{try{const value=JSON.parse(body);if(typeof value.name!=='string'||!value.name.trim())return reply(400,{error:'name required'});const item={id:++next,name:value.name};items.set(item.id,item);reply(201,item);}catch{reply(400,{error:'invalid JSON'});}});}
      const id=Number(u.pathname.split('/')[2]);if(u.pathname.startsWith('/items/')&&items.has(id))return reply(200,items.get(id));return reply(404,{error:'not found'});
    });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
    fs.writeFileSync(path.join(root,'journey suite.hurl'),'POST {{base_url}}/items\nContent-Type: application/json\n{ "name": "Heron" }\nHTTP 201\n[Captures]\nid: jsonpath "$.id"\n[Asserts]\njsonpath "$.name" == "Heron"\n\nGET {{base_url}}/items/{{id}}\nHTTP 200\n[Asserts]\njsonpath "$.name" == "Heron"\n');
    fs.writeFileSync(path.join(root,'bad.hurl'),'GET {{base_url}}/secret\nHTTP 200\n[Asserts]\njsonpath "$.token" == "wrong"\n');
    fs.writeFileSync(path.join(root,'slow.hurl'),'GET {{base_url}}/slow\nHTTP 200\n');
    for(const kind of ['good','bad'])fs.writeFileSync(path.join(root,kind+'.json'),JSON.stringify({openapi:'3.0.3',info:{title:'Fixture API',version:'1'},paths:{['/schema-'+kind]:{get:{responses:{200:{description:'Healthy response',content:{'application/json':{schema:{type:'object',properties:{ok:{type:'boolean'}},required:['ok'],additionalProperties:false}}}}}}}}}));
    const script=pass=>`import http from 'k6/http'; import {check} from 'k6'; export default function(){const r=http.get(__ENV.BASE_URL+'/schema-good');check(r,{'status is correct':r=>r.status===${pass?200:418}});}`;
    fs.writeFileSync(path.join(root,'good.js'),script(true));fs.writeFileSync(path.join(root,'bad.js'),script(false));
    fs.writeFileSync(path.join(root,'threshold.js'),"export const options={thresholds:{http_req_duration:['p(95)<0']}};"+script(true));
    fs.writeFileSync(path.join(root,'slow.js'),"import {sleep} from 'k6'; export default function(){sleep(30);}");fs.writeFileSync(path.join(root,'empty.js'),'export default function(){}');
    for(const [engine,file,expected] of [['hurl','journey suite.hurl',true],['hurl','bad.hurl',false],['schemathesis','good.json',true],['schemathesis','bad.json',false],['k6','good.js',true],['k6','bad.js',false],['k6','threshold.js',false],['k6','empty.js',false]]){
      const r=await tools.run(root,engine,file,{url,timeout:45,examples:3,iterations:2});cases.push({engine,file,ok:r.ok,exitCode:r.exitCode,metrics:r.metrics,report:r.report});
      assert.equal(r.ok,expected,JSON.stringify(r));assert(fs.existsSync(path.join(root,r.report)));assert.equal(r.suiteSha256.length,64);assert(!JSON.stringify(r).includes(process.env.API_TEST_SECRET));
      if(file==='bad.js')assert.equal(r.exitCode,0,'k6 check failures must be caught even when native exit is zero');if(file==='threshold.js')assert.notEqual(r.exitCode,0,'a real threshold breach must fail');
    }
    const timeout=await tools.run(root,'k6','slow.js',{url,timeout:1,iterations:1});assert(!timeout.ok&&timeout.timedOut,JSON.stringify(timeout));cases.push({engine:'k6',case:'timeout',ok:timeout.ok,timedOut:timeout.timedOut});
    const cli=await tools.execute(process.execPath,[entry,'api-test','run','hurl','bad.hurl','--base-url',url],{cwd:root,timeoutMs:20000});assert.equal(cli.exitCode,1,cli.stdout+cli.stderr);assert.equal(JSON.parse(cli.stdout).ok,false);
    const preload=path.join(root,'no-model.cjs');fs.writeFileSync(preload,`require(${JSON.stringify(entry)}).__testHooks.callAI=async()=>{throw Error('Unexpected model call');};`);
    const tui=path.join(root,'tui-fixture.cjs');fs.writeFileSync(tui,`
const assert=require('assert/strict'),fs=require('fs'),{PassThrough}=require('stream');const input=new PassThrough(),output=new PassThrough();input.isTTY=output.isTTY=true;input.setRawMode=()=>{};output.columns=110;output.rows=38;output.resume();const app=require(${JSON.stringify(path.join(appDir,'workspace-tui.js'))}).launch({input,output});
const wait=ms=>new Promise(r=>setTimeout(r,ms));async function send(text){input.emit('keypress',text,{});input.emit('keypress','\\r',{name:'return'});const end=Date.now()+20000;while(app.state.busy&&Date.now()<end)await wait(20);assert(!app.state.busy,'TUI did not complete');}
(async()=>{try{await send(${JSON.stringify('/api-test run hurl "journey suite.hurl" --base-url '+url)});assert(app.state.messages.some(m=>m.text.includes('Passed · hurl')));await send(${JSON.stringify('/api-test run hurl bad.hurl --base-url '+url)});assert.equal(app.state.status,'Needs attention');assert(app.state.messages.some(m=>m.text.includes('Failed · hurl')));assert.equal(require(${JSON.stringify(entry)}).loadPendingTasks().length,0,'API failures must not queue model retries');
input.emit('keypress',${JSON.stringify('/api-test run hurl slow.hurl --base-url '+url)},{});input.emit('keypress','\\r',{name:'return'});let end=Date.now()+10000;while(!fs.existsSync('slow-request')&&Date.now()<end)await wait(20);assert(fs.existsSync('slow-request'),'native request did not start');input.emit('keypress','\\x03',{ctrl:true,name:'c'});end=Date.now()+5000;while(app.state.busy&&Date.now()<end)await wait(20);assert.equal(app.state.status,'Stopped');while(!fs.existsSync('slow-closed')&&Date.now()<end)await wait(20);assert(fs.existsSync('slow-closed'),'cancelled native request survived');
console.log('PASS actual TUI input + native Hurl worker success/failure/cancellation, no provider queue or model calls');}finally{app.close();}})().catch(e=>{console.error(e);process.exitCode=1;});`);
    const ui=await tools.execute(process.execPath,[tui],{cwd:root,timeoutMs:30000,env:{NODE_OPTIONS:'--require '+JSON.stringify(preload),CHODE_PROVIDER_HOME:path.join(root,'provider-home')}});assert.equal(ui.exitCode,0,ui.stdout+ui.stderr);cases.push({case:'real TUI native worker pass/fail/cancel',ok:true});
    const engine=require(entry);engine.__testHooks.callAI=async()=>{throw Error('API testing must not call a model');};const direct=await engine.cmdAI({prompt:'api-test: doctor'});assert(direct.apiTest&&direct.modelCalls===0);engine.__testHooks.callAI=null;
    assert(requests.includes('POST /items')&&requests.some(x=>x.startsWith('GET /items/')));assert(!fs.readdirSync(path.join(root,'.chode/api-tests/results')).some(x=>/junit|summary/.test(x)),'raw reports must be removed');
    if(process.env.CHODE_API_TEST_REPORT)fs.writeFileSync(process.env.CHODE_API_TEST_REPORT,JSON.stringify({observedAt:new Date().toISOString(),versions:status.engines.map(x=>({engine:x.engine,version:x.versionOutput})),cases,requests:requests.length},null,2));
    console.log('PASS real API tools: Hurl create/capture/read, schema conformance and rejection, k6 checks/thresholds/timeout, CLI failure exit, redaction and zero model calls');
  }finally{if(server)await new Promise(resolve=>server.close(resolve));if(oldSecret===undefined)delete process.env.API_TEST_SECRET;else process.env.API_TEST_SECRET=oldSecret;fs.rmSync(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
