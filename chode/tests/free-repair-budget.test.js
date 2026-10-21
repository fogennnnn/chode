'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
async function fixture(){
 const e=require('../chode'),budget=require('../agent-budget').create(7);let calls=0;
 fs.writeFileSync('contract.cjs',"require('assert/strict').equal(require('./answer.cjs'),42)");
 const block=(tool,args)=>'```tool\n'+JSON.stringify({tool,args})+'\n```';
 const replies=[block('write',{file:'answer.cjs',content:'module.exports=0;'}),'Implemented',block('read',{file:'answer.cjs'}),block('edit',{file:'answer.cjs',oldString:'module.exports=0;',newString:'module.exports=42;'}),'Repaired'];
 const result=await e.runAgentLoop('Implement answer.cjs exporting 42.',null,null,{v2:true,freeOnly:true,noMemory:true,_runBudget:budget,acceptanceTest:'contract.cjs',planTargets:['answer.cjs'],overwriteTargets:['answer.cjs']},async(prompt,session,force,options)=>{assert.equal(options.freeOnly,true);calls++;return {provider:prompt.startsWith('[VERIFY')?'reviewer':'drafter',result:prompt.startsWith('[VERIFY')?'PASS':replies.shift()};},null,null,{originalTask:'Implement answer.cjs exporting 42.'});
 assert.equal(result.completionStatus,'VERIFIED',JSON.stringify(result));assert.equal(calls,6);assert.equal(budget.calls,calls,'nested free repair consumes one shared unit per actual model call');assert(!budget.exhausted);assert.equal(require(path.resolve('answer.cjs')),42);
 console.log('PASS shared free repair budget: actual failure repaired and independently verified without double-counting nested calls');
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});
else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-free-budget-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
