'use strict';
/**
 * Z6P Integration Layer - Phase 3: Handoff Protocol
 * 
 * Integrates Z6Plan with chode's existing plan parsing and provider switching.
 * Provides hash-bound handoff state between provider calls.
 */

const crypto = require('crypto');
const path = require('path');
const { Z6Plan } = require('./plan-z6');
const localMemory = require('./local-memory');

/**
 * Convert legacy plan steps array to Z6Plan
 * @param {Array} legacySteps - Array of {index, text, files, check}
 * @param {string} sessionId - Session ID for storage
 * @returns {Z6Plan}
 */
function legacyToZ6Plan(legacySteps, sessionId) {
  if (!legacySteps || !Array.isArray(legacySteps)) {
    return new Z6Plan([]);
  }
  
  const steps = legacySteps.map((step, i) => ({
    id: i,
    description: step.text || step.desc || '',
    files: step.files || [],
    check: step.check || '',
    status: 0, // pending
    dependsOn: [],
    preConditions: [],
    postConditions: []
  }));
  
  return new Z6Plan(steps, sessionId ? { id: sessionId } : undefined);
}

/**
 * Parse plan text into Z6Plan (replaces parsePlanSteps)
 * @param {string} planText - Raw plan text from model
 * @param {string} sessionId - Session ID
 * @returns {Z6Plan}
 */
function parsePlanToZ6(planText, sessionId) {
  const legacySteps = [];
  String(planText || '').split('\n').forEach(function (ln) {
    var m = ln.match(/^\s*(?:step\s*)?(\d+)[.):\-]\s+(.*)$/i);
    if (m) {
      legacySteps.push({ 
        index: parseInt(m[1], 10), 
        text: m[2].slice(0, 500), 
        raw: ln.slice(0, 500) 
      });
    }
  });
  legacySteps.sort((a, b) => a.index - b.index);
  return legacyToZ6Plan(legacySteps, sessionId);
}

/**
 * Serialize Z6Plan to handoff state
 * @param {Z6Plan} plan - Plan to serialize
 * @param {Object} context - Additional context (provider, capacity, etc.)
 * @returns {Object} Hash-bound handoff state
 */
function serializeHandoff(plan, context) {
  const state = {
    plan: plan ? plan.serialize() : null,
    provider: context?.provider || null,
    providerHealth: context?.providerHealth || 0,
    capacityState: context?.capacityState || {},
    timestamp: Date.now()
  };
  
  const encoded = JSON.stringify(state);
  const stateHash = crypto.createHash('sha256').update(encoded).digest('hex');
  return {
    handoffId: plan ? String(plan.id) : null,
    state,
    hash: stateHash,
    selfHash: crypto.createHash('sha256').update(encoded + stateHash).digest('hex')
  };
}

/**
 * Deserialize handoff state
 * @param {Object} handoff - Serialized handoff
 * @param {string} sessionId - Session ID
 * @returns {Object} { plan, context, valid }
 */
function deserializeHandoff(handoff, sessionId) {
  if (!handoff || !handoff.state) {
    return { plan: null, context: {}, valid: false, reason: 'No handoff state' };
  }
  
  // Verify hash integrity (matches serializeHandoff exactly)
  const encoded = JSON.stringify(handoff.state);
  const expectedHash = crypto.createHash('sha256').update(encoded).digest('hex');
  const expectedSelfHash = crypto.createHash('sha256').update(encoded + expectedHash).digest('hex');
  
  if (handoff.hash !== expectedHash || handoff.selfHash !== expectedSelfHash) {
    return { plan: null, context: {}, valid: false, reason: 'Hash integrity check failed' };
  }
  
  // Reconstruct Z6Plan
  let plan = null;
  if (handoff.state.plan && handoff.state.plan.steps) {
    plan = Z6Plan.fromSerialized(handoff.state.plan, sessionId);
  }
  
  return {
    plan,
    context: {
      provider: handoff.state.provider,
      providerHealth: handoff.state.providerHealth,
      capacityState: handoff.state.capacityState
    },
    valid: true
  };
}

/**
 * Update plan step status based on tool actions
 * @param {Z6Plan} plan - Plan to update
 * @param {Object} actions - Tool actions from execution
 * @returns {Z6Plan} Updated plan
 */
function updatePlanFromActions(plan, actions, out) {
  if (!plan || !plan.steps) return plan;
  
  // Accept either {writes, edits} action records or a tool call / call list
  // (chode.js feeds the single call being executed plus its result).
  const modifiedFiles = new Set();
  const add = (file) => { if (typeof file === 'string' && file) modifiedFiles.add(file); };
  const entry = (item) => (typeof item === 'string' ? item : item && item.file);
  
  if (Array.isArray(actions)) {
    for (const call of actions) add(call && call.args ? call.args.file : null);
    if (out) add(out.file);
  } else if (actions && typeof actions === 'object') {
    if (actions.writes) actions.writes.forEach(w => add(entry(w)));
    if (actions.edits) actions.edits.forEach(e => add(entry(e))); // was a no-op: e.file was never added
    if (out) add(out.file);
  }
  
  plan.steps.forEach(step => {
    if (step.files.some(f => modifiedFiles.has(f))) {
      if (step.status === 0) step.status = 1; // pending -> in-progress
    }
  });
  
  return plan;
}

/**
 * Get next executable step from plan
 * @param {Z6Plan} plan - Plan to query
 * @param {Object} context - Current execution context
 * @returns {Z6PlanStep|null}
 */
function getNextStep(plan, context) {
  if (!plan) return null;
  return plan.getNextExecutable();
}

/**
 * Mark step as completed with verification
 * @param {Z6Plan} plan - Plan to update
 * @param {number} stepId - Step ID to complete
 * @param {Object} verification - Verification result
 * @returns {boolean} Success
 */
function completeStep(plan, stepId, verification) {
  if (!plan) return false;
  const step = plan.steps.find(s => s.id === stepId);
  if (!step) return false;
  
  // Check post-conditions
  const postConditionsOk = step.postConditions.every(c => c.check(verification));
  
  step.status = postConditionsOk ? 3 : 5; // done or failed
  return postConditionsOk;
}

/**
 * Save handoff state to local memory
 * @param {string} sessionId - Session ID
 * @param {Object} handoff - Serialized handoff
 * @returns {boolean} Success
 */
async function saveHandoffToMemory(sessionId, handoff) {
  try {
    localMemory.getMemoryManager().setHandoff(sessionId, handoff);
    return true;
  } catch (e) {
    console.error('Failed to save handoff:', e.message);
    return false;
  }
}

/**
 * Load last handoff state from local memory
 * @param {string} sessionId - Session ID (storage holds one handoff per session)
 * @returns {Promise<Object|null>}
 */
async function loadHandoffFromMemory(sessionId) {
  try {
    const handoff = localMemory.getMemoryManager().getHandoff(sessionId);
    return handoff && handoff.state ? handoff : null;
  } catch (e) {
    console.error('Failed to load handoff:', e.message);
    return null;
  }
}

module.exports = {
  legacyToZ6Plan,
  parsePlanToZ6,
  serializeHandoff,
  deserializeHandoff,
  updatePlanFromActions,
  getNextStep,
  completeStep,
  saveHandoffToMemory,
  loadHandoffFromMemory
};
