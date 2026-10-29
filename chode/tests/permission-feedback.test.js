'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{PassThrough}=require('stream');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){const end=Date.now()+10000;while(!check()&&Date.now()<end)await pause(20);assert(check(),'timed out');}
async function main(){
 const previous=process.cwd(),root=fs.mkdtempSync(path.join(os.tmpdir(),'chode-permission-feedback-'));let app;
 try{
  process.chdir(root);
  // The real guarded dispatcher rejects this harmless deletion until permission is answered.
  const worker=path.join(root,'fixture.cjs');
  const call={tool:'exec',args:{cmd:`node -e "require('fs').unlinkSync('victim.txt') /* rm -rf */"`}};
  fs.writeFileSync(worker,`const fs=require('fs'),e=require(${JSON.stringify(path.resolve(__dirname,'../chode.js'))});let answer;process.on('message',async m=>{if(m.type==='answer'){if(answer){const resolve=answer;answer=null;resolve(m.value);}return;}if(m.type!=='run')return;fs.writeFileSync('victim.txt','fixture');const r=await e.runAgentTool(${JSON.stringify(call)},{actions:{},onAsk:q=>new Promise(resolve=>{answer=resolve;process.send({type:'ask',question:q});})});fs.writeFileSync('outcome.json',JSON.stringify(r));setTimeout(()=>{process.send({type:'result',result:{result:r.ok?'Action executed':'Action denied',provider:'fixture'}});process.disconnect();},180);});`);
  for(const choice of ['2','1','escape']){
   const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};
   const output=new PassThrough();output.isTTY=true;output.columns=100;output.rows=30;let screen='';output.on('data',chunk=>screen+=chunk);
   app=require('../workspace-tui').launch({input,output,workerPath:worker,session:'permission-'+choice});
   input.write('Check permission\r');await until(()=>app.state.question);
   assert(fs.existsSync('victim.txt'),'must pause before execution');assert(!fs.existsSync('outcome.json'));
   input.write('9');input.write('\r');await pause(40);assert(app.state.question,'invalid answer cannot grant permission');
   if(choice==='escape')input.write('\x1b');else input.write(choice+'\r');
   await until(()=>!app.state.question);
   const expected=choice==='2'?'Allowed once':choice==='1'?'Denied':'Cancelled';
   assert(app.state.messages.some(m=>m.role==='notice'&&m.text.startsWith(expected)));
   assert(app.state.status.startsWith(expected));assert.equal(app.state.input,'');assert.equal(app.state.cursor,0);assert.equal(app.state.scroll,0);
   assert.equal(app.state.messages.filter(m=>m.role==='user').length,1,'answer must not launch a second task');assert.deepEqual(app.state.history,['Check permission']);
   app.render();assert(screen.includes(expected),'acknowledgement must be rendered');assert(!screen.includes('Computed with Wolfram'),'permission number must not become a math task');
   await until(()=>!app.state.busy);const result=JSON.parse(fs.readFileSync('outcome.json','utf8'));
   assert.equal(result.ok,choice==='2');assert.equal(fs.existsSync('victim.txt'),choice!=='2');
   if(choice!=='2')assert.equal(result.deniedByUser,true);
   input.write('next prompt');assert.equal(app.state.input,'next prompt','composer accepts input after the worker finishes');
   app.close();app=null;fs.unlinkSync('outcome.json');
  }
  console.log('PASS permission feedback: real key bytes, guarded worker pause, invalid answer, allow/deny/Esc, visible acknowledgement, no math routing and restored composer');
 }finally{if(app)app.close();process.chdir(previous);fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
