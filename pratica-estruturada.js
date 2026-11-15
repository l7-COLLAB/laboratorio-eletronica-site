"use strict";
/* Editor responsivo para tabelas, circuitos e gráficos com resposta verificável. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const diagrams = {
    series: `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round">
      <path d="M34 35 H68 M121 35 H169 M222 35 H300 V165 H34 V113 M34 70 V35"/>
      <rect x="68" y="24" width="53" height="23" rx="4"/>
      <rect x="169" y="24" width="53" height="23" rx="4"/>
      <circle cx="34" cy="91" r="22"/><path d="M27 84 H41 M34 77 V91 M27 100 H41"/></g>
      <g font-size="14" fill="currentColor" text-anchor="middle">
        <text x="95" y="17">R1</text><text x="195" y="17">R2</text>
        <text x="95" y="74" data-slot="r1">?</text><text x="195" y="74" data-slot="r2">?</text>
        <text x="34" y="128" data-slot="v">?</text><text x="165" y="153" data-slot="i">I = ?</text>
      </g>`,
    node: `<g fill="none" stroke="currentColor" stroke-width="3">
      <path d="M24 105 H68 M121 105 H170 M170 105 H213 M265 105 H297 V167"/>
      <path d="M297 167 H266 M272 174 H291 M278 181 H285"/>
      <rect x="68" y="94" width="53" height="23" rx="4"/><rect x="213" y="94" width="52" height="23" rx="4"/>
      <circle cx="170" cy="105" r="5" fill="currentColor"/></g>
      <g font-size="13" fill="currentColor" text-anchor="middle">
        <text x="25" y="92">6 V</text><text x="94" y="86">R1</text><text x="239" y="86">R2</text>
        <text x="94" y="143" data-slot="r1">?</text><text x="239" y="143" data-slot="r2">?</text>
        <text x="170" y="78" data-slot="v">V = ?</text>
        <text x="70" y="163" data-slot="in">I entrada = ?</text>
        <text x="248" y="163" data-slot="out">I saída = ?</text>
      </g>`,
    graph: `<g fill="none" stroke="currentColor" stroke-width="2">
      <path d="M48 20 V178 H316"/><path d="M44 26 L48 18 L52 26 M310 174 L318 178 L310 182"/>
      <path d="M48 139 H316 M48 100 H316 M48 61 H316" opacity=".15"/></g>
      <g font-size="13" fill="currentColor">
        <text x="10" y="18">V (V)</text><text x="248" y="204">I (mA)</text>
        <text x="28" y="180">0</text><text x="28" y="140">1</text><text x="28" y="101">2</text><text x="28" y="62">3</text>
      </g><g data-points></g>`
  };
  function svgElement(markup, aria) {
    const svg = document.createElementNS(NS,"svg");
    svg.classList.add("structured-diagram");
    svg.setAttribute("viewBox","0 0 340 212");
    svg.setAttribute("role","img");
    svg.setAttribute("aria-label",aria);
    svg.innerHTML=markup;
    return svg;
  }
  function create(host,id,{initial="",onChange=()=>{}}={}) {
    const core=window.StructuredPracticeCore;
    if (!core?.has(id)) return null;
    const spec=core.specs[id], state=core.parse(id,initial);
    const section=document.createElement("section");
    section.className="structured-practice";
    section.dataset.structuredPractice=id;
    const hasData=()=>spec.fields.some(f=>Boolean((state[f.id]||"").trim()));
    section.dataset.hasDraft=String(hasData());
    const title=document.createElement("h3");
    title.textContent=spec.title;
    const help=document.createElement("p");
    help.className="structured-help";
    help.textContent=spec.note;
    const controls=document.createElement("div");
    controls.className="structured-fields";
    const feedback=document.createElement("p");
    feedback.className="structured-feedback";
    feedback.setAttribute("role","status");
    section.append(title,help);
    let preview;
    if (diagrams[spec.kind]) {
      preview=svgElement(diagrams[spec.kind],spec.kind==="graph" ? "Gráfico de tensão versus corrente construído com suas respostas" : "Esquema elétrico com posições para os valores selecionados");
      section.append(preview);
    }
    if (spec.kind==="truth") controls.classList.add("structured-truth");
    const editors={};
    const notify=()=>{
      section.dataset.hasDraft=String(hasData());
      feedback.textContent="Resposta registrada. Use Corrigir atividade para conferir os campos objetivos.";
      renderPreview();
      onChange();
    };
    for(const f of spec.fields){
      const label=document.createElement("label");
      label.textContent=f.label;
      let input;
      if (f.type==="text") {
        input=document.createElement("textarea");
        input.rows=2;
        input.maxLength=120;
        input.placeholder="Registre uma resposta verificável…";
        input.value=state[f.id] || "";
        input.addEventListener("input",()=>{
          state[f.id]=input.value.slice(0,120);notify();
        });
      } else {
        input=document.createElement("select");
        input.setAttribute("aria-label",f.label);
        for(const value of f.options){
          const opt=document.createElement("option");
          opt.value=value;
          opt.textContent=value || "Selecione…";
          input.append(opt);
        }
        input.value=state[f.id] || "";
        input.addEventListener("change",()=>{
          state[f.id]=input.value;notify();
        });
      }
      editors[f.id]=input;
      label.append(input);
      controls.append(label);
    }
    function renderPreview(){
      if(!preview)return;
      if(spec.kind==="graph"){
        const points=preview.querySelector("[data-points]");
        points.replaceChildren();
        ["i1","i2","i3"].forEach((id,index)=>{
          const parsed=Number((state[id]||"").replace(" mA","").replace(",","."));
          if(!Number.isFinite(parsed)||parsed<=0) return;
          const circle=document.createElementNS(NS,"circle");
          circle.setAttribute("cx",String(48+parsed*140));
          circle.setAttribute("cy",String(178-(index+1)*39));
          circle.setAttribute("r","6");
          circle.setAttribute("fill","#91c65d");
          const title=document.createElementNS(NS,"title");
          title.textContent=(index+1)+" V; "+parsed+" mA";
          circle.append(title);
          points.append(circle);
        });
      } else {
        for(const f of spec.fields){
          const target=preview.querySelector('[data-slot="'+f.id+'"]');
          if(target)target.textContent=(f.id==="i"?"I = ":"")+(state[f.id]||"?");
        }
      }
    }
    const check=document.createElement("button");
    check.type="button";
    check.className="button primary";
    check.textContent="Corrigir atividade";
    check.addEventListener("click",()=>{
      const result=core.grade(id,state);
      if(!result.complete){
        const missing=result.missing.map(k=>spec.fields.find(f=>f.id===k)?.label).filter(Boolean);
        feedback.textContent="Falta preencher: "+missing.join("; ")+".";
      } else if(result.graded){
        feedback.textContent=result.correct
          ? "Todos os campos objetivos estão corretos."
          : "Revise: "+result.errors.map(k=>spec.fields.find(f=>f.id===k)?.label).join("; ")+".";
      } else {
        feedback.textContent=(result.errors.length
          ? "Campos objetivos a revisar: "+result.errors.map(k=>spec.fields.find(f=>f.id===k)?.label).join("; ")+". "
          : "Campos objetivos conferidos. ")
          +"As explicações escritas exigem comparação com a resolução.";
      }
    });
    section.append(controls,check,feedback);
    host.append(section);
    renderPreview();
    return {
      getValue:()=>JSON.stringify(Object.fromEntries(spec.fields.map(f=>[f.id,state[f.id]||""]))),
      validate:()=>core.grade(id,state)
    };
  }
  window.StructuredPractice={create};
})();
