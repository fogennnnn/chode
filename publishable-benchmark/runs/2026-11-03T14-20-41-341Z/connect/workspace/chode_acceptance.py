import os, hashlib, unittest
_EXPECTED = {"connect_test.py":"e658c729aa0784272046be8c1d2254503e6b6921a01829b65057f240bac48c96"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
