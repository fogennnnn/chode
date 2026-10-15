

const accounts = new Map();
const secrets = new Map();
const nonces = new Map();
const ledger = [];
let sealId = 0;
const seals = [];

function hash(data) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
}

function hex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(`<!DOCTYPE html><html><head><title>Sun STK</title></head><body><h1>Sun STK Ledger</h1></body></html>`, {
        headers: { 'content-type': 'text/html' }
      });
    }

    if (request.method === 'POST' && url.pathname === '/faucet') {
      const body = await request.json();
      const account = String(body.account);
      if (!account) return new Response(JSON.stringify({ error: 'account required' }), { status: 400, headers: { 'content-type': 'application/json' } });
      if (!accounts.has(account)) {
        const rnd = new Uint8Array(16);
        crypto.getRandomValues(rnd);
        const secret = hex(await hash(account + '-' + Array.from(rnd, b => b.toString(16).padStart(2, '0')).join('')));
        secrets.set(account, secret);
        accounts.set(account, 100);
        nonces.set(account, 0);
        return new Response(JSON.stringify({ account, balance: 100, secret }), { headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'already funded' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }

    if (request.method === 'GET' && url.pathname === '/balance') {
      const account = url.searchParams.get('account');
      if (!account) return new Response(JSON.stringify({ error: 'account required' }), { status: 400, headers: { 'content-type': 'application/json' } });
      return new Response(JSON.stringify({ account, balance: accounts.get(account) ?? 0 }), { headers: { 'content-type': 'application/json' } });
    }

    if (request.method === 'POST' && url.pathname === '/tx') {
      const body = await request.json();
      const { from, to, amount, nonce, sig } = body;
      if (typeof amount !== 'number' || amount <= 0) return new Response(JSON.stringify({ error: 'invalid amount' }), { status: 400, headers: { 'content-type': 'application/json' } });
      if (!from || !to) return new Response(JSON.stringify({ error: 'from and to required' }), { status: 400, headers: { 'content-type': 'application/json' } });

      const senderSecret = secrets.get(from);
      if (senderSecret === undefined) return new Response(JSON.stringify({ error: 'unknown sender' }), { status: 403, headers: { 'content-type': 'application/json' } });

      const expectedNonce = nonces.get(from) || 0;
      if (nonce !== expectedNonce) return new Response(JSON.stringify({ error: 'reused or invalid nonce' }), { status: 403, headers: { 'content-type': 'application/json' } });

      const sigData = from + to + amount + nonce + senderSecret;
      const expectedSig = hex(await hash(sigData));
      if (sig !== expectedSig) return new Response(JSON.stringify({ error: 'bad signature' }), { status: 403, headers: { 'content-type': 'application/json' } });

      const bal = accounts.get(from) || 0;
      if (bal < amount) return new Response(JSON.stringify({ error: 'insufficient balance' }), { status: 403, headers: { 'content-type': 'application/json' } });

      accounts.set(from, bal - amount);
      accounts.set(to, (accounts.get(to) || 0) + amount);
      nonces.set(from, expectedNonce + 1);

      ledger.push({ from, to, amount, nonce: expectedNonce, sig: expectedSig, ts: Date.now() });
      return new Response(JSON.stringify({ ok: true, from, to, amount }), { headers: { 'content-type': 'application/json' } });
    }

    if (request.method === 'GET' && url.pathname === '/ledger') {
      return new Response(JSON.stringify(ledger), { headers: { 'content-type': 'application/json' } });
    }

    if (request.method === 'POST' && url.pathname === '/seal') {
      const body = await request.json();
      const { data } = body;
      sealId++;
      const prevHash = seals.length > 0 ? seals[seals.length - 1].hash : '';
      const recordData = JSON.stringify({ id: sealId, data, prev: prevHash });
      const recordHash = hex(await hash(recordData));
      const record = { id: sealId, hash: recordHash, prev: prevHash, data };
      seals.push(record);
      return new Response(JSON.stringify(record), { headers: { 'content-type': 'application/json' } });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/verify/')) {
      const id = parseInt(url.pathname.split('/verify/')[1]);
      const record = seals.find(s => s.id === id);
      if (!record) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

      let valid = true;
      for (let i = 0; i < seals.length; i++) {
        const r = seals[i];
        const recalcData = JSON.stringify({ id: r.id, data: r.data, prev: r.prev });
        const recalcHash = hex(await hash(recalcData));
        if (recalcHash !== r.hash) { valid = false; break; }
        if (i > 0 && seals[i - 1].hash !== r.prev) { valid = false; break; }
      }
      return new Response(JSON.stringify({ valid }), { headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  }
};
