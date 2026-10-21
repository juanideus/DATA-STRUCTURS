import assert from 'node:assert/strict';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../src/data/beginnerCpp.js';
import { getOperationPseudocode } from '../src/data/operationPseudocode.js';
import { executeOperation } from '../src/logic/operations.js';
import { createCodeSynchronizedFrames } from '../src/logic/codeAnimation.js';
import { cppCodeNeedle } from '../src/logic/cppCodeNeedles.js';

// Focused counterexamples from the October audit, not the project-wide suite.
const algorithm = id => algorithms.find(item => item.id === id);
const run = (id, actionId, values, fields = {}) => executeOperation({
  algorithm: algorithm(id), actionId, values, fields, edges: [],
  initialValues: algorithm(id).values,
});
let checks = 0;

for (const [id, actionId] of [
  ['matriz', 'matrix-set'], ['matriz', 'matrix-fill'],
  ['matriz-dispersa', 'matrix-insert'],
]) {
  for (const invalid of ['2147483648', '-2147483649', '9007199254740993', '1e309']) {
    const before = structuredClone(algorithm(id).values);
    const result = run(id, actionId, before, { value: invalid, second: '0', index: '0' });
    assert.equal(result.ok, false, `${id}/${actionId} must reject ${invalid}`);
    assert.deepEqual(result.values, before, 'Rejected matrix input must preserve the data');
    assert.deepEqual(before, algorithm(id).values, 'Input must not mutate in place');
    checks++;
  }
  for (const boundary of ['-2147483648', '2147483647']) {
    assert.equal(run(id, actionId, algorithm(id).values, { value: boundary, second: '0', index: '0' }).ok, true);
    checks++;
  }
}

for (const item of algorithms.filter(item => item.type === 'sort')) {
  const full = Array.from({ length: 100 }, (_, index) => index);
  const result = run(item.id, 'add-end', full, { value: '101' });
  assert.equal(result.ok, false, `${item.id} must reject the 101st item`);
  assert.deepEqual(result.values, full);
  const java = getBeginnerJava(item, 'add-end');
  assert.match(java, /values = new int\[100\]/);
  assert.match(java, /if \(size >= values.length\) return false;/);
  assert.match(getBeginnerCpp(item, 'add-end'), /if \(size >= CAPACITY\) return false;/);
  assert.equal(run(item.id, 'add-end', full.slice(0, 99), { value: '101' }).ok, true);
  checks++;
}

for (const values of [[-2147483648, 2147483647], [4096, 0]]) {
  const before = [...values];
  const result = run('counting-sort', 'sort', values);
  assert.equal(result.ok, false);
  assert.deepEqual(result.values, before);
  assert.deepEqual(values, before);
  assert.equal(result.frames.at(-1).completed, true);
  checks++;
}
const countingBoundary = run('counting-sort', 'sort', [4095, 0]);
assert.equal(countingBoundary.ok, true);
assert.deepEqual(countingBoundary.values, [0, 4095]);
const countingJava = getBeginnerJava(algorithm('counting-sort'), 'sort');
assert.match(countingJava, /long rangeValue = \(long\) max - min \+ 1;/);
assert.match(countingJava, /rangeValue > 4096\) return false;/);
assert.match(countingJava, /new int\[\(int\) rangeValue\]/);
assert.match(getBeginnerCpp(algorithm('counting-sort'), 'sort'), /MAX_COUNT_RANGE = 4096;/);
checks++;

for (const values of [[12, 11], [-1, -2], [-2147483648, 2147483647]]) {
  const result = run('radix-sort', 'sort', values);
  assert.equal(result.ok, true);
  assert.deepEqual(result.values, [...values].sort((first, second) => first - second));
  const minimum = Math.min(...values);
  assert.equal(result.frames.find(frame => frame.sortPhase === 'radix-offset').variables.find(variable => variable.name === 'offset').value, minimum);
  const firstDigits = result.frames.filter(frame => frame.sortPhase === 'radix-digit').slice(0, values.length);
  assert.deepEqual(firstDigits.map(frame => frame.variables.find(variable => variable.name === 'digit').value), values.map(value => (value - minimum) % 10));
  const cpp = getBeginnerCpp(algorithm('radix-sort'), 'sort');
  assert.match(cpp, /long long offset = minimum;/);
  assert.match(cpp, /long long maxKey = static_cast<long long>\(maximum\) - offset;/);
  assert.match(cpp, /long long key = static_cast<long long>\(values\[i\]\) - offset;/);
  for (const frame of result.frames.filter(frame => ['radix-offset', 'radix-maximum', 'radix-exp-loop'].includes(frame.sortPhase))) {
    assert.ok(cpp.includes(cppCodeNeedle('radix-sort', 'sort', frame)));
  }
  checks++;
}

for (const id of ['array', 'deque']) {
  for (const actionId of ['add-start', 'add-end', 'remove-start', 'remove-end']) {
    const before = [5];
    const result = run(id, actionId, before, { value: '9' });
    const frames = createCodeSynchronizedFrames({
      algorithm: algorithm(id), code: getOperationPseudocode(algorithm(id), actionId),
      actionId, beforeValues: before, afterValues: result.values,
      beforeEdges: [], afterEdges: [], finalStep: result.step,
      finalMessage: result.message, succeeded: result.ok, inputValues: { value: '9' },
    });
    assert.deepEqual(frames[0].values, before);
    assert.deepEqual(frames.at(-1).values, result.values);
    assert.ok(frames.every(frame => frame.traceMode === 'summary' && frame.codeLine === null));
    assert.equal(frames.at(-1).completed, true);
    checks++;
  }
}

console.log(`Sort/matrix counterexamples: ${checks} focused checks passed.`);
