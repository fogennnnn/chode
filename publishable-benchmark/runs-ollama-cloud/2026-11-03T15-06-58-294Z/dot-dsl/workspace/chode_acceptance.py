import os, hashlib, unittest
_EXPECTED = {"dot_dsl_test.py":"5ef296ba418ef985346decebbfbe847d620ae9578917d75d8a2f5cb63cda7297"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
