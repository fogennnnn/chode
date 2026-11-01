'use strict';

// Negotiate before sending graphics. Unknown terminals receive ordinary text only.
function negotiate(options={}){
 let requested=false,buffer='',timer=null,sixel=false,cell=null,attributes=false;
 function close(){requested=false;buffer='';if(timer)clearTimeout(timer);timer=null;}
 function start(){const pending=buffer;close();if(pending&&options.onFlush)options.onFlush(pending);if(options.disabled)return '';requested=true;attributes=false;sixel=false;cell=null;return '\x1b[c\x1b[16t';}
 function feed(text){
  if(!requested)return {text,handled:false};
  let value=buffer+text,handled=!!buffer;buffer='';const before=sixel&&cell?cell.width+':'+cell.height:'text';
  if(timer)clearTimeout(timer);timer=null;
  value=value.replace(/\x1b\[\?([\d;]+)c|\x1b\[6;(\d+);(\d+)t/g,(_,flags,h,w)=>{
   handled=true;
   if(flags!==undefined){attributes=true;sixel=flags.split(';').slice(1).includes('4');}
   else{h=Number(h);w=Number(w);if(h>=4&&h<=128&&w>=2&&w<=64)cell={width:w,height:h};}
   return '';
  });
  const escape=value.lastIndexOf('\x1b'),tail=escape<0?'':value.slice(escape);
  if(tail&&tail.length<=128&&/^(?:\x1b|\x1b\[|\x1b\[\?[\d;]*|\x1b\[6(?:;\d*){0,2})$/.test(tail)){buffer=tail;value=value.slice(0,escape);handled=true;timer=setTimeout(()=>{const pending=buffer;buffer='';timer=null;if(pending&&options.onFlush)options.onFlush(pending);},options.timeoutMs||500);timer.unref?.();}
  const changed=before!==(sixel&&cell?cell.width+':'+cell.height:'text');
  return {text:value,handled,changed};
 }
 return {start,feed,close,get cell(){return cell;},get supported(){return !!(attributes&&sixel&&cell);}};
}

function encode(image){
 const {width,height,pixels,palette}=image;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>128||height>128||pixels.length!==width*height||palette.length>256)throw Error('Invalid terminal raster');
 let out='\x1bP0;1;0q"1;1;'+width+';'+height;
 palette.forEach((color,i)=>{out+='#'+i+';2;'+color.map(v=>Math.max(0,Math.min(100,Math.round(v*100/255)))).join(';');});
 function runs(values){let result='',last=values[0],count=0;for(const value of [...values,null]){if(value===last){count++;continue;}result+=count>3?'!'+count+String.fromCharCode(last+63):String.fromCharCode(last+63).repeat(count);last=value;count=1;}return result;}
 for(let y=0;y<height;y+=6){
  const colors=new Set();for(let row=y;row<Math.min(height,y+6);row++)for(let x=0;x<width;x++){const color=pixels[row*width+x];if(color>=palette.length)throw Error('Invalid terminal color');colors.add(color);}
  for(const color of colors){const values=[];for(let x=0;x<width;x++){let bits=0;for(let dy=0;dy<6&&y+dy<height;dy++)if(pixels[(y+dy)*width+x]===color)bits|=1<<dy;values.push(bits);}out+='#'+color+runs(values)+'$';}
  if(y+6<height)out+='-';
 }
 return out+'\x1b\\';
}
module.exports={negotiate,encode};
