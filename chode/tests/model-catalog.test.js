'use strict';
const assert = require('assert/strict'), catalog = require('../model-catalog');
(async () => {
  const models = catalog.normalize({data: [
    {id:'paid',pricing:{prompt:'0.1',completion:'0.2'}},
    {id:'unknown'}, {id:'free-tools',pricing:{prompt:'0',completion:'0'},supported_parameters:['tools','response_format'],context_length:128000},
    {id:'extra-charge',pricing:{prompt:0,completion:0,request:0.1}},
    {id:'invalid-price',pricing:{prompt:'',completion:0}},
    {id:'partial-price',pricing:{prompt:0}}, {id:'negative',pricing:{prompt:-1,completion:0}},
    {id:'free-tools'}, {id:'bad\nname'}, null]});
  assert.equal(models[0].id,'free-tools'); assert.equal(models.length,7);
  assert(models[0].tools && models[0].structured); assert.equal(models[0].context,128000);
  assert.equal(models.filter(m=>m.zeroTokenPrice).length,1);
  assert.match(catalog.label(models[0]),/listed zero price.*tools.*structured output.*128000/);
  assert.match(catalog.label(models.find(m=>m.id==='unknown')),/price unverified/);
  const local = catalog.normalize({models:[{model:'local:latest'}]},{local:true});
  assert.match(catalog.label(local[0]),/installed locally/);
  const many=catalog.normalize({data:Array.from({length:47},(_,i)=>({id:'model-'+i}))});
  let answers=['next','next','7'],questions=[];
  assert.equal(await catalog.select(many,'',async(title,q)=>{questions.push(q);return answers.shift();}),'model-46');
  assert.equal(questions[2].options.length,7);
  answers=['search model-42','1'];assert.equal(await catalog.select(many,'',async()=>answers.shift()),'model-42');
  answers=['999','current'];assert.equal(await catalog.select(many,'saved-model',async()=>answers.shift()),'saved-model');
  assert.equal(await catalog.select([], '', async()=> 'manual/model'), 'manual/model');
  assert.equal(await catalog.select(models,'',async()=>catalog.label(models[0])),'free-tools');
  assert.equal(catalog.normalize({data:Array.from({length:600},(_,i)=>({id:'m'+i}))}).length,500);
  // Use the actual connection helper: displayed labels must never become model IDs.
  let saved, notices=[], answers2=['1','Test connection','Save only'];
  const engine={PROVIDERS:{fixture:{name:'Fixture',category:'keyless',requiresKey:null,endpoints:[{
    url:'https://fixture.invalid/v1/chat/completions',headers:()=>({}),
    body:(key,messages)=>JSON.stringify({model:'default',messages,max_tokens:100}),parse:data=>data.choices?.[0]?.message?.content
  }]}},loadConfig:()=>({providers:{},freeOnly:true}),saveConfig:cfg=>saved=cfg};
  await require('../provider-connect').run(engine,{provider:'fixture',notice:text=>notices.push(text),ask:async()=>answers2.shift(),fetch:async(url,options)=>{
    if(!url.endsWith('/models'))assert.equal(JSON.parse(options.body).model,'free-tools');
    return {ok:true,json:async()=>url.endsWith('/models')?{data:[{id:'paid'}, {id:'free-tools',pricing:{prompt:0,completion:0},supported_parameters:['tools']}]}:{choices:[{message:{content:'OK'}}]}};
  }});
  assert.equal(saved.providers.fixture.model,'free-tools'); assert.equal(saved.freeOnly,true);
  assert(notices.some(text=>text.includes('shared quotas')));
  console.log('PASS model catalog: conservative price/capability labels, stable free-first order, validation, deduplication, paging/search and exact IDs');
})().catch(error=>{console.error(error);process.exitCode=1;});
