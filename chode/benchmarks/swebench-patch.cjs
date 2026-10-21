'use strict';
// Patch extraction for SWE-bench tasks: unified diff of agent edits plus
// test-file detection (a patch touching tests is rejected by Task 3).
const cp=require('child_process');
function extractPatch(worktreeDir){
  cp.execFileSync('git',['-C',worktreeDir,'add','-N','.'],{encoding:'utf8',timeout:60000,windowsHide:true});
  return cp.execFileSync('git',['-C',worktreeDir,'diff','HEAD'],{encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024,windowsHide:true});
}
function touchesTests(diff,testPatterns){
  return diff.split('\n').some(line=>line.startsWith('+++ b/')&&testPatterns.some(p=>line.slice(6).startsWith(p)));
}
module.exports={extractPatch,touchesTests};
