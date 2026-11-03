'use strict';
const assert=require('assert/strict');
const {PassThrough}=require('stream');
const connect=require('../provider-connect');
const catalog=require('../provider-catalog');
const pause=ms=>new Promise(r=>setTimeout(r,ms));

function engine(){
  let cfg={providers:{}};
  let userSaved=null;
  const api={
    PROVIDERS:{ovh:{name:'OVHcloud (Keyless)',category:'keyless',requiresKey:null,freeTier:'No key',endpoints:[{url:'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',headers:()=>({'Content-Type':'application/json'}),body:(k,m)=>JSON.stringify({model:'Qwen3.8-27B',messages:m,max_tokens:4096}),parse:d=>d.choices?.[0]?.message?.content}]}},
    loadConfig:()=>structuredClone(cfg),
    saveConfig:c=>{cfg=c;},
    loadProviderSettings:(id)=>cfg.providers[id]||{},
    saveProviderSettings:(id,settings,connection)=>{userSaved={id,settings:Object.assign({},settings),connection:connection?Object.assign({},connection):null};},
    reloadConnections:()=>{},
    clearAuthFailure:()=>{},
    userSaved:()=>userSaved
  };
  return api;
}

async function waitFor(text,state,timeout=4000){
  const end=Date.now()+timeout;
  while(Date.now()<end){if(state.out.includes(text))return;await pause(10);}
  throw new Error('Timed out waiting for prompt: '+text+'\n--- output so far ---\n'+state.out);
}

function tty(){
  const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};
  const output=new PassThrough();output.isTTY=true;output.columns=100;output.rows=30;
  const state={out:''};output.on('data',c=>state.out+=c);
  return {input,output,state,send:line=>input.emit('data',line+'\n')};
}

async function main(){
  const savedOvhKey=process.env.OVHCLOUD_API_KEY;delete process.env.OVHCLOUD_API_KEY;
  try{
  await runScenarios();
  }finally{
    if(savedOvhKey===undefined)delete process.env.OVHCLOUD_API_KEY;else process.env.OVHCLOUD_API_KEY=savedOvhKey;
  }
}
async function runScenarios(){
  // ---- routing: access-mode selection maps to the correct wizard target ----
  const entries=catalog.all(engine(),{env:{}});
  const ovh=entries.find(e=>e.id==='ovh');
  assert(ovh&&ovh.variants.length===2,'ovh has free+paid variants, got '+(ovh&&ovh.variants.length));
  assert.equal(connect.resolveWizardId(entries,'ovh',0),'ovh','free mode stays on the keyless built-in');
  assert.equal(connect.resolveWizardId(entries,'ovh',1),'ovhcloud','paid mode routes to the keyed directory profile');
  assert.equal(connect.resolveWizardId(entries,'groq-x',0),'groq-x','unknown id passes through');

  // ---- end-to-end: chode connect ovh -> pick paid -> OVHCLOUD_API_KEY saved ----
  let fetchCalls=0;
  const realFetch=globalThis.fetch;
  globalThis.fetch=async(url)=>{fetchCalls++;if(String(url).endsWith('/models'))return {ok:true,status:200,json:async()=>({data:[]})};return {ok:true,status:200,json:async()=>({choices:[{message:{content:'OK'}}]})};};
  const t=tty();const eng=engine();
  try{
    const p=connect.cli(eng,'ovh',{input:t.input,output:t.output});
    await waitFor('access mode',t.state);t.send('2');                         // paid / OVHCLOUD_API_KEY
    await waitFor('Continue to setup',t.state);t.send('Continue to setup');   // consent
    await waitFor('Paste API key',t.state);t.send('ovh-test-key');            // key
    await waitFor('Choose a model',t.state);t.send('gpt-oss-120b');           // model
    await waitFor('Save without testing',t.state);t.send('Save without testing');
    await waitFor('Save only',t.state);t.send('Save only');
    const result=await p;
    assert.equal(result.provider,'ovhcloud','wizard ran against the keyed profile');
    assert(fetchCalls>0,'model discovery used the (mock) fetch');
    const saved=eng.userSaved();
    assert(saved&&saved.id==='ovhcloud','user-scope save targeted ovhcloud');
    assert.equal(saved.settings.key,'ovh-test-key','key stored in user scope');
    assert.equal(saved.settings.model,'gpt-oss-120b');
    assert.equal(saved.connection.keyEnv,'OVHCLOUD_API_KEY');
    const cfg=eng.loadConfig(true);
    assert(cfg.connections.ovhcloud,'connection recorded in project config');
    assert.equal(cfg.connections.ovhcloud.keyEnv,'OVHCLOUD_API_KEY');
    assert.equal(cfg.providers.ovhcloud.keySource,'global','project config holds metadata (keySource global)');
    assert(!cfg.providers.ovhcloud.key,'secret key not copied into project config');
    assert(!t.state.out.includes('ovh-test-key'),'secret key not echoed to terminal');
  }finally{
    globalThis.fetch=realFetch;
  }

  // ---- free mode: chode connect ovh -> pick free -> no key prompt ----
  const t2=tty();const eng2=engine();
  globalThis.fetch=async(url)=>{fetchCalls++;return {ok:true,status:200,json:async()=>({data:[]})};};
  try{
    const p=connect.cli(eng2,'ovh',{input:t2.input,output:t2.output});
    await waitFor('access mode',t2.state);t2.send('1');                     // free
    await waitFor('Choose a model',t2.state);t2.send('Qwen3.8-27B');        // keyless: straight to model
    await waitFor('Save without testing',t2.state);t2.send('Save without testing');
    await waitFor('Save only',t2.state);t2.send('Save only');
    const r2=await p;
    assert.equal(r2.provider,'ovh','free mode stays on the keyless built-in');
    const cfg2=eng2.loadConfig(true);
    assert(!(cfg2.providers.ovh&&cfg2.providers.ovh.key),'free ovh saves no key');
  }finally{
    globalThis.fetch=realFetch;
  }
  console.log('PASS provider-connect-terminal: OVH paid routes to keyed profile + saves OVHCLOUD_API_KEY; free stays keyless; no key echo');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
