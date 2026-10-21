'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');
async function fixture(){
 const engine=require('../chode'),text=('const value = "quoted \\ text";\r\n').repeat(300)+'TAIL_MARKER';
 fs.writeFileSync('large.js',text);
 assert.equal(engine.toolRead('large.js').content,text,'legacy direct reads remain complete');
 const actions={reads:0,writes:[],edits:[],execs:[],fetched:[]};let args={file:'large.js'},output='',pages=0;
 do{const result=await engine.runAgentTool({tool:'read',args},{actions});assert(result.ok,result.error);assert(JSON.stringify(result).length<=6000,'tool formatter receives a complete page');output+=result.content;pages++;args=result.nextRead;}while(args);
 assert.equal(output,text);assert(pages>1);assert(output.endsWith('TAIL_MARKER'));
 assert(!(await engine.runAgentTool({tool:'read',args:{file:'large.js',offset:0}},{actions})).ok);
 fs.writeFileSync('.env','SECRET=hidden');assert(!engine.toolRead('.env',{}).ok);assert(!engine.toolRead('../outside.js',{}).ok);
 assert.deepEqual(engine.parseToolCalls('```tool\n{"tool":"read","file":"large.js","offset":3,"limit":2,"column":1}\n```')[0].args,{file:'large.js',offset:3,limit:2,column:1});
 console.log('PASS paged agent reads: complete tail, bounded serialized pages, legacy API, argument parsing and secret/workspace guards');
}
if(process.argv[2]==='--fixture')fixture().catch(error=>{console.error(error);process.exitCode=1;});
else{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-read-pages-'));try{const result=spawnSync(process.execPath,[__filename,'--fixture'],{cwd:dir,encoding:'utf8',windowsHide:true,timeout:10000});assert.ifError(result.error);assert.equal(result.status,0,result.stdout+result.stderr);console.log(result.stdout.trim());}finally{fs.rmSync(dir,{recursive:true,force:true});}}
