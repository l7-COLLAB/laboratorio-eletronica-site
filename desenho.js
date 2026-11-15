"use strict";
function createDrawingEditor(host, {initial = "", onChange = () => {}} = {}) {
  const wrapper = document.createElement("section");
  wrapper.className = "drawing-editor";
  wrapper.dataset.drawingEditor = "";
  const title = document.createElement("p");
  title.textContent = "Desenhe sua resposta (dedo, mouse ou caneta)";
  const canvas = document.createElement("canvas");
  canvas.width = 640; canvas.height = 360;
  canvas.setAttribute("aria-label", "Área de desenho da atividade");
  const controls = document.createElement("div");
  controls.className = "drawing-controls";
  const undo = document.createElement("button");
  undo.type = "button"; undo.textContent = "Desfazer traço";
  const clear = document.createElement("button");
  clear.type = "button"; clear.textContent = "Limpar desenho";
  controls.append(undo, clear);
  wrapper.append(title, canvas, controls);
  host.append(wrapper);
  const ctx = canvas.getContext("2d");
  let strokes = [];
  try {
    const parsed = JSON.parse(initial);
    if (Array.isArray(parsed)) strokes = parsed.filter(s => Array.isArray(s) && s.length > 1).slice(0, 100);
  } catch {}
  let active = null;
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5; ctx.strokeStyle = "#193b68"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const stroke of strokes) {
      ctx.beginPath();
      stroke.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      if (stroke.length === 1) ctx.lineTo(stroke[0][0] + .1, stroke[0][1] + .1);
      ctx.stroke();
    }
  };
  const getValue = () => strokes.length ? JSON.stringify(strokes) : "";
  const notify = () => { wrapper.dataset.drawing = getValue(); onChange(); };
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    return [Math.round((event.clientX - rect.left) * canvas.width / rect.width), Math.round((event.clientY - rect.top) * canvas.height / rect.height)];
  };
  canvas.addEventListener("pointerdown", e => {
    if (strokes.length >= 100) return;
    active = [point(e)]; strokes.push(active);
    canvas.setPointerCapture(e.pointerId); render(); notify();
  });
  canvas.addEventListener("pointermove", e => {
    if (!active || active.length >= 250) return;
    const p = point(e);
    if (Math.abs(p[0]-active[active.length-1][0]) + Math.abs(p[1]-active[active.length-1][1]) < 3) return;
    active.push(p);
    if (getValue().length > 15500) { active.pop(); return; }
    render(); notify();
  });
  const end = () => { active = null; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  undo.addEventListener("click", () => { strokes.pop(); render(); notify(); });
  clear.addEventListener("click", () => { if (!strokes.length || !confirm("Limpar o desenho desta atividade?")) return; strokes = []; render(); notify(); });
  render(); wrapper.dataset.drawing = getValue();
  return {getValue};
}
