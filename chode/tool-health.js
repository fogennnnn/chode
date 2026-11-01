'use strict';
async function check(engine,name){
 const probes={
  forex:[['rates',()=>engine.toolForexAsync({base:'USD',symbols:'EUR,SEK'}),r=>Number.isFinite(r.rates?.EUR)&&r.rates.EUR>0]],
  geocode:[['lookup',()=>engine.toolGeocodeAsync({query:'Stockholm'}),r=>r.results?.length>0&&Number.isFinite(Number(r.results[0].lat))]],
  weather:[['forecast',()=>engine.toolWeatherAsync({lat:59.3293,lon:18.0686}),r=>Number.isFinite(r.current?.tempC)]],
  'dev-recon':[
   ['GitHub repository',()=>engine.toolDevReconAsync({action:'repo',repo:'k1LoW/runn'}),r=>r.repo==='k1LoW/runn'&&Number.isFinite(r.stars)],
   ['GitHub search',()=>engine.toolDevReconAsync({action:'search',query:'k1LoW/runn'}),r=>r.repos?.length>0],
   ['CDNJS',()=>engine.toolDevReconAsync({action:'cdnjs',query:'jquery'}),r=>r.libraries?.some(x=>x.latest)],
   ['release lifecycle',()=>engine.toolDevReconAsync({action:'eol',product:'nodejs'}),r=>!!r.latest]
  ]
 };
 if(name&&!engine.TOOLS[name])throw Error('Unknown tool: '+name);
 const names=name?[name]:Object.keys(probes),rows=[];
 for(const id of names){if(!probes[id]){rows.push({tool:id,state:'not-tested',detail:'Needs task-specific inputs or setup. Registered does not mean verified.'});continue;}
  const result=await Promise.all(probes[id].map(async([label,run,valid])=>{try{const r=await run();return {tool:id,probe:label,state:r.ok&&valid(r)?'passed':'failed',detail:r.ok?(valid(r)?'Expected live response received':'Response lacked required data'):String(r.error||'Request failed')};}catch(error){return {tool:id,probe:label,state:'failed',detail:error.message};}}));rows.push(...result);
 }
 return {ok:!rows.some(r=>r.state==='failed'),verified:rows.every(r=>r.state==='passed'),checkedAt:new Date().toISOString(),rows};
}
function result(report){return {toolHealth:true,modelCalls:0,tokens:0,provider:'tool-health',completionStatus:report.ok?'NOT_REQUIRED':'FAILED',result:'Live tool checks · '+report.checkedAt+'\n'+report.rows.map(r=>r.state.toUpperCase()+' · '+r.tool+(r.probe?' / '+r.probe:'')+' — '+r.detail).join('\n')+'\nOnly the listed probes were checked; other capabilities remain unverified.'};}
module.exports={check,result};
