'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function norm(file) {
  return String(file == null ? '' : file).replace(/\\/g, '/').replace(/^\.\//, '');
}

function stepFiles(step) {
  return Array.from(new Set(((step && step.files) || []).map(norm).filter(Boolean)));
}

function ownedFiles(step) {
  const instruction = String((step && step.text) || '').split(/(?:—|\bcheck\s*:)/i)[0];
  let files = stepFiles(step).filter(function (file) { return instruction.indexOf(file) !== -1; });
  if (/^\s*(?:edit|update|modify|refactor|change|fix|patch)\b/i.test(instruction) && files.length > 1) files = [files[0]];
  return files.length ? files : stepFiles(step);
}

function buildUnits(planSteps, options) {
  options = options || {};
  const maxUnits = Math.max(2, Math.min(6, Number(options.maxUnits) || 4));
  const steps = (planSteps || []).filter(function (step) { return ownedFiles(step).length; });
  if (steps.length < 2) return [];

  const parent = steps.map(function (_, index) { return index; });
  function find(index) {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  }
  const owners = Object.create(null);
  steps.forEach(function (step, index) {
    ownedFiles(step).forEach(function (file) {
      if (owners[file] == null) owners[file] = index;
      else union(owners[file], index);
    });
  });

  const grouped = new Map();
  steps.forEach(function (step, index) {
    const root = find(index);
    if (!grouped.has(root)) grouped.set(root, []);
    grouped.get(root).push(step);
  });

  let units = Array.from(grouped.values()).map(function (group, index) {
    const files = [];
    const overwrites = [];
    group.forEach(function (step) {
      ownedFiles(step).forEach(function (file) { if (files.indexOf(file) === -1) files.push(file); });
      ((step.overwrites || []).map(norm)).forEach(function (file) { if (overwrites.indexOf(file) === -1) overwrites.push(file); });
    });
    files.forEach(function (file) { if (overwrites.indexOf(file) === -1) overwrites.push(file); });
    const first = group.reduce(function (low, step) { return Math.min(low, Number(step.index) || 0); }, Infinity);
    return {
      id: 'unit_' + (index + 1),
      index: first,
      steps: group.slice().sort(function (a, b) { return (Number(a.index) || 0) - (Number(b.index) || 0); }),
      files: files,
      overwrites: overwrites,
      checks: group.map(function (step) { return String(step.check || '').trim(); }).filter(Boolean)
    };
  }).sort(function (a, b) { return a.index - b.index; });

  if (units.length < 2) return [];

  while (units.length > maxUnits) {
    let smallest = 0;
    for (let i = 1; i < units.length; i++) {
      if (units[i].files.length < units[smallest].files.length) smallest = i;
    }
    const removed = units.splice(smallest, 1)[0];
    const target = units[smallest === units.length ? 0 : smallest] || units[0];
    target.steps = target.steps.concat(removed.steps).sort(function (a, b) { return (Number(a.index) || 0) - (Number(b.index) || 0); });
    removed.files.forEach(function (file) { if (target.files.indexOf(file) === -1) target.files.push(file); });
    removed.overwrites.forEach(function (file) { if (target.overwrites.indexOf(file) === -1) target.overwrites.push(file); });
    target.checks = target.checks.concat(removed.checks);
  }

  return units.map(function (unit, index) {
    unit.id = 'unit_' + (index + 1);
    return unit;
  });
}

function verifyFiles(root, files) {
  const checks = [];
  (files || []).forEach(function (file) {
    const full = path.isAbsolute(file) ? file : path.join(root, file);
    let stat = null;
    try { stat = fs.statSync(full); } catch (error) {}
    if (!stat || !stat.isFile()) {
      checks.push({ ok: false, file: file, error: 'file was not created' });
      return;
    }
    if (stat.size === 0) {
      checks.push({ ok: false, file: file, error: 'file is empty' });
      return;
    }
    checks.push({ ok: true, file: file, bytes: stat.size });
    if (/\.(?:js|cjs|mjs)$/i.test(file)) {
      const syntax = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8', timeout: 10000, windowsHide: true });
      checks.push({
        ok: syntax.status === 0 && !syntax.error,
        file: file,
        error: syntax.status === 0 ? '' : String(syntax.stderr || syntax.error || 'syntax check failed').slice(0, 400)
      });
    } else if (/\.json$/i.test(file)) {
      try { JSON.parse(fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '')); checks.push({ ok: true, file: file }); }
      catch (error) { checks.push({ ok: false, file: file, error: error.message }); }
    }
  });
  const failed = checks.filter(function (check) { return !check.ok; });
  return { ok: failed.length === 0, checks: checks, failed: failed };
}

function unitPrompt(unit, allUnits, request) {
  const otherFiles = [];
  allUnits.forEach(function (other) {
    if (other.id === unit.id) return;
    other.files.forEach(function (file) { if (otherFiles.indexOf(file) === -1) otherFiles.push(file); });
  });
  const steps = unit.steps.map(function (step) {
    return String(step.index) + '. ' + String(step.text || '').slice(0, 500);
  }).join('\n');
  return '[DELEGATED TASK ' + unit.id + ' — one of ' + allUnits.length + ' parallel workers]\n'
    + 'You own ONLY these files: ' + JSON.stringify(unit.files) + '\n'
    + (otherFiles.length ? 'Other workers are responsible for these files at the same time: ' + JSON.stringify(otherFiles) + '\n' : '')
    + 'Do not create or edit any file outside your owned files. Do not run shell commands or spawn subagents. Read any existing file you need for context.\n'
    + 'Create complete, working files. Keep shared names, link paths, element ids and function signatures consistent with the rest of the project. Do not leave placeholders.\n'
    + 'Start now: your first response must contain one or more write tool calls for your owned files. Do not send a plan, questions, or a prose-only answer before writing.\n'
    + 'Your plan steps:\n' + steps + '\n'
    + (unit.checks.length ? 'Required checks: ' + unit.checks.join('; ') + '\n' : '')
    + 'When done, briefly state the exact files you wrote. If a step cannot be done inside your scope, explain the integration gap instead of editing another worker\'s file.\n'
    + '[END DELEGATED TASK]\n\nOriginal request:\n' + String(request || '').slice(0, 16000);
}

