'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
function create(home=os.homedir()){
 const directory=path.join(home,'.chode'),file=path.join(directory,'providers.json');
 function read(target,fallback){try{const st=fs.lstatSync(target);if(!st.isFile()||st.isSymbolicLink()||st.nlink>1||st.size>2*1024*1024)throw Error('Unsafe provider settings file');const value=JSON.parse(fs.readFileSync(target,'utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid provider settings');return value;}catch(e){if(e.code==='ENOENT')return fallback;throw Error('User provider settings are unreadable; existing data preserved.');}}
 function state(){const value=read(file,{schema:1,providers:{},connections:{}});if(value.schema!==1||!value.providers||!value.connections)throw Error('Invalid user provider settings; existing data preserved.');return value;}
 function legacy(){try{return read(path.join(directory,'config.json'),{providers:{},connections:{}});}catch{return {providers:{},connections:{}};}}
 function settings(id,local={}){const shared={...(legacy().providers?.[id]||{}),...(state().providers[id]||{})};if(local.keySource==='global'){const merged={...shared,...local};if(shared.key){merged.key=shared.key;merged.keySource='setup';}return merged;}return {...shared,...local};}
 function connections(){return {...(legacy().connections||{}),...state().connections};}
 function save(id,value,connection){if(!/^[a-z][a-z0-9_-]{1,39}$/.test(id))throw Error('Invalid provider ID');const data=state();data.providers[id]=value;if(connection)data.connections[id]=connection;try{const st=fs.lstatSync(directory);if(st.isSymbolicLink()||!st.isDirectory())throw Error('Linked provider directory is not allowed');}catch(e){if(e.code!=='ENOENT')throw e;fs.mkdirSync(directory,{mode:0o700});}const temporary=file+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';try{fs.writeFileSync(temporary,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});fs.renameSync(temporary,file);fs.chmodSync(file,0o600);}finally{try{fs.unlinkSync(temporary);}catch{}}}
 return {settings,connections,save};
}
module.exports={create};
