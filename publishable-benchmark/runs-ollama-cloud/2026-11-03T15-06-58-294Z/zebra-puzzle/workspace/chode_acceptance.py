import os, hashlib, unittest
_EXPECTED = {"zebra_puzzle_test.py":"08acbdd6e6f725c8f4cfe18027c1da2589d146c97ae5b8b0cb3c542b4a6c0b5e"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
