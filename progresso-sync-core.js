"use strict";

/* Merge study progress from the same account without losing completed modules.
   Do not silently pick a winner when two devices edited the same free response.
   Returns null when a user decision is required. */
(function (root) {
  function validId(id) {
    return /^(M(?:0[0-9]|1[0-3])|S(?:0[1-9]|10))$/.test(id);
  }
  function plain(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }
  function objectMap(value) {
    return plain(value) ? value : {};
  }
  function merge(local, remote, stages = []) {
    if (!plain(local) || !plain(remote) ||
        !Array.isArray(local.passed) || !Array.isArray(remote.passed)) return null;
    const validPassed = [ ...remote.passed, ...local.passed ].filter(id => typeof id === "string" && validId(id));
    const passed = [...new Set(validPassed)];
    const remoteAttempts = objectMap(remote.attempts);
    const localAttempts = objectMap(local.attempts);
    const quizById = new Map(Array.isArray(stages) ? stages.map(stage => [stage.id, stage.quiz]) : []);
    const attempts = { ...remoteAttempts };

    for (const [id, answers] of Object.entries(localAttempts)) {
      if (!validId(id)) continue;
      if (!Object.hasOwn(attempts, id)) { attempts[id] = answers; continue; }
      if (JSON.stringify(attempts[id]) === JSON.stringify(answers)) continue;
      const quiz = quizById.get(id);
      if (!Array.isArray(quiz) || !Array.isArray(answers) || !Array.isArray(attempts[id])) return null;
      const score = candidate => candidate.length === quiz.length
        ? candidate.filter((choice, index) => choice === quiz[index][1]).length : -1;
      const localScore = score(answers), remoteScore = score(attempts[id]);
      if (localScore === remoteScore) return null;
      if (localScore > remoteScore) attempts[id] = answers;
    }

    const reviews = { ...objectMap(remote.reviews) };
    for (const [id, record] of Object.entries(objectMap(local.reviews))) {
      if (!validId(id)) continue;
      const prior = reviews[id];
      if (!prior || !plain(record)) { reviews[id] = record; continue; }
      if (!plain(prior)) { reviews[id] = record; continue; }
      if (Number(record.round) > Number(prior.round) ||
          (Number(record.round) === Number(prior.round) && Number(record.due) > Number(prior.due))) {
        reviews[id] = record;
      }
    }

    const drafts = { ...objectMap(remote.drafts) };
    for (const [id, draft] of Object.entries(objectMap(local.drafts))) {
      if (!validId(id)) continue;
      if (!Object.hasOwn(drafts, id)) { drafts[id] = draft; continue; }
      const earlier = drafts[id];
      if (!plain(draft) || !plain(earlier)) return null;
      const joined = { ...earlier };
      for (const field of ["text", "latex", "drawing"]) {
        const a = typeof earlier[field] === "string" ? earlier[field] : "";
        const b = typeof draft[field] === "string" ? draft[field] : "";
        if (a && b && a !== b) return null;
        joined[field] = a || b;
      }
      drafts[id] = joined;
    }

    // A recorded perfect quiz always means a completed module, even after a
    // historical sync error lost the completion flag.
    for (const [id, answers] of Object.entries(attempts)) {
      const quiz = quizById.get(id);
      if (validId(id) && Array.isArray(quiz) && Array.isArray(answers) &&
          answers.length === quiz.length &&
          answers.every((choice, index) => choice === quiz[index][1]) && !passed.includes(id)) passed.push(id);
    }

    const lastGoal = [local.lastGoal, remote.lastGoal].filter(x => Number.isInteger(x) && x >= 0);
    const minutes = [10, 15, 20].includes(local.minutes) ? local.minutes :
      [10, 15, 20].includes(remote.minutes) ? remote.minutes : 15;
    return {
      ...remote, ...local,
      passed, attempts, reviews, drafts,
      minutes, lastGoal: lastGoal.length ? Math.max(...lastGoal) : null
    };
  }
  const api = Object.freeze({ merge });
  root.StudyProgressSync = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(globalThis);
