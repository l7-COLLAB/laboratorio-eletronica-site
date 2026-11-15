"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const script = fs.readFileSync(require.resolve("./calculadora.js"), "utf8");
const html = fs.readFileSync(require.resolve("./index.html"), "utf8");

class Fake {
  constructor(tagName = "DIV") {
    this.tagName = tagName; this.value = ""; this.textContent = ""; this.dataset = {};
    this.children = []; this.attributes = {}; this.hidden = false; this.listeners = {};
    this.focusCount = 0; this.className = "";
  }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  click() { this.listeners.click?.(); }
  focus() { this.focusCount++; }
  setAttribute(name, val) { this.attributes[name] = val; }
  replaceChildren(...items) { this.children = items; }
  append(...items) { this.children.push(...items); }
}
function launch(touch) {
  const ids = ["calc-expressao", "calc-resultado", "calc-status", "calc-historico",
    "calc-total", "calc-angulo", "calc-calcular", "calc-limpar", "calc-apagar",
    "calc-apagar-historico", "calc-cursor-left", "calc-cursor-right", "calculadora"];
  const el = Object.fromEntries(ids.map(id => [id, new Fake()]));
  el["calc-angulo"].value = "deg";
  const btns = ["3", "+", "7", "sin("].map(v => {
    const b = new Fake("BUTTON"); b.dataset.calcInsert = v; return b;
  });
  const docHandlers = {};
  const document = {
    getElementById: id => el[id],
    querySelectorAll: selector => selector === "[data-calc-insert]" ? btns : [],
    createElement: tag => new Fake(tag.toUpperCase()),
    createTextNode: text => ({textContent: text}),
    addEventListener: (name, fn) => { docHandlers[name] = fn; }
  };
  const fakeHistory = { KEY: "test-calc", MAX: 80, normalize: () => ({entries: []}) };
  const calc = { evaluate: () => 10, format: n => String(n) };
  const win = { EletronicaCalc: calc, addEventListener() {} };
  vm.runInNewContext(script, {
    document, window: win, navigator: {maxTouchPoints: touch ? 5 : 0},
    matchMedia: () => ({matches: touch}), EletronicaCalc: calc,
    CalcHistory: fakeHistory, localStorage: {getItem: () => null}, console
  });
  const expression = () => el["calc-expressao"].children
    .filter(child => typeof child.textContent === "string").map(child => child.textContent).join("");
  return {el, btns, docHandlers, expression};
}
test("calculator markup has no editable input or contenteditable display", () => {
  const markup = html.match(/<div id="calc-expressao"[\s\S]*?<\/div>/)?.[0];
  assert.ok(markup);
  assert.doesNotMatch(markup, /<input|contenteditable|<textarea/i);
  assert.match(markup, /aria-readonly="true"/);
  assert.match(markup, /tabindex="0"/);
});
test("calculator buttons work even when the iPhone has no detectable touch support", () => {
  for (const touch of [true, false]) {
    const {el, btns, expression} = launch(touch);
    btns[0].click(); btns[1].click(); btns[2].click();
    assert.equal(expression(), "3+7");
    assert.equal(el["calc-expressao"].focusCount, 0);
    el["calc-cursor-left"].click();
    btns[3].click();
    assert.equal(expression(), "3+sin(7");
    el["calc-apagar"].click();
    assert.equal(expression(), "3+sin7");
    el["calc-limpar"].click();
    assert.equal(expression(), "");
  }
});
test("desktop physical keyboard edits virtual expression without an input element", () => {
  const app = launch(false);
  function key(value, target = {tagName:"DIV"}) {
    let prevented = false;
    app.docHandlers.keydown({key:value,target,ctrlKey:false,metaKey:false,altKey:false,
      preventDefault: () => {prevented=true;}});
    return prevented;
  }
  assert.equal(key("9"), true);
  assert.equal(key("^"), true);
  assert.equal(key("2"), true);
  assert.equal(app.expression(), "9^2");
  assert.equal(key("Backspace"), true);
  assert.equal(app.expression(), "9^");
  assert.equal(key("3",{tagName:"INPUT"}), false);
  assert.equal(app.expression(), "9^");
  app.el.calculadora.hidden = true;
  assert.equal(key("4"), false);
  assert.equal(app.expression(), "9^");
});
