import os, hashlib, unittest
_EXPECTED = {"beer_song_test.py":"1b299a29dcaf75c37854fe3dd7c31b2b38a4e210eb27348be1696481d1e6e880"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
