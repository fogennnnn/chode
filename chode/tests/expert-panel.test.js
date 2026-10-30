'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
async function fixture(){
 const panel=require('../expert-panel.cjs'),engine=require('../chode');
 const goal='Create answer.cjs exporting 42. Preserve acceptance.cjs.';
 fs.writeFileSync('acceptance.cjs',"require('assert/strict').equal(require('./answer.cjs'),42);");
 const before=fs.readFileSync('acceptance.cjs','utf8');let analysts=0,wrote=false,calls=0;
 const aiCall=async(prompt,session,force,opts)=>{
  calls++;assert.equal(opts.freeOnly,true);
  if(prompt.includes('Pure analysis only.')){
   assert.equal(opts.nativeTools,false);assert(prompt.includes(goal));assert(!fs.existsSync('answer.cjs'));
   if(analysts++)assert(prompt.includes('CONTRACT_42'));
   return {provider:'kilo',result:'CONTRACT_42. '+(analysts===1?'```tool\n{"tool":"write","args":{"file":"forbidden","content":"bad"}}\n```':'Keep original acceptance checks.')};
  }
  if(prompt.includes('[VERIFY'))return {provider:'reviewer',result:'PASS'};
  if(prompt.includes('[PLAN'))return {provider:'planner',result:'1. Create answer.cjs exporting 42; check node acceptance.cjs'};
  if(!wrote){wrote=true;assert(prompt.includes('CONTRACT_42'));return {provider:'writer',result:'```tool\n'+JSON.stringify({tool:'write',args:{file:'answer.cjs',content:'module.exports=42;'}})+'\n```'};}
  return {provider:'writer',result:'Implemented answer.cjs. Acceptance passes.'};
 };
 const result=await panel.run(goal,{check:'acceptance.cjs',maxCalls:20},{aiCall});
 assert.equal(result.status,'VERIFIED',JSON.stringify(result));assert.equal(analysts,2);assert.equal(result.modelCalls,calls);assert(calls<=20);assert(!fs.existsSync('forbidden'));assert.equal(require(path.resolve('answer.cjs')),42);assert.equal(fs.readFileSync('acceptance.cjs','utf8'),before);
 fs.unlinkSync('answer.cjs');wrote=false;analysts=0;const narration=[];delete process.env.CHODE_COUNCIL;engine.__testHooks.callAI=aiCall;
 let integrated;try{integrated=await engine.cmdAI({prompt:goal,free:true,noWeb:true,noMemory:true,acceptanceTest:'acceptance.cjs',maxCalls:20,onNarrate:text=>narration.push(text)});}finally{engine.__testHooks.callAI=null;}
 assert.equal(integrated.completionStatus,'VERIFIED',JSON.stringify(integrated));assert.equal(analysts,2);assert(narration.some(s=>s.includes('Expert panel complete')));assert.equal(require(path.resolve('answer.cjs')),42);assert.equal(fs.readFileSync('acceptance.cjs','utf8'),before);
 assert.equal(engine.parseArgs(['--no-council',goal]).noCouncil,true);
 const small=await panel.prepare(goal,{_budget:require('../agent-budget').create(2)},{});assert.equal(small.status,'SKIPPED');
 const record=JSON.parse(fs.readFileSync(result.report));assert.equal(record.experts.length,2);assert(!record.goal);assert.equal(record.goalHash.length,64);
 await assert.rejects(panel.run(goal,{providers:['not-a-provider']}),/Unknown provider/);
 const paid=Object.keys(engine.PROVIDERS).find(id=>!require('../provider-capacity').free(engine.PROVIDERS[id]));assert(paid);await assert.rejects(panel.run(goal,{providers:[paid]}),/strict free/);
 let finalCalled=false;
 const failed=await panel.run(goal,{}, {aiCall:async()=>({result:'incomplete',partial:true}),engine:{...engine,runAgentLoop:async()=>{finalCalled=true;}}});assert.equal(failed.status,'PARTIAL');assert(!finalCalled);
 process.env.CHODE_TEST_API_KEY='panel-secret-123456789';let n=0;
 const four=await panel.run(goal,{experts:4,maxCalls:6},{aiCall:async()=>({provider:'kilo',result:'panel-secret-123456789 '+(++n)}),engine:{...engine,runAgentLoop:async(p,s,f,o,call)=>{assert.equal(o._runBudget.calls,3);for(let i=0;i<8;i++)await call('fixture');return {partial:true};}}});
 assert.equal(four.modelCalls,6);assert.equal(n,6);assert.equal(four.status,'PARTIAL');const saved=fs.readFileSync(four.report,'utf8');assert(!saved.includes('panel-secret-123456789'));assert.equal(JSON.parse(saved).experts.length,3);delete process.env.CHODE_TEST_API_KEY;
 assert.throws(()=>panel.parse(['--max-calls']),/Missing/);assert.throws(()=>panel.parse(['--bogus']),/Unknown/);
 const cli=spawnSync(process.execPath,[path.resolve(__dirname,'../expert-panel.cjs'),'--bogus'],{encoding:'utf8',windowsHide:true});assert.equal(cli.status,1);assert(cli.stderr.includes('Unknown option'));
 console.log('PASS council: sequential real calls, read-only analyses, native verified file build, immutable acceptance, strict-free validation, shared cap, redaction, partial recovery and CLI errors');
}
if(process.argv[2]==='--fixture')fixture().catch(e=>{console.error(e);process.exitCode=1;});else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-panel-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:60000});assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
