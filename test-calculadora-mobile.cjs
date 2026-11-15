"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const calculatorScript = fs.readFileSync(require.resolve("./calculadora.js"), "utf8");
const page = fs.readFileSync(require.resolve("./index.html"), "utf8");

class Element {
  constructor() {
    this.value = ""; this.textContent = ""; this.dataset = {};
    this.readOnly = false; this.inputMode = "text"; this.hidden = false;
    this.selectionStart = 0; this.selectionEnd = 0; this.focusCount = 0;
    this.listeners = {}; this.children = [];
  }
  addEventListener(event, handler) { this.listeners[event] = handler; }
  click() { this.listeners.click?.(); }
  focus() { this.focusCount++; }
  replaceChildren(...elements) { this.children = elements; }
  append(...elements) { this.children.push(...elements); }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  setRangeText(inserted, start, end) {
    this.value = this.value.slice(0, start) + inserted + this.value.slice(end);
    this.setSelectionRange(start + inserted.length, start + inserted.length);
  }
}
function launch(touch) {
  const ids = ["calc-expressao", "calc-resultado", "calc-status", "calc-historico", "calc-total",
    "calc-angulo", "calc-calcular", "calc-limpar", "calc-apagar", "calc-apagar-historico", "calc-touch-tip"];
  const elems = Object.fromEntries(ids.map(id => [id, new Element()]));
  elems["calc-angulo"].value = "deg";
  const inserts = ["3", "+", "7"].map(value => {
    const element = new Element();
    element.dataset.calcInsert = value; return element;
  });
  const document = {
    getElementById: id => elems[id],
    querySelectorAll: selector => selector === "[data-calc-insert]" ? inserts : [],
    createElement: () => new Element()
  };
  const calc = {evaluate: () => 10, format: value => String(value)};
  const window = {EletronicaCalc: calc, addEventListener() {}};
  vm.runInNewContext(calculatorScript, {
    document, window, navigator: {maxTouchPoints: touch ? 5 : 0},
    matchMedia: () => ({matches: touch}), EletronicaCalc: calc,
    CalcHistory: {KEY: "test-calc", MAX: 80, normalize: () => ({entries: []})},
    localStorage: {getItem: () => null}, console
  });
  return {elems, inserts, expression: elems["calc-expressao"]};
}

test("HTML starts readonly so iOS cannot open the native keyboard before JavaScript initializes", () => {
  assert.match(page, /id="calc-expressao"[^>]*inputmode="none" readonly/);
});

test("iPhone uses only calculator keys and never focuses its native text keyboard", () => {
  const {elems, inserts, expression} = launch(true);
  assert.equal(expression.readOnly, true);
  assert.equal(expression.inputMode, "none");
  assert.equal(elems["calc-touch-tip"].hidden, false);
  inserts[0].click(); inserts[1].click(); inserts[2].click();
  assert.equal(expression.value, "3+7");
  assert.equal(expression.focusCount, 0);
  elems["calc-apagar"].click();
  assert.equal(expression.value, "3+");
  elems["calc-limpar"].click();
  assert.equal(expression.value, "");
  assert.equal(expression.focusCount, 0);
});

test("desktop keeps native typing, Enter/Esc handlers and physical focus", () => {
  const {elems, inserts, expression} = launch(false);
  assert.equal(expression.readOnly, false);
  assert.equal(expression.inputMode, "text");
  assert.equal(elems["calc-touch-tip"].hidden, true);
  inserts[0].click();
  assert.equal(expression.value, "3");
  assert.ok(expression.focusCount > 0);
  assert.equal(typeof expression.listeners.keydown, "function");
});
