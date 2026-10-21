'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{compare}=require('../benchmarks/compare-pilots.cjs');
const instances=['a__a-1','b__b-2'];
const sw=(score,pass)=>({protocol:{name:'Chode SWE-bench pilot v1',source:'SWE-bench',instances,wallMsPerTask:210000,runId:'r1',harnessSha:null,adapterHash:'h',freeOnly:true,mode:'scaffold'},total:2,completed:2,scorePercent:score,results:[{task:'a__a-1',passed:pass},{task:'b__b-2',passed:false}]});
assert.deepEqual(compare(sw(0,false),sw(50,true)).changed,[{task:'a__a-1',before:false,after:true}]);
const poly={protocol:{name:'pilot',datasetCommit:'pinned',selection:'fixed',tasks:['a','b'],attempts:1,modelCallsPerTask:6,wallMsPerTask:210000,freeOnly:true,mode:'v2',grading:'all tests'},total:2,completed:2,scorePercent:0,results:[{task:'a',passed:false},{task:'b',passed:false}]};
assert.throws(()=>compare(sw(0,false),poly),/Protocol differs: name/);
const header=JSON.parse(fs.readFileSync(path.join(__dirname,'../benchmarks/swebench-lite-instances.json'),'utf8'));
assert.match(header.datasetRevision,/^[0-9a-f]{40}$/);
assert.equal(header.instances.length,300);
for(const e of header.instances){assert.equal(typeof e.instance_id,'string');assert.ok(e.repo.startsWith('https://github.com/'),e.instance_id);assert.match(e.base_commit,/^[0-9a-f]{40}$/,e.instance_id);}
assert.equal(new Set(header.instances.map(e=>e.instance_id)).size,300);
console.log('PASS swebench-lite: comparator accepts swebench protocol and refuses cross-protocol comparison; 300 pinned Lite instances with SHAs');
