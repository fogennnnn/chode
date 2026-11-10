'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict'),check=require('../acceptance-check');const {spawnSync:probeSync}=require('child_process');const pyCmd=process.env.CHODE_PYTHON||(process.platform==='win32'?'python':'python3');const probe=probeSync(pyCmd,['-c','print(1)'],{encoding:'utf8',timeout:10000,windowsHide:true});if(!probe||probe.status!==0||!/^\s*1\s*$/m.test(probe.stdout||'')){console.log('SKIP python acceptance: no working Python interpreter ('+pyCmd+' unavailable); install Python or set CHODE_PYTHON to run this test');process.exit(0);}
const root=fs.mkdtempSync(path.join(os.tmpdir(),'chode-python-check-'));
try{
 const file=path.join(root,'contract_test.py');
 fs.writeFileSync(file,'import unittest\nclass Contract(unittest.TestCase):\n    def test_value(self):\n        self.assertEqual(6*7, 42)\n');
 let result=check.run(root,{acceptanceTest:'contract_test.py'});assert(result.ok,result.detail);let report=JSON.parse(fs.readFileSync(path.join(root,result.reportPath)));assert.equal(report.pythonTestsRun,1);assert(report.unchanged);
 fs.writeFileSync(file,'import unittest\nclass Contract(unittest.TestCase):\n    def test_value(self):\n        self.assertEqual(41, 42)\n');result=check.run(root,{acceptanceTest:'contract_test.py'});assert(!result.ok);assert(result.detail.includes('AssertionError'));assert.equal(result.exitCode,1);
 fs.writeFileSync(file,'# No tests\n');result=check.run(root,{acceptanceTest:'contract_test.py'});assert(!result.ok);assert(result.detail.includes('No Python unittest tests'),result.detail);
 fs.writeFileSync(file,'import unittest\nclass Contract(unittest.TestCase):\n    def test_mutation(self):\n        with open(__file__, "a") as f:\n            f.write("\\n# changed\\n")\n');result=check.run(root,{acceptanceTest:'contract_test.py'});assert(!result.ok);assert(result.detail.includes('changed while running'));
 console.log('PASS Python acceptance: real unittest pass/failure evidence, zero-test rejection and immutable-test enforcement');
}finally{fs.rmSync(root,{recursive:true,force:true});}