function retryPrompt(unit, request, failure) {
  return '[DELEGATED TASK RETRY ' + unit.id + ']\n'
    + 'The previous attempt did not complete its owned files. You MUST change the files now with write/edit tools; a prose reply is a failed attempt.\n'
    + 'Owned files: ' + JSON.stringify(unit.files) + '\n'
    + 'Observed failures: ' + String(failure || '').slice(0, 1200) + '\n'
    + 'Write complete files for the owned paths. Do not touch any other file. Do not run shell commands.\n'
    + 'Required work:\n' + unit.steps.map(function (step) { return String(step.index) + '. ' + String(step.text || '').slice(0, 500); }).join('\n') + '\n'
    + 'Original request:\n' + String(request || '').slice(0, 12000);
}

async function run(options) {
  options = options || {};
  const units = (options.units || []).slice();
  const root = options.root || process.cwd();
  const request = options.request || '';
  const runSubagent = options.runSubagent;
  if (typeof runSubagent !== 'function') throw new Error('orchestrator requires a subagent runner');
  if (!units.length) return { ok: false, actions: {}, units: [], summary: 'No independent tasks were available.' };

  const concurrency = Math.max(1, Math.min(Number(options.concurrency) || 3, units.length));
  const budget = Math.max(4, Math.min(12, Number(options.maxModelCalls) || 8));
  const actions = { reads: 0, writes: [], edits: [], execs: [], fetched: [], searched: 0, toolsInstalled: [], asks: 0 };
  const drafterIds = [];
  const results = new Array(units.length);
  let cursor = 0;

  async function merge(sub) {
    if (!sub) return;
    const src = sub.actions || {};
    actions.reads += src.reads || 0;
    ['writes', 'edits', 'execs', 'fetched', 'toolsInstalled', 'sources', 'rea', 'bgJobs', 'execResults'].forEach(function (key) {
      if (Array.isArray(src[key])) (actions[key] = actions[key] || []).push.apply(actions[key], src[key]);
    });
    ['searched', 'asks', 'tasks'].forEach(function (key) { actions[key] = (actions[key] || 0) + (src[key] || 0); });
    (sub.drafterIds || []).forEach(function (id) { if (id && drafterIds.indexOf(String(id).toLowerCase()) === -1) drafterIds.push(String(id).toLowerCase()); });
  }

  async function work(index) {
    const unit = units[index];
    let sub = null;
    let verdict = { ok: false, failed: [{ error: 'not started' }] };
    try {
      sub = await runSubagent(unitPrompt(unit, units, request), {
        label: unit.id,
        readOnly: false,
        freeOnly: !!(options.callOptions && options.callOptions.freeOnly),
        noMemory: true,
        force: options.force || null,
        planTargets: unit.files,
        overwriteTargets: unit.overwrites,
        scopeTargets: unit.files,
        maxSteps: 5,
        toolCap: 10,
        maxModelCalls: budget,
        maxRetries: 1,
        timeoutMs: 60000,
        verify: false
      }, options.aiCall, { onTool: options.onTool });
      await merge(sub);
      verdict = verifyFiles(root, unit.files);
      if (!verdict.ok) {
        const failure = verdict.failed.map(function (check) { return check.file + ': ' + (check.error || 'failed'); }).join('; ');
        const retry = await runSubagent(retryPrompt(unit, request, failure), {
          label: unit.id + '_retry',
          readOnly: false,
          freeOnly: !!(options.callOptions && options.callOptions.freeOnly),
          noMemory: true,
          force: options.force || null,
          planTargets: unit.files,
          overwriteTargets: unit.overwrites,
          scopeTargets: unit.files,
          maxSteps: 4,
          toolCap: 8,
          maxModelCalls: budget,
          maxRetries: 1,
          timeoutMs: 60000,
          verify: false
        }, options.aiCall, { onTool: options.onTool });
        await merge(retry);
        verdict = verifyFiles(root, unit.files);
      }
    } catch (error) {
      verdict = { ok: false, failed: [{ error: String((error && error.message) || error).slice(0, 800) }] };
    }
    results[index] = {
      id: unit.id,
      files: unit.files,
      ok: !!verdict.ok,
      failed: verdict.failed || [],
      result: sub && sub.result ? String(sub.result).slice(0, 2000) : ''
    };
  }

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= units.length) return;
      await work(index);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  const completed = results.filter(function (result) { return result && result.ok; });
  const incomplete = results.filter(function (result) { return result && !result.ok; });
  const summary = completed.length === units.length
    ? 'Completed ' + units.length + ' delegated task' + (units.length === 1 ? '' : 's') + ' and integrated ' + completed.reduce(function (n, result) { return n + result.files.length; }, 0) + ' files.'
    : 'Completed ' + completed.length + ' of ' + units.length + ' delegated tasks.';
  return {
    ok: incomplete.length === 0,
    actions: actions,
    units: results,
    completed: completed.length,
    incomplete: incomplete,
    drafterIds: drafterIds,
    planSteps: units.reduce(function (all, unit) { return all.concat(unit.steps); }, []).sort(function (a, b) { return (Number(a.index) || 0) - (Number(b.index) || 0); }),
    summary: summary
  };
}

module.exports = { buildUnits, verifyFiles, unitPrompt, retryPrompt, run, norm, ownedFiles };
