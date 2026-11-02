import importlib.util
import pathlib
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('runner', pathlib.Path(__file__).with_name('run.py'))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

class AdapterTests(unittest.TestCase):
    def test_complete_deterministic_selection(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            for index, language in enumerate(runner.LANGUAGES):
                for n in range(38 if index < 3 else 37):
                    (root / language / 'exercises/practice' / str(n)).mkdir(parents=True)
            tasks = runner.discover(root)
            self.assertEqual(len(tasks), 225)
            self.assertEqual(tasks, runner.discover(root))
            self.assertEqual({language for language, slug in tasks}, set(runner.LANGUAGES))
            (root / 'cpp/exercises/practice/extra').mkdir()
            with self.assertRaises(RuntimeError):
                runner.discover(root)

    def test_containment(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp) / 'task'
            root.mkdir()
            (root / 'safe.txt').write_text('test')
            (root.parent / 'outside.txt').write_text('private')
            self.assertEqual(runner.checked_file(root, 'safe.txt').read_text(), 'test')
            with self.assertRaises(RuntimeError):
                runner.checked_file(root, '../outside.txt')

    def test_container_has_no_host_credentials(self):
        command = runner.docker_base('fixture', 'test')
        self.assertIn('--cap-drop', command)
        self.assertIn('no-new-privileges', command)
        self.assertNotIn('--env-file', command)
        self.assertNotIn('-v', command)

if __name__ == '__main__':
    unittest.main()
