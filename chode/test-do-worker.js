export class TestDO {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    return new Response('Test DO works');
  }
}

export default {
  async fetch(request, env) {
    const id = env.TEST_DO.idFromName('test');
    const stub = env.TEST_DO.get(id);
    return stub.fetch(request);
  }
};