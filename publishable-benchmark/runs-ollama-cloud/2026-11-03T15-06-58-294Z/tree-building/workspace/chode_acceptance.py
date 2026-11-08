import os, hashlib, unittest
_EXPECTED = {"tree_building_test.py":"6decdf2fbed2408e2178849f66aa48e53aa477bd20cb58aaaddea6892e10e554"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
