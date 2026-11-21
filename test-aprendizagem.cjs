const {test}=require('node:test');const assert=require('node:assert/strict');
const Learning=require('./aprendizagem-core.js');const Sync=require('./progresso-sync-core.js');
const fs=require('node:fs'),vm=require('node:vm'),ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('trilha-dados.js','utf8')+';this.stages=etapas;',ctx);
const stages=ctx.stages,stage=stages[3];
test('retomada aceita IDs válidos de qualquer módulo',()=>{
 const P=require('./trilha-progress-core.js'),can=i=>P.canOpen(stages,i);
 assert.deepEqual(Learning.resume({id:'M04',phase:'quiz'},stages,can),{index:4,phase:'quiz'});
 assert.deepEqual(Learning.resume({id:'M10',phase:'quiz'},stages,can),{index:10,phase:'quiz'});
 assert.equal(Learning.resume({id:'M99',phase:'quiz'},stages,can),null);
 assert.equal(Learning.resume({id:'M03',phase:'inventada'},stages,can),null);
});
test('indicadores dependem de quiz e revisão, sem domínio fabricado',()=>{
 const p={passed:[],drafts:{},attempts:{},reviews:{}};
 assert.equal(Learning.state(stage,p,20000),'Não iniciado');p.drafts.M03={text:'x'};assert.equal(Learning.state(stage,p,20000),'Em aprendizagem');
 p.passed=['M03'];p.attempts.M03=stage.quiz.map(q=>q[1]);assert.equal(Learning.state(stage,p,20000),'Proficiente');
 p.reviews.M03={round:0,due:19999};assert.equal(Learning.state(stage,p,20000),'Precisa revisar');
 p.reviews.M03={round:3,due:19999};assert.equal(Learning.state(stage,p,20000),'Proficiente');
});
test('histórico converge por UUID, preserva tentativas independentes e limita retenção',()=>{
 const row=i=>({uid:String(i),id:'M03',at:i,wrong:[0]});
 assert.equal(Learning.history(Array.from({length:70},(_,i)=>row(i))).length,60);
 assert.equal(Learning.history([row(1),row(1)]).length,1);
 const base={passed:['M03'],minutes:15,lastGoal:null,attempts:{},drafts:{},reviews:{}};
 const a={...base,history:[row(1)],resume:{id:'M03',phase:'pratica',at:1}};
 const b={...base,history:[row(2)],resume:{id:'M04',phase:'quiz',at:2}};
 const joined=Sync.merge(a,b,stages);assert.equal(joined.history.length,2);assert.equal(joined.resume.id,'M04');assert.deepEqual(joined.passed,['M03']);
 assert.equal(Sync.merge({...a,quizDraft:{id:'M03',answers:['a']}},{...b,quizDraft:{id:'M03',answers:['b']}},stages),null);
});
