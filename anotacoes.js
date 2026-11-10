"use strict";

const noteCategories = [...new Set([
  ...catalogo.modules.map(module => module.category),
  ...catalogo.projects.map(project => project.category),
])].sort((a, b) => a.localeCompare(b, "pt-BR"));

function stageCategory(id) {
  const module = catalogo.modules.find(item => item.id === id);
  if (module) return module.category;
  const number = Number(id.slice(1));
  if (number >= 9) return "Pesquisa e comunicação";
  if (number >= 5) return "Microeletrônica";
  if (number === 4) return "Física e medições";
  if (number >= 2) return "Circuitos e eletrônica";
  return "Matemática";
}

const noteDrafts = new Map();
const noteKey = category => "laboratorio-eletronica:anotacoes:v1:" + encodeURIComponent(category);

function readNote(category) {
  if (noteDrafts.has(category)) return noteDrafts.get(category);
  try {
    return localStorage.getItem(noteKey(category)) ?? "";
  } catch {
    return "";
  }
}

function syncNote(category, value, saved, source) {
  for (const editor of document.querySelectorAll(".note-editor")) {
    if (editor.dataset.category !== category) continue;
    const field = editor.querySelector("textarea");
    if (field !== source) field.value = value;
    editor.querySelector("[role=status]").textContent = saved
      ? "Salvo neste navegador."
      : "Não foi possível salvar. Mantenha esta página aberta e copie sua anotação.";
  }
}

function noteEditor(category) {
  const editor = element("details", "", "note-editor");
  editor.dataset.category = category;
  const summary = element("summary", "Bloco de notas · " + category);
  const label = element("label", "Suas anotações de " + category);
  const field = element("textarea");
  field.rows = 5;
  field.maxLength = 20000;
  field.value = readNote(category);
  field.placeholder = "Escreva suas dúvidas, cálculos ou o que aprendeu…";
  const status = element("p", "", "note-status");
  status.setAttribute("role", "status");
  field.addEventListener("input", () => {
    const value = field.value;
    let saved = false;
    try {
      localStorage.setItem(noteKey(category), value);
      noteDrafts.delete(category);
      saved = true;
    } catch {
      noteDrafts.set(category, value);
    }
    window.cloudSync?.queue(noteKey(category), value);
    syncNote(category, value, saved, field);
  });
  label.append(field);
  editor.append(summary, label, status);
  return editor;
}

window.addEventListener("storage", event => {
  for (const category of noteCategories) {
    if (event.key !== null && event.key !== noteKey(category)) continue;
    if (noteDrafts.has(category)) continue;
    syncNote(category, readNote(category), true);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const container = get("lista-anotacoes");
  container.replaceChildren(...noteCategories.map(category => {
    const editor = noteEditor(category);
    editor.open = Boolean(readNote(category).trim());
    return editor;
  }));
});

window.addEventListener("cloud:applied", event => {
  for (const category of noteCategories) {
    if (!event.detail.keys.includes(noteKey(category))) continue;
    noteDrafts.delete(category);
    syncNote(category, readNote(category), true);
  }
});
