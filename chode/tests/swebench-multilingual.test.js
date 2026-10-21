'use strict';
// Language tags derive from each row's log_parser (verified over all 300 rows
// 2026-10-21): maven/gradle/ant->java, cargo->rust, phpunit->php, gotest->go,
// ruby_unit/rspec/jekyll->ruby, redis/jq/micropython->c, googletest/doctest->cpp,
// karma/tap/immutable-js->javascript, vitest->typescript (vuejs/core),
// jest->typescript for facebook/docusaurus else javascript. Counts: c 30, cpp 12,
// go 42, java 43, javascript 33, php 43, ruby 44, rust 43, typescript 10.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const header=JSON.parse(fs.readFileSync(path.join(__dirname,'../benchmarks/swebench-multilingual-instances.json'),'utf8'));
assert.match(header.datasetRevision,/^[0-9a-f]{40}$/);
assert.equal(header.instances.length,300);
assert(!header.instances.some(e=>e.language==='python'),'zero Python tasks');
for(const lang of ['ruby','rust','php','java','go','c','javascript','typescript','cpp'])assert(header.instances.some(e=>e.language===lang),'missing '+lang);
for(const e of header.instances){assert.equal(typeof e.instance_id,'string');assert.ok(e.repo.startsWith('https://github.com/'),e.instance_id);assert.match(e.base_commit,/^[0-9a-f]{40}$/,e.instance_id);assert.equal(typeof e.language,'string',e.instance_id);}
assert.equal(new Set(header.instances.map(e=>e.instance_id)).size,300);
console.log('PASS swebench-multilingual: 300 pinned tasks, zero Python, all 9 languages present with SHAs');
