"use strict";
/* Atividades de resposta estruturada: dados e correção objetivos, sem serviço externo. */
(function (root) {
  const select = (id, label, answer, options) =>
    ({id, label, answer, options: ["", ...options]});
  const writing = (id, label) => ({id, label, type:"text"});
  const specs = {
    M05: {title:"Tabela da função y = 2x + 1", kind:"table",
      note:"Complete cada linha. Depois explique a inclinação no campo de texto.",
      fields:[
        select("y0","x = 0 · y = ?","1",["0","1","2","3","5"]),
        select("y1","x = 1 · y = ?","3",["1","2","3","4","5"]),
        select("y2","x = 2 · y = ?","5",["2","3","4","5","6"])
      ]},
    M09: {title:"Monte o circuito de resistores em série",kind:"series",
      note:"Selecione os valores nas posições do circuito e calcule a corrente em mA.",
      fields:[
        select("v","Fonte de tensão","6 V",["3 V","6 V","9 V","12 V"]),
        select("r1","Resistor R1","1 kΩ",["0,5 kΩ","1 kΩ","2 kΩ","3 kΩ"]),
        select("r2","Resistor R2","1 kΩ",["0,5 kΩ","1 kΩ","2 kΩ","3 kΩ"]),
        select("i","Corrente total","3 mA",["1 mA","2 mA","3 mA","6 mA"])
      ]},
    M10: {title:"Tabela-verdade da porta NAND",kind:"truth",
      note:"A e B já estão definidos. Selecione a saída correta de cada combinação.",
      fields:[
        select("o00","A=0 · B=0 · saída","1",["0","1"]),
        select("o01","A=0 · B=1 · saída","1",["0","1"]),
        select("o10","A=1 · B=0 · saída","1",["0","1"]),
        select("o11","A=1 · B=1 · saída","0",["0","1"])
      ]},
    M11: {title:"Tabela de testes da calculadora de corrente",kind:"table",
      note:"Verifique três entradas, inclusive a resistência igual a zero.",
      fields:[
        select("t1","9 V e 3000 Ω · saída", "3 mA",["0 mA","2 mA","3 mA","9 mA","Rejeitar"]),
        select("t2","0 V e 1000 Ω · saída", "0 mA",["0 mA","1 mA","3 mA","Rejeitar"]),
        select("t3","5 V e 0 Ω · saída", "Rejeitar",["0 mA","5 mA","Infinito","Rejeitar"])
      ]},
    M12: {title:"Roteiro para comparar dois divisores",kind:"protocol",
      note:"Monte um protocolo reproduzível. A clareza técnica será comparada com o exemplo resolvido; o site não consegue avaliar automaticamente a justificativa.",
      fields:[
        writing("fonte","Tensão fixa e unidade"),
        writing("config","Duas configurações de resistores (R1 e R2)"),
        writing("metodo","Como calcular e comparar com a simulação"),
        writing("limite","Limitação ou condição do modelo")
      ]},
    S01: {title:"Pares de tensão e corrente para 2 kΩ",kind:"graph",
      note:"A tensão das três medições é fixa. Insira a corrente em mA para construir os pontos no gráfico V × I.",
      fields:[
        select("i1","V = 1 V · corrente","0,5 mA",["0,25 mA","0,5 mA","1 mA","2 mA"]),
        select("i2","V = 2 V · corrente","1 mA",["0,5 mA","1 mA","1,5 mA","2 mA"]),
        select("i3","V = 3 V · corrente","1,5 mA",["0,5 mA","1 mA","1,5 mA","2 mA"])
      ]},
    S02: {title:"Circuito de um nó com resistores iguais",kind:"node",
      note:"Selecione os resistores e calcule a tensão do nó e as correntes que entram e saem.",
      fields:[
        select("r1","R1 · ligado à fonte de 6 V","1 kΩ",["0,5 kΩ","1 kΩ","2 kΩ"]),
        select("r2","R2 · ligado ao terra","1 kΩ",["0,5 kΩ","1 kΩ","2 kΩ"]),
        select("v","Tensão do nó V","3 V",["2 V","3 V","4 V","5 V"]),
        select("in","Corrente de entrada","3 mA",["2 mA","3 mA","4 mA","6 mA"]),
        select("out","Corrente de saída","3 mA",["2 mA","3 mA","4 mA","6 mA"])
      ]},
    S04: {title:"Comparação das taxas de amostragem",kind:"table",
      note:"A banda do sinal vai até 2 kHz. Classifique as duas taxas propostas.",
      fields:[
        select("a","3 kHz","Não atende",["Atende","Não atende"]),
        select("b","8 kHz","Atende",["Atende","Não atende"])
      ]},
    S06: {title:"Estados do inversor CMOS",kind:"truth",
      note:"Preencha a condução de cada transistor e a saída para os dois valores da entrada.",
      fields:[
        select("p0","Entrada 0 · PMOS","Conduz",["Conduz","Corta"]),
        select("n0","Entrada 0 · NMOS","Corta",["Conduz","Corta"]),
        select("o0","Entrada 0 · saída","1",["0","1"]),
        select("p1","Entrada 1 · PMOS","Corta",["Conduz","Corta"]),
        select("n1","Entrada 1 · NMOS","Conduz",["Conduz","Corta"]),
        select("o1","Entrada 1 · saída","0",["0","1"])
      ]},
    S07: {title:"Escolha por restrições de projeto",kind:"table",
      note:"A: 6 ns, 9 mW e área 12. B: 8 ns, 5 mW e área 10. Limite de atraso: 7 ns.",
      fields:[
        select("choice","Qual atende à restrição?", "Projeto A",["Projeto A","Projeto B","Ambos","Nenhum"])
      ]},
    S08: {title:"Classifique as violações de projeto",kind:"table",
      note:"Associe cada situação ao procedimento de verificação adequado.",
      fields:[
        select("space","Espaçamento físico incorreto","DRC",["DRC","LVS","STA"]),
        select("connection","Conexão ausente","LVS",["DRC","LVS","STA"]),
        select("delay","Atraso excessivo","STA",["DRC","LVS","STA"])
      ]},
    S09: {title:"Planejamento do experimento de carga",kind:"protocol",
      note:"Descreva as condições suficientes para outra pessoa repetir o teste. A qualidade das justificativas exige comparação com a solução.",
      fields:[
        writing("loads","Três capacitâncias de carga"),
        writing("metric","Como medir o atraso e com qual unidade"),
        writing("control","Dois controles mantidos constantes"),
        writing("record","Modelo, versão e parâmetros registrados")
      ]},
    S10: {title:"Resumo do resultado e de seus limites",kind:"protocol",
      note:"Responda às duas contas objetivas e explique o contexto. As justificativas continuam sujeitas à comparação com a resolução.",
      fields:[
        select("delay","Redução de 20 para 15 ns","25%",["5%","20%","25%","33%"]),
        select("power","Aumento de 5 para 6 mW","20%",["1%","16,7%","20%","25%"]),
        writing("conditions","Condições e dados do teste"),
        writing("limitation","Uma limitação da conclusão")
      ]}
  };
  const has = id => Object.hasOwn(specs,id);
  const parse = (id, raw) => {
    if (!has(id)) return {};
    let candidate;
    try { candidate=JSON.parse(raw); } catch { return {}; }
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return {};
    const next={};
    for(const f of specs[id].fields) {
      const value=typeof candidate[f.id]==="string" ? candidate[f.id].slice(0,120) : "";
      next[f.id]=f.type==="text" ? value : f.options.includes(value) ? value : "";
    }
    return next;
  };
  const grade = (id, answers) => {
    if (!has(id)) return {complete:false,correct:false,graded:false,missing:[],errors:[]};
    const spec=specs[id], answersSafe=answers && typeof answers==="object" ? answers : {};
    const missing=[], errors=[];
    for(const f of spec.fields) {
      const value=typeof answersSafe[f.id]==="string" ? answersSafe[f.id].trim() : "";
      if(!value) missing.push(f.id);
      else if (f.answer !== undefined && value !== f.answer) errors.push(f.id);
    }
    const graded=spec.fields.every(f=>f.answer!==undefined);
    return {complete:missing.length===0,correct:graded ? !missing.length&&!errors.length : null,graded,missing,errors};
  };
  const api=Object.freeze({specs,has,parse,grade});
  root.StructuredPracticeCore=api;
  if(typeof module==="object" && module.exports) module.exports=api;
})(typeof window!=="undefined" ? window : globalThis);
