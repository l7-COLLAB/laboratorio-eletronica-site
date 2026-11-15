"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const core=require("./progresso-sync-core.js");

const stages=vm.runInNewContext(fs.readFileSync("trilha-dados.js","utf8")+"\netapas",{});
function state(passed=[],extra={}) {
  return {passed,reviews:{},attempts:{},drafts:{},minutes:15,lastGoal:null,...extra};
}

test("login no iPhone: cloud M03 + local vazio nunca apaga M03", () => {
 const merged=core.merge(state([]),state(["M03"]),stages);
 assert.deepEqual(merged.passed,["M03"]);
});

test("dois dispositivos: módulos concluídos distintos são unidos na mesma conta",()=>{
 const a=state(["M00","M01"],{attempts:{M01:["erro","erro","erro"]},lastGoal:20772});
 const b=state(["M03"],{attempts:{M03:stages.find(x=>x.id==="M03").quiz.map(q=>q[1])},lastGoal:20771});
 const merged=core.merge(a,b,stages);
 assert.deepEqual(new Set(merged.passed),new Set(["M00","M01","M03"]));
 assert.equal(merged.attempts.M01.length,3);
 assert.equal(merged.attempts.M03.length,3);
 assert.equal(merged.lastGoal,20772);
});

test("3/3 quiz antigo recupera conclusão mesmo quando passed perdeu o ID",()=>{
 const correct=stages.find(x=>x.id==="M03").quiz.map(q=>q[1]);
 const merged=core.merge(state([],{attempts:{M03:correct}}),state([]),stages);
 assert.ok(merged.passed.includes("M03"));
});

test("rascunhos em módulos diferentes são preservados e combinados",()=>{
 const a=state(["M03"],{drafts:{M03:{text:"fatorei x²",latex:"",drawing:""}}});
 const b=state(["M04"],{drafts:{M04:{text:"",latex:"x^2",drawing:""}}});
 const merged=core.merge(a,b,stages);
 assert.equal(merged.drafts.M03.text,"fatorei x²");
 assert.equal(merged.drafts.M04.latex,"x^2");
});

test("duas respostas diferentes no mesmo módulo exigem confirmação em vez de perda",()=>{
 const a=state(["M03"],{drafts:{M03:{text:"Minha resposta no iPhone"}}});
 const b=state(["M03"],{drafts:{M03:{text:"Outra resposta no Safari"}}});
 assert.equal(core.merge(a,b,stages),null);
});

test("desenho e expressão matemática independentes não se sobrepõem",()=>{
 const a=state([], {drafts:{M06:{drawing:"[[[1,2],[3,4]]]",text:"",latex:""}}});
 const b=state([], {drafts:{M06:{drawing:"",text:"",latex:"\\frac{5}{13}"}}});
 const merged=core.merge(a,b,stages);
 assert.ok(merged.drafts.M06.drawing.startsWith("[["));
 assert.equal(merged.drafts.M06.latex,"\\frac{5}{13}");
});

test("revisão mais avançada vence sem perder outros registros",()=>{
 const a=state(["M03"],{reviews:{M03:{round:2,due:20778}}});
 const b=state(["M03"],{reviews:{M03:{round:1,due:20775},M00:{round:0,due:20773}}});
 const merged=core.merge(a,b,stages);
 assert.equal(merged.reviews.M03.round,2);
 assert.equal(merged.reviews.M00.round,0);
});

test("dados de etapas preexistentes nunca são alterados durante o merge",()=>{
 const local=state(["M03"],{attempts:{M03:["a","b","c"]},minutes:20});
 const remote=state([], {attempts:{}});
 const before=JSON.stringify(local);
 const merged=core.merge(local,remote,stages);
 assert.equal(JSON.stringify(local),before);
 assert.equal(merged.minutes,20);
 assert.equal(merged.attempts.M03.length,3);
});

test("não mescla estruturas corrompidas",()=>{
 assert.equal(core.merge(null,state([])),null);
 assert.equal(core.merge(state([]),{passed:"M03"}),null);
});

test("formulário de login aparece sem primeiro acesso e com convite antigo",()=>{
 const html=fs.readFileSync("index.html","utf8");
 const js=fs.readFileSync("nuvem.js","utf8");
 assert.match(html,/id="nuvem-login"/);
 assert.match(html,/id="nuvem-mostrar-criar"[^>]*hidden/);
 assert.match(html,/id="nuvem-voltar-login"/);
 assert.match(js,/get\("nuvem-login"\)\.hidden = connected \|\| creating/);
 assert.match(js,/get\("nuvem-acesso"\)\.hidden = connected/);
 assert.match(js,/showSetup = false/);
 assert.match(js,/get\("nuvem-mostrar-criar"\)\.addEventListener/);
});

test("sincronização de progresso é acionada em pull e em conflito de PUT",()=>{
 const js=fs.readFileSync("nuvem.js","utf8");
 assert.match(js,/mergeStudyProgress\(entry, keys\)/);
 assert.match(js,/mergeStudyProgress\(response\.current, \[\]\)/);
 assert.match(js,/verified = true/);
 assert.match(js,/Salvo neste aparelho\. Aguardando confirmação da nuvem/);
});


test("diagrama interativo não se perde ao juntar progresso de dois navegadores",()=>{
 const local=state(["M06"],{drafts:{M06:{diagram:"{\"points\":[[0,0],[3,4]]}",text:"",latex:"",drawing:""}}});
 const remote=state(["M03"],{drafts:{M03:{diagram:"",text:"Exercício",latex:"",drawing:""}}});
 const result=core.merge(local,remote,stages);
 assert.equal(result.drafts.M06.diagram,local.drafts.M06.diagram);
 assert.equal(result.drafts.M03.text,"Exercício");
});
test("dois diagramas diferentes para a mesma etapa exigem decisão humana",()=>{
 const local=state([], {drafts:{M06:{diagram:"{\"points\":[[0,0],[3,4]]}"}}});
 const remote=state([], {drafts:{M06:{diagram:"{\"points\":[[0,0],[5,12]]}"}}});
 assert.equal(core.merge(local,remote,stages),null);
});
