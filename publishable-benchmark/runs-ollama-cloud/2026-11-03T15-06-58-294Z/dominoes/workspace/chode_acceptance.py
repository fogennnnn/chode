import os, hashlib, unittest
_EXPECTED = {"dominoes_test.py":"0a2b0cc3f2b8214d88eb2befe0ff84a50f927f04c6bb048af87915247cdd3d42"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
