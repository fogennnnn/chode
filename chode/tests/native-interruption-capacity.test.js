'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http'),{spawnSync}=require('child_process');
async function fixture(){
 const e=require('../chode');let requests=0,interrupted=true;
 const server=http.createServer((req,res)=>{requests++;if(!interrupted){res.setHeader('content-type','application/json');res.end(JSON.stringify({choices:[{message:{content:'Recovered answer'},finish_reason:'stop'}]}));return;}res.writeHead(200,{'content-type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{delta:{tool_calls:[{index:0,function:{name:'write',arguments:'{"file":"unfinished.js",'}}]}}]})+'\n\n');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));for(const id of Object.keys(e.PROVIDERS))delete e.PROVIDERS[id];
 e.PROVIDERS.fixture={name:'fixture',category:'keyless',nativeTools:true,endpoints:[{type:'chat',url:'http://127.0.0.1:'+server.address().port,headers:()=>({'content-type':'application/json'}),body:()=>'{"messages":[]}',parse:data=>data.choices?.[0]?.message?.content}]};
 try{
  const task='Implement unfinished.js exporting 42.',options={v2:true,freeOnly:true,noMemory:true,resumeBuild:true,maxModelCalls:5,maxRetries:1,timeoutMs:500,planTargets:['unfinished.js']};
  const result=await e.runAgentLoop(task,null,null,options,e.callWithBestProvider);
  assert.equal(requests,1,'one interrupted stream must enter cooldown, not consume three model calls');assert.equal(result.modelCalls,1);assert.equal(result.completionStatus,'PARTIAL');assert(result.progressSaved);assert(result.retryAt>Date.now()+13000);assert(!fs.existsSync('unfinished.js'),'partial tool arguments must never execute');
  const again=await e.runAgentLoop(task,null,null,options,e.callWithBestProvider);assert.equal(requests,1);assert.equal(again.modelCalls,0);assert(again.retryAt);
  const capacity=require('../provider-capacity').create(path.join(process.cwd(),'.chode/provider-capacity'));capacity.clear('fixture');interrupted=false;
  const recovered=await e.callWithBestProvider('Resume available service',null,null,{freeOnly:true,nativeTools:true,maxRetries:1,timeoutMs:500,noRateWait:true});assert.equal(recovered.result,'Recovered answer');assert.equal(requests,2);assert.equal(capacity.remaining('fixture'),0);
  console.log('PASS interrupted native stream: one real HTTP request, short persisted cooldown, saved work and retry time, zero calls while cooling, complete response recovers; partial tools never execute');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-native-interrupt-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
