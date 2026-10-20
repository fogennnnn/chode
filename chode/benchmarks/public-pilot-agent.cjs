'use strict';
const fs=require('fs'),path=require('path');
const spec=JSON.parse(fs.readFileSync(process.argv[2]));
const engine=require(spec.engine),calls=[];
const real=engine.callWithBestProvider;
const ai=async(prompt,session,force,options)=>{
  const started=Date.now();
  const result=await real(prompt,session,force,{...options,freeOnly:true,maxRetries:1,timeoutMs:30000,noRateWait:true,quietFailures:true});
  calls.push({provider:result?.provider||null,ms:Date.now()-started,returnedAnswer:!!result?.result,tokensEstimate:result?.tokens||0});
  fs.writeFileSync(spec.callsFile,JSON.stringify(calls,null,2));
  return result;
};
const prompt='Implement this public Python exercise in '+spec.solutions.join(', ')+'. Complete all requested behavior. Edit only the listed solution files. Do not search the web or obtain a reference solution. Do not modify or create tests. External unchanged tests will evaluate your code.\n\n'+spec.instructions+'\n\nStarting files:\n'+spec.solutions.map(name=>'FILE '+name+'\n'+fs.readFileSync(name,'utf8')).join('\n');
engine.runAgentLoop(engine.agentToolPrompt()+'\n'+prompt,'public-pilot',null,
 {freeOnly:true,noMemory:true,v2:true,maxModelCalls:6,toolCap:16,planTargets:spec.solutions,overwriteTargets:spec.solutions,
 disallow:['websearch','webfetch','github','dev-recon','toolbox','task','ask','rea'],timeoutMs:30000,maxRetries:1},ai,
 event=>{if(event.phase==='done')console.log(JSON.stringify({tool:event.call?.tool,ok:!!event.result?.ok,error:event.result?.error||null}));},null,{originalTask:prompt})
 .then(result=>{fs.writeFileSync(spec.agentResult,JSON.stringify({completionStatus:result?.completionStatus,partial:result?.partial,budgetExhausted:result?.budgetExhausted,calls,actions:result?.actions},null,2));})
 .catch(error=>{fs.writeFileSync(spec.agentResult,JSON.stringify({error:String(error.message),calls},null,2));process.exitCode=1;});
