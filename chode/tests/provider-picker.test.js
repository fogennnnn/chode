'use strict';
const assert=require('assert/strict');
const {PassThrough}=require('stream');
const picker=require('../provider-picker');
const catalog=require('../provider-catalog');

function entries(){
  return [
    {id:'groq',name:'Groq',tier:'free',requiresKey:true,keyEnv:'GROQ_API_KEY',configured:false,hasKey:false,modelCount:1,variants:[{label:'API key (GROQ_API_KEY)',tier:'free',requiresKey:true,keyEnv:'GROQ_API_KEY'}]},
    {id:'ovh',name:'OVHcloud (Keyless)',tier:'keyless',requiresKey:false,hasKey:false,modelCount:2,variants:[{label:'No key (free)',tier:'keyless',requiresKey:false},{label:'API key (OVHCLOUD_API_KEY)',tier:'paid',requiresKey:true,keyEnv:'OVHCLOUD_API_KEY'}]},
    {id:'llm7',name:'LLM7 (Keyless)',tier:'keyless',requiresKey:false,hasKey:false,modelCount:4,variants:[{label:'No key (free)',tier:'keyless',requiresKey:false}]},
    {id:'ollama',name:'Ollama (Local)',tier:'local',requiresKey:false,hasKey:false,localUp:true,modelCount:1,variants:[{label:'Local (no key)',tier:'local',requiresKey:false}]},
    {id:'anthropic',name:'Claude',tier:'paid',requiresKey:true,keyEnv:'ANTHROPIC_API_KEY',configured:false,hasKey:false,modelCount:1,variants:[{label:'API key (ANTHROPIC_API_KEY)',tier:'paid',requiresKey:true,keyEnv:'ANTHROPIC_API_KEY'}]}
  ];
}
const key=(name,extra={})=>Object.assign({name},extra);

function main(){
  // ---- render: header + rows + cursor highlight ----
  let s=picker.createState({entries:entries()});
  let r=picker.render(s,80,12);
  assert(r.lines[0].includes('connect a provider'));
  assert(r.shown===5,'shows all 5');
  assert(r.selected.id==='groq','first entry selected by default');
  const rendered=r.lines.join('\n');
  assert(rendered.includes('groq')&&rendered.includes('anthropic'),'lists ids');
  assert(rendered.includes('5 of 5'),'count line');

  // ---- movement ----
  s=picker.createState({entries:entries()});
  picker.handleKey(s,key('down'),'');
  assert.equal(picker.render(s,80,12).selected.id,'ovh','down moves to ovh');
  picker.handleKey(s,key('up'),'');
  assert.equal(picker.render(s,80,12).selected.id,'groq','up moves back');
  picker.handleKey(s,key('down'),'');picker.handleKey(s,key('down'),'');picker.handleKey(s,key('down'),'');
  assert.equal(picker.render(s,80,12).selected.id,'ollama');
  picker.handleKey(s,key('down'),'');
  assert.equal(picker.render(s,80,12).selected.id,'anthropic');
  picker.handleKey(s,key('down'),'');
  assert.equal(picker.render(s,80,12).selected.id,'anthropic','clamped at end');

  // ---- type-to-search ----
  s=picker.createState({entries:entries()});
  for(const ch of 'ovh')picker.handleKey(s,key(ch),ch);
  assert.equal(picker.render(s,80,12).shown,1,'search narrows to 1');
  assert.equal(picker.render(s,80,12).selected.id,'ovh');
  // search by model id
  s=picker.createState({entries:catalog.all(realEngine(),{env:{}})});
  for(const ch of 'gpt-oss')picker.handleKey(s,key(ch),ch);
  assert(s.results.some(e=>e.id==='ovh'),'model-id search finds ovh');

  // ---- backspace ----
  s=picker.createState({entries:entries()});
  for(const ch of 'groq')picker.handleKey(s,key(ch),ch);
  assert.equal(picker.render(s,80,12).shown,1);
  picker.handleKey(s,key('backspace'),String.fromCharCode(127));
  assert.equal(picker.render(s,80,12).shown,1,'"gro" still matches only groq');
  picker.handleKey(s,key('backspace'),String.fromCharCode(127));
  picker.handleKey(s,key('backspace'),String.fromCharCode(127));
  picker.handleKey(s,key('backspace'),String.fromCharCode(127));
  assert.equal(picker.render(s,80,12).shown,5,'cleared -> all 5');

  // ---- filter cycling ----
  s=picker.createState({entries:entries()});
  picker.handleKey(s,key('f'),'f');assert.equal(s.filter,'free');
  assert.equal(picker.render(s,80,12).shown,1,'free filter -> groq');
  picker.handleKey(s,key('f'),'f');assert.equal(s.filter,'keyless');
  assert.equal(picker.render(s,80,12).shown,2,'keyless filter -> ovh,llm7');
  picker.handleKey(s,key('f'),'f');assert.equal(s.filter,'local');
  assert.equal(picker.render(s,80,12).shown,1,'local filter -> ollama');

  // ---- Enter / Esc ----
  s=picker.createState({entries:entries()});
  picker.handleKey(s,key('down'),'');
  assert.equal(picker.handleKey(s,key('return'),'\r'),'result');
  assert.equal(s.done.id,'ovh');
  s=picker.createState({entries:entries()});
  assert.equal(picker.handleKey(s,key('escape'),'\x1b'),'cancel');

  // ---- scroll keeps cursor visible (small window) ----
  s=picker.createState({entries:entries()});s.visible=3;
  for(let i=0;i<4;i++)picker.handleKey(s,key('down'),'');
  const rs=picker.render(s,80,8);
  assert(rs.selected.id==='anthropic');
  assert(rs.cursorRow<rs.lines.length,'cursor within window');

  // ---- integration: real select() over a TTY PassThrough ----
  (async()=>{
    const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};
    const output=new PassThrough();output.isTTY=true;output.columns=80;output.rows=12;let screen='';output.on('data',c=>screen+=c);
    const selPromise=picker.select(input,output,{entries:entries()});
    await pause(40);
    assert(screen.includes('groq'),'picker painted the list');
    input.emit('keypress','\x1b[B',key('down'));await pause(20);   // down
    input.emit('keypress','\r',key('return'));await pause(20);      // enter
    const sel=await selPromise;
    assert(sel,'returned a selection');
    assert.equal(sel.id,'ovh');
    assert.equal(sel.variantIndex,0);
    assert.equal(sel.entry.id,'ovh');
    // cancel path
    const input2=new PassThrough();input2.isTTY=true;input2.setRawMode=()=>{};
    const output2=new PassThrough();output2.isTTY=true;output2.columns=80;output2.rows=12;
    const cancelPromise=picker.select(input2,output2,{entries:entries()});
    await pause(40);
    input2.emit('keypress','\x1b',key('escape'));await pause(20);
    assert.equal(await cancelPromise,null,'escape cancels');
    // non-TTY fallback
    const fallback=picker.select(new PassThrough(),new PassThrough(),{entries:entries(),ask:async q=>{assert(q.options.includes('ovh'));return 'ovh';}});
    assert.equal((await fallback).id,'ovh');
    console.log('PASS provider-picker: render, move, search, filter, scroll, enter/esc, TTY select + cancel + fallback');
  })().catch(e=>{console.error(e);process.exitCode=1;});
}
function realEngine(){
  const providers={
    ovh:{name:'OVHcloud (Keyless)',category:'keyless',requiresKey:null,freeTier:'No key',endpoints:[{url:'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions'}]}
  };
  return {PROVIDERS:providers,loadConfig:()=>({providers:{}}),loadProviderSettings:()=>({})};
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
main();
