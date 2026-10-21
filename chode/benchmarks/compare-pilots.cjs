'use strict';
const fs=require('fs');
function tasksOf(run){return run.protocol.tasks||run.protocol.instances;}
function compare(before,after){
 const fields=['name','datasetCommit','selection','tasks','attempts','modelCallsPerTask','wallMsPerTask','freeOnly','mode','grading','providerState','capacityContinuation'];
 if(before.completed!==before.total||after.completed!==after.total)throw Error('Only completed runs can be compared.');
 const swebenchFields=['name','provider','adapterHash','harnessSha','datasetRevision','freeOnly','instances'];
 for(const field of (before.protocol.name||'').startsWith('Chode SWE-bench')?swebenchFields:fields)if(JSON.stringify(before.protocol[field])!==JSON.stringify(after.protocol[field]))throw Error('Protocol differs: '+field);
 for(const run of [before,after]){
  const ids=run.results.map(result=>result.task),tasks=tasksOf(run);
  if(run.total<=0||run.total!==tasks.length||new Set(ids).size!==run.total||ids.length!==run.total||tasks.some(task=>!ids.includes(task)))throw Error('Missing or duplicate tasks.');
  if(run.results.some(result=>typeof result.passed!=='boolean')||run.scorePercent!==100*run.results.filter(result=>result.passed).length/run.total)throw Error('Invalid measured score.');
 }
 const old=new Map(before.results.map(result=>[result.task,result]));
 if(old.size!==before.total||after.results.length!==after.total)throw Error('Missing or duplicate tasks.');
 const changed=after.results.filter(result=>old.has(result.task)&&old.get(result.task).passed!==result.passed).map(result=>({task:result.task,before:old.get(result.task).passed,after:result.passed}));
 return {before:before.scorePercent,after:after.scorePercent,percentagePointDelta:after.scorePercent-before.scorePercent,changed,
  caveat:'Adapted public-task pilot, not an official leaderboard score. Free routing may change models/providers; a delta alone does not isolate a harness improvement.'};
}
if(require.main===module){try{console.log(JSON.stringify(compare(JSON.parse(fs.readFileSync(process.argv[2])),JSON.parse(fs.readFileSync(process.argv[3]))),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={compare};
