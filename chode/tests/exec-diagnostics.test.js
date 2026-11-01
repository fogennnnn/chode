'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
function fixture(){
 const e=require('../chode');
 let result=e.toolRunExec('node -e "process.stdout.write(\'before failure\');process.stderr.write(\'ACTUAL_STDERR_FAILURE\');process.exit(7)"',{approved:true});
 assert(!result.ok);assert.equal(result.exitCode,7);assert(result.error.includes('before failure'));assert(result.error.includes('ACTUAL_STDERR_FAILURE'),'stdout must not hide stderr');
 result=e.toolRunExec('node -e "process.stdout.write(\'x\'.repeat(8000));process.stderr.write(\'IMPORTANT_ERROR_AT_END\');process.exit(3)"',{approved:true});assert(!result.ok);assert.equal(result.exitCode,3);assert(result.error.length<=4000);assert(result.error.includes('IMPORTANT_ERROR_AT_END'),'bounded output retains the final diagnostic');
 result=e.toolRunExec('node -e "process.stdout.write(\'ok\')"',{approved:true});assert(result.ok);assert.equal(result.output,'ok');
 console.log('PASS failed exec diagnostics: actual child stdout and stderr retained, real exit status, bounded tail preserves error detail and successful output unchanged');
}
if(process.argv[2]==='--fixture')fixture();else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-exec-diagnostic-'));try{const r=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stdout+r.stderr);console.log(r.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
