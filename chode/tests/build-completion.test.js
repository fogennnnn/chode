'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process'),q=require('../build-quality');
async function fixture(){
 const e=require('../chode'),hooks=e.__testHooks;
 for(const brief of ['Build a multi-page website','Build website with index.html and contact.html','Create a website. Pages: Home, Work, Contact','Build a complete website for Northline'])assert.equal(e.wantsHtmlArtifact(brief),false);
 assert.throws(()=>e.wantsHtmlArtifact('Build website with backend and database','site.html'),/agent workspace/);
 assert(q.htmlIssues('<a href="#missing">Go</a>').some(x=>x.includes('missing anchor')));
 assert.deepEqual(q.htmlIssues('<a href="#target">Go</a><div id=target>Destination</div>'),[]);
 assert(q.htmlIssues('<script>function (</script>').some(x=>x.includes('syntax')));
 assert(q.htmlIssues('<script src="app.js"></script>',{selfContained:true}).some(x=>x.includes('local dependency')));
 const shell=body=>'<!doctype html><html lang="en"><head><title>Northline studio</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;max-width:70rem;margin:auto;padding:2rem}nav{display:flex;gap:1rem}@media(max-width:40rem){nav{flex-wrap:wrap}}</style></head><body><h1>Northline studio</h1>'+body+'</body></html>';
 const nav='<nav><a href="index.html">Home</a><a href="work.html">Work</a><a href="contact.html">Contact</a></nav>';
 const home=shell(nav+'<p>Independent architecture for places people love. Explore selected homes and workplaces, our collaborative process, and get in touch about your project.</p>');
 const work=shell(nav+'<label for="filter">Project category</label><select id="filter"><option value="all">All</option><option value="residential">Residential</option><option value="commercial">Commercial</option></select><article data-category="residential">Courtyard home</article><article data-category="commercial">Studio office</article><script>document.querySelector("#filter").addEventListener("change",e=>document.querySelectorAll("article").forEach(a=>a.hidden=e.target.value!=="all"&&a.dataset.category!==e.target.value));</script>');
 const contact=shell(nav+'<form><label for="email">Email</label><input id="email" name="email" type="email" required><label for="message">Message</label><textarea id="message" name="message" required></textarea><button>Save draft locally</button><output></output></form><script>document.querySelector("form").onsubmit=e=>{e.preventDefault();localStorage.setItem("draft",document.querySelector("textarea").value);document.querySelector("output").textContent="Draft saved locally. No message was sent.";};</script>');
 fs.writeFileSync('stub.html','<html><body><h1>Bird Tracking Website</h1></body></html>');assert(q.check(process.cwd(),'Make me a bird tracking website using public GPS bird data on a global map',['stub.html']).some(x=>!x.ok),'reject skeleton site');
 const brief='Build a complete multi-page website for Northline with index.html, work.html and contact.html. Include working navigation, project filtering by residential and commercial categories, responsive layouts and a labelled contact form that saves a local draft without claiming delivery.';
 let drafted=false,repaired=false,reviews=0;
 const tool=(file,content)=>({tool:'write',args:{file,content}}),fence=calls=>'```tool\n'+JSON.stringify(calls)+'\n```';
 const ai=async(prompt)=>{
  if(prompt.startsWith('[PLAN'))return {result:'1. Create index.html, work.html and contact.html — check: navigation and interactions',provider:'draft'};
  if(prompt.startsWith('[VERIFY')){reviews++;assert(prompt.includes(brief));return {result:'PASS',provider:'review'};}
  if(prompt.includes('[REPAIR')){assert(prompt.includes('work.html')&&prompt.includes('contact.html'));repaired=true;return {result:fence([tool('work.html',work),tool('contact.html',contact)]),provider:'draft'};}
  if(!drafted){drafted=true;assert(prompt.includes('[BUILD COMPLETION CONTRACT]'));return {result:fence([tool('index.html',home)]),provider:'draft'};}
  assert(prompt.includes(brief),'continuations retain the original brief');assert(prompt.includes('[CHODE AGENT TOOLS'));return {result:'DONE',provider:'draft'};
 };
 const result=await e.runAgentLoop(brief,null,null,{v2:true},ai,null,null,{originalTask:brief});assert.equal(result.completionStatus,'VERIFIED');assert(repaired);assert.equal(reviews,1);assert.equal(result.repairRounds,1);assert.deepEqual(q.check(process.cwd(),brief,['index.html','work.html','contact.html']),[]);
 let attempt=0,reviewCalls=0;const pageBrief='Build a website for Northline with project filtering and responsive layout.';
 hooks.callAI=async(prompt)=>{if(prompt.startsWith('[VERIFY WEBSITE]')){reviewCalls++;assert(prompt.includes(pageBrief));return {result:reviewCalls===1?'FAIL: project filtering is missing':'PASS',provider:'review'};}attempt++;return {result:attempt>1?work:home.replace(nav,''),provider:'draft'};};
 // Self-contained artifact cannot depend on sibling pages.
 const oldWork=work;hooks.callAI=async(prompt)=>{if(prompt.startsWith('[VERIFY WEBSITE]')){reviewCalls++;return {result:reviewCalls===1?'FAIL: project filtering is missing':'PASS',provider:'review'};}attempt++;return {result:(attempt>1?oldWork:home).replace(nav,'<p>Northline creates thoughtful spaces for homes, workplaces and communities. Browse our selected architecture and read about the people and process behind every project.</p>'),provider:'draft'};};
 const artifact=await e.cmdAI({prompt:pageBrief,output:'filtered.html',noWeb:true});assert(artifact&&artifact.artifactPath);assert.equal(attempt,2);assert.equal(reviewCalls,2);
 let turn=0;hooks.callAI=async()=>++turn===1?{result:shell('<a href="#">TODO: your content here</a>'),provider:'draft'}:null;
 assert.equal(await e.cmdAI({prompt:'Build a website for Northline',output:'rejected.html',noWeb:true}),null);assert(!fs.existsSync('rejected.html'));
 fs.writeFileSync('package.json',JSON.stringify({scripts:{build:'node -e "process.exit(1)"'}}));const gate=await e.cheapVerifyGate([],{writes:['index.html']},{buildRequest:brief});assert(gate.failed.some(c=>c.check==='website production build'));
 const long='Build a website. '+('Detailed requirement. '.repeat(100))+'LAST REQUIREMENT: working contact form';assert(e.buildVerifyPrompt(long,[],'facts').includes('LAST REQUIREMENT'));
 hooks.callAI=null;console.log('PASS: full-site routing, missing-page repair, links/assets/JS, semantic omission repair, empty repair rejection, full brief and production build gate');
}
if(process.argv[2]==='--fixture')fixture().catch(e=>{console.error(e);process.exitCode=1;});else{const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-build-completion-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:temp,encoding:'utf8',windowsHide:true,timeout:60000});assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(temp,{recursive:true,force:true});}}
