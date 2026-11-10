"use strict";

(() => {
  const key = "laboratorio-eletronica:trilha:v1";
  const stored = readLocal(key, {});
  const progress = {
    passed: Array.isArray(stored.passed) ? stored.passed : [],
    reviews: stored.reviews ?? {},
    attempts: stored.attempts ?? {},
    minutes: [10, 15, 20].includes(stored.minutes) ? stored.minutes : 15,
    lastGoal: stored.lastGoal ?? null,
  };
  const firstOpen = () => {
    const index = etapas.findIndex(stage => !progress.passed.includes(stage.id));
    return index < 0 ? etapas.length : index;
  };
  let selected = Math.min(firstOpen(), etapas.length - 1);
  let attempt = 0;
  let durable = true;
  const reviewGaps = [1, 2, 4];

  function today() {
    const date = new Date();
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  }

  function stageTitle(stage) {
    if (stage.id.startsWith("M")) return catalogo.modules.find(module => module.id === stage.id).name;
    const semester = catalogo.semesters[Number(stage.id.slice(1)) - 1];
    return semester.number + "º semestre · " + semester.name;
  }

  function persist() {
    durable = saveLocal(key, progress);
    updateStatus();
  }

  function updateStatus() {
    const count = firstOpen();
    get("estado-trilha").textContent = count + " de " + etapas.length + " etapas concluídas na trilha. " +
      (durable ? "Progresso salvo neste navegador." : "O armazenamento está indisponível. Progresso válido nesta sessão.");
  }

  function pendingReviews() {
    return etapas.map(stage => ({ stage, record: progress.reviews[stage.id] }))
      .filter(item => item.record && item.record.round < reviewGaps.length)
      .sort((a, b) => a.record.due - b.record.due);
  }

  function updateGoal() {
    const next = etapas[firstOpen()];
    const review = pendingReviews().find(item => item.record.due <= today());
    const done = progress.lastGoal === today();
    get("meta-link").hidden = done || (!next && !review);
    if (done || (!next && !review)) {
      get("meta-dia").textContent = done ? "Meta de hoje concluída" : "Sem tarefas disponíveis hoje";
      get("meta-passos").textContent = done
        ? "Você pode continuar ou encerrar a sessão por hoje."
        : "Volte quando houver uma revisão programada.";
      return;
    }
    get("meta-link").href = review ? "#revisao" : "#atividade";
    if (review) {
      get("meta-dia").textContent = "Revisar de memória · " + review.stage.id;
      get("meta-passos").textContent = "Tente responder à primeira revisão disponível sem consultar a aula. Depois compare e registre o resultado.";
      return;
    }
    get("meta-dia").textContent = next.id + " · " + stageTitle(next);
    const minutes = progress.minutes;
    get("meta-passos").textContent = minutes === 10
      ? "3 min de teoria e exemplo, 4 min de prática e 3 min de quiz."
      : minutes === 15
        ? "5 min de teoria e exemplo, 6 min de prática e 4 min de quiz."
        : "6 min de teoria e exemplo, 8 min de prática e 6 min de quiz e correção.";
  }

  function switchStage(index) {
    if (index > firstOpen() || index >= etapas.length) return;
    selected = index;
    attempt = 0;
    renderOutline();
    renderActivity();
    get("atividade").querySelector("h2").focus();
  }

  function renderOutline() {
    const outline = get("mapa-trilha");
    const nodes = [];
    etapas.forEach((stage, index) => {
      if (index === 0) nodes.push(element("h3", "NIVELAMENTO"));
      if (stage.id === "S01") nodes.push(element("h3", "DESAFIOS DOS SEMESTRES"));
      const passed = index < firstOpen();
      const button = element("button", stage.id + " · " + stageTitle(stage), "stage-choice");
      button.type = "button";
      button.disabled = index > firstOpen();
      if (index === selected) button.setAttribute("aria-current", "step");
      button.append(element("small", passed ? "Concluída" : button.disabled ? "Bloqueada" : "Disponível"));
      button.addEventListener("click", () => switchStage(index));
      nodes.push(button);
    });
    outline.replaceChildren(...nodes);
  }

  function block(heading, copy) {
    const section = element("section", "", "study-block");
    section.append(element("h3", heading), element("p", copy));
    return section;
  }

  function action(label, primary = false) {
    const button = element("button", label, primary ? "button primary" : "button");
    button.type = "button";
    return button;
  }

  function answerKey(stage, answers, passed) {
    const details = element("details", "", "quiz-key");
    const heading = element("summary", "Ver gabarito comentado");
    heading.append(element("span", "", "quiz-score"));
    const score = answers?.filter((answer, index) => answer === stage.quiz[index][1]).length;
    if (answers) heading.querySelector(".quiz-score").textContent = " · " + score + "/" + stage.quiz.length;
    if (answers && score < stage.quiz.length) {
      details.append(heading, element("p", passed
        ? "Revise o raciocínio das questões que errou nesta tentativa."
        : "A próxima etapa será liberada quando você acertar as três questões."));
    } else {
      details.append(heading);
    }
    const items = stage.quiz.map(([prompt, correct, , , , explanation], index) => {
      const item = element("article", "", "quiz-answer");
      const chosen = answers?.[index];
      item.append(element("h4", (index + 1) + ". " + prompt));
      if (chosen) {
        const verdict = chosen === correct ? "Acertou" : "Errou";
        item.append(element("p", verdict + " · Você marcou: " + chosen, "quiz-verdict"));
      }
      item.append(element("p", "Resposta correta: " + correct),
        element("p", "Por que é a resposta correta: " + explanation));
      return item;
    });
    details.append(...items);
    return details;
  }

  function renderActivity() {
    const stage = etapas[selected];
    const alreadyPassed = selected < firstOpen();
    const title = element("h2", stage.id + " · " + stageTitle(stage));
    title.tabIndex = -1;
    const example = element("details");
    example.append(element("summary", "Ver exemplo resolvido"), element("p", stage.example));
    const theory = block("Entenda", stage.theory);
    theory.append(example);
    const practice = block("Pratique sem consulta", stage.task);
    const input = element("textarea");
    input.rows = 3;
    const label = element("label", "Sua resposta ou cálculo");
    label.append(input);
    const reveal = action("Comparar com a resolução");
    reveal.disabled = true;
    const resolution = element("p", stage.solution);
    resolution.hidden = true;
    const checked = element("input");
    checked.type = "checkbox";
    const checkLabel = element("label", "", "study-option");
    checkLabel.append(checked, "Comparei meu raciocínio com a resolução e corrigi o que faltava.");
    checkLabel.hidden = true;
    let graded = false;
    const quiz = element("form");
    quiz.hidden = true;
    const quizHeader = element("h3", "Quiz · três questões");
    const result = element("div", "", "study-feedback");
    const announcement = element("p");
    announcement.setAttribute("role", "status");
    const last = progress.attempts[stage.id];
    if (last || alreadyPassed) result.append(answerKey(stage, last, alreadyPassed));
    const submit = action("Corrigir respostas", true);
    submit.type = "submit";
    const onward = action("Abrir próxima etapa", true);
    onward.hidden = true;
    const status = element("p", alreadyPassed ? "ETAPA CONCLUÍDA" : "ETAPA DISPONÍVEL", "eyebrow");

    function questions() {
      const fields = stage.quiz.map(([prompt, correct, ...other], number) => {
        const field = element("fieldset");
        field.append(element("legend", (number + 1) + ". " + prompt));
        const options = [correct, ...other.slice(0, 3)];
        const offset = (selected + number * 3 + attempt) % options.length;
        const rotated = options.slice(offset).concat(options.slice(0, offset));
        rotated.forEach(option => {
          const radio = element("input");
          radio.type = "radio";
          radio.name = "q" + number;
          radio.value = option;
          radio.required = true;
          const optionLabel = element("label", "", "study-option");
          optionLabel.append(radio, option);
          field.append(optionLabel);
        });
        return field;
      });
      quiz.replaceChildren(quizHeader, ...fields, submit);
    }

    input.addEventListener("input", () => {
      const hasAnswer = Boolean(input.value.trim());
      reveal.disabled = !hasAnswer || !resolution.hidden;
      if (!hasAnswer) {
        checked.checked = false;
        quiz.hidden = true;
      }
    });
    reveal.addEventListener("click", () => {
      resolution.hidden = false;
      reveal.disabled = true;
      checkLabel.hidden = false;
      checked.focus();
    });
    checked.addEventListener("change", () => { quiz.hidden = graded || !checked.checked || !input.value.trim(); });
    quiz.addEventListener("submit", event => {
      event.preventDefault();
      if (graded || !checked.checked || !input.value.trim() || resolution.hidden || selected > firstOpen()) return;
      const responses = new FormData(quiz);
      const answers = stage.quiz.map((_, index) => responses.get("q" + index));
      if (answers.some((answer, index) => !stage.quiz[index].slice(1, 5).includes(answer))) return;
      graded = true;
      const score = answers.filter((answer, index) => answer === stage.quiz[index][1]).length;
      const passedNow = score === stage.quiz.length;
      const newCompletion = passedNow && selected === firstOpen();
      if (newCompletion) {
        progress.passed.push(stage.id);
        progress.reviews[stage.id] = { round: 0, due: today() + reviewGaps[0] };
        progress.lastGoal = today();
        status.textContent = "ETAPA CONCLUÍDA";
      }
      progress.attempts[stage.id] = answers;
      persist();
      if (newCompletion) {
        renderOutline();
        renderReviews();
        updateGoal();
      }
      const hasNext = selected + 1 < etapas.length;
      const key = answerKey(stage, answers, alreadyPassed || passedNow);
      key.open = true;
      result.replaceChildren(key);
      announcement.textContent = score + "/" + stage.quiz.length + ". " + (passedNow
        ? hasNext ? "Próxima etapa disponível." : "Trilha guiada concluída."
        : "Veja o gabarito comentado e tente novamente.");
      quiz.hidden = true;
      if (passedNow) {
        onward.hidden = !hasNext;
      } else {
        const retry = action("Refazer quiz");
        retry.addEventListener("click", () => {
          attempt++;
          graded = false;
          key.open = false;
          retry.remove();
          announcement.textContent = "";
          questions();
          quiz.hidden = !checked.checked || !input.value.trim();
          if (!quiz.hidden) quiz.querySelector("input").focus();
        });
        result.append(retry);
      }
      key.querySelector("summary").focus();
    });
    onward.addEventListener("click", () => switchStage(selected + 1));
    questions();
    practice.append(label, reveal, resolution, checkLabel);
    const activity = get("atividade");
    activity.replaceChildren(status, title, element("p", stage.goal), theory,
      block("Curiosidade aplicada", stage.curiosity), practice, quiz, announcement, result, onward);
    const module = catalogo.modules.find(item => item.id === stage.id);
    const url = module?.url ?? catalogo.notion?.master;
    if (url) activity.append(link(module ? "Aprofundar na apostila ↗" : "Consultar a grade no Plano Mestre ↗", url));
  }

  function renderReviews() {
    const pending = pendingReviews();
    const available = pending.filter(item => item.record.due <= today());
    const list = get("lista-revisao");
    if (!available.length) {
      const next = pending[0]?.record.due;
      const date = next ? new Date(next * 86400000).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "";
      list.replaceChildren(element("p", date ? "Próxima revisão em " + date + "." :
        "A primeira revisão aparece no dia seguinte à conclusão de uma etapa."));
      return;
    }
    list.replaceChildren(...available.map(({ stage, record }) => {
      const item = element("details", "", "review-item");
      const reveal = element("details");
      reveal.append(element("summary", "Ver resposta depois de tentar"), element("p", stage.answer));
      const remember = action("Respondi sem consultar");
      const retry = action("Revisar de novo amanhã");
      remember.disabled = retry.disabled = true;
      reveal.addEventListener("toggle", () => { remember.disabled = retry.disabled = !reveal.open; });
      function recordReview(success) {
        if (progress.reviews[stage.id] !== record || record.due > today()) return;
        const round = record.round + Number(success);
        progress.reviews[stage.id] = { round, due: today() + (success ? reviewGaps[round] ?? 0 : 1) };
        progress.lastGoal = today();
        persist();
        updateGoal();
        renderReviews();
      }
      remember.addEventListener("click", () => recordReview(true));
      retry.addEventListener("click", () => recordReview(false));
      item.append(element("summary", stage.id + " · " + stageTitle(stage)),
        element("p", stage.recall), reveal, remember, retry);
      return item;
    }));
  }

  document.addEventListener("click", event => {
    const reference = event.target.closest("[data-study-stage]");
    if (!reference) return;
    const index = etapas.findIndex(stage => stage.id === reference.dataset.studyStage);
    if (index < 0) return;
    const message = get("acesso-etapa");
    if (index <= firstOpen()) {
      message.textContent = "";
      switchStage(index);
    } else {
      message.textContent = etapas[index].id + " está bloqueada. Conclua as etapas anteriores para abrir este módulo.";
    }
  });

  get("tempo-meta").value = String(progress.minutes);
  get("tempo-meta").addEventListener("change", event => {
    progress.minutes = Number(event.currentTarget.value);
    persist();
    updateGoal();
  });
  get("meta-link").addEventListener("click", () => {
    if (get("meta-link").hash === "#revisao") {
      get("revisao").open = true;
      get("lista-revisao").querySelector("details")?.setAttribute("open", "");
    } else if (firstOpen() < etapas.length) {
      switchStage(firstOpen());
    }
  });
  updateStatus();
  renderOutline();
  renderActivity();
  renderReviews();
  updateGoal();
})();
