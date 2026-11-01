'use strict';const assert=require('assert'),cp=require('child_process');
const {killWithEscalation}=require('../benchmarks/swebench-kill.cjs');
(async()=>{
  const child=cp.spawn(process.execPath,['-e','setInterval(()=>{},1000);'],{stdio:'ignore'});
  await killWithEscalation(child,50);
  assert(child.exitCode!==null||child.signalCode!==null,'escalated kill terminates the child');
  console.log('PASS swebench kill: wall-clock kill escalates to SIGKILL');
})().catch(err=>{console.error(err);process.exit(1);});
