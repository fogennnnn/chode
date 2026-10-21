'use strict';
// SWE-bench agent adapter: drives runAgentLoop once against a repo checked out
// at base_commit, then extracts a unified model_patch. Test edits are rejected,
// never emitted; grading happens later in official `swebench eval`.
const fs=require('fs'),path=require('path');
const spec=JSON.parse(fs.readFileSync(process.argv[2]));
const engine=require(process.env.CHODE_ENGINE||spec.engine||path.join(__dirname,'..','chode.js'));
const {extractPatch,touchesTests}=require('./swebench-patch.cjs');
const calls=[];
const attempts=[],realTry=engine.trySingleProvider,attemptFile=path.join(path.dirname(spec.callsFile),'provider-attempts.json');
engine.__testHooks.trySingle=async(...args)=>{const event={provider:args[0],startedAt:new Date().toISOString(),nativeTools:!!args[4]?.nativeTools};attempts.push(event);fs.writeFileSync(attemptFile,JSON.stringify(attempts,null,2));const started=Date.now();try{const result=await realTry(...args);Object.assign(event,{ms:Date.now()-started,answer:!!result?.result,finishReason:result?.finishReason||null});return result;}catch(error){Object.assign(event,{ms:Date.now()-started,errorCode:args[4]?.signal?.aborted?'cancelled':String(error.message||'failure').split(':')[0].slice(0,80)});throw error;}finally{fs.writeFileSync(attemptFile,JSON.stringify(attempts,null,2));}};
const real=engine.callWithBestProvider;
const forceProvider=process.env.CHODE_BENCH_PROVIDER||null;
const ai=async(prompt,session,force,options)=>{
  const started=Date.now();
  let result;try{result=await real(prompt,session,forceProvider||force,{...options,freeOnly:true,maxRetries:1,timeoutMs:30000,noRateWait:true,quietFailures:true});}catch(error){calls.push({provider:null,ms:Date.now()-started,returnedAnswer:false,errorCode:String(error.message||'failure').split(':')[0].slice(0,80)});fs.writeFileSync(spec.callsFile,JSON.stringify(calls,null,2));throw error;}
  calls.push({provider:result?.provider||null,ms:Date.now()-started,returnedAnswer:!!result?.result,tokensEstimate:result?.tokens||0});
  fs.writeFileSync(spec.callsFile,JSON.stringify(calls,null,2));
  return result;
};
const task=String(spec.problem_statement||'')+repoOrientation(process.cwd())+'\n\nEdit source files only to fix the described issue. Do not modify, create, or delete tests.';
function repoOrientation(cwd){
  let entries=[];
  try{entries=fs.readdirSync(cwd).filter(n=>n!=='.git'&&n!=='.chode').slice(0,40);}catch{return '';}
  if(!entries.length)return '';
  return '\n\nRepository top-level contents (cwd):\n'+entries.join('\n');
}
async function execute(){
  const options={freeOnly:true,noMemory:true,v2:true,maxModelCalls:spec.modelCallsPerTask||6,toolCap:spec.toolCap||16,disallow:['websearch','webfetch','github','dev-recon','toolbox','task','ask','rea'],timeoutMs:30000,maxRetries:1};
  const result=await engine.runAgentLoop(engine.agentToolPrompt()+'\n'+task,'swebench',null,options,ai,event=>{if(event.phase==='done')console.log(JSON.stringify({tool:event.call?.tool,ok:!!event.result?.ok,error:event.result?.error||null}));},null,{originalTask:task});
  const patch=extractPatch(process.cwd());
  const base={completionStatus:result?.completionStatus,partial:result?.partial,budgetExhausted:result?.budgetExhausted,calls,actions:result?.actions};
  if(!patch)return {...base,patchRejected:'empty'};
  if(touchesTests(patch,['test/','tests/','spec/','testing/','__tests__/']))return {...base,patchRejected:'test-edit'};
  return {...base,model_patch:patch};
}
execute().then(result=>{fs.writeFileSync(spec.agentResult,JSON.stringify(result,null,2));}).catch(error=>{fs.writeFileSync(spec.agentResult,JSON.stringify({error:String(error.message),calls},null,2));process.exitCode=1;});
