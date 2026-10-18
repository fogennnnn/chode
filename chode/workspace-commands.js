'use strict';
const fs=require('fs');const path=require('path');const store=require('./workspace-store');
const commands=['/theme','/export','/connect','/timeout','/help','/details','/activity','/session','/sessions','/model','/models','/new','/status','/doctor','/tools','/todo','/queue','/retry','/jobs','/rewind','/sources','/plan','/task','/quit'];
function run(text,state,engine,root=process.cwd()){
 const [name,...args]=text.trim().split(/\s+/);const message=args.join(' ');
 if(name==='/theme'){if(!['dark','light','system'].includes(args[0]))return {text:'Use /theme dark, /theme light, or /theme system.'};state.theme=args[0];return {text:'Theme: '+args[0]};}
 if(name==='/connect')return {text:'Choose a provider with /models and /model <id>.\nKeyless providers need no setup. For API keys, exit and run chode quickkey <provider-id>; do not paste credentials into a prompt.'};
 if(name==='/export'){const directory=path.join(root,'.chode','exports');fs.mkdirSync(directory,{recursive:true});const file=path.join(directory,'conversation-'+Date.now()+'-'+require('crypto').randomBytes(3).toString('hex')+'.md');const markdown=state.messages.map(m=>'## '+(m.role==='user'?'You':m.role==='assistant'?'Chode':'Notice')+'\n\n'+m.text).join('\n\n');fs.writeFileSync(file,markdown,{flag:'wx',mode:0o600});return {text:'Conversation exported to '+file};}
 if(name==='/timeout'){if(!args.length)return {text:'Request limit: '+(state.timeoutSeconds||180)+' seconds. Use /timeout <10–1800 seconds>. Time spent answering questions does not count.'};const seconds=Number(args[0]);if(!Number.isInteger(seconds)||seconds<10||seconds>1800)return {text:'Use /timeout <10–1800 seconds>.'};state.timeoutSeconds=seconds;return {text:'Request limit set to '+seconds+' seconds.'};}
 if(name==='/doctor'){const doctor=require('./doctor');const repairs=args.includes('--fix')?doctor.repair(root):[];return {text:repairs.concat(doctor.inspect(root,__dirname,{rea:args.includes('--rea')}).checks.map(c=>(c.ok?'✓ ':'! ')+c.name+' — '+c.detail)).join('\n')};}
 if(name==='/tools')return {text:Object.entries(engine.TOOLS).map(([id,t])=>id+' — '+t.desc).join('\n')};
 if(name==='/models')return {text:'Use /model <id> to select a provider.\n'+Object.entries(engine.PROVIDERS).map(([id,p])=>id+' — '+p.name).join('\n')};
 if(name==='/status'){const lb=engine.loadLeaderboard();return {text:'Session: '+state.session+'\nProvider selection: '+state.provider+'\nQueued tasks: '+engine.loadPendingTasks().length+'\nSaved provider ranking: '+((lb.ranked||[]).slice(0,5).map(x=>x.id).join(', ')||'not scanned')+'\nUse chode scan to refresh live health.'};}
 if(name==='/sessions'){let names=[];for(const dir of ['sessions','workspace'])try{names.push(...fs.readdirSync(path.join(root,'.chode',dir)).filter(x=>/^[\w-]+\.json$/.test(x)).map(x=>x.slice(0,-5)));}catch(_){}names=[...new Set(names)].sort();return {text:names.length?names.slice(0,50).map(n=>(n===state.session?'● ':'○ ')+n).join('\n'):'No saved sessions yet. Use /session <name> to start one.'};}
 if(name==='/session'){if(!/^[a-zA-Z0-9_-]{1,64}$/.test(args[0]||''))return {text:'Use /session <name> (letters, numbers, hyphens, underscores).'};return {session:args[0],messages:store.load(root,args[0])};}
 if(name==='/queue'){const tasks=engine.loadPendingTasks();return {text:tasks.length?tasks.map(t=>t.id+' — '+String(t.prompt).replace(/\s+/g,' ').slice(0,160)).join('\n')+'\nRetry with /retry <id>.':'Queue is empty.'};}
 if(name==='/retry'){const task=engine.loadPendingTasks().find(x=>x.id===args[0]);return task?{prompt:task.prompt,retryId:task.id,session:task.session,messages:task.session?store.load(root,task.session):undefined}:{text:'Use /retry <id>. Find saved prompts with /queue.'};}
 if(name==='/todo'){const action=args[0]||'list';if(!['list','add','done'].includes(action))return {text:'Use /todo list, /todo add <text>, or /todo done <id>.'};const r=engine.toolTodo({action,text:args.slice(1).join(' '),id:args[1]},{session:state.session});return {text:!r.ok?r.error:action==='list'?(r.todos||[]).map(t=>'[ ] '+t.id+' '+t.text).join('\n')||'No open todos.':action==='add'?'Todo added.':'Todo completed.'};}
 if(name==='/jobs'){const jobs=engine.listJobs();return {text:jobs.length?jobs.map(j=>j.id+' ['+j.status+'] '+j.cmd).join('\n'):'No background jobs.'};}
 if(name==='/rewind'){if(!args[0])return {text:engine.listSnapshots().slice(0,10).map(s=>s.id+' — '+s.label).join('\n')||'No file checkpoints yet.'};const r=engine.restoreSnapshot(args[0],{});return {text:r.ok?'Restored '+r.restored.length+' file(s).':r.error};}
 if(name==='/sources')return {text:state.sources&&state.sources.length?state.sources.map(s=>s.id+' — '+s.locator+'\n  retrieved '+s.observedAt).join('\n'):'No retrieved sources recorded for the latest answer.'};
 if(name==='/activity')return {text:state.activity.length?state.activity.slice(-50).map(e=>(e.ok===false?'! ':e.ok===true?'✓ ':'· ')+e.label+(e.detail?'\n  '+e.detail:'')).join('\n'):'No activity recorded yet.'};
 if(name==='/plan'||name==='/task')return message?{prompt:message,mode:name.slice(1)}:{text:'Use '+name+' <goal>.'};
 return null;
}
function acknowledge(engine,id,result){if(id&&require('./terminal-ui').successfulResult(result))engine.savePendingTasks(engine.loadPendingTasks().filter(t=>t.id!==id));}
module.exports={commands,run,acknowledge};
