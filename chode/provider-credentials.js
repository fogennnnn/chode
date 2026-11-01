'use strict';
function environment(provider,env=process.env){for(const name of [provider?.requiresKey,...(provider?.keyAliases||[])])if(name&&typeof env[name]==='string'&&env[name].trim())return env[name].trim();return null;}
function resolve(provider,settings={},env=process.env){if(!provider?.requiresKey)return null;return settings.keySource==='setup'&&settings.key?settings.key:environment(provider,env)||settings.key||null;}
function normalize(value){const key=String(value||'').trim().replace(/^(?:Authorization:\s*)?Bearer\s+/i,'');if(!key||key.length>4096||/[\s\x00-\x1f\x7f]/.test(key))throw Error('Paste only the API key, without quotes or additional header text. Nothing was saved.');return key;}
module.exports={environment,resolve,normalize};
