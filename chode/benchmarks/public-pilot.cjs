'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function option(name){const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1];}
const datasetArg=option('--dataset');if(!datasetArg)throw Error('Usage: node benchmarks/public-pilot.cjs --dataset <polyglot-checkout> [--engine <chode.js>] [--out <directory>]');
const dataset=path.resolve(datasetArg),engine=path.resolve(option('--engine')||path.join(__dirname,'..','chode.js'));
if(cp.execFileSync('git',['-C',dataset,'status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim())throw Error('Dataset has modified tracked files; use a clean pinned checkout.');
const exercises=path.join(dataset,'python/exercises/practice');
const names=fs.readdirSync(exercises).sort((a,b)=>hash('chode-pilot-v1:'+a).localeCompare(hash('chode-pilot-v1:'+b))).slice(0,5);
const run=path.resolve(option('--out')||'public-pilot-runs',new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(run,{recursive:true});
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>/^(path|pathext|systemroot|windir|temp|tmp|comspec|localappdata|appdata|userprofile|python.*)$/i.test(key)));
const protocol={schema:1,name:'Chode Polyglot Python pilot v1',source:'https://github.com/Aider-AI/polyglot-benchmark',datasetCommit:cp.execFileSync('git',['-C',dataset,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),chodeVersion:JSON.parse(fs.readFileSync(path.join(path.dirname(engine),'package.json'))).version,chodeRuntimeHash:hash(fs.readFileSync(engine)),selection:'First five ascending SHA256("chode-pilot-v1:" + exerciseName) from Python track',tasks:names,attempts:1,modelCallsPerTask:6,wallMsPerTask:210000,freeOnly:true,mode:'exported production v2 agent loop; default anonymous routing; fresh per-task state; no memory/web/reference examples',grading:'All unmodified upstream tests pass; one attempt; test sources held outside agent workspace',comparableToOfficialLeaderboard:false,node:process.version,python:cp.execFileSync('python',['--version'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString()};
fs.writeFileSync(path.join(run,'protocol.json'),JSON.stringify(protocol,null,2));
console.log('RUN '+run);console.log('TASKS '+names.join(', '));
const results=[];
function evaluate(dir,tests){const result=cp.spawnSync('python',['-m','unittest','discover','-s',dir,'-p','*_test.py','-v'],{cwd:dir,env,encoding:'utf8',timeout:30000,maxBuffer:1024*1024,windowsHide:true});const text=(result.stdout||'')+(result.stderr||'');return {passed:result.status===0&&/Ran [1-9]\d* tests?/.test(text),exitCode:result.status,signal:result.signal,error:result.error?.message||null,testsRun:Number(/Ran (\d+) tests?/.exec(text)?.[1]||0),log:text};}
(async()=>{
 for(const name of names){
  const taskDir=path.join(run,name),workspace=path.join(taskDir,'workspace'),evaluator=path.join(taskDir,'evaluation');fs.mkdirSync(workspace,{recursive:true});fs.mkdirSync(evaluator);
  const source=path.join(exercises,name),config=JSON.parse(fs.readFileSync(path.join(source,'.meta/config.json'))),solutions=config.files.solution,tests=config.files.test;
  for(const file of [...solutions,...tests])fs.copyFileSync(path.join(source,file),path.join(evaluator,file));
  const testHashes=Object.fromEntries(tests.map(file=>[file,hash(fs.readFileSync(path.join(evaluator,file)))]));
  const before=evaluate(evaluator,tests);fs.writeFileSync(path.join(taskDir,'before.log'),before.log);
  if(before.passed)throw Error('Unexpected passing stub: '+name);
  for(const file of solutions)fs.copyFileSync(path.join(source,file),path.join(workspace,file));
  const spec={engine,solutions,instructions:fs.readFileSync(path.join(source,'.docs/instructions.md'),'utf8'),callsFile:path.join(taskDir,'calls.json'),agentResult:path.join(taskDir,'agent.json')};
  const specFile=path.join(taskDir,'input.json');fs.writeFileSync(specFile,JSON.stringify(spec,null,2));
  console.log('START '+name);const started=Date.now();
  const child=cp.spawn(process.execPath,[path.join(__dirname,'public-pilot-agent.cjs'),specFile],{cwd:workspace,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  const log=fs.createWriteStream(path.join(taskDir,'agent.log'));child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;child.kill();},protocol.wallMsPerTask);
  const outcome=await new Promise(resolve=>{child.on('error',error=>resolve({error:error.message}));child.on('close',(code,signal)=>resolve({code,signal}));});clearTimeout(timer);log.end();
  for(const file of solutions)fs.copyFileSync(path.join(workspace,file),path.join(evaluator,file));
  const after=evaluate(evaluator,tests);fs.writeFileSync(path.join(taskDir,'after.log'),after.log);
  const testsUnchanged=tests.every(file=>hash(fs.readFileSync(path.join(evaluator,file)))===testHashes[file]);
  let calls=[];try{calls=JSON.parse(fs.readFileSync(spec.callsFile));}catch{}
  const result={task:name,passed:after.passed&&testsUnchanged,testsUnchanged,testHashes,testsRun:after.testsRun,elapsedMs:Date.now()-started,timedOut,outcome,logicalModelCalls:calls.length,providers:[...new Set(calls.map(c=>c.provider).filter(Boolean))],successfulAnswers:calls.filter(c=>c.returnedAnswer).length};
  results.push(result);fs.writeFileSync(path.join(run,'results.json'),JSON.stringify({protocol,results,solved:results.filter(r=>r.passed).length,total:names.length,completed:results.length,scorePercent:100*results.filter(r=>r.passed).length/names.length},null,2));console.log('RESULT '+JSON.stringify(result));
 }
 console.log('COMPLETE '+results.filter(r=>r.passed).length+'/'+names.length);
})().catch(error=>{console.error(error);process.exitCode=1;});
