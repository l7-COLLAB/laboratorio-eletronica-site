"use strict";

const get = (id) => document.getElementById(id);
const reviewedKey = "laboratorio-eletronica:revisados:v1";
const catalogKey = "laboratorio-eletronica:projetos:v1";

function readLocal(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function link(label, url) {
  const anchor = element("a", label);
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  return anchor;
}

function updateOptions(select, entries, label) {
  const previous = select.value;
  const options = [...new Set(entries.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  select.replaceChildren(new Option(label, ""), ...options.map(value => new Option(value, value)));
  select.value = options.includes(previous) ? previous : "";
}

function setCards(container, cards, message) {
  container.replaceChildren(...(cards.length ? cards : [element("p", message, "empty")]));
}

const moduleIds = new Set(catalogo.modules.map(module => module.id));
const savedReview = readLocal(reviewedKey, []);
const reviewed = new Set(Array.isArray(savedReview) ? savedReview.filter(id => moduleIds.has(id)) : []);
const storedProjects = readLocal(catalogKey, null);
let projects = Array.isArray(storedProjects) ? storedProjects : catalogo.projects;

function setModuleLink(anchor, id) {
  const module = catalogo.modules.find(item => item.id === id);
  if (module?.url) {
    anchor.href = module.url;
    anchor.target = "_blank";
    anchor.rel = "noopener";
  } else {
    anchor.href = "#trilha";
    anchor.dataset.studyStage = id;
  }
  return anchor;
}

if (catalogo.notion) {
  get("plano").href = catalogo.notion.master;
  get("apostila").href = catalogo.notion.index;
  get("gabarito").href = catalogo.notion.answers;
  get("base").href = catalogo.notion.projects;
}

function updateProgress() {
  get("progresso").textContent = reviewed.size + " de " + moduleIds.size + " revisados";
  get("barra").max = moduleIds.size;
  get("barra").value = reviewed.size;
}

function moduleCard(module) {
  const card = element("article", "", "card");
  const links = element("div", "", "links");
  links.append(setModuleLink(element("a", module.url ? "Estudar no Notion ↗" : "Ver na trilha ↓"), module.id));
  const label = element("label", "", "check");
  const checkbox = element("input");
  checkbox.type = "checkbox";
  checkbox.checked = reviewed.has(module.id);
  checkbox.setAttribute("aria-label", "Marcar " + module.id + " como revisado");
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) reviewed.add(module.id);
    else reviewed.delete(module.id);
    if (!saveLocal(reviewedKey, [...reviewed])) {
      document.querySelector(".progress small").textContent = "Marcações disponíveis durante esta sessão.";
    }
    updateProgress();
  });
  label.append(checkbox, "Marcar como revisado");
  card.append(element("p", module.id + " / " + module.category, "meta"),
    element("h3", module.name), element("p", module.summary), links, label);
  return card;
}

const normalize = (text) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function renderModules() {
  const query = normalize(get("buscar").value.trim());
  const category = get("modulo-categoria").value;
  const matches = catalogo.modules.filter(module =>
    (!category || module.category === category) &&
    normalize([module.id, module.name, module.summary, module.category].join(" ")).includes(query));
  setCards(get("modulos"), matches.map(moduleCard), "Nenhum módulo corresponde à busca.");
}

function projectCard(project) {
  const card = element("article", "", "card");
  const details = element("details");
  const steps = element("ol");
  for (const step of project.steps) steps.append(element("li", step));
  details.append(element("summary", "Etapas e entrega"));
  if (project.steps.length) details.append(steps);
  if (project.deliverable) details.append(element("p", "Entrega · " + project.deliverable));
  const links = element("div", "", "links");
  if (project.reference) links.append(link("Material de apoio ↗", project.reference));
  if (project.moduleId) links.append(setModuleLink(element("a", "Módulo de apoio ↓"), project.moduleId));
  if (catalogo.notion) {
    links.append(link(project.url ? "Abrir projeto no Notion ↗" : "Ver base no Notion ↗",
      project.url || catalogo.notion.projects));
  }
  card.append(element("p", project.category + " / " + project.status, "meta"),
    element("h3", project.title), element("p", project.goal), details, links);
  return card;
}

function renderProjects() {
  const category = get("projeto-categoria").value;
  const status = get("projeto-estado").value;
  const matches = projects.filter(project =>
    (!category || project.category === category) && (!status || project.status === status));
  setCards(get("lista-projetos"), matches.map(projectCard), "Nenhum projeto nesta seleção.");
}

function updateProjectFilters() {
  updateOptions(get("projeto-categoria"), projects.map(project => project.category), "Todas");
  updateOptions(get("projeto-estado"), projects.map(project => project.status), "Todos");
  renderProjects();
}

