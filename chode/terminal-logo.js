'use strict';

// Low-resolution projection of chode-hq-worker.js LOGO_JS. The 75px field,
// three moving nodes, phase gate and HSL palette are the website's equations.
// Contiguous block pixels sample that field instead of drawing its 6,000 golden-angle points.
function sample(x,y,t){
 const radius=75/2*1.1,r=Math.hypot(x,y);
 if(r>75/2)return null;
 let phase=Math.sin(r*0.1-t*0.03);
 for(let n=0;n<3;n++){
  const angle=t*0.003+n*Math.PI*2/3,nodeR=radius*0.45*Math.sin(t*0.0006+n);
  phase+=2.5*Math.sin(Math.hypot(x-Math.cos(angle)*nodeR,y-Math.sin(angle)*nodeR)*0.24-t*0.06);
 }
 const norm=(phase+5)/10,raw=0.6+norm*0.4;
 return {painted:Math.sin(phase*2)>0.15,hue:(265+norm*55)|0,light:(42+norm*35)|0,alpha:Math.max(0,Math.min(1,Math.round(raw*100)/100))};
}
function rgb(h,l){
 const c=(1-Math.abs(2*l/100-1))*0.88,x=c*(1-Math.abs(h/60%2-1)),m=l/100-c/2;
 const p=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h/60)%6];
 return p.map(v=>Math.round((v+m)*255));
}
function create(options={}){
 const width=8,height=4,pw=width*2,ph=height*2,history=new Float32Array(pw*ph);
 let previous=null,phase=2,speed=0.06;
 function render(now,busy,color=true,background=[17,21,24]){
  const dt=previous===null?0:Math.max(0,Math.min(250,now-previous));previous=now;
  if(options.motion!==false){speed+=((busy?1.8:0.06)-speed)*(1-Math.exp(-dt/180));phase+=dt*0.12*speed;}
  const pixels=[];
  for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){
   const index=y*pw+x,centerX=(x+0.5)/pw*75-37.5,centerY=(y+0.5)/ph*75-37.5;
   if(Math.hypot(centerX,centerY)>37.5){history[index]=0;pixels.push(null);continue;}
   let energy=0,channels=[0,0,0],weight=0;
   for(const ox of [0.25,0.75])for(const oy of [0.25,0.75]){
    const v=sample((x+ox)/pw*75-37.5,(y+oy)/ph*75-37.5,phase);
    if(!v||!v.painted)continue;
    const values=rgb(v.hue,v.light);energy+=v.alpha/4;weight++;
    for(let i=0;i<3;i++)channels[i]+=values[i];
   }
   history[index]=options.motion===false?energy:energy*0.75+history[index]*0.25;
   pixels.push(weight?channels.map(v=>Math.round(v/weight*Math.min(1,history[index]*1.4))):[1,1,2]);
  }
  const rows=[],glyphs=[' ','▘','▝','▀','▖','▌','▞','▛','▗','▚','▐','▜','▄','▙','▟','█'];
  const level=p=>(Math.max(...p)+Math.min(...p))/2;
  for(let cy=0;cy<height;cy++){
   let plain='',ansi='',cells=[];
   for(let cx=0;cx<width;cx++){
    const square=[];
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)square.push(pixels[(cy*2+dy)*pw+cx*2+dx]);
    const inside=square.filter(Boolean);
    if(!inside.length){cells.push({mask:0,fg:background,bg:background});plain+=' ';ansi+=(color?'\x1b[48;2;'+background.join(';')+'m':'')+' ';continue;}
    const threshold=(Math.min(...inside.map(level))+Math.max(...inside.map(level)))/2;
    const fg=[],bg=[];let mask=0;
    square.forEach((p,i)=>{if(p&&level(p)>=threshold&&level(p)>18){mask|=1<<i;fg.push(p);}else bg.push(p||background);});
    const average=(values,fallback)=>values.length?[0,1,2].map(i=>Math.round(values.reduce((n,p)=>n+p[i],0)/values.length)):fallback;
    const bright=average(fg,background),dark=average(bg,bright),glyph=glyphs[mask];cells.push({mask,fg:bright,bg:dark});plain+=glyph;
    ansi+=(color?'\x1b[38;2;'+bright.join(';')+';48;2;'+dark.join(';')+'m':'')+glyph;
   }
   rows.push({plain,cells,ansi:ansi+(color?'\x1b[39m\x1b[48;2;'+background.join(';')+'m':'')});
  }
  return rows;
 }
 return {render,get phase(){return phase;},width,height};
}
module.exports={sample,create};
