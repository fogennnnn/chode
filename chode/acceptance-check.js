'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
function locate(root,name){const full=fs.realpathSync(path.resolve(root,name));const relative=path.relative(fs.realpathSync(root),full);if(relative.startsWith('..'+path.sep)||relative==='..'||path.isAbsolute(relative)||!fs.statSync(full).isFile()||! /\.(?:js|cjs|mjs)$/i.test(full))throw Error('Acceptance check must be a local JavaScript test inside this workspace.');return full;}
function digest(full){return crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');}
function capture(root,report){let at=fs.realpathSync(root);for(const part of ['.chode','verification']){at=path.join(at,part);try{if(fs.lstatSync(at).isSymbolicLink())throw Error('Linked verification-report directory');}catch(e){if(e.code!=='ENOENT')throw e;}}fs.mkdirSync(at,{recursive:true});const name='check_'+Date.now()+'_'+crypto.randomBytes(8).toString('hex')+'.json',full=path.join(at,name),temp=full+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(report,null,2),{mode:0o600,flag:'wx'});fs.renameSync(temp,full);}finally{try{fs.unlinkSync(temp);}catch{}}try{const names=fs.readdirSync(at).filter(n=>/^check_\d+_[a-f0-9]{16}\.json$/.test(n)).sort().reverse();for(const old of names.slice(50))fs.unlinkSync(path.join(at,old));}catch{}return path.relative(root,full).replace(/\\/g,'/');}
function run(root,options={}){
 if(!options.acceptanceTest)return null;
 try{const file=locate(root,options.acceptanceTest),before=digest(file),expected=options.acceptanceDigest||before;if(before!==expected)return {ok:false,detail:'Acceptance test changed during the build; restore the original test.'};const started=Date.now(),r=spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:1024*1024,windowsHide:true});
  let after;try{after=digest(file);}catch{after=null;}const unchanged=after===expected,ok=r.status===0&&!r.error&&!r.signal&&unchanged;
  const redact=text=>Buffer.from(require('./worker-transport').redact(text,root)).subarray(-16000).toString('utf8').replace(/^\uFFFD/,''),stdout=redact(String(r.stdout||'')),stderr=redact(String(r.stderr||''));
  const report={schema:1,test:path.relative(root,file).replace(/\\/g,'/'),at:new Date().toISOString(),durationMs:Date.now()-started,expectedDigest:expected,observedDigest:after,unchanged,ok,exitCode:r.status,signal:r.signal||null,error:r.error?String(r.error.message):null,stdout,stderr,stdoutTruncated:Buffer.byteLength(String(r.stdout||''))>16000,stderrTruncated:Buffer.byteLength(String(r.stderr||''))>16000};const reportPath=capture(root,report);
  const detail=!unchanged?'Acceptance test changed while running.':ok?'Independent acceptance test passed':('[stdout]\n'+stdout.slice(-1000)+'\n[stderr]\n'+stderr.slice(-2000)+(r.error?'\n'+r.error.message:''));
  return {ok,detail:detail+'\nVerification report: '+reportPath,reportPath,exitCode:r.status,signal:r.signal||null,durationMs:report.durationMs};
 }catch(error){return {ok:false,detail:error.message};}
}
module.exports={locate,digest,run};
