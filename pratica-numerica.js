"use strict";
(function(root) {
  // Objective subparts only. Written explanations remain self-assessed.
  const specs = {
    M01:[['Soma das frações',11/12,'',1e-9],['Preço final',68,'R$',0.005]],
    M02:[['Valor de x',6,'',1e-9]],
    M03:[['Menor raiz',4,'',1e-9],['Maior raiz',5,'',1e-9]],
    M04:[['Resistência convertida',6800,'Ω',1e-6],['Corrente convertida',3.2,'µA',1e-9]],
    M05:[['y quando x = 0',1,'',1e-9],['y quando x = 1',3,'',1e-9],['y quando x = 2',5,'',1e-9]],
    M07:[['Média',20.1,'mm',0.0001],['Amplitude',0.2,'mm',0.0001]],
    M08:[['Aceleração média',3,'m/s²',1e-9],['Força resultante média',9,'N',1e-9]],
    M09:[['Corrente total',3,'mA',1e-9]],
    M13:[['Taxa média de 2 a 4',6,'',1e-9],['Taxa média de 2 a 2,1',4.1,'',1e-9]],
    S03:[['Constante de tempo τ',20,'ms',1e-9],['Tensão em t = τ',5*(1-Math.exp(-1)),'V',0.01]],
    S05:[['Corrente estimada',2.6,'mA',1e-9]]
  };
  function check(id,values,evaluate) {
    return (specs[id]??[]).map(([label,expected,unit,tolerance],i)=>{
      try {const value=evaluate(values[i]);return {label,unit,correct:Math.abs(value-expected)<=tolerance,tolerance};}
      catch {return {label,unit,correct:false,invalid:true,tolerance};}
    });
  }
  function create(host,id,initial,onChange) {
    const spec=specs[id];if(!spec)return null;
    const section=document.createElement('section');section.className='study-block';
    const heading=document.createElement('h3');heading.textContent='Confira os resultados numéricos';
    const help=document.createElement('p');help.textContent='Digite um número ou uma expressão, como 11/12 ou 2^3. Use as unidades indicadas em cada campo. As explicações são comparadas por você com a resolução.';section.append(heading,help);
    const inputs=spec.map(([label,,unit],i)=>{
      const field=document.createElement('label');field.className='numeric-answer';field.textContent=label+(unit?' ('+unit+')':'');
      const input=document.createElement('input');input.type='text';input.inputMode='text';input.maxLength=180;input.autocomplete='off';input.value=typeof initial?.[i]==='string'?initial[i]:'';
      input.addEventListener('input',()=>{onChange(inputs.map(x=>x.value));feedback.textContent='Resposta salva neste aparelho. Confira o estado da nuvem no menu.';});field.append(input);section.append(field);return input;
    });
    const verify=document.createElement('button');verify.type='button';verify.className='button';verify.textContent='Conferir valores';
    const feedback=document.createElement('p');feedback.setAttribute('role','status');
    verify.addEventListener('click',()=>{feedback.textContent=check(id,inputs.map(x=>x.value),root.EletronicaCalc.evaluate).map(r=>r.label+': '+(r.invalid?'expressão inválida':r.correct?'correto':'revise a conta e a unidade')+' (tolerância absoluta '+r.tolerance+(r.unit?' '+r.unit:'')+').').join(' ');});
    section.append(verify,feedback);host.append(section);return {getValue:()=>inputs.map(x=>x.value)};
  }
  root.NumericPractice={specs,check,create};if(typeof module==='object'&&module.exports)module.exports=root.NumericPractice;
})(typeof window!=='undefined'?window:globalThis);
