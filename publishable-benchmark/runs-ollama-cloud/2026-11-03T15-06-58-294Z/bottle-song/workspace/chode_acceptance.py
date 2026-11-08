import os, hashlib, unittest
_EXPECTED = {"bottle_song_test.py":"a6fdddb47960a7ba68124273a4590b00347165503299182511221f7647d820f4"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
