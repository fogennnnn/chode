'use strict';

/**
 * Z6Plan - Plan serialization with Z6P-inspired state encoding
 * 
 * Plans as Z6 state machines with explicit dependencies and constraint validation.
 * Each step has a Z6 status: 0=pending, 1=in-progress, 2=blocked, 3=done, 4=skipped, 5=failed
 * 
 * Hash-bound integrity: every state change is anchored to a cryptographic hash.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Z6 state values
const Z6_STATUS = {
  PENDING: 0,
  IN_PROGRESS: 1,
  BLOCKED: 2,
  DONE: 3,
  SKIPPED: 4,
  FAILED: 5
};

const Z6_STATUS_LABELS = ['pending', 'in-progress', 'blocked', 'done', 'skipped', 'failed'];

// Z6 arithmetic operations
const Z6 = {
  add: (a, b) => (a + b) % 6,
  mul: (a, b) => (a * b) % 6,
  wrap: (n) => ((n % 6) + 6) % 6,  // Handle negative numbers
  isValid: (n) => typeof n === 'number' && n >= 0 && n <= 5
};

/**
 * Z6Constraint - Pre/post condition validation
 */
class Z6Constraint {
  constructor(type, params) {
    if (!Z6.isValid(type)) {
      throw new Error('Constraint type must be Z6 value (0-5)');
    }
    this.type = type;
    this.params = params || {};
    this.satisfied = null;  // null=unchecked, true/false
    this.checkedAt = null;
  }

  check(context) {
    context = context || {};
    const root = context.root || process.cwd();
    
    switch(this.type) {
      case Z6Constraint.Types.FILE_EXISTS:
        this.satisfied = fs.existsSync(path.resolve(root, this.params.path));
        break;
        
      case Z6Constraint.Types.FILE_NOT_EXISTS:
        this.satisfied = !fs.existsSync(path.resolve(root, this.params.path));
        break;
        
      case Z6Constraint.Types.SYNTAX_VALID:
        this.satisfied = this.checkSyntax(path.resolve(root, this.params.file));
        break;
        
      case Z6Constraint.Types.TESTS_PASS:
        // Defer to test runner - mark as checked
        this.satisfied = context.testResults?.[this.params.file] === true;
        break;
        
      case Z6Constraint.Types.DEPENDENCY_DONE:
        this.satisfied = context.stepStatus?.[this.params.stepId] === Z6_STATUS.DONE;
        break;
        
      case Z6Constraint.Types.CAPACITY_AVAILABLE:
        this.satisfied = context.providerCapacity?.[this.params.provider] > 0;
        break;
        
      default:
        this.satisfied = false;
    }
    
    this.checkedAt = Date.now();
    return this.satisfied;
  }

  checkSyntax(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const ext = path.extname(filePath).toLowerCase();
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (ext === '.js' || ext === '.cjs' || ext === '.mjs') {
        // Simple syntax check via Function constructor
        new Function(content);
        return true;
      } else if (ext === '.json') {
        JSON.parse(content);
        return true;
      } else if (ext === '.py') {
        // Python syntax check via py_compile
        const { spawnSync } = require('child_process');
        const result = spawnSync('python', ['-m', 'py_compile', filePath], {
          timeout: 5000,
          windowsHide: true
        });
        return result.status === 0;
      }
      // Unknown extension - assume valid
      return true;
    } catch (e) {
      return false;
    }
  }

  static AND(constraints) {
    return constraints.every(c => c.satisfied === true);
  }

  static OR(constraints) {
    return constraints.some(c => c.satisfied === true);
  }

  toJSON() {
    return {
      type: this.type,
      typeLabel: Z6Constraint.TYPES[this.type] || 'unknown',
      params: this.params,
      satisfied: this.satisfied,
      checkedAt: this.checkedAt
    };
  }
}

Z6Constraint.Types = {
  FILE_EXISTS: 0,
  FILE_NOT_EXISTS: 1,
  SYNTAX_VALID: 2,
  TESTS_PASS: 3,
  DEPENDENCY_DONE: 4,
  CAPACITY_AVAILABLE: 5
};

Z6Constraint.TYPES = {
  0: 'FILE_EXISTS',
  1: 'FILE_NOT_EXISTS',
  2: 'SYNTAX_VALID',
  3: 'TESTS_PASS',
  4: 'DEPENDENCY_DONE',
  5: 'CAPACITY_AVAILABLE'
};

/**
 * Z6PlanStep - Single step in the plan
 */
