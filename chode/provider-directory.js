'use strict';
const data=require('./provider-directory.json');
function list(query=''){const q=String(query).toLowerCase();return data.profiles.filter(p=>!q||(p.id+' '+p.name+' '+p.models.map(m=>m.id).join(' ')).toLowerCase().includes(q));}
function find(id){const q=String(id||'').toLowerCase();return data.profiles.find(p=>p.id===q||p.name.toLowerCase()===q);}
function connection(p){return {name:p.name,baseUrl:p.baseUrl,auth:p.local?'none':'bearer',local:!!p.local,keyEnv:p.env,model:p.models[0]?.id||'',directoryId:p.id};}
function models(p){return p.models.map(m=>({id:m.id,zeroTokenPrice:m.zeroTokenPrice,local:false,tools:m.tools,structured:false,context:m.context}));}
function summary(query,providers={}){const q=String(query||'').toLowerCase(),built=Object.entries(providers).filter(([id,p])=>!q||(id+' '+p.name).toLowerCase().includes(q)).map(([id,p])=>({id,name:p.name,builtIn:true,local:p.category==='free_local',listedZeroPrice:false,verification:'Configured/built-in route; test account and model access',doc:p.signupUrl}));return built.concat(list(query).filter(p=>!providers[p.id]).map(p=>({id:p.id,name:p.name,baseUrl:p.baseUrl,keyEnv:p.env,models:p.models.length,listedZeroPrice:p.models.some(m=>m.zeroTokenPrice),local:!!p.local,verification:p.verification,doc:p.doc})));}
module.exports={list,find,connection,models,summary,metadata:()=>({source:data.source,retrievedAt:data.retrievedAt,sha256:data.sourceSha256})};
