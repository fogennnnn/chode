import os, hashlib, unittest
_EXPECTED = {"hangman_test.py":"dbe4109433123edf58c96624ac52200936f9c808eb1f6d5ff3415a19f37794d4"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
