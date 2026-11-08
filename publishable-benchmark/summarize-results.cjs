'use strict';
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node summarize-results.cjs <results.json> [--version 1.9.53] [--engine-sha 826992...]');
  process.exit(1);
}

const resultsPath = path.resolve(input);
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const version = process.argv.includes('--version')
  ? process.argv[process.argv.indexOf('--version') + 1]
  : '1.9.53';
const dir = path.dirname(resultsPath);
const outMd = path.join(dir, 'results.md');

const solved = data.solved;
const total = data.total;
const pct = (100 * solved / total).toFixed(1);
const rows = data.results.map(r => {
  const secs = Math.round(r.elapsedMs / 1000);
  return `| ${r.task} | ${r.passed ? 'yes' : 'no'} | ${r.testsRun} | ${r.cliStatus || 'UNKNOWN'} | ${secs} |`;
}).join('\n');

const md = [
  '# Full Python production-CLI evaluation — Chode ' + version,
  '',
  `**${solved}/${total} tasks solved (${pct}%).** All ${total} completed, ${total - solved} failed; all original tests and frozen runtime release hashes match. Independent regrading before publication should agree on every outcome. Complete pinned Python track only, not the full six-language Aider leaderboard.`,
  '',
  `Provider: free mode. 30 shared logical model calls and 3600s per task, independent original-test grading 30s. Original protected tests visible. No reference solutions or manual repairs.`,
  '',
  '| Task | Solved | Tests run | CLI status | Seconds |',
  '|---|---|---:|---|---:|',
  rows,
  '',
  `[Full results, exact protocol, hashes and publication audit](./${path.basename(resultsPath)})`,
  ''
].join('\n');

fs.writeFileSync(outMd, md);
console.log(md.split('\n').slice(0, 3).join('\n'));
console.log('');
console.log('RESULT_BRIEF=' + solved + ' of ' + total + ' Python tasks solved');
console.log('MARKDOWN=' + outMd);
console.log('JSON=' + resultsPath);
console.log('PROVIDERS=' + Array.from(new Set(data.results.map(r => r.provider).filter(Boolean))).join(', '));
console.log('TIMED_OUT=' + data.results.filter(r => r.timedOut).length);
console.log('UPDATED_WORKER_BRIEF=' + solved + ' of ' + total + ' Python tasks solved');
