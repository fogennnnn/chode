import os, hashlib, unittest
_EXPECTED = {"phone_number_test.py":"13c345db738e8a1202072fc2f6519c3c15ec4e5198e6ba982a0ae36dd0c705bd"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
