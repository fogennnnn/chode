'use strict';
// Legacy provider fixtures predate specialist calls. The dedicated council test
// explicitly re-enables default behavior and exercises the real build/worker.
const cp=require('child_process'),path=require('path');
const command=require('../package.json').scripts['test:'+process.argv[2]+':fixtures'];
if(!command)throw Error('Unknown fixture suite');
const result=cp.spawnSync(command,{cwd:path.resolve(__dirname,'..'),shell:true,stdio:'inherit',windowsHide:true,env:{...process.env,CHODE_COUNCIL:'off'}});
if(result.error)throw result.error;process.exitCode=result.status===null?1:result.status;
