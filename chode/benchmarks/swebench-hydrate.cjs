'use strict';
// Hydrate an instances file with problem_statement text from the pinned
// HuggingFace datasets-server rows API. Run once per pinned revision;
// the runner then forwards spec.problem_statement to the agent.
const fs=require('fs'),path=require('path');
function option(name){const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];}
async function main(){
  const inArg=option('--instances'),outArg=option('--out'),revision=option('--revision'),dataset=option('--dataset');
  const endpoint=(option('--endpoint')||'https://datasets-server.huggingface.co').replace(/\/$/,'');
  if(!inArg||!outArg||!revision||!dataset)throw Error('Usage: node benchmarks/swebench-hydrate.cjs --instances <in.json> --out <out.json> --revision <sha> --dataset <id> [--endpoint <url>]');
  const file=JSON.parse(fs.readFileSync(path.resolve(inArg),'utf8'));
  const list=Array.isArray(file)?file:file.instances;
  const want=new Set(list.map(i=>i.instance_id));
  const found=new Map();
  let offset=0;
  for(;;){
    const url=endpoint+'/rows?'+new URLSearchParams({dataset,config:'default',split:'test',offset:String(offset),length:'100',revision});
    const res=await fetch(url);
    if(!res.ok)throw Error('rows fetch failed: '+res.status+' '+url);
    const body=await res.json();
    for(const r of body.rows||[])if(r.row&&want.has(r.row.instance_id)&&r.row.problem_statement)found.set(r.row.instance_id,r.row.problem_statement);
    if(found.size>=want.size||!(body.rows||[]).length)break;
    offset+=100;
  }
  const missing=list.filter(i=>!found.has(i.instance_id)).map(i=>i.instance_id);
  if(missing.length)throw Error('problem_statement missing for '+missing.length+' instances: '+missing.slice(0,5).join(','));
  const enriched=list.map(i=>({...i,problem_statement:found.get(i.instance_id)}));
  const out=Array.isArray(file)?enriched:{...file,count:enriched.length,instances:enriched};
  fs.writeFileSync(path.resolve(outArg),JSON.stringify(out,null,2)+'\n');
  console.log('HYDRATED '+enriched.length+' problem statements at revision '+revision);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
