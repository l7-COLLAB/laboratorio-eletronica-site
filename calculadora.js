"use strict";
/* Histórico independente: nunca grava o documento de progresso. */
(() => {
  const KEY = CalcHistory.KEY, MAX = CalcHistory.MAX;
  const $ = id => document.getElementById(id);
  const display = $("calc-expressao"), result = $("calc-resultado"), status = $("calc-status"),
        list = $("calc-historico"), mode = $("calc-angulo");
  if (!display || !window.EletronicaCalc) return;
  // A passive DIV, never an INPUT/contenteditable node. This works even in
  // embedded iOS browsers that misreport touch support and ignore inputmode=none.
  // Preserve cursor editing and physical desktop typing with a JS-only model.
  const field = {
    _value: "", selectionStart: 0, selectionEnd: 0,
    get value() { return this._value; },
    set value(value) {
      this._value = String(value).slice(0, 180);
      this.selectionStart = this.selectionEnd = this._value.length;
      paint();
    },
    setRangeText(text, start, end) {
      start = Math.max(0, Math.min(this._value.length, start));
      end = Math.max(start, Math.min(this._value.length, end));
      const candidate = this._value.slice(0, start) + text + this._value.slice(end);
      if (candidate.length > 180) {
        status.textContent = "A expressão pode ter no máximo 180 caracteres.";
        return;
      }
      this._value = candidate;
      this.selectionStart = this.selectionEnd = start + text.length;
      paint();
    },
    setSelectionRange(start, end) {
      this.selectionStart = Math.max(0, Math.min(this._value.length, start));
      this.selectionEnd = Math.max(this.selectionStart, Math.min(this._value.length, end));
      paint();
    }
  };
  function paint() {
    const caret = document.createElement("span");
    caret.className = "calc-caret";
    caret.setAttribute("aria-hidden", "true");
    display.replaceChildren(
      document.createTextNode(field.value.slice(0, field.selectionStart)),
      caret,
      document.createTextNode(field.value.slice(field.selectionEnd))
    );
    display.dataset.empty = String(!field.value);
    display.setAttribute("aria-label", "Expressão: " + (field.value || "vazia"));
  }
  paint();
  let last;
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
    if (!rows.length) { const p = document.createElement('p'); p.textContent='Nenhum cálculo registrado.'; list.append(p); }
    for (const row of rows) {
      const li = document.createElement('li'), button = document.createElement('button'), small = document.createElement('small');
      button.className='calc-reuse'; button.type='button'; button.textContent=row.expr + ' = ' + EletronicaCalc.format(row.result);
      button.title='Reutilizar o cálculo';
      button.addEventListener('click', () => { field.value=row.expr; result.textContent=EletronicaCalc.format(row.result); mode.value=row.mode || 'deg'; });
      small.textContent = new Date(row.at).toLocaleString('pt-BR') + ' · ' + (row.mode === 'rad' ? 'RAD' : 'DEG');
      li.append(button,small);list.append(li);
    }
  }
  function put(value) {
    field.setRangeText(value, field.selectionStart, field.selectionEnd);
  }
  document.querySelectorAll('[data-calc-insert]').forEach(btn => btn.addEventListener('click', () => put(btn.dataset.calcInsert)));
  $('calc-calcular').addEventListener('click', () => {
    try {
      const expr = field.value.trim(), unit=mode.value;
      const historyState = state();
      const previous = last ?? historyState.entries[0]?.result ?? 0;
      const expanded = expr.replace(/\bans\b/gi, '(' + String(previous) + ')');
      if (expanded.length > 180) throw Error('A expressão expandida com Ans ultrapassa 180 caracteres. Use o resultado numérico para continuar.');
      const value = EletronicaCalc.evaluate(expr, unit, previous);
      const at = new Date(Math.max(Date.now(), (Date.parse(historyState.clear) || 0) + 1)).toISOString();
      const entry = {id: crypto.randomUUID(), expr: expanded, result: value, at, mode: unit};
      last = value;
      result.textContent = EletronicaCalc.format(value);
      status.textContent = '';
      save(current => CalcHistory.merge(current, {clear: current.clear, entries: [entry]}));
    } catch(error) { result.textContent='Erro';status.textContent=error.message; }
  });
  $('calc-limpar').addEventListener('click', () => {field.value='';result.textContent='0';status.textContent='';});
  $('calc-apagar').addEventListener('click', () => {
    const a=field.selectionStart??field.value.length,b=field.selectionEnd??field.value.length;
    field.setRangeText('',a===b?Math.max(0,a-1):a,b);
  });
  $('calc-apagar-historico').addEventListener('click', () => {
    if (confirm('Apagar o histórico deste aparelho e da nuvem? Após sincronizar, as contas anteriores também serão removidas nos outros aparelhos.')) { last = 0; save(() => ({clear: new Date().toISOString(), entries: []})); result.textContent='0'; }
  });
  $("calc-cursor-left").addEventListener("click", () =>
    field.setSelectionRange(Math.max(0, field.selectionStart - 1), Math.max(0, field.selectionStart - 1)));
  $("calc-cursor-right").addEventListener("click", () =>
    field.setSelectionRange(Math.min(field.value.length, field.selectionEnd + 1), Math.min(field.value.length, field.selectionEnd + 1)));
  // Physical keyboards work without ever creating an editable browser input.
  document.addEventListener("keydown", e => {
    const view = $("calculadora");
    if (!view || view.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target;
    if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || "") || target.isContentEditable)) return;
    if (e.key === "Enter" && !/^(BUTTON|A|SUMMARY)$/.test(target?.tagName || "")) {
      e.preventDefault(); $("calc-calcular").click(); return;
    }
    if (e.key === "Escape") {
      e.preventDefault(); $("calc-limpar").click(); return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
      if (target?.tagName === "BUTTON" || target?.tagName === "A") return;
      const cursor = e.key === "Home" ? 0 : e.key === "End" ? field.value.length
        : e.key === "ArrowLeft" ? Math.max(0, field.selectionStart - 1)
        : Math.min(field.value.length, field.selectionEnd + 1);
      field.setSelectionRange(cursor, cursor);
      e.preventDefault(); return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      const a = field.selectionStart, b = field.selectionEnd;
      if (e.key === "Backspace") field.setRangeText("", a === b ? Math.max(0, a - 1) : a, b);
      else field.setRangeText("", a, a === b ? Math.min(field.value.length, b + 1) : b);
      e.preventDefault(); return;
    }
    if (e.key.length === 1 && "0123456789abcdefghijklmnopqrstuvwxyz+-*/^%().,!".includes(e.key.toLowerCase())) {
      put(e.key); e.preventDefault();
    }
  });
  window.addEventListener('storage',event=>{if(event.key===KEY)redraw();});
  window.addEventListener('cloud:applied',event=>{if(event.detail.keys.includes(KEY))redraw();});
  redraw();
})();
