'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),{spawnSync}=require('child_process'),checks=require('../acceptance-check');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'chode-verification-')),cli=path.resolve(__dirname,'../chode.js');
try{
 fs.writeFileSync(path.join(root,'check.cjs'),"console.log('SPECIFIC_STDOUT_FAILURE');console.error('WARNING_ON_STDERR');process.exit(7);");let r=checks.run(root,{acceptanceTest:'check.cjs'});assert(!r.ok);assert.equal(r.exitCode,7);assert(r.detail.includes('SPECIFIC_STDOUT_FAILURE')&&r.detail.includes('WARNING_ON_STDERR'));let report=JSON.parse(fs.readFileSync(path.join(root,r.reportPath),'utf8'));assert.equal(report.exitCode,7);assert(report.unchanged);assert.equal(report.ok,false);
 fs.writeFileSync(path.join(root,'check.cjs'),"console.log('Actual test passed');");r=checks.run(root,{acceptanceTest:'check.cjs'});assert(r.ok);assert.equal(r.exitCode,0);assert(r.detail.includes('Independent acceptance test passed'));report=JSON.parse(fs.readFileSync(path.join(root,r.reportPath),'utf8'));assert(report.stdout.includes('Actual test passed'));assert(report.durationMs>=0);
 fs.writeFileSync(path.join(root,'self.cjs'),"require('fs').appendFileSync(__filename,'\\n// changed');");r=checks.run(root,{acceptanceTest:'self.cjs'});assert(!r.ok);assert(r.detail.includes('changed while running'));assert.equal(r.exitCode,0,'exit zero cannot hide modified acceptance');
 fs.writeFileSync(path.join(root,'secret.cjs'),"console.log('Bearer secret-fixture-token');");r=checks.run(root,{acceptanceTest:'secret.cjs'});report=JSON.parse(fs.readFileSync(path.join(root,r.reportPath),'utf8'));assert(!report.stdout.includes('secret-fixture-token'));assert(report.stdout.includes('[redacted]'));
 const out=spawnSync(process.execPath,[cli,'verify','check.cjs'],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(out.status,0,out.stdout+out.stderr);assert(JSON.parse(out.stdout).ok);
 assert.equal(checks.run(root,{acceptanceTest:'../outside.cjs'}).ok,false);
 console.log('PASS: durable exit/signal/timing/digest evidence, both output streams, redaction, immutable checks and real verification CLI');
}finally{fs.rmSync(root,{recursive:true,force:true});}
