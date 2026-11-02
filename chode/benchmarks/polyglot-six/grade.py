"""Invoke the pinned, unmodified Aider grader in its benchmark container."""
import importlib.util
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, '/aider/benchmark')
spec = importlib.util.spec_from_file_location('upstream_benchmark', '/aider/benchmark/benchmark.py')
upstream = importlib.util.module_from_spec(spec)
spec.loader.exec_module(upstream)
task = pathlib.Path(sys.argv[1])
config = json.loads((task / '.meta/config.json').read_text())
observed = []
outputs = []
real_run = subprocess.run

def recording_run(*args, **kwargs):
    result = real_run(*args, **kwargs)
    observed.append({'command': args[0] if args else kwargs.get('args'), 'exitCode': result.returncode})
    outputs.append(str(result.stdout or ''))
    return result

subprocess.run = recording_run
report = {'passed': False, 'infrastructureError': None}
try:
    errors = upstream.run_unit_tests(pathlib.Path('/dataset'), task, pathlib.Path('/artifacts/grading.log'), config['files']['test'])
    report.update(passed=bool(observed) and all(r['exitCode'] == 0 for r in observed) and not errors,
                  feedback=(errors or '')[-16000:])
except subprocess.TimeoutExpired:
    report.update(feedback='Original tests timed out after 180 seconds.', timedOut=True)
except Exception as error:
    report['infrastructureError'] = str(error)
finally:
    combined = '\n'.join(outputs)
    if re.search(r'Could not resolve all files|Could not resolve dependencies|Could not GET |Could not download |failed to download from|Temporary failure in name resolution|Network is unreachable', combined, re.I):
        report['infrastructureError'] = 'Dependency/network failure in original grader; inspect grading.log'
        report['passed'] = False
    report['commands'] = observed
    pathlib.Path('/artifacts/grade.json').write_text(json.dumps(report, indent=2))
