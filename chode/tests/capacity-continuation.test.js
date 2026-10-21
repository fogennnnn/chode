'use strict';
const assert=require('assert/strict'),{run}=require('../benchmarks/capacity-continuation.cjs');
(async()=>{
 let clock=0,turns=0,waits=0;const budget={calls:0,limit:3},caps=[];
 const result=await run({budget,toolCap:4,deadline:50000,now:()=>clock,sleep:async ms=>{assert(ms<=10000);clock+=ms;waits++;},invoke:async cap=>{caps.push(cap);budget.calls++;if(++turns===1)return {partial:true,retryAt:25000,toolCalls:1};return {completionStatus:'VERIFIED',toolCalls:2};}});
 assert.equal(result.result.completionStatus,'VERIFIED');assert.equal(result.totalTools,3);assert.equal(result.resumes,1);assert.equal(budget.calls,2);assert.equal(waits,3);assert.deepEqual(caps,[4,3]);
 for(const exhausted of ['deadline','calls','tools','no-capacity-time']){
  let calls=0;const b={calls:0,limit:exhausted==='calls'?1:3};
  const out=await run({budget:b,toolCap:2,deadline:100,now:()=>0,sleep:()=>{throw Error('Must not wait');},invoke:async()=>{calls++;b.calls++;return {partial:true,retryAt:exhausted==='deadline'?100:exhausted==='no-capacity-time'?null:50,toolCalls:exhausted==='tools'?2:0};}});
  assert.equal(calls,1);assert.equal(out.resumes,0);
 }
 await assert.rejects(run({budget:{calls:0,limit:1},toolCap:1,deadline:100,now:()=>0,invoke:async()=>({toolCalls:2})}),/accounting/);
 console.log('PASS capacity continuation: bounded waits resume saved task, shared total model/tool/wall budgets, no past-deadline wait or busy loop and invalid accounting fails closed');
})().catch(error=>{console.error(error);process.exitCode=1;});
