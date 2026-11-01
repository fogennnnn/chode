'use strict';
const assert=require('assert/strict'),{first,combine}=require('../provider-race');
(async()=>{
 let slowSignal,finishSlow;
 const results=await first(['slow','fast'],(id,signal)=>id==='slow'?(slowSignal=signal,new Promise(resolve=>finishSlow=resolve)):Promise.resolve({pid:id,result:'answer'}));
 assert.equal(results.at(-1).pid,'fast');assert(slowSignal.aborted);
 finishSlow({pid:'slow',result:'late'});await new Promise(resolve=>setImmediate(resolve));assert.equal(results.length,1);
 const failed=await first(['bad','empty'],async id=>{if(id==='bad')throw Error('429_rate_limited');return {pid:id,result:''};});assert.equal(failed.length,2);assert(failed.some(result=>result.error==='429_rate_limited'));
 const controller=new AbortController(),linked=combine([controller.signal,AbortSignal.timeout(1000)]);controller.abort();assert(linked.aborted);
 assert(combine([controller.signal]).aborted);
 console.log('PASS provider race: first answer wins without waiting for hung losers, cancellation, late-result isolation and all-failure collection');
})().catch(error=>{console.error(error);process.exitCode=1;});
