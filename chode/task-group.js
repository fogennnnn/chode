'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
function create(root,run,options={}){
 const tasks=new Map(),directory=path.join(root,'.chode','tasks');let spawned=0;
 function storage(){let at=path.resolve(root);for(const part of ['.chode','tasks']){at=path.join(at,part);try{if(fs.lstatSync(at).isSymbolicLink())throw Error('Linked task storage');}catch(e){if(e.code!=='ENOENT')throw e;}}return directory;}
 const bounded=text=>Buffer.from(String(text).replace(/[\x00-\x08\x0b-\x1f]/g,'')).subarray(0,6000).toString('utf8').replace(/\uFFFD$/,'');
 function publicResult(t){return {ok:t.status==='completed',id:t.id,label:t.label,status:t.status,joined:!!t.joined,result:bounded(t.value?.result||t.error||''),agent:t.value?.sessionId};}
 function save(t){storage();fs.mkdirSync(directory,{recursive:true});const file=path.join(directory,t.id+'.json'),temp=file+'.'+process.pid+'.tmp';const data=publicResult(t);if(options.redact)data.result=bounded(options.redact(data.result));try{fs.writeFileSync(temp,JSON.stringify(data),{flag:'wx',mode:0o600});fs.renameSync(temp,file);}finally{try{fs.unlinkSync(temp);}catch{}}}
 function load(id){if(!/^task_[a-f0-9]{32}$/.test(id||''))throw Error('Invalid task ID');storage();const file=path.join(directory,id+'.json');if(fs.lstatSync(file).isSymbolicLink()||fs.statSync(file).size>16000)throw Error('Invalid task record');const r=JSON.parse(fs.readFileSync(file,'utf8'));if(r.id!==id||!['completed','failed','running'].includes(r.status)||typeof r.result!=='string')throw Error('Invalid task record');return r;}
 function spawn(prompt,label='subagent'){
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>24000)throw Error('Supply a task prompt <=24KB');if(spawned>=6||[...tasks.values()].filter(t=>t.status==='running').length>=3)throw Error('Subagent limit: three active, six total per run');
  const t={id:'task_'+crypto.randomBytes(16).toString('hex'),label:String(label).slice(0,80),status:'running',joined:false};save(t);tasks.set(t.id,t);spawned++;
  t.promise=Promise.resolve().then(()=>run(prompt,t.label)).then(value=>{t.value=value;t.status=value?.result&&!value.partial&&!['FAILED','UNVERIFIED','PENDING','PARTIAL'].includes(value.completionStatus)?'completed':'failed';},error=>{t.status='failed';t.error=error.message;}).then(()=>{try{save(t);}catch(error){t.status='failed';t.error='Task result could not be persisted: '+error.message;}});
  return {ok:true,id:t.id,label:t.label,status:'running',pending:true,note:'Read-only subagent started. Join this ID before completing the parent task.'};
 }
 async function join(id){const t=tasks.get(id);if(t){await t.promise;const alreadyJoined=!!t.joined;t.joined=true;save(t);return {...publicResult(t),alreadyJoined,actions:t.value?.actions||{}};}const r=load(id);if(r.status==='running')return {ok:false,id,status:'unresolved',error:'Task belongs to another or interrupted run; its completion has not been recorded'};return r;}
 function status(id){if(id){const t=tasks.get(id);return t?publicResult(t):load(id);}return [...tasks.values()].map(publicResult);}
 function unjoined(){return [...tasks.values()].filter(t=>!t.joined).map(t=>t.id);}
 async function settle(){await Promise.allSettled([...tasks.values()].map(t=>t.promise));}
 return {spawn,join,status,unjoined,settle};
}
module.exports={create};
