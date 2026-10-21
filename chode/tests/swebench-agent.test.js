'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
function gitInit(repo,files){
  fs.mkdirSync(repo,{recursive:true});
  cp.execFileSync('git',['init'],{cwd:repo});cp.execFileSync('git',['config','user.email','t@t'],{cwd:repo});cp.execFileSync('git',['config','user.name','t'],{cwd:repo});
  for(const [name,content] of Object.entries(files)){const p=path.join(repo,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content);}
  cp.execFileSync('git',['add','.'],{cwd:repo});cp.execFileSync('git',['commit','-m','base'],{cwd:repo});
  return cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
}
if(process.argv.includes('--fixture')){
  const out=process.argv[process.argv.indexOf('--out')+1];
  const mode=process.argv[process.argv.indexOf('--mode')+1];
  if(mode==='agent'){
    const repo=path.join(out,'repo');
    const base=gitInit(repo,{'src.py':'def f():\n    return 1\n','tests/test_x.py':'def test_f():\n    assert True\n'});
    const stub=path.join(out,'stub-engine.cjs');
    const edit=process.argv.includes('--test-edit')?"require('fs').appendFileSync('tests/test_x.py','# x\\n');":"require('fs').writeFileSync('src.py','def f():\\n    return 2\\n');";
    fs.writeFileSync(stub,"'use strict';const fs=require('fs'),path=require('path');const spec=JSON.parse(fs.readFileSync(process.argv[2]));exports.agentToolPrompt=()=>'TOOLS';exports.__testHooks={};exports.trySingleProvider=async()=>null;exports.callWithBestProvider=async()=>({provider:'stub',result:'ok'});exports.runAgentLoop=async(prompt)=>{fs.writeFileSync(path.join(path.dirname(spec.callsFile),'prompt.txt'),String(prompt));"+edit+"return{completionStatus:'finished'};};\n");
    fs.writeFileSync(path.join(out,'spec.json'),JSON.stringify({instance_id:'x__y-1',base_commit:base,workdir:repo,problem_statement:'Make f return 2.',modelCallsPerTask:2,toolCap:4,callsFile:path.join(out,'calls.json'),agentResult:path.join(out,'agentResult.json')}));
    console.log('FIXTURE-READY');
    process.exit(0);
  }
  if(mode==='runner'){
    const repo=path.join(out,'repo-src');
    const base=gitInit(repo,{'src.py':'def f():\n    return 1\n'});
    const stub=path.join(out,'stub-agent.cjs');
    fs.writeFileSync(stub,"'use strict';const fs=require('fs');const spec=JSON.parse(fs.readFileSync(process.argv[2]));fs.writeFileSync(spec.agentResult,JSON.stringify({completionStatus:'finished',model_patch:'diff --git a/src.py b/src.py\\n+fix\\n',calls:[]}));fs.writeFileSync(spec.callsFile,'[]');fs.writeFileSync(process.argv[2]+'.envseen',process.env.CHODE_ENGINE||'MISSING');process.exit(0);\n");
    fs.writeFileSync(path.join(out,'instances.json'),JSON.stringify([{instance_id:'x__y-1',repo,base_commit:base,problem_statement:'Make f return 2.'}]));
    console.log('FIXTURE-READY');
    process.exit(0);
  }
  throw Error('unknown mode '+mode);
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-swebench-agent-'));
try{
  const agent=path.resolve(__dirname,'../benchmarks/swebench-agent.cjs');
  assert.ok(fs.existsSync(agent),'agent adapter exists');
  const mk=extra=>{const r=cp.spawnSync(process.execPath,[__filename,'--fixture','--out',path.join(dir,extra),'--mode','agent',...(extra==='testedit'?['--test-edit']:[])],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stdout+r.stderr);return path.join(dir,extra);};
  const fixDir=mk('fix');
  const runAgent=(d,env)=>cp.spawnSync(process.execPath,[path.resolve(__dirname,'../benchmarks/swebench-agent.cjs'),path.join(d,'spec.json')],{cwd:path.join(d,'repo'),encoding:'utf8',timeout:60000,env:{...process.env,...env}});
  const fix=runAgent(fixDir,{CHODE_ENGINE:path.join(fixDir,'stub-engine.cjs')});
  assert.equal(fix.status,0,fix.stdout+fix.stderr);
  const agentResult=JSON.parse(fs.readFileSync(path.join(fixDir,'agentResult.json'),'utf8'));
  assert.ok(agentResult.model_patch&&agentResult.model_patch.length>0,'agent emits a non-empty model_patch');
  assert.ok(!('patchRejected' in agentResult),'clean fix is not rejected');
  const capturedPrompt=fs.readFileSync(path.join(fixDir,'prompt.txt'),'utf8');
  assert.ok(capturedPrompt.includes('Make f return 2.'),'prompt carries the problem statement');
  assert.ok(capturedPrompt.includes('src.py'),'prompt orients the agent with the repo top-level listing');
  const rev=cp.spawnSync('git',['apply','--check','--reverse'],{cwd:path.join(fixDir,'repo'),input:agentResult.model_patch,encoding:'utf8'});
  assert.equal(rev.status,0,'emitted patch reverse-applies against the dirty tree, so it applied cleanly to base');
  const editDir=mk('testedit');
  const edit=runAgent(editDir,{CHODE_ENGINE:path.join(editDir,'stub-engine.cjs')});
  assert.equal(edit.status,0,edit.stdout+edit.stderr);
  const editResult=JSON.parse(fs.readFileSync(path.join(editDir,'agentResult.json'),'utf8'));
  assert.equal(editResult.patchRejected,'test-edit','test-file edits are rejected, never emitted');
  assert.ok(!editResult.model_patch,'rejected patch is not emitted');
  const runDir=mk('run');
  const rr=cp.spawnSync(process.execPath,[__filename,'--fixture','--out',path.join(runDir,'r'),'--mode','runner'],{encoding:'utf8',timeout:60000});
  assert.equal(rr.status,0,rr.stdout+rr.stderr);
  const rdir=path.join(runDir,'r'),out=path.join(runDir,'out');
  const runner=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../benchmarks/swebench-runner.cjs'),'--instances',path.join(rdir,'instances.json'),'--agent',path.join(rdir,'stub-agent.cjs'),'--out',out],{encoding:'utf8',timeout:120000,env:{...process.env,CHODE_ENGINE:'marker-engine'}});
  assert.equal(runner.status,0,runner.stdout+runner.stderr);
  const preds=fs.readFileSync(path.join(out,'predictions.jsonl'),'utf8').trim().split('\n').map(l=>JSON.parse(l));
  assert.equal(preds.length,1,'runner emits one predictions line');
  assert.equal(preds[0].instance_id,'x__y-1');
  assert.ok(preds[0].model_name_or_path.startsWith('chode-'),'predictions line names the chode model path');
  assert.ok(preds[0].model_patch.length>0,'predictions line carries the patch');
  assert.equal(fs.readFileSync(path.join(out,'x__y-1','spec.json.envseen'),'utf8'),'marker-engine','runner passes CHODE_* env through to the agent');
  const protocol=JSON.parse(fs.readFileSync(path.join(out,'protocol.json'),'utf8'));
  assert.ok(protocol.adapterHash,'protocol records adapterHash');
  console.log('PASS swebench-agent: stub fix emits an applicable patch, test edits are rejected, runner emits predictions.jsonl');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
