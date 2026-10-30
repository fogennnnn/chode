'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),{PassThrough}=require('stream');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const original=process.cwd(),root=fs.mkdtempSync(path.join(os.tmpdir(),'chode-logo-input-')),previous=process.env.FORCE_COLOR,oldNoColor=process.env.NO_COLOR,oldTerm=process.env.TERM;let app;
 try{
  process.chdir(root);process.env.FORCE_COLOR='1';process.env.TERM='xterm-256color';delete process.env.NO_COLOR;
  const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};
  const output=new PassThrough();output.isTTY=true;output.columns=80;output.rows=24;let screen='';output.on('data',chunk=>screen+=chunk);
  app=require('../workspace-tui').launch({input,output});
  const initialHomes=(screen.match(/\x1b\[H/g)||[]).length;
  await pause(600);
  assert.equal((screen.match(/\x1b\[H/g)||[]).length,initialHomes,'idle animation must not redraw the conversation');
  assert((screen.match(/\x1b7/g)||[]).length>=3,'logo refreshes independently');assert(screen.includes('\x1b8'),'logo rendering restores the input cursor');
  input.write('\x1b[?61;4;6c\x1b[6;20;10t');await pause(80);assert.equal(app.state.input,'','graphics replies never become user input');assert(screen.includes('\x1bP0;1;0q"1;1;80;80'),'supported terminal receives real pixels within the 8x4 character area');
  const graphicsHome=(screen.match(/\x1b\[H/g)||[]).length;await pause(400);assert.equal((screen.match(/\x1b\[H/g)||[]).length,graphicsHome,'native raster animation does not redraw the conversation');
  input.write('draft with spaces');await pause(60);assert.equal(app.state.input,'draft with spaces');assert.equal(app.state.cursor,17);
  input.write('\x03');input.write('/free on\r');await pause(80);assert.equal(app.state.input,'','coalesced single-line text and Enter must submit');assert(app.state.messages.some(m=>m.text.includes('Account-provider selection cleared')),'coalesced command executes while the logo animates');
  input.write('/model agnes\r/free on\r');await pause(100);assert.equal(app.state.input,'','multiple completed CR commands in one terminal chunk must execute');assert.equal(app.state.provider,'auto');
  input.write('\x1b[200~/model agnes\r/free on\r\x1b[201~');await pause(60);assert.equal(app.state.input,'/model agnes\n/free on\n','bracketed paste keeps complete commands as editable text');assert.equal(app.state.provider,'auto');input.write('\x03');
  input.write('first\r\nsecond\r\n');await pause(60);assert.equal(app.state.input,'first\nsecond\n','unmarked CRLF multiline paste stays editable and unsubmitted');assert.equal(app.state.busy,false);input.write('\x03');
  output.emit('resize');input.write('\x1b[?61;4c\x1b[6;16;8t/free on\r');await pause(100);assert.equal(app.state.input,'','typed commands sharing a graphics-response chunk still execute');assert(screen.includes('\x1bP0;1;0q"1;1;64;64'),'font resizing changes the bitmap without expanding its cell footprint');
  const before=screen.length;app.close();app=null;await pause(350);const closed=screen.length;await pause(350);assert.equal(screen.length,closed,'closing cancels animation timers');assert(closed>before,'terminal restoration is written');
  console.log('PASS animated TUI logo: independent idle paint, saved/restored cursor, actual key bytes, draft preservation and timer cleanup');
 }finally{if(app)app.close();if(previous===undefined)delete process.env.FORCE_COLOR;else process.env.FORCE_COLOR=previous;if(oldNoColor===undefined)delete process.env.NO_COLOR;else process.env.NO_COLOR=oldNoColor;if(oldTerm===undefined)delete process.env.TERM;else process.env.TERM=oldTerm;process.chdir(original);fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
