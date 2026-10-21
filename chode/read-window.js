'use strict';
function page(file,text,options={}){
 const offset=options.offset??1,column=options.column??0,limit=options.limit??120;
 if(!Number.isInteger(offset)||offset<1||!Number.isInteger(column)||column<0||!Number.isInteger(limit)||limit<1||limit>200)return {ok:false,invalidArguments:true,error:'read offset must be a positive line number, column nonnegative, and limit 1–200 lines.'};
 const lines=text.match(/[^\n]*\n|[^\n]+$/g)||[];
 if(offset>lines.length+1||offset===lines.length+1&&column||offset<=lines.length&&column>lines[offset-1].length)return {ok:false,error:'Read offset/column exceeds the file.'};
 const build=(content,line,col)=>({ok:true,content,offset,column,totalLines:lines.length,eof:line>=lines.length,nextRead:line<lines.length?{file,offset:line+1,column:col,limit}:null});
 const fits=result=>{const encoded=JSON.stringify({...result,source:{id:'Sxxxxxxxxxxxx',locator:file,sha256:'x'.repeat(64),observedAt:'2000-01-01T00:00:00.000Z'}});return encoded.length<=5000&&Buffer.byteLength(encoded)<=6000;};
 let line=offset-1,col=column,content='',count=0;
 while(line<lines.length&&count<limit){
  const tail=lines[line].slice(col),whole=build(content+tail,line+1,0);
  if(fits(whole)){content+=tail;line++;col=0;count++;continue;}
  let low=0,high=tail.length;
  while(low<high){const mid=Math.ceil((low+high)/2);if(fits(build(content+tail.slice(0,mid),line,col+mid)))low=mid;else high=mid-1;}
  if(low>0&&/[\uD800-\uDBFF]/.test(tail[low-1])&&/[\uDC00-\uDFFF]/.test(tail[low]||''))low--;
  if(!low&&!content)return {ok:false,error:'Read page metadata or character exceeds the response limit.'};
  content+=tail.slice(0,low);col+=low;break;
 }
 return build(content,line,col);
}
module.exports={page};
