"""Installed CLI journeys through a real Unix PTY; AI/account replies are local fixtures."""
import os,pathlib,pty,select,subprocess,sys,tempfile,time,fcntl,termios,struct,json,threading,shutil
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
command=str(pathlib.Path(sys.argv[1]).resolve());captured=bytearray();process=None
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(json.dumps({'data':[{'id':'agnes-2.5-flash'}]}).encode())
 def do_POST(self):
  body=json.loads(self.rfile.read(int(self.headers['Content-Length'])));assert self.headers.get('Authorization')=='Bearer native-fixture-key';assert body['model']=='agnes-2.5-flash'
  self.send_response(403);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"error":{"code":"insufficient_user_quota"}}')
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
master,slave=pty.openpty();fcntl.ioctl(slave,termios.TIOCSWINSZ,struct.pack('HHHH',38,110,0,0))
def read_until(needle,seconds=15):
 data=bytearray();end=time.monotonic()+seconds
 while time.monotonic()<end:
  if select.select([master],[],[],0.1)[0]:
   try:chunk=os.read(master,65536)
   except OSError:break
   captured.extend(chunk);data.extend(chunk)
   if needle in data:return
  if process.poll() is not None:break
 raise AssertionError('PTY did not show '+repr(needle)+'; tail='+bytes(data[-2200:]).decode(errors='replace'))
def send(text):
 os.write(master,text.encode());time.sleep(0.06);os.write(master,b'\r')
try:
 with tempfile.TemporaryDirectory(prefix='chode-native-workflow-') as temp:
  root=pathlib.Path(temp);home=root/'home';home.mkdir();work=root/'work';work.mkdir();preload=root/'preload.cjs'
  source="const e=require("+json.dumps(command)+");e.PROVIDERS.agnes.endpoints[0].url='http://127.0.0.1:"+str(server.server_port)+"/v1/chat/completions';let wrote=false;e.__testHooks.callAI=async(p,s,f,o)=>{if(String(p).startsWith('[VERIFY'))return {provider:'fixture-review',result:'PASS'};if(o?.mode==='plan')return {provider:'fixture-plan',result:'## Goal\\nInspect\\n## Plan\\nRead files\\n## Risks\\nNone\\n## Verification\\nReadonly'};if(String(p).includes('answer.js')&&!wrote){wrote=true;return {provider:'fixture-author',result:'```tool\\n'+JSON.stringify({tool:'write',args:{file:'answer.js',content:'module.exports=42;\\n'}})+'\\n```'};}return {provider:'fixture-author',result:'DONE: fixture completed.'};};"
  preload.write_text(source);(work/'acceptance.cjs').write_text('console.log("native acceptance passed");')
  environment={k:v for k,v in os.environ.items() if not k.endswith(('_KEY','_TOKEN','_SECRET','_PASSWORD'))};environment.update(TERM='xterm-256color',HOME=str(home),USERPROFILE=str(home),CHODE_PROVIDER_HOME=str(home),NODE_OPTIONS='--require '+json.dumps(str(preload)));environment.pop('CHODE_LEGACY_REPL',None)
  launcher=root/'launch.cjs';launcher.write_text('require('+json.dumps(str(pathlib.Path(command).parent/'workspace-tui.js'))+').launch();')
  process=subprocess.Popen([shutil.which('node'),str(launcher)],stdin=slave,stdout=slave,stderr=slave,cwd=work,env=environment,close_fds=True);os.close(slave);slave=None;read_until(b'Ask Chode');os.write(master,b'\x10');read_until(b'Commands');os.write(master,b'\x03');time.sleep(0.1)
  for text,needle in [('/providers lmstudio',b'connection options'),('/mode plan',b'Plan mode'),('/mode execute',b'Execute mode'),('/theme light',b'Theme: light'),('/check acceptance.cjs',b'Future builds'),('/verify',b'native acceptance passed'),('/check off',b'Acceptance test cleared')]:send(text);read_until(needle)
  send('/execute Write answer.js exporting 42. Edit only answer.js.');read_until(b'Verified');assert (work/'answer.js').read_text()=='module.exports=42;\n';time.sleep(0.2)
  send('/connect agnes');read_until(b'Paste API key');send('native-fixture-key');read_until(b'Choose a model');send('current');read_until(b'Check this connection');send('1');read_until(b'How should setup continue');send('2');read_until(b'locally?');send('2');read_until(b'access needed');time.sleep(0.2)
  assert (home/'.chode/providers.json').exists();assert 'native-fixture-key' not in (work/'.chode/config.json').read_text()
  send('/export');read_until(b'Conversation exported');exports=list((work/'.chode/exports').glob('*.md'));assert exports and all('native-fixture-key' not in p.read_text() for p in exports)
  os.write(master,b'\x04');assert process.wait(timeout=5)==0
  while select.select([master],[],[],0.1)[0]:
   try:
    chunk=os.read(master,65536)
    if not chunk:break
    captured.extend(chunk)
   except OSError:break
  assert b'native-fixture-key' not in captured,'secret echoed to PTY';assert b'\x1b[?1049l' in captured,'terminal not restored';print('PASS native PTY: command palette, provider search, modes/theme, real verification and worker build, quota-aware Agnes setup, shared-key storage, secret-free export and terminal restoration (local fixtures)')
finally:
 if process is not None and process.poll() is None:process.kill();process.wait()
 os.close(master)
 if slave is not None:os.close(slave)
 server.shutdown();server.server_close()
