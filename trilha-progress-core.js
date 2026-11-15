"use strict";

// Preserves legacy completion records from older builds while using canonical
// module order for every new learner. This file is also testable in Node.
(function (root) {
  function completedIds(stages, passed) {
    const allowed = new Set(stages.map(stage => stage.id));
    return new Set(Array.isArray(passed) ? passed.filter(id => allowed.has(id)) : []);
  }

  function completedCount(stages, passed) {
    return completedIds(stages, passed).size;
  }

  function completed(stages, passed, id) {
    return completedIds(stages, passed).has(id);
  }

  function highestCompletedIndex(stages, passed) {
    const ids = completedIds(stages, passed);
    for (let index = stages.length - 1; index >= 0; index--) {
      if (ids.has(stages[index].id)) return index;
    }
    return -1;
  }

  function unlockLimit(stages, passed) {
    if (!stages.length) return -1;
    // Historical releases placed M03 and M06 before M00. A learner who
    // finished them must keep access to the next canonical module.
    return Math.min(stages.length - 1, highestCompletedIndex(stages, passed) + 1);
  }

  function canOpen(stages, passed, index) {
    return Number.isInteger(index) && index >= 0 && index <= unlockLimit(stages, passed);
  }

  function nextRecommended(stages, passed) {
    const furthest = highestCompletedIndex(stages, passed);
    if (furthest + 1 < stages.length) return furthest + 1;
    const ids = completedIds(stages, passed);
    const firstMissing = stages.findIndex(stage => !ids.has(stage.id));
    return firstMissing === -1 ? stages.length : firstMissing;
  }

  const api = Object.freeze({ completedIds, completedCount, completed,
    highestCompletedIndex, unlockLimit, canOpen, nextRecommended });
  root.TrailProgress = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(globalThis);
