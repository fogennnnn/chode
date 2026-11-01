'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const MAX_READ=512*1024;
function sessionName(value){if(!/^[a-zA-Z0-9_-]{1,64}$/.test(String(value||'')))throw new Error('Invalid session name');return value;}
function logRoot(root,session){return path.join(path.resolve(root),'.chode','workspace','logs',sessionName(session));}
function safeFile(root,file){
 const full=path.resolve(path.resolve(root),String(file||''));
 const rel=path.relative(path.resolve(root),full);
 if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw new Error('Log file is outside the workspace');
 if(!/^\.chode[\\/]workspace[\\/]logs[\\/][a-zA-Z0-9_-]{1,64}[\\/][a-zA-Z0-9._-]{1,120}\.log$/.test(rel))throw new Error('Invalid log path');
 return full;
}
function clean(value,limit){
 return String(value==null?'':value)
  .replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g,'')
  .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'')
  .replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g,'')
  .slice(0,limit||2000000);
}
function stamp(){return new Date().toISOString();}
function create(root,session,prompt){
 const dir=logRoot(root,session);
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const id=stamp().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex');
 const full=path.join(dir,id+'.log');
 const file=path.relative(path.resolve(root),full).replace(/\\/g,'/');
 fs.writeFileSync(full,'# chode prompt log\n# created: '+stamp()+'\n# prompt:\n'+clean(prompt,200000)+'\n\n',{encoding:'utf8',mode:0o600,flag:'wx'});
 return {id,file,full};
}
function append(turn,kind,label,detail){
 if(!turn||!turn.full)return;
 let text='\n['+stamp()+'] '+String(kind||'event');
 if(label)text+=' · '+clean(label,500).replace(/\s+/g,' ').trim();
 text+='\n';
 if(detail!=null&&String(detail)!=='')text+=clean(detail,2000000);
 if(!text.endsWith('\n'))text+='\n';
 try{fs.appendFileSync(turn.full,text,{encoding:'utf8',mode:0o600});}catch(_){}
}
function read(root,file,max){
 const full=safeFile(root,file);
 const link=fs.lstatSync(full);
 if(link.isSymbolicLink()||!link.isFile())throw new Error('Log is not a regular file');
 const limit=Math.max(4096,Math.min(MAX_READ,Number(max)||MAX_READ));
 const stat=fs.statSync(full);
 const start=Math.max(0,stat.size-limit);
 const fd=fs.openSync(full,'r');
 try{
  const buffer=Buffer.alloc(stat.size-start);
  fs.readSync(fd,buffer,0,buffer.length,start);
  const text=buffer.toString('utf8').replace(/^\uFFFD/,'');
  return {text,file,bytes:stat.size,truncated:start>0,shown:buffer.length};
 }finally{fs.closeSync(fd);}
}
module.exports={create,append,read,logRoot};
