import os, hashlib, unittest
_EXPECTED = {"zipper_test.py":"86e6cdbcb7922420684bcb13e03b960e8c4b2a74da356688e5e23668feb6b4b4"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
