// State-ID mutation engine for Chaos Room traceability
function sha256(str) {
    // Simple hash simulation for demo
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(12, '0').substring(0, 12);
}

function generateStateId(parentId, senderRole, payload) {
    const input = parentId + senderRole + payload;
    return sha256(input);
}

// Make timeline events interactive
document.addEventListener('DOMContentLoaded', () => {
    const events = document.querySelectorAll('.event');
    
    events.forEach((event, index) => {
        event.addEventListener('click', () => {
            const stateId = event.querySelector('.state-id').textContent;
            const parentId = index === 0 ? 'ROOT' : events[index - 1].querySelector('.state-id').textContent;
            const role = getRole(index);
            const payload = event.querySelector('p').textContent;
            
            const mutatedId = generateStateId(parentId, role, payload);
            
            // Show mutation info
            const mutationInfo = document.createElement('div');
            mutationInfo.style.cssText = `
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: rgba(0,0,0,0.3);
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.8rem;
                color: #4ecdc4;
            `;
            mutationInfo.innerHTML = `
                Parent: ${parentId}<br>
                Role: ${role}<br>
                Mutation → ${mutatedId}<br>
                Formula: sha256(parentId + role + payload)[0:12]
            `;
            
            // Remove existing mutation info
            const existing = event.querySelector('.mutation-info');
            if (existing) existing.remove();
            
            mutationInfo.className = 'mutation-info';
            event.appendChild(mutationInfo);
        });
    });
});

function getRole(index) {
    const roles = ['CHAOS_INIT', 'SYSTEM', 'PANEL_CROSS_POLLINATOR', 'REFINERY', 'VERIFIER'];
    return roles[index] || 'UNKNOWN';
}

// Add a State-ID demo section
function addStateIdDemo() {
    const main = document.querySelector('main');
    const demoSection = document.createElement('section');
    demoSection.className = 'state-demo';
    demoSection.innerHTML = `
        <h2>Deterministic State-ID Engine</h2>
        <p>Every turn mutates from the previous parent state for complete traceability.</p>
        <div class="demo-box">
            <label for="parentId">Parent ID:</label>
            <input type="text" id="parentId" value="abc123def456" readonly aria-label="Parent ID">
            <label for="senderRole">Sender Role:</label>
            <select id="senderRole" aria-label="Sender Role">
                <option value="CROSS_POLLINATOR">Cross-Pollinator</option>
                <option value="GUNNER">Gunner</option>
                <option value="SYNTHESIZER">Synthesizer</option>
                <option value="ADVOCATE_OF_TRUTH">Advocate of Truth</option>
            </select>
            <label for="payload">Message Payload:</label>
            <input type="text" id="payload" value="Raw intuition about lattice invariants" aria-label="Message Payload">
            <button onclick="computeStateId()">Generate State-ID</button>
            <div id="result" class="result"></div>
        </div>
    `;
    main.appendChild(demoSection);
}

function computeStateId() {
    const parentId = document.getElementById('parentId').value;
    const role = document.getElementById('senderRole').value;
    const payload = document.getElementById('payload').value;
    const result = generateStateId(parentId, role, payload);
    
    document.getElementById('result').innerHTML = `
        <strong>State-ID:</strong> <span style="font-family: monospace; color: #ffd93d;">${result}</span><br>
        <small>sha256("${parentId + role + payload}")[0:12]</small>
    `;
}

document.addEventListener('DOMContentLoaded', addStateIdDemo);
