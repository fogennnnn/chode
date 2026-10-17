'use strict';
const engine=require('./chode');
let answer=null;
process.on('message',async message=>{
 if(message.type==='answer'){if(answer){answer(message.value);answer=null;}return;}
 if(message.type!=='run')return;
 try{
  const res=await engine.cmdAI({prompt:message.prompt,session:message.session,force:message.provider||null,verbose:false,
   onTool:event=>process.send({type:'tool',event}),
   onToken:text=>process.send({type:'token',text}),
   onAsk:question=>new Promise(resolve=>{answer=resolve;process.send({type:'ask',question});})
  });
  process.send({type:'result',result:res},()=>process.exit(0));
 }catch(error){process.send({type:'error',message:String(error.message||error)},()=>process.exit(1));}
});
