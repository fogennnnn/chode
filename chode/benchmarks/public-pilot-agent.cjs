'use strict';
const fs=require('fs'),path=require('path');
const spec=JSON.parse(fs.readFileSync(process.argv[2]));
const engine=require(spec.engine),calls=[];
const attempts=[],realTry=engine.trySingleProvider,attemptFile=path.join(path.dirname(spec.callsFile),'provider-attempts.json');
engine.__testHooks.trySingle=async(...args)=>{const event={provider:args[0],startedAt:new Date().toISOString(),nativeTools:!!args[4]?.nativeTools};attempts.push(event);fs.writeFileSync(attemptFile,JSON.stringify(attempts,null,2));const started=Date.now();try{const result=await realTry(...args);Object.assign(event,{ms:Date.now()-started,answer:!!result?.result,finishReason:result?.finishReason||null});return result;}catch(error){Object.assign(event,{ms:Date.now()-started,errorCode:args[4]?.signal?.aborted?'cancelled':String(error.message||'failure').split(':')[0].slice(0,80)});throw error;}finally{fs.writeFileSync(attemptFile,JSON.stringify(attempts,null,2));}};
const real=engine.callWithBestProvider;
const ai=async(prompt,session,force,options)=>{
  const started=Date.now();
  let result;try{result=await real(prompt,session,force,{...options,freeOnly:true,maxRetries:1,timeoutMs:30000,noRateWait:true,quietFailures:true});}catch(error){calls.push({provider:null,ms:Date.now()-started,returnedAnswer:false,errorCode:String(error.message||'failure').split(':')[0].slice(0,80)});fs.writeFileSync(spec.callsFile,JSON.stringify(calls,null,2));throw error;}
  calls.push({provider:result?.provider||null,ms:Date.now()-started,returnedAnswer:!!result?.result,tokensEstimate:result?.tokens||0});
  fs.writeFileSync(spec.callsFile,JSON.stringify(calls,null,2));
  return result;
};
const task='Implement this public Python exercise in '+spec.solutions.join(', ')+'. Complete all requested behavior. Edit only the listed solution files. Do not search the web or obtain a reference solution. Do not modify or create tests. External unchanged tests will evaluate your code.\n\n'+spec.instructions;
const prompt=task+'\n\nStarting files (initial observations, not requirements; use current reads after editing):\n'+spec.solutions.map(name=>'FILE '+name+'\n'+fs.readFileSync(name,'utf8')).join('\n');
engine.runAgentLoop(engine.agentToolPrompt()+'\n'+prompt,'public-pilot',null,
 {freeOnly:true,noMemory:true,v2:true,maxModelCalls:spec.modelCallsPerTask||6,toolCap:spec.toolCap||16,acceptanceTest:spec.acceptanceTest,planTargets:spec.solutions,overwriteTargets:spec.solutions,
 disallow:['websearch','webfetch','github','dev-recon','toolbox','task','ask','rea'],timeoutMs:30000,maxRetries:1},ai,
 event=>{if(event.phase==='done')console.log(JSON.stringify({tool:event.call?.tool,ok:!!event.result?.ok,error:event.result?.error||null}));},null,{originalTask:task})
 .then(result=>{fs.writeFileSync(spec.agentResult,JSON.stringify({completionStatus:result?.completionStatus,partial:result?.partial,budgetExhausted:result?.budgetExhausted,calls,actions:result?.actions},null,2));})
 .catch(error=>{fs.writeFileSync(spec.agentResult,JSON.stringify({error:String(error.message),calls},null,2));process.exitCode=1;});
