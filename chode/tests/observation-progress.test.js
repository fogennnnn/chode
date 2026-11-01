'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
const progress=require('../observation-progress');
async function fixture(){
 const e=require('../chode');fs.writeFileSync('answer.cjs','module.exports=0;');
 const contract="require('assert/strict').equal(require('./answer.cjs'),42);";fs.writeFileSync('contract.cjs',contract);
 const block=(tool,args)=>'```tool\n'+JSON.stringify({tool,args})+'\n```';let turns=0;
 const result=await e.runAgentLoop('Fix answer.cjs to export 42.',null,null,{v2:true,freeOnly:true,noMemory:true,maxModelCalls:7,acceptanceTest:'contract.cjs',planTargets:['answer.cjs'],overwriteTargets:[]},async prompt=>{
  if(prompt.startsWith('[VERIFY'))return {provider:'independent',result:'PASS'};
  turns++;
  if(turns<=3){assert(!prompt.includes('[OBSERVATION RECOVERY]'));return {provider:'draft',result:block('read',{file:'answer.cjs'})};}
  if(turns===4){assert(prompt.includes('[OBSERVATION RECOVERY]'));assert(prompt.includes('module.exports=0;'));return {provider:'draft',result:block('edit',{file:'answer.cjs',oldString:'module.exports=0;',newString:'module.exports=42;'})};}
  assert(!prompt.includes('[OBSERVATION RECOVERY]'),'real mutation resets repetition');return {provider:'draft',result:'Implemented and checked.'};
 });
 assert.equal(result.completionStatus,'VERIFIED');assert.equal(turns,5);assert.equal(require(path.resolve('answer.cjs')),42);assert.equal(fs.readFileSync('contract.cjs','utf8'),contract);
 console.log('PASS repeated observations: guidance reaches a real agent repair without skipped tools, extra budget or overwrite permission; immutable checks and independent review retained');
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});else{
 const p=progress.create(),call={tool:'read',args:{file:'x',offset:1}},value={ok:true,content:'same',nextRead:{offset:2}};
 p.record(call,value);p.record({...call,args:{file:'x',offset:2}},value);assert.equal(p.guidance(),'','different pages are progress');
 p.record(call,{...value,content:'changed'});assert.equal(p.guidance(),'','new evidence is progress');
 p.record(call,value);assert.equal(p.guidance(),'');p.record(call,value);assert(p.guidance());
 p.record({tool:'write'},{ok:false});assert(p.guidance(),'failed mutation cannot reset');p.record({tool:'multiedit'},{ok:true,preview:true,files:['x']});assert(p.guidance(),'preview cannot reset');p.record({tool:'edit'},{ok:true});assert.equal(p.guidance(),'');
 const j=progress.create(),unknown={ok:false,error:'Unknown background job.'},jc={tool:'jobs',args:{action:'status',id:'nope'}};
 j.record(jc,unknown);assert.equal(j.guidance(),'','single unknown job poll is not yet a loop');
 j.record(jc,unknown);assert(j.guidance().includes('jobs list'),'repeated unknown job id polls guide a jobs list lookup');
 const j2=progress.create();j2.record(jc,unknown);j2.record({tool:'read',args:{file:'x'}},{ok:true,content:'y'});j2.record(jc,unknown);assert.equal(j2.guidance(),'','interleaved work breaks the poll streak');
 const j3=progress.create();j3.record(jc,unknown);j3.record(jc,unknown);assert(j3.guidance());j3.record({tool:'edit'},{ok:true});assert.equal(j3.guidance(),'','genuine edit resets poll guidance');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-observation-progress-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
