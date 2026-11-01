'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');const os=require('os');const {fork}=require('child_process');
async function main(){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-tui-worker-'));const events=[];
 try{
  const engine=path.resolve(__dirname,'../chode.js'),worker=path.resolve(__dirname,'../tui-worker.js');
  const script=path.join(temp,'fixture.cjs');
  fs.writeFileSync(script,`const e=require(${JSON.stringify(engine)}); e.__testHooks.callAI=async()=>({result:'Worker answer',provider:'fixture'});require(${JSON.stringify(worker)});`);
  const child=fork(script,[],{cwd:temp,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
  const timer=setTimeout(()=>child.kill(),10000);
  child.on('message',message=>events.push(message));
  const finished=new Promise(resolve=>child.on('close',code=>resolve(code)));
  child.send({type:'run',prompt:'Hello',session:'fixture',provider:null});
  const code=await finished;clearTimeout(timer);assert.equal(code,0);const result=events.find(e=>e.type==='result');assert.ok(result);assert.equal(result.result.result,'Worker answer');
  console.log('✓ workspace worker: isolated engine process and authoritative result over IPC');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
