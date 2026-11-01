'use strict';
const assert=require('assert/strict'),http=require('http'),path=require('path');
const engine=require(path.resolve(process.argv[2]||path.join(__dirname,'../chode')));
const native=require('../native-tools');
(async()=>{
 let closed=false;
 const server=http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/event-stream'});
  const frame=delta=>'data: '+JSON.stringify({choices:[{delta}]})+'\n\n';
  if(req.url!=='/active'){
   res.write(frame({tool_calls:[{index:0,function:{name:'write',arguments:'{"file":"unfinished.py",'}}]}));
   if(req.url==='/limit')res.write('data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n');
   res.end();return;
  }
  const args=JSON.stringify({file:'complete.py',content:'print(7)\n'}),frames=[{tool_calls:[{index:0,function:{name:'write',arguments:''}}]},...args.match(/.{1,9}/g).map(part=>({tool_calls:[{index:0,function:{arguments:part}}]}))];
  let index=0;const timer=setInterval(()=>{if(index<frames.length)res.write(frame(frames[index++]));else{clearInterval(timer);res.write('data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}\n\n');}},150);
  res.on('close',()=>{closed=true;clearInterval(timer);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,options={timeoutMs:500,nativeAllowed:['write'],onToken:()=>{throw Error('Native arguments should not be displayed as user text');}},endpoint={parse:data=>native.parse(data,['write'])};
 try{
  const result=await engine.tryStreamChat('fixture',base+'/active',{'Content-Type':'application/json'},'{"messages":[]}',options,Date.now(),endpoint);
  assert.equal(engine.parseToolCalls(result.result)[0].args.content,'print(7)\n');assert.equal(result.finishReason,'tool_calls');
  await assert.rejects(engine.tryStreamChat('fixture',base+'/partial',{},'{"messages":[]}',options,Date.now(),endpoint),error=>error.message==='stream_aborted'&&error.noFallback);
  const limited=await engine.tryStreamChat('fixture',base+'/limit',{},'{"messages":[]}',options,Date.now(),endpoint);assert.equal(limited.finishReason,'length');assert.equal(engine.parseToolCalls(limited.result).length,0);
  for(let i=0;i<20&&!closed;i++)await new Promise(resolve=>setTimeout(resolve,10));assert(closed);
  console.log('PASS native SSE: active fragmented arguments outlive idle window, finish without DONE, connection cancellation and partial/length calls never execute');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
