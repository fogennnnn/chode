'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),http=require('http');
(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chode-swebench-hydrate-'));
  const server=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://x');
    assert.equal(u.searchParams.get('revision'),'rev1','pinned revision requested');
    const body=u.searchParams.get('offset')==='0'
      ?{rows:[{row:{instance_id:'x__y-1',problem_statement:'fix it'}}],num_rows_total:1}
      :{rows:[],num_rows_total:1};
    res.end(JSON.stringify(body));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
    const port=server.address().port;
    fs.writeFileSync(path.join(dir,'in.json'),JSON.stringify({source:'test',datasetRevision:'rev1',count:1,instances:[{instance_id:'x__y-1',repo:'https://github.com/x/y',base_commit:'abc'}]}));
    const out=await new Promise((resolve,reject)=>{
      const c=cp.spawn(process.execPath,[path.resolve(__dirname,'../benchmarks/swebench-hydrate.cjs'),'--instances',path.join(dir,'in.json'),'--out',path.join(dir,'out.json'),'--revision','rev1','--dataset','test/ds','--endpoint','http://127.0.0.1:'+port],{encoding:'utf8',timeout:60000});
      let stdout='',stderr='';c.stdout.on('data',d=>stdout+=d);c.stderr.on('data',d=>stderr+=d);
      c.on('error',reject);c.on('close',code=>resolve({code,stdout,stderr}));
    });
    assert.equal(out.code,0,out.stdout+out.stderr);
    const hydrated=JSON.parse(fs.readFileSync(path.join(dir,'out.json'),'utf8'));
    assert.equal(hydrated.datasetRevision,'rev1','header preserved');
    assert.equal(hydrated.instances[0].problem_statement,'fix it','problem statement hydrated from pinned rows');
    console.log('PASS swebench-hydrate: problem statements fetched at pinned revision, header preserved');
  }finally{server.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
