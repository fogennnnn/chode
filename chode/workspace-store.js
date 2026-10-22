'use strict';
const fs=require('fs');const path=require('path');
function location(root,session){if(!/^[a-zA-Z0-9_-]{1,64}$/.test(session))throw new Error('Invalid session name');return path.join(root,'.chode','workspace',session+'.json');}
function fields(x){const out={role:x.role,text:String(x.text).slice(0,16000)};for(const k of ['turn','log','logComplete'])if(x[k]!==undefined)out[k]=x[k];return out;}
function load(root,session){try{const p=location(root,session);if(fs.statSync(p).size>2*1024*1024)return [];const data=JSON.parse(fs.readFileSync(p,'utf8'));return Array.isArray(data.messages)?data.messages.filter(x=>x&&['user','assistant','notice'].includes(x.role)&&typeof x.text==='string').slice(-100).map(fields):[];}catch(_){return [];}}
function save(root,session,messages){const p=location(root,session);fs.mkdirSync(path.dirname(p),{recursive:true});const temp=p+'.'+process.pid+'.tmp';try{fs.writeFileSync(temp,JSON.stringify({schema:1,session,messages:messages.slice(-100).map(fields)}),{encoding:'utf8',mode:0o600});fs.renameSync(temp,p);}finally{try{fs.unlinkSync(temp);}catch(_){}}}
module.exports={load,save};
