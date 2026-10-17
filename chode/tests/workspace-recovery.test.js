'use strict';
const assert=require('assert');const fs=require('fs');const os=require('os');const path=require('path');const {fork}=require('child_process');
async function main(){const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-recovery-'));try{
 const engine=path.resolve(__dirname,'../chode.js'),worker=path.resolve(__dirname,'../tui-worker.js'),script=path.join(temp,'fixture.cjs');fs.writeFileSync(script,`const e=require(${JSON.stringify(engine)});e.__testHooks.callAI=async()=>null;require(${JSON.stringify(worker)});`);
 async function run(prompt,retryId){const child=fork(script,[],{cwd:temp,windowsHide:true,stdio:['ignore','ignore','ignore','ipc']});let result;child.on('message',m=>{if(m.type==='result')result=m.result;});const timer=setTimeout(()=>child.kill(),5000);const finished=new Promise(resolve=>child.on('close',resolve));child.send({type:'run',prompt,session:'preserved',retryId});await finished;clearTimeout(timer);assert.ok(result);return result;}
 const prompt='Preserve this full task '+ 'with every detail '.repeat(200);const first=await run(prompt);assert.equal(first.degraded,true);assert.match(first.result,/\/retry/);
 const file=path.join(temp,'.chode','pending-tasks.json');let queue=JSON.parse(fs.readFileSync(file));assert.equal(queue.length,1);assert.equal(queue[0].prompt,prompt);assert.equal(queue[0].session,'preserved');await run(prompt,first.queuedId);queue=JSON.parse(fs.readFileSync(file));assert.equal(queue.length,1,'failed retry must retain original without duplicating it');
 console.log('✓ workspace recovery: failed provider saves full prompt/session; failed retry retains one task');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
