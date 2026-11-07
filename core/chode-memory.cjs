// Chode Memory — Error message hash -> known cause mapping
// Computes a stable sha256 hash of normalized error messages and maps them
// to known causes and suggested fixes, so recurring errors are diagnosed fast.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', '.chode', 'memory');
const MEMORY_FILE = path.join(MEMORY_DIR, 'error-causes.json');

// Normalize error messages so equivalent errors hash identically:
// - collapse whitespace
// - strip absolute file paths (machine-specific)
// - strip line/column numbers
// - strip timestamps
function normalize(message) {
    if (typeof message !== 'string') return String(message);
    let m = message
        .replace(/[A-Za-z]:[\\/][^:]*\.(?:cjs|js|mjs|json|ts|lean|py|txt|md)/g, '<file>')
        .replace(/[\\/][^\\/ :]*\.(?:cjs|js|mjs|json|ts|lean|py|txt|md)/g, '<file>')
        .replace(/:\d+(:\d+)?/g, ':<line>')
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '<time>')
        .replace(/\s+/g, ' ')
        .trim();
    return m;
}

function hashMessage(message) {
    return crypto.createHash('sha256').update(normalize(message), 'utf8').digest('hex');
}

function loadMemory() {
    try {
        if (!fs.existsSync(MEMORY_FILE)) return {};
        const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        return {};
    }
}

// Specificity gate: only store errors that carry enough signal to be useful.
// Rejects generic one-word messages; keeps messages with file paths, line
// numbers, identifiers, or module references.
function isSpecific(message) {
    if (typeof message !== 'string') return false;
    const m = message.trim();
    if (m.length < 20) return false;
    const signals = [
        /[A-Za-z_]\w*\(/,                        // function-like call
        /[A-Z][A-Za-z0-9_]*\./,                   // namespaced identifier
        /\.\w{2,4}(\b|$)/,                       // file extension
        /:\d+/,                                   // line/column number
        /(module|require|import|SyntaxError|ReferenceError|TypeError)/i
    ];
    return signals.some(re => re.test(m));
}

function saveMemory(memory) {
    if (!fs.existsSync(MEMORY_DIR)) {
        fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2) + '\n', 'utf8');
}

function lookup(errorMessage) {
    const h = hashMessage(errorMessage);
    const memory = loadMemory();
    return memory[h] || null;
}

function record(errorMessage, cause, solution) {
    if (!isSpecific(errorMessage)) return null;
    const h = hashMessage(errorMessage);
    const memory = loadMemory();
    memory[h] = { error: normalize(errorMessage), cause, solution, hash: h };
    saveMemory(memory);
    return h;
}

module.exports = { normalize, hashMessage, isSpecific, lookup, record, MEMORY_FILE };
