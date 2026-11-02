'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'../chode-hq-worker.js'),'utf8');
const script=source.match(/<script>\s*\(function\(\)\{[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'');
function fixture(){
 let now=0,queries=0;const timers=[],idle=[],windowEvents={},documentEvents={},classes=new Set(['scene-pending']);
 const root={dataset:{},classList:{add:n=>classes.add(n),remove:n=>classes.delete(n),contains:n=>classes.has(n)}};
 const add=(map,n,fn,options)=>{(map[n]||(map[n]=[])).push({fn,once:!!options?.once});};
 const emit=(map,n)=>{for(const entry of [...(map[n]||[])]){entry.fn({});if(entry.once)map[n]=map[n].filter(e=>e!==entry);}};
 const document={documentElement:root,addEventListener:(...args)=>add(documentEvents,...args),querySelectorAll:()=>{queries++;return [];},getElementById:()=>null};
 const window={addEventListener:(...args)=>add(windowEvents,...args),requestIdleCallback:fn=>idle.push(fn)};
 vm.runInNewContext(script,{document,window,performance:{now:()=>now},IntersectionObserver:class{observe(){}unobserve(){}},setTimeout:(fn,delay)=>timers.push({fn,at:now+delay}),fetch:async()=>({json:async()=>({})})});
 return {root,classes,idle,get queries(){return queries;},scene:()=>emit(windowEvents,'chode-scene-ready'),interact:()=>emit(documentEvents,'pointerdown'),advance(t){now=t;for(;;){const i=timers.findIndex(x=>x.at<=now);if(i<0)break;timers.splice(i,1)[0].fn();}}};
}
const normal=fixture();assert.equal(normal.queries,0,'noncritical command setup must not run before the scene');assert(normal.classes.has('scene-pending'));
normal.scene();assert(normal.classes.has('scene-ready'));assert.equal(normal.root.dataset.sceneReady,'true');assert.equal(normal.queries,0,'first scene paint precedes interface setup');normal.advance(699);assert.equal(normal.idle.length,0);normal.advance(700);assert.equal(normal.idle.length,1);normal.idle.shift()();assert(normal.queries>0);normal.advance(2100);assert(!normal.classes.has('scene-ready'),'intro compositing hints released after reveal');assert(!normal.classes.has('scene-pending'));normal.scene();assert(!normal.classes.has('scene-ready'),'scene reveal cannot replay');
const blocked=fixture();blocked.advance(1200);assert.equal(blocked.root.dataset.sceneReady,'true','blocked scene assets cannot leave content hidden');blocked.advance(1800);assert(blocked.queries>0,'interface fallback remains available');
const fast=fixture();fast.interact();assert(fast.queries>0,'first interaction initializes command handling immediately');const initialized=fast.queries;fast.interact();fast.advance(1800);assert.equal(fast.queries,initialized,'interface initializes only once');
console.log('PASS scene startup:paint-first handshake, deferred UI, immediate interaction, bounded fallbacks and one-shot reveal cleanup');
