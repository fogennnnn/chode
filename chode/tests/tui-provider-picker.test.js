'use strict';
const assert=require('assert/strict');
const picker=require('../tui-provider-picker');
const catalog=require('../provider-catalog');

function engine(){
  const providers={
    ovh:{name:'OVHcloud (Keyless)',category:'keyless',requiresKey:null,freeTier:'No key',endpoints:[{url:'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions'},{url:'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions'}]},
    groq:{name:'Groq',category:'free_tier',requiresKey:'GROQ_API_KEY',endpoints:[{url:'https://api.groq.com/openai/v1/chat/completions'}]},
    anthropic:{name:'Claude',category:'paid',requiresKey:'ANTHROPIC_API_KEY',endpoints:[{url:'https://api.anthropic.com/v1/messages'}]},
    ollama:{name:'Ollama (Local)',category:'free_local',requiresKey:null,endpoints:[{url:'http://127.0.0.1:11434/api/chat'}]}
  };
  return {PROVIDERS:providers,loadConfig:()=>({providers:{}}),loadProviderSettings:()=>({})};
}
const key=(name,extra={})=>Object.assign({name},extra);
const char=(c)=>({name:c});

function main(){
  const entries=catalog.all(engine(),{env:{}});
  const ovh=entries.find(e=>e.id==='ovh');
  assert(ovh.variants.length===2,'fixture ovh has 2 variants');

  // ---- stage 1: search + select single-variant ----
  let s=picker.create(entries);
  for(const c of 'groq')picker.handle(s,char(c),c);
  assert.equal(s.results[0].id,'groq','groq is the top match (free tier sorts first)');
  let r=picker.handle(s,key('return'),'\r');
  assert.equal(r.type,'select');assert.equal(r.id,'groq');assert.equal(r.wizardId,'groq');assert.equal(r.variantIndex,0);

  // ---- stage 1: enter on multi-variant -> stage 2 ----
  s=picker.create(entries);
  for(const c of 'ovh')picker.handle(s,char(c),c);
  r=picker.handle(s,key('return'),'\r');
  assert.equal(r,null,'multi-variant provider drops into variant stage, no select yet');
  assert.equal(s.stage,'variant');
  assert.equal(s.entry.id,'ovh');
  assert.equal(s.vcursor,0);
  // pick paid (index 1)
  picker.handle(s,key('down'),'');
  r=picker.handle(s,key('return'),'\r');
  assert.equal(r.type,'select');assert.equal(r.id,'ovh');assert.equal(r.variantIndex,1);assert.equal(r.wizardId,'ovhcloud','paid variant routes to keyed profile');
  // back to provider and pick free
  s=picker.create(entries);
  for(const c of 'ovh')picker.handle(s,char(c),c);
  picker.handle(s,key('return'),'\r');            // -> variant stage
  r=picker.handle(s,key('return'),'\r');          // free (vcursor 0)
  assert.equal(r.variantIndex,0);assert.equal(r.wizardId,'ovh','free variant stays keyless');

  // ---- variant back (b) returns to provider list ----
  s=picker.create(entries);
  for(const c of 'ovh')picker.handle(s,char(c),c);
  picker.handle(s,key('return'),'\r');            // -> variant
  assert.equal(picker.handle(s,char('b'),'b'),null,'back is a no-op returning to provider stage');
  assert.equal(s.stage,'provider');
  assert.equal(s.results[s.cursor].id,'ovh','cursor restored on the same provider');

  // ---- filter cycling ----
  s=picker.create(entries);
  picker.handle(s,char('f'),'f');assert.equal(s.filter,'free');
  assert(s.results.every(e=>e.tier==='free'));
  picker.handle(s,char('f'),'f');assert.equal(s.filter,'keyless');
  assert(s.results.every(e=>e.tier==='keyless'));

  // ---- cancel ----
  s=picker.create(entries);
  assert.equal(picker.handle(s,key('escape'),'\x1b').type,'cancel');

  // ---- render: body lines + highlighted cursor ----
  s=picker.create(entries);
  for(const c of 'ovh')picker.handle(s,char(c),c);
  let fr=picker.render(s,80,12);
  assert.equal(fr.lines.length,12,'render fills bodyHeight');
  assert(fr.lines[fr.cursorRow].includes('\u25B6'),'cursor line highlighted');
  assert(fr.lines.join('\n').includes('Connect a provider'));
  // variant stage render
  picker.handle(s,key('return'),'\r');
  fr=picker.render(s,80,12);
  assert(fr.lines.join('\n').includes('choose access mode'));
  assert(fr.lines[fr.cursorRow].includes('\u25B6'));
  console.log('PASS tui-provider-picker: search/select, two-stage OVH free+paid, back, filter, cancel, render+cursor');
}
main();
