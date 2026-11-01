'use strict';

const assert = require('assert');
const tb = require('../toolbox');

async function main() {
  assert.strictEqual(tb.validName('ripgrep'), true);
  assert.strictEqual(tb.validName('@biomejs/biome'), true);
  for (const bad of ['rm -rf /', 'a;b', 'x|y', '$(evil)', '', 'a']) {
    assert.strictEqual(tb.validName(bad), false, JSON.stringify(bad) + ' must be rejected');
  }

  assert.equal(tb.REGISTRY.runn.repo, 'k1LoW/runn');
  assert.match(tb.REGISTRY.runn.external, /toolbox inspect/);
  assert.match(tb.workflowGuidance('Use SSH and capture a browser screenshot'), /k1LoW\/runn/);
  assert.match(tb.workflowGuidance('Use a CDP runbook'), /Cloning alone does not install/);
  assert.equal(tb.workflowGuidance('Add a sum function'), '', 'unrelated tasks spend no tokens on runn guidance');
  const list = tb.listTools();
  assert.ok(Array.isArray(list) && list.length >= 10, 'registry should hold 10+ tools');
  assert.ok(list.every(t => typeof t.installed === 'boolean'), 'each entry reports installed status');

  const dry = tb.ensureTool('ripgrep', { dryRun: true });
  assert.ok(dry.ok, 'dry-run ensure must succeed, got ' + JSON.stringify(dry));
  assert.ok(dry.already || dry.plan, 'dry-run reports already-installed or a plan');

  assert.strictEqual(tb.ensureTool('no-such-tool-xyz', {}).ok, false);
  assert.strictEqual(tb.ensureTool('x;rm -rf', {}).ok, false);

  const insp = tb.inspectRepo('owner/repo', '/tmp/x/tools/owner-repo', { dryRun: true });
  assert.ok(insp.ok && insp.dryRun, 'inspect dry-run must succeed');
  assert.strictEqual(tb.inspectRepo('not a repo', '/tmp/x', { dryRun: true }).ok, false);

  const reaList = tb.listTools().find(t => t.name === 'rea');
  assert.ok(reaList, 'rea external entry must be listed for discovery');
  const reaEnsure = tb.ensureTool('rea', {});
  assert.strictEqual(reaEnsure.external, true, 'rea ensure must report external, got ' + JSON.stringify(reaEnsure));
  assert.ok(!reaEnsure.ok, 'rea ensure must never claim success or auto-install');

  const repos = await tb.githubSearch('fuzzy finder', {
    fetch: async () => [{ fullName: 'junegunn/fzf', stars: 50000, desc: 'fuzzy finder', url: 'https://github.com/junegunn/fzf', language: 'Go' }]
  });
  assert.strictEqual(repos[0].fullName, 'junegunn/fzf');

  console.log('✓ toolbox: validation, registry, dry-run install, github mapping');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
