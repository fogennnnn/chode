'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
if(process.argv.includes('--fixture')){
  const out=process.argv[process.argv.indexOf('--out')+1];
  const repo=path.join(out,'repo-src');fs.mkdirSync(repo,{recursive:true});
  cp.execFileSync('git',['init'],{cwd:repo});cp.execFileSync('git',['config','user.email','t@t'],{cwd:repo});cp.execFileSync('git',['config','user.name','t'],{cwd:repo});
  fs.writeFileSync(path.join(repo,'a.txt'),'v1\n');cp.execFileSync('git',['add','.'],{cwd:repo});cp.execFileSync('git',['commit','-m','base'],{cwd:repo});
  const base=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
  const stub=path.join(out,'stub-agent.cjs');fs.writeFileSync(stub,"'use strict';const fs=require('fs');fs.writeFileSync(process.argv[2]+'.ran','ok');fs.writeFileSync(process.argv[2]+'.provider',process.env.CHODE_BENCH_PROVIDER||'');process.exit(0);\n");
  fs.writeFileSync(path.join(out,'instances.json'),JSON.stringify({source:'test',datasetRevision:'rev1',count:1,instances:[{instance_id:'x__y-1',repo,base_commit:base,problem_statement:'fix it'}]}));
  console.log('PASS swebench-runner scaffold: stub agent runs in a repo checked out at base_commit, results and pinned protocol recorded');
  process.exit(0);
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-swebench-runner-'));
try{
  const r=cp.spawnSync(process.execPath,[__filename,'--fixture','--out',dir],{encoding:'utf8',timeout:60000});
  assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);
  const list=path.join(dir,'instances.json'),stub=path.join(dir,'stub-agent.cjs'),runDir=path.join(dir,'run');
  fs.mkdirSync(runDir,{recursive:true});fs.writeFileSync(path.join(runDir,'predictions.jsonl'),'{"junk":true}\n');
  const run=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../benchmarks/swebench-runner.cjs'),'--instances',list,'--agent',stub,'--out',runDir],{encoding:'utf8',timeout:120000});
  assert.equal(run.status,0,run.stdout+run.stderr);
  assert.ok(!fs.existsSync(path.join(runDir,'predictions.jsonl'))||!fs.readFileSync(path.join(runDir,'predictions.jsonl'),'utf8').includes('junk'),'rerun starts with a fresh predictions file');
  const results=JSON.parse(fs.readFileSync(path.join(runDir,'results.json'),'utf8'));
  assert.equal(results.completed,1);
  assert.equal(results.results[0].task,'x__y-1');
  assert.equal(results.results[0].timedOut,false);
  assert.equal(results.results[0].passed,false,'scaffold performs no grading');
  const protocol=JSON.parse(fs.readFileSync(path.join(runDir,'protocol.json'),'utf8'));
  assert.equal(protocol.name,'Chode SWE-bench pilot v1');
  assert.ok('harnessSha' in protocol,'protocol records harnessSha');
  assert.ok(protocol.runId,'protocol records runId');
  assert.equal(protocol.datasetRevision,'rev1','protocol pins the instances dataset revision');
  assert.equal(JSON.parse(fs.readFileSync(path.join(runDir,'x__y-1','spec.json'),'utf8')).problem_statement,'fix it','problem statement reaches the agent spec');
  const head=cp.execFileSync('git',['-C',path.join(runDir,'x__y-1','repo'),'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assert.equal(head,JSON.parse(fs.readFileSync(list,'utf8')).instances[0].base_commit,'worktree checked out at base_commit');
  const runDir2=path.join(dir,'run-provider');fs.mkdirSync(runDir2,{recursive:true});
  const run2=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../benchmarks/swebench-runner.cjs'),'--instances',list,'--agent',stub,'--out',runDir2,'--provider','pinned-x'],{encoding:'utf8',timeout:120000});
  assert.equal(run2.status,0,run2.stdout+run2.stderr);
  assert.equal(fs.readFileSync(path.join(runDir2,'x__y-1','spec.json.provider'),'utf8'),'pinned-x','--provider reaches the agent environment');
  assert.equal(JSON.parse(fs.readFileSync(path.join(runDir2,'protocol.json'),'utf8')).provider,'pinned-x','protocol records the pinned provider');
  assert.equal(protocol.provider,null,'unpinned runs record provider null');
  const defs=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../benchmarks/swebench-runner.cjs'),'--print-defaults'],{encoding:'utf8',timeout:60000});
  assert.equal(defs.status,0,defs.stdout+defs.stderr);
  assert.ok(Number(JSON.parse(defs.stdout).wallMs)>=420000,'default wall clock fits clone plus 429 rate-window waits');
  console.log(r.stdout.trim());
}finally{fs.rmSync(dir,{recursive:true,force:true});}
