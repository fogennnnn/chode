'use strict';
const assert=require('assert');const v=require('../workspace-view');
const s=v.createState({workspace:'project',session:'demo'});
v.addMessage(s,'user','Build a tool');v.addMessage(s,'assistant','## Result\n'+('long line 中文 👩‍💻 e\u0301 '.repeat(30)));
for(const [w,h] of [[8,5],[1,1],[20,10],[40,14],[80,24],[120,32],[160,45]]){for(const details of [false,true]){s.details=details;const f=v.frame(s,w,h);assert.equal(f.lines.length,h);assert.ok(f.lines.every(l=>v.cellWidth(l)===w),`${w}x${h} cells`);assert.ok(f.cursor.column>=0&&f.cursor.column<w);assert.ok(f.cursor.row>=0&&f.cursor.row<h);}}
assert.equal(v.cellWidth('👩‍💻'),2);assert.equal(v.cellWidth('e\u0301'),1);assert.equal(v.cellWidth('中文'),4);
assert.ok(!v.safe('\x1b]8;;https://evil\x07text\x1b]8;;\x07').includes('https'));
assert.equal(v.fit('hello\nworld',20).includes('\n'),false);
v.insert(s,'hello 👩‍💻');v.key(s,'',{name:'backspace'});assert.equal(s.input,'hello ');
s.input='';s.cursor=0;v.key(s,'',{sequence:'\x1b[200~'});v.key(s,'hello',{});v.key(s,'\r',{name:'return'});v.key(s,'world',{});v.key(s,'',{sequence:'\x1b[201~'});assert.equal(s.input,'hello\nworld');
assert.equal(v.key(s,'',{name:'return'}).value,'hello\nworld');assert.equal(s.input,'');
s.busy=true;v.insert(s,'next prompt');assert.equal(v.key(s,'',{name:'return'}),undefined);assert.equal(s.input,'next prompt');assert.equal(v.key(s,'',{name:'c',ctrl:true}).type,'cancel');
s.busy=false;v.key(s,'',{name:'c',ctrl:true});assert.equal(s.input,'');assert.equal(v.key(s,'',{name:'c',ctrl:true}).type,'exit');
s.input='/det';s.cursor=4;v.key(s,'',{name:'tab'});assert.equal(s.input,'/details ');
console.log('✓ workspace view: bounded frames, narrow/wide layouts, Unicode, paste, editing, history and stop controls');
