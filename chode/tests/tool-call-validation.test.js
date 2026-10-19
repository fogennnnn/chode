'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process'),{validate}=require('../tool-call-validation');
async function fixture(){
 const e=require('../chode');
 const flat=e.parseToolCalls('```tool\n{"tool":"exec","cmd":"node --version","background":true}\n```');
 assert.deepEqual(flat,[{tool:'exec',args:{cmd:'node --version',background:true}}]);
 assert.deepEqual(e.parseToolCalls('```tool\n{"tool":"read","file":"kept.js","args":{}}\n```')[0].args,{},'explicit envelope takes precedence');
 assert.equal(e.parseToolCalls('```tool\n'+JSON.stringify(Array.from({length:20},(_,i)=>({tool:'read',file:'file'+i})))+'\n```').length,6,'array envelopes respect the per-response parser cap');
 for(const tool of ['read','write','edit','exec'])assert(validate({tool,args:{}})?.invalidArguments,tool);
 assert(validate({tool:'write',args:{file:'kept.js'}}));
 assert.equal(validate({tool:'write',args:{file:'empty.js',content:''}}),null,'explicit empty files allowed');
 assert.equal(validate({tool:'write',args:{file:'alias.js',text:'value'}}),null,'text alias retained');
 assert.equal(validate({tool:'edit',args:{file:'x',oldString:'x',newString:''}}),null,'deletion remains supported');
 assert.equal(validate({tool:'edit',args:{file:'x',oldString:'  ',newString:'\t'}}),null,'whitespace edits remain supported');
 assert.equal(validate({tool:'jobs',args:{}}),null,'default job listing remains supported');
 fs.writeFileSync('kept.js','module.exports=1;');let switched=false,done=false;
 const block=(tool,args)=>'```tool\n'+JSON.stringify({tool,args})+'\n```';
 const result=await e.runAgentLoop('Fix kept.js to export 42.',null,null,{v2:true},async(prompt,session,force,options)=>{
   if(prompt.startsWith('[PLAN'))return {provider:'bad',result:'1. Edit kept.js — check: node --check kept.js'};
   if(prompt.startsWith('[VERIFY'))return {provider:'review',result:'PASS'};
   if(!switched&&!options.excludeProviders?.includes('bad'))return {provider:'bad',result:block('write',{file:'kept.js'})+block('exec',{cmd:'node --version'})+block('read',{})};
   if(!switched){switched=true;assert.equal(fs.readFileSync('kept.js','utf8'),'module.exports=1;','missing content must never clobber a file');assert(prompt.includes('[FAILED TOOL RECOVERY]'));assert(prompt.includes('Required: write'));return {provider:'good',result:'```tool\n'+JSON.stringify({tool:'edit',file:'kept.js',oldString:'module.exports=1;',newString:'module.exports=42;'})+'\n```'};}
   done=true;return {provider:'good',result:'Ready to verify.'};
 });
 assert(switched&&done);assert.equal(result.completionStatus,'VERIFIED');assert.equal(require(path.resolve('kept.js')),42);
 let requests=0;
 const forced=await e.runAgentLoop('Fix kept.js to export 99.',null,'selected',{v2:true,toolCap:6},async(prompt,session,force,options)=>{assert.equal(force,'selected');assert(!options.excludeProviders?.includes('selected'));requests++;return {provider:'selected',result:block('exec',{})+block('read',{})};});
 assert(requests<=5,'explicit provider retries remain bounded');assert.notEqual(forced.completionStatus,'VERIFIED');assert.equal(fs.readFileSync('kept.js','utf8'),'module.exports=42;');
 fs.writeFileSync('planned.js','module.exports=0;');let planned=false;
 const plannedResult=await e.runAgentLoop('Build planned.js exporting 8.',null,null,{v2:true},async prompt=>{
  if(prompt.startsWith('[PLAN')){assert(prompt.includes('create/overwrite'));return {provider:'planner',result:'1. Create/overwrite planned.js — check: node --check planned.js'};}
  if(prompt.startsWith('[VERIFY'))return {provider:'review',result:'PASS'};
  if(!planned){assert(prompt.includes('[ACTIVE PLAN]'));assert(prompt.includes('Create/overwrite planned.js'));assert(prompt.includes('[FILE EDIT RULES]'));planned=true;return {provider:'writer',result:block('write',{file:'planned.js',content:'module.exports=8;'})};}
  return {provider:'writer',result:'Ready to verify.'};
 });assert.equal(plannedResult.completionStatus,'VERIFIED');assert.equal(require(path.resolve('planned.js')),8);
 console.log('PASS: malformed tools cannot erase files, useful schemas survive, failover survives a successful command, forced providers stay selected and retries stay bounded');
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-tool-args-'));try{const result=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(result.status,0,result.stdout+result.stderr);console.log(result.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
