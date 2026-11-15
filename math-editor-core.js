"use strict";
(function (root) {
  const mathStages = new Set([
    "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M13",
    "S01", "S02", "S03", "S04", "S05", "S07"
  ]);
  const MAX_TEXT = 1000;
  const MAX_LATEX = 800;
  const MAX_DRAWING = 16000;
  function supportsMath(id) { return mathStages.has(id); }
  function validStage(id) { return /^(M(?:0[0-9]|1[0-3])|S(?:0[1-9]|10))$/.test(id); }
  function hasAnswer(text, latex, drawing) {
    return Boolean((typeof text === "string" && text.trim()) || (typeof latex === "string" && latex.trim()) || (typeof drawing === "string" && drawing.length > 4));
  }
  function cleanDrafts(drafts) {
    const result = {};
    if (!drafts || typeof drafts !== "object" || Array.isArray(drafts)) return result;
    for (const [id, draft] of Object.entries(drafts)) {
      if (!validStage(id) || !draft || typeof draft !== "object" || Array.isArray(draft)) continue;
      const text = typeof draft.text === "string" ? draft.text.slice(0, MAX_TEXT) : "";
      const latex = supportsMath(id) && typeof draft.latex === "string" ? draft.latex.slice(0, MAX_LATEX) : "";
      const drawing = typeof draft.drawing === "string" && draft.drawing.length <= MAX_DRAWING && /^\[\[/.test(draft.drawing) ? draft.drawing : "";
      if (hasAnswer(text, latex, drawing)) result[id] = { text, latex, drawing };
    }
    return result;
  }
  function saveDraft(drafts, id, text, latex, drawing = "") {
    const next = cleanDrafts(drafts);
    if (!validStage(id)) return next;
    const entry = {
      text: typeof text === "string" ? text.slice(0, MAX_TEXT) : "",
      latex: supportsMath(id) && typeof latex === "string" ? latex.slice(0, MAX_LATEX) : "",
      drawing: typeof drawing === "string" && drawing.length <= MAX_DRAWING && /^\[\[/.test(drawing) ? drawing : ""
    };
    if (hasAnswer(entry.text, entry.latex, entry.drawing)) next[id] = entry;
    else delete next[id];
    return next;
  }
  const api = Object.freeze({ supportsMath, cleanDrafts, hasAnswer, saveDraft, MAX_TEXT, MAX_LATEX });
  root.MathPractice = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(globalThis);
