'use strict';
function normalize(data, options = {}) {
  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : [];
  const seen = new Set(), models = [];
  for (const row of rows.slice(0, 5000)) {
    if (!row || typeof row !== 'object') continue;
    const id = row.id || row.name || row.model;
    if (typeof id !== 'string' || !id || id.length > 200 || /[\s\x00-\x1f\x7f]/.test(id) || seen.has(id)) continue;
    seen.add(id);
    const pricing = row.pricing;
    const number = value => (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') && Number.isFinite(Number(value)) && Number(value) >= 0;
    const zero = !!pricing && typeof pricing === 'object' && number(pricing.prompt) && number(pricing.completion) &&
      Object.values(pricing).every(value => number(value) && Number(value) === 0);
    const parameters = Array.isArray(row.supported_parameters) ? row.supported_parameters : [];
    const context = Number(row.context_length);
    models.push({id, zeroTokenPrice: zero, local: !!options.local,
      tools: parameters.includes('tools'),
      structured: parameters.includes('response_format') || parameters.includes('structured_outputs'),
      context: Number.isSafeInteger(context) && context > 0 ? context : null});
    if (models.length >= 500) break;
  }
  return models.sort((a, b) => Number(b.zeroTokenPrice) - Number(a.zeroTokenPrice) || Number(b.tools) - Number(a.tools));
}
function label(model) {
  return [model.id, model.local ? 'installed locally' : model.zeroTokenPrice ? 'listed zero price' : 'price unverified',
    model.tools && 'tools', model.structured && 'structured output', model.context && model.context + ' context'].filter(Boolean).join(' · ');
}
async function select(models, current, prompt, notice = () => {}) {
  let filtered = models, page = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    const rows = filtered.slice(page * 20, (page + 1) * 20), labels = rows.map(label);
    const answer = await prompt('Choose a model number or exact ID' + (current ? ' (current: ' + current + '; enter current to keep).' : '.') +
      (models.length ? ' Page ' + (page + 1) + '/' + Math.max(1, Math.ceil(filtered.length / 20)) + '. Use next, previous, or search <text>.' : ' No models are listed; enter the exact model ID.'), {options: labels});
    if (answer.toLowerCase() === 'current' && current) return current;
    if (answer.toLowerCase() === 'next') { if ((page + 1) * 20 < filtered.length) page++; else notice('No more models.'); continue; }
    if (answer.toLowerCase() === 'previous') { page = Math.max(0, page - 1); continue; }
    if (/^search(?:\s|$)/i.test(answer)) { const query = answer.slice(6).trim().toLowerCase(); filtered = models.filter(m => m.id.toLowerCase().includes(query)); page = 0; if (!filtered.length) notice('No matching models. Enter an exact ID, or search again.'); continue; }
    if (/^\d+$/.test(answer)) { const index = Number(answer) - 1; if (rows[index]) return rows[index].id; notice(models.length ? 'Choose a number on this page, or enter an exact model ID.' : 'No models are listed — enter the exact model ID.'); continue; }
    const selected = rows[labels.indexOf(answer)];
    const id = selected ? selected.id : answer;
    if (id && id.length <= 200 && !/[\s\x00-\x1f\x7f]/.test(id)) return id;
    notice('Enter a nonempty model ID without spaces.');
  }
  throw Error('Model selection stopped after too many invalid choices; no settings saved.');
}
module.exports = {normalize, label, select};
