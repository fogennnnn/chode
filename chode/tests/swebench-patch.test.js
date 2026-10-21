'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const {extractPatch,touchesTests}=require('../benchmarks/swebench-patch.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-swebench-patch-'));
try{
  cp.execFileSync('git',['init'],{cwd:dir});cp.execFileSync('git',['config','user.email','t@t'],{cwd:dir});cp.execFileSync('git',['config','user.name','t'],{cwd:dir});
  fs.writeFileSync(path.join(dir,'a.txt'),'v1\n');cp.execFileSync('git',['add','.'],{cwd:dir});cp.execFileSync('git',['commit','-m','base'],{cwd:dir});
  fs.writeFileSync(path.join(dir,'a.txt'),'v2\n');fs.mkdirSync(path.join(dir,'tests'));fs.writeFileSync(path.join(dir,'tests','test_a.py'),'t\n');
  const diff=extractPatch(dir);
  assert(diff.includes('a.txt'),'diff names the edited file');
  assert(touchesTests(diff,['tests/'])===true,'test-file edit detected');
  assert(touchesTests('diff --git a/src/b.py b/src/b.py',['tests/'])===false);
  assert.equal(extractPatch(dir).length>0,true);
  const clean=fs.mkdtempSync(path.join(os.tmpdir(),'chode-swebench-patch-clean-'));
  try{
    cp.execFileSync('git',['clone',dir,path.join(clean,'c')],{stdio:'ignore'});
    fs.writeFileSync(path.join(clean,'patch.diff'),diff);
    cp.execFileSync('git',['-C',path.join(clean,'c'),'apply','--check',path.join(clean,'patch.diff')]);
  }finally{fs.rmSync(clean,{recursive:true,force:true});}
  console.log('PASS swebench-patch: unified diff extraction with test-edit detection, applies cleanly');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
