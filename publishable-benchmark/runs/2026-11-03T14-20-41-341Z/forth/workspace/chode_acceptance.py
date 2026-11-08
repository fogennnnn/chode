import os, hashlib, unittest
_EXPECTED = {"forth_test.py":"27e825ad24566afeca02400575306f82215f030fb2355c4de45ea67d79cd687d"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
