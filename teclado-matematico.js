"use strict";

(() => {
  // A mathfield uses MathLive's phone-friendly virtual keyboard, not the
  // operating system's text keyboard. The text explanation remains optional.
  const mathLiveURL = "https://cdn.jsdelivr.net/npm/mathlive@0.111.4/mathlive.min.js";
  let libraryPromise;

  function loadMathLive() {
    if (customElements.get("math-field")) return Promise.resolve();
    if (libraryPromise) return libraryPromise;
    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = mathLiveURL;
      script.async = true;
      const timer = setTimeout(() => fail(new Error("MathLive timeout")), 18000);
      let finished = false;
      function finish(error) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve();
      }
      function fail(error) { finish(error); }
      script.onerror = () => fail(new Error("MathLive could not be loaded"));
      script.onload = () => customElements.whenDefined("math-field").then(() => finish(), fail);
      document.head.append(script);
    }).catch(error => {
      libraryPromise = null;
      throw error;
    });
    return libraryPromise;
  }

  function isTouchDevice() {
    return (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches) ||
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
  }

  const shortcuts = [
    {label: "a⁄b", latex: "\\frac{#?}{#?}", hint: "Inserir fração"},
    {label: "xⁿ", latex: "^{#?}", hint: "Inserir potência"},
    {label: "xᵃ⁄ᵇ", latex: "^{\\frac{#?}{#?}}", hint: "Inserir expoente fracionário"},
    {label: "√", latex: "\\sqrt{#?}", hint: "Inserir raiz quadrada"},
    {label: "ⁿ√", latex: "\\sqrt[#?]{#?}", hint: "Inserir raiz com índice"},
    {label: "π", latex: "\\pi", hint: "Inserir pi"}
  ];

  function createMathEditor(host, { initialLatex = "", onChange = () => {} } = {}) {
    let latex = typeof initialLatex === "string" ? initialLatex : "";
    let field = null;
    let requestedFocus = false;
    let readyPromise = null;
    let opened = false;

    host.dataset.mathEditor = "true";
    host.dataset.latex = latex;

    const title = document.createElement("p");
    title.className = "math-editor-label";
    title.textContent = "Sua resposta em matemática";

    const help = document.createElement("p");
    help.className = "math-editor-help";
    help.textContent = "Toque no campo de cálculo: o teclado matemático aparece no celular. Use frações, potências, raízes e símbolos; escreva explicações no campo abaixo.";

    const placeholder = document.createElement("button");
    placeholder.type = "button";
    placeholder.className = "math-editor-placeholder";
    placeholder.textContent = "Preparando campo de cálculo…";
    placeholder.setAttribute("aria-label", "Abrir campo de cálculo matemático");

    const content = document.createElement("div");
    content.className = "math-editor-content";
    content.hidden = true;

    const status = document.createElement("p");
    status.className = "math-editor-status";
    status.setAttribute("role", "status");
    status.textContent = "Carregando o teclado matemático…";

    host.append(title, help, placeholder, content, status);

    function mathKeyboard() { return window.mathVirtualKeyboard; }

    function showKeyboard() {
      if (!field || !isTouchDevice()) return;
      const keyboard = mathKeyboard();
      if (!keyboard) return;
      try {
        keyboard.layouts = ["numeric", "symbols", "alphabetic", "greek"];
        keyboard.show();
      } catch {
        // MathLive still handles the keyboard automatically on mobile.
      }
    }

    function hideKeyboard() {
      try { mathKeyboard()?.hide(); } catch {}
    }

    function record() {
      if (!field) return;
      const next = field.value || "";
      if (next.length > MathPractice.MAX_LATEX) {
        field.setValue(latex);
        status.textContent = "A expressão atingiu o limite de 800 caracteres.";
        return;
      }
      latex = next;
      host.dataset.latex = latex;
      status.textContent = "Expressão salva nesta atividade.";
      onChange();
    }

    function createShortcutButtons() {
      const toolbar = document.createElement("div");
      toolbar.className = "math-editor-shortcuts";
      toolbar.setAttribute("role", "group");
      toolbar.setAttribute("aria-label", "Atalhos matemáticos");
      for (const shortcut of shortcuts) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "math-editor-shortcut";
        button.textContent = shortcut.label;
        button.setAttribute("aria-label", shortcut.hint);
        button.addEventListener("mousedown", event => event.preventDefault());
        button.addEventListener("click", () => {
          if (!field) return;
          field.focus({ preventScroll: true });
          field.insert(shortcut.latex, { format: "latex", selectionMode: "placeholder" });
          record();
          showKeyboard();
        });
        toolbar.append(button);
      }
      return toolbar;
    }

    function initializeField() {
      if (opened || !host.isConnected) return;
      opened = true;

      field = document.createElement("math-field");
      field.className = "math-editor-field";
      field.setAttribute("aria-label", "Digite sua expressão matemática");
      field.setAttribute("math-virtual-keyboard-policy", "auto");
      field.setAttribute("placeholder", "?");
      field.addEventListener("input", record);
      field.addEventListener("focusin", showKeyboard);

      const shortcutsRow = createShortcutButtons();
      const actions = document.createElement("div");
      actions.className = "math-editor-actions";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "button math-editor-show";
      toggle.textContent = "Mostrar teclado";
      toggle.addEventListener("click", () => {
        field.focus({ preventScroll: true });
        showKeyboard();
      });
      const done = document.createElement("button");
      done.type = "button";
      done.className = "button math-editor-done";
      done.textContent = "Concluir expressão";
      done.addEventListener("click", () => {
        record();
        hideKeyboard();
        field.blur();
        status.textContent = "Expressão registrada. Toque no campo para editar novamente.";
      });
      actions.append(toggle, done);

      content.append(field, shortcutsRow, actions);
      placeholder.replaceWith(content);
      content.hidden = false;
      field.value = latex;
      status.textContent = "Toque no campo para abrir o teclado matemático.";
      if (requestedFocus) {
        requestedFocus = false;
        field.focus({ preventScroll: true });
        showKeyboard();
      }
    }

    async function ensureReady() {
      if (readyPromise) return readyPromise;
      readyPromise = loadMathLive().then(initializeField).catch(() => {
        placeholder.disabled = false;
        placeholder.textContent = "Tentar carregar teclado matemático";
        status.textContent = "Sem conexão com o editor matemático. Você ainda pode responder no campo de texto.";
        readyPromise = null;
      });
      return readyPromise;
    }

    function open() {
      requestedFocus = true;
      if (field) {
        requestedFocus = false;
        field.focus({ preventScroll: true });
        showKeyboard();
      } else {
        ensureReady();
      }
    }

    placeholder.addEventListener("click", open);
    // Start loading as the exercise is rendered, so the first tap on a math
    // field is a direct touch event (important for iOS Safari).
    ensureReady();

    return {
      open,
      getValue() { return field ? field.value : latex; }
    };
  }

  window.createMathEditor = createMathEditor;
})();
