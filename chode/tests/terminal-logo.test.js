'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const brand=require('../terminal-logo'),view=require('../workspace-view');
// Execute the actual worker logo's first frame, then compare the projected field
// at its golden-angle point coordinates. This guards the port against visual drift.
const worker=fs.readFileSync(path.join(__dirname,'../chode-hq-worker.js'),'utf8');
const start=worker.indexOf('const LOGO_JS ='),end=worker.indexOf('const METRICS_PAGE',start),scope={};
vm.runInNewContext(worker.slice(start,end)+';this.source=LOGO_JS;',scope);
const dots=new Map(),ctx={scale(){},clearRect(){},fillRect(x,y,w){if(w<3)dots.set(x.toFixed(6)+','+y.toFixed(6),this.fillStyle);}};
const canvas={dataset:{},getContext:()=>ctx};
vm.runInNewContext(scope.source,{document:{getElementById:()=>canvas},window:{devicePixelRatio:1,innerWidth:800,innerHeight:600,addEventListener(){}},requestAnimationFrame(){}});
let compared=0;
for(let i=13;i<4700;i+=137){
 const r=Math.sqrt(i)/Math.sqrt(6000),theta=i*2.39996;
 const x=Math.fround(Math.cos(theta)*r)*41.25,y=Math.fround(Math.sin(theta)*r)*41.25;
 const expected=dots.get((37.5+x).toFixed(6)+','+(37.5+y).toFixed(6)),actual=brand.sample(x,y,2);
 assert.equal(!!expected,actual.painted,'point gate differs from the website');
 if(expected){const values=/hsla\((\d+),88%,(\d+)%,([\d.]+)\)/.exec(expected);assert(values);assert.equal(actual.hue,Number(values[1]));assert.equal(actual.light,Number(values[2]));assert.equal(actual.alpha,Number(values[3]));compared++;}
}
assert(compared>8,'must compare lit points, not just an empty field');
assert.equal(brand.sample(40,40,2),null,'round clipping excludes corner pixels');
const idle=brand.create(),busy=brand.create();idle.render(0,false);busy.render(0,true);
for(let t=80;t<=2400;t+=80){idle.render(t,false);busy.render(t,true);}
assert(busy.phase>idle.phase*10,'working advances substantially faster than idle');
const frozen=brand.create({motion:false});assert.deepEqual(frozen.render(0,false,false),frozen.render(9000,true,false),'reduced motion stays static');
const rows=busy.render(2500,true,false);assert.equal(rows.length,4);assert(rows.every(r=>view.cellWidth(r.plain)===8&&!r.ansi.includes('\x1b')));
const small=view.frame(view.createState(),40,14),large=view.frame(view.createState(),80,24);
assert.equal(small.logo,null);assert(large.logo);assert.equal(large.headerRows,5);assert.equal(large.lines.length,24);
console.log('PASS terminal logo: actual worker point/palette parity, round clipping, idle/busy speed, static reduced motion, monochrome and reserved layout');

const compact=busy.render(2600,false,false,[17,21,24],1);assert.equal(compact.length,4);assert(compact.every(r=>view.cellWidth(r.plain)===8));
const expanded=busy.render(2700,false,false,[17,21,24],2);assert.equal(expanded.length,8);assert.equal(compact.length*compact[0].cells.length/(expanded.length*expanded[0].cells.length),0.25,'compact mark occupies one quarter of the expanded terminal area');
const medium=view.frame(view.createState(),60,18);assert.equal(medium.headerRows,5);assert.equal(medium.logo.scale,1);assert.equal(large.logo.scale,1);
