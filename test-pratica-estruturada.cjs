"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const Structured=require("./pratica-estruturada-core.js");
const MathPractice=require("./math-editor-core.js");
const trail=fs.readFileSync(require.resolve("./trilha.js"),"utf8");
const html=fs.readFileSync(require.resolve("./index.html"),"utf8");

test("all 13 missing structured practice tasks have a dedicated tool and objective keys",()=>{
 const expected=["M05","M09","M10","M11","M12","S01","S02","S04","S06","S07","S08","S09","S10"];
 assert.deepEqual(Object.keys(Structured.specs).sort(),expected.sort());
 for(const [id,spec] of Object.entries(Structured.specs)){
   assert.ok(["table","series","truth","protocol","graph","node"].includes(spec.kind),id);
   assert.ok(spec.fields.length>0,id);
   const good=Object.fromEntries(spec.fields.map(field=>[field.id,field.answer ?? "Um procedimento com valores, unidade e controle"]));
   const grade=Structured.grade(id,good);
   assert.equal(grade.complete,true,id);
   assert.equal(grade.correct,spec.fields.every(x=>x.answer!==undefined)?true:null,id);
   assert.equal(grade.missing.length,0,id);
   for(const field of spec.fields) if(field.answer!==undefined){
     assert.ok(field.options.includes(field.answer),id+": "+field.id);
     assert.equal(field.options[0],"",id);
   }
   const saved=MathPractice.saveDraft({},id,"","", "",JSON.stringify(good));
   assert.ok(saved[id]?.diagram,id+" diagram was not preserved");
   assert.deepEqual(Structured.parse(id,saved[id].diagram),good,id+" roundtrip");
   assert.deepEqual(Structured.parse(id,MathPractice.cleanDrafts(saved)[id].diagram),good,id+" cloud cleanup");
 }
});

test("missing choices and wrong circuit labels are detected, not accepted",()=>{
 assert.equal(Structured.grade("M09",{v:"6 V",r1:"1 kΩ"}).complete,false);
 const wrong=Structured.grade("M09",{v:"6 V",r1:"1 kΩ",r2:"2 kΩ",i:"3 mA"});
 assert.equal(wrong.complete,true);
 assert.equal(wrong.correct,false);
 assert.deepEqual(wrong.errors,["r2"]);
 assert.equal(Structured.grade("S06",{p0:"Corta"}).complete,false);
 assert.equal(Structured.grade("S08",{space:"DRC",connection:"LVS",delay:"STA"}).correct,true);
 assert.equal(Structured.grade("M10",{o00:"1",o01:"1",o10:"1",o11:"0"}).correct,true);
});

test("written experiment protocols are complete but not marked correct automatically",()=>{
 const good={fonte:"Fonte fixa de 5 V",config:"R1=1k/R2=1k e R1=1k/R2=2k",
    metodo:"Calcular Vout e comparar com o circuito simulado",limite:"Diodo e cargas reais ignorados"};
 assert.equal(Structured.grade("M12",good).complete,true);
 assert.equal(Structured.grade("M12",good).graded,false);
 assert.equal(Structured.grade("M12",good).correct,null);
 assert.equal(Structured.grade("S10",{delay:"20%",power:"20%",conditions:"mesmo modelo",limitation:"carga única"}).errors[0],"delay");
});

test("malformed, stale or invalid diagram values cannot bypass verification",()=>{
 assert.deepEqual(Structured.parse("M09","not json"),{});
 assert.deepEqual(Structured.parse("M09",JSON.stringify({r1:"99 kΩ",r2:"1 kΩ"})),
 {v:"",r1:"",r2:"1 kΩ",i:""});
 assert.equal(Structured.grade("INVALID",{}).complete,false);
 assert.equal(Structured.parse("INVALID","{}").constructor,Object);
});

test("course drawing demands all have suitable diagram tools",()=>{
 const context={};
 vm.runInNewContext(fs.readFileSync(require.resolve("./trilha-dados.js"),"utf8")+";globalThis.stages=etapas;",context);
 assert.equal(context.stages.length,24);
 const actualDrawingTasks=context.stages.filter(stage=>/desenh|esbo[cç]|trace (?:um |o )?gr[aá]fico|fa[cç]a (?:um |o )?diagrama/i.test(stage.task));
 assert.deepEqual(actualDrawingTasks.map(x=>x.id),["M06"]);
 assert.match(trail,/stage\.id === "M06"[\s\S]*?createTriangleExercise/);
 assert.match(trail,/StructuredPractice\.create\(/);
 assert.match(trail,/diagramEditor\.validate\(\)\.complete/);
 for(const id of Object.keys(Structured.specs))assert.ok(context.stages.some(x=>x.id===id));
});

test("old numeric history and cloud schema remain intact",()=>{
 assert.match(trail,/progress\.practiceAnswers/);
 assert.match(trail,/MathPractice\.saveDraft\(progress\.drafts/);
 assert.match(trail,/oldNumbers/);
 assert.match(html,/pratica-estruturada-core\.js/);
 assert.match(html,/pratica-estruturada\.js/);
 assert.match(html,/pratica-estruturada\.css/);
});
