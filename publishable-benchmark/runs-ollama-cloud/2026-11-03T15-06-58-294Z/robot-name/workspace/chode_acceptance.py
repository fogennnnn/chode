import os, hashlib, unittest
_EXPECTED = {"robot_name_test.py":"64e6f71740ad3b2f0eb3df04b5ed01d2550f9181d4af76d071728d6ba19fbc5b"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
