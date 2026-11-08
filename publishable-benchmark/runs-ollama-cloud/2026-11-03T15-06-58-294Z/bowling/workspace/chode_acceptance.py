import os, hashlib, unittest
_EXPECTED = {"bowling_test.py":"2caebee15018a7fb02f248c8fd31898b355188832e64ada825f17693292f9837"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
