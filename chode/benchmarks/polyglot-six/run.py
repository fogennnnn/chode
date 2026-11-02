"""Full pinned Aider Polyglot task set through Chode; not an official Aider model row.

Run under Linux with Docker. Generation containers cannot mount original tests.
The grader uses upstream's exact commands, including its test enabling rules.
"""
import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
import time

LANGUAGES = ('cpp', 'go', 'java', 'javascript', 'python', 'rust')
DATASET = '7e0611e77b54e2dea774cdc0aa00cf9f7ed6144f'
UPSTREAM = '5dc9490bb35f9729ef2c95d00a19ccd30c26339c'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def write(file, value):
    temp = file.with_suffix(file.suffix + '.tmp')
    temp.write_text(json.dumps(value, indent=2) + '\n')
    temp.replace(file)

def discover(dataset):
    tasks = []
    for language in LANGUAGES:
        for source in (dataset / language / 'exercises/practice').iterdir():
            if source.is_dir():
                tasks.append((language, source.name))
    if len(tasks) != 225:
        raise RuntimeError('Expected all 225 tasks; found ' + str(len(tasks)))
    return sorted(tasks, key=lambda t: sha(('chode-polyglot-six-v1:' + '/'.join(t)).encode()))

def checked_file(root, name):
    p = (root / name).resolve()
    if not p.is_relative_to(root.resolve()) or not p.is_file():
        raise RuntimeError('Invalid dataset file: ' + name)
    return p

def run_command(command, log, timeout):
    with log.open('w') as output:
        try:
            r = subprocess.run(command, stdout=output, stderr=subprocess.STDOUT, timeout=timeout)
            return {'exitCode': r.returncode}
        except subprocess.TimeoutExpired:
            return {'exitCode': None, 'timedOut': True}

