'use strict';
const assert=require('assert/strict');
const catalog=require('../provider-catalog');
const directory=require('../provider-directory');

function engine(){
  const providers={
    ovh:{name:'OVHcloud (Keyless)',category:'keyless',requiresKey:null,qualityScore:70,signupUrl:'https://www.ovhcloud.com/en/public-cloud/ai-endpoints/',freeTier:'No key · 2 req/min/IP/model',endpoints:[{url:'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions'},{url:'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions'}]},
    agnes:{name:'Agnes AI (Keyless)',category:'keyless',requiresKey:null,qualityScore:68,signupUrl:'https://agnes-ai.com/doc',freeTier:'No key',endpoints:[{url:'https://apihub.agnes-ai.com/v1/chat/completions'}]},
    groq:{name:'Groq',category:'free_tier',requiresKey:'GROQ_API_KEY',qualityScore:92,signupUrl:'https://console.groq.com/keys',endpoints:[{url:'https://api.groq.com/openai/v1/chat/completions'}]},
    anthropic:{name:'Claude',category:'paid',requiresKey:'ANTHROPIC_API_KEY',qualityScore:100,signupUrl:'https://console.anthropic.com/',endpoints:[{url:'https://api.anthropic.com/v1/messages'}]},
    ollama:{name:'Ollama (Local)',category:'free_local',requiresKey:null,qualityScore:60,signupUrl:null,endpoints:[{url:'http://127.0.0.1:11434/api/chat'}]}
  };
  const cfg={providers:{groq:{key:'saved-groq-key',keySource:'setup',model:'llama'}}};
  return {PROVIDERS:providers,loadConfig:()=>cfg,loadProviderSettings:(id)=>cfg.providers[id]||{}};
}
const id=(entries,x)=>entries.find(e=>e.id===x);

function main(){
  const entries=catalog.all(engine(),{env:{}});
  const dirCount=directory.list().length;
  for(const x of ['ovh','agnes','groq','anthropic','ollama'])assert(id(entries,x),x+' present');
  // directory folded in (184 profiles, minus merged twins, minus dupes)
  assert(entries.length>100,'expected directory folded in, got '+entries.length);

  // OVH: keyless built-in + keyed directory twin (OVHCLOUD_API_KEY) -> free first, paid second
  const ovh=id(entries,'ovh');
  assert.equal(ovh.requiresKey,false,'ovh default is keyless');
  assert(ovh.variants.length>=2,'ovh should have free + paid variants, got '+ovh.variants.length);
  assert.equal(ovh.variants[0].requiresKey,false,'first ovh variant is no-key/free');
  const ovhPaid=ovh.variants.find(v=>v.requiresKey);
  assert(ovhPaid,'ovh paid variant exists');
  assert.equal(ovhPaid.keyEnv,'OVHCLOUD_API_KEY');
  assert.equal(ovhPaid.tier,'paid');
  assert.equal(ovh.hasPaidVariant,true);
  assert(!id(entries,'ovhcloud'),'ovhcloud merged into ovh, not a standalone entry');

  // Agnes: same pattern
  const agnes=id(entries,'agnes');
  assert(agnes.variants.some(v=>v.requiresKey),'agnes has a keyed variant');
  assert(id(entries,'agnes').source==='builtin','agnes entry is the built-in (directory twin merged)');

  // Groq: keyed free tier, single variant, configured + has saved key
  const groq=id(entries,'groq');
  assert.equal(groq.requiresKey,true);
  assert.equal(groq.keyEnv,'GROQ_API_KEY');
  assert.equal(groq.tier,'free');
  assert.equal(groq.configured,true,'groq configured from config');
  assert.equal(groq.hasKey,true,'groq saved key resolvable');

  // Ollama: local, no key
  const ollama=id(entries,'ollama');
  assert.equal(ollama.tier,'local');
  assert.equal(ollama.local,true);
  assert.equal(ollama.requiresKey,false);
  assert.equal(ollama.localUp,false,'no local models supplied');
  const ollamaUp=catalog.all(engine(),{env:{},localModels:['qwen3:latest'],probeLocal:true});
  assert.equal(id(ollamaUp,'ollama').localUp,true,'localUp true when models supplied');

  // Anthropic: paid, no key by default (hermetic env)
  assert.equal(id(entries,'anthropic').hasKey,false);
  assert.equal(id(catalog.all(engine(),{env:{ANTHROPIC_API_KEY:'sk-ant'}}),'anthropic').hasKey,true,'env key resolvable');

  // Ordering: free/keyless/local tiers precede paid/configured
  const rank={free:0,keyless:1,local:2,paid:3,configured:4};
  for(let i=1;i<entries.length;i++)assert(rank[entries[i].tier]>=rank[entries[i-1].tier],'tier ordering broken at '+entries[i].id);

  // Filter
  const free=catalog.filter(entries,{free:true});
  assert(free.length>0);
  assert(free.every(e=>['free','keyless','local'].includes(e.tier)),'free filter');
  const configured=catalog.filter(entries,{configured:true});
  assert(configured.some(e=>e.id==='groq'),'configured filter finds groq');
  const searched=catalog.filter(entries,{query:'groq'});
  assert(searched.some(e=>e.id==='groq'),'query search');
  const modelSearch=catalog.filter(entries,{query:'gpt-oss-120b'});
  assert(modelSearch.some(e=>e.id==='ovh'),'search matches ovh via model id');

  // find by id and by display name
  assert.equal(catalog.find(entries,'groq').id,'groq');
  assert.equal(catalog.find(entries,'Groq').id,'groq');
  assert.equal(catalog.find(entries,'Claude').id,'anthropic');

  // TIERS exposed and variant tier labels valid
  for(const e of entries)for(const v of e.variants)assert(catalog.TIERS.includes(v.tier)||v.tier==='paid',v.tier);

  console.log('PASS provider-catalog: '+entries.length+' unified entries, OVH/Agnes free+paid variants, status, ordering, filter, find');
}
main();
