'use strict';

// Presentation is independent of tool execution. Never infer success here.
function clean(value, limit) {
  return String(value == null ? '' : value)
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').replace(/\s+/g, ' ').trim()
    .slice(0, limit || 100);
}
function colorEnabled(stream, env) {
  env = env || process.env;
  return !!(stream && stream.isTTY) && !Object.prototype.hasOwnProperty.call(env, 'NO_COLOR') && env.TERM !== 'dumb';
}
function toolLabel(call) {
  call = call || {};
  var a = call.args || {};
  var names = { read: 'Read', write: 'Write', edit: 'Edit', grep: 'Search', glob: 'Find files', exec: 'Run', webfetch: 'Fetch', websearch: 'Search web', task: 'Delegate', todo: 'Plan', ask: 'Ask' };
  // Do not print content, replacement text, arbitrary argument JSON or shell secrets.
  var target = a.file || a.pattern || (call.tool === 'websearch' ? a.query : '');
  if (call.tool === 'exec') target = clean(a.cmd, 120).split(' ')[0];
  if (call.tool === 'webfetch') { try { target = new URL(a.url).hostname; } catch (_) { target = ''; } }
  return (names[call.tool] || clean(call.tool, 24)) + (target ? ' ' + clean(target, 80) : '');
}
function friendlyError(error) {
  var s = String(error && error.message || error || '');
  if (/401|403|auth_failed|invalid.*key|unauthorized/i.test(s)) return 'Authentication needs attention. Run `chode auth`.';
  if (/429|rate.?limit|quota/i.test(s)) return 'Provider limit reached. Try again shortly or choose another provider.';
  if (/timeout|timed out|ETIMEDOUT/i.test(s)) return 'The request timed out. Your session is saved; try again.';
  if (/ENOTFOUND|ECONN|fetch failed|dns_failed|network/i.test(s)) return 'Could not reach the provider. Check your connection and try again.';
  if (/ENOENT|not found|does not exist/i.test(s)) return 'The requested file or resource was not found.';
  if (/EACCES|EPERM|permission|denied/i.test(s)) return 'Access was denied. Check the path and permissions.';
  return 'This step could not finish. Use /details on and retry for diagnostics.';
}
function createToolReporter(write, options) {
  options = options || {};
  return function (event) {
    if (!event || !event.call) return;
    var label = toolLabel(event.call);
    if (event.phase === 'start') {
      if (options.details) write('  · ' + label + '…\n', 'dim');
      return;
    }
    var r = event.result || {};
    var success = r.ok === true;
    write('  ' + (success ? '✓ ' : '! ') + label + (success ? '' : ' — ' + friendlyError(r.error)) + '\n', success ? 'dim' : 'yellow');
    if (options.details && !success) write('    ' + clean(r.error, 240) + '\n', 'dim');
  };
}
function createMarkdownRenderer(options) {
  options = options || {};
  var fenced = false, fenceChar = '', fenceLength = 0;
  function style(s, code) { return options.color === false ? s : '\x1b[' + code + 'm' + s + '\x1b[0m'; }
  return function (line) {
    // Strip terminal controls from model output before rendering our own styles.
    line = String(line).replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, '');
    var fence = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (fence && (!fenced || (fence[1][0] === fenceChar && fence[1].length >= fenceLength && !fence[2].trim()))) {
      if (!fenced) { fenced = true; fenceChar = fence[1][0]; fenceLength = fence[1].length; return style('···' + (fence[2].trim() ? ' ' + fence[2].trim() : ''), '2'); }
      fenced = false; return style('···', '2');
    }
    if (fenced) return line;
    var heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) return style(heading[1], '1');
    return line.replace(/\*\*([^*]+)\*\*/g, function (_, s) { return style(s, '1'); })
      .replace(/`([^`]+)`/g, function (_, s) { return style(s, '33'); })
      .replace(/^(\s*)[-*]\s+/, '$1• ');
  };
}
function sessionHeader(context, columns) {
  var width = Math.max(24, Math.min(Number(columns) || 80, 100)) - 4;
  var title = 'chode · ' + clean(context, width - 10);
  return '  ┌' + '─'.repeat(width) + '┐\n  │' + title.padEnd(width) + '│\n  └' + '─'.repeat(width) + '┘\n';
}
function successfulResult(result) {
  return !!(result && typeof result.result === 'string' && result.result.trim() && !result.degraded && !result.partial && !result.protocolError && !['FAILED', 'UNVERIFIED', 'PENDING'].includes(result.completionStatus));
}
module.exports = { clean, colorEnabled, toolLabel, friendlyError, createToolReporter, createMarkdownRenderer, sessionHeader, successfulResult };
