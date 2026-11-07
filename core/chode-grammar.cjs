// Chode Grammar — Token parsing & rule validation
// Enforces syntactic rules, token boundaries, and structural constraints on incoming payloads.
'use strict';

function tokenize(payload) {
    if (typeof payload !== 'string' || payload.length === 0) {
        return { valid: false, tokens: [], error: 'payload must be a non-empty string' };
    }
    const tokens = payload.split(/\s+/).filter(t => t.length > 0);
    return { valid: true, tokens, error: null };
}

function validateStructure(payload) {
    const result = tokenize(payload);
    if (!result.valid) return result;
    // Structural constraint: no bare pipe characters outside state-id format
    if (payload.includes('||')) {
        return { valid: false, tokens: result.tokens, error: 'double pipe delimiter not allowed' };
    }
    return { valid: true, tokens: result.tokens, error: null };
}

module.exports = { tokenize, validateStructure };
