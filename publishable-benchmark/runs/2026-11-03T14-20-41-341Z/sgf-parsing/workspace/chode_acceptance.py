import os, hashlib, unittest
_EXPECTED = {"sgf_parsing_test.py":"4174790bf56c81d0551034d07f21c3805ffa6db2f5526922debb92b6cc4ab6b2"}
for _name, _hash in _EXPECTED.items():
 with open(os.path.join(os.path.dirname(__file__), _name), "rb") as _f:
  if hashlib.sha256(_f.read()).hexdigest() != _hash: raise RuntimeError("Original test changed: " + _name)
def load_tests(loader, tests, pattern):
 return loader.discover(os.path.dirname(__file__), pattern="*_test.py")
