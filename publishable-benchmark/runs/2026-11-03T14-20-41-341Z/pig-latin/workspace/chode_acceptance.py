import os, hashlib, unittest
_EXPECTED = {"pig_latin_test.py":"30fb8e0fb9eff878fded241d6f19030308b95bfff8f9786f578416a714c11fb7"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
