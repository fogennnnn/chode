// prompt-integrity: the session-start prompt hash is recorded once via the
// HELIOS hook; per-turn transcript growth must not re-record or move it.
(async()=>{
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const cwd=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chode-prompt-int-'));
process.chdir(tmp);
try{
const e=require('../chode');
const seen=[];
const prevHook=e.__testHooks.heliosPromptRecord;
e.__testHooks.heliosPromptRecord=function(wu){seen.push(wu);return null;};
try{
const ai=async()=>({result:'DONE',provider:'mock'});
await e.runAgentLoop('Reply with the single word OK.',null,null,{maxModelCalls:1},ai,()=>{});
}catch(err){/* budget-exhaustion path ends the loop; the record is already captured */}
finally{if(prevHook===undefined)delete e.__testHooks.heliosPromptRecord;else e.__testHooks.heliosPromptRecord=prevHook;}
assert.strictEqual(seen.length,1,'prompt hash recorded exactly once, saw '+seen.length);
assert.ok(seen[0].result&&/^[0-9a-f]{64}$/.test(seen[0].result.promptHash),'record carries a sha256 prompt hash, saw '+JSON.stringify(seen[0]&&seen[0].result));
// Unconfigured machines stay silent: with no seam and no HELIOS token,
// the loop must not attempt network bootstrap (no stderr chatter).
const capturedErr=[];
const prevErrWrite=process.stderr.write.bind(process.stderr);
process.stderr.write=(chunk,enc,cb)=>{capturedErr.push(String(chunk));if(typeof enc==='function')enc();else if(typeof cb==='function')cb();return true;};
try{
delete e.__testHooks.heliosPromptRecord;
const quiet=await e.runAgentLoop('Say DONE.',null,null,{maxModelCalls:2},async()=>({result:'DONE',provider:'mock'}),()=>{});
assert.ok(quiet,'unconfigured loop still completes');
assert.ok(!capturedErr.some(x=>/helios/i.test(x)),'no HELIOS bootstrap noise without a token, saw '+JSON.stringify(capturedErr.slice(0,3)));
}finally{process.stderr.write=prevErrWrite;}
  // Ledger wire shape: the HELIOS API takes content as a STRING
  // ('{"content":"paste AI output here","model":"gpt-4"}'). An object
  // content gets HTTP 400 'content is required'.
  {
    const ledger = require('../helios-ledger.js');
    const payload = ledger.buildRecordPayload({ id: 'shape-1', task: 'probe', files: [], result: { note: 'probe' } }, {});
    assert.strictEqual(typeof payload.body.content, 'string', 'wire content must be a string, saw ' + typeof payload.body.content);
    assert.strictEqual(payload.contentHash, ledger.sha256Hex(payload.body.content), 'top-level content_hash must hash the exact wire string');
    assert.deepStrictEqual(Object.keys(payload.body).sort(), ['content', 'model'], 'wire body must be flat (server D1 rejects nested objects), saw ' + Object.keys(payload.body).join(','));
  }

console.log('PASS prompt integrity: session-start hash recorded once');
}finally{process.chdir(cwd);fs.rmSync(tmp,{recursive:true,force:true});}
})();
