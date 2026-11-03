'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{PassThrough}=require('stream');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const response=data=>({ok:true,status:200,json:async()=>data});

async function waitForQuestion(app,re,timeout=10000){
  const end=Date.now()+timeout;
  while(Date.now()<end){
    const q=app.state.question;
    if(q&&re.test(String(q.question)))return q;
    await pause(15);
  }
  throw new Error('Timed out waiting for question matching '+re+'; last question: '+JSON.stringify(app.state.question&&app.state.question.question)+'; status: '+app.state.status);
}
async function waitIdle(app,timeout=10000){
  const end=Date.now()+timeout;
  while(Date.now()<end&&app.state.busy)await pause(20);
  if(app.state.busy)throw new Error('TUI still busy: '+app.state.status);
}

async function main(){
  const savedOvh=process.env.OVHCLOUD_API_KEY;delete process.env.OVHCLOUD_API_KEY;
  const original=process.cwd();
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-tui-pick-'));
  let app;
  try{
    process.chdir(temp);
    const real=require('../chode');
    const oldLoad=real.loadConfig,oldSave=real.saveConfig,oldReload=real.reloadConnections,oldLps=real.loadProviderSettings,oldSps=real.saveProviderSettings;
    let saved=null;
    real.loadConfig=()=>({providers:{}});
    real.saveConfig=c=>{saved=structuredClone(c);};
    real.reloadConnections=()=>{};
    real.loadProviderSettings=()=>({});
    real.saveProviderSettings=()=>{};
    try{
      const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};
      const output=new PassThrough();output.isTTY=true;output.columns=100;output.rows=30;
      let transcript='';output.on('data',c=>transcript+=c);
      app=require('../workspace-tui').launch({input,output,connectOptions:{scope:'project',fetch:async()=>response({data:[]})}});
      const keypress=(text,key={})=>input.emit('keypress',text,key);
      const send=async(text)=>{keypress(text);keypress('\r',{name:'return'});await pause(60);};
      const pickKey=async(k)=>{keypress('',k);await pause(60);};

      // 1) /connect with no argument opens the native picker screen
      await send('/connect');
      assert(app.state.providerPicker,'/connect with no argument opens the provider picker');
      assert(transcript.includes('provider picker'),'picker frame is rendered');
      assert(transcript.includes('Connect a provider'),'picker title is rendered');

      // 2) type-to-search narrows to OVH; Enter drops into the variant stage
      keypress('ovh');await pause(40);
      assert(app.state.providerPicker,'picker still open while typing');
      assert.equal(app.state.providerPicker.results[0].id,'ovh','ovh is the top search match');
      keypress('\r',{name:'return'});await pause(40);
      assert(app.state.providerPicker,'picker stays open for multi-variant providers');
      assert.equal(app.state.providerPicker.stage,'variant','OVH has two access modes -> variant stage');
      assert(transcript.includes('choose access mode'),'variant stage is rendered');

      // 3) pick the paid variant -> wizard runs against the keyed profile (ovhcloud)
      await pickKey({name:'down'});
      keypress('\r',{name:'return'});await pause(80);
      assert.equal(app.state.providerPicker,null,'picker closes when a selection is made');
      assert.equal(app.state.status,'Provider setup','wizard started');
      await waitForQuestion(app,/Connect OVHcloud AI Endpoints/);await send('Continue to setup');
      await waitForQuestion(app,/Paste API key/);
      keypress('ovh-tui-secret');await pause(40);
      keypress('\r',{name:'return'});await pause(80);
      assert(!transcript.includes('ovh-tui-secret'),'secret key is never echoed to the terminal');
      await waitForQuestion(app,/Choose a model/);await send('gpt-oss-120b');
      await waitForQuestion(app,/Check this connection/);await send('Save without testing');
      await waitForQuestion(app,/Save OVHcloud AI Endpoints/);
      await send('Save and select provider (leave strict free mode if a key is required)');
      await waitIdle(app);
      assert(saved,'config was saved');
      assert.equal(saved.providers.ovhcloud.key,'ovh-tui-secret','key saved in project scope');
      assert.equal(saved.providers.ovhcloud.model,'gpt-oss-120b');
      assert.equal(saved.connections.ovhcloud.keyEnv,'OVHCLOUD_API_KEY');
      assert.equal(saved.defaultProvider,'ovhcloud','saved and selected as default');
      assert.equal(app.state.provider,'ovhcloud','TUI provider switched to the keyed profile');
      assert(!JSON.stringify(app.state.messages).includes('ovh-tui-secret'),'transcript stays secret-free');
      assert(!JSON.stringify(app.state.history).includes('ovh-tui-secret'),'history stays secret-free');

      // 4) Esc closes the picker without starting a wizard
      await send('/connect');
      assert(app.state.providerPicker,'picker reopened');
      keypress('\x1b',{name:'escape'});await pause(40);
      assert.equal(app.state.providerPicker,null,'esc closes the picker');
      assert(!app.state.busy,'no wizard started');

      // 5) free OVH through the picker: no key prompt, stays keyless
      await send('/connect');
      keypress('ovh');await pause(40);
      keypress('\r',{name:'return'});await pause(40);
      assert.equal(app.state.providerPicker.stage,'variant');
      keypress('\r',{name:'return'});await pause(80);
      assert.equal(app.state.providerPicker,null,'free variant selection closes the picker');
      await waitForQuestion(app,/Choose a model/,10000);
      await send('Qwen3.8-27B');
      await waitForQuestion(app,/Check this connection/);await send('Save without testing');
      await waitForQuestion(app,/Save OVHcloud \(Keyless\)/);await send('Save only');
      await waitIdle(app);
      assert(saved,'config was saved (free)');
      assert(saved.providers.ovh,'free ovh saved');
      assert(!saved.providers.ovh.key,'free ovh saves no key');
    }finally{
      real.loadConfig=oldLoad;real.saveConfig=oldSave;real.reloadConnections=oldReload;real.loadProviderSettings=oldLps;real.saveProviderSettings=oldSps;
      if(app)app.close();
    }
  }finally{
    process.chdir(original);
    fs.rmSync(temp,{recursive:true,force:true});
    if(savedOvh===undefined)delete process.env.OVHCLOUD_API_KEY;else process.env.OVHCLOUD_API_KEY=savedOvh;
  }
  console.log('PASS provider-connect-tui: /connect opens the native picker; OVH paid (two-stage) routes to the keyed profile and saves OVHCLOUD_API_KEY secret-free; esc cancels; OVH free stays keyless');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
