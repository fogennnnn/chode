'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
async function fixture(){
 const e=require('../chode');fs.writeFileSync('source.cjs','module.exports=1;');const budget={calls:0,limit:3};let actual=0;
 const block='```tool\n'+JSON.stringify({tool:'read',args:{file:'source.cjs'}})+'\n```';
 for(let run=0;run<3;run++)await e.runAgentLoop('Repair source.cjs.',null,null,{v2:true,freeOnly:true,noMemory:true,maxModelCalls:1,toolCap:3,_toolBudget:budget,planTargets:['source.cjs']},async()=>({provider:'draft',result:block+'\n'+block}),event=>{if(event.phase==='done'&&event.call?.tool==='read')actual++;});
 assert.equal(actual,3,'all invocations share one real execution cap');assert.equal(budget.calls,3);assert.equal(fs.readFileSync('source.cjs','utf8'),'module.exports=1;');
 console.log('PASS shared tool budget: real repeated agent invocations execute at most the global cap, including response batches and exhausted resumes');
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-shared-tools-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
