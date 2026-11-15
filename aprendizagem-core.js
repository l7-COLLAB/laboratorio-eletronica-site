"use strict";
(function(root) {
  const phases = ['teoria','pratica','quiz','resultado'];
  function resume(value, stages, canOpen) {
    if (!value || !phases.includes(value.phase)) return null;
    const index = stages.findIndex(s => s.id === value.id);
    return index >= 0 && canOpen(index) ? {index, phase:value.phase} : null;
  }
  function history(rows) {
    const unique = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!row || typeof row.uid !== 'string' || row.uid.length > 80 ||
          !/^(M\d{2}|S\d{2})$/.test(row.id) || !Number.isFinite(row.at) ||
          !Array.isArray(row.wrong) || row.wrong.some(n => !Number.isInteger(n) || n < 0 || n > 2)) continue;
      unique.set(row.uid, {uid:row.uid,id:row.id,at:row.at,wrong:[...new Set(row.wrong)]});
    }
    return [...unique.values()].sort((a,b)=>a.at-b.at || a.uid.localeCompare(b.uid)).slice(-60);
  }
  function state(stage, progress, day) {
    const attempt = progress.attempts?.[stage.id];
    const score = Array.isArray(attempt) ? attempt.filter((a,i)=>a===stage.quiz[i]?.[1]).length : null;
    const review = progress.reviews?.[stage.id];
    const passed = progress.passed?.includes(stage.id);
    if ((score !== null && score < stage.quiz.length) || (review && review.round < 3 && review.due <= day)) return 'Precisa revisar';
    // Reviews are self-reported, so they cannot establish objectively verified mastery.
    if (passed) return 'Proficiente';
    if (attempt || progress.drafts?.[stage.id]) return 'Em aprendizagem';
    return 'Não iniciado';
  }
  const api = {resume,history,state}; root.Learning = api;
  if (typeof module==='object' && module.exports) module.exports=api;
})(globalThis);
