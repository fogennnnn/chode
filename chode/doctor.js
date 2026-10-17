'use strict';
const fs=require('fs');const path=require('path');
function inspect(root=process.cwd(),runtime=__dirname){
 const checks=[];const push=(name,ok,detail)=>checks.push({name,ok,detail});
 push('Node.js version',Number(process.versions.node.split('.')[0])>=18,process.version+' (18+ required)');
 for(const file of ['chode.js','terminal-ui.js','workspace-tui.js','workspace-view.js','workspace-store.js','workspace-commands.js','tui-worker.js','web-context.js','toolbox.js','evidence-ledger.js','json-output.js'])push('Runtime '+file,fs.existsSync(path.join(runtime,file)),file);
 for(const file of ['config.json','pending-tasks.json']){const p=path.join(root,'.chode',file);if(!fs.existsSync(p))continue;try{JSON.parse(fs.readFileSync(p,'utf8'));push('State '+file,true,'valid JSON');}catch(_){push('State '+file,false,'Invalid JSON. Back up and repair '+p);}}
 const npmrc=path.join(root,'.npmrc');if(fs.existsSync(npmrc)){const fd=fs.openSync(npmrc,'r');const header=Buffer.alloc(2);try{fs.readSync(fd,header,0,2,0);}finally{fs.closeSync(fd);}if(header.equals(Buffer.from([255,254]))||header.equals(Buffer.from([254,255])))push('npm configuration encoding',false,'.npmrc is UTF-16; npm expects UTF-8. Convert its encoding without changing credentials.');}
 return {ok:checks.every(x=>x.ok),checks};
}
function repair(root=process.cwd()){
 const p=path.join(root,'.npmrc');if(!fs.existsSync(p))return [];
 const bytes=fs.readFileSync(p);let body;
 if(bytes[0]===255&&bytes[1]===254)body=bytes.subarray(2);
 else if(bytes[0]===254&&bytes[1]===255)body=Buffer.from(bytes.subarray(2)).swap16();
 else return [];
 const backup=p+'.encoding-backup';if(fs.existsSync(backup))throw new Error('Encoding backup already exists; review it before another repair.');
 fs.writeFileSync(backup,bytes,{flag:'wx',mode:0o600});
 fs.writeFileSync(p,body.toString('utf16le'),{encoding:'utf8',mode:0o600});
 return ['Converted .npmrc from UTF-16 to UTF-8; original preserved in .npmrc.encoding-backup.'];
}
function run(argv=[]){let repairs=[],failure=null;try{if(argv.includes('--fix'))repairs=repair();}catch(error){failure={name:'Configuration repair',ok:false,detail:error.message};}let r;try{r={...inspect(),repairs};}catch(error){r={ok:false,checks:[{name:'Local filesystem',ok:false,detail:error.message}],repairs};}if(failure){r.checks.push(failure);r.ok=false;}if(argv.includes('--json'))console.log(JSON.stringify(r));else console.log(repairs.concat(r.checks.map(c=>(c.ok?'✓ ':'! ')+c.name+' — '+c.detail)).join('\n'));if(!r.ok)process.exitCode=1;return r;}
module.exports={inspect,repair,run};
