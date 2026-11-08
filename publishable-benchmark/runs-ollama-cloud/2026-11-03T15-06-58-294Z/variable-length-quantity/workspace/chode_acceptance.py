import os, hashlib, unittest
_EXPECTED = {"variable_length_quantity_test.py":"b9a0567caad8b066723ac0cff79870fc1e4711d1dbdad44af31288223c4c27e6"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
