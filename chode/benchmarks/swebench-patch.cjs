'use strict';
// Patch extraction for SWE-bench tasks: unified diff of agent edits plus
// test-file detection (a patch touching tests is rejected by Task 3).
const cp=require('child_process');
function extractPatch(worktreeDir){
  cp.execFileSync('git',['-C',worktreeDir,'add','-N','.'],{encoding:'utf8',timeout:60000,windowsHide:true});
  // Engine state (.chode/) lives in the agent cwd by design; exclude it so a
  // provider-discovery write can never become the model patch.
  return cp.execFileSync('git',['-C',worktreeDir,'diff','HEAD','--','.',':!.chode'],{encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024,windowsHide:true});
}
function touchesTests(diff,testPatterns){
  const pats=testPatterns||[];
  return diff.split('\n').some(line=>{
    // Evasion-proof: scan both sides of the diff (deletions show +++ /dev/null)
    // and match nested test dirs plus test basenames, not just root prefixes.
    const m=/^[+-]{3} [ab]\/(.+)$/.exec(line);
    if(!m)return false;
    const p=m[1];
    if(pats.some(prefix=>p.startsWith(prefix)))return true;
    if(/(^|\/)(tests?|spec|testing|__tests__)\//.test(p))return true;
    const base=p.slice(p.lastIndexOf('/')+1);
    return /^test_.*\.[a-z0-9]+$/.test(base)||/_test\.[a-z0-9]+$/.test(base)||base==='conftest.py';
  });
}
module.exports={extractPatch,touchesTests};
