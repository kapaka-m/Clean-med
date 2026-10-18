/* Pure, deterministic rule evaluation. No DOM, requests, or patient storage. */
(function (root) {
  'use strict';
  function createEngine(conditions) {
    if (!Array.isArray(conditions) || !conditions.length)
      throw new TypeError('A non-empty knowledge base is required.');
    const ids = new Set();
    const rules = conditions.map((condition) => {
      if (
        !condition.id ||
        ids.has(condition.id) ||
        !condition.name ||
        !Array.isArray(condition.symptoms) ||
        !condition.symptoms.length ||
        condition.symptoms.some((value) => typeof value !== 'string' || !value.trim())
      ) {
        throw new TypeError('Each rule needs a unique id, a name, and non-empty symptoms.');
      }
      ids.add(condition.id);
      if (new Set(condition.symptoms.map(normalize)).size !== condition.symptoms.length)
        throw new TypeError('A rule cannot contain duplicate symptoms.');
      return Object.freeze({ ...condition, symptoms: Object.freeze([...condition.symptoms]) });
    });
    const symptoms = [...new Set(rules.flatMap((rule) => rule.symptoms))].sort((a, b) =>
      a.localeCompare(b, 'en'),
    );
    const canonical = new Map(symptoms.map((symptom) => [normalize(symptom), symptom]));
    function sanitize(input) {
      if (!Array.isArray(input)) throw new TypeError('Symptoms must be an array.');
      return [
        ...new Set(
          input
            .filter((value) => typeof value === 'string')
            .map(normalize)
            .filter((value) => canonical.has(value)),
        ),
      ].map((value) => canonical.get(value));
    }
    function evaluate(rule, selected) {
      const chosen = new Set(selected);
      const matched = rule.symptoms.filter((symptom) => chosen.has(symptom));
      const missing = rule.symptoms.filter((symptom) => !chosen.has(symptom));
      const additional = selected.filter((symptom) => !rule.symptoms.includes(symptom));
      return {
        ...rule,
        matched,
        missing,
        additional,
        score: Math.round((matched.length / rule.symptoms.length) * 100),
        complete: missing.length === 0,
      };
    }
    function assess(input) {
      const selected = sanitize(input);
      return rules
        .map((rule) => evaluate(rule, selected))
        .filter((rule) => rule.matched.length > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.matched.length - a.matched.length ||
            a.name.localeCompare(b.name, 'en'),
        );
    }
    function verify(id, input) {
      const rule = rules.find((item) => item.id === id);
      return rule ? evaluate(rule, sanitize(input)) : null;
    }
    return Object.freeze({
      symptoms: Object.freeze(symptoms),
      assess,
      verify,
      sanitize,
      forward: (input) => assess(input).filter((rule) => rule.complete),
    });
  }
  function normalize(value) {
    return value.trim().toLowerCase();
  }
  const api = Object.freeze({ createEngine });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CleanMedEngine = api;
})(globalThis);
