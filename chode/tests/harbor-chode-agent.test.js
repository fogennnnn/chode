'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
const shim=require('../benchmarks/harbor-chode-agent/chode_agent.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-harbor-'));
try{
  const okEngine=path.join(dir,'engine-ok.cjs');
  fs.writeFileSync(okEngine,"const fs=require('fs');fs.writeFileSync('got.json',fs.readFileSync(process.argv[2],'utf8'));fs.writeFileSync('env.json',JSON.stringify({keep:process.env.CHODE_KEEP_ME||null,leak:process.env.SHIM_DROP_ME_TOKEN||null,path:(process.env.PATH||process.env.Path||null)!==null}));\n");
  const traj=path.join(dir,'traj.json');
  process.env.CHODE_KEEP_ME='k';process.env.SHIM_DROP_ME_TOKEN='x';
  assert.equal(shim.runShim({engine:okEngine,workdir:dir,instruction:'do the thing',timeoutMs:10000,trajectoryPath:traj}),0);
  delete process.env.CHODE_KEEP_ME;delete process.env.SHIM_DROP_ME_TOKEN;
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'got.json'),'utf8')).problem_statement,'do the thing','agent receives the instruction via spec file');
  const seen=JSON.parse(fs.readFileSync(path.join(dir,'env.json'),'utf8'));
  assert.equal(seen.keep,'k','allowlisted var passes through');assert.equal(seen.leak,null,'key-bearing var never reaches the agent');assert.equal(seen.path,true);
  const t=JSON.parse(fs.readFileSync(traj,'utf8'));
  assert(Array.isArray(t.steps)&&t.steps.length>0,'trajectory has agent steps list, non-empty');
  const badEngine=path.join(dir,'engine-bad.cjs');
  fs.writeFileSync(badEngine,"console.error('boom');process.exit(3);\n");
  const traj2=path.join(dir,'traj2.json');
  assert.equal(shim.runShim({engine:badEngine,workdir:dir,instruction:'x',timeoutMs:10000,trajectoryPath:traj2}),0);
  assert(JSON.parse(fs.readFileSync(traj2,'utf8')).status!=='ok','failing engine marks reward invalid, no exception');
  const hangEngine=path.join(dir,'engine-hang.cjs');
  fs.writeFileSync(hangEngine,'setInterval(()=>{},1000);\n');
  const traj3=path.join(dir,'traj3.json');
  assert.equal(shim.runShim({engine:hangEngine,workdir:dir,instruction:'x',timeoutMs:500,trajectoryPath:traj3}),0);
  assert.equal(JSON.parse(fs.readFileSync(traj3,'utf8')).status,'timeout');
  console.log('PASS harbor chode agent shim: trajectory parses with steps; failing and timed-out engines exit 0 with invalid status');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
