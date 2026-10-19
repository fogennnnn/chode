'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
function git(cwd,args){const env={...process.env};for(const key of ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE','GIT_COMMON_DIR'])delete env[key];const r=spawnSync('git',['-C',cwd,...args],{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:1024*1024,env});if(r.error||r.status!==0)throw Error(String(r.error?.message||r.stderr||'Git command failed').trim());return r.stdout.trim();}
function create(cwd=process.cwd()){
 const repo=fs.realpathSync(git(cwd,['rev-parse','--show-toplevel'])),directory=path.join(repo,'.chode','worktrees');
 const nameOf=name=>{if(typeof name!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,47}$/.test(name))throw Error('Worktree name must use 1–48 letters, digits, hyphens or underscores');return name;};
 function target(name){nameOf(name);let at=repo;for(const part of ['.chode','worktrees',name]){at=path.join(at,part);try{if(fs.lstatSync(at).isSymbolicLink())throw Error('Worktree path contains a symbolic link');}catch(e){if(e.code!=='ENOENT')throw e;}}return at;}
 function list(){const out=[];for(const field of git(repo,['worktree','list','--porcelain','-z']).split('\0')){if(field.startsWith('worktree '))out.push({path:field.slice(9)});else if(out.length){if(field.startsWith('HEAD '))out.at(-1).commit=field.slice(5);if(field.startsWith('branch '))out.at(-1).branch=field.slice(7);}}return out;}
 function add(name,ref='HEAD'){
  const dest=target(name);if(fs.existsSync(dest))throw Error('Worktree destination already exists');if(typeof ref!=='string'||!ref||ref.startsWith('-')||/[\x00-\x1f]/.test(ref))throw Error('Invalid starting ref');const commit=git(repo,['rev-parse','--verify','--end-of-options',ref+'^{commit}']);
  const dirty=!!git(repo,['status','--porcelain','--untracked-files=no']),branch='codex/'+name;git(repo,['check-ref-format','--branch',branch]);fs.mkdirSync(directory,{recursive:true});git(repo,['worktree','add','-b',branch,'--',dest,commit]);
  const relative=path.relative(repo,path.resolve(cwd)),project=path.join(dest,relative);return {ok:true,path:dest,directory:fs.existsSync(project)?project:dest,branch,commit,originalDirty:dirty,note:dirty?'Uncommitted changes remain in the original checkout.':'Original checkout is unchanged.'};
 }
 function remove(name){const dest=target(name),entry=list().find(r=>path.resolve(r.path)===path.resolve(dest));if(!entry||entry.branch!=='refs/heads/codex/'+name)throw Error('Not a Chode-managed worktree');git(repo,['worktree','remove','--',dest]);return {ok:true,path:dest,branchRetained:entry.branch,note:'Worktree removed; branch retained. Dirty worktrees are never forced.'};}
 return {repo,list,add,remove};
}
function run(argv,cwd=process.cwd()){try{const api=create(cwd);if(!argv.length||argv[0]==='list')return {ok:true,worktrees:api.list()};if(argv[0]==='create'&&argv[1]){if(argv.length>2&&!(argv.length===4&&argv[2]==='--ref'))throw Error('Use create <name> [--ref <ref>]');return api.add(argv[1],argv[3]||'HEAD');}if(argv[0]==='remove'&&argv.length===2)return api.remove(argv[1]);throw Error('Use chode worktree list|create <name> [--ref <ref>]|remove <name>');}catch(error){return {ok:false,error:error.message};}}
module.exports={create,run};
