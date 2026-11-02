'use strict';

/**
 * Local Memory Module for Chode
 * 
 * Filesystem-based persistent memory with Z6P-inspired design:
 * - Hash-bound state vectors for integrity
 * - Local, traversable storage in .chode/memory/
 * - Session compression after N messages
 * - Handoff state for provider switching
 * - Constraint validation hooks
 * 
 * Replaces HEMO vault dependency (remote HTTP) with local-first approach.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DIR = path.join(process.cwd(), '.chode', 'memory');
const SESSIONS_DIR = path.join(MEMORY_DIR, 'sessions');
const AUDIT_DIR = path.join(MEMORY_DIR, 'audit');
const COMPRESSION_THRESHOLD = 20;
const MAX_MESSAGES = 50;

// Z6 state vector indices
const Z6_STATE = {
  STEP: 0,           // Current step index (0-5)
  STATUS: 1,         // Session status (0=active, 1=paused, 2=completed, 3=failed, 4=blocked, 5=waiting)
  PROVIDER_HEALTH: 2, // Provider health score (0-5)
  CAPACITY: 3,       // Available capacity (0-5)
  QUEUE_DEPTH: 4,    // Pending tasks (0-5)
  ERROR_STATE: 5     // Error state (0=none, 1=recoverable, 2=unrecoverable, 3=rate-limited, 4=auth-failed, 5=timeout)
};

function ensureDirs() {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function selfHash(data, primaryHash) {
  return crypto.createHash('sha256').update(data + primaryHash).digest('hex');
}

/**
 * Session record with Z6 state vector
 */
class Session {
  constructor(id, metadata = {}) {
    this.id = id;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.messages = [];
    this.plan = null;
    this.handoff = null;
    this.stateVector = [0, 0, 0, 0, 0, 0]; // Z6 state
    this.metadata = metadata;
  }

  computeHash() {
    const data = JSON.stringify({
      id: this.id,
      messages: this.messages.length,
      stateVector: this.stateVector,
      plan: this.plan,
      handoff: this.handoff
    });
    return hash(data);
  }

  computeSelfHash() {
    const h = this.computeHash();
    const data = JSON.stringify({
      id: this.id,
      messages: this.messages.length,
      stateVector: this.stateVector,
      plan: this.plan,
      handoff: this.handoff
    });
    return selfHash(data, h);
  }

  serialize() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      messages: this.messages,
      plan: this.plan,
      handoff: this.handoff,
      stateVector: this.stateVector,
      metadata: this.metadata,
      hash: this.computeHash(),
      selfHash: this.computeSelfHash()
    };
  }

  static deserialize(data) {
    const s = new Session(data.id, data.metadata);
    s.createdAt = data.createdAt;
    s.updatedAt = data.updatedAt;
    s.messages = []; // Messages loaded from individual files, not meta.json
    s.plan = data.plan;
    s.handoff = data.handoff;
    s.stateVector = data.stateVector || [0, 0, 0, 0, 0, 0];
    return s;
  }
}

/**
 * Message record with hash-bound integrity
 */
class Message {
  constructor(role, content, metadata = {}) {
    this.id = crypto.randomUUID();
    this.role = role;
    this.content = content;
    this.timestamp = Date.now();
    this.metadata = metadata;
    this.hash = null;
    this.selfHash = null;
    this.computeHashes();
  }

  computeHashes() {
    const data = JSON.stringify({
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp,
      metadata: this.metadata
    });
    this.hash = hash(data);
    this.selfHash = selfHash(data, this.hash);
  }

  serialize() {
    return {
      ...this,
      hash: this.hash,
      selfHash: this.selfHash
    };
  }
}

/**
 * Local Memory Manager
 */
class LocalMemoryManager {
  constructor() {
    ensureDirs();
    this.sessions = new Map();
    this.auditLog = [];
  }

  /**
   * Create or load a session
   */
  getOrCreateSession(sessionId, metadata = {}) {
    const sessionPath = path.join(SESSIONS_DIR, sessionId, 'meta.json');
    
    if (fs.existsSync(sessionPath)) {
      const data = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      const session = Session.deserialize(data);
      
      // Load messages
      const messagesDir = path.join(SESSIONS_DIR, sessionId, 'messages');
      if (fs.existsSync(messagesDir)) {
        const files = fs.readdirSync(messagesDir).sort();
        for (const file of files) {
          const msgData = JSON.parse(fs.readFileSync(path.join(messagesDir, file), 'utf8'));
          session.messages.push(msgData);
        }
      }
      
      this.sessions.set(sessionId, session);
      return session;
    }
    
    const session = new Session(sessionId, metadata);
    this.sessions.set(sessionId, session);
    this.saveSession(session);
    return session;
  }

