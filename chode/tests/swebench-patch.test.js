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
  assert(touchesTests('diff --git a/sympy/core/tests/test_x.py b/sympy/core/tests/test_x.py\n+++ b/sympy/core/tests/test_x.py',['tests/'])===true,'nested test dir detected');
  assert(touchesTests('diff --git a/tests/test_y.py b/tests/test_y.py\n--- a/tests/test_y.py\n+++ /dev/null',['tests/'])===true,'deleted test file detected');
  assert(touchesTests('diff --git a/pkg/test_foo.py b/pkg/test_foo.py\n+++ b/pkg/test_foo.py',['tests/'])===true,'test basename detected at any depth');
  assert(touchesTests('diff --git a/src/contest.py b/src/contest.py\n+++ b/src/contest.py',['tests/'])===false,'contest.py is not a test file');
  assert(touchesTests('diff --git a/src/latest.py b/src/latest.py\n+++ b/src/latest.py',['tests/'])===false);
  const eng=fs.mkdtempSync(path.join(os.tmpdir(),'chode-swebench-patch-eng-'));
  try{
    cp.execFileSync('git',['init'],{cwd:eng});cp.execFileSync('git',['config','user.email','t@t'],{cwd:eng});cp.execFileSync('git',['config','user.name','t'],{cwd:eng});
    fs.writeFileSync(path.join(eng,'a.txt'),'v1\n');cp.execFileSync('git',['add','.'],{cwd:eng});cp.execFileSync('git',['commit','-m','base'],{cwd:eng});
    fs.mkdirSync(path.join(eng,'.chode','monitor'),{recursive:true});fs.writeFileSync(path.join(eng,'.chode','monitor','registry.json'),'{"e":1}\n');
    assert.equal(extractPatch(eng),'','engine state alone extracts to empty, never a model patch');
    fs.writeFileSync(path.join(eng,'a.txt'),'v2\n');
    const mixed=extractPatch(eng);
    assert(mixed.includes('a.txt'),'mixed diff keeps the real edit');
    assert(!mixed.includes('.chode'),'mixed diff drops engine state');
  }finally{fs.rmSync(eng,{recursive:true,force:true});}
  assert.equal(extractPatch(dir).length>0,true);
  const clean=fs.mkdtempSync(path.join(os.tmpdir(),'chode-swebench-patch-clean-'));
  try{
    cp.execFileSync('git',['clone',dir,path.join(clean,'c')],{stdio:'ignore'});
    fs.writeFileSync(path.join(clean,'patch.diff'),diff);
    cp.execFileSync('git',['-C',path.join(clean,'c'),'apply','--check',path.join(clean,'patch.diff')]);
  }finally{fs.rmSync(clean,{recursive:true,force:true});}
  console.log('PASS swebench-patch: unified diff extraction with test-edit detection, applies cleanly');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
