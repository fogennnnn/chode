'use strict';
// Optional native test engines. No model requests and no shell-built test commands.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {spawn} = require('child_process');
const {StringDecoder}=require('string_decoder');
const activeProcesses=new Set();
function abortProcesses(signal){for(const stop of [...activeProcesses])stop();process.removeListener('SIGTERM',onTerm);process.removeListener('SIGINT',onInt);if(!process.listenerCount(signal))process.kill(process.pid,signal);}
function onTerm(){abortProcesses('SIGTERM');}function onInt(){abortProcesses('SIGINT');}
const engines = {
  hurl: {version:'8.1.0', purpose:'HTTP journeys, captures and assertions', package:'@orangeopensource/hurl@8.1.0', bin:'node_modules/@orangeopensource/hurl/hurl.js', source:'https://hurl.dev/docs/installation.html'},
  schemathesis: {version:'4.32.7', purpose:'Generated OpenAPI/GraphQL contract checks', source:'https://schemathesis.readthedocs.io/en/stable/'},
  k6: {version:'2.3.0', purpose:'Explicit load tests and performance thresholds', source:'https://grafana.com/docs/k6/latest/'}
};
const k6Assets = {
  'win32-x64':['windows-amd64.zip','112276d495e5741c968e2bc09ea6196099c1275bd6db9ee0875d173c7148ce43'],
  'linux-x64':['linux-amd64.tar.gz','39c3117b6af817592dcd0ce4242105c0a7af10948c2a425306f0be8f7a8a8ab1'],
  'linux-arm64':['linux-arm64.tar.gz','5ca3433e8201da72a284aaa241a1bb5fb47f4abb4e384d39410ddd8062f49b90'],
  'darwin-x64':['macos-amd64.zip','c83bb16f54f0676afa4ea235fd757f3892d307dbd1bd201450de83af31986654'],
  'darwin-arm64':['macos-arm64.zip','b2417a3038edc5fe81dc178a889237724b595c5c9cfed875822008e46e862c7d']
};
function inside(root, file) {const rel=path.relative(root,file);return rel!== '..'&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel);}
function guardedDir(root, file, create=true) {
  root=path.resolve(root);file=path.resolve(file);
  if(!inside(root,file))throw Error('Directory is outside its configured root');
  const parts=path.relative(root,file).split(path.sep).filter(Boolean);let cur=root;
  for(const part of ['',...parts]){if(part)cur=path.join(cur,part);if(fs.existsSync(cur)){const s=fs.lstatSync(cur);if(s.isSymbolicLink()||!s.isDirectory())throw Error('Test directory must not be a link or file');}else if(create)fs.mkdirSync(cur,{mode:0o700});}
  return file;
}
function home(root,create=false) {const base=process.env.CHODE_API_TOOLS_HOME?path.resolve(process.env.CHODE_API_TOOLS_HOME):path.resolve(root);return guardedDir(base,process.env.CHODE_API_TOOLS_HOME?base:path.join(base,'.chode','api-tools'),create);}
function suite(root,file,engine) {
  if(typeof file!=='string'||!file.trim())throw Error('A workspace test file is required');
  const base=fs.realpathSync(root),full=path.resolve(root,file);
  if(!inside(path.resolve(root),full)||!inside(base,fs.realpathSync(full)))throw Error('Test file must stay inside the workspace');
  const rel=path.relative(root,full).replace(/\\/g,'/');
  if(/(^|\/)(?:\.chode|\.git|\.env[^/]*|credentials?|secrets?)(\/|$)/i.test(rel))throw Error('Credential and internal-state paths cannot be test inputs');
  const s=fs.lstatSync(full);if(!s.isFile()||s.isSymbolicLink()||s.nlink>1||s.size>5*1024*1024)throw Error('Test input must be a regular file under 5 MB');
  const valid=engine==='hurl'?/\.hurl$/i.test(file):engine==='k6'?/\.(?:js|mjs)$/i.test(file):/\.(?:json|yaml|yml|graphql)$/i.test(file);
  if(!valid)throw Error('Unexpected test file extension for '+engine);
  return {full,relative:rel,digest:crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')};
}
function findProgram(name) {
  for(const dir of String(process.env.PATH||'').split(path.delimiter))for(const suffix of process.platform==='win32'?['.exe','']:['']){const full=path.resolve(dir,name+suffix);try{if(fs.statSync(full).isFile())return full;}catch{}}
  return null;
}
function npmCLI() {
  const list=[process.env.npm_execpath,path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.join(path.dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')];
  for(const dir of String(process.env.PATH||'').split(path.delimiter)){list.push(path.join(dir,'node_modules/npm/bin/npm-cli.js'));try{list.push(fs.realpathSync(path.join(dir,'npm')));}catch{}}
  const found=list.find(f=>f&&/npm-cli\.js$/i.test(f)&&fs.existsSync(f));if(!found)throw Error('npm is required for Hurl setup');return found;
}
function execute(command,args,options={}) {
  return new Promise(resolve=>{
    const start=Date.now();let stdout='',stderr='',timedOut=false,spawnError=null,finished=false,child;
    const outDecoder=new StringDecoder('utf8'),errDecoder=new StringDecoder('utf8'),cap=128*1024,append=(old,data)=>(old+data).slice(-cap);
    function stop(){if(!child?.pid)return;if(process.platform==='win32'){const killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});killer.on('error',()=>child.kill());}else{try{process.kill(-child.pid,'SIGKILL');}catch{child.kill('SIGKILL');}}}
    function abort(){stop();options.onAbort?.();}
    function done(code,signal){if(finished)return;finished=true;clearTimeout(timer);activeProcesses.delete(abort);if(!activeProcesses.size){process.removeListener('SIGTERM',onTerm);process.removeListener('SIGINT',onInt);}stdout=append(stdout,outDecoder.end());stderr=append(stderr,errDecoder.end());resolve({exitCode:code,signal:signal||null,timedOut,error:spawnError,stdout,stderr,durationMs:Date.now()-start});}
    try{child=spawn(command,args,{cwd:options.cwd,env:{...process.env,NO_COLOR:'1',PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8',K6_NO_USAGE_REPORT:'true',...options.env},shell:false,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});}catch(error){return resolve({exitCode:null,error:error.message,stdout:'',stderr:'',durationMs:Date.now()-start});}
    const timer=setTimeout(()=>{timedOut=true;stop();},options.timeoutMs||60000);
    if(!activeProcesses.size){process.once('SIGTERM',onTerm);process.once('SIGINT',onInt);}activeProcesses.add(abort);
    child.stdout.on('data',data=>{stdout=append(stdout,outDecoder.write(data));options.onProgress?.();});child.stderr.on('data',data=>{stderr=append(stderr,errDecoder.write(data));options.onProgress?.();});
    child.on('error',error=>{spawnError=error.message;done(null,null);});child.on('close',done);
  });
}
function resolveEngine(root,id) {
  if(!engines[id])throw Error('Choose hurl, schemathesis or k6');
  const dir=guardedDir(home(root),path.join(home(root),id),false);
  if(id==='hurl'){const js=path.join(dir,engines.hurl.bin);if(fs.existsSync(js))return {command:process.execPath,args:[js],managed:true};}
  if(id==='schemathesis'){const cli=path.join(dir,process.platform==='win32'?'Scripts/schemathesis.exe':'bin/schemathesis');if(fs.existsSync(cli))return {command:cli,args:[],managed:true};}
  if(id==='k6'){const folder='k6-v2.3.0-'+k6Assets[process.platform+'-'+process.arch]?.[0].replace(/\.(?:zip|tar\.gz)$/,'');const exe=path.join(dir,folder,process.platform==='win32'?'k6.exe':'k6');if(fs.existsSync(exe))return {command:exe,args:[],managed:true};}
  const executable=findProgram(id);return executable?{command:executable,args:[],managed:false}:null;
}
async function doctor(root,id) {
  const ids=id?[id]:Object.keys(engines),results=[];
  for(const name of ids){const bin=resolveEngine(root,name);const r=bin?await execute(bin.command,[...bin.args,'--version'],{cwd:root,timeoutMs:10000}):null;results.push({engine:name,...engines[name],installed:!!r&&r.exitCode===0&&!r.error,versionOutput:r?(r.stdout+r.stderr).trim().slice(0,300):null,setup:'chode api-test setup '+name});}
  return {ok:true,engines:results};
}
async function setup(root,id,options={}) {
  if(!engines[id])throw Error('Choose hurl, schemathesis or k6');
  if(resolveEngine(root,id)?.managed){const status=await doctor(root,id);if(status.engines[0].installed&&status.engines[0].versionOutput.includes(engines[id].version))return {...status,engine:id,already:true};}
  const dir=guardedDir(home(root,true),path.join(home(root),id));let result;
  if(id==='hurl')result=await execute(process.execPath,[npmCLI(),'install','--prefix',dir,'--no-audit','--no-fund','--no-save',engines.hurl.package],{cwd:root,timeoutMs:240000,...options});
  else if(id==='schemathesis'){
    const python=process.platform==='win32'?(findProgram('python')||findProgram('python3')):(findProgram('python3')||findProgram('python'));if(!python)throw Error('Python 3.10+ is required for Schemathesis setup');
    result=await execute(python,['-m','venv',dir],{cwd:root,timeoutMs:60000});
    if(result.exitCode===0){const py=path.join(dir,process.platform==='win32'?'Scripts/python.exe':'bin/python');result=await execute(py,['-m','pip','--disable-pip-version-check','install','schemathesis=='+engines.schemathesis.version],{cwd:root,timeoutMs:240000,...options});}
  }else{
    const asset=k6Assets[process.platform+'-'+process.arch];if(!asset)throw Error('Install k6 on PATH for this platform');
    const name='k6-v2.3.0-'+asset[0],url='https://github.com/grafana/k6/releases/download/v2.3.0/'+name;
    const response=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('k6 download returned HTTP '+response.status);
    const chunks=[];let bytes=0;for await(const chunk of response.body){bytes+=chunk.length;if(bytes>150*1024*1024)throw Error('k6 download exceeded limit');chunks.push(chunk);}const data=Buffer.concat(chunks);
    if(crypto.createHash('sha256').update(data).digest('hex')!==asset[1])throw Error('k6 download checksum mismatch');
    const archive=path.join(dir,crypto.randomUUID()+'-'+name);fs.writeFileSync(archive,data,{mode:0o600,flag:'wx'});
    try{if(process.platform==='win32'){
      const quote=s=>"'"+s.replace(/'/g,"''")+"'",script="$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath "+quote(archive)+' -DestinationPath '+quote(dir)+' -Force';
      result=await execute('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{cwd:root,timeoutMs:60000});
    }else result=await execute('tar',asset[0].endsWith('.zip')?['-xf',archive,'-C',dir]:['-xzf',archive,'-C',dir],{cwd:root,timeoutMs:60000});}finally{fs.unlinkSync(archive);}
  }
  if(result.exitCode!==0||result.error||result.timedOut)return {ok:false,engine:id,error:'Tool installation failed',diagnostic:require('./worker-transport').redact(result.stderr||result.stdout||result.error,root,6000)};
  const status=await doctor(root,id);return {...status,ok:status.engines[0].installed,engine:id};
}
function integer(value,fallback,min,max,name) {if(value===undefined)return fallback;const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw Error(name+' must be an integer from '+min+' to '+max);return n;}
function baseURL(value) {if(value===undefined)return undefined;const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('Use an HTTP(S) base URL without credentials, query or fragment');return u.href.replace(/\/$/,'');}
async function run(root,id,file,options={}) {
  if(!engines[id])throw Error('Choose hurl, schemathesis or k6');
  const input=suite(root,file,id),url=baseURL(options.url),timeout=integer(options.timeout,60,1,300,'timeout'),examples=integer(options.examples,10,1,100,'examples'),iterations=integer(options.iterations,5,1,1000,'iterations'),vus=integer(options.vus,1,1,10,'vus');
  const bin=resolveEngine(root,id);if(!bin)return {ok:false,engine:id,error:'Tool is not installed. Run chode api-test setup '+id};
  const reportDir=guardedDir(path.resolve(root),path.join(root,'.chode','api-tests','results')),runId=crypto.randomUUID(),reportFile=path.join(reportDir,runId+'.json'),nativeReport=path.join(reportDir,runId+(id==='k6'?'.summary.json':'.junit.xml'));
  const argv=id==='hurl'?['--test','--connect-timeout','5','--max-time','15',...(url?['--variable','base_url='+url]:[]),input.full]:id==='k6'?['run','--quiet','--no-usage-report','--vus',String(vus),'--iterations',String(iterations),'--summary-export',nativeReport,input.full]:['run',input.full,...(url?['--url',url]:[]),'--max-examples',String(examples),'--workers','1','--seed','1','--report','junit','--report-junit-path',nativeReport];
  const version=await execute(bin.command,[...bin.args,'--version'],{cwd:root,timeoutMs:10000});if(version.exitCode!==0||version.error)throw Error('Could not verify test engine version');
  const startedAt=new Date().toISOString(),proc=await execute(bin.command,[...bin.args,...argv],{cwd:root,timeoutMs:timeout*1000,env:url?{BASE_URL:url}:{},onProgress:options.onProgress,onAbort:()=>{try{fs.unlinkSync(nativeReport);}catch{}}});
  function readNative(){const stat=fs.lstatSync(nativeReport);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink>1||stat.size>2*1024*1024)throw Error('Invalid native report');return fs.readFileSync(nativeReport,'utf8');}
  let ok=proc.exitCode===0&&!proc.error&&!proc.timedOut,reason=proc.timedOut?'Test timed out':proc.error||(proc.exitCode!==0?'Test exited with code '+proc.exitCode:''),metrics=null;
  try{if(id==='k6'){
    const summary=JSON.parse(readNative()),metric=name=>summary.metrics?.[name]?.values||summary.metrics?.[name]||null;metrics={checks:metric('checks'),requests:metric('http_reqs'),httpFailures:metric('http_req_failed')};
    if(metrics.checks?.fails>0||metrics.httpFailures?.passes>0){ok=false;reason='k6 recorded failed checks or HTTP requests';}
    if(!metrics.requests?.count){ok=false;reason='k6 executed no HTTP requests';}
  }else if(id==='schemathesis'){
    const xml=readNative(),tests=[...xml.matchAll(/<testsuite\b[^>]*\btests="(\d+)"/g)].reduce((n,m)=>n+Number(m[1]),0);metrics={tests};if(tests===0&&ok){ok=false;reason='Schema run executed no tests';}
  }}catch{if(ok){ok=false;reason='The test engine did not produce its required report';}}
  try{if(crypto.createHash('sha256').update(fs.readFileSync(input.full)).digest('hex')!==input.digest){ok=false;reason='Test input changed during execution';}}catch{ok=false;reason='Test input was removed during execution';}
  const redact=text=>require('./worker-transport').redact(text,root,16000).replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'');
  // Native reports can echo authenticated request bodies. Retain only the redacted
  // bounded evidence here; raw engine reports never remain on disk after the run.
  try{fs.unlinkSync(nativeReport);}catch{}
  const combined=redact(proc.stdout+'\n'+proc.stderr),failStart=combined.indexOf('FAILURES'),failEnd=failStart>=0?combined.indexOf('SUMMARY',failStart):0;
  const failure=ok?'':failStart>=0?combined.slice(failStart,failEnd>failStart?failEnd:failStart+4000).slice(0,4000):combined.slice(-4000);
  const report={ok,engine:id,toolVersion:redact(version.stdout+version.stderr).trim().slice(0,300),file:input.relative,suiteSha256:input.digest,startedAt,finishedAt:new Date().toISOString(),failure,...proc,stdout:redact(proc.stdout),stderr:redact(proc.stderr),error:redact(reason),metrics,report:path.relative(root,reportFile).replace(/\\/g,'/')};
  fs.writeFileSync(reportFile,JSON.stringify(report,null,2),{flag:'wx',mode:0o600});return report;
}
function tokenize(text) {const tokens=[];let value='',quote=null,active=false;for(const c of String(text)){if(quote){if(c===quote)quote=null;else value+=c;}else if(c==='"'||c==="'"){quote=c;active=true;}else if(/\s/.test(c)){if(active){tokens.push(value);value='';active=false;}}else{value+=c;active=true;}}if(quote)throw Error('Close the quoted argument');if(active)tokens.push(value);return tokens;}
function parse(argv) {
  const [action='list',engine,...rest]=argv;if(!['list','doctor','setup','run'].includes(action))throw Error('Use api-test list|doctor [engine]|setup engine|run engine file [--base-url URL]');
  if(action!=='run'){if(rest.length)throw Error('Unexpected arguments');return {action,engine};}
  const file=rest.shift(),options={};for(let i=0;i<rest.length;i+=2){const key={'--base-url':'url','--timeout':'timeout','--examples':'examples','--iterations':'iterations','--vus':'vus'}[rest[i]];if(!key||rest[i+1]===undefined)throw Error('Unknown or incomplete API-test option');options[key]=rest[i+1];}return {action,engine,file,options};
}
async function dispatch(root,argv,context={}) {const args=parse(argv);if(context.mode==='plan'&&['setup','run'].includes(args.action))throw Error('API test setup/execution is disabled in plan mode');if(context.noTools&&['setup','run'].includes(args.action))throw Error('API tests require tools');if(args.action==='list')return {ok:true,engines};if(args.action==='doctor')return doctor(root,args.engine);if(args.action==='setup')return setup(root,args.engine);return run(root,args.engine,args.file,args.options);}
function result(report) {return {apiTest:true,modelCalls:0,tokens:0,provider:'api-test',completionStatus:report.ok?'NOT_REQUIRED':'FAILED',result:report.engine?((report.ok?'Passed':'Failed')+' · '+report.engine+(report.file?' · '+report.file:'')+'\n'+(report.report?'Report: '+report.report+'\n':'')+(report.error||'')+'\n'+(report.failure||report.diagnostic||(report.metrics?JSON.stringify(report.metrics,null,2):JSON.stringify(report.engines||{},null,2))).slice(-6000)):JSON.stringify(report,null,2)};}
module.exports={engines,doctor,setup,run,dispatch,result,parse,tokenize,suite,execute,k6Assets,resolveEngine};
