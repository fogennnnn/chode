'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
function open(root,request,session,digest=''){
 const key=crypto.createHash('sha256').update(JSON.stringify([request,session||'default',digest])).digest('hex'),directory=path.join(root,'.chode','build-progress'),file=path.join(directory,key+'.json');
 function read(){try{if(fs.statSync(file).size>1000000)return null;const r=JSON.parse(fs.readFileSync(file,'utf8'));return r.version===1&&r.request===request&&r.session===(session||'default')&&r.digest===digest&&r.actions&&typeof r.actions==='object'&&['writes','edits','execs'].every(k=>Array.isArray(r.actions[k])&&r.actions[k].every(x=>typeof x==='string'))&&Array.isArray(r.planSteps)&&r.planSteps.every(s=>s&&typeof s==='object'&&(!s.files||Array.isArray(s.files))&&(!s.overwrites||Array.isArray(s.overwrites)))?r:null;}catch{return null;}}
 function save(state){fs.mkdirSync(directory,{recursive:true});const data=JSON.stringify({version:1,request,session:session||'default',digest,updatedAt:Date.now(),...state});if(Buffer.byteLength(data)>1000000)throw Error('Build checkpoint exceeds 1 MB');const temp=file+'.'+process.pid+'.'+crypto.randomBytes(4).toString('hex')+'.tmp';try{fs.writeFileSync(temp,data,{flag:'wx',mode:0o600});fs.renameSync(temp,file);}finally{try{fs.unlinkSync(temp);}catch{}}}
 function clear(){try{fs.unlinkSync(file);}catch{}}
 return {read,save,clear,file};
}
module.exports={open};
