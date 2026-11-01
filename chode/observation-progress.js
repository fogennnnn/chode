'use strict';
const {createHash}=require('crypto');

// Observe progress only. Never skip a tool, grant permission, or extend a budget.
function create() {
  const seen=new Map();
  let repeated=0,lastJobs=null,jobsStreak=0;
  return {
    record(call,result) {
      if(result?.ok&&(call.tool==='write'||call.tool==='edit'||call.tool==='multiedit'&&!result.preview&&result.files?.length)) {
        seen.clear();repeated=0;lastJobs=null;jobsStreak=0;return;
      }
      if(call.tool==='jobs'&&result&&result.error==='Unknown background job.') {
        const digest=createHash('sha256').update(JSON.stringify([call.tool,call.args,result.error])).digest('hex');
        if(digest===lastJobs)jobsStreak++;else{lastJobs=digest;jobsStreak=1;}
        return;
      }
      lastJobs=null;jobsStreak=0;
      if(!result?.ok||!['read','grep','glob'].includes(call.tool))return;
      const digest=createHash('sha256').update(JSON.stringify([call.tool,call.args,result])).digest('hex');
      if(seen.has(digest))repeated++;
      seen.set(digest,true);
      if(seen.size>64)seen.delete(seen.keys().next().value);
    },
    guidance() {
      const out=[];
      if(repeated>=2)out.push('\n[OBSERVATION RECOVERY] Identical successful file queries have repeated without an implementation change. Use the source already returned to implement the requested behavior. If a read is incomplete, follow its nextRead rather than requesting the same page. If specific evidence is still missing, make a targeted new query. Preserve existing working behavior and write permissions. If blocked, report the concrete missing information; do not claim completion. [END OBSERVATION RECOVERY]');
      if(jobsStreak>=2)out.push('\n[JOB RECOVERY] The same unknown background job id was polled again with no new result. Call jobs list once and copy an exact returned id, or inspect the original exec result: a foreground command has no background job id and its output is already in the tool results. Do not poll the unknown id again. [END JOB RECOVERY]');
      return out.join('\n');
    }
  };
}
module.exports={create};
