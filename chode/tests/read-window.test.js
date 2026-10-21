'use strict';
const assert=require('assert/strict'),{page}=require('../read-window');
for(const text of ['', 'a\r\nb\r\n', ('line with "quotes" and \\ slashes\r\n').repeat(400), '🦅'.repeat(20000)]){
 let options={},output='',pages=0;
 for(;;){const result=page('source.py',text,options);assert(result.ok,result.error);output+=result.content;pages++;assert(JSON.stringify(result).length<6000);assert(!result.content.endsWith('\uD83E'));if(!result.nextRead){assert(result.eof);break;}assert(pages<100);options=result.nextRead;}
 assert.equal(output,text,'following nextRead must reconstruct every original character');
}
assert.equal(page('file','a\nb\nc',{offset:2,limit:1}).content,'b\n');
for(const options of [{offset:0},{offset:1.5},{limit:201},{limit:0},{column:-1}])assert(!page('file','text',options).ok);
assert(!page('file','text',{offset:20}).ok);
console.log('PASS read windows: complete multi-page reconstruction, CRLF, long lines, Unicode boundaries, line limits and invalid ranges');