class Z6PlanStep {
  constructor(id, description, options = {}) {
    this.id = id;
    this.description = description;
    this.files = options.files || [];
    this.status = Z6_STATUS.PENDING;
    this.preConditions = (options.pre || []).map(c => 
      c instanceof Z6Constraint ? c : new Z6Constraint(c.type, c.params)
    );
    this.postConditions = (options.post || []).map(c =>
      c instanceof Z6Constraint ? c : new Z6Constraint(c.type, c.params)
    );
    this.dependsOn = options.dependsOn || [];  // Array of step IDs
    this.startedAt = null;
    this.completedAt = null;
    this.error = null;
    this.modelCalls = 0;
    this.tokens = 0;
  }

  canExecute(plan) {
    // All dependencies must be done
    const depsOk = this.dependsOn.every(depId => {
      const dep = plan.steps.find(s => s.id === depId);
      return dep && dep.status === Z6_STATUS.DONE;
    });
    
    // All pre-conditions must be satisfied
    const preOk = Z6Constraint.AND(this.preConditions);
    
    return depsOk && preOk;
  }

  start() {
    if (this.status !== Z6_STATUS.PENDING) {
      throw new Error(`Cannot start step ${this.id}: status is ${Z6_STATUS_LABELS[this.status]}`);
    }
    this.status = Z6_STATUS.IN_PROGRESS;
    this.startedAt = Date.now();
  }

  complete() {
    if (this.status !== Z6_STATUS.IN_PROGRESS) {
      throw new Error(`Cannot complete step ${this.id}: status is ${Z6_STATUS_LABELS[this.status]}`);
    }
    this.status = Z6_STATUS.DONE;
    this.completedAt = Date.now();
  }

  fail(error) {
    this.status = Z6_STATUS.FAILED;
    this.error = String(error);
    this.completedAt = Date.now();
  }

  skip() {
    this.status = Z6_STATUS.SKIPPED;
    this.completedAt = Date.now();
  }

  block() {
    this.status = Z6_STATUS.BLOCKED;
  }

  toJSON() {
    return {
      id: this.id,
      description: this.description,
      files: this.files,
      status: this.status,
      statusLabel: Z6_STATUS_LABELS[this.status],
      preConditions: this.preConditions.map(c => c.toJSON()),
      postConditions: this.postConditions.map(c => c.toJSON()),
      dependsOn: this.dependsOn,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      error: this.error,
      modelCalls: this.modelCalls,
      tokens: this.tokens
    };
  }
}

/**
 * Z6Plan - Complete plan with Z6 state machine
 */
class Z6Plan {
  constructor(steps, options = {}) {
    this.id = options.id || crypto.randomBytes(8).toString('hex');
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.originalPrompt = options.prompt || '';
    this.steps = steps.map((s, i) => {
      if (s instanceof Z6PlanStep) return s;
      return new Z6PlanStep(s.id || i, s.description, s);
    });
    this.status = Z6_STATUS.PENDING;
    this.currentStep = null;
    this.hash = this.computeHash();
    this.selfHash = this.computeSelfHash();
  }

  computeHash() {
    const data = JSON.stringify(this.steps.map(s => s.toJSON()));
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  computeSelfHash() {
    const data = JSON.stringify(this.steps.map(s => s.toJSON())) + this.hash;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  verifyIntegrity() {
    const currentHash = this.computeHash();
    const currentSelfHash = this.computeSelfHash();
    return {
      hashValid: currentHash === this.hash,
      selfHashValid: currentSelfHash === this.selfHash,
      currentHash,
      currentSelfHash
    };
  }

  getStep(id) {
    return this.steps.find(s => s.id === id);
  }

  getNextExecutable() {
    const pending = this.steps.filter(s => s.status === Z6_STATUS.PENDING);
    for (const step of pending) {
      if (step.canExecute(this)) {
        return step;
      }
    }
    return null;
  }

  getBlockedSteps() {
    return this.steps.filter(s => s.status === Z6_STATUS.BLOCKED);
  }

  getFailedSteps() {
    return this.steps.filter(s => s.status === Z6_STATUS.FAILED);
  }

  getCompletedSteps() {
    return this.steps.filter(s => s.status === Z6_STATUS.DONE);
  }

  getPendingSteps() {
    return this.steps.filter(s => s.status === Z6_STATUS.PENDING);
  }

  isComplete() {
    return this.steps.every(s => 
      [Z6_STATUS.DONE, Z6_STATUS.SKIPPED, Z6_STATUS.FAILED].includes(s.status)
    );
  }

  isFailed() {
    return this.getFailedSteps().length > 0 && this.getPendingSteps().length === 0;
  }

  updateStatus() {
    this.updatedAt = Date.now();
    
    if (this.isComplete()) {
      if (this.getFailedSteps().length > 0) {
        this.status = Z6_STATUS.FAILED;
      } else {
        this.status = Z6_STATUS.DONE;
      }
    } else if (this.steps.some(s => s.status === Z6_STATUS.IN_PROGRESS)) {
      this.status = Z6_STATUS.IN_PROGRESS;
    }
    
    this.hash = this.computeHash();
    this.selfHash = this.computeSelfHash();
  }

  startStep(stepId) {
    const step = this.getStep(stepId);
    if (!step) throw new Error(`Step ${stepId} not found`);
    step.start();
    this.currentStep = stepId;
    this.updateStatus();
  }

  completeStep(stepId) {
    const step = this.getStep(stepId);
    if (!step) throw new Error(`Step ${stepId} not found`);
    step.complete();
    this.currentStep = null;
    this.updateStatus();
  }

  failStep(stepId, error) {
    const step = this.getStep(stepId);
    if (!step) throw new Error(`Step ${stepId} not found`);
    step.fail(error);
    this.currentStep = null;
    this.updateStatus();
  }

  skipStep(stepId) {
    const step = this.getStep(stepId);
    if (!step) throw new Error(`Step ${stepId} not found`);
    step.skip();
    this.updateStatus();
  }

  /**
   * Serialize plan for storage
   */
  serialize() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      originalPrompt: this.originalPrompt,
      steps: this.steps.map(s => s.toJSON()),
      status: this.status,
      statusLabel: Z6_STATUS_LABELS[this.status],
      currentStep: this.currentStep,
      hash: this.hash,
      selfHash: this.selfHash
    };
  }

