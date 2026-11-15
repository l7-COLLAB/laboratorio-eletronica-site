"use strict";
function createTriangleExercise(host, {initial = "", onChange = () => {}} = {}) {
  const root = document.createElement("section");
  root.className = "geometry-exercise";
  root.dataset.triangleExercise = "";
  const instructions = document.createElement("p");
  instructions.textContent = "Figura pronta: selecione o valor de cada lado, a posição do ângulo θ e as razões trigonométricas. Depois clique em Corrigir desenho.";
  const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox","0 0 340 230");
  svg.setAttribute("role","img");
  svg.setAttribute("aria-label","Triângulo retângulo com lado vertical, horizontal e diagonal. Ângulo reto no canto inferior esquerdo.");
  svg.innerHTML = '<path d="M55 35 L55 195 L300 195 Z" fill="#f0f6ff" stroke="#214c7c" stroke-width="3"/><path d="M55 177 H73 V195" fill="none" stroke="#214c7c" stroke-width="2"/><text x="20" y="114" font-size="14">A</text><text x="42" y="215" font-size="14">B</text><text x="310" y="215" font-size="14">C</text>';
  const fields = document.createElement("div");
  fields.className = "geometry-fields";
  const opts = (values) => values.map(v=>'<option value="'+v+'">'+(v || 'Selecione')+'</option>').join("");
  const selectors = [
    ["vertical","Lado vertical (AB)",["","5","12","13"]],
    ["horizontal","Lado horizontal (BC)",["","5","12","13"]],
    ["diagonal","Hipotenusa (AC)",["","5","12","13"]],
    ["angle","Ângulo θ",["","A","B","C"]],
    ["sin","sen θ",["","5/13","12/13","5/12","12/5"]],
    ["cos","cos θ",["","5/13","12/13","5/12","12/5"]]
  ];
  const controls = {};
  for (const [key, label, choices] of selectors) {
    const field = document.createElement("label");
    field.textContent = label;
    const select = document.createElement("select");
    select.setAttribute("aria-label",label);
    select.innerHTML = opts(choices);
    field.append(select); fields.append(field);
    controls[key] = select;
  }
  let state = {};
  try { const parsed = JSON.parse(initial); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) state = parsed; } catch {}
  for (const key of Object.keys(controls)) if ([...controls[key].options].some(x=>x.value===state[key])) controls[key].value = state[key];
  const feedback = document.createElement("p");
  feedback.className = "geometry-feedback";
  feedback.setAttribute("role","status");
  const verify = document.createElement("button");
  verify.type = "button"; verify.className = "button primary"; verify.textContent = "Corrigir desenho";
  const getValue = () => JSON.stringify(Object.fromEntries(Object.entries(controls).map(([k,v])=>[k,v.value])));
  const validate = () => {
    const expected = {vertical:"5",horizontal:"12",diagonal:"13",angle:"C",sin:"5/13",cos:"12/13"};
    const missing = Object.keys(expected).filter(k=>!controls[k].value);
    const errors = Object.keys(expected).filter(k=>controls[k].value && controls[k].value!==expected[k]);
    return {correct:!missing.length&&!errors.length,missing,errors};
  };
  const refreshFigure = () => {
    svg.querySelectorAll(".geometry-value").forEach(node=>node.remove());
    const locations={vertical:[30,125],horizontal:[166,216],diagonal:[185,99],angle:[280,181]};
    for(const key of ["vertical","horizontal","diagonal","angle"]){
      if(!controls[key].value) continue;
      const el=document.createElementNS(svg.namespaceURI,"text");
      el.setAttribute("class","geometry-value");
      el.setAttribute("x",locations[key][0]); el.setAttribute("y",locations[key][1]);
      el.setAttribute("font-size","18"); el.setAttribute("font-weight","bold"); el.setAttribute("fill","#145ea8");
      el.textContent=key==="angle"?"θ":controls[key].value;
      svg.append(el);
    }
  };
  for(const select of Object.values(controls)) select.addEventListener("change",()=>{refreshFigure();feedback.textContent="Alterações registradas. Clique em Corrigir desenho.";onChange();});
  verify.addEventListener("click",()=>{
    const {correct,missing,errors}=validate();
    if(correct) feedback.textContent="Correto: lados, ângulo e razões trigonométricas conferem. Você pode prosseguir.";
    else feedback.textContent=(missing.length?"Preencha os "+missing.length+" campos restantes. ":"")+(errors.length?"Há "+errors.length+" resposta(s) incorreta(s). Revise os lados, o ângulo e as razões.":"");
    onChange();
  });
  root.append(instructions,svg,fields,verify,feedback);
  host.append(root);refreshFigure();
  return {getValue,validate};
}
