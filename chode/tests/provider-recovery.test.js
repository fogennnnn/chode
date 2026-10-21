'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http'),{spawnSync}=require('child_process');
async function fixture(){
 const engine=require('../chode');
 let calls=0;
 const recovered=await engine.runAgentLoop('Write answer.js exporting 7.','recover',null,{freeOnly:true,noMemory:true,maxModelCalls:5},async()=>{calls++;if(calls===1)return null;if(calls===2)return {provider:'fixture',result:'```tool\n'+JSON.stringify({tool:'write',args:{file:'answer.js',content:'module.exports=7;'}})+'\n```'};return {provider:'fixture',result:'Done'};});
 assert.equal(require(path.resolve('answer.js')),7);assert.equal(calls,3);assert(recovered.actions.writes.includes('answer.js'));
 calls=0;await engine.runAgentLoop('Explain this.','bounded',null,{freeOnly:true,noMemory:true,maxModelCalls:2},async()=>{calls++;return null;});assert.equal(calls,2,'empty recovery shares the root model budget');
 let implemented=false;const task='Implement helpers.py. Edit only helpers.py. Do not create or modify tests.';
 const direct=await engine.runAgentLoop(engine.agentToolPrompt()+'\n'+task,'direct',null,{v2:true,freeOnly:true,noMemory:true,maxModelCalls:6,planTargets:['helpers.py'],overwriteTargets:['helpers.py']},async prompt=>{
  assert(!prompt.startsWith('[PLAN'),'an explicitly bounded single-file edit avoids an unnecessary planning request');
  if(prompt.startsWith('[VERIFY'))return {provider:'review-fixture',result:'PASS'};
  if(!implemented){implemented=true;return {provider:'draft-fixture',result:'```tool\n'+JSON.stringify({tool:'write',args:{file:'helpers.py',content:'def answer():\n    return 42\n'}})+'\n```'};}
  return {provider:'draft-fixture',result:'Implemented'};
 },null,null,{originalTask:task});assert(direct.planSkipped);assert.equal(direct.completionStatus,'VERIFIED');
 for(const id of Object.keys(engine.PROVIDERS))delete engine.PROVIDERS[id];
 let closed=false;
 let nativeRequests=[],silentRequests=0;
 const server=http.createServer(async(req,res)=>{if(req.url==='/slow'){res.on('close',()=>closed=true);return;}if(req.url==='/silent-native'){silentRequests++;res.writeHead(200,{'Content-Type':'text/event-stream'});res.flushHeaders();return;}res.setHeader('Content-Type','application/json');if(req.url==='/native'){let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);nativeRequests.push(body);res.end(JSON.stringify({choices:[{message:body.tools?{tool_calls:[{type:'function',function:{name:'write',arguments:JSON.stringify({file:'native.py',content:'print(7)\n'})}}]}:{content:'plain answer'},finish_reason:'stop'}]}));return;}res.end('{"choices":[{"message":{"content":"fast answer"},"finish_reason":"stop"}]}');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  for(const id of ['slow','fast'])engine.PROVIDERS[id]={name:id,category:'keyless',requiresKey:null,endpoints:[{type:'chat',url:'http://127.0.0.1:'+server.address().port+'/'+id,headers:()=>({'Content-Type':'application/json'}),body:()=>'{"messages":[]}',parse:data=>data.choices?.[0]?.message?.content}]};
  engine.saveLeaderboard({ranked:[{id:'slow',score:100},{id:'fast',score:99}],providers:{}});
  const answer=await engine.callWithBestProvider('Test actual routing','http',null,{freeOnly:true,maxRetries:1,timeoutMs:4000,noRateWait:true,quietFailures:true});
  assert.equal(answer.provider,'fast');assert.equal(answer.result,'fast answer');
  for(let i=0;i<50&&!closed;i++)await new Promise(resolve=>setTimeout(resolve,20));assert(closed,'losing HTTP request is cancelled');
  engine.PROVIDERS.native={name:'Native fixture',category:'keyless',nativeTools:true,endpoints:[{type:'chat',url:'http://127.0.0.1:'+server.address().port+'/native',headers:()=>({'Content-Type':'application/json'}),body:(key,messages)=>JSON.stringify({model:'fixture',messages}),parse:data=>data.choices?.[0]?.message?.content}]};
  const nativeAnswer=await engine.trySingleProvider('native','Implement native.py',{messages:[]},1,{quiet:true,nativeTools:true,disallow:['exec'],onToken:()=>{}});
  assert(nativeRequests[0].tools.some(tool=>tool.function.name==='write'));assert(!nativeRequests[0].tools.some(tool=>tool.function.name==='exec'));assert(nativeRequests[0].stream,'native requests stream complete tool arguments with JSON fallback');
  const parsed=engine.parseToolCalls(nativeAnswer.result);assert.equal(parsed[0].args.file,'native.py');
  const ctx={actions:{reads:0,writes:[],edits:[],execs:[],fetched:[]},planTargets:['native.py'],overwriteTargets:['native.py']};
  assert((await engine.runAgentTool(parsed[0],ctx)).ok);assert.equal(fs.readFileSync('native.py','utf8'),'print(7)\n');
  assert(!(await engine.runAgentTool({tool:'write',args:{file:'../escape.py',content:'no'}},ctx)).ok,'native calls retain workspace guards');
  engine.PROVIDERS.silent={...engine.PROVIDERS.native,endpoints:[{...engine.PROVIDERS.native.endpoints[0],url:'http://127.0.0.1:'+server.address().port+'/silent-native'}]};
  await assert.rejects(engine.trySingleProvider('silent','Bounded native stream',{messages:[]},1,{quiet:true,nativeTools:true,timeoutMs:300}),/timeout_after_300ms/);assert.equal(silentRequests,1,'a timed-out native request is not duplicated as a buffered request');
  const plain=await engine.trySingleProvider('native','Plan only',{messages:[]},1,{quiet:true,nativeTools:true,disallow:['read','write','edit','exec','glob','grep']});assert.equal(plain.result,'plain answer');assert(!nativeRequests[1].tools,'planning/verifying can disable all native tools');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 console.log('PASS provider recovery: actual fast HTTP wins/cancels stalled loser; empty answers retry within shared budget and retain tool execution');
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});
else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-provider-recovery-'));try{const result=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:15000});assert.ifError(result.error);assert.equal(result.status,0,result.stdout+result.stderr);console.log(result.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