  /**
   * Get progress summary
   */
  getProgress() {
    const total = this.steps.length;
    const done = this.getCompletedSteps().length;
    const failed = this.getFailedSteps().length;
    const pending = this.getPendingSteps().length;
    const blocked = this.getBlockedSteps().length;
    const inProgress = this.steps.filter(s => s.status === Z6_STATUS.IN_PROGRESS).length;
    
    return {
      total,
      done,
      failed,
      pending,
      blocked,
      inProgress,
      percentComplete: Math.round((done / total) * 100),
      isComplete: this.isComplete(),
      isFailed: this.isFailed()
    };
  }

  /**
   * Visual representation for TUI
   */
  toVisual() {
    const progress = this.getProgress();
    const lines = [
      `Plan: ${this.id} (${Z6_STATUS_LABELS[this.status]})`,
      `Progress: ${progress.done}/${progress.total} steps (${progress.percentComplete}%)`,
      ''
    ];
    
    for (const step of this.steps) {
      const icon = {
        [Z6_STATUS.PENDING]: '○',
        [Z6_STATUS.IN_PROGRESS]: '◐',
        [Z6_STATUS.BLOCKED]: '⊘',
        [Z6_STATUS.DONE]: '●',
        [Z6_STATUS.SKIPPED]: '○',
        [Z6_STATUS.FAILED]: '✗'
      }[step.status];
      
      const deps = step.dependsOn.length > 0 ? ` [deps: ${step.dependsOn.join(', ')}]` : '';
      lines.push(`  ${icon} Step ${step.id}: ${step.description}${deps}`);
      
      if (step.error) {
        lines.push(`      Error: ${step.error}`);
      }
    }
    
    return lines.join('\n');
  }

  static fromSerialized(data) {
    // Reconstruct steps with their original state
    const steps = data.steps.map(s => {
      const step = new Z6PlanStep(s.id, s.description, {
        files: s.files,
        dependsOn: s.dependsOn
      });
      step.status = s.status;
      step.startedAt = s.startedAt;
      step.completedAt = s.completedAt;
      step.error = s.error;
      step.modelCalls = s.modelCalls;
      step.tokens = s.tokens;
      // Restore constraints
      s.preConditions.forEach(c => {
        step.preConditions.push(new Z6Constraint(c.type, c.params));
        step.preConditions[step.preConditions.length - 1].satisfied = c.satisfied;
        step.preConditions[step.preConditions.length - 1].checkedAt = c.checkedAt;
      });
      s.postConditions.forEach(c => {
        step.postConditions.push(new Z6Constraint(c.type, c.params));
        step.postConditions[step.postConditions.length - 1].satisfied = c.satisfied;
        step.postConditions[step.postConditions.length - 1].checkedAt = c.checkedAt;
      });
      return step;
    });
    
    const plan = new Z6Plan(steps, {
      id: data.id,
      prompt: data.originalPrompt
    });
    plan.createdAt = data.createdAt;
    plan.updatedAt = data.updatedAt;
    plan.status = data.status;
    plan.currentStep = data.currentStep;
    plan.hash = data.hash;
    plan.selfHash = data.selfHash;
    return plan;
  }
}

module.exports = {
  Z6Plan,
  Z6PlanStep,
  Z6Constraint,
  Z6_STATUS,
  Z6_STATUS_LABELS,
  Z6
};
