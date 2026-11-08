import os, hashlib, unittest
_EXPECTED = {"simple_linked_list_test.py":"0d600de4ac2fc4edc6416ccdbed5e26b3c55e8188b327f1d2e889b01fd10ebf9"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
