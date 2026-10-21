'use strict';
const assert=require('assert/strict');
const {compare}=require('../benchmarks/compare-pilots.cjs');
function run(pins,passed){
  const tasks=['a__x-1','b__y-2'];
  return {protocol:{name:'Chode SWE-bench pilot v1',instances:tasks,...pins},
    results:tasks.map((t,i)=>({task:t,passed:passed[i]})),
    total:2,completed:2,scorePercent:100*passed.filter(Boolean).length/2};
}
const pins={adapterHash:'aa',datasetRevision:'rr',harnessSha:null,freeOnly:true};
const before=run(pins,[false,false]);
assert.throws(()=>compare(before,run({...pins,adapterHash:'bb'},[true,false])),/adapterHash/,'different agent code refuses comparison');
assert.throws(()=>compare(before,run({...pins,datasetRevision:'zz'},[true,false])),/datasetRevision/,'different dataset revision refuses comparison');
const other={protocol:{name:'Chode SWE-bench pilot v1',instances:['a__x-1','c__z-9'],...pins},results:[{task:'a__x-1',passed:true},{task:'c__z-9',passed:true}],total:2,completed:2,scorePercent:100};
assert.throws(()=>compare(before,other),/Protocol differs: instances/,'different task set refuses comparison');
const delta=compare(before,run(pins,[true,false]));
assert.equal(delta.percentagePointDelta,50);
console.log('PASS compare-pilots swebench: pin and task-set equality enforced, deltas only on identical protocols');
