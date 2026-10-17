'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');const os=require('os');const {PassThrough}=require('stream');const {launch}=require('../workspace-tui');
async function main(){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-workspace-life-'));let app;
 try{
  const worker=path.join(temp,'worker.cjs');fs.writeFileSync(worker,"process.on('message',()=>{setInterval(()=>{},1000);});");
  const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};
  const output=new PassThrough();output.isTTY=true;output.columns=80;output.rows=24;let transcript='';output.on('data',chunk=>transcript+=chunk);
  app=launch({input,output,workerPath:worker});
  input.write('first\rsecond');await new Promise(r=>setImmediate(r));
  assert.equal(app.state.input,'first\nsecond');assert.equal(app.state.busy,false,'unmarked multiline paste must not submit');
  input.emit('keypress','',{name:'c',ctrl:true});assert.equal(app.state.input,'');
  input.emit('keypress','Hello',{});input.emit('keypress','\r',{name:'return'});assert.equal(app.state.busy,true);
  input.emit('keypress','',{name:'c',ctrl:true});
  const deadline=Date.now()+5000;while(app.state.busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
  assert.equal(app.state.busy,false,'cancelled child must release composer');assert.equal(app.state.status,'Stopped');
  app.close();assert.ok(transcript.includes('\x1b[?1049l'),'exit restores terminal buffer');
  console.log('✓ workspace lifecycle: Windows unmarked paste, real worker cancellation and terminal restoration');
 }finally{if(app)app.close();fs.rmSync(temp,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
