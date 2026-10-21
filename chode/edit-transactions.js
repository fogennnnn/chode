'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const MAX_FILE=200*1024,MAX_TOTAL=1024*1024,KEEP=50;
function unified(file,before,after){
 if(before===after)return '';
 if(before===null&&after==='')return 'diff --git '+JSON.stringify('a/'+file)+' '+JSON.stringify('b/'+file)+'\nnew file mode 100600\n';
 const lines=s=>s==null||s===''?[]:s.split('\n').slice(0,s.endsWith('\n')?-1:undefined);
 const a=lines(before),b=lines(after);let pre=0,tail=0;
 while(pre<a.length&&pre<b.length&&a[pre]===b[pre])pre++;
 if(pre===a.length&&pre===b.length&&pre)pre--;
 const newlineChanged=!!before?.endsWith('\n')!==!!after?.endsWith('\n');
 while(!newlineChanged&&tail<a.length-pre&&tail<b.length-pre&&a[a.length-1-tail]===b[b.length-1-tail])tail++;
 const start=Math.max(0,pre-3),aEnd=Math.min(a.length,a.length-tail+3),bEnd=Math.min(b.length,b.length-tail+3),out=[];
 const label=(prefix,exists)=>exists?JSON.stringify(prefix+'/'+file):'/dev/null';
 out.push('--- '+label('a',before!==null),'+++ '+label('b',after!==null),'@@ -'+(aEnd-start?start+1:start)+','+(aEnd-start)+' +'+(bEnd-start?start+1:start)+','+(bEnd-start)+' @@');
 const emit=(prefix,line,index,arr,raw)=>{out.push(prefix+line);if(index===arr.length-1&&raw&&!raw.endsWith('\n'))out.push('\\ No newline at end of file');};
 for(let i=start;i<pre;i++)emit(' ',a[i],i,a,before);
 for(let i=pre;i<a.length-tail;i++)emit('-',a[i],i,a,before);
 for(let i=pre;i<b.length-tail;i++)emit('+',b[i],i,b,after);
 for(let i=0;i<Math.min(3,tail);i++)emit(' ',a[a.length-tail+i],a.length-tail+i,a,before);
 return out.join('\n')+'\n';
}
function create(root,options={}){
 const io=options.fs||fs,base=io.realpathSync(root),directory=path.join(base,'.chode','changes');
 function target(file,state=false){
  if(typeof file!=='string'||!file||/[\x00-\x1f]/.test(file)||path.isAbsolute(file))throw Error('Expected a relative workspace file');
  const full=path.resolve(base,file),rel=path.relative(base,full),parts=rel.split(path.sep);
  if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel)||!rel||parts.some(p=>p.toLowerCase()==='.git'||(!state&&p.toLowerCase()==='.chode')))throw Error('Denied workspace or harness-state path');
  let at=base;for(const part of parts){at=path.join(at,part);try{if(io.lstatSync(at).isSymbolicLink())throw Error('Symbolic links are not editable');}catch(error){if(error.code!=='ENOENT')throw error;}}
  if(!state&&options.allow&&options.allow(rel)===false)throw Error('Denied protected file');
  return {full,file:rel.replace(/\\/g,'/')};
 }
 function read(file){const t=target(file);try{const stat=io.statSync(t.full);if(!stat.isFile()||stat.size>MAX_FILE||stat.nlink>1)throw Error('Expected an unlinked text file <=200KB');const data=io.readFileSync(t.full);if(data.includes(0))throw Error('Binary files are not editable');const content=data.toString('utf8');if(!Buffer.from(content).equals(data))throw Error('Invalid UTF-8 file');return {file:t.file,before:content,mode:stat.mode&0o777};}catch(error){if(error.code==='ENOENT')return {file:t.file,before:null,mode:0o600};throw error;}}
 function atomic(full,content,mode=0o600){
  io.mkdirSync(path.dirname(full),{recursive:true});const temp=full+'.chode-'+crypto.randomBytes(8).toString('hex')+'.tmp';let fd;
  try{fd=io.openSync(temp,'wx',mode);io.fchmodSync(fd,mode);io.writeFileSync(fd,content);io.fsyncSync(fd);io.closeSync(fd);fd=null;io.renameSync(temp,full);}finally{if(fd!=null)io.closeSync(fd);try{io.unlinkSync(temp);}catch{}}
 }
 function save(record){target('.chode/changes',true);atomic(path.join(directory,record.id+'.json'),JSON.stringify(record));}
 function records(){target('.chode/changes',true);let names;try{names=io.readdirSync(directory);}catch(e){if(e.code==='ENOENT')return [];throw e;}return names.filter(n=>/^change_[a-f0-9]{32}\.json$/.test(n)).map(n=>{
  const full=path.join(directory,n);if(io.lstatSync(full).isSymbolicLink()||io.statSync(full).size>5*MAX_TOTAL)throw Error('Invalid edit journal');const r=JSON.parse(io.readFileSync(full,'utf8'));
  if(r.id+'.json'!==n||!Number.isSafeInteger(r.seq)||!Array.isArray(r.changes)||r.changes.length>20)throw Error('Invalid edit journal');
  for(const c of r.changes){target(c.file);if(![c.before,c.after].every(x=>x===null||typeof x==='string'&&Buffer.byteLength(x)<=MAX_FILE))throw Error('Invalid journal content');}
  return r;
 }).sort((a,b)=>b.seq-a.seq);}
 function current(change){return read(change.file).before;}
 function write(change,value){const t=target(change.file);if(value===null){try{io.unlinkSync(t.full);}catch(e){if(e.code!=='ENOENT')throw e;}}else atomic(t.full,value,change.mode);}
 function restore(record){for(const c of record.changes){const now=current(c);if(now!==c.before&&now!==c.after)throw Error('Recovery conflict: '+c.file);}for(const c of record.changes)if(current(c)!==c.before)write(c,c.before);}
 function locked(fn){
  target('.chode/changes',true);io.mkdirSync(directory,{recursive:true});const lock=path.join(directory,'lock');let fd;
  try{fd=io.openSync(lock,'wx',0o600);}catch(error){if(error.code!=='EEXIST')throw error;let owner;try{owner=JSON.parse(io.readFileSync(lock,'utf8'));process.kill(owner.pid,0);}catch(e){if(e.code==='ESRCH'){io.unlinkSync(lock);return locked(fn);}throw Error('Edit history is locked; inspect .chode/changes/lock before recovery');}throw Error('Another edit transaction is active');}
  try{io.writeFileSync(fd,JSON.stringify({pid:process.pid}));io.closeSync(fd);fd=null;
   for(const record of records())if(['applying','undoing'].includes(record.status)){restore(record);record.status=record.status==='undoing'?'undone':'rolled-back';save(record);}
   return fn();
  }finally{if(fd!=null)io.closeSync(fd);io.unlinkSync(lock);}
 }
 function prepare(edits,compile){
  if(!Array.isArray(edits)||!edits.length||edits.length>20)throw Error('Supply 1–20 edits');const staged=new Map();
  for(const edit of edits){if(!edit||typeof edit!=='object')throw Error('Invalid edit');const t=target(edit.file),key=process.platform==='win32'?t.full.toLowerCase():t.full;let c=staged.get(key);if(!c){c={...read(t.file)};c.after=c.before;staged.set(key,c);}
   const result=compile(edit,c.after);if(!result||!result.ok){const error=Error(result?.error||'Edit could not be prepared');if(result?.recovery){error.recovery=result.recovery;error.file=t.file;}throw error;}if(typeof result.after!=='string'||Buffer.byteLength(result.after)>MAX_FILE||result.after.includes('\0'))throw Error('Expected UTF-8 text <=200KB');c.after=result.after;
  }
  const changes=[...staged.values()].filter(c=>c.before!==c.after);if(changes.reduce((n,c)=>n+Buffer.byteLength(c.before||'')+Buffer.byteLength(c.after||''),0)>MAX_TOTAL)throw Error('Batch exceeds 1MB journal limit');return changes;
 }
 function preview(changes){const diff=changes.map(c=>unified(c.file,c.before,c.after)).join('');return {ok:true,files:changes.map(c=>c.file),diff,truncated:false};}
 function apply(changes,label='edit'){
  return locked(()=>{
   if(!changes.length)return {ok:true,files:[],unchanged:true,diff:''};
   for(const c of changes)if(current(c)!==c.before)throw Error('File changed since preview: '+c.file);
   const all=records(),record={id:'change_'+crypto.randomBytes(16).toString('hex'),seq:(all[0]?.seq||0)+1,at:new Date().toISOString(),label:String(label).slice(0,120),status:'applying',changes};save(record);
   try{for(const c of changes){if(current(c)!==c.before)throw Error('Concurrent file change: '+c.file);write(c,c.after);}record.status='applied';save(record);}
   catch(error){try{restore(record);record.status='rolled-back';save(record);}catch(recovery){throw Error(error.message+'; '+recovery.message+'; recovery required for '+record.id);}throw error;}
   for(const old of records().slice(KEEP))try{io.unlinkSync(path.join(directory,old.id+'.json'));}catch{}
   return {...preview(changes),id:record.id};
  });
 }
 function undo(id){return locked(()=>{const record=records().find(r=>r.status==='applied');if(!record)throw Error('Nothing to undo');if(id&&id!==record.id)throw Error('Undo the latest applied change first');for(const c of record.changes)if(current(c)!==c.after)throw Error('Undo conflict: file changed after edit: '+c.file);record.status='undoing';save(record);restore(record);record.status='undone';save(record);return {ok:true,id:record.id,files:record.changes.map(c=>c.file),diff:record.changes.map(c=>unified(c.file,c.after,c.before)).join('')};});}
 return {prepare,preview,apply,undo,history:()=>records().map(({id,seq,at,label,status,changes})=>({id,seq,at,label,status,files:changes.map(c=>c.file)})),read};
}
module.exports={create,unified};
