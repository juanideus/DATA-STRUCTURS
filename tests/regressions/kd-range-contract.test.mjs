import assert from 'node:assert/strict';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { executeOperation } from '../../src/logic/operations.js';

const algorithm = algorithms.find(item => item.id === 'kd-tree');

test('KD-Tree rejects out-of-range values for insert, search and delete', () => {
  for (const actionId of ['tree-add', 'find', 'remove-value']) {
    for (const value of ['-1', '100']) {
      const result = executeOperation({ algorithm, actionId, fields: { value }, values: [...algorithm.values], edges: [], initialValues: algorithm.values });
      assert.equal(result.ok, false, `${actionId}: ${value}`);
      assert.deepEqual(result.values, algorithm.values);
    }
    const argument = actionId === 'tree-add' ? 'value' : 'target';
    const condition = new RegExp(`if \\(${argument} < 0 \\|\\| ${argument} > 99\\)`);
    assert.match(getBeginnerJava(algorithm, actionId), condition);
    assert.match(getBeginnerCpp(algorithm, actionId), condition);
  }
});

test('KD-Tree accepts endpoints as valid coordinates', () => {
  for (const value of ['0', '99']) {
    const result = executeOperation({ algorithm, actionId: 'tree-add', fields: { value }, values: [], edges: [], initialValues: algorithm.values });
    assert.equal(result.ok, true, value);
    assert.deepEqual(result.values, [Number(value)]);
  }
});
