'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'../chode-hq-worker.js'),'utf8');
const scope={};vm.runInNewContext(source.slice(source.indexOf('const LOGO_JS ='),source.indexOf('const METRICS_PAGE'))+';this.code=LOGO_JS;',scope);
function fixture(width=390,reduced=false){
 let clock=0,id=0,paints=0,observer;
 const frames=new Map(),events={},documentEvents={};
 const context={scale(){},clearRect(){paints++;},fillRect(x,y,w){if(w===75)paints++;}};
 const canvas={dataset:{},getContext:()=>context};
 const document={hidden:false,getElementById:()=>canvas,addEventListener:(n,f)=>documentEvents[n]=f};
 const window={innerWidth:width,innerHeight:844,devicePixelRatio:3,performance:{now:()=>clock},matchMedia:()=>({matches:reduced}),addEventListener:(n,f)=>events[n]=f};
 vm.runInNewContext(scope.code.replace('const t=localStep*pDrive;','canvas.measuredPhase=localStep;const t=localStep*pDrive;'),{document,window,requestAnimationFrame:f=>{frames.set(++id,f);return id;},cancelAnimationFrame:n=>frames.delete(n),IntersectionObserver:class{constructor(callback){observer=callback;}observe(){}}});
 return {canvas,document,frames,get paints(){return paints;},tick(ms){clock=ms;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(f=>f(ms));},visible(value){observer([{isIntersecting:value}]);},hidden(value){document.hidden=value;documentEvents.visibilitychange();}};
}
const mobile=fixture(),desktop=fixture(1280),fast=fixture(1280);
for(let i=1;i<=120;i++){fast.tick(i*1000/120);if(i%2===0){mobile.tick(i*1000/120);desktop.tick(i*1000/120);}}
assert(mobile.paints>=29&&mobile.paints<=32,'mobile targets30 actual paints/sec');
assert(desktop.paints>=59&&desktop.paints<=62,'desktop keeps60 actual paints/sec');
assert.equal(fast.paints,desktop.paints,'120Hz displays do not double logo work');
assert(Math.abs(mobile.canvas.measuredPhase-desktop.canvas.measuredPhase)<0.001,'mobile keeps the same physical animation speed');
const count=mobile.paints;mobile.visible(false);assert.equal(mobile.frames.size,0);mobile.tick(5000);assert.equal(mobile.paints,count,'offscreen logo does no work');
mobile.visible(true);assert.equal(mobile.frames.size,1);mobile.tick(5017);assert(mobile.paints>count,'logo resumes when scrolled back');
mobile.hidden(true);assert.equal(mobile.frames.size,0);const hiddenCount=mobile.paints;mobile.tick(9000);assert.equal(mobile.paints,hiddenCount);mobile.hidden(false);assert.equal(mobile.frames.size,1);mobile.tick(9017);assert(mobile.paints>hiddenCount,'tab visibility resumes animation');
const staticLogo=fixture(390,true);assert.equal(staticLogo.paints,1);assert.equal(staticLogo.frames.size,0);staticLogo.visible(false);staticLogo.visible(true);staticLogo.hidden(true);staticLogo.hidden(false);assert.equal(staticLogo.frames.size,0,'reduced-motion stays static across lifecycle changes');
assert.match(source,/POINTS_COUNT=6000,NODE_COUNT=3/,'full logo detail retained');
console.log('PASS mobile animation:30/60/120Hz cadence, equal motion speed, full detail, offscreen/hidden pause, resume and reduced motion');
