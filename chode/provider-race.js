'use strict';
function combine(signals) {
  const control=new AbortController(), active=signals.filter(Boolean), listeners=[];
  const abort=signal=>{if(!control.signal.aborted)control.abort(signal.reason);for(const [source,listener]of listeners)source.removeEventListener('abort',listener);};
  for(const signal of active){if(signal.aborted){abort(signal);break;}const listener=()=>abort(signal);listeners.push([signal,listener]);signal.addEventListener('abort',listener,{once:true});}
  return control.signal;
}
function first(ids, invoke) {
  if(!ids.length)return Promise.resolve([]);
  const controls=ids.map(()=>new AbortController()),results=[];
  let completed=0,done=false;
  return new Promise(resolve=>{
    ids.forEach((id,index)=>{
      Promise.resolve().then(()=>invoke(id,controls[index].signal)).catch(error=>({pid:id,error:error?.message||String(error),retryAfterMs:error?.retryAfterMs}))
        .then(result=>{
          if(done)return;
          completed++;results.push(result);
          if(typeof result?.result==='string'&&result.result.trim()){
            done=true;controls.forEach((control,i)=>{if(i!==index)control.abort();});resolve(results.slice());
          }else if(completed===ids.length){done=true;resolve(results.slice());}
        });
    });
  });
}
module.exports={first,combine};
