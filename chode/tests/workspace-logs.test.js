'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const view=require('../workspace-view');
const store=require('../workspace-store');
const logs=require('../workspace-log');
const {mouseEvents,launch}=require('../workspace-tui');
const {PassThrough}=require('stream');

async function main(){
const root=fs.mkdtempSync(path.join(os.tmpdir(),'chode-workspace-log-'));
try{
 const turn=logs.create(root,'default','Fix the visuals\nand buttons');
 assert.match(turn.file,/^\.chode\/workspace\/logs\/default\/.+\.log$/);
 assert.ok(fs.existsSync(path.join(root,turn.file)));
 if(process.platform!=='win32')assert.equal(fs.statSync(path.join(root,turn.file)).mode&0o777,0o600);
 logs.append(turn,'tool','Read script.js','line one\nline two');
 logs.append(turn,'stdout','', 'stdout text\u001b[31m red\u001b[0m');
 logs.append(turn,'result','Verified','The full final answer.\nSecond line.');
 const read=logs.read(root,turn.file);
 assert.match(read.text,/Fix the visuals/);
 assert.match(read.text,/Read script\.js/);
 assert.match(read.text,/The full final answer/);
 assert.ok(!read.text.includes('\u001b['),'terminal controls are removed from saved logs');
 assert.equal(read.truncated,false);
 for(let i=0;i<200;i++)logs.append(turn,'stdout','', 'x'.repeat(80));
 const tail=logs.read(root,turn.file,4096);
 assert.equal(tail.truncated,true);
 assert.ok(tail.text.length<=4096);
 assert.throws(()=>logs.read(root,'../outside.log'),/outside|Invalid log path/);
 assert.throws(()=>logs.create(root,'../bad','x'),/Invalid session name/);

 const state=view.createState({workspace:'demo'});
 view.addMessage(state,'user','Fix visuals',{turn:turn.id,log:turn.file,logComplete:true});
 assert.equal(state.messages[0].turn,turn.id);
 const frame=view.frame(state,80,24);
 assert.ok(frame.hits.length>0,'the visible user prompt is clickable');
 assert.equal(frame.hits[0].turn,turn.id);

 state.logView={turn:turn.id,title:'Fix visuals',text:read.text,file:turn.file};
 const logFrame=view.frame(state,80,24);
 assert.equal(logFrame.lines.length,24);
 assert.ok(logFrame.lines.join('\n').includes('Prompt log'));
 assert.ok(logFrame.lines.join('\n').includes('The full final answer'));
 assert.equal(logFrame.hits.length,0);
 view.key(state,'',{name:'escape'});
 assert.equal(state.logView,null);
 view.key(state,'',{name:'up',shift:true});
 assert.equal(state.scroll,3);
 view.key(state,'',{name:'down',shift:true});
 assert.equal(state.scroll,0);

 store.save(root,'default',state.messages);
 const loaded=store.load(root,'default');
 assert.equal(loaded[0].turn,turn.id);
 assert.equal(loaded[0].log,turn.file);
 assert.equal(loaded[0].logComplete,true);

 const wheel=mouseEvents('\x1b[<64;10;5M\x1b[<65;10;5M');
 assert.deepEqual(wheel.map(e=>e.wheel),[1,-1]);
 const click=mouseEvents('\x1b[<0;12;7M');
 assert.equal(click[0].button,0);
 assert.equal(click[0].press,true);
 assert.equal(click[0].y,7);
 const clicks=view.frame(state,80,24).hits[0];
 assert.ok(clicks&&clicks.row>0);
 const original=process.cwd();let app=null;
 try{
  process.chdir(root);
  store.save(root,'default',[{role:'user',text:'Fix visuals',turn:turn.id,log:turn.file,logComplete:true}]);
  const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};
  const output=new PassThrough();output.isTTY=true;output.columns=80;output.rows=24;output.on('data',()=>{});
  app=launch({input,output,workerPath:path.join(root,'never.cjs')});
  input.write('\x1b[<'+(0)+';5;'+(clicks.row+1)+'M');
  await new Promise(r=>setImmediate(r));
  assert.ok(app.state.logView,'clicking a finished prompt opens its saved log');
  assert.match(app.state.logView.text,/The full final answer/);
  input.write('\x1b[<64;5;5M');await new Promise(r=>setImmediate(r));
  assert.ok(app.state.scroll>0,'mouse wheel scrolls the log view');
  input.emit('keypress','',{name:'escape'});
  assert.equal(app.state.logView,null);
 }finally{if(app)app.close();process.chdir(original);}
 console.log('✓ workspace logs: per-prompt output is saved, persisted, expandable by prompt click, scrollable, and mouse events are parsed');
}finally{fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(function(error){console.error(error&&error.stack||error);process.exitCode=1;});
