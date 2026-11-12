"use strict";
/* União determinística por UUID, com marco de exclusão propagável entre aparelhos. */
(function (root) {
  const KEY = 'laboratorio-eletronica:calculadora:v1', MAX = 80;
  const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x) && Number.isFinite(Date.parse(x));
  const valid = x => x && typeof x.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(x.id) &&
    typeof x.expr === 'string' && x.expr.length > 0 && x.expr.length <= 400 &&
    typeof x.result === 'number' && Number.isFinite(x.result) && date(x.at) && ['deg','rad'].includes(x.mode);
  function normalize(data) {
    const clear = date(data?.clear) ? data.clear : '';
    const rows = Array.isArray(data?.entries) ? data.entries.filter(valid) : [];
    const unique = new Map();
    // Inconsistent duplicate UUIDs resolve identically regardless of merge order.
    for (const row of rows) {
      if (row.at <= clear) continue;
      const clean = {id:row.id, expr:row.expr, result:row.result, at:row.at, mode:row.mode};
      const old = unique.get(row.id);
      if (!old || JSON.stringify(clean) > JSON.stringify(old)) unique.set(row.id,clean);
    }
    return {clear, entries:[...unique.values()].sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id)).slice(0,MAX)};
  }
  function merge(a,b) {
    a=normalize(a); b=normalize(b);
    return normalize({clear: a.clear > b.clear ? a.clear : b.clear, entries:[...a.entries,...b.entries]});
  }
  const api = {KEY, MAX, valid, normalize, merge};
  root.CalcHistory=api;
  if (typeof module!=='undefined' && module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
