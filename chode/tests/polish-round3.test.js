'use strict';

// Polish round 3: session containment, force normalization, mermaid
// confinement, artifact fence preference, auth/agents messaging.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'chode.js');

function cli(cwd, args, input) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, input, encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (r.error) throw r.error;
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

async function fixture() {
  const chode = require('../chode.js');
  const tmp = process.cwd();

  // 1. Session ids cannot escape the session dir; corrupt shapes normalize.
  chode.saveSession({ id: '../../evil', messages: [{ role: 'user', content: 'x' }] });
  assert.ok(!fs.existsSync(path.join(tmp, 'evil.json')), 'traversal write must stay contained');
  assert.ok(!fs.existsSync(path.join(tmp, '..', 'evil.json')), 'traversal write must not escape upward');
  assert.strictEqual(chode.loadSession('../../evil').id, 'default');
  fs.mkdirSync(path.join(tmp, '.chode', 'sessions'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '.chode', 'sessions', 'broken.json'), '[1,2', 'utf8');
  fs.writeFileSync(path.join(tmp, '.chode', 'sessions', 'shapeless.json'), '{"id":"shapeless"}', 'utf8');
  assert.deepStrictEqual(chode.loadSession('broken').messages, [], 'corrupt sessions normalize');
  assert.deepStrictEqual(chode.loadSession('shapeless').messages, [], 'shapeless sessions normalize');

  // 2. Unknown --force fails fast with no network touch.
  let r = cli(tmp, ['ai', '--force', 'nosuch', '--no-tools', '--no-web', 'hi']);
  assert.ok(r.out.includes('Unknown provider'), 'unknown force must say so, got:\n' + r.out.slice(0, 300));

  // 3. --force=X form parses.
  assert.strictEqual(chode.parseArgs(['--force=OVH']).force, 'OVH');

  // 4. Mermaid --out stays in the workspace.
  r = cli(tmp, ['util', 'mermaid', 'render', '--out', '../evil.svg']);
  assert.ok(r.out.includes('must stay inside the workspace'), 'mermaid out traversal blocked');

  // 5. Artifact extraction prefers the HTML fence over earlier fences.
  const mixed = 'Some explanation:\n```js\nconsole.log(1)\n```\nFull page:\n```html\n<!doctype html><html><head><title>T</title></head><body><h1>Hi</h1></body></html>\n```';
  const html = chode.extractHtmlArtifact(mixed);
  assert.ok(html && html.includes('<h1>Hi</h1>') && !html.includes('console.log'), 'HTML fence must win');

  // 6. Keyless auth messaging + agents remove validation (spawned, temp .chode).
  r = cli(tmp, ['auth', 'ovh']);
  assert.ok(r.out.includes('needs no API key'), 'keyless auth must say so');
  r = cli(tmp, ['agents', 'remove']);
  assert.ok(r.out.includes('Usage'), 'remove without id shows usage');
  r = cli(tmp, ['agents', 'remove', 'ghost-xyz']);
  assert.ok(r.out.includes('No such agent'), 'removing absent agent reports it');

  // 7. Exec denylist covers Windows + unix recursive deletes.
  for (const cmd of ['rm -rf /tmp/x', 'rmdir /s C:\\x', 'Remove-Item -Recurse -Force .', 'diskpart', 'mkfs.ext4 /dev/sda']) {
    assert.ok(!chode.toolRunExec(cmd, { approved: true }).ok, cmd + ' must be denied');
  }
  assert.ok(chode.toolRunExec('echo hi', { approved: true }).ok, 'benign commands run');

  // 8. CLI display + routing details (spawned).
  const toolList = cli(tmp, ['tool']).out;
  assert.ok(/webfetch  fetch/.test(toolList), 'tool list columns must not overflow');
  const skillUsage = cli(tmp, ['skills', 'install']).out;
  assert.ok(skillUsage.includes('Usage: chode skills install <name>'), 'bare skills install shows usage');
  const unknown = spawnSync(process.execPath, [CLI, 'boguscmd'], { cwd: tmp, encoding: 'utf8', timeout: 30000, windowsHide: true });
  assert.strictEqual(unknown.status, 1, 'unknown command exits non-zero');
  assert.ok(((unknown.stdout || '') + (unknown.stderr || '')).includes('Unknown command'), 'unknown command explained');

  // 9. Entry affordances + traversal-safe resume (all offline).
  let h = cli(tmp, ['--help']).out;
  assert.ok(h.includes('Self-Healing'), '--help prints help');
  h = cli(tmp, ['--version']).out;
  assert.ok(/^\d+\.\d+\.\d+\s*$/.test(h.trim().split('\n').pop() || ''), '--version prints semver, got: ' + h.slice(-40));
  assert.ok(cli(tmp, ['-h']).out.includes('Self-Healing'), '-h prints help');
  assert.ok(cli(tmp, ['session', 'show']).out.includes('Usage: chode session show <id>'), 'show without id shows usage');
  assert.ok(cli(tmp, ['session', 'bogus-action-xyz']).out.includes('Usage: chode session'), 'unknown session action shows usage');
  assert.ok(cli(tmp, ['project', '--resume', '../../evil']).out.includes('Not found'), 'resume traversal blocked');

  chode.__resetBoundedForTest();
  console.log('✓ polish round3: sessions, force, mermaid, fences, auth, agents');
}

if (process.argv[2] === '--fixture') {
  fixture().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chode-polish-r3-'));
  try {
    const child = spawnSync(process.execPath, [__filename, '--fixture'], { cwd: temp, encoding: 'utf8', timeout: 120000, windowsHide: true });
    if (child.error) throw new Error(child.error.message + '\nstdout:\n' + (child.stdout || '') + '\nstderr:\n' + (child.stderr || ''));
    assert.strictEqual(child.status, 0, (child.stdout || '') + (child.stderr || ''));
    console.log((child.stdout || '').trim());
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
