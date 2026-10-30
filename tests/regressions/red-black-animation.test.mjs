import assert from 'node:assert/strict';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getOperationPseudocode } from '../../src/data/operationPseudocode.js';
import { createRedBlackTree } from '../../src/logic/redBlackTree.js';
import { executeOperation } from '../../src/logic/operations.js';
import { adaptFramesToCode } from '../../src/logic/codeAnimation.js';
import { hasValidFrameSourceReference } from '../../scripts/frame-source-contract.mjs';

const algorithm = algorithms.find(item => item.id === 'rojo-negro');
const run = (seed, actionId, value) => {
  const before = createRedBlackTree(seed).snapshot();
  return executeOperation({ algorithm, actionId, fields: { value }, values: before.values,
    treeColors: before.colors, edges: [], initialValues: algorithm.values });
};

for (const [label, seed, value, directions] of [
  ['LL', [10, 5], 1, ['right']], ['RR', [10, 15], 20, ['left']],
  ['LR', [10, 5], 7, ['left', 'right']], ['RL', [10, 15], 13, ['right', 'left']],
]) test(`Red-black ${label} insertion has actual intermediate rotations and exact source lines`, () => {
  const result = run(seed, 'tree-add', value);
  assert.equal(result.ok, true);
  assert.deepEqual(result.frames.filter(frame => frame.redBlackEvent.kind === 'rotation')
    .map(frame => frame.redBlackEvent.direction), directions);
  assert.ok(result.frames.length > 2);
  assert.deepEqual(result.frames.at(-1).values, result.values);
  for (const [mode, code] of [
    ['java', getBeginnerJava(algorithm, 'tree-add')], ['cpp', getBeginnerCpp(algorithm, 'tree-add')],
    ['pseudo', getOperationPseudocode(algorithm, 'tree-add', 'es')], ['pseudo', getOperationPseudocode(algorithm, 'tree-add', 'en')],
  ]) {
    if (mode !== 'pseudo') assert.ok(result.frames.every(frame => hasValidFrameSourceReference(frame, code)));
    const frames = adaptFramesToCode(result.frames, code, mode !== 'pseudo');
    assert.ok(frames.every(frame => Number.isInteger(frame.codeLine) && !frame.codeUnmapped));
  }
});

test('Red-black recoloring changes colors without requiring a values change', () => {
  const frames = run([10, 5, 15], 'tree-add', 1).frames;
  assert.ok(frames.some((frame, index) => index > 0
    && JSON.stringify(frame.values) === JSON.stringify(frames[index - 1].values)
    && JSON.stringify(frame.treeColors) !== JSON.stringify(frames[index - 1].treeColors)));
});

test('Red-black intermediate fifth-level nodes remain present before rotation', () => {
  const result = run([1, 2, 3, 4, 5, 6, 7], 'tree-add', 8);
  const linked = result.frames.find(frame => frame.redBlackEvent.kind === 'link');
  assert.equal(linked.values.filter(value => value !== undefined).length, 8);
  assert.ok(linked.values.length > 15);
  assert.equal(linked.redBlackLayout.extended, true);
  assert.ok(result.values.length <= 15);
});

for (const actionId of ['find', 'remove-value', 'preorder', 'inorder', 'postorder']) {
  test(`Red-black ${actionId} is synchronized in all displayed formats`, () => {
    const result = run([20, 10, 30, 25, 40, 22], actionId, 20);
    assert.ok(result.frames.length > 2);
    assert.deepEqual(result.frames.at(-1).values, result.values);
    for (const [mode, code] of [
      ['java', getBeginnerJava(algorithm, actionId)], ['cpp', getBeginnerCpp(algorithm, actionId)],
      ['pseudo', getOperationPseudocode(algorithm, actionId, 'es')], ['pseudo', getOperationPseudocode(algorithm, actionId, 'en')],
    ]) assert.ok(adaptFramesToCode(result.frames, code, mode !== 'pseudo')
      .every(frame => Number.isInteger(frame.codeLine) && !frame.codeUnmapped));
  });
}

test('Red-black unknown events cannot bypass the raw source-reference contract', () => {
  assert.equal(hasValidFrameSourceReference({ redBlackEvent: { codeKey: 'unknown' } }, 'void run() {}'), false);
});
