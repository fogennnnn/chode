'use strict';
// Harbor TB 2.1 custom-agent shim (minimal): runs the Node engine as a subprocess
// in the task workdir and converts stdout/logs to a minimal trajectory file.
// Agent failure (non-zero exit, timeout) → trajectory status != ok, process exit 0:
// in Harbor an agent timeout is a valid failing reward, while a non-zero agent
// exit is retried as an unclassified infra error. Engine path ships via
// CHODE_ENGINE env (installed in setup(), never downloaded at run time —
// locked-down tasks have no network). Per-task timeouts pass through untouched.
// NOTE: Harbor custom agents register as module.path:ClassName (Python); the
// thin Python wrapper importing this file is added when Harbor is wired.
const {spawnSync}=require('child_process'),fs=require('fs');
function runShim({engine,workdir,instruction,timeoutMs,trajectoryPath}) {
  const started=Date.now();
  const steps=[{type:'instruction',content:String(instruction||'').slice(0,4000),at:started}];
  let status='ok',out='';
  try{
    const r=spawnSync(process.execPath,[engine],{cwd:workdir,timeout:timeoutMs,encoding:'utf8',windowsHide:true});
    out=r.stdout||'';
    if(r.error&&r.error.code==='ETIMEDOUT'){status='timeout';steps.push({type:'timeout',afterMs:timeoutMs});}
    else if(r.status!==0){status='error';steps.push({type:'error',exitCode:r.status,signal:r.signal||null,stderr:String(r.stderr||'').slice(-2000)});}
  }catch(e){status='error';steps.push({type:'error',message:String(e&&e.message||e).slice(0,500)});}
  for(const line of out.split('\n'))if(line.trim())steps.push({type:'log',content:line.slice(0,4000)});
  steps.push({type:'finish',status,elapsedMs:Date.now()-started});
  fs.writeFileSync(trajectoryPath,JSON.stringify({version:1,status,steps},null,2)+'\n');
  return 0;
}
if(require.main===module){
  runShim({engine:process.env.CHODE_ENGINE,workdir:process.env.CHODE_TASK_DIR||process.cwd(),instruction:process.env.CHODE_INSTRUCTION||'',timeoutMs:Number(process.env.CHODE_TIMEOUT_MS||600000),trajectoryPath:process.env.CHODE_TRAJECTORY||'trajectory.json'});
}
module.exports={runShim};
