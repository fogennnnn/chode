import os, hashlib, unittest
_EXPECTED = {"transpose_test.py":"7dee4bd448cde6f3ba024420e055e7f4e0c7d7395c6a94de87d31efb3d2c9309"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
