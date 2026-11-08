import os, hashlib, unittest
_EXPECTED = {"pov_test.py":"b0ec89432cb214aad3e2dede133705c29ccc142047080724689c8b98d9a25828"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
