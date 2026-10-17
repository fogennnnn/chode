'use strict';
const snapshot=require('./public-baselines.json');
function compare(result,baseline){
 const required=['benchmark','version','unit','protocol'];
 if(required.some(k=>!result[k])||!Number.isFinite(result.score))return {comparable:false,reason:'A measured Chode result and evaluation protocol are required.'};
 if(['benchmark','version','unit'].some(k=>result[k]!==baseline[k]))return {comparable:false,reason:'Benchmark version or metric differs.'};
 if(result.protocol!==baseline.protocol||!baseline.protocol)return {comparable:false,reason:'Matching evaluation protocol has not been recorded.'};
 return {comparable:true,pointEstimateHigher:result.score>baseline.score,reason:'Point estimates alone do not establish statistical superiority.'};
}
if(require.main===module){for(const b of snapshot.baselines)console.log(`${b.benchmark} ${b.version}: ${b.agent||'model benchmark'} / ${b.model}: ${b.score} ${b.unit}\n  ${b.source}`);console.log('\nChode: unmeasured on these public benchmarks.');}
module.exports={snapshot,compare};
