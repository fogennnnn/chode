import os, hashlib, unittest
_EXPECTED = {"paasio_test.py":"7b1d5c48b9e3a0bb5a0f15b932961d1ac45eb171369cd602a3597cf5a5096c59","test_utils.py":"f772ac3e0662568d9098acc010b7545ce99dfc0992e1a6f6bc4bf19e0e0e1faa"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
