import os, hashlib, unittest
_EXPECTED = {"grade_school_test.py":"b7e6ad272ce179dce6ffdde0bfab16e83399eecc6674520c47c7e0b8a952ebda"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
