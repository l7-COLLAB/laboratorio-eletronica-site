"use strict";
/* Histórico independente: nunca grava o documento de progresso. */
(() => {
  const KEY = CalcHistory.KEY, MAX = CalcHistory.MAX;
  const $ = id => document.getElementById(id);
  const field = $("calc-expressao"), result = $("calc-resultado"), status = $("calc-status"),
        list = $("calc-historico"), mode = $("calc-angulo");
  if (!field || !window.EletronicaCalc) return;
  let last = 0;
  function state() {
    try { return CalcHistory.normalize(JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch { return CalcHistory.normalize({}); }
  }
  function history() { return state().entries; }
  async function save(update) {
    const write = () => {
      const value = JSON.stringify(update(state()));
      try { localStorage.setItem(KEY, value); }
      catch { status.textContent = 'Não foi possível gravar o histórico neste aparelho. Copie o resultado antes de sair.'; return false; }
      window.cloudSync?.queue(KEY, value);
      status.textContent = 'Histórico salvo neste aparelho. Consulte a sincronização no topo.';
      redraw(); return true;
    };
    try { return navigator.locks ? await navigator.locks.request(KEY, write) : write(); }
    catch { status.textContent = 'Não foi possível salvar. Copie o resultado antes de sair.'; return false; }
  }
  function redraw() {
    const rows = history();
    list.replaceChildren();
    $('calc-total').textContent = rows.length + ' de ' + MAX + ' cálculos mantidos';
    last = rows[0]?.result ?? 0;
    if (!rows.length) { const p = document.createElement('p'); p.textContent='Nenhum cálculo registrado.'; list.append(p); }
    for (const row of rows) {
      const li = document.createElement('li'), button = document.createElement('button'), small = document.createElement('small');
      button.className='calc-reuse'; button.type='button'; button.textContent=row.expr + ' = ' + EletronicaCalc.format(row.result);
      button.title='Reutilizar o cálculo';
      button.addEventListener('click', () => { field.value=row.expr; result.textContent=EletronicaCalc.format(row.result); mode.value=row.mode || 'deg';field.focus(); });
      small.textContent = new Date(row.at).toLocaleString('pt-BR') + ' · ' + (row.mode === 'rad' ? 'RAD' : 'DEG');
      li.append(button,small);list.append(li);
    }
  }
  function put(value) {
    field.setRangeText(value, field.selectionStart ?? field.value.length, field.selectionEnd ?? field.value.length, 'end'); field.focus();
  }
  document.querySelectorAll('[data-calc-insert]').forEach(btn => btn.addEventListener('click', () => put(btn.dataset.calcInsert)));
  $('calc-calcular').addEventListener('click', () => {
    try {
      const expr = field.value.trim(), unit=mode.value;
      const value=EletronicaCalc.evaluate(expr,unit,last);
      result.textContent=EletronicaCalc.format(value);
      const at = new Date(Math.max(Date.now(), (Date.parse(state().clear) || 0) + 1)).toISOString();
      const expanded = expr.replace(/\bans\b/gi, '(' + String(last) + ')');
      if (expanded.length > 180) throw Error('A expressão expandida com Ans ultrapassa 180 caracteres. Use o resultado numérico para continuar.');
      last = value;
      save(current => CalcHistory.merge(current, {clear: current.clear, entries: [{id: crypto.randomUUID(), expr: expanded, result: value, at, mode: unit}]}));
    } catch(error) { result.textContent='Erro';status.textContent=error.message; }
  });
  $('calc-limpar').addEventListener('click', () => {field.value='';result.textContent='0';status.textContent='';field.focus();});
  $('calc-apagar').addEventListener('click', () => {
    const a=field.selectionStart??field.value.length,b=field.selectionEnd??field.value.length;
    field.setRangeText('',a===b?Math.max(0,a-1):a,b,'end');field.focus();
  });
  $('calc-apagar-historico').addEventListener('click', () => {
    if (confirm('Apagar o histórico deste aparelho e da nuvem? Após sincronizar, as contas anteriores também serão removidas nos outros aparelhos.')) { save(() => ({clear: new Date().toISOString(), entries: []})); result.textContent='0'; }
  });
  field.addEventListener('keydown', e => {
    if(e.key==='Enter'){e.preventDefault();$('calc-calcular').click();}
    if(e.key==='Escape'){e.preventDefault();$('calc-limpar').click();}
  });
  window.addEventListener('storage',event=>{if(event.key===KEY)redraw();});
  window.addEventListener('cloud:applied',event=>{if(event.detail.keys.includes(KEY))redraw();});
  redraw();
})();
