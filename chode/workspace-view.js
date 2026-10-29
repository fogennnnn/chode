'use strict';
const ui = require('./terminal-ui');
const {formatElapsed}=require('./elapsed');
const commands = require('./workspace-commands').commands;
let packageVersion='';try{packageVersion=String(require('./package.json').version||'');}catch(_){}
const segmenter = new Intl.Segmenter(undefined,{granularity:'grapheme'});
const wrappingCache=new WeakMap();
const fittingCache=new Map();
function messageLines(message,columns){const cached=wrappingCache.get(message);if(cached&&cached.columns===columns&&cached.text===message.text)return cached.lines;const lines=wrap(message.text,columns);wrappingCache.set(message,{columns,text:message.text,lines});return lines;}
function graphemes(text){return [...segmenter.segment(String(text))].map(x=>x.segment);}
function safe(text){return String(text==null?'':text).replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g,'').replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'').replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g,'');}
function cellWidth(text){return graphemes(safe(text)).reduce((n,g)=>n+width(g),0);}
function width(g){if(/^\p{Mark}+$/u.test(g))return 0;const c=g.codePointAt(0);return /\p{Extended_Pictographic}/u.test(g)||c>=0x1100&&(c<=0x115f||c>=0x2e80&&c<=0xa4cf||c>=0xac00&&c<=0xd7a3||c>=0xf900&&c<=0xfaff||c>=0xfe10&&c<=0xfe6f||c>=0xff00&&c<=0xff60||c>=0x20000)?2:1;}
function fit(text,columns){const key=columns+'\0'+text;const cached=fittingCache.get(key);if(cached!==undefined)return cached;let s='',used=0;for(const g of graphemes(safe(text).replace(/\n/g,' '))){const n=width(g);if(used+n>columns)break;s+=g;used+=n;}const result=s+' '.repeat(Math.max(0,columns-used));if(fittingCache.size>=1024)fittingCache.delete(fittingCache.keys().next().value);fittingCache.set(key,result);return result;}
function wrap(text,columns){const lines=[];for(const line of safe(text).replace(/\t/g,'    ').split('\n')){let out='',n=0;for(const g of graphemes(line)){const w=width(g);if(n+w>columns){lines.push(out);out='';n=0;}if(w<=columns){out+=g;n+=w;}}lines.push(out);}return lines;}
function createState(context={}){return {workspace:context.workspace||process.cwd(),session:context.session||'default',provider:context.provider||'auto',mode:context.mode==='plan'?'plan':'execute',messages:[],activity:[],input:'',cursor:0,history:[],historyIndex:0,details:false,scroll:0,busy:false,status:'Ready',draft:'',question:null,paste:false,logView:null};}
function addMessage(state,role,text,extra){const message={role,text:safe(text).slice(0,100000)};if(extra)for(const k of ['turn','log','logComplete'])if(extra[k]!==undefined)message[k]=extra[k];state.messages.push(message);if(state.messages.length>200)state.messages.splice(0,state.messages.length-200);}
function insert(state,text){const a=graphemes(state.input);const inserted=graphemes(safe(text));a.splice(state.cursor,0,...inserted);state.input=a.join('');state.cursor+=inserted.length;}
function key(state,text,key={}){
 const name=key.name||'';
 if(state.logView){if(name==='escape'||key.ctrl&&name==='c'){state.logView=null;state.scroll=0;state.status=state.busy?'Working':'Ready';return;}if(name==='pageup'){state.scroll+=10;return;}if(name==='pagedown'){state.scroll=Math.max(0,state.scroll-10);return;}if(key.shift&&name==='up'){state.scroll+=3;return;}if(key.shift&&name==='down'){state.scroll=Math.max(0,state.scroll-3);return;}return;}
 if(key.sequence==='\x1b[200~'){state.paste=true;return;}
 if(key.sequence==='\x1b[201~'){state.paste=false;return;}
 if(state.paste){insert(state,name==='return'?'\n':text||'');return;}
 if(key.ctrl&&name==='c'){if(state.busy)return {type:'cancel'};if(state.input){state.input='';state.cursor=0;return;}return {type:'exit'};}
 if(key.ctrl&&name==='d')return {type:state.busy?'cancel':'exit'};
 if(state.question&&['up','down','tab'].includes(name))return;
 if(state.question&&key.ctrl&&name==='p')return;
 if(key.ctrl&&name==='p'){state.input='/';state.cursor=1;state.completionBase=null;return;}
 if(name!=='tab')state.completionBase=null;
 if(key.ctrl&&name==='o'){state.details=!state.details;return;}
 if(name==='pageup'){state.scroll+=10;return;}
 if(name==='pagedown'){state.scroll=Math.max(0,state.scroll-10);return;}
 if(key.shift&&name==='up'){state.scroll+=3;return;}
 if(key.shift&&name==='down'){state.scroll=Math.max(0,state.scroll-3);return;}
 if(name==='escape'){state.input='';state.cursor=0;if(state.question)return {type:'answer',value:null};return;}
 if(name==='return'&&!(key.shift||key.meta)){const prompt=state.input.trim();if(!prompt)return state.question?{type:'hint',value:'No input received. Paste with your terminal\u2019s own paste command (e.g. right-click), then press Enter.'}:undefined;state.input='';state.cursor=0;state.scroll=0;if(state.question)return {type:'answer',value:prompt};if(state.busy&&!/^\/(quit|exit|help|details|activity|sources|status|tools|models|providers|sessions|queue)(?:\s|$)/.test(prompt)){insert(state,prompt);return;}state.history.push(prompt);state.historyIndex=state.history.length;return {type:prompt.startsWith('/')?'command':'submit',value:prompt};}
 if(name==='return'&&(key.shift||key.meta)||key.ctrl&&name==='j'){insert(state,'\n');return;}
 const chars=graphemes(state.input);
 if(name==='left'){state.cursor=Math.max(0,state.cursor-1);return;}
 if(name==='right'){state.cursor=Math.min(chars.length,state.cursor+1);return;}
 if(name==='home'||key.ctrl&&name==='a'){state.cursor=state.cursor===0?0:chars.lastIndexOf('\n',state.cursor-1)+1;return;}
 if(name==='end'||key.ctrl&&name==='e'){const end=chars.indexOf('\n',state.cursor);state.cursor=end<0?chars.length:end;return;}
 if(name==='backspace'){if(state.cursor){chars.splice(--state.cursor,1);state.input=chars.join('');}return;}
 if(name==='delete'){chars.splice(state.cursor,1);state.input=chars.join('');return;}
 if(key.ctrl&&name==='u'){state.input=chars.slice(state.cursor).join('');state.cursor=0;return;}
 if((name==='up'||name==='down')&&state.input.includes('\n')){const start=state.cursor===0?0:chars.lastIndexOf('\n',state.cursor-1)+1;const col=state.cursor-start;if(name==='up'&&start){const end=start-1;const previous=end===0?0:chars.lastIndexOf('\n',end-1)+1;state.cursor=previous+Math.min(col,end-previous);}else if(name==='down'){const end=chars.indexOf('\n',state.cursor);if(end>=0){const next=end+1;const nextEnd=chars.indexOf('\n',next);state.cursor=next+Math.min(col,(nextEnd<0?chars.length:nextEnd)-next);}}return;}
 if(name==='up'||name==='down'){if(name==='up'&&state.historyIndex===state.history.length)state.historyDraft=state.input;state.historyIndex=Math.max(0,Math.min(state.history.length,state.historyIndex+(name==='up'?-1:1)));state.input=state.historyIndex===state.history.length?state.historyDraft||'':state.history[state.historyIndex]||'';state.cursor=graphemes(state.input).length;return;}
 if(name==='tab'){const base=state.completionBase||state.input;if(!base.startsWith('/'))return;const matches=commands.filter(s=>s.startsWith(base));if(matches.length){if(state.completionBase===base)state.completionIndex=(state.completionIndex+(key.shift?-1:1)+matches.length)%matches.length;else{state.completionBase=base;state.completionIndex=key.shift?matches.length-1:0;}state.input=matches[state.completionIndex]+' ';state.cursor=graphemes(state.input).length;}return;}
 if(!key.ctrl&&!key.meta&&text){insert(state,text);}
}
function border(text,width){const label=fit(text,width-1).trimEnd();return label+'─'.repeat(Math.max(0,width-1-cellWidth(label)))+'╮';}
function bottom(text,width){const label=fit(text,width-1).trimEnd();return label+'─'.repeat(Math.max(0,width-1-cellWidth(label)))+'╯';}
function bottomRight(left,right,width){const r=String(right||'');if(!r||cellWidth(left)>width-1-cellWidth(r)-3)return bottom(left,width);const l=fit(left,width-1-cellWidth(r)).trimEnd();const fill='─'.repeat(Math.max(0,width-1-cellWidth(l)-cellWidth(r)));return l+fill+r+'╯';}
function frame(state,columns=80,rows=24){
 const secret=!!state.question?.secret,masked=secret?'•'.repeat(graphemes(state.input).length):state.input;
 const w=Math.max(1,Math.floor(columns)),h=Math.max(1,Math.floor(rows));
 if(w<20||h<8){const lines=Array.from({length:h},()=> ' '.repeat(w));lines[0]=fit('Chode · '+state.status,w);if(h>2)lines[1]=fit('Enlarge terminal for the workspace',w);lines[h-1]=fit('› '+masked,w);return {lines,cursor:{row:h-1,column:Math.min(w-1,2+cellWidth(graphemes(state.input).slice(0,state.cursor).join('')))},hits:[]};}
 const side=state.details&&w>=100?30:0,mainWidth=w-side-(side?1:0),contentWidth=Math.max(4,mainWidth-4);
 const bodyHeight=h-8;const body=[],bodyHits=[];
 if(state.logView){
  body.push('','Prompt log · '+String(state.logView.title||'Prompt'),'');
  if(state.logView.file)body.push('File · '+String(state.logView.file),'');
  const raw=String(state.logView.text||'').replace(/\r\n?/g,'\n').split('\n');
  const shown=600;
  if(raw.length>shown)body.push('['+(raw.length-shown)+' earlier lines hidden; full log is saved on disk]','');
  for(const line of raw.slice(-shown))body.push(...wrap(line,contentWidth));
  body.push('','Esc or Ctrl+C closes this log · wheel, PgUp/PgDn scroll');
 }else{
  for(const m of state.messages){body.push('',m.role==='user'?'You'+(m.turn?' · log':''):m.role==='assistant'?'Chode':'Notice');const start=body.length-1;body.push(...messageLines(m,contentWidth));if(m.role==='user'&&m.turn)for(let i=start;i<body.length;i++)bodyHits[i]={turn:m.turn,title:String(m.text||'').replace(/\s+/g,' ').slice(0,120)};}
  if(state.draft){body.push('','Draft · checking before completion',...wrap(state.draft,contentWidth));}
  if(state.details&&!side&&state.activity.length){body.push('','Activity');for(const e of state.activity.slice(-6))body.push(...wrap((e.ok===false?'! ':e.ok===true?'✓ ':'· ')+e.label,contentWidth));}
  if(!body.length){const center=text=>' '.repeat(Math.max(0,Math.floor((contentWidth-cellWidth(text))/2)))+text;body.push(...Array(Math.max(0,Math.floor((bodyHeight-9)/2))).fill(''),center('c h o d e'),'',center('What are we building?'),'',center('Build a program · Design a website · Understand a binary'),'',center('Ctrl+P commands   /models providers   @file context'));}
  if(!state.question&&state.input.startsWith('/')&&!/\s/.test(state.input)){const matches=commands.filter(x=>x.startsWith(state.input));if(matches.length)body.push('','Commands · Tab completes',...wrap(matches.join('  '),contentWidth));}
 }
 const offset=Math.min(state.scroll,Math.max(0,body.length-bodyHeight));const end=body.length-offset;const start=Math.max(0,end-bodyHeight);const visible=body.slice(start,end);const hits=[];if(!state.logView)for(let i=0;i<visible.length;i++){const hit=bodyHits[start+i];if(hit)hits.push({row:3+i,start:2,end:mainWidth-1,turn:hit.turn,title:hit.title});}
 const events=state.activity.slice(-Math.max(0,bodyHeight-1)).map(e=>(e.ok===false?'! ':e.ok===true?'✓ ':'· ')+e.label);
 const elapsed=state.elapsedMs?' · '+formatElapsed(state.elapsedMs):'';
 const out=[fit(' ◈ chode  /  '+state.workspace,w),fit(' '+state.session+'  ·  '+(state.mode||'execute')+'  ·  '+state.provider+'  ·  '+state.status+elapsed,w), '─'.repeat(w)];
 for(let i=0;i<bodyHeight;i++){const left=fit('  '+(visible[i]||''),mainWidth);out.push(side?left+'│'+fit(i===0?' Activity':events[i-1]||'',side):fit(left,w));}
 const status=state.logView?'Prompt log · wheel/PgUp/PgDn scroll · Esc closes':state.question?'Answer the question below':state.busy?'Working · Ctrl+C stops this run':state.scroll?'History · wheel/PgDn returns to latest':'Ready · Enter sends · click a You prompt for its full log';
 out.push(fit(' '+status,w),border('╭─ '+(state.logView?'Log':state.question?'Reply':state.busy?'Working':'Build')+' · '+state.provider+' ',w));
 const inputWidth=w-5;
 const displayInput=state.logView?'Esc closes the log':masked||(!state.busy?'Ask Chode…':'Write your next prompt…');
 const inputLines=wrap(displayInput,inputWidth);
 const before=graphemes(masked).slice(0,state.cursor).join('');
 const cursorLines=wrap(before,inputWidth);let cursorRow=cursorLines.length-1,cursorCol=cellWidth(cursorLines[cursorRow]);
 if(cursorCol>=inputWidth){cursorRow++;cursorCol=0;}
 const first=Math.max(0,cursorRow-1);
 out.push(fit('│› '+(inputLines[first]||''),w-1)+'│',fit('│  '+(inputLines[first+1]||''),w-1)+'│',bottomRight('╰─ Ctrl+P commands · Ctrl+O activity · /help ',packageVersion?'v'+packageVersion:'',w));
 while(out.length<h)out.push(' '.repeat(w));
 return {lines:out.slice(0,h),cursor:{row:Math.min(h-1,h-3+cursorRow-first),column:Math.min(w-1,3+cursorCol)},hits};
}
module.exports={safe,graphemes,cellWidth,fit,wrap,createState,addMessage,insert,key,frame};
