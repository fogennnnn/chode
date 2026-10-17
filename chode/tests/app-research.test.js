'use strict';
const assert=require('assert');const fs=require('fs');const os=require('os');const path=require('path');const {spawnSync}=require('child_process');
async function fixture(){
 const engine=require('../chode');
 assert.equal(engine.wantsHtmlArtifact('Build an app in index.html and list.js'),false);
 assert.equal(engine.wantsHtmlArtifact('Build a React website'),false);
 assert.equal(engine.wantsHtmlArtifact('Create a website from this URL'),true);
 assert.equal(engine.wantsHtmlArtifact('Build app.js','single.html'),true);
 const requests=[];let drafted=false;
 engine.__testHooks.callAI=async(prompt,session,force,options)=>{
  requests.push(prompt);
  if(prompt.startsWith('[PLAN'))return {result:'1. Create index.html — check: controls labelled\n2. Create list.js — check: node --check list.js',provider:'fixture'};
  if(prompt.startsWith('[VERIFY')){assert.ok(prompt.includes('module.exports'), 'verifier must see actual artifact content');return {result:'PASS',provider:force||'reviewer'};}
  if(!drafted){drafted=true;return {provider:'fixture',result:['```tool',JSON.stringify({tool:'write',args:{file:'index.html',content:'<!doctype html><html><head><title>List</title></head><body><label for="item">Item</label><input id="item"><button>Add</button><script src="list.js"></script></body></html>'}}),'```','```tool',JSON.stringify({tool:'write',args:{file:'list.js',content:'module.exports = { addItem: (items, text) => items.concat({ text }) };\n'}}),'```'].join('\n')};}
  return {result:'Created both files. JavaScript syntax was checked.',provider:'fixture'};
 };
 const res=await engine.cmdAI({prompt:'Build a shopping-list app in index.html and list.js',noWeb:true,session:'apps'});
 assert.equal(res.completionStatus,'VERIFIED');assert.ok(fs.existsSync('index.html')&&fs.existsSync('list.js'));assert.ok(!fs.existsSync('site-copy.html'));
 fs.writeFileSync('broken.js','const = ;');
 const bad=await engine.cheapVerifyGate([],{writes:['broken.js'],edits:[]});assert.equal(bad.pass,false);assert.ok(bad.failed.some(c=>c.check.includes('JavaScript syntax')));
 fs.writeFileSync('broken.json','{"broken":');const badJson=await engine.cheapVerifyGate([],{writes:['broken.json'],edits:[]});assert.equal(badJson.pass,false);
 fs.writeFileSync('notes.md','Release 2.1 is blocked.');const actions={};const source=await engine.runAgentTool({tool:'read',args:{file:'notes.md'}},{actions});
 // runAgentTool is the dispatcher; the outer loop records successful observations.
 assert.equal(source.ok,true);
 const loop=await engine.runAgentLoop('Inspect notes.md',null,null,{v2:true},async prompt=>prompt.startsWith('[TOOL RESULTS')?{result:'Release is blocked. [source](notes.md)',provider:'fixture'}:{result:'```tool\n'+JSON.stringify({tool:'read',args:{file:'notes.md'}})+'\n```',provider:'fixture'},null,null,{originalTask:'Inspect notes.md'});
 assert.equal(loop.actions.sources.length,1);assert.equal(loop.actions.sources[0].locator,'notes.md');
 console.log('✓ apps/research: multi-file routing, actual verification evidence, syntax gates and source records');
}
if(process.argv[2]==='--fixture'){fixture().catch(e=>{console.error(e);process.exitCode=1;});}else{const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-app-research-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:temp,encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(temp,{recursive:true,force:true});}}
