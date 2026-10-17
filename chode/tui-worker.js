'use strict';
const engine=require('./chode');
let answer=null;
function queued(message){const task=engine.loadPendingTasks().find(t=>t.id===message.retryId)||engine.queuePendingTask(message.prompt,'providers_exhausted',message.session);return {result:'No answer was returned. Your full prompt is saved in the queue.\nRetry with /retry '+task.id+'; use /status or /models to inspect your setup.',provider:'offline',degraded:true,queuedId:task.id};}
process.on('message',async message=>{
 if(message.type==='answer'){if(answer){answer(message.value);answer=null;}return;}
 if(message.type!=='run')return;
 try{
  let res;
  if(message.mode==='plan')res=await engine.cmdPlan([message.prompt]);
  else if(message.mode==='task')res=await engine.runSubagent(message.prompt,{label:'workspace',force:message.provider||null},engine.__testHooks.callAI||engine.callWithBestProvider,{onTool:event=>process.send({type:'tool',event})});
  else res=await engine.cmdAI({prompt:message.prompt,session:message.session,force:message.provider||null,verbose:false,
   onTool:event=>process.send({type:'tool',event}),
   onToken:text=>process.send({type:'token',text}),
   onAsk:question=>new Promise(resolve=>{answer=resolve;process.send({type:'ask',question});})
  });
  if(!res||!res.result)res=queued(message);
  process.send({type:'result',result:res},()=>process.exit(0));
 }catch(error){try{const result=queued(message);result.result='This request could not finish. '+require('./terminal-ui').friendlyError(error)+'\nYour prompt is saved; retry with /retry '+result.queuedId;process.send({type:'result',result},()=>process.exit(1));}catch(saveError){process.send({type:'error',message:'Could not save the failed prompt: '+saveError.message},()=>process.exit(1));}}
});
