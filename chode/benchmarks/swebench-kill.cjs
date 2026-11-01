'use strict';
// Wall-clock kill with SIGKILL escalation: SIGTERM first, SIGKILL after graceMs,
// resolve even if the child survives both (caller records timedOut from its own timer).
function killWithEscalation(child,graceMs=5000){
  return new Promise(resolve=>{
    const escalate=setTimeout(()=>{
      try{child.kill('SIGKILL');}catch(e){}
      const done=setTimeout(resolve,graceMs);
      if(done.unref)done.unref();
    },graceMs);
    if(escalate.unref)escalate.unref();
    child.once('exit',()=>{clearTimeout(escalate);resolve();});
    try{child.kill();}catch(e){clearTimeout(escalate);resolve();}
  });
}
module.exports={killWithEscalation};
