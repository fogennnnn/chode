'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os'),{fork,spawnSync}=require('child_process');
async function main(){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-tui-worker-'));
 try{
  const engine=path.resolve(__dirname,'../chode.js'),worker=path.resolve(__dirname,'../tui-worker.js');
  const script=path.join(temp,'fixture.cjs'),lock=path.join(temp,'.chode/sessions/fixture.lock');
  fs.writeFileSync(script,`const e=require(${JSON.stringify(engine)});e.__testHooks.callAI=async()=>({result:'Worker answer',provider:'fixture'});require(${JSON.stringify(worker)});`);
  fs.mkdirSync(path.dirname(lock),{recursive:true});
  async function run(){
   const events=[],child=fork(script,[],{cwd:temp,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
   const timer=setTimeout(()=>child.kill(),10000);child.on('message',message=>events.push(message));
   const finished=new Promise(resolve=>child.on('close',code=>resolve(code)));
   child.send({type:'run',prompt:'Hello',session:'fixture',provider:null});
   const code=await finished;clearTimeout(timer);assert.equal(code,0);const result=events.find(e=>e.type==='result');assert(result);return result.result;
  }
  const owned=JSON.stringify({pid:process.pid,ts:Date.now()});fs.writeFileSync(lock,owned);
  assert.equal((await run()).result,'Worker answer','worker may execute its direct IPC parent\'s session');
  assert.equal(fs.readFileSync(lock,'utf8'),owned,'worker retains the parent lock unchanged across turns');
  assert.equal((await run()).result,'Worker answer','next worker inherits the same TUI session');
  const spoof=spawnSync(process.execPath,['-e',`const e=require(${JSON.stringify(engine)});e.__testHooks.callAI=async()=>({result:'Unexpected',provider:'fixture'});e.cmdAI({prompt:'Hello',session:'fixture',sessionOwnerPid:process.ppid}).then(r=>{if(r!==null)process.exitCode=1;else console.log('IPC required');});`],{cwd:temp,encoding:'utf8',timeout:10000,windowsHide:true});
  assert.equal(spoof.status,0,spoof.stderr);assert(spoof.stdout.includes('IPC required'),'owner PID without live IPC never bypasses a lock');
  const foreign=JSON.stringify({pid:process.ppid,ts:Date.now()});fs.writeFileSync(lock,foreign);
  const blocked=await run();assert(blocked.degraded,'unrelated live owner still blocks execution');assert(blocked.result.includes('No answer was returned'));assert.equal(fs.readFileSync(lock,'utf8'),foreign,'foreign lock is never overwritten');
  console.log('PASS workspace worker: real IPC execution inherits only its direct parent session, retains lock across turns and rejects unrelated live owners');
 }finally{fs.rmSync(temp,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
