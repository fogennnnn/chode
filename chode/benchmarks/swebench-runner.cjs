'use strict';
// SWE-bench runner scaffold: checks out each instance repo at base_commit,
// drives an agent script with a wall-clock kill, records incremental results.
// No grading here (Task 3 owns patch extraction + predictions.jsonl).
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function option(name){const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1];}
const instancesArg=option('--instances'),agentArg=option('--agent');
if(!instancesArg||!agentArg)throw Error('Usage: node benchmarks/swebench-runner.cjs --instances <list.json> --agent <agent.cjs> [--out <dir>] [--limit <n>] [--wall-ms <ms>] [--run-id <id>]');
const instances=JSON.parse(fs.readFileSync(path.resolve(instancesArg),'utf8'));
const agent=path.resolve(agentArg);
const limit=Number(option('--limit')||instances.length),wallMs=Number(option('--wall-ms')||210000);
const runId=option('--run-id')||('swebr-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(3).toString('hex'));
const run=path.resolve(option('--out')||('swebench-runs/'+runId));fs.mkdirSync(run,{recursive:true});
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>/^(path|pathext|systemroot|windir|temp|tmp|comspec|localappdata|appdata|userprofile|python.*|docker.*|http_proxy|https_proxy|no_proxy)$/i.test(key)));
const queued=instances.slice(0,limit);
const protocol={schema:1,name:'Chode SWE-bench pilot v1',source:'SWE-bench',instances:queued.map(i=>i.instance_id),wallMsPerTask:wallMs,runId,harnessSha:null,adapterHash:hash(fs.readFileSync(agent)),freeOnly:true,mode:'scaffold: repo at base_commit, agent drive with wall-clock kill, no grading',node:process.version,startedAt:new Date().toISOString()};
fs.writeFileSync(path.join(run,'protocol.json'),JSON.stringify(protocol,null,2));
console.log('RUN '+run);console.log('TASKS '+queued.map(i=>i.instance_id).join(', '));
const results=[];
(async()=>{
  for(const spec of queued){
    const taskDir=path.join(run,spec.instance_id),repoDir=path.join(taskDir,'repo');fs.mkdirSync(taskDir,{recursive:true});
    console.log('START '+spec.instance_id);const started=Date.now();
    let outcome=null,error=null;
    try{
      cp.execFileSync('git',['clone',spec.repo,repoDir],{encoding:'utf8',timeout:120000,windowsHide:true});
      cp.execFileSync('git',['-C',repoDir,'checkout',spec.base_commit],{encoding:'utf8',timeout:60000,windowsHide:true});
      const head=cp.execFileSync('git',['-C',repoDir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
      if(head!==spec.base_commit)throw Error('checkout mismatch: '+head+' !== '+spec.base_commit);
      const specFile=path.join(taskDir,'spec.json');fs.writeFileSync(specFile,JSON.stringify({instance_id:spec.instance_id,base_commit:spec.base_commit,workdir:repoDir},null,2));
      const child=cp.spawn(process.execPath,[agent,specFile],{cwd:repoDir,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
      const log=fs.createWriteStream(path.join(taskDir,'agent.log'));child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
      let timedOut=false;const timer=setTimeout(()=>{timedOut=true;child.kill();},wallMs);
      outcome=await new Promise(resolve=>{child.on('error',err=>resolve({error:err.message}));child.on('close',(code,signal)=>resolve({code,signal,timedOut}));});clearTimeout(timer);log.end();
      results.push({task:spec.instance_id,passed:false,timedOut:outcome.timedOut===true,elapsedMs:Date.now()-started,outcome});
    }catch(err){error=err.message;results.push({task:spec.instance_id,passed:false,timedOut:false,elapsedMs:Date.now()-started,outcome,error});}
    fs.writeFileSync(path.join(run,'results.json'),JSON.stringify({protocol,results,solved:0,total:queued.length,completed:results.length,scorePercent:0},null,2));console.log('RESULT '+JSON.stringify(results[results.length-1]));
  }
  console.log('COMPLETE '+results.filter(r=>r.passed).length+'/'+queued.length);
})().catch(error=>{console.error(error);process.exitCode=1;});
