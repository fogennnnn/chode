'use strict';
const ui = require('./terminal-ui');
const segmenter = new Intl.Segmenter(undefined,{granularity:'grapheme'});
function graphemes(text){return [...segmenter.segment(String(text))].map(x=>x.segment);}
function safe(text){return String(text==null?'':text).replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g,'').replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'').replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g,'');}
function cellWidth(text){return graphemes(safe(text)).reduce((n,g)=>n+width(g),0);}
function width(g){if(/^\p{Mark}+$/u.test(g))return 0;const c=g.codePointAt(0);return /\p{Extended_Pictographic}/u.test(g)||c>=0x1100&&(c<=0x115f||c>=0x2e80&&c<=0xa4cf||c>=0xac00&&c<=0xd7a3||c>=0xf900&&c<=0xfaff||c>=0xfe10&&c<=0xfe6f||c>=0xff00&&c<=0xff60||c>=0x20000)?2:1;}
function fit(text,columns){let s='',used=0;for(const g of graphemes(safe(text).replace(/\n/g,' '))){const n=width(g);if(used+n>columns)break;s+=g;used+=n;}return s+' '.repeat(Math.max(0,columns-used));}
function wrap(text,columns){const lines=[];for(const line of safe(text).replace(/\t/g,'    ').split('\n')){let out='',n=0;for(const g of graphemes(line)){const w=width(g);if(n+w>columns){lines.push(out);out='';n=0;}if(w<=columns){out+=g;n+=w;}}lines.push(out);}return lines;}
function createState(context={}){return {workspace:context.workspace||process.cwd(),session:context.session||'default',provider:context.provider||'auto',messages:[],activity:[],input:'',cursor:0,history:[],historyIndex:0,details:false,scroll:0,busy:false,status:'Ready',draft:'',question:null,paste:false};}
function addMessage(state,role,text){state.messages.push({role,text:safe(text).slice(0,100000)});if(state.messages.length>200)state.messages.splice(0,state.messages.length-200);}
function insert(state,text){const a=graphemes(state.input);const inserted=graphemes(safe(text));a.splice(state.cursor,0,...inserted);state.input=a.join('');state.cursor+=inserted.length;}
function key(state,text,key={}){
 const name=key.name||'';
 if(key.sequence==='\x1b[200~'){state.paste=true;return;}
 if(key.sequence==='\x1b[201~'){state.paste=false;return;}
 if(state.paste){insert(state,name==='return'?'\n':text||'');return;}
 if(key.ctrl&&name==='c'){if(state.busy)return {type:'cancel'};if(state.input){state.input='';state.cursor=0;return;}return {type:'exit'};}
 if(key.ctrl&&name==='d')return {type:state.busy?'cancel':'exit'};
 if(key.ctrl&&name==='o'){state.details=!state.details;return;}
 if(name==='pageup'){state.scroll+=10;return;}
 if(name==='pagedown'){state.scroll=Math.max(0,state.scroll-10);return;}
 if(name==='escape'){state.input='';state.cursor=0;if(state.question)return {type:'answer',value:null};return;}
 if(name==='return'&&!(key.shift||key.meta)){const prompt=state.input.trim();if(!prompt)return;state.input='';state.cursor=0;state.scroll=0;if(state.question)return {type:'answer',value:prompt};if(state.busy&&!/^\/(quit|exit)$/.test(prompt)){insert(state,prompt);return;}state.history.push(prompt);state.historyIndex=state.history.length;return {type:prompt.startsWith('/')?'command':'submit',value:prompt};}
 if(name==='return'&&(key.shift||key.meta)||key.ctrl&&name==='j'){insert(state,'\n');return;}
 const chars=graphemes(state.input);
 if(name==='left'){state.cursor=Math.max(0,state.cursor-1);return;}
 if(name==='right'){state.cursor=Math.min(chars.length,state.cursor+1);return;}
 if(name==='home'||key.ctrl&&name==='a'){state.cursor=0;return;}
 if(name==='end'||key.ctrl&&name==='e'){state.cursor=chars.length;return;}
 if(name==='backspace'){if(state.cursor){chars.splice(--state.cursor,1);state.input=chars.join('');}return;}
 if(name==='delete'){chars.splice(state.cursor,1);state.input=chars.join('');return;}
 if(key.ctrl&&name==='u'){state.input=chars.slice(state.cursor).join('');state.cursor=0;return;}
 if((name==='up'||name==='down')&&!state.input.includes('\n')){state.historyIndex=Math.max(0,Math.min(state.history.length,state.historyIndex+(name==='up'?-1:1)));state.input=state.history[state.historyIndex]||'';state.cursor=graphemes(state.input).length;return;}
 if(name==='tab'){const matches=['/help','/details','/session','/model','/new','/quit'].filter(s=>s.startsWith(state.input));if(matches.length===1){state.input=matches[0]+' ';state.cursor=graphemes(state.input).length;}return;}
 if(!key.ctrl&&!key.meta&&text){insert(state,text);}
}
function frame(state,columns=80,rows=24){
 const w=Math.max(1,Math.floor(columns)),h=Math.max(1,Math.floor(rows));
 if(w<20||h<8){const lines=Array.from({length:h},()=> ' '.repeat(w));lines[0]=fit('Chode · '+state.status,w);if(h>2)lines[1]=fit('Enlarge terminal for the workspace',w);lines[h-1]=fit('› '+state.input,w);return {lines,cursor:{row:h-1,column:Math.min(w-1,2+cellWidth(graphemes(state.input).slice(0,state.cursor).join('')))}};}
 const side=state.details&&w>=100?30:0,mainWidth=w-side-(side?1:0),contentWidth=Math.max(4,mainWidth-4);
 const bodyHeight=h-8;const body=[];
 for(const m of state.messages){body.push('',m.role==='user'?'You':m.role==='assistant'?'Chode':'Notice');body.push(...wrap(m.text,contentWidth));}
 if(state.draft){body.push('','Draft · checking before completion',...wrap(state.draft,contentWidth));}
 if(state.details&&!side&&state.activity.length){body.push('','Activity');for(const e of state.activity.slice(-6))body.push(...wrap((e.ok===false?'! ':e.phase==='start'?'· ':'✓ ')+e.label,contentWidth));}
 if(!body.length)body.push('','What are we building?','','Describe an app, explore a question, or inspect a project.','','/help commands · Ctrl+O activity · PgUp/PgDn history');
 const offset=Math.min(state.scroll,Math.max(0,body.length-bodyHeight));const end=body.length-offset;const visible=body.slice(Math.max(0,end-bodyHeight),end);
 const events=state.activity.slice(-Math.max(0,bodyHeight-1)).map(e=>(e.ok===false?'! ':e.phase==='start'?'· ':'✓ ')+e.label);
 const elapsed=state.elapsedMs?' · '+Math.floor(state.elapsedMs/1000)+'s':'';
 const out=[fit(' chode  '+state.workspace,w),fit(' '+state.session+'  ·  '+state.provider+'  ·  '+state.status+elapsed,w), '─'.repeat(w)];
 for(let i=0;i<bodyHeight;i++){const left=fit('  '+(visible[i]||''),mainWidth);out.push(side?left+'│'+fit(i===0?' Activity':events[i-1]||'',side):fit(left,w));}
 const status=state.question?'Answer the question below':state.busy?'Working · Ctrl+C stops this run':state.scroll?'History · PgDn returns to latest':'Ready · Enter sends · Alt+Enter adds a line';
 out.push(fit(' '+status,w),'─'.repeat(w));
 const inputWidth=w-4;
 const displayInput=state.input||(!state.busy?'Ask Chode…':'Write your next prompt…');
 const inputLines=wrap(displayInput,inputWidth);
 const before=graphemes(state.input).slice(0,state.cursor).join('');
 const cursorLines=wrap(before,inputWidth);let cursorRow=cursorLines.length-1,cursorCol=cellWidth(cursorLines[cursorRow]);
 if(cursorCol>=inputWidth){cursorRow++;cursorCol=0;}
 const first=Math.max(0,cursorRow-1);
 out.push(fit(' › '+(inputLines[first]||''),w),fit('   '+(inputLines[first+1]||''),w),fit(' Ctrl+O details · /help · '+(state.details?'details on':'details off'),w));
 while(out.length<h)out.push(' '.repeat(w));
 return {lines:out.slice(0,h),cursor:{row:Math.min(h-1,h-3+cursorRow-first),column:Math.min(w-1,3+cursorCol)}};
}
module.exports={safe,graphemes,cellWidth,fit,wrap,createState,addMessage,insert,key,frame};
