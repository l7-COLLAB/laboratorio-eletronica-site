"use strict";

(() => {
  // The MathLive library loads only when a learner opens the editor.
  const mathLiveURL = "https://cdn.jsdelivr.net/npm/mathlive@0.111.4/mathlive.min.js";
  let libraryPromise;
  function loadMathLive() {
    if (customElements.get("math-field")) return Promise.resolve();
    if (!libraryPromise) {
      libraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = mathLiveURL;
        script.async = true;
        let settled = false;
        const timer = setTimeout(() => finish(new Error("Library load timeout")), 16000);
        function finish(error) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (error) reject(error);
          else resolve();
        }
        script.onerror = () => finish(new Error("Math editor unavailable"));
        script.onload = () => customElements.whenDefined("math-field").then(() => finish(), finish);
        document.head.append(script);
      }).catch(error => { libraryPromise = null; throw error; });
    }
    return libraryPromise;
  }
  const keys = [
    { label: "a⁄b", latex: "\\frac{#?}{#?}", title: "Fração com numerador e denominador" },
    { label: "x²", latex: "^{2}", title: "Elevar ao quadrado" },
    { label: "x³", latex: "^{3}", title: "Elevar ao cubo" },
    { label: "xⁿ", latex: "^{#?}", title: "Expoente personalizado" },
    { label: "xᵃ⁄ᵇ", latex: "^{\\frac{#?}{#?}}", title: "Expoente fracionário" },
    { label: "√", latex: "\\sqrt{#?}", title: "Raiz quadrada" },
    { label: "ⁿ√", latex: "\\sqrt[#?]{#?}", title: "Raiz de índice personalizado" },
    { label: "(", latex: "(" }, { label: ")", latex: ")" },
    { label: "=", latex: "=" }, { label: "+", latex: "+" },
    { label: "−", latex: "-" }, { label: "×", latex: "\\times" },
    { label: "÷", latex: "\\div" }, { label: "±", latex: "\\pm" },
    { label: "π", latex: "\\pi" }, { label: "θ", latex: "\\theta" },
    { label: "Ω", latex: "\\Omega", title: "Ohm" }, { label: "µ", latex: "\\mu" },
    { label: "∞", latex: "\\infty" },
    { label: "sin", latex: "\\sin\\left(#?\\right)", title: "Seno" },
    { label: "cos", latex: "\\cos\\left(#?\\right)", title: "Cosseno" },
    { label: "tan", latex: "\\tan\\left(#?\\right)", title: "Tangente" },
    { label: "log", latex: "\\log\\left(#?\\right)", title: "Logaritmo" },
    { label: "ln", latex: "\\ln\\left(#?\\right)", title: "Logaritmo natural" },
    ...["0","1","2","3","4","5","6","7","8","9"].map(n => ({label:n, latex:n})),
    { label: ",", latex: "{,}", title: "Vírgula decimal" },
    { label: ".", latex: "." }, { label: "x", latex: "x" },
    { label: "y", latex: "y" }, { label: "t", latex: "t" },
    { label: "V", latex: "V" }, { label: "I", latex: "I" },
    { label: "R", latex: "R" },
    { label: "←", command: "move-to-previous-char", title: "Mover cursor para esquerda" },
    { label: "→", command: "move-to-next-char", title: "Mover cursor para direita" },
    { label: "↑", command: "move-up", title: "Subir na expressão" },
    { label: "↓", command: "move-down", title: "Descer na expressão" },
    { label: "⌫", command: "delete-backward", title: "Apagar último elemento" },
    { label: "Limpar", command: "clear-all", title: "Apagar a expressão inteira" }
  ];
  function createMathEditor(host, { initialLatex = "", onChange = () => {} } = {}) {
    let latex = initialLatex;
    let field = null;
    let keyboard = null;
    let loading = false;
    host.dataset.mathEditor = "true";
    host.dataset.latex = latex;
    const title = document.createElement("p");
    title.className = "math-editor-label";
    title.textContent = "Expressão matemática (opcional)";
    const help = document.createElement("p");
    help.className = "math-editor-help";
    help.textContent = "Digite cálculos com frações, potências e raízes. Para explicar seu raciocínio, use o campo de texto acima.";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "button math-editor-open";
    toggle.textContent = latex ? "Editar expressão matemática" : "Toque para responder com matemática";
    const status = document.createElement("p");
    status.className = "math-editor-status";
    status.setAttribute("role", "status");
    const content = document.createElement("div");
    content.className = "math-editor-content";
    content.hidden = true;
    if (latex) status.textContent = "Expressão salva. Abra para visualizar e editar.";
    host.append(title, help, toggle, content, status);
    function record() {
      if (!field) return;
      const next = field.value || "";
      if (next.length > MathPractice.MAX_LATEX) {
        field.setValue(latex);
        status.textContent = "Limite de 800 caracteres. Remova elementos antes de continuar.";
        return;
      }
      latex = next;
      host.dataset.latex = latex;
      status.textContent = "Expressão salva nesta atividade.";
      onChange();
    }
    function buildKeyboard() {
      keyboard = document.createElement("div");
      keyboard.className = "math-editor-keys";
      keyboard.setAttribute("role", "group");
      keyboard.setAttribute("aria-label", "Teclado matemático");
      for (const key of keys) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "math-editor-key";
        button.textContent = key.label;
        button.setAttribute("aria-label", key.title || ("Inserir " + key.label));
        button.addEventListener("mousedown", event => event.preventDefault());
        button.addEventListener("click", () => {
          field.focus({ preventScroll: true });
          if (key.command === "clear-all") {
            field.executeCommand("select-all");
            field.executeCommand("delete-backward");
          } else if (key.command) {
            field.executeCommand(key.command);
          } else {
            field.insert(key.latex, { format: "latex", selectionMode: "placeholder" });
          }
          record();
        });
        keyboard.append(button);
      }
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "button primary math-editor-confirm";
      confirm.textContent = "Confirmar expressão";
      confirm.addEventListener("click", () => {
        if (field.value.includes("\\placeholder")) {
          status.textContent = "Preencha todos os campos da expressão antes de confirmar.";
          field.focus({ preventScroll: true });
          return;
        }
        record();
        keyboard.hidden = true;
        field.readOnly = true;
        toggle.textContent = "Editar expressão matemática";
        status.textContent = "Expressão confirmada. Use Editar para alterar.";
        toggle.focus();
      });
      keyboard.append(confirm);
    }
    async function open() {
      if (loading) return;
      if (field) {
        field.readOnly = false;
        keyboard.hidden = false;
        content.hidden = false;
        toggle.textContent = "Teclado matemático aberto";
        field.focus({ preventScroll: true });
        return;
      }
      loading = true;
      toggle.disabled = true;
      status.textContent = "Carregando o editor matemático…";
      try {
        await loadMathLive();
        if (!host.isConnected) return;
        field = document.createElement("math-field");
        field.className = "math-editor-field";
        field.setAttribute("aria-label", "Sua expressão matemática");
        field.setAttribute("math-virtual-keyboard-policy", "manual");
        content.append(field);
        buildKeyboard();
        content.append(keyboard);
        field.value = latex;
        field.addEventListener("input", record);
        content.hidden = false;
        toggle.textContent = "Teclado matemático aberto";
        status.textContent = "Use os botões e as setas para editar numeradores, denominadores e expoentes.";
        field.focus({ preventScroll: true });
      } catch (error) {
        status.textContent = "Editor indisponível. Use o campo de texto acima; sua atividade continua acessível.";
      } finally {
        loading = false;
        toggle.disabled = false;
      }
    }
    toggle.addEventListener("click", open);
    // On touch devices, tapping the mathematical answer area opens the keypad
    // without requiring the student to find the separate toggle button.
    host.addEventListener("click", event => {
      if (event.target === host || event.target === title || event.target === help) {
        if (content.hidden) open();
      }
    });
    return { open, getValue() { return field ? field.value : latex; } };
  }
  window.createMathEditor = createMathEditor;
})();
