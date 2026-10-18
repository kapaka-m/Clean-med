const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createEngine } = require('../js/engine.js');
const { conditions, groups, samples } = require('../js/knowledge.js');
const engine = createEngine(conditions);

test('the knowledge base contains 12 unique rules and 30 symptoms', () => {
  assert.equal(conditions.length, 12);
  assert.equal(engine.symptoms.length, 30);
  assert.equal(new Set(conditions.map((item) => item.id)).size, 12);
  const grouped = Object.values(groups).flat();
  assert.equal(grouped.length, 30);
  assert.deepEqual([...grouped].sort(), [...engine.symptoms].sort());
});
test('no evidence produces no candidates or complete rules', () => {
  assert.deepEqual(engine.assess([]), []);
  assert.deepEqual(engine.forward([]), []);
});
test('case, whitespace, duplicate and unknown inputs cannot inflate a score', () => {
  assert.deepEqual(engine.assess([' fever ', 'FEVER', 'unknown', null]), engine.assess(['Fever']));
  assert.deepEqual(engine.assess(['unknown']), []);
});
test('three of five symptoms gives 60% rule coverage', () => {
  const result = engine.verify('migraine', ['Headache', 'Nausea', 'Light sensitivity']);
  assert.equal(result.score, 60);
  assert.equal(result.complete, false);
  assert.deepEqual(result.missing, ['Dizziness', 'Blurred vision']);
});
test('all required symptoms satisfy a rule, even with additional symptoms', () => {
  const migraine = conditions.find((item) => item.id === 'migraine');
  const result = engine.verify('migraine', [...migraine.symptoms, 'Fever']);
  assert.equal(result.score, 100);
  assert.equal(result.complete, true);
  assert.deepEqual(result.additional, ['Fever']);
  assert.ok(engine.forward([...migraine.symptoms, 'Fever']).some((item) => item.id === 'migraine'));
});
test('single-rule verification supports zero coverage and unknown ids', () => {
  const result = engine.verify('migraine', ['Cough']);
  assert.equal(result.score, 0);
  assert.equal(result.missing.length, 5);
  assert.equal(result.complete, false);
  assert.equal(engine.verify('does-not-exist', ['Cough']), null);
});
test('every condition reaches 100% when all its own symptoms are selected', () => {
  for (const condition of conditions) {
    const result = engine.verify(condition.id, condition.symptoms);
    assert.equal(result.score, 100, condition.name);
    assert.equal(result.complete, true, condition.name);
    assert.deepEqual(result.missing, []);
    assert.ok(engine.forward(condition.symptoms).some((item) => item.id === condition.id));
  }
});
test('scores stay bounded and evidence partitions are consistent', () => {
  for (const sample of samples) {
    for (const result of engine.assess(sample.symptoms)) {
      assert.ok(result.score > 0 && result.score <= 100);
      assert.equal(result.matched.length + result.missing.length, result.symptoms.length);
      assert.equal(result.matched.length + result.additional.length, sample.symptoms.length);
      assert.equal(new Set([...result.matched, ...result.missing]).size, result.symptoms.length);
    }
  }
});
test('ranking is deterministic: coverage, match count, then alphabetical name', () => {
  const results = engine.assess(engine.symptoms);
  assert.equal(results[0].name, 'COVID-19');
  assert.equal(results[1].name, 'Influenza');
  assert.equal(results[2].name, 'Anemia');
  assert.deepEqual(
    engine.assess([...engine.symptoms].reverse()),
    results.map((item) => ({ ...item, additional: [...item.additional].reverse() })),
  );
});
test('evaluation never mutates caller data or the knowledge base', () => {
  const symptoms = ['Headache', 'Nausea'];
  const before = JSON.stringify(conditions);
  engine.assess(symptoms);
  assert.deepEqual(symptoms, ['Headache', 'Nausea']);
  assert.equal(JSON.stringify(conditions), before);
  assert.equal(Object.isFrozen(conditions[0].symptoms), true);
});
test('invalid and duplicate rules fail clearly', () => {
  assert.throws(() => createEngine([]), TypeError);
  assert.throws(() => createEngine([{ id: 'x', name: 'X', symptoms: [] }]), TypeError);
  assert.throws(() => createEngine([conditions[0], conditions[0]]), TypeError);
  assert.throws(
    () => createEngine([{ id: 'x', name: 'X', symptoms: ['Fever', 'fever'] }]),
    TypeError,
  );
  assert.throws(() => engine.assess('Fever'), TypeError);
});
