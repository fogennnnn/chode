import os, hashlib, unittest
_EXPECTED = {"wordy_test.py":"9edb124dbcf68505d0b84b8a0e078e4d82195ecbfdad8fd4a0fb9f6644035698"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
