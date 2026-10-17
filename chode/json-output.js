'use strict';
function resultEnvelope(result,session){
 const status=!result?'FAILED':result.degraded?'QUEUED':result.partial?'PARTIAL':result.artifactPath?'ARTIFACT_SAVED':result.completionStatus||'ANSWERED';
 const sources=(result&&result.sources||[]).map(({excerpt,...s})=>s);
 const actions=result&&result.agentActions?{...result.agentActions,sources}:null;
 return {schema:1,status,session:session||'default',answer:result&&result.result||null,artifact:result&&result.artifactPath||null,provider:result&&result.provider||null,sources,citationWarnings:result&&result.citationWarnings||[],actions,usage:result?{tokens:result.tokens||0,latencyMs:result.latency||0}:null};
}
module.exports={resultEnvelope};
