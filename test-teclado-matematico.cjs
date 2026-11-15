"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const MathPractice = require("./math-editor-core.js");

test("numeric exercises use math keyboard, prose exercises keep conventional fields", () => {
  for (const id of ["M01", "M03", "M06", "M13", "S03", "S07"])
    assert.equal(MathPractice.supportsMath(id), true);
  for (const id of ["M00", "M10", "M11", "M12", "S06", "S09", "S10"])
    assert.equal(MathPractice.supportsMath(id), false);
});

test("fractions, nested fractions, fractional exponents, radicals and parentheses persist as LaTeX", () => {
  const examples = [
    "\\frac{3}{4}",
    "\\frac{1+\\frac{2}{3}}{4}",
    "x^{\\frac{2}{3}}",
    "\\frac{(x+1)^2}{\\sqrt[3]{8}}"
  ];
  for (const formula of examples) {
    const drafts = MathPractice.saveDraft({}, "M03", "", formula);
    assert.equal(drafts.M03.latex, formula);
    assert.ok(MathPractice.hasAnswer("", drafts.M03.latex));
  }
});

test("text inputs and math inputs stay independent and old progress fields survive", () => {
  const old = { passed: ["M03"], attempts: { M03: ["a", "b", "c"] },
    reviews: { M03: { round: 0, due: 20765 } } };
  const prose = MathPractice.saveDraft({}, "M00", "Minha meta", "ignored");
  assert.deepEqual(prose.M00, { text: "Minha meta", latex: "", drawing: "", diagram: "" });
  const saved = { ...old, drafts: MathPractice.saveDraft(prose, "M06", "Cateto 5", "\\frac{5}{13}") };
  const restored = { ...saved, drafts: MathPractice.cleanDrafts(saved.drafts) };
  assert.deepEqual(restored.passed, old.passed);
  assert.deepEqual(restored.attempts, old.attempts);
  assert.deepEqual(restored.reviews, old.reviews);
  assert.equal(restored.drafts.M06.latex, "\\frac{5}{13}");
  assert.equal(prose.M06, undefined);
});

test("draft sanitization caps lengths, removes invalid stages and clears empty answers", () => {
  const capped = MathPractice.saveDraft({}, "M03", "a".repeat(2000), "b".repeat(2000));
  assert.equal(capped.M03.text.length, 1000);
  assert.equal(capped.M03.latex.length, 800);
  assert.deepEqual(MathPractice.saveDraft(capped, "INVALID", "", ""), capped);
  assert.equal(MathPractice.saveDraft(capped, "M03", "", " ").M03, undefined);
  assert.equal(MathPractice.cleanDrafts({ S09: { text: "Texto", latex: "x^2" } }).S09.latex, "");
});
