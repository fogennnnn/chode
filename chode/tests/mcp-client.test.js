'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const {create,normalize,safeOutput}=require('../mcp-client');
async function main(){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-mcp-')),root=path.join(temp,'project'),home=path.join(temp,'home');fs.mkdirSync(root);fs.mkdirSync(home);
 let calls=0;
 const server=http.createServer(async(req,res)=>{if(req.method==='GET'){res.writeHead(405).end();return;}if(req.method==='DELETE'){res.writeHead(204).end();return;}let text='';for await(const chunk of req)text+=chunk;const msg=JSON.parse(text);if(!('id'in msg)){res.writeHead(202).end();return;}calls++;if(req.url==='/slow'&&msg.method==='tools/list')return;let result;
 if(msg.method==='initialize')result={protocolVersion:msg.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'fixture',version:'1'}};
 else if(msg.method==='tools/list')result={tools:[{name:'echo',description:'Return data',inputSchema:{type:'object',properties:{text:{type:'string'}}}}]};
 else if(msg.method==='tools/call')result={content:[{type:'text',text:JSON.stringify({answer:msg.params.arguments.text,access_token:'fixture-secret'})}]};
 else {res.writeHead(400).end();return;}res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({jsonrpc:'2.0',id:msg.id,result}));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const manager=create(root,{home}),url='http://127.0.0.1:'+server.address().port+'/mcp';manager.add('local',{url});assert.equal((await manager.probe('local')).state,'untrusted');assert.equal(calls,0);manager.trust('local');assert((await manager.probe('local')).ready);assert.equal((await manager.tools('local')).tools[0].name,'echo');assert.equal((await manager.schema('local','echo')).inputSchema.type,'object');const result=await manager.call('local','echo',{text:'working'});assert(result.ok);assert(result.result.content[0].text.includes('working'));assert(!JSON.stringify(result).includes('fixture-secret'));assert.equal(manager.list()[0].ready,false,'list must not imply a live handshake');manager.add('slow',{url:'http://127.0.0.1:'+server.address().port+'/slow',timeoutMs:1000},{trust:true});const start=Date.now();assert(!(await manager.probe('slow')).ready);assert(Date.now()-start<4000,'discovery must honor configured timeout');manager.add('local',{url:url+'/changed'});assert.equal((await manager.probe('local')).state,'untrusted','changed config invalidates trust');assert.throws(()=>normalize({url:'http://remote.invalid/mcp'}));assert.throws(()=>normalize({url:'https://user:secret@example.org/mcp'}));assert.throws(()=>normalize({transport:'stdio',command:'node',env:{API_KEY:'literal'}}));assert.equal(safeOutput({access_token:'secret'}).access_token,'[redacted]');fs.writeFileSync(path.join(root,'.chode/mcp.json'),'{broken');assert.throws(()=>manager.list(),/preserved/);assert.equal(fs.readFileSync(path.join(root,'.chode/mcp.json'),'utf8'),'{broken');
 console.log('PASS MCP: real SDK HTTP handshake, discovery, schema, calls, redaction, trust invalidation, private config and corrupt-state preservation');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(temp,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
