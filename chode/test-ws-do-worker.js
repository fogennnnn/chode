export class WSDO {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    server.addEventListener('message', (event) => {
      server.send('echo: ' + event.data);
    });
    server.addEventListener('close', () => {});
    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(request, env) {
    const id = env.WS_DO.idFromName('test');
    const stub = env.WS_DO.get(id);
    return stub.fetch(request);
  }
};