import os, hashlib, unittest
_EXPECTED = {"affine_cipher_test.py":"3b2b2a4a6f5931869a9c92ee2660394230cedeccecb07b6b18006f30babb5e1b"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
