'use strict';
async function run({invoke,budget,toolCap,toolBudget,deadline,now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),onWait=()=>{}}){
 let result,totalTools=0,resumes=0;
 while(now()<deadline&&budget.calls<budget.limit&&totalTools<toolCap){
  const before=toolBudget?.calls;
  result=await invoke(toolCap-totalTools);
  const tools=toolBudget?toolBudget.calls-before:result?.toolCalls||0;
  if(!Number.isSafeInteger(tools)||tools<0||tools>toolCap-totalTools)throw Error('Invalid continuation tool accounting');
  totalTools+=tools;
  const retryAt=result?.retryAt||result?.res?.retryAt;
  if(result?.completionStatus==='VERIFIED'||!result?.partial||!Number.isFinite(retryAt)||retryAt<=now()||retryAt>=deadline||budget.calls>=budget.limit||totalTools>=toolCap||resumes>=30)break;
  onWait({retryAt,remainingMs:deadline-now(),modelCalls:budget.calls,totalTools});
  while(now()<retryAt&&now()<deadline)await sleep(Math.min(10000,retryAt-now(),deadline-now()));
  resumes++;
 }
 return {result,totalTools,resumes};
}
module.exports={run};
