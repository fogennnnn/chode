'use strict';
const schemas={
 skill:{description:'Discover installed skills or read a paged skill reference.',properties:{action:{type:'string',enum:['list']},name:{type:'string'},reference:{type:'string'},offset:{type:'integer',minimum:1},limit:{type:'integer',minimum:1,maximum:200},column:{type:'integer',minimum:0}},required:[]},
 mcp:{description:'Discover trusted MCP servers. Configuration alone is not a working connection.',properties:{action:{type:'string',enum:['list','test','tools','schema']},server:{type:'string'},name:{type:'string'}},required:['action']},
 mcp_call:{description:'Call a trusted external MCP tool; requires user approval. Read the schema first.',properties:{server:{type:'string'},name:{type:'string'},arguments:{type:'object'}},required:['server','name','arguments']},
 read:{description:'Read a workspace file page. Follow nextRead until eof to see remaining content.',properties:{file:{type:'string'},offset:{type:'integer',minimum:1},limit:{type:'integer',minimum:1,maximum:200},column:{type:'integer',minimum:0}},required:['file']},
 write:{description:'Write complete content to a permitted workspace file. Never omit content.',properties:{file:{type:'string'},content:{type:'string'}},required:['file','content']},
 edit:{description:'Replace exact text observed in a workspace file. For whole files use write.',properties:{file:{type:'string'},oldString:{type:'string',minLength:1},newString:{type:'string'},replaceAll:{type:'boolean'}},required:['file','oldString','newString']},
 glob:{description:'Find workspace files by pattern.',properties:{pattern:{type:'string'}},required:['pattern']},
 grep:{description:'Search workspace source text.',properties:{pattern:{type:'string'},dir:{type:'string'}},required:['pattern']},
 exec:{description:'Run a permitted workspace command. Use foreground by default for tests and short commands. Background is for long-running servers/jobs; use the returned job ID verbatim. Starting a job does not prove success.',properties:{cmd:{type:'string'},background:{type:'boolean'}},required:['cmd']}
};
function definitions(disallow=[]){return Object.entries(schemas).filter(([name])=>!disallow.includes(name)).map(([name,schema])=>({type:'function',function:{name,description:schema.description,parameters:{type:'object',properties:schema.properties,required:schema.required,additionalProperties:false}}}));}
function parse(data,allowed){
 const message=data?.choices?.[0]?.message;if(!message)return '';
 const content=typeof message.content==='string'?message.content:'';
 const calls=(Array.isArray(message.tool_calls)?message.tool_calls:[]).slice(0,6),blocks=[];
 for(const call of calls){const name=call?.function?.name;if(!allowed.includes(name))continue;let args={};try{if(typeof call.function.arguments==='string'&&call.function.arguments.length<=300000){const value=JSON.parse(call.function.arguments);if(value&&typeof value==='object'&&!Array.isArray(value))args=value;}}catch{}
  blocks.push('```tool\n'+JSON.stringify({tool:name,args})+'\n```');
 }
 return [content,...blocks].filter(Boolean).join('\n');
}
function accumulator(){
 const calls=new Map();let bytes=0;
 return {push(frame){let progress=false;for(const delta of frame?.choices?.[0]?.delta?.tool_calls||[]){const index=delta.index;if(!Number.isInteger(index)||index<0||index>=6)throw Error('Invalid native tool index');let call=calls.get(index);if(!call){call={type:'function',function:{name:'',arguments:''}};calls.set(index,call);}if(delta.function?.name){if(call.function.name&&call.function.name!==delta.function.name)throw Error('Native tool name changed');if(!call.function.name)progress=true;call.function.name=delta.function.name;}if(typeof delta.function?.arguments==='string'&&delta.function.arguments.length){bytes+=Buffer.byteLength(delta.function.arguments);if(bytes>1024*1024)throw Error('Native tool arguments exceed limit');call.function.arguments+=delta.function.arguments;progress=true;}}return progress;},hasCalls:()=>calls.size>0,result:(content,allowed)=>parse({choices:[{message:{content,tool_calls:[...calls.entries()].sort((a,b)=>a[0]-b[0]).map(entry=>entry[1])}}]},allowed)};
}
module.exports={definitions,parse,accumulator};
