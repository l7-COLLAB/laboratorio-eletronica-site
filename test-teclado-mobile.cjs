"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const script = fs.readFileSync(require.resolve("./teclado-matematico.js"), "utf8");
const stylesheet = fs.readFileSync(require.resolve("./teclado-matematico.css"), "utf8");
const trail = fs.readFileSync(require.resolve("./trilha.js"), "utf8");

class FakeElement extends EventTarget {
  constructor(tagName) {
    super();
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.className = "";
    this.textContent = "";
    this.value = "";
    this.hidden = false;
    this.isConnected = true;
    this.parent = null;
    this.blurred = false;
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(...elements) {
    for (const element of elements) {
      if (element instanceof FakeElement) { element.parent = this; this.children.push(element); }
    }
  }
  replaceWith(element) {
    if (!this.parent) throw Error("No parent");
    const parent = this.parent;
    const position = parent.children.indexOf(this);
    if (position < 0) throw Error("Missing child");
    parent.children[position] = element;
    element.parent = parent;
    this.parent = null;
  }
  focus() { this.blurred = false; this.dispatchEvent(new Event("focusin")); }
  blur() { this.blurred = true; }
  setValue(value) { this.value = value; }
  insert(latex) {
    this.value += latex;
    this.dispatchEvent(new Event("input"));
  }
  click() { this.dispatchEvent(new Event("click")); }
}

function walk(element) {
  return [element, ...element.children.flatMap(walk)];
}

async function setup(touch) {
  const root = new FakeElement("div");
  const window = { mathVirtualKeyboard: {
    visible: false, layouts: [],
    showCount: 0, hideCount: 0,
    show() { this.showCount++; this.visible = true; },
    hide() { this.hideCount++; this.visible = false; }
  }};
  const document = { createElement: tag => new FakeElement(tag), head: new FakeElement("head") };
  let saved = 0;
  const sandbox = {
    window, document,
    navigator: { maxTouchPoints: touch ? 5 : 0 },
    matchMedia: () => ({ matches: touch }),
    customElements: { get: name => name === "math-field" ? FakeElement : undefined },
    MathPractice: { MAX_LATEX: 800 },
    console
  };
  vm.runInNewContext(script, sandbox);
  const editor = window.createMathEditor(root, { initialLatex: "\\frac{1}{2}", onChange() { saved++; } });
  await new Promise(resolve => setImmediate(resolve));
  return {root, window, editor, get saved() { return saved; }};
}

test("campo matemático já aparece sem clicar em botão opcional", async () => {
  const app = await setup(true);
  const fields = walk(app.root).filter(el => el.tagName === "math-field");
  assert.equal(fields.length, 1);
  assert.equal(fields[0].value, "\\frac{1}{2}");
  assert.equal(fields[0].attributes["math-virtual-keyboard-policy"], "auto");
  assert.equal(walk(app.root).filter(el => el.className === "math-editor-placeholder").length, 0);
});

test("iPhone: foco do campo abre o teclado virtual Matemático com layout numérico", async () => {
  const app = await setup(true);
  const field = walk(app.root).find(el => el.tagName === "math-field");
  field.focus();
  assert.equal(app.window.mathVirtualKeyboard.showCount, 1);
  assert.equal(app.window.mathVirtualKeyboard.layouts[0], "numeric");
  assert.ok(app.window.mathVirtualKeyboard.layouts.includes("symbols"));
});

test("fração com expoente fracionário fica salva no draft atual", async () => {
  const app = await setup(true);
  const button = walk(app.root).find(el => el.attributes["aria-label"] === "Inserir expoente fracionário");
  assert.ok(button);
  button.click();
  assert.ok(app.editor.getValue().includes("^{\\frac{#?}{#?}}"));
  assert.equal(app.root.dataset.latex, app.editor.getValue());
  assert.ok(app.saved > 0);
});

test("concluir fecha teclado sem apagar expressão; tocar novamente reabre", async () => {
  const app = await setup(true);
  const field = walk(app.root).find(el => el.tagName === "math-field");
  field.focus();
  const saved = app.editor.getValue();
  const done = walk(app.root).find(el => el.textContent === "Concluir expressão");
  done.click();
  assert.equal(app.window.mathVirtualKeyboard.visible, false);
  assert.equal(field.blurred, true);
  assert.equal(app.editor.getValue(), saved);
  field.focus();
  assert.equal(app.window.mathVirtualKeyboard.visible, true);
});

test("teclado físico em desktop não força teclado móvel", async () => {
  const app = await setup(false);
  const field = walk(app.root).find(el => el.tagName === "math-field");
  field.focus();
  assert.equal(app.window.mathVirtualKeyboard.showCount, 0);
  assert.equal(field.attributes["math-virtual-keyboard-policy"], "auto");
});

test("resposta discursiva e desenho permanecem preservados no mesmo exercício", () => {
  assert.match(trail, /MathPractice\.saveDraft\(progress\.drafts/);
  assert.match(trail, /createDrawingEditor\(/);
  assert.match(trail, /progress\.passed/);
  assert.match(trail, /quiz\.addEventListener\("submit"/);
  assert.match(trail, /practice\.append\(mathHost\);\s*practice\.append\(label\);/);
  assert.match(trail, /Explicação por escrito \(opcional\)/);
});

test("botões do teclado matemático são grandes o bastante para toque", () => {
  assert.match(stylesheet, /\.math-editor-shortcut\s*\{[\s\S]*?min-height:\s*46px;/);
  assert.match(stylesheet, /max-width:\s*430px/);
  assert.match(stylesheet, /orientation:\s*landscape/);
});
