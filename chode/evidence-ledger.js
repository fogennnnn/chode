'use strict';
const crypto=require('crypto');
function record(actions,call,result){
 if(!result||!result.ok||!['read','webfetch','github'].includes(call.tool))return null;
 const args=call.args||{};
 const content=String(result.content||result.text||'');
 if(!content||result.alreadyInspected)return null;
 const locator=String(result.url||args.file||args.url||args.repo||'');
 const digest=crypto.createHash('sha256').update(content).digest('hex');
 const records=actions.sources||(actions.sources=[]);
 let source=records.find(x=>x.locator===locator&&x.sha256===digest);
 if(!source){const id='S'+crypto.createHash('sha256').update(locator+'\0'+digest).digest('hex').slice(0,12);source={id,kind:call.tool==='read'?'file':'web',locator,sha256:digest,observedAt:new Date().toISOString(),excerpt:content.slice(0,1600)};if(records.length>=60)return null;records.push(source);}
 result.source={id:source.id,locator:source.locator,sha256:source.sha256,observedAt:source.observedAt};
 return source;
}
function citationWarnings(text,sources){
 const known=new Set((sources||[]).map(s=>normalize(s.locator)));
 const warnings=[];const rx=/\[[^\]]+\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g;let match;
 while((match=rx.exec(String(text||'')))){
  const target=match[1];if(!/^https?:\/\//i.test(target))continue;
  if(!known.has(normalize(target))&&!warnings.some(w=>w.url===target))warnings.push({url:target,reason:'This cited URL was not retrieved by a recorded tool call.'});
 }
 return warnings;
}
function normalize(locator){try{const u=new URL(locator);u.hash='';return u.toString();}catch(_){return String(locator).replace(/\\/g,'/');}}
module.exports={record,citationWarnings};
