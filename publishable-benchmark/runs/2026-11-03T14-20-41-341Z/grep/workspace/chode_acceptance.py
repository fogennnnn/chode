import os, hashlib, unittest
_EXPECTED = {"grep_test.py":"9ff28efb378321edf792a266f8b1a142f3751b45064fd14742d44a6bdf91832d"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
