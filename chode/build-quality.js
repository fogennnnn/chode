'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
function website(request){return /\b(?:website|web\s*site|web\s*page|landing\s+page)\b/i.test(request)&&/\b(?:build|create|make|implement|recreate|copy|generate|write)\b/i.test(request);}
function multiPage(request){return /\b(?:multi[ -]?page|multiple pages|full[ -]?stack|backend|database|authentication|checkout)\b/i.test(request)||new Set((String(request).match(/\b[\w-]+\.html?\b/gi)||[]).map(x=>x.toLowerCase())).size>1||/\bpages\s*:\s*\S/i.test(request);}
function instructions(request){if(!website(request))return '';return '\n[BUILD COMPLETION CONTRACT]\nThe original brief is the acceptance contract. Inventory every requested page, section, interaction, data flow and constraint before implementation. Build the entire requested scope, not a landing-page substitute. Preserve existing working behavior. Use real navigation, responsive layouts, accessible controls, loading/empty/error states where needed, and working interactions. Do not use dummy links, fabricated success messages, placeholder content or pretend integrations. Run the available build/tests, inspect the rendered result at mobile and desktop sizes when browser tools are available, and exercise the requested user journeys. Fix observed failures and recheck. If an external credential/service is unavailable, implement and test the local behavior, and explicitly report the remaining dependency; never claim the live integration works. Finish with the actual entry point, checks run and remaining limitations. A file existing or a reviewer saying PASS alone does not demonstrate completeness.\n[END BUILD COMPLETION CONTRACT]\n';}
function attr(tag,name){const m=new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i').exec(tag);return m&&(m[1]??m[2]??m[3]);}
function htmlIssues(html,{root,file,selfContained=false,request=''}={}){
 const issues=[],push=x=>{if(!issues.includes(x))issues.push(x);};
 const markup=html.replace(/<!--[^]*?-->/g,'').replace(/<(script|style)\b([^>]*)>[^]*?<\/\1\s*>/gi,'<$1$2></$1>');
 const visible=markup.replace(/<[^>]+>/g,' ');
 if(!/\b(?:placeholder|lorem ipsum|coming soon)\b/i.test(request)&&/\b(?:lorem ipsum|coming soon|TODO:|your content here)\b/i.test(visible))push('replace unfinished placeholder content');
 for(const m of markup.matchAll(/<(?:a|img|script|link|source)\b[^>]*>/gi)){
  const tag=m[0],url=attr(tag,/^<(?:img|script|source)\b/i.test(tag)?'src':'href');if(url==null)continue;
  if(/^<a\b/i.test(tag)&&(!url.trim()||url==='#'||/^javascript\s*:/i.test(url)))push('replace empty or dummy navigation links');
  if(url.startsWith('#')&&url.length>1){let id;try{id=decodeURIComponent(url.slice(1));}catch{push('repair malformed fragment URL');continue;}if(![...markup.matchAll(/<[a-z][^>]*>/gi)].some(x=>attr(x[0],'id')===id||attr(x[0],'name')===id))push('missing anchor target: '+id+' — add id="'+id+'" to the matching section or point the link at an existing target');continue;}
  if(!url||/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(url))continue;
  if(selfContained){push('self-contained output references local dependency: '+url);continue;}
  if(root&&file){let clean;try{clean=decodeURIComponent(url.split(/[?#]/)[0]);}catch{push('repair malformed local URL');continue;}const full=path.resolve(url.startsWith('/')?root:path.dirname(file),'.'+(url.startsWith('/')?'':'/')+clean),rel=path.relative(root,full);if(rel.startsWith('..')||path.isAbsolute(rel))push('local URL leaves the project: '+url);else if(!fs.existsSync(full))push('missing local link or asset: '+url);else if(/^<script\b/i.test(tag)){try{const source=fs.readFileSync(full,'utf8');if(/^\s*(?:const|let|var)\s+[^;=\n]+\s*=\s*require\s*\(/m.test(source)&&!/(?:function\s+require\b|(?:const|let|var)\s+require\s*=)/.test(source))push('browser script uses Node.js require without a browser loader: '+url);}catch{}}}
 }
 for(const m of html.matchAll(/<script\b([^>]*)>([^]*?)<\/script\s*>/gi)){if(attr(m[1],'src')||/\b(?:application\/ld\+json|application\/json|module|importmap)\b/i.test(attr(m[1],'type')||''))continue;try{new vm.Script(m[2]);}catch(e){push('inline JavaScript syntax: '+e.message);}}
 return issues;
}
function documentIssues(html){
 const issues=[];
 for(const tag of ['html','head','body'])if(!new RegExp('<'+tag+'\\b','i').test(html))issues.push('missing document structure: '+tag);
 if(!/<title\b[^>]*>\s*[^<\s][^<]*<\/title\s*>/i.test(html))issues.push('missing descriptive page title');
 if(!/<meta\b[^>]*name\s*=\s*["']?viewport\b/i.test(html))issues.push('missing responsive viewport');
 return issues;
}
function check(root,request,files){if(!website(request))return [];const checks=[];for(const f of files){if(/\.(?:[cm]?js|css)$/i.test(f)){const full=path.resolve(root,f),rel=path.relative(root,full);if(!rel.startsWith('..')&&!path.isAbsolute(rel))try{const text=fs.readFileSync(full,'utf8');if(/^\s*(?:(?:\/\/[^\n]*(?:\n|$))|(?:\/\*[\s\S]*?\*\/)|\s)*$/.test(text))checks.push({check:'Website implementation: '+f,ok:false,detail:'file is empty or contains only comments; implement the requested behavior'});}catch{}continue;}if(!/\.html?$/i.test(f))continue;const full=path.resolve(root,f),rel=path.relative(root,full);if(rel.startsWith('..')||path.isAbsolute(rel))continue;try{if(fs.statSync(full).size>2e6)continue;for(const issue of [...htmlIssues(fs.readFileSync(full,'utf8'),{root,file:full,request}),...documentIssues(fs.readFileSync(full,'utf8'))])checks.push({check:'Website integrity: '+f,ok:false,detail:issue});}catch(e){checks.push({check:'Website artifact: '+f,ok:false,detail:e.message});}}
 // Only enforce literal HTML deliverable names, never invent framework route filenames.
 const names=[...new Set((String(request).replace(/https?:\/\/\S+/g,'').match(/\b[\w-]+\.html?\b/gi)||[]))];
 for(const name of names){if(!files.some(f=>path.basename(f).toLowerCase()===name.toLowerCase())&&!fs.existsSync(path.join(root,name)))checks.push({check:'Requested page: '+name,ok:false,detail:'requested HTML deliverable is missing'});}
 return checks;}
module.exports={website,multiPage,instructions,htmlIssues,check};
