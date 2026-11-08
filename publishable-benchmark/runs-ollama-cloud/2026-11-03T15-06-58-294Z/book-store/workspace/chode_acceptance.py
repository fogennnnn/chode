import os, hashlib, unittest
_EXPECTED = {"book_store_test.py":"6bc35e903bdeb9c2321546610991dd4d11bb84df2e793f492cf1eecc897f7b0f"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
