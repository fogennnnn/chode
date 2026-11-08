import os, hashlib, unittest
_EXPECTED = {"food_chain_test.py":"d2a4dc283e78d2dc13a71589347c15e480730230e685d147ce819322e02a5bd7"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
