import os, hashlib, unittest
_EXPECTED = {"two_bucket_test.py":"d29242e6e5240ff5e30f16c3a6581c14e1beb2a19a88351ed524765aefa217d7"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
