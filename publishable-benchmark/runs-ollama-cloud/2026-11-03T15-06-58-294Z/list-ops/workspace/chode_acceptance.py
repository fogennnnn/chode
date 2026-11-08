import os, hashlib, unittest
_EXPECTED = {"list_ops_test.py":"74d4aafc67bb4b664eeb4db8bccc7db2d8d107e5822867dd8bd214848929f520"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
