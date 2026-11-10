'use strict';
// Dual-perspective consensus: every generation is assessed from two
// independent perspectives — prompt-faithfulness and code correctness —
// and only emitted when both agree. If they disagree, generation restarts.

// shortcut: infinite retries by default — accuracy prioritized over speed.
// set CHODE_DUAL_MAX_RETRIES to a finite number to cap attempts.
var envRetries = process.env.CHODE_DUAL_MAX_RETRIES;
var MAX_DUAL_RETRIES = envRetries ? Number(envRetries) : 3;
if (!Number.isFinite(MAX_DUAL_RETRIES)) MAX_DUAL_RETRIES = Infinity;

function promptFaithfulnessCheck(originalPrompt, output) {
  return {
    perspective: 'prompt-faithfulness',
    check: 'You are a prompt-faithfulness reviewer. Your ONLY job is to determine whether the assistant output faithfully addresses everything the user asked for in the original prompt.\n\nORIGINAL PROMPT:\n' + String(originalPrompt || '') + '\n\nASSISTANT OUTPUT:\n' + String(output || '').slice(0, 48000) + '\n\nINSTRUCTIONS:\n- Read the original prompt carefully. Identify every request, requirement, constraint, and question.\n- Read the assistant output carefully.\n- Determine: does the output address ALL requests in the prompt? Does it omit anything? Does it add unrelated content? Does it contradict any requirement?\n- If the output is fully faithful to the prompt, reply exactly: PASS\n- If the output misses, misrepresents, or contradicts any part of the prompt, reply exactly: FAIL:<specific missing or incorrect requirement>\n- Do not judge code correctness here - only prompt-faithfulness.\n- Reply with exactly PASS or FAIL:..., nothing else.\n'
  };
}

function codeCorrectnessCheck(output) {
  return {
    perspective: 'code-correctness',
    check: 'You are a code-correctness reviewer. Your ONLY job is to determine whether the code in the assistant output is correct.\n\nASSISTANT OUTPUT:\n' + String(output || '').slice(0, 48000) + '\n\nINSTRUCTIONS:\n- Extract all code blocks from the output.\n- For each code block, check: syntax validity, logical correctness, API usage correctness, error handling, edge cases.\n- If there is no code, check whether the output appropriately states that no code was needed.\n- If ALL code is correct and the output is sound, reply exactly: PASS\n- If ANY code has bugs, syntax errors, logical flaws, or incorrect API usage, reply exactly: FAIL:<specific file/line and issue>\n- Do not judge prompt-faithfulness here - only code correctness.\n- Reply with exactly PASS or FAIL:..., nothing else.\n'
  };
}

function parseVerdict(result) {
  var r = String(result || '').trim();
  if (r === 'PASS' || r.indexOf('PASS') === 0) return { ok: true, detail: '' };
  if (r.indexOf('FAIL:') === 0) return { ok: false, detail: r.slice(5) };
  return { ok: false, detail: 'unclear verdict: ' + r.slice(0, 200) };
}

async function assessPerspective(aiCall, sessionId, force, callOptions, check) {
  try {
    // Reviewer calls are ephemeral (sessionId null: consensus internals) —
    // never persisted, so PASS/FAIL exchanges can't crowd out real conversation.
    var review = await aiCall(check.check, null, force, Object.assign({}, callOptions, {
      onToken: undefined,
      disallow: [] // assessors need no tools - pure review
    }));
    if (!review || !review.result) return { ok: false, message: 'no review response', perspective: check.perspective };
    var verdict = parseVerdict(review.result);
    return { ok: verdict.ok, message: verdict.detail, perspective: check.perspective, raw: review.result };
  } catch (e) {
    return { ok: false, message: 'review error: ' + String((e && e.message) || e).slice(0, 200), perspective: check.perspective };
  }
}

async function dualConsensus(aiCall, sessionId, force, callOptions, originalPrompt, output) {
  var results = await Promise.all([
    assessPerspective(aiCall, sessionId, force, callOptions, promptFaithfulnessCheck(originalPrompt, output)),
    assessPerspective(aiCall, sessionId, force, callOptions, codeCorrectnessCheck(output))
  ]);
  var faithResult = results[0];
  var codeResult = results[1];
  return {
    agreed: faithResult.ok && codeResult.ok,
    faithResult: faithResult,
    codeResult: codeResult,
    faithOk: faithResult.ok,
    codeOk: codeResult.ok
  };
}

function wrapAiCall(originalAiCall, sessionId, force, callOptions, originalPrompt) {
  return async function dualWrappedAiCall(prompt, sid, fpid, opts) {
    var lastResult = null;
    for (var attempt = 0; attempt <= MAX_DUAL_RETRIES; attempt++) {
      var res = await originalAiCall(prompt, sid, fpid, opts);
      lastResult = res;
      if (!res || !res.result) return res;
      var consensus = await dualConsensus(originalAiCall, sid, fpid, opts, originalPrompt, res.result);
      if (consensus.agreed) {
        res._dualConsensus = { agreed: true, attempts: attempt + 1 };
        return res;
      }
      prompt = prompt + '\n\n[DUAL CONSENSUS REJECTED - previous output failed review]\n' +
        'Prompt-faithfulness review: ' + (consensus.faithResult.ok ? 'PASS' : 'FAIL: ' + consensus.faithResult.message) + '\n' +
        'Code-correctness review: ' + (consensus.codeResult.ok ? 'PASS' : 'FAIL: ' + consensus.codeResult.message) + '\n' +
        'Regenerate the output addressing both reviews. Both perspectives must pass before output is emitted.\n[END DUAL CONSENSUS REJECTED]';
    }
    if (lastResult) lastResult._dualConsensus = { agreed: false, attempts: MAX_DUAL_RETRIES + 1 };
    return lastResult;
  };
}

module.exports = {
  dualConsensus: dualConsensus,
  wrapAiCall: wrapAiCall,
  promptFaithfulnessCheck: promptFaithfulnessCheck,
  codeCorrectnessCheck: codeCorrectnessCheck,
  MAX_DUAL_RETRIES: MAX_DUAL_RETRIES
};
