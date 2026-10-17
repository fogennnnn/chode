'use strict';
const fs=require('fs'),path=require('path');
function selectTarget(prompt,root=process.cwd()){
 const text=String(prompt||'');if(!/reverse[ -]?engineer|\b(?:analy[sz]e|inspect|decompile|disassemble|binary|executable)\b|what.{0,30}\bdoes\b|how.{0,30}\bworks?\b/i.test(text))return null;
 if(/\b(?:do not|don't|skip|avoid)\s+(?:\w+\s+){0,3}(?:inspect|analy[sz]e|decompile|disassemble|reverse)/i.test(text))return null;
 const candidates=[];const rx=/["`]([^"`\r\n]+\.(?:exe|dll|elf|so|dylib))["`]|(?:^|\s)@?([^\s"`]+\.(?:exe|dll|elf|so|dylib))(?=$|[\s,;?!])/gi;let m;
 while((m=rx.exec(text))){const candidate=m[1]||m[2];if(/^[a-z]+:\/\//i.test(candidate)||candidate.startsWith('\\\\'))continue;const full=path.resolve(root,candidate);try{if(fs.statSync(full).isFile()&&!candidates.includes(full))candidates.push(full);}catch(_){}}
 return candidates.length===1?candidates[0]:null;
}
async function prepare(prompt,options={}){
 if(options.disabled)return null;const target=selectTarget(prompt,options.root);if(!target)return null;
 const call={tool:'rea',args:{action:'analyze',path:target,timeoutMs:60000}};
 const emit=event=>{try{if(options.onTool)options.onTool(event);}catch(_){}};
 emit({phase:'start',call});let result;try{result=await options.analyze(call.args);}catch(_){result={ok:false};}emit({phase:'done',call,result});
 if(!result||!result.ok)return {target,ok:false,context:'[LOCAL BINARY INSPECTION]\nAutomatic local analysis was unavailable. Do not claim this executable was inspected or its behavior recovered. Suggest chode tool rea doctor for setup diagnostics.\n[END LOCAL BINARY INSPECTION]'};
 const ev=result.evidence||{};const facts={};for(const k of ['digest','format','arch','segments','procedures','strings'])if(ev[k]!==undefined)facts[k]=ev[k];
 return {target,ok:true,evidence:facts,context:'[LOCAL BINARY INSPECTION — tool-observed metadata, not executable behavior]\n'+JSON.stringify(facts)+'\nStatic inventory does not recover business logic. Do not invent functions, behavior or decompilation. Use the rea tool for further supported inspection; original executable was not run.\n[END LOCAL BINARY INSPECTION]'};
}
module.exports={selectTarget,prepare};
