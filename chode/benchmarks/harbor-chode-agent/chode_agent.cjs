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
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');
const {filterEnv}=require('../swebench-env.cjs');
function runShim({engine,workdir,instruction,timeoutMs,trajectoryPath,specFile}) {
  const started=Date.now();
  const steps=[{type:'instruction',content:String(instruction||'').slice(0,4000),at:started}];
  // Runner shape: the spec file already carries the problem statement and the
  // telemetry paths, so pass it straight through — never write artifacts into
  // the repo under test, or they would leak into the extracted model_patch.
  let agentArgs;
  if(specFile){agentArgs=[specFile];}
  else{
    const out=path.join(workdir,'shim-spec.json');
    fs.writeFileSync(out,JSON.stringify({problem_statement:String(instruction||''),workdir,callsFile:path.join(workdir,'calls.json'),agentResult:path.join(workdir,'agentResult.json')}));
    agentArgs=[out];
  }
  let status='ok',out='';
  try{
    const r=spawnSync(process.execPath,[engine,...agentArgs],{cwd:workdir,timeout:timeoutMs,encoding:'utf8',windowsHide:true,env:filterEnv(process.env)});
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
  const specArg=process.argv[2];
  if(specArg){
    // SWE-runner shape: node chode_agent.cjs <specFile>. The spec already
    // holds the problem statement, workdir and telemetry paths; the engine
    // comes from the environment (installed in setup(), never at run time).
    // The trajectory lands beside the spec, never inside the repo under test.
    const resolved=path.resolve(specArg);
    const spec=JSON.parse(fs.readFileSync(resolved,'utf8'));
    runShim({engine:process.env.CHODE_ENGINE||spec.engine||path.join(__dirname,'..','..','chode.js'),workdir:spec.workdir||process.env.CHODE_TASK_DIR||process.cwd(),instruction:spec.problem_statement||'',timeoutMs:Number(process.env.CHODE_TIMEOUT_MS||600000),trajectoryPath:path.join(path.dirname(resolved),'trajectory.json'),specFile:resolved});
  }else{
    runShim({engine:process.env.CHODE_ENGINE,workdir:process.env.CHODE_TASK_DIR||process.cwd(),instruction:process.env.CHODE_INSTRUCTION||'',timeoutMs:Number(process.env.CHODE_TIMEOUT_MS||600000),trajectoryPath:process.env.CHODE_TRAJECTORY||'trajectory.json'});
  }
}
module.exports={runShim};
