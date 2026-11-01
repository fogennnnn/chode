'use strict';
const crypto=require('crypto'),{request}=require('./provider-request'),{canonical,hash,HEX}=require('./reliability-store');
const DEFAULT_DEBTAUR='https://ooooo.fogeboro.workers.dev',DEFAULT_HELIOS='https://ai.oooooooooo.se';
function endpoint(value,defaultValue){const u=new URL(value||defaultValue);if(u.username||u.password||u.search||u.hash||u.pathname!=='/'||!(u.protocol==='https:'||u.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Integration endpoint must be an HTTPS origin (HTTP allowed only on loopback)');return u.origin;}
async function json(url,options={},transport={}){let retryAfterMs=null;const fetcher=async(...args)=>{const response=await (transport.fetch||fetch)(...args);retryAfterMs=require('./provider-capacity').retryAfter(response.headers?.get?.('retry-after'));return response;};const response=await request(fetcher,url,options,transport.signal,{timeoutMs:transport.timeoutMs||5000,maxBytes:131072});const data=await response.json();if(!response.ok){const error=Error('Integration HTTP '+response.status);error.status=response.status;error.retryAfterMs=retryAfterMs;throw error;}return data;}
async function judge(grounded,options={}){
 const origin=endpoint(options.endpoint,DEFAULT_DEBTAUR),prompt='this memory is reusable',world=['all grounded are reusable',...(grounded?['this memory is grounded']:[])];
 const result=await json(origin+'/api/judge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,world,beam:1})},options);
 if(result.backend!=='wasm'||result.direct?.proposition!==prompt||!['allow','deny','refuted'].includes(result.direct?.verdict))throw Error('Debtaur returned an invalid or unrecognized proof');
 return {allowed:grounded===true&&result.direct.verdict==='allow'&&result.direct.why==='derived',backend:'wasm',verdict:result.direct.verdict,policy:'grounded-recall-v1',inputHash:hash({world,prompt}),proofHash:hash(result.direct)};
}
function verifyReceipt(record,proof,publicKey,expectedHash,root){
 try{
  if(!HEX.test(expectedHash)||record.content_hash!==expectedHash||proof.content_hash!==expectedHash||proof.record_id!==record.id||proof.signature!==record.signature||proof.timestamp!==record.timestamp||!Number.isSafeInteger(record.merkle_index)||record.merkle_index<0||proof.merkle_index!==record.merkle_index||!HEX.test(proof.merkle_root)||!Array.isArray(proof.merkle_proof)||proof.merkle_proof.length>64||!/^[a-f0-9]{128}$/i.test(record.signature))return false;
  if(publicKey?.kty!=='OKP'||publicKey.crv!=='Ed25519')return false;
  if(!root||root.root!==proof.merkle_root||!Number.isSafeInteger(root.record_count)||root.record_count<1||record.merkle_index>=root.record_count||proof.merkle_proof.length!==Math.ceil(Math.log2(root.record_count)))return false;
  const message=JSON.stringify({id:record.id,content_hash:record.content_hash,model:record.model,timestamp:record.timestamp,account_id:record.account_id});
  if(!crypto.verify(null,Buffer.from(message),crypto.createPublicKey({key:publicKey,format:'jwk'}),Buffer.from(record.signature,'hex')))return false;
  let current=expectedHash,index=record.merkle_index;
  for(const step of proof.merkle_proof){if(!HEX.test(step?.hash)||step.position!==(index%2?'left':'right'))return false;current=hash(step.position==='left'?step.hash+current:current+step.hash);index=Math.floor(index/2);}
  return index===0&&current===proof.merkle_root;
 }catch{return false;}
}
function manifest(project,id){if(!HEX.test(project)||!HEX.test(id))throw Error('Invalid memory digest');return {schema:'chode-memory-anchor-v1',project,recordHash:id,policy:'grounded-recall-v1'};}
async function seal(project,id,options={}){
 const origin=endpoint(options.endpoint,DEFAULT_HELIOS);if(typeof options.token!=='string'||!options.token)throw Error('Helios identity required; memory remains locally queued');if(!options.publicKey)throw Error('Pinned Helios public key required');
 const content=canonical(manifest(project,id)),expectedHash=hash(content),key='chode-memory-'+id;
 const posted=await json(origin+'/api/v1/records',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+options.token,'Idempotency-Key':key},body:JSON.stringify({content,model:'chode-memory/1',context:'hash-only memory anchor'})},options);
 if(typeof posted.id!=='string'||!posted.id||posted.id.length>200||posted.content_hash!==expectedHash)throw Error('Helios receipt content mismatch');
 const record=await json(origin+'/api/v1/records/'+encodeURIComponent(posted.id),{},options);
 for(let attempt=0;attempt<2;attempt++){const [proof,root]=await Promise.all([json(origin+'/api/v1/records/'+encodeURIComponent(posted.id)+'/verify',{},options),json(origin+'/api/v1/ledger/root',{},options)]);if(verifyReceipt(record,proof,options.publicKey,expectedHash,root))return {schema:1,origin,record,proof,root,keyFingerprint:hash(options.publicKey),expectedHash,anchorHash:id};if(root.root===proof.merkle_root)break;}
 throw Error('Helios cryptographic proof failed or tree changed during verification');
}
module.exports={endpoint,json,judge,verifyReceipt,seal,manifest,DEFAULT_DEBTAUR,DEFAULT_HELIOS};
