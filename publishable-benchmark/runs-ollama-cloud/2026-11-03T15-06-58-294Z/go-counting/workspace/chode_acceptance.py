import os, hashlib, unittest
_EXPECTED = {"go_counting_test.py":"ef245f5eaef17621276953888b9f4a86b67c5e9bc14e61977590228bd320f23f"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
