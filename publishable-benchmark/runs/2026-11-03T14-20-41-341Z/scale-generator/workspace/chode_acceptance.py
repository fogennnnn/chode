import os, hashlib, unittest
_EXPECTED = {"scale_generator_test.py":"a9110bdd27f5faf2e644ee95120c6793d6575a68bd51d1be1b1f1e1ce254b500"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
