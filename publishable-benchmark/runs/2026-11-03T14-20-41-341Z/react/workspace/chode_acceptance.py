import os, hashlib, unittest
_EXPECTED = {"react_test.py":"aa9a9152793944d7cf5a2dc092eeefae3afd3fc84292228ef959e5dbcbae3fee"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