def docker_base(image, name):
    return ['docker', 'run', '--rm', '--name', name, '--cpus', '2', '--memory', '6g',
            '--pids-limit', '512', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', image]

def grade(args, language, slug, original, source, destination, artifacts, name):
    task = destination / language / 'exercises/practice' / slug
    shutil.copytree(original, task)
    config = json.loads((original / '.meta/config.json').read_text())
    for f in config['files']['solution']:
        candidate = source / f
        if candidate.is_file():
            if not candidate.resolve().is_relative_to(source.resolve()):
                raise RuntimeError('Generated solution links outside its workspace')
            target = (task / f).resolve()
            if not target.is_relative_to(task.resolve()):
                raise RuntimeError('Solution path escapes workspace')
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(candidate, target)
    artifacts.mkdir(parents=True)
    command = docker_base(args.grade_image, name)
    command[-1:-1] = ['-v', str(args.dataset) + ':/dataset:ro', '-v', str(destination) + ':/grade',
                       '-v', str(artifacts) + ':/artifacts', '-v', str(args.adapter) + ':/adapter:ro',
                       '-v', 'chode-polyglot-gradle:/root/.gradle', '-v', 'chode-polyglot-cargo:/root/.cargo/registry',
                       '-v', 'chode-polyglot-go:/root/.cache/go-build']
    command += ['python3', '/adapter/grade.py', '/grade/' + language + '/exercises/practice/' + slug]
    outcome = run_command(command, artifacts / 'container.log', 300)
    if outcome.get('timedOut'):
        subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    report = artifacts / 'grade.json'
    if not report.exists():
        raise RuntimeError('Grader infrastructure failed: ' + str(artifacts))
    result = json.loads(report.read_text())
    if result.get('infrastructureError'):
        raise RuntimeError('Grader infrastructure: ' + result['infrastructureError'])
    # Build products are reproducible and large; keep original source and grade logs.
    for relative in ['target', 'build', '.gradle', 'node_modules']:
        artifact = task / relative
        if artifact.is_symlink():
            artifact.unlink()
        elif artifact.is_dir() and artifact.resolve().is_relative_to(task.resolve()):
            shutil.rmtree(artifact)
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset', type=pathlib.Path, required=True)
    parser.add_argument('--out', type=pathlib.Path, required=True)
    parser.add_argument('--adapter', type=pathlib.Path, default=pathlib.Path(__file__).parent)
    parser.add_argument('--grade-image', default='chode-polyglot-eval:5dc9490-lf')
    parser.add_argument('--agent-image', default='chode-polyglot-agent:1.9.51')
    parser.add_argument('--preflight-only', action='store_true')
    args = parser.parse_args()
    args.dataset = args.dataset.resolve()
    args.out = args.out.resolve()
    args.adapter = args.adapter.resolve()
    revision = subprocess.check_output(['git', '-C', str(args.dataset), 'rev-parse', 'HEAD'], text=True).strip()
    if revision != DATASET or subprocess.check_output(['git', '-C', str(args.dataset), 'status', '--porcelain', '--untracked-files=no'], text=True).strip():
        raise RuntimeError('Expected the clean pinned dataset')
    args.grade_image = subprocess.check_output(['docker', 'image', 'inspect', args.grade_image, '--format', '{{.Id}}'], text=True).strip()
    tasks = discover(args.dataset)
    args.out.mkdir(parents=True, exist_ok=True)
    # Every language must reject an untouched stub before any model calls start.
    for language in LANGUAGES:
        slug = next(s for l, s in tasks if l == language)
        original = args.dataset / language / 'exercises/practice' / slug
        base = args.out / 'preflight' / language
        if (base / 'artifacts/grade.json').exists():
            prior = json.loads((base / 'artifacts/grade.json').read_text())
            if prior.get('infrastructureError') or prior.get('passed') or prior.get('timedOut') or not prior.get('commands'):
                raise RuntimeError('Invalid prior preflight: ' + language)
            continue
        result = grade(args, language, slug, original, original, base / 'grading', base / 'artifacts', 'chode-preflight-' + language)
        if result['passed'] or result.get('timedOut') or not result.get('commands'):
            raise RuntimeError('Invalid original-stub preflight: ' + language + '/' + slug)
    if args.preflight_only:
        print('PASS six-language original-stub grading preflight', flush=True)
        return
    image = subprocess.check_output(['docker', 'image', 'inspect', args.agent_image, '--format', '{{.Id}}'], text=True).strip()
    protocol = dict(schema=1, name='Full Aider Polyglot task-set / Chode agent v1', datasetCommit=DATASET,
                    aiderCommit=UPSTREAM, image=image, graderImage=args.grade_image, taskCount=225, languages=LANGUAGES,
                    containerCpus=2, containerMemory='6g', graderCaches='Persistent grader-only Gradle/Cargo/Go caches; not mounted for generation', attempts=2, modelCallsPerAttempt=30, generationSecondsPerAttempt=1800,
                    originalGradingSeconds=180, yolo=True, freeOnly=True, council='default',
                    testFeedback='Original tests withheld; failure output provided for second attempt',
                    comparableToOfficialLeaderboard=False,
                    differences='Chode native agent and verification scaffold, not Aider Coder; capped calls/wall budget; deterministic order',
                    developmentExposure='Public exercises repeatedly used in development; not held out',
                    adapterHash=sha(pathlib.Path(__file__).read_bytes()), graderHash=sha((args.adapter / 'grade.py').read_bytes()))
    args.agent_image = image
    protocol_file = args.out / 'protocol.json'
    if protocol_file.exists() and json.loads(protocol_file.read_text()) != json.loads(json.dumps(protocol)):
        raise RuntimeError('Protocol changed; use a new run directory')
    write(protocol_file, protocol)
    results_file = args.out / 'results.json'
    results = json.loads(results_file.read_text())['results'] if results_file.exists() else []
    done = {r['task'] for r in results}
    for language, slug in tasks:
        key = language + '/' + slug
        if key in done:
            continue
        if sha((args.adapter / 'grade.py').read_bytes()) != protocol['graderHash'] or sha(pathlib.Path(__file__).read_bytes()) != protocol['adapterHash']:
            raise RuntimeError('Frozen evaluation adapter changed')
        root = args.out / 'tasks' / language / slug
        if root.exists():
            raise RuntimeError('Interrupted task requires explicit audit before restart: ' + key)
        original = args.dataset / language / 'exercises/practice' / slug
        config = json.loads((original / '.meta/config.json').read_text())
        hashes = {f: sha(checked_file(original, f).read_bytes()) for f in config['files']['test']}
        workspace = root / 'workspace'
        shutil.copytree(original, workspace)
        for f in config['files']['test'] + config['files'].get('example', []):
            candidate = (workspace / f).resolve()
            if not candidate.is_relative_to(workspace.resolve()):
                raise RuntimeError('Invalid protected file path')
            if candidate.is_file():
                candidate.unlink()
        instructions = '\n'.join((original / '.docs' / f).read_text() for f in ['introduction.md', 'instructions.md', 'instructions.append.md'] if (original / '.docs' / f).exists())
        files = ', '.join(config['files']['solution'])
        prompt = instructions + '\nImplement the complete solution in: ' + files + '. Preserve interfaces. Use only standard libraries. Original tests are withheld. Do not fetch reference solutions or browse outside this workspace. Do not edit scaffold files. Test outputs, when supplied, are authoritative.'
        outcomes = []
        started = time.time()
        for attempt in (1, 2):
            at = root / ('attempt-' + str(attempt))
            at.mkdir()
            (at / 'prompt.txt').write_text(prompt)
            write(args.out / 'progress.json', dict(task=key, attempt=attempt, completed=len(results), total=225))
            name = 'chode-six-' + str(len(results)) + '-' + str(attempt)
            command = docker_base(args.agent_image, name)
            command[-1:-1] = ['--read-only', '--tmpfs', '/tmp:rw,exec,size=1g', '--tmpfs', '/root:rw,exec,size=1g', '-v', str(workspace) + ':/work', '-w', '/work', '-e', 'CHODE_PROVIDER_HOME=/work/.chode/provider-home']
            command += ['node', '/opt/chode/node_modules/chode/chode.js', 'ai', prompt, '--free', '--yolo', '--json', '--no-web', '--no-memory', '--max-calls', '30']
            generation = run_command(command, at / 'agent.log', 1800)
            if generation.get('timedOut'):
                subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            judged = grade(args, language, slug, original, workspace, at / 'grading', at / 'artifacts', name + '-grade')
            if any(sha(checked_file(original, f).read_bytes()) != h for f, h in hashes.items()):
                raise RuntimeError('Original dataset test changed')
            outcomes.append(dict(attempt=attempt, generation=generation, passed=judged['passed']))
            if judged['passed']:
                break
            prompt = instructions + '\nFix only ' + files + '. Original tests are correct and must not be changed. Grading errors:\n' + judged.get('feedback', '')
        results.append(dict(task=key, language=language, passed=outcomes[-1]['passed'], attempts=outcomes, originalTestHashes=hashes, seconds=round(time.time()-started, 2)))
        write(results_file, dict(protocol=protocol, completed=len(results), total=225, solved=sum(r['passed'] for r in results), results=results))
        print('RESULT ' + key + ': ' + str(results[-1]['passed']) + ' (' + str(len(results)) + '/225)', flush=True)
    write(args.out / 'progress.json', dict(completed=225, total=225, finished=True))

if __name__ == '__main__':
    main()