function parseCSV(source) {
  const text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  let closed = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text[index + 1] === '"') {
        cell += '"';
        index++;
      } else {
        quoted = false;
        closed = true;
      }
    } else if (char === "," || char === "\n") {
      row.push(cell);
      cell = "";
      closed = false;
      if (char === "\n") {
        if (row.some(value => value.trim())) rows.push(row);
        row = [];
      }
    } else if (char === '"' && !cell && !closed) {
      quoted = true;
    } else if (char === '"' || closed) {
      throw new Error("Arquivo CSV com aspas fora do padrão.");
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("Arquivo CSV com aspas incompletas.");
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function safeURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function importProjects(text) {
  const [header, ...rows] = parseCSV(text);
  const fields = ["Projeto", "Categoria", "Estado", "Ordem", "Referência", "Objetivo", "Etapas", "Entrega"];
  const columns = fields.map(field => header?.findIndex(value => value.trim() === field) ?? -1);
  if (columns.includes(-1)) throw new Error("Exporte a base Laboratório de Eletrônica com as oito propriedades visíveis.");
  return rows.map((row, index) => {
    const [title, category, status, position, reference, goal, steps, deliverable] =
      columns.map(column => row[column]?.trim() ?? "");
    if (row.length !== header.length || !title) {
      throw new Error("Confira as colunas e o nome do projeto no registro " + (index + 1) + ".");
    }
    const original = catalogo.projects.find(project => project.title === title);
    return {
      title, goal, deliverable,
      category: category || "Sem categoria",
      status: status || "A fazer",
      order: position && Number.isFinite(Number(position)) ? Number(position) : Infinity,
      reference: safeURL(reference),
      steps: steps.split("\n").map(step => step.trim()).filter(Boolean),
      url: original?.url,
    };
  }).sort((first, second) => first.order - second.order);
}

get("csv")?.addEventListener("change", async (event) => {
  const file = event.currentTarget.files[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error("Use um arquivo CSV de até 2 MB.");
    const imported = importProjects(await file.text());
    projects = imported;
    updateProjectFilters();
    get("importacao").textContent = imported.length + " projetos importados. " +
      (saveLocal(catalogKey, imported) ? "Catálogo salvo neste navegador." : "Catálogo disponível durante esta sessão.");
  } catch (error) {
    get("importacao").textContent = error.message;
  } finally {
    get("csv").value = "";
  }
});
get("restaurar")?.addEventListener("click", () => {
  projects = catalogo.projects;
  updateProjectFilters();
  get("importacao").textContent = saveLocal(catalogKey, null)
    ? "Catálogo inicial restaurado."
    : "Catálogo inicial restaurado para esta sessão.";
});

function semesterCard(semester) {
  const card = element("details", "", "semester");
  const list = element("ol");
  for (const subject of semester.subjects) {
    const item = element("li");
    item.append(element("span", subject.id + " "), element("strong", subject.name),
      element("small", subject.summary + " · 60 h"));
    list.append(item);
  }
  card.append(element("summary", semester.number + "º semestre · " + semester.name), list,
    element("p", "Projeto integrador (40 h) · " + semester.project));
  return card;
}

get("buscar").addEventListener("input", renderModules);
get("modulo-categoria").addEventListener("change", renderModules);
get("projeto-categoria").addEventListener("change", renderProjects);
get("projeto-estado").addEventListener("change", renderProjects);
updateOptions(get("modulo-categoria"), catalogo.modules.map(module => module.category), "Todas");
get("semestres").append(...catalogo.semesters.map(semesterCard));
updateProgress();
renderModules();
updateProjectFilters();

const views = [...document.querySelectorAll("[data-view]")];
const menu = [...document.querySelectorAll(".menu a")];

function showView(fragment) {
  const id = fragment === "nivelamento" ? "etapas"
    : views.some(view => view.id === fragment) ? fragment : "trilha";
  for (const view of views) view.hidden = view.id !== id;
  for (const item of menu) {
    if (item.hash === "#" + id) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  }
  if (fragment === "nivelamento") get("nivelamento").open = true;
}

function goToView(id) {
  if (location.hash !== "#" + id) history.pushState(null, "", "#" + id);
  showView(id);
}

for (const item of document.querySelectorAll(".menu a, .brand")) {
  item.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const id = item.hash.slice(1);
    goToView(id);
    window.scrollTo(0, 0);
    get(id).querySelector("h1").focus({ preventScroll: true });
  });
}

window.addEventListener("hashchange", () => showView(location.hash.slice(1)));
for (const view of views) view.querySelector("h1").tabIndex = -1;
showView(location.hash.slice(1));
