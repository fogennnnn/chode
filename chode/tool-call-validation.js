'use strict';
// Validate model-generated arguments without inventing filenames or content.
function validate(call) {
  const args=call&&call.args;
  const formats={read:'read {file: string, offset?: positive integer, limit?: integer 1-200, column?: nonnegative integer}',write:'write {file: string, content: string}',edit:'edit {file: string, oldString: nonempty string, newString: string}',exec:'exec {cmd: nonempty string, background?: boolean}'};
  if(!call||!formats[call.tool])return null;
  const text=value=>typeof value==='string'&&value.trim().length>0;
  let valid=args&&typeof args==='object'&&!Array.isArray(args);
  if(valid&&call.tool==='exec')valid=text(args.cmd);
  else if(valid){
    valid=text(args.file);
    if(call.tool==='read')valid=valid&&(args.offset===undefined||Number.isInteger(args.offset)&&args.offset>=1)&&(args.limit===undefined||Number.isInteger(args.limit)&&args.limit>=1&&args.limit<=200)&&(args.column===undefined||Number.isInteger(args.column)&&args.column>=0);
    if(call.tool==='write')valid=valid&&typeof(args.content!=null?args.content:args.text)==='string';
    if(call.tool==='edit')valid=valid&&typeof args.oldString==='string'&&args.oldString.length>0&&typeof args.newString==='string';
  }
  return valid?null:{ok:false,invalidArguments:true,error:'Invalid tool arguments. Required: '+formats[call.tool]+'. Supply actual values from the task and observed files; do not send an empty object.'};
}
module.exports={validate};
