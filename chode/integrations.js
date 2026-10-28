'use strict';
const presets={
 cloudflare:{name:'Cloudflare',url:'https://mcp.cloudflare.com/mcp',auth:'oauth',purpose:'Cloudflare account tools; browser consent required',source:'https://developers.cloudflare.com/agent-setup/prompt.md'},
 'openai-docs':{name:'OpenAI documentation',url:'https://developers.openai.com/mcp',auth:'none',purpose:'Public documentation search; does not provide model inference',source:'https://learn.chatgpt.com/learn/docs-mcp'},
 context7:{name:'Context7',url:'https://mcp.context7.com/mcp',auth:'optional token',purpose:'Version-aware library documentation; service limits apply',source:'https://github.com/upstash/context7'},
 github:{name:'GitHub',url:'https://api.githubcopilot.com/mcp/',auth:'token',tokenEnv:'GITHUB_MCP_TOKEN',purpose:'Repository and issue tools; scope your token to intended repositories',source:'https://github.com/github/github-mcp-server'}
};
function openBrowser(url){const u=new URL(url);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Unsafe authorization URL');const {spawn}=require('child_process'),command=process.platform==='win32'?'rundll32':process.platform==='darwin'?'open':'xdg-open',args=process.platform==='win32'?['url.dll,FileProtocolHandler',u.href]:[u.href];return new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:'ignore',windowsHide:true});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});}
async function run(root,argv,options={}){const manager=options.manager||require('./mcp-client').create(root),print=options.print||((value)=>console.log(JSON.stringify(value,null,2)));const [kind,action='list',name,...rest]=argv;const global=rest.includes('--global'),has=flag=>rest.includes(flag),value=flag=>{const i=rest.indexOf(flag);if(i<0)return undefined;if(!rest[i+1]||rest[i+1].startsWith('--'))throw Error('Missing value for '+flag);return rest[i+1];};let result;
 if(kind==='integrations'){
  if(action==='list')result=Object.entries(presets).map(([id,p])=>({id,...p}));
  else if(action==='setup'){const preset=presets[name];if(!preset)throw Error('Choose an integration from chode integrations list');const current=manager.list().find(s=>s.name===name);if(!current){manager.add(name,{url:preset.url,...(preset.tokenEnv?{tokenEnv:preset.tokenEnv}:{}),...(value('--token-env')?{tokenEnv:value('--token-env')}:{})},{global,trust:true});}else if(current.url!==preset.url)throw Error('Existing '+name+' has a different URL; inspect it before replacing it.');result=await manager.probe(name);result.next=result.ready?'Ready in Chode; no restart required.':result.state==='needs_auth'?'Run chode mcp auth '+name:'Run chode mcp test '+name+' after resolving the reported issue.';result.skills=require('./skill-catalog').create(root).list().filter(s=>s.id.includes(name)).map(s=>s.id);}
  else if(action==='status')result=await Promise.all(manager.list().filter(s=>!name||s.name===name).map(s=>manager.probe(s.name)));
  else throw Error('Usage: chode integrations list|setup NAME [--global]|status [NAME]');
 }else if(kind==='mcp'){
  if(action==='list')result=manager.list();
  else if(action==='add'){const split=rest.indexOf('--'),url=value('--url');if(!name)throw Error('A server name is required');if(url&&split>=0)throw Error('Choose HTTP or stdio');result=manager.add(name,url?{url,...(value('--token-env')?{tokenEnv:value('--token-env')}: {})}:split>=0?{transport:'stdio',command:rest[split+1],args:rest.slice(split+2)}:{},{global,trust:true});}
  else if(action==='trust')result=manager.trust(name);
  else if(action==='test')result=await manager.probe(name);
  else if(action==='tools')result=await manager.tools(name);
  else if(action==='schema')result=await manager.schema(name,rest[0]);
  else if(action==='call'){let args={};try{args=JSON.parse(rest[1]||'{}');}catch{throw Error('Tool arguments must be JSON');}result=await manager.call(name,rest[0],args);}
  else if(action==='auth'){if(!process.stdin.isTTY&&!options.onAuthorize)throw Error('OAuth requires an interactive terminal: chode mcp auth '+name);result=await manager.auth(name,{onAuthorize:options.onAuthorize||(async url=>{console.log('Opening browser for '+name+' authorization…');await openBrowser(url);})});}
  else if(action==='logout')result=manager.logout(name);
  else if(action==='remove')result=manager.remove(name,{global});
  else throw Error('Usage: chode mcp add|list|trust|test|tools|schema|call|auth|logout|remove');
 }else throw Error('Unknown integration command');print(result);if(result?.ok===false)process.exitCode=1;return result;
}
module.exports={run,presets,openBrowser};
