'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-entry-startup-'));
try{
 const preload=path.join(temp,'terminal.cjs');fs.writeFileSync(preload,"for(const s of [process.stdin,process.stdout,process.stderr])Object.defineProperty(s,'isTTY',{value:true,configurable:true});process.stdin.setRawMode=()=>{};process.stderr.columns=80;process.stderr.rows=24;setTimeout(()=>process.stdin.emit('keypress','',{name:'d',ctrl:true}),100);");
 for(const args of [[],['tui']]){const env={...process.env};delete env.CHODE_LEGACY_REPL;const r=spawnSync(process.execPath,['--require',preload,path.join(root,'chode.js'),...args],{cwd:temp,env,encoding:'utf8',timeout:5000,windowsHide:true});assert.ifError(r.error);assert.equal(r.status,0,'real entry point '+args.join(' ')+': '+r.stdout+r.stderr);assert(r.stderr.includes('\x1b[?1049h'),'workspace actually opens');assert(r.stderr.includes('\x1b[?1049l'),'terminal restores on exit');assert(!/circular dependency|TypeError|ReferenceError/.test(r.stderr),'startup must not access incomplete exports');}
 console.log('PASS: actual CLI main entry point and explicit tui initialize completely, open workspace, exit cleanly and restore terminal');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
