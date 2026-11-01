'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
function retryAfter(value,now=Date.now()){if(value==null||String(value).trim()==='')return null;const raw=String(value).trim(),seconds=Number(raw);if(Number.isFinite(seconds))return seconds>=0?Math.ceil(seconds*1000):null;const date=Date.parse(raw);return Number.isFinite(date)?Math.max(0,date-now):null;}
function create(directory,clock=Date.now){
 const file=id=>path.join(directory,crypto.createHash('sha256').update(String(id)).digest('hex')+'.json');
 function read(id){try{const p=file(id);if(fs.statSync(p).size>10000)return null;const r=JSON.parse(fs.readFileSync(p,'utf8'));return r.id===id&&Number.isFinite(r.until)&&Number.isInteger(r.failures)?r:null;}catch{return null;}}
 function remaining(id){const r=read(id);return r?Math.max(0,r.until-clock()):0;}
 function record(id,hint){const old=read(id),failures=Math.min(10,(old&&old.failures||0)+1),delay=Number.isFinite(hint)&&hint>=0?hint:Math.min(900000,60000*2**(failures-1));const state={id,until:Math.max(old&&old.until||0,clock()+Math.max(1000,delay)),failures};fs.mkdirSync(directory,{recursive:true});const target=file(id),temp=target+'.'+process.pid+'.'+crypto.randomBytes(4).toString('hex')+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(state),{mode:0o600,flag:'wx'});fs.renameSync(temp,target);}finally{try{fs.unlinkSync(temp);}catch{}}return state;}
 function clear(id){try{fs.unlinkSync(file(id));}catch{}}
 return {read,remaining,record,clear,next:ids=>{const waits=ids.map(remaining);return waits.length?Math.min(...waits):0;}};
}
function free(provider){return !!provider&&(provider.category==='keyless'||provider.category==='free_local')&&!provider.requiresKey;}
module.exports={retryAfter,create,free};
