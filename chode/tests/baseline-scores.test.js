'use strict';const assert=require('assert');const rows=require('../benchmarks/results/baseline-scores.json');
for(const r of rows){
  for(const f of ['benchmark','benchmarkRevision','agent','scaffold','model','source','date'])assert(r[f]!==undefined&&r[f]!==null&&r[f]!=='','missing '+f+' in '+JSON.stringify(r).slice(0,80));
  assert('score'in r,'missing score in '+JSON.stringify(r).slice(0,80));
  if(r.score===null){assert.equal(r.gap,true,'null score needs gap:true');assert(r.note,'gap row needs note');}
  assert(/^https:\/\//.test(r.source),'source must be a URL');
}
assert(rows.some(r=>r.agent==='claude-code'),'claude-code row present');
assert(rows.some(r=>r.gap===true),'at least one explicit gap row present');
console.log('PASS baseline scorecard: every row pinned, gaps explicit');
