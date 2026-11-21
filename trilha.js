"use strict";

(() => {
  const key = "laboratorio-eletronica:trilha:v1";
  const stored = readLocal(key, {});
  const progress = {
    ...stored,
    history: Learning.history(stored.history),
    resume: stored.resume ?? null,
    passed: TrailProgress.recoverPassed(etapas, stored.passed, stored.attempts),
    reviews: stored.reviews ?? {},
    attempts: stored.attempts ?? {},
    drafts: MathPractice.cleanDrafts(stored.drafts),
    minutes: [10, 15, 20].includes(stored.minutes) ? stored.minutes : 15,
    lastGoal: stored.lastGoal ?? null,
  };
  // The old dataset started at M03/M06. Keep those completions while
  // progressing through the corrected M00–M13, S01–S10 ordering.
  const firstOpen = () => TrailProgress.nextRecommended(etapas, progress.passed);
  const canOpen = index => TrailProgress.canOpen(etapas, index);
  const isComplete = id => TrailProgress.completed(etapas, progress.passed, id);
  let selected = Learning.resume(progress.resume, etapas, canOpen)?.index ?? Math.min(firstOpen(), etapas.length - 1);
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
    window.dispatchEvent(new CustomEvent("study:updated"));
  }

  function updateStatus() {
    const count = TrailProgress.completedCount(etapas, progress.passed);
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
    get("meta-link").textContent = review ? "Fazer revisão" : "Começar atividade";
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
    if (!canOpen(index)) return;
    goToView("trilha");
    selected = index;
    progress.resume = {id: etapas[index].id, phase:"teoria", at:Date.now()};
    persist();
    attempt = 0;
    renderOutline();
    renderActivity();
    get("atividade").querySelector("h2").focus();
  }

  function renderOutline() {
    const outline = get("mapa-trilha");
    const nodes = [];
    let group;
    etapas.forEach((stage, index) => {
      if (index === 0 || stage.id === "S01") {
        const section = element("section", "", "stage-group");
        group = element("div", "", "stage-list");
        section.append(element("h2", index === 0 ? "Nivelamento" : "Desafios dos semestres"), group);
        nodes.push(section);
      }
      const passed = isComplete(stage.id);
      const button = element("button", "", "stage-choice");
      const name = element("span", stageTitle(stage), "stage-name");
      name.prepend(element("span", stage.id, "stage-code"), " ");
      button.append(name);
      button.type = "button";
      if (index === selected) button.setAttribute("aria-current", "step");
      button.append(element("small", passed ? "Concluída" : "Disponível"));
      button.addEventListener("click", () => switchStage(index));
      group.append(button);
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

  function answerKey(stage, answers) {
    const details = element("details", "", "quiz-key");
    const heading = element("summary", "Ver gabarito comentado");
    heading.append(element("span", "", "quiz-score"));
    const score = answers?.filter((answer, index) => answer === stage.quiz[index][1]).length;
    if (answers) heading.querySelector(".quiz-score").textContent = " · " + score + "/" + stage.quiz.length;
    if (answers && score < stage.quiz.length) {
      details.append(heading, element("p", "Revise o raciocínio das questões que errou nesta tentativa."));
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
    const alreadyPassed = isComplete(stage.id);
    const title = element("h2", stage.id + " · " + stageTitle(stage));
    title.tabIndex = -1;
    const example = element("details");
    example.append(element("summary", "Ver exemplo resolvido"), element("p", stage.example));
    const theory = block("Entenda", stage.theory);
    theory.id = "aula-teoria";
    theory.append(example);
    const practice = block("Pratique sem consulta", stage.task);
    const numericHost = element("div");
    const usesStructured = Boolean(window.StructuredPracticeCore?.has(stage.id));
    const needsStandaloneMath = MathPractice.supportsMath(stage.id) && !usesStructured && stage.id !== "M06";
    // Avoid duplicate questions: the new table/diagram replaces the older numeric widgets.
    // Existing numeric answers remain in progress.practiceAnswers for recovery.
    const numericEditor = usesStructured ? null : NumericPractice.create(numericHost,stage.id,progress.practiceAnswers?.[stage.id],answers=>{
      progress.practiceAnswers={...(progress.practiceAnswers??{}),[stage.id]:answers};
      updatePractice();
    });
    practice.id = "aula-pratica";
    const input = element("textarea");
    input.rows = 3;
    input.className = "practice-response";
    input.maxLength = MathPractice.MAX_TEXT;
    input.value = progress.drafts[stage.id]?.text ?? "";
    const needsExplanation = ["M05","S01","S06","S07"].includes(stage.id);
    const label = element("label", needsExplanation
      ? "Explique ou justifique seu raciocínio (obrigatório)"
      : MathPractice.supportsMath(stage.id) ? "Explicação por escrito (opcional)" : "Sua resposta");
    label.append(input);
    const mathHost = element("div", "", "math-editor");
    let mathEditor = null;
    const savedLatex = progress.drafts[stage.id]?.latex ?? "";
    let drawingEditor = null;
    let diagramEditor = null;
    const hasPracticeAnswer = () => {
      if (diagramEditor) return diagramEditor.validate().complete && (!needsExplanation || Boolean(input.value.trim()));
      if (numericEditor) return numericEditor.getValue().every(value=>value.trim());
      return MathPractice.hasAnswer(input.value, mathEditor?.getValue() ?? savedLatex,
        drawingEditor?.getValue() ?? progress.drafts[stage.id]?.drawing);
    };
    function updatePractice() {
      const latex = mathEditor?.getValue() ?? savedLatex;
      progress.drafts = MathPractice.saveDraft(progress.drafts, stage.id, input.value, latex, drawingEditor?.getValue() ?? progress.drafts[stage.id]?.drawing ?? "", diagramEditor?.getValue() ?? progress.drafts[stage.id]?.diagram ?? "");
      progress.resume = {id:stage.id,phase:"pratica",at:Date.now()};
      persist();
      const answered = hasPracticeAnswer();
      reveal.disabled = !answered || !resolution.hidden;
      if (!answered) {
        checked.checked = false;
        quiz.hidden = true;
      }
    }
    if (needsStandaloneMath) {
      mathEditor = createMathEditor(mathHost, { initialLatex: savedLatex, onChange: updatePractice });
    }
    const diagramHost = element("div", "", "diagram-host");
    if (stage.id === "M06" && typeof createTriangleExercise === "function") {
      diagramEditor = createTriangleExercise(diagramHost, {initial: progress.drafts[stage.id]?.diagram ?? "", onChange: updatePractice});
    } else if (usesStructured && window.StructuredPractice) {
      const saved = progress.drafts[stage.id]?.diagram ?? "";
      // M05/M09 used numeric answers previously. Prefill compatible fields without
      // overwriting prior answers or changing the cloud schema.
      const oldNumbers = progress.practiceAnswers?.[stage.id];
      let initial = saved;
      if (!initial && Array.isArray(oldNumbers)) {
        if (stage.id === "M05" && oldNumbers.length >= 3)
          initial = JSON.stringify({y0:oldNumbers[0],y1:oldNumbers[1],y2:oldNumbers[2]});
        if (stage.id === "M09" && oldNumbers[0])
          initial = JSON.stringify({i:oldNumbers[0] + " mA"});
      }
      diagramEditor = StructuredPractice.create(diagramHost,stage.id,{initial,onChange:updatePractice});
    }
    const drawingHost = element("div", "", "drawing-host");
    if (!diagramEditor && typeof createDrawingEditor === "function" && /desenh|esbo[cç]|trace (?:um |o )?gr[aá]fico|fa[cç]a (?:um |o )?diagrama/i.test(stage.task)) {
      drawingEditor = createDrawingEditor(drawingHost, { initial: progress.drafts[stage.id]?.drawing ?? "", onChange: updatePractice });
    }
    const reveal = action("Comparar com a resolução");
    reveal.disabled = !hasPracticeAnswer();
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
    quiz.id = "aula-quiz";
    const quizHeader = element("h3", "Quiz · três questões");
    const result = element("div", "", "study-feedback");
    result.id = "aula-resultado";
    const announcement = element("p");
    announcement.setAttribute("role", "status");
    const last = progress.attempts[stage.id];
    if (last || alreadyPassed) result.append(answerKey(stage, last));
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

    input.addEventListener("input", updatePractice);
    reveal.addEventListener("click", () => {
      resolution.hidden = false;
      reveal.disabled = true;
      checkLabel.hidden = false;
      checked.focus();
    });
    checked.addEventListener("change", () => {
      quiz.hidden = graded || !checked.checked || !hasPracticeAnswer();
      progress.resume = {id:stage.id,phase:quiz.hidden?"pratica":"quiz",at:Date.now()};persist();
    });
    quiz.addEventListener("change", () => {
      const answers = stage.quiz.map((_, i) => quiz.querySelector('input[name="q'+i+'"]:checked')?.value ?? "");
      progress.quizDraft = {id:stage.id,answers,at:Date.now()};
      progress.resume = {id:stage.id,phase:"quiz",at:Date.now()};persist();
    });
    quiz.addEventListener("submit", event => {
      event.preventDefault();
      if (graded || !checked.checked || !hasPracticeAnswer() || resolution.hidden) return;
      const responses = new FormData(quiz);
      const answers = stage.quiz.map((_, index) => responses.get("q" + index));
      if (answers.some((answer, index) => !stage.quiz[index].slice(1, 5).includes(answer))) return;
      graded = true;
      const score = answers.filter((answer, index) => answer === stage.quiz[index][1]).length;
      const passedNow = score === stage.quiz.length;
      const newCompletion = passedNow && !isComplete(stage.id);
      if (newCompletion) {
        progress.passed.push(stage.id);
        progress.reviews[stage.id] = { round: 0, due: today() + reviewGaps[0] };
        progress.lastGoal = today();
        status.textContent = "ETAPA CONCLUÍDA";
      }
      progress.attempts[stage.id] = answers;
      progress.history = Learning.history([...progress.history,{uid:crypto.randomUUID(),id:stage.id,at:Date.now(),wrong:answers.flatMap((a,i)=>a===stage.quiz[i][1]?[]:[i])}]);
      progress.resume = {id:stage.id,phase:"resultado",at:Date.now()};
      delete progress.quizDraft;
      persist();
      if (newCompletion) {
        renderOutline();
        renderReviews();
        updateGoal();
      }
      const hasNext = selected + 1 < etapas.length;
      const key = answerKey(stage, answers);
      key.open = true;
      result.replaceChildren(key);
      announcement.textContent = score + "/" + stage.quiz.length + ". " + (passedNow
        ? "Etapa concluída."
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
          quiz.hidden = !checked.checked || !hasPracticeAnswer();
          if (!quiz.hidden) quiz.querySelector("input").focus();
        });
        result.append(retry);
      }
      key.querySelector("summary").focus();
    });
    onward.addEventListener("click", () => switchStage(selected + 1));
    questions();
    if (progress.quizDraft?.id === stage.id && Array.isArray(progress.quizDraft.answers)) {
      quiz.querySelectorAll('input[type="radio"]').forEach(radio => {radio.checked=progress.quizDraft.answers[Number(radio.name.slice(1))]===radio.value;});
    }
    if (progress.resume?.id === stage.id && ["quiz","resultado"].includes(progress.resume.phase) && hasPracticeAnswer()) {
      resolution.hidden=false;checkLabel.hidden=false;checked.checked=true;reveal.disabled=true;
      quiz.hidden=progress.resume.phase === "resultado";
      if(progress.resume.phase === "resultado" && alreadyPassed) onward.hidden=selected+1>=etapas.length;
      if(progress.resume.phase === "resultado" && !alreadyPassed) quiz.hidden=false;
    }
    if (needsStandaloneMath) practice.append(mathHost);
    practice.append(label);
    if (diagramEditor) practice.append(diagramHost);
    if (drawingEditor) practice.append(drawingHost);
    practice.append(numericHost,reveal, resolution, checkLabel);
    const activity = get("atividade");
    const navigation = element("nav", "", "lesson-navigation");navigation.setAttribute("aria-label","Etapas da aula");
    for (const [phase,label] of [["teoria","Teoria"],["pratica","Prática"],["quiz","Quiz"],["resultado","Resultado"]]) {
      const button=action(label);button.addEventListener("click",()=>{
        const target=get("aula-"+phase);if(target.hidden){announcement.textContent="Conclua a prática e compare a resolução para abrir o quiz.";return;}
        progress.resume={id:stage.id,phase,at:Date.now()};persist();target.scrollIntoView({block:"start"});
      });navigation.append(button);
    }
    if (!diagramEditor && !numericEditor)
      practice.append(element("p","Esta prática discursiva é de autoavaliação. A correção automática da etapa acontece no quiz.","study-note"));
    if (diagramEditor)
      practice.append(element("p","Use Corrigir atividade para conferir os campos objetivos. Justificativas e propostas precisam ser comparadas com a resolução.","study-note"));
    window.dismissMathKeyboard?.();
    activity.replaceChildren(status, title, element("p", stage.goal), navigation, theory,
      block("Curiosidade aplicada", stage.curiosity), practice, quiz, announcement, result, onward,
      noteEditor(stageCategory(stage.id)));
    activity.append(renderStudyResources("modules", stage.id));
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
    switchStage(index);
  });

  window.addEventListener("cloud:applied", event => {
    if (!event.detail.keys.includes(key)) return;
    const saved = readLocal(key, {});
    progress.practiceAnswers = saved.practiceAnswers ?? progress.practiceAnswers;
    progress.history = Learning.history(saved.history);
    progress.resume = saved.resume ?? progress.resume;
    progress.quizDraft = saved.quizDraft ?? progress.quizDraft;
    progress.passed = TrailProgress.recoverPassed(etapas, saved.passed, saved.attempts);
    const recoveredFromQuiz = progress.passed.length >
      (Array.isArray(saved.passed) ? saved.passed.length : 0);
    progress.reviews = saved.reviews ?? {};
    progress.attempts = saved.attempts ?? {};
    progress.drafts = MathPractice.cleanDrafts(saved.drafts);
    progress.minutes = [10, 15, 20].includes(saved.minutes) ? saved.minutes : 15;
    progress.lastGoal = saved.lastGoal ?? null;
    const practiceInput = get("atividade").querySelector("textarea.practice-response");
    const mathHost = get("atividade").querySelector("[data-math-editor]");
    const drawingHost = get("atividade").querySelector("[data-drawing-editor]");
    const structuredHost = get("atividade").querySelector("[data-structured-practice]");
    const hasDraft = MathPractice.hasAnswer(practiceInput?.value, mathHost?.dataset.latex, drawingHost?.dataset.drawing) ||
      Boolean(get("atividade").querySelector("[data-triangle-exercise]")) ||
      structuredHost?.dataset.hasDraft === "true";
    if (!hasDraft) renderActivity();
    get("tempo-meta").value = String(progress.minutes);
    updateStatus();
    updateGoal();
    renderOutline();
    renderReviews();
    if (recoveredFromQuiz) persist();
  });

  window.addEventListener("study:resume", () => {
    const saved=Learning.resume(progress.resume,etapas,canOpen);
    const index=saved?.index ?? firstOpen();
    if(index>=etapas.length){goToView("revisao");return;}
    selected=index;goToView("trilha");renderActivity();
    const target=get("aula-"+(saved?.phase ?? "teoria"));
    (target && !target.hidden ? target : get("atividade")).scrollIntoView({block:"start"});
  });
  get("tempo-meta").value = String(progress.minutes);
  get("tempo-meta").addEventListener("change", event => {
    progress.minutes = Number(event.currentTarget.value);
    persist();
    updateGoal();
  });
  get("meta-link").addEventListener("click", event => {
    event.preventDefault();
    if (get("meta-link").hash === "#revisao") {
      goToView("revisao");
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
  // Persist only when we can prove a formerly missing completion using 3/3 answers.
  if (progress.passed.length > (Array.isArray(stored.passed) ? stored.passed.length : 0)) persist();
})();
