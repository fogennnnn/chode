'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
async function fixture(){
 const e=require('../chode');const original=e.agentToolPrompt()+'\nCreate portable.cjs exporting 42.';let calls=0;
 const result=await e.runAgentLoop(original,null,null,{v2:true,freeOnly:true,noMemory:true,maxModelCalls:5,planTargets:['portable.cjs']},async prompt=>{
  if(prompt.startsWith('[VERIFY'))return {provider:'review',result:'PASS'};
  assert(prompt.includes('Runtime platform: '+process.platform));assert(prompt.includes('Exec uses the platform default shell'));assert(prompt.includes('jobs action log with the exact returned job id'));
  if(++calls===1)return {provider:'legacy-fixture',result:'```tool\n'+JSON.stringify({tool:'write',args:{file:'portable.cjs',content:'module.exports=42;'}})+'\n```'};
  return {provider:'legacy-fixture',result:'Implemented.'};
 },null,null,{originalTask:'Create portable.cjs exporting 42.'});
 assert.equal(result.completionStatus,'VERIFIED');assert.equal(calls,2);assert.equal(require(path.resolve('portable.cjs')),42);
 console.log('PASS universal platform context: legacy and rebuilt agent prompts identify actual shell platform, portable commands and exact-ID background logs; real tool execution and independent review retained');
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-platform-context-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