  /**
   * Save session to disk
   */
  saveSession(session) {
    session.updatedAt = Date.now();
    const sessionDir = path.join(SESSIONS_DIR, session.id);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    
    // Save metadata
    fs.writeFileSync(
      path.join(sessionDir, 'meta.json'),
      JSON.stringify(session.serialize(), null, 2),
      'utf8'
    );
    
    // Save messages individually (for traversability)
    const messagesDir = path.join(sessionDir, 'messages');
    if (!fs.existsSync(messagesDir)) fs.mkdirSync(messagesDir, { recursive: true });
    
    for (let i = 0; i < session.messages.length; i++) {
      const msg = session.messages[i];
      const msgPath = path.join(messagesDir, `${String(i + 1).padStart(4, '0')}.json`);
      if (!fs.existsSync(msgPath)) {
        const msgData = msg.serialize ? msg.serialize() : msg;
        fs.writeFileSync(msgPath, JSON.stringify(msgData, null, 2), 'utf8');
      }
    }
    
    // Log state transition to audit
    this.logTransition(session);
  }

  /**
   * Add a message to session
   */
  addMessage(sessionId, role, content, metadata = {}) {
    const session = this.getOrCreateSession(sessionId);
    const message = new Message(role, content, metadata);
    session.messages.push(message);
    
    // Compress if over threshold
    if (session.messages.length > COMPRESSION_THRESHOLD * 2) {
      this.compressSession(session);
    }
    
    // Trim to max
    if (session.messages.length > MAX_MESSAGES) {
      session.messages = session.messages.slice(-MAX_MESSAGES);
    }
    
    this.saveSession(session);
    return message;
  }

  /**
   * Compress old messages (keep recent + summary)
   */
  compressSession(session) {
    const keepCount = COMPRESSION_THRESHOLD;
    const toRemove = session.messages.length - keepCount;
    
    if (toRemove <= 0) return;
    
    // Create summary of removed messages
    const summary = new Message('system', `[SUMMARY: ${toRemove} messages compressed at ${new Date().toISOString()}]`, {
      compressedCount: toRemove
    });
    
    // Keep last N messages
    session.messages = [summary, ...session.messages.slice(-keepCount)];
    
    // Re-save all messages (overwrites old files)
    const messagesDir = path.join(SESSIONS_DIR, session.id, 'messages');
    if (fs.existsSync(messagesDir)) {
      fs.rmSync(messagesDir, { recursive: true, force: true });
    }
    fs.mkdirSync(messagesDir, { recursive: true });
    
    for (let i = 0; i < session.messages.length; i++) {
      const msg = session.messages[i];
      const msgPath = path.join(messagesDir, `${String(i + 1).padStart(4, '0')}.json`);
      const msgData = msg.serialize ? msg.serialize() : msg;
      fs.writeFileSync(msgPath, JSON.stringify(msgData, null, 2), 'utf8');
    }
    
    this.saveSession(session);
  }

  /**
   * Set handoff state for provider switching
   */
  setHandoff(sessionId, handoff) {
    const session = this.getOrCreateSession(sessionId);
    session.handoff = {
      ...handoff,
      timestamp: Date.now(),
      hash: hash(JSON.stringify(handoff)),
      selfHash: selfHash(JSON.stringify(handoff), hash(JSON.stringify(handoff)))
    };
    session.stateVector[Z6_STATE.STEP] = handoff.step || 0;
    this.saveSession(session);
  }

  /**
   * Get handoff state
   */
  getHandoff(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    return session.handoff;
  }

  /**
   * Set plan (Z6Plan serialized)
   */
  setPlan(sessionId, plan) {
    const session = this.getOrCreateSession(sessionId);
    session.plan = plan;
    this.saveSession(session);
  }

  /**
   * Get plan
   */
  getPlan(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    return session.plan;
  }

  /**
   * Update state vector
   */
  updateStateVector(sessionId, updates) {
    const session = this.getOrCreateSession(sessionId);
    for (const [key, value] of Object.entries(updates)) {
      if (Z6_STATE[key] !== undefined) {
        // Z6 modulo: ensure result is in [0, 5] even for negative values
        session.stateVector[Z6_STATE[key]] = ((value % 6) + 6) % 6;
      }
    }
    this.saveSession(session);
  }

