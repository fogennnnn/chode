'use strict';
const assert=require('assert'),crypto=require('crypto'),fs=require('fs'),os=require('os'),path=require('path'),{PassThrough}=require('stream');
const helper=require('../provider-connect'),view=require('../workspace-view');
const response=data=>({ok:true,status:200,json:async()=>data});
function engine(){let cfg={providers:{}};return {PROVIDERS:{openrouter:{name:'OpenRouter',requiresKey:'TEST_CONNECT_KEY',category:'configured',endpoints:[{url:'https://openrouter.ai/api/v1/chat/completions',headers:key=>({Authorization:'Bearer '+key}),body:(k,m)=>JSON.stringify({model:'old',messages:m,max_tokens:4096}),parse:d=>d.choices?.[0]?.message?.content}]}},loadConfig:()=>structuredClone(cfg),saveConfig:c=>{cfg=structuredClone(c);},get config(){return cfg;}};}
async function main(){
 let e=engine(),answers=['Paste API key','test-secret-key','2','Test connection','Save and select provider (leave strict free mode if a key is required)'],calls=[],questions=[];
 const result=await helper.run(e,{provider:'openrouter',ask:async q=>{questions.push(q);return answers.shift();},fetch:async(url,options)=>{calls.push({url,options});return response(url.endsWith('/models')?{data:[{id:'model-a'},{id:'model-b'}]}:{choices:[{message:{content:'OK'}}]});}});
 assert(result.tested&&result.select&&!result.freeOnly);assert.equal(e.config.defaultProvider,'openrouter');assert.equal(e.config.freeOnly,false);assert.equal(e.config.providers.openrouter.model,'model-b');assert.equal(JSON.parse(calls[1].options.body).model,'model-b');assert.equal(calls[1].options.headers.Authorization,'Bearer test-secret-key');assert.equal(JSON.parse(calls[1].options.body).max_tokens,16);assert(questions.find(q=>q.secret));
 e=engine();let auth;answers=['Browser login (OAuth PKCE)','one-use-code','current','Save without testing','Save only'];
 await helper.run(e,{provider:'openrouter',ask:async()=>answers.shift(),open:link=>auth=new URL(link),fetch:async(url,options)=>{assert.equal(options.redirect,'error');if(url.endsWith('/auth/keys')){const body=JSON.parse(options.body);assert.equal(body.code,'one-use-code');assert.equal(crypto.createHash('sha256').update(body.code_verifier).digest('base64url'),auth.searchParams.get('code_challenge'));return response({key:'oauth-key'});}return response({data:[]});}});assert.equal(e.config.providers.openrouter.key,'oauth-key');assert(!auth.searchParams.has('callback_url'));
 e=engine();await assert.rejects(helper.run(e,{provider:'openrouter',ask:async()=>null}),/cancelled/);assert.deepEqual(e.config,{providers:{}});
 e=engine();answers=['custom','local-ai','Local AI','http://127.0.0.1:9876/v1','No key (local or public endpoint)','local-model','Save without testing','Save only'];
 await helper.run(e,{ask:async()=>answers.shift(),fetch:async()=>{throw Error('offline');}});const custom=helper.loadConnections(e.config)['local-ai'];assert(custom&&!custom.requiresKey);assert.equal(JSON.parse(custom.endpoints[0].body('',[])).model,'local-model');
 // A single-method flow (custom + API key, no saved key) must skip the
 // method question and go straight to the key prompt: users paste the key
 // at the first prompt and otherwise loop on 'Choose a listed number or name.'
 e=engine();answers=['custom','my-api','My API','https://api.example.com/v1','API key','sk-live-key-123','my-model','Save without testing','Save only'];questions=[];
 await helper.run(e,{ask:async q=>{questions.push(q.title);return answers.shift();},fetch:async()=>{throw Error('offline');}});
 assert(!questions.includes('How would you like to connect?'));assert.equal(e.config.providers['my-api'].key,'sk-live-key-123');
 for(const address of ['http://remote.test/v1','https://user:secret@example.com','https://example.com?key=secret'])assert.throws(()=>helper.url(address));
 for(const columns of [12,80]){const state=view.createState();state.question={secret:true};state.input='my-private-key';state.cursor=14;state.history=['old prompt'];state.historyIndex=1;view.key(state,'',{name:'up'});assert.equal(state.input,'my-private-key');assert(!view.frame(state,columns,24).lines.join('\n').includes('my-private-key'));view.key(state,'\r',{name:'return'});assert.deepEqual(state.history,['old prompt']);}
 // Drive the real TUI helper and prove typed credentials never enter transcript, history or export.
 const original=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-connect-ui-'));let app;try{process.chdir(temp);const real=require('../chode'),oldLoad=real.loadConfig,oldSave=real.saveConfig,oldReload=real.reloadConnections;let saved;
 real.loadConfig=()=>({providers:{}});real.saveConfig=cfg=>saved=cfg;real.reloadConnections=()=>{};
 try{const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};const output=new PassThrough();output.isTTY=true;output.columns=80;output.rows=24;let transcript='';output.on('data',c=>transcript+=c);app=require('../workspace-tui').launch({input,output,connectOptions:{fetch:async()=>response({data:[]})}});
 const send=async(value)=>{input.emit('keypress',value,{});input.emit('keypress','\r',{name:'return'});await new Promise(r=>setTimeout(r,50));};await send('/connect openrouter');await send('Paste API key');input.emit('keypress','test-secret-value',{});await new Promise(r=>setTimeout(r,60));assert(!transcript.includes('test-secret-value'));input.emit('keypress','\r',{name:'return'});await new Promise(r=>setTimeout(r,50));await send('current');await send('Save without testing');await send('Save only');assert(saved.providers.openrouter.key==='test-secret-value');assert(!JSON.stringify(app.state.messages).includes('test-secret-value'));assert(!JSON.stringify(app.state.history).includes('test-secret-value'));await send('/export');const exported=fs.readdirSync(path.join(temp,'.chode','exports'))[0];assert(!fs.readFileSync(path.join(temp,'.chode','exports',exported),'utf8').includes('test-secret-value'));
 await send('/connect openrouter');input.emit('keypress','',{ctrl:true,name:'c'});await new Promise(r=>setTimeout(r,50));assert(!app.state.busy);assert.equal(app.state.input,'');
 // A dead paste (terminal never delivered the key, e.g. bare Ctrl+V) plus an
 // empty Enter must guide the user instead of stranding them with no feedback.
 await send('/connect openrouter');await send('Paste API key');
 input.emit('keypress','\x16',{ctrl:true,name:'v',sequence:'\x16'});await new Promise(r=>setTimeout(r,60));assert.equal(app.state.input,'');
 const quiet=view.createState();quiet.question={question:'Q'};assert.equal(view.key(quiet,'\r',{name:'return',sequence:'\r'}).type,'hint');assert.equal(view.key(view.createState(),'\r',{name:'return',sequence:'\r'}),undefined);
 input.emit('keypress','\r',{name:'return',sequence:'\r'});await new Promise(r=>setTimeout(r,60));
 assert(app.state.question&&/API key/.test(app.state.question.question));
 assert(app.state.messages.some(m=>m.role==='notice'&&/No input received/.test(m.text)));
 input.emit('keypress','',{name:'escape'});await new Promise(r=>setTimeout(r,50));assert(!app.state.busy);
 }finally{real.loadConfig=oldLoad;real.saveConfig=oldSave;real.reloadConnections=oldReload;if(app)app.close();}}
 finally{process.chdir(original);fs.rmSync(temp,{recursive:true,force:true});}
 console.log('PASS: provider/model requests, OAuth PKCE exchange, cancellation, custom persistence, masked input, real TUI flow and secret-free history/export');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
