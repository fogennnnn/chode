import os, hashlib, unittest
_EXPECTED = {"proverb_test.py":"c24f8e358c37753c5db87da69249875de4088e4a6fe838aed1265e73c9bff1b7"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
