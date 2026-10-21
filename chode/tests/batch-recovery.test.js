'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
async function fixture(){
 const e=require('../chode');fs.writeFileSync('first.cjs','module.exports=0;');fs.writeFileSync('second.cjs','module.exports=1;');
 const edits=[{file:'first.cjs',oldString:'0',newString:'42'},{file:'second.cjs',oldString:'missing',newString:'2'}];
 const opts={approved:true,agent:true,planTargets:['first.cjs','second.cjs'],overwriteTargets:[]};
 let r=e.toolMultiEdit({edits},opts);assert(!r.ok);assert.equal(r.error,'oldString not found');assert.equal(r.file,'second.cjs');assert.deepEqual(r.recovery.read,{tool:'read',args:{file:'second.cjs'}});assert.equal(r.recovery.wholeFileWriteAllowed,false);assert.equal(fs.readFileSync('first.cjs','utf8'),'module.exports=0;');assert.equal(e.editChanges().changes.length,0);
 r=e.toolMultiEdit({edits},{...opts,overwriteTargets:['second.cjs']});assert(r.recovery.suggestWholeFileWrite);assert.equal(fs.readFileSync('second.cjs','utf8'),'module.exports=1;');
 for(const file of ['.env','../outside','.git/config']){r=e.toolMultiEdit({edits:[{file,oldString:'x',newString:'y'}]},opts);assert(!r.ok);assert(!r.recovery,'guarded targets do not produce edit guidance');}
 r=await e.runAgentTool({tool:'jobs',args:{action:'status',id:'made-up'}},{actions:{}});assert(!r.ok);assert.deepEqual(r.recovery.args,{action:'list'});assert.equal(r.recovery.tool,'jobs');assert(!('job' in r));
 let turn=0;const block=(tool,args)=>'```tool\n'+JSON.stringify({tool,args})+'\n```';
 const answer=await e.runAgentLoop('Repair first.cjs and second.cjs to export 42 and 2.',null,null,{v2:true,freeOnly:true,noMemory:true,maxModelCalls:5,planTargets:opts.planTargets,overwriteTargets:[]},async prompt=>{
  if(prompt.startsWith('[VERIFY'))return {provider:'review',result:'PASS'};
  if(++turn===1)return {provider:'draft',result:block('multiedit',{edits})};
  if(turn===2){assert(prompt.includes('unique exact observed oldString'));assert(prompt.includes('second.cjs'));return {provider:'draft',result:block('multiedit',{edits:[edits[0],{file:'second.cjs',oldString:'1',newString:'2'}]})};}
  return {provider:'draft',result:'Repaired both files.'};
 });
 assert.equal(answer.completionStatus,'VERIFIED');assert.equal(require(path.resolve('first.cjs')),42);assert.equal(require(path.resolve('second.cjs')),2);
 console.log('PASS batch and job recovery: atomic failure preserves both files, structured recovery reaches model, guards retained and unknown jobs require real list evidence');
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-batch-recovery-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
