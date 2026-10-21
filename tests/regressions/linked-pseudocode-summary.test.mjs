import assert from 'node:assert/strict';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { getOperationPseudocode } from '../../src/data/operationPseudocode.js';
import { createLinkedListSynchronizedFrames } from '../../src/logic/codeAnimation.js';
import { executeOperation } from '../../src/logic/operations.js';

const listIds = ['lista-simple', 'lista-doble', 'lista-circular-simple', 'lista-circular-doble'];

function summarize(id, language, actionId, beforeValues, fields = {}) {
  const algorithm = algorithms.find(item => item.id === id);
  const before = [...beforeValues];
  const code = getOperationPseudocode(algorithm, actionId, language);
  const result = executeOperation({
    algorithm, actionId, fields, values: before, edges: [], initialValues: algorithm.values,
  });
  const frames = createLinkedListSynchronizedFrames({
    algorithm, code, codeMode: 'pseudo', actionId,
    beforeValues: before, afterValues: result.values,
    beforeEdges: [], afterEdges: result.edges,
    finalStep: result.step, finalMessage: result.message,
    succeeded: result.ok, inputValues: fields,
  });
  assert.deepEqual(before, beforeValues, 'The operation must not mutate the supplied input');
  assert.equal(frames.length, result.ok ? 2 : 1, 'Success has before/after states; rejection has one preserved state');
  assert.deepEqual(frames[0].values, beforeValues);
  assert.deepEqual(frames.at(-1).values, result.values);
  frames.forEach((frame, index) => {
    assert.equal(frame.traceMode, 'summary');
    assert.equal(frame.codeLine, null, 'Pseudocode must not claim an executable source line');
    assert.equal(frame.completed, index === frames.length - 1);
    assert.equal(frame.variables.find(item => item.name === 'size')?.value, String(frame.values.length));
    assert.equal(frame.variables.find(item => item.name === 'head')?.value, String(frame.values[0] ?? 'null'));
  });
  assert.equal(frames.at(-1).failed, !result.ok);
  assert.equal(frames.at(-1).message, result.message);
  return { result, frames, code };
}

for (const id of listIds) {
  for (const language of ['es', 'en']) {
    test(`${id}/${language}: successful pseudocode mutations keep state, head and size coherent`, () => {
      for (const [actionId, fields, expected] of [
        ['add-start', { value: '9' }, [9, 1, 2]],
        ['add-end', { value: '9' }, [1, 2, 9]],
        ['add-index', { value: '9', index: '1' }, [1, 9, 2]],
        ['remove-start', {}, [2]],
        ['remove-end', {}, [1]],
        ['remove-index', { index: '1' }, [1]],
        ['remove-value', { value: '2' }, [1]],
      ]) {
        const { result, code } = summarize(id, language, actionId, [1, 2], fields);
        assert.equal(result.ok, true, actionId);
        assert.deepEqual(result.values, expected, actionId);
        if (actionId === 'remove-value') {
          assert.equal(code.includes('←'), false, 'The mode argument must cover pseudocode without assignment arrows');
        }
      }
    });

    test(`${id}/${language}: rejected pseudocode mutations preserve the prior structure`, () => {
      for (const [actionId, fields, before] of [
        ['add-start', { value: '2147483648' }, [1, 2]],
        ['add-index', { value: '9', index: '3' }, [1, 2]],
        ['remove-index', { index: '2' }, [1, 2]],
        ['remove-value', { value: '99' }, [1, 2]],
        ['remove-start', {}, []],
        ['remove-end', {}, []],
      ]) {
        const { result } = summarize(id, language, actionId, before, fields);
        assert.equal(result.ok, false, actionId);
        assert.deepEqual(result.values, before, actionId);
      }
    });

    test(`${id}/${language}: clear and singleton removal finish with null head and zero size`, () => {
      for (const before of [[1, 2], []]) {
        const { result } = summarize(id, language, 'clear', before);
        assert.equal(result.ok, true);
        assert.deepEqual(result.values, []);
      }
      const singleton = summarize(id, language, 'remove-value', [2], { value: '2' });
      assert.equal(singleton.result.ok, true);
      assert.deepEqual(singleton.result.values, []);
    });

    test(`${id}/${language}: find preserves values for present, missing and empty cases`, () => {
      for (const [before, value, expectedSuccess] of [
        [[1, 2], '2', true], [[1, 2], '99', false], [[], '2', false],
      ]) {
        const { result } = summarize(id, language, 'find', before, { value });
        assert.equal(result.ok, expectedSuccess);
        assert.deepEqual(result.values, before);
      }
    });
  }
}
