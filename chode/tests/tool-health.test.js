'use strict';
const assert=require('assert/strict'),e=require('../chode'),health=require('../tool-health'),commands=require('../workspace-commands');
(async()=>{try{e.__testHooks.callAI=async()=>{throw Error('Health checks must not call models');};e.__testHooks.httpsGet=async(host)=>({ok:true,data:host==='open.er-api.com'?{result:'success',base_code:'USD',rates:{EUR:0.9,SEK:10}}:[{latest:'27.0.0',eol:false,latestReleaseDate:'2026-10-20'}]});
 assert((await health.check(e,'forex')).verified);const lifecycle=await e.toolDevReconAsync({action:'eol',product:'nodejs'});assert.equal(lifecycle.latest,'27.0.0');
 const result=await e.cmdAI({prompt:'tool-check: forex'});assert(result.toolHealth&&result.modelCalls===0&&result.result.includes('PASSED'));
 e.__testHooks.httpsGet=async()=>({ok:true,data:{}});assert.equal((await health.check(e,'forex')).verified,false);assert.equal((await e.toolDevReconAsync({action:'eol',product:'nodejs'})).ok,false);
 const other=await health.check(e,'read');assert(!other.verified&&other.rows[0].state==='not-tested');const state={};assert(commands.run('/tools',state,e).text.includes('automatically'));assert(commands.run('/tools forex',state,e).text.includes('has not executed'));assert.equal(commands.run('/tools check forex',state,e).prompt,'tool-check: forex');
 console.log('PASS tool health: real dispatcher, zero model calls, meaningful payload validation, lifecycle arrays, honest untested states and clear tool guidance');
}finally{e.__testHooks.callAI=null;e.__testHooks.httpsGet=null;}})().catch(error=>{console.error(error);process.exitCode=1;});
