'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const target=process.env.CHODE_REA_TARGET;
if(!target)throw Error('Set CHODE_REA_TARGET to a local test executable; this test never runs that executable.');
const digest=()=>crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');const before=digest();
const child=spawnSync(process.execPath,[path.join(__dirname,'..','chode.js'),'tool','rea','analyze',path.resolve(target),'--timeout','120000'],{encoding:'utf8',timeout:150000,maxBuffer:8*1024*1024,windowsHide:true});
assert.ifError(child.error);assert.equal(child.status,0,child.stderr||child.stdout);const result=JSON.parse(child.stdout);assert.equal(result.ok,true);assert.equal(result.evidence.digest,before);assert.equal(digest(),before,'analysis must preserve executable bytes');assert.ok(result.evidence.procedures>0);assert.ok(result.evidence.format);assert.ok(result.evidence.arch);console.log('✓ live REA CLI: real analyzer, matching SHA-256, nonempty inventory, unchanged executable');
