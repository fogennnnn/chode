import os, hashlib, unittest
_EXPECTED = {"rest_api_test.py":"c9fcea3c017a87243c75dc90ea18b4f6bc59ea085eadf2a4c92b393b7e719ecd"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
