"""Exercise the installed CLI in a native Unix pseudo-terminal."""
import os, pathlib, pty, select, subprocess, sys, tempfile, time
command=str(pathlib.Path(sys.argv[1]).resolve())
master,slave=pty.openpty();process=None;captured=b''
try:
 with tempfile.TemporaryDirectory(prefix='chode-native-startup-') as workspace:
  environment=dict(os.environ,TERM='xterm-256color');environment.pop('CHODE_LEGACY_REPL',None)
  process=subprocess.Popen([command],stdin=slave,stdout=slave,stderr=slave,cwd=workspace,env=environment,close_fds=True);os.close(slave);slave=None
  deadline=time.monotonic()+10
  while time.monotonic()<deadline and b'Ask Chode' not in captured:
   if select.select([master],[],[],0.2)[0]:
    try:captured+=os.read(master,65536)
    except OSError:break
   if process.poll() is not None:break
  assert b'Ask Chode' in captured,captured.decode(errors='replace')
  os.write(master,b'\x04');assert process.wait(timeout=5)==0,captured.decode(errors='replace')
  while select.select([master],[],[],0.1)[0]:
   try:chunk=os.read(master,65536)
   except OSError:break
   if not chunk:break
   captured+=chunk
  assert b'\x1b[?1049h' in captured and b'\x1b[?1049l' in captured,'terminal buffer not restored'
  assert b'TypeError' not in captured,captured.decode(errors='replace')
  print('PASS: installed command starts in a native Linux PTY and exits cleanly with Ctrl+D')
finally:
 if process is not None and process.poll() is None:process.kill();process.wait()
 os.close(master)
 if slave is not None:os.close(slave)
