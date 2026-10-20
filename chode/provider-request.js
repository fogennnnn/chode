'use strict';
// Shared setup/OAuth/discovery request: total deadline includes body consumption.
async function request(fetcher, target, options, signal, limits = {}) {
  const timeoutMs = limits.timeoutMs ?? 10000, maxBytes = limits.maxBytes ?? 4 * 1024 * 1024;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || !Number.isInteger(maxBytes) || maxBytes <= 0)
    throw Error('Invalid provider request limits.');
  if (signal?.aborted) throw Error('Setup cancelled.');
  const control = new AbortController();
  let reader, timer, rejectStop;
  const stop = new Promise((resolve, reject) => { rejectStop = reject; });
  const cancel = () => { try { Promise.resolve(reader?.cancel()).catch(() => {}); } catch {} };
  const abort = message => { rejectStop(Error(message)); control.abort(); cancel(); };
  const onAbort = () => abort('Setup cancelled.');
  signal?.addEventListener('abort', onAbort, {once: true});
  timer = setTimeout(() => abort('Provider request timed out.'), timeoutMs);
  const work = async () => {
    const response = await fetcher(target, {...options, redirect: 'error', signal: control.signal});
    if (control.signal.aborted) throw Error('Provider request stopped.');
    const declared = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(declared) && declared > maxBytes) throw Error('Provider response exceeds the size limit.');
    let data;
    if (response.body?.getReader) {
      reader = response.body.getReader();
      const chunks = []; let bytes = 0;
      for (;;) {
        const part = await reader.read();
        if (control.signal.aborted) throw Error('Provider request stopped.');
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > maxBytes) throw Error('Provider response exceeds the size limit.');
        chunks.push(Buffer.from(part.value));
      }
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw Error('Provider returned invalid JSON.'); }
    } else {
      // Compatibility for injected response adapters; real fetch uses the bounded reader.
      data = await response.json();
      if (Buffer.byteLength(JSON.stringify(data), 'utf8') > maxBytes) throw Error('Provider response exceeds the size limit.');
    }
    return {ok: response.ok, status: response.status, json: async () => data};
  };
  try { return await Promise.race([work(), stop]); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); control.abort(); cancel(); }
}
module.exports = {request};
