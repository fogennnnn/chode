import os, hashlib, unittest
_EXPECTED = {"poker_test.py":"5e17fd576ee3adcbc31ec37a3cc0297ac145e1d28afc6a03a37e573a6f889375"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
