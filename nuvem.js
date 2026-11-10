"use strict";

window.cloudSync = (() => {
  const endpoint = "https://laboratorio-eletronica-sync.l7526080.workers.dev";
  const prefix = "laboratorio-eletronica:";
  let setupTicket = new URLSearchParams(location.hash.slice(1)).get("configurar");
  if (setupTicket) window.history.replaceState(null, "", "#nuvem");
  const authKey = prefix + "nuvem:codigo:v1";
  const metaKey = prefix + "nuvem:estado:v1";
  const supported = new Set([
    prefix + "trilha:v1",
    prefix + "revisados:v1",
    ...noteCategories.map(noteKey),
  ]);
  let token = "";
  let state = {base: {}, seen: {}, pending: {}, conflicts: {}};
  let busy = false;
  let timer;
  let retryTimer;
  let persisted = true;
  try {
    token = localStorage.getItem(authKey) ?? "";
    const stored = JSON.parse(localStorage.getItem(metaKey));
    if (stored && typeof stored === "object") state = {
      base: stored.base ?? {},
      seen: stored.seen ?? {},
      pending: stored.pending ?? {},
      conflicts: stored.conflicts ?? {},
    };
  } catch {
    persisted = false;
  }

  function storeState() {
    try {
      localStorage.setItem(metaKey, JSON.stringify(state));
      persisted = true;
    } catch {
      persisted = false;
    }
  }

  function status(text) {
    const label = get("nuvem-status");
    if (label) label.textContent = text;
    const indicator = get("nuvem-indicador");
    if (indicator) indicator.textContent = token ? text : "Entrar para salvar na nuvem";
  }

  function idleStatus() {
    const conflicts = Object.keys(state.conflicts).length;
    const count = Object.keys(state.pending).length;
    if (!token) return status("Entre com seu usuário e senha para salvar os estudos na nuvem.");
    if (conflicts) return status("Há edições diferentes para conferir antes de sincronizar.");
    if (count) return status("Alterações salvas neste aparelho, aguardando envio.");
    status(persisted ? "Tudo sincronizado com a nuvem." : "Salvo na nuvem. Entre novamente se este navegador perder o acesso.");
  }

  function labelFor(key) {
    if (key === prefix + "trilha:v1") return "Avanço na trilha e resultados dos quizzes";
    if (key === prefix + "revisados:v1") return "Marcações de revisão";
    return decodeURIComponent(key.slice((prefix + "anotacoes:v1:").length));
  }

  function publishChanges(keys) {
    if (keys.length) window.dispatchEvent(new CustomEvent("cloud:applied", {detail: {keys}}));
  }

  function applyValue(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      status("Não foi possível recuperar os dados neste navegador. Libere espaço ou use outro navegador.");
      return false;
    }
  }

  function queue(key, value) {
    if (!supported.has(key) || typeof value !== "string") return;
    try {
      const latest = JSON.parse(localStorage.getItem(metaKey));
      if (latest) state = {...latest, seen: latest.seen ?? {}};
    } catch {}
    state.seen ??= {};
    const old = state.pending[key];
    state.pending[key] = {value, revision: old?.revision ?? state.base[key] ?? 0, id: crypto.randomUUID()};
    storeState();
    idleStatus();
    clearTimeout(timer);
    timer = setTimeout(sync, 900);
  }

  async function request(path, options = {}, code = token) {
    const response = await fetch(endpoint + path, {
      ...options,
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers: {Authorization: "Bearer " + code, ...options.headers},
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (response.status === 401) {
      if (code === token && !path.startsWith("/auth/")) {
        token = "";
        try { localStorage.removeItem(authKey); } catch {}
        updateConnectionUI();
      }
      const error = new Error(result.error || "Entre novamente para conectar este aparelho.");
      error.status = 401;
      throw error;
    }
    if (response.status === 409) return {conflict: true, ...result};
    if (!response.ok) {
      const error = new Error(result.error || "A nuvem não respondeu. Tentaremos novamente.");
      error.status = response.status;
      throw error;
    }
    return result;
  }

  function acceptRemote(entry, keys) {
    if (!applyValue(entry.key, entry.value)) {
      const error = new Error("Não foi possível recuperar os dados neste navegador. Libere espaço ou use outro navegador.");
      error.status = 507;
      throw error;
    }
    state.base[entry.key] = entry.revision;
    state.seen[entry.key] = entry.value;
    keys.push(entry.key);
  }

  async function pull() {
    const {entries} = await request("/state");
    const remote = new Map(entries.map(entry => [entry.key, entry]));
    const keys = [];
    for (const key of supported) {
      const entry = remote.get(key);
      let pending = state.pending[key];
      const localValue = localStorage.getItem(key);
      if (!pending && state.seen[key] !== undefined && localValue !== null && localValue !== state.seen[key]) {
        pending = state.pending[key] = {value: localValue, revision: state.base[key] ?? 0, id: crypto.randomUUID()};
      }
      if (pending) {
        if (entry?.value === pending.value) {
          delete state.pending[key];
          delete state.conflicts[key];
          state.base[key] = entry.revision;
          state.seen[key] = entry.value;
        } else if ((entry?.revision ?? 0) !== pending.revision) {
          state.conflicts[key] = entry ?? {key, value: "", revision: 0};
        }
        continue;
      }
      const local = localStorage.getItem(key);
      if (!entry) {
        if (local !== null) state.pending[key] = {value: local, revision: 0, id: crypto.randomUUID()};
        continue;
      }
      if (local === entry.value) {
        state.base[key] = entry.revision;
        state.seen[key] = entry.value;
      } else if (local !== null && state.base[key] === undefined &&
                 local !== "" && local !== "[]") {
        state.pending[key] = {value: local, revision: 0, id: crypto.randomUUID()};
        state.conflicts[key] = entry;
      } else {
        acceptRemote(entry, keys);
      }
    }
    storeState();
    publishChanges(keys);
  }

  async function push(key, pending) {
    const response = await request("/state", {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({key, value: pending.value, revision: pending.revision}),
    });
    let currentPending = state.pending[key];
    const localValue = localStorage.getItem(key);
    if (persisted && localValue !== null && localValue !== pending.value) {
      currentPending = state.pending[key] = {value: localValue, revision: pending.revision, id: crypto.randomUUID()};
    }
    if (response.conflict) {
      if (response.current?.value === pending.value) {
        if (currentPending?.id === pending.id) delete state.pending[key];
        else if (currentPending) currentPending.revision = response.current.revision;
        state.base[key] = response.current.revision;
        state.seen[key] = response.current.value;
      } else {
        state.conflicts[key] = response.current ?? {key, value: "", revision: 0};
      }
    } else {
      state.base[key] = response.entry.revision;
      state.seen[key] = response.entry.value;
      if (currentPending?.id === pending.id) delete state.pending[key];
      else if (currentPending) currentPending.revision = response.entry.revision;
    }
    storeState();
  }

  async function sync() {
    if (!token || busy) return;
    clearTimeout(retryTimer);
    busy = true;
    status("Sincronizando…");
    try {
      await pull();
      for (const [key, pending] of Object.entries(state.pending)) {
        if (!state.conflicts[key]) await push(key, pending);
      }
      renderConflicts();
      idleStatus();
      if (Object.keys(state.pending).some(key => !state.conflicts[key])) {
        retryTimer = setTimeout(sync, 1500);
      }
    } catch (error) {
      const permanent = [400, 401, 403, 413, 429, 507].includes(error.status);
      status(permanent ? error.message :
        "Sem conexão com a nuvem. Seus dados continuam neste aparelho e serão reenviados.");
      if (!permanent) retryTimer = setTimeout(sync, 20000);
    } finally {
      busy = false;
    }
  }

  function renderConflicts() {
    const container = get("nuvem-conflitos");
    if (!container) return;
    container.replaceChildren(...Object.entries(state.conflicts).map(([key, remote]) => {
      const section = element("section", "", "cloud-conflict");
      const local = state.pending[key]?.value ?? localStorage.getItem(key) ?? "";
      section.append(element("h3", labelFor(key)),
        element("p", "Este aparelho e a nuvem têm versões diferentes. Escolha qual continuar usando."));
      for (const [title, text] of [["Neste aparelho", local], ["Na nuvem", remote.value]]) {
        const details = element("details");
        const field = element("textarea");
        field.value = text;
        field.readOnly = true;
        details.append(element("summary", title), field);
        section.append(details);
      }
      function resolve(useLocal) {
        if (busy) return;
        state.base[key] = remote.revision;
        state.seen[key] = remote.value;
        if (useLocal) {
          state.pending[key] = {value: localStorage.getItem(key) ?? local,
            revision: remote.revision, id: crypto.randomUUID()};
        } else if (applyValue(key, remote.value)) {
          delete state.pending[key];
          publishChanges([key]);
        } else {
          return;
        }
        delete state.conflicts[key];
        storeState();
        renderConflicts();
        sync();
      }
      const remoteButton = element("button", "Usar a versão da nuvem", "button");
      remoteButton.type = "button";
      remoteButton.addEventListener("click", () => resolve(false));
      const localButton = element("button", "Manter minha edição", "button");
      localButton.type = "button";
      localButton.addEventListener("click", () => resolve(true));
      section.append(remoteButton, localButton);
      return section;
    }));
  }

  function updateConnectionUI() {
    get("nuvem-conectado").hidden = !token;
    get("nuvem-acesso").hidden = Boolean(token) && !setupTicket;
    get("nuvem-criar").hidden = !setupTicket;
    get("nuvem-login").hidden = Boolean(setupTicket);
    get("nuvem-recuperar").hidden = Boolean(setupTicket);
  }

  async function adoptSession(value) {
    token = value;
    try {
      localStorage.setItem(authKey, value);
    } catch {
      persisted = false;
    }
    get("nuvem-acesso").hidden = true;
    get("nuvem-conectado").hidden = false;
    await sync();
  }

  async function connect(event) {
    event.preventDefault();
    const field = get("nuvem-codigo");
    const code = field.value.trim();
    if (!/^[A-Za-z0-9_-]{43}$/.test(code)) return status("Cole o código de recuperação completo.");
    const button = get("nuvem-conectar");
    button.disabled = true;
    try {
      await request("/state", {}, code);
      field.value = "";
      await adoptSession(code);
    } catch (error) {
      status(error.message);
    } finally {
      button.disabled = false;
    }
  }

  async function passwordSignIn(event) {
    event.preventDefault();
    const creating = event.currentTarget.id === "nuvem-criar";
    const form = event.currentTarget;
    const username = form.querySelector('[name="username"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    if (creating && password !== form.querySelector('[name="confirm"]').value) {
      return status("As duas senhas precisam ser iguais.");
    }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status(creating ? "Criando seu acesso…" : "Entrando…");
    try {
      const result = await request(creating ? "/auth/setup" : "/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password, ...(creating ? {ticket: setupTicket} : {})}),
      });
      form.reset();
      if (creating) setupTicket = null;
      await adoptSession(result.token);
    } catch (error) {
      status(error.message);
      if (creating && [403, 409].includes(error.status)) {
        get("nuvem-login").hidden = false;
        get("nuvem-recuperar").hidden = false;
        get("nuvem-criar").hidden = true;
      }
    } finally {
      submit.disabled = false;
    }
  }

  async function signOut() {
    await sync();
    if (Object.keys(state.pending).length) return status("Conclua a sincronização das alterações antes de sair.");
    try {
      await request("/auth/logout", {method: "POST"});
      token = "";
      localStorage.removeItem(authKey);
      get("nuvem-acesso").hidden = false;
      get("nuvem-criar").hidden = true;
      get("nuvem-login").hidden = false;
      get("nuvem-recuperar").hidden = false;
      get("nuvem-conectado").hidden = true;
      idleStatus();
    } catch (error) {
      status(error.message);
    }
  }

  async function history() {
    if (!token) return status("Conecte este aparelho antes de consultar o histórico.");
    const key = get("nuvem-historico-categoria").value;
    const list = get("nuvem-historico-lista");
    list.textContent = "Carregando…";
    try {
      const {versions} = await request("/history?key=" + encodeURIComponent(key));
      list.replaceChildren(...versions.map(version => {
        const item = element("details", "", "cloud-version");
        const field = element("textarea");
        field.value = version.value;
        field.readOnly = true;
        item.append(element("summary", new Date(version.updated_at).toLocaleString("pt-BR")),
          field);
        const restore = element("button", "Recuperar esta versão", "button");
        restore.type = "button";
        restore.addEventListener("click", () => {
          if (busy) return status("Aguarde a sincronização em andamento.");
          if (applyValue(key, version.value)) {
            queue(key, version.value);
            publishChanges([key]);
            status("Versão recuperada neste aparelho. Enviando para a nuvem…");
            sync();
          }
        });
        item.append(restore);
        return item;
      }));
      if (!versions.length) list.textContent = "Ainda não há versões anteriores desta categoria.";
    } catch (error) {
      list.textContent = error.message;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    get("nuvem-formulario").addEventListener("submit", connect);
    get("nuvem-sincronizar").addEventListener("click", sync);
    get("nuvem-login").addEventListener("submit", passwordSignIn);
    get("nuvem-criar").addEventListener("submit", passwordSignIn);
    get("nuvem-sair").addEventListener("click", signOut);
    get("nuvem-historico-categoria").append(...noteCategories.map(category =>
      new Option(category, noteKey(category))));
    get("nuvem-historico-abrir").addEventListener("click", history);
    updateConnectionUI();
    renderConflicts();
    if (token) sync();
    else idleStatus();
  });
  window.addEventListener("hashchange", () => {
    const invitation = new URLSearchParams(location.hash.slice(1)).get("configurar");
    if (!invitation) return;
    setupTicket = invitation;
    window.history.replaceState(null, "", "#nuvem");
    showView("nuvem");
    updateConnectionUI();
    status("Escolha seu nome de usuário e sua senha para conectar este aparelho.");
  });
  window.addEventListener("online", sync);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") sync();
  });
  window.addEventListener("storage", event => {
    if (event.key === authKey) {
      token = event.newValue || "";
      updateConnectionUI();
      if (token) sync();
      else idleStatus();
    }
    if (supported.has(event.key)) {
      try {
        const latest = JSON.parse(localStorage.getItem(metaKey));
        if (latest) state = {...latest, seen: latest.seen ?? {}};
      } catch {}
      sync();
    }
  });
  return {queue, sync};
})();
