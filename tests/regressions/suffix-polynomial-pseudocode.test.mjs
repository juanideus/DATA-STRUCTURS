import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getOperationPseudocode } from '../../src/data/operationPseudocode.js';
import { adaptFramesToCode } from '../../src/logic/codeAnimation.js';
import { cppCodeNeedle } from '../../src/logic/cppCodeNeedles.js';
import { executeOperation } from '../../src/logic/operations.js';

const findAlgorithm = id => algorithms.find(item => item.id === id);

test('zero-coefficient return highlights the actual C++ early return for both polynomials', () => {
  const algorithm = findAlgorithm('polinomios');
  for (const actionId of ['poly-insert-a', 'poly-insert-b']) {
    const result = executeOperation({ algorithm, actionId, fields: { value: '0', index: '5' }, values: algorithm.values, edges: [], initialValues: algorithm.values, initialEdges: [] });
    assert.equal(result.ok, true);
    const code = getBeginnerCpp(algorithm, actionId);
    const mapped = result.frames.map(frame => ({ ...frame, codeNeedle: cppCodeNeedle(algorithm.id, actionId, frame) ?? frame.codeNeedle }));
    const frames = adaptFramesToCode(mapped, code, true);
    const final = frames.at(-1);
    assert.equal(final.codeNeedle, 'if (coefficient == 0) return;');
    assert.equal(code.split('\n')[final.codeLine].trim(), 'if (coefficient == 0) return;');
    assert.notEqual(final.codeUnmapped, true);
  }
});

test('suffix deletion pseudocode describes removing the first occurrence and rebuilding the trie', () => {
  const algorithm = findAlgorithm('suffix-tree');
  const es = getOperationPseudocode(algorithm, 'remove-word', 'es');
  const en = getOperationPseudocode(algorithm, 'remove-word', 'en');
  assert.match(es, /primera aparición/);
  assert.match(es, /reconstruir el trie/);
  assert.match(en, /first occurrence/);
  assert.match(en, /rebuild the trie/);
  assert.doesNotMatch(es, /desmarcar/);
});
