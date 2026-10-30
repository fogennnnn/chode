'use strict';

// Low-resolution projection of chode-hq-worker.js LOGO_JS. The 75px field,
// three moving nodes, phase gate and HSL palette are the website's equations.
// Fine 2x4 braille dots sample that field inside each terminal character cell.
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
 let width=8,height=4,history=new Float32Array(width*height*8);
 let previous=null,phase=2,speed=0.06;
 function render(now,busy,color=true,background=[17,21,24],scale=1){
  const nextWidth=scale===1?8:16,nextHeight=scale===1?4:8;
  if(width!==nextWidth||height!==nextHeight){width=nextWidth;height=nextHeight;history=new Float32Array(width*height*8);}
  const pw=width*2,ph=height*4;
  // Twice the vertical detail, with the same maximum 2,048 field samples.
  const samplesX=scale===1?[0.125,0.375,0.625,0.875]:[0.25,0.75],samplesY=scale===1?[0.25,0.75]:[0.5],sampleCount=samplesX.length*samplesY.length;
  const dt=previous===null?0:Math.max(0,Math.min(250,now-previous));previous=now;
  if(options.motion!==false){speed+=((busy?1.8:0.06)-speed)*(1-Math.exp(-dt/180));phase+=dt*0.12*speed;}
  const pixels=[];
  for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){
   const index=y*pw+x,centerX=(x+0.5)/pw*75-37.5,centerY=(y+0.5)/ph*75-37.5;
   if(Math.hypot(centerX,centerY)>37.5){history[index]=0;pixels.push(null);continue;}
   let energy=0,channels=[0,0,0],weight=0;
   for(const ox of samplesX)for(const oy of samplesY){
    const v=sample((x+ox)/pw*75-37.5,(y+oy)/ph*75-37.5,phase);
    if(!v||!v.painted)continue;
    const values=rgb(v.hue,v.light);energy+=v.alpha/sampleCount;weight++;
    for(let i=0;i<3;i++)channels[i]+=values[i];
   }
   history[index]=options.motion===false?energy:energy*0.75+history[index]*0.25;
   pixels.push(weight?channels.map(v=>Math.round(v/weight*Math.min(1,history[index]*1.4))):[1,1,2]);
  }
  const rows=[],dotBits=[1,8,2,16,4,32,64,128];
  const level=p=>(Math.max(...p)+Math.min(...p))/2;
  for(let cy=0;cy<height;cy++){
   let plain='',ansi='',cells=[];
   for(let cx=0;cx<width;cx++){
    const square=[];
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<2;dx++)square.push(pixels[(cy*4+dy)*pw+cx*2+dx]);
    const inside=square.filter(Boolean);
    if(!inside.length){cells.push({mask:0,fg:background,bg:background,dotRows:4});plain+=' ';ansi+=(color?'\x1b[48;2;'+background.join(';')+'m':'')+' ';continue;}
    const threshold=(Math.min(...inside.map(level))+Math.max(...inside.map(level)))/2;
    const fg=[];let mask=0,braille=0;
    square.forEach((p,i)=>{if(p&&level(p)>=threshold&&level(p)>18){mask|=1<<i;braille|=dotBits[i];fg.push(p);}});
    const average=(values,fallback)=>values.length?[0,1,2].map(i=>Math.round(values.reduce((n,p)=>n+p[i],0)/values.length)):fallback;
    const bright=average(fg,background),dark=background,glyph=mask?String.fromCharCode(0x2800+braille):' ';cells.push({mask,fg:bright,bg:dark,dotRows:4});plain+=glyph;
    ansi+=(color?'\x1b[38;2;'+bright.join(';')+';48;2;'+dark.join(';')+'m':'')+glyph;
   }
   rows.push({plain,cells,ansi:ansi+(color?'\x1b[39m\x1b[48;2;'+background.join(';')+'m':'')});
  }
  return rows;
 }
 return {render,get phase(){return phase;},get width(){return width;},get height(){return height;}};
}
function raster(t,width,height,background=[17,21,24]){
 width=Math.max(1,Math.min(128,Math.floor(width)));height=Math.max(1,Math.min(128,Math.floor(height)));
 const palette=[background,[1,1,2]],pixels=new Uint8Array(width*height),diameter=Math.min(width,height);
 for(let i=0;i<64;i++){const hue=245+i*100/63,norm=(hue-265)/55,alpha=Math.max(0,Math.min(1,0.6+norm*0.4));palette.push(rgb(hue,Math.max(0,Math.min(100,42+norm*35))).map((v,c)=>Math.round(v*alpha+background[c]*(1-alpha))));}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const v=sample((x+0.5-width/2)/diameter*75,(y+0.5-height/2)/diameter*75,t);pixels[y*width+x]=!v?0:!v.painted?1:2+Math.max(0,Math.min(63,Math.round((v.hue-245)/100*63)));}
 return {width,height,pixels,palette};
}
module.exports={sample,create,raster};
