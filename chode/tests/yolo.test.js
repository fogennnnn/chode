'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
async function fixture(){const e=require('../chode'),commands=require('../workspace-commands'),view=require('../workspace-view');
const outside=path.join(path.dirname(process.cwd()),path.basename(process.cwd())+'-external.txt');fs.writeFileSync(outside,'safe fixture');try{
 const call={tool:'read',args:{file:outside}};let asks=0;
 assert.equal((await e.runAgentTool(call,{actions:{}})).ok,false);
 const allowed=await e.runAgentTool(call,{yolo:true,actions:{},onAsk:()=>{asks++;throw Error('must not prompt');}});assert.equal(allowed.ok,true);assert.equal(asks,0);
 const denied=await e.runAgentTool(call,{actions:{},onAsk:async()=>({ok:true,selected:'Deny'})});assert.equal(denied.deniedByUser,true);
 const cmd=JSON.stringify(process.execPath)+' -e '+JSON.stringify("console.log('shutdown fixture only')");
 const run={tool:'exec',args:{cmd}};assert.equal((await e.runAgentTool(run,{actions:{}})).ok,false);assert.equal((await e.runAgentTool(run,{yolo:true,actions:{}})).ok,true);
 assert.equal((await e.runAgentTool({tool:'write',args:{file:'plan-bad',content:'bad'}},{yolo:true,mode:'plan',actions:{}})).ok,false);assert(!fs.existsSync('plan-bad'));
 const state=view.createState({workspace:'fixture'});commands.run('/yolo on',state,e);assert.equal(state.yolo,true);assert(view.frame(state,90,30).lines.join('\n').includes('YOLO'));commands.run('/yolo off',state,e);assert.equal(state.yolo,false);state.busy=true;commands.run('/yolo on',state,e);assert.equal(state.yolo,false);
 assert.equal(e.parseArgs(['--yolo','Build']).yolo,true);assert.equal(e.parseArgs(['--no-yolo','Build']).yolo,false);
 console.log('PASS YOLO: explicit CLI/TUI toggle, indicator, automatic path/command grants, normal denial, no question and plan guard');
}finally{fs.unlinkSync(outside);}}
if(process.argv[2]==='--fixture')fixture().catch(e=>{console.error(e);process.exitCode=1;});else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-yolo-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:30000});assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
