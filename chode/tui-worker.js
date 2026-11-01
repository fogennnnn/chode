'use strict';
const engine=require('./chode');
const transport=require('./worker-transport');
const channel=transport.create((message,callback)=>process.send(message,callback),()=>process.connected);
let answer=null;
process.on('error',()=>{});
process.on('disconnect',()=>process.exit(0));
const heartbeat=setInterval(()=>channel.send({type:'heartbeat',memory:process.memoryUsage()}),5000);heartbeat.unref();
async function finish(message,result,code){try{transport.store(process.cwd(),message.runId,result);}catch{}clearInterval(heartbeat);await channel.finish(result);process.exit(code);}
function queued(message){const task=engine.loadPendingTasks().find(t=>t.id===message.retryId)||engine.queuePendingTask(message.prompt,'providers_exhausted',message.session);task.mode=message.mode||'execute';engine.savePendingTasks(engine.loadPendingTasks().map(t=>t.id===task.id?task:t));return {result:'No answer was returned. Your full prompt is saved in the queue.\nRetry with /retry '+task.id+'; use /status or /models to inspect your setup.',provider:'offline',completionStatus:'PENDING',degraded:true,queuedId:task.id};}
process.on('message',async message=>{
 if(message.type==='answer'){if(answer){answer(message.value);answer=null;}return;}
 if(message.type!=='run')return;
 try{
  if(message.acceptanceTest&&!message.acceptanceDigest){const check=require('./acceptance-check');message.acceptanceDigest=check.digest(check.locate(process.cwd(),message.acceptanceTest));}
  if(message.mode&&!['plan','execute','task'].includes(message.mode))throw Error('Invalid execution mode');
  let res;
  if(message.mode==='plan')res=await engine.cmdPlan([message.prompt,...(message.freeOnly?['--free']:[])]);
  else if(message.mode==='task')res=await engine.runSubagent(message.prompt,{label:'workspace',yolo:message.yolo===true,force:message.provider||null,freeOnly:!!message.freeOnly},engine.__testHooks.callAI||engine.callWithBestProvider,{onTool:event=>channel.send({type:'tool',event:transport.event(event)})});
  else res=await engine.cmdAI({prompt:message.prompt,yolo:message.yolo===true,session:message.session,force:message.provider||null,verbose:false,free:!!message.freeOnly,resumeContext:message.resumeContext,acceptanceTest:message.acceptanceTest,acceptanceDigest:message.acceptanceDigest,
   onTool:event=>channel.send({type:'tool',event:transport.event(event)}),
   onNarrate:text=>channel.send({type:'narrate',text:String(text||'').slice(0,240)}),
   onToken:text=>channel.token(text),
   onAsk:question=>new Promise(resolve=>{answer=resolve;channel.send({type:'ask',question});})
  });
  if(res?.apiTest||res?.toolHealth){await finish(message,res,res.completionStatus==='FAILED'?1:0);return;}
  if(!res||!res.result)res=queued(message);
  if(res.degraded||res.partial||['FAILED','UNVERIFIED','PENDING'].includes(res.completionStatus)){const recovery=queued(message);require('./recovery-context').record(engine,recovery.queuedId,res,{acceptanceTest:message.acceptanceTest,acceptanceDigest:res.acceptanceDigest||message.acceptanceDigest});res={...res,degraded:true,queuedId:recovery.queuedId,result:res.result+(res.result.includes('/retry '+recovery.queuedId)?'':'\n\nUnfinished task saved. Retry with /retry '+recovery.queuedId)};}
  if(res&&res.degraded&&message.freeOnly){res.retryAt=res.retryAt||(engine.providerRetryAt&&engine.providerRetryAt(true,message.provider));res.freeOnly=true;const tasks=engine.loadPendingTasks(),task=tasks.find(t=>t.id===res.queuedId);if(task){task.freeOnly=true;task.retryAt=res.retryAt;engine.savePendingTasks(tasks);}}
  await finish(message,res,0);
 }catch(error){try{const result=queued(message);result.result='This request could not finish. '+require('./terminal-ui').friendlyError(error)+'\nYour prompt is saved; retry with /retry '+result.queuedId;await finish(message,result,1);}catch(saveError){await channel.send({type:'error',message:'Could not save the failed prompt: '+saveError.message});process.exit(1);}}
});