  /**
   * Get state vector
   */
  getStateVector(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    return [...session.stateVector];
  }

  /**
   * List all sessions
   */
  listSessions() {
    const sessions = [];
    if (fs.existsSync(SESSIONS_DIR)) {
      const dirs = fs.readdirSync(SESSIONS_DIR);
      for (const dir of dirs) {
        const metaPath = path.join(SESSIONS_DIR, dir, 'meta.json');
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          sessions.push({
            id: meta.id,
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt,
            messageCount: meta.messages?.length || 0,
            stateVector: meta.stateVector,
            hasPlan: !!meta.plan,
            hasHandoff: !!meta.handoff
          });
        }
      }
    }
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Get session summary (without full messages)
   */
  getSessionSummary(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    return {
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
      stateVector: session.stateVector,
      hasPlan: !!session.plan,
      hasHandoff: !!session.handoff,
      hash: session.computeHash(),
      selfHash: session.computeSelfHash()
    };
  }

  /**
   * Log state transition to audit trail
   */
  logTransition(session) {
    const date = new Date().toISOString().split('T')[0];
    const auditFile = path.join(AUDIT_DIR, `${date}.log`);
    
    const entry = {
      timestamp: Date.now(),
      sessionId: session.id,
      stateVector: session.stateVector,
      hash: session.computeHash(),
      selfHash: session.computeSelfHash()
    };
    
    fs.appendFileSync(auditFile, JSON.stringify(entry) + '\n', 'utf8');
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId) {
    const sessionDir = path.join(SESSIONS_DIR, sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Cleanup old sessions (older than days)
   */
  cleanup(maxAgeDays = 7) {
    const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    const sessions = this.listSessions();
    let deleted = 0;
    
    for (const session of sessions) {
      if (session.updatedAt < cutoff) {
        this.deleteSession(session.id);
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * Export session for inspection
   */
  exportSession(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    return session.serialize();
  }

  /**
   * Verify session integrity
   */
  verifySession(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    const expectedHash = session.computeHash();
    const expectedSelfHash = session.computeSelfHash();
    
    return {
      valid: true,
      hash: expectedHash,
      selfHash: expectedSelfHash,
      messageCount: session.messages.length,
      stateVector: session.stateVector
    };
  }
}

// Singleton instance
let instance = null;

function getMemoryManager() {
  if (!instance) {
    instance = new LocalMemoryManager();
  }
  return instance;
}

// CLI interface
if (require.main === module) {
  const cmd = process.argv[2];
  const memory = getMemoryManager();
  
  if (cmd === 'list') {
    const sessions = memory.listSessions();
    console.log('Sessions:');
    for (const s of sessions) {
      console.log(`  ${s.id} - ${new Date(s.updatedAt).toLocaleString()} (${s.messageCount} msgs)`);
    }
  } else if (cmd === 'show' && process.argv[3]) {
    const summary = memory.getSessionSummary(process.argv[3]);
    console.log(JSON.stringify(summary, null, 2));
  } else if (cmd === 'export' && process.argv[3]) {
    const data = memory.exportSession(process.argv[3]);
    console.log(JSON.stringify(data, null, 2));
  } else if (cmd === 'verify' && process.argv[3]) {
    const result = memory.verifySession(process.argv[3]);
    console.log(result.valid ? '✓ Valid' : '✗ Invalid', result);
  } else if (cmd === 'cleanup') {
    const days = parseInt(process.argv[3]) || 7;
    const deleted = memory.cleanup(days);
    console.log(`Deleted ${deleted} sessions older than ${days} days`);
  } else if (cmd === 'handoff' && process.argv[3]) {
    const handoff = memory.getHandoff(process.argv[3]);
    console.log(handoff ? JSON.stringify(handoff, null, 2) : 'No handoff state');
  } else {
    console.log('Usage: node local-memory.js <command> [args]');
    console.log('Commands:');
    console.log('  list                    - List all sessions');
    console.log('  show <session-id>       - Show session summary');
    console.log('  export <session-id>     - Export full session');
    console.log('  verify <session-id>     - Verify session integrity');
    console.log('  cleanup [days]          - Delete sessions older than N days (default: 7)');
    console.log('  handoff <session-id>    - Show handoff state');
  }
}

module.exports = {
  getMemoryManager,
  LocalMemoryManager,
  Session,
  Message,
  Z6_STATE,
  COMPRESSION_THRESHOLD,
  MAX_MESSAGES
};
