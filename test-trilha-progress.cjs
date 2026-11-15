"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Progress = require("./trilha-progress-core.js");

const stageCode = fs.readFileSync(require.resolve("./trilha-dados.js"), "utf8");
const stages = vm.runInNewContext(stageCode + "\netapas", {});
const ids = Array.from(stages, stage => stage.id);
const expected = [
  ...Array.from({ length: 14 }, (_, n) => "M" + String(n).padStart(2, "0")),
  ...Array.from({ length: 10 }, (_, n) => "S" + String(n + 1).padStart(2, "0"))
];

test("etapas ficam na ordem curricular correta, sem alterações de conteúdo", () => {
  assert.deepEqual(ids, expected);
  assert.equal(new Set(ids).size, expected.length);
  for (const stage of stages) {
    assert.equal(stage.quiz.length, 3);
    for (const question of stage.quiz) assert.equal(question.length, 6);
  }
});

test("novo aluno começa em M00, sem desbloquear módulos futuros", () => {
  assert.equal(Progress.completedCount(stages, []), 0);
  assert.equal(Progress.nextRecommended(stages, []), 0);
  assert.equal(Progress.canOpen(stages, [], 0), true);
  assert.equal(Progress.canOpen(stages, [], 1), false);
});

test("quem concluiu M03 na versão antiga recebe M04 como próximo módulo", () => {
  const done = ["M03"];
  assert.equal(Progress.completedCount(stages, done), 1);
  assert.equal(Progress.nextRecommended(stages, done), 4);
  assert.equal(Progress.completed(stages, done, "M03"), true);
  assert.equal(Progress.canOpen(stages, done, 4), true);
  assert.equal(Progress.canOpen(stages, done, 5), false);
  assert.equal(Progress.canOpen(stages, done, 0), true);
});

test("quem concluiu M03 e M06 mantém ambos e acesso ao próximo", () => {
  const done = ["M03", "M06"];
  assert.equal(Progress.completedCount(stages, done), 2);
  assert.equal(Progress.canOpen(stages, done, 7), true);
  assert.equal(Progress.canOpen(stages, done, 8), false);
  assert.equal(Progress.nextRecommended(stages, done), 7);
  assert.equal(Progress.completed(stages, done, "M00"), false);
});

test("progresso sequencial normal libera somente o próximo módulo", () => {
  const done = ["M00", "M01", "M02"];
  assert.equal(Progress.nextRecommended(stages, done), 3);
  assert.equal(Progress.canOpen(stages, done, 3), true);
  assert.equal(Progress.canOpen(stages, done, 4), false);
});

test("3/3 já registrado recupera conclusão perdida, sem inferir a partir de quiz incompleto", () => {
  const correctM03 = Array.from(stages.find(x => x.id === "M03").quiz, q => q[1]);
  const correctM06 = Array.from(stages.find(x => x.id === "M06").quiz, q => q[1]);
  const partial = correctM06.slice();
  partial[2] = "incorreta";
  const attempts = { M03: correctM03, M06: partial };
  const prior = ["M00"];
  const restored = Progress.recoverPassed(stages, prior, attempts);
  assert.deepEqual(restored, ["M00", "M03"]);
  assert.deepEqual(prior, ["M00"]);
  assert.equal(Progress.canOpen(stages, restored, 4), true);
  assert.equal(Progress.canOpen(stages, restored, 7), false);
  assert.deepEqual(Progress.recoverPassed(stages, restored, attempts), restored);
});

test("dados de outras áreas e tentativas são preservados, sem alteração no histórico", () => {
  const state = {
    passed: ["M03"], reviews: { M03: {round: 0, due: 20700} },
    attempts: {}, drafts: {M03: {text: "fatoração", latex: "x^2"}},
    minutes: 15, lastGoal: 20700
  };
  const next = {...state, passed: Progress.recoverPassed(stages, state.passed, state.attempts)};
  assert.deepEqual(next.reviews, state.reviews);
  assert.deepEqual(next.drafts, state.drafts);
  assert.deepEqual(next.attempts, state.attempts);
  assert.equal(next.lastGoal, state.lastGoal);
  assert.equal(next.minutes, state.minutes);
});

test("ao completar toda a trilha, recomenda etapa faltante ou encerra", () => {
  assert.equal(Progress.nextRecommended(stages, expected), stages.length);
  assert.equal(Progress.completedCount(stages, expected), 24);
  const missing = expected.filter(x => x !== "M05");
  assert.equal(Progress.nextRecommended(stages, missing), 5);
  assert.equal(Progress.canOpen(stages, missing, 5), true);
});

test("UI usa reconhecimento por ID para corrigir e liberar etapas", () => {
  const source = fs.readFileSync(require.resolve("./trilha.js"), "utf8");
  assert.match(source, /button\.disabled = !canOpen\(index\)/);
  assert.match(source, /const alreadyPassed = isComplete\(stage\.id\)/);
  assert.match(source, /const newCompletion = passedNow && !isComplete\(stage\.id\) && canOpen\(selected\)/);
  assert.match(source, /const count = TrailProgress\.completedCount/);
});
