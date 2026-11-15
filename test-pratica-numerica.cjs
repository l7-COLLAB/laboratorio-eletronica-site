const {test}=require('node:test'),assert=require('node:assert/strict');const N=require('./pratica-numerica.js'),C=require('./calculadora-core.js');
test('equivalência numérica, potências, frações e unidades explicitadas',()=>{
 assert.ok(N.check('M01',['22/24','80*(1-15/100)'],C.evaluate).every(r=>r.correct));
 assert.ok(N.check('M04',['6.8*10^3','3.2'],C.evaluate).every(r=>r.correct));
 assert.equal(N.check('M09',['0.003'],C.evaluate)[0].correct,false);
 assert.equal(N.check('M09',['3'],C.evaluate)[0].correct,true);
});
test('tolerância RC e entradas inválidas não produzem falso acerto',()=>{
 assert.ok(N.check('S03',['20','3.16'],C.evaluate).every(r=>r.correct));
 for(const input of ['1/0','NaN','alert(1)',''])assert.equal(N.check('M02',[input],C.evaluate)[0].correct,false);
});
test('todos os gabaritos numéricos conferem com o parser existente',()=>{
 for(const [id,spec]of Object.entries(N.specs))assert.ok(N.check(id,spec.map(r=>String(r[1])),C.evaluate).every(r=>r.correct),id);
});
