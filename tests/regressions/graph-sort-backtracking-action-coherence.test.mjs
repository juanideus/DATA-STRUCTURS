import assert from 'node:assert/strict';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { executeOperation } from '../../src/logic/operations.js';

const algorithm = id => algorithms.find(item => item.id === id);
const run = (id, actionId, values, fields = {}) => executeOperation({
  algorithm: algorithm(id), actionId, fields, values,
  initialValues: algorithm(id).values, edges: [],
});

test('Mezclar permite tanto intercambiar como conservar los dos últimos valores según el azar', () => {
  const previousRandom = Math.random;
  try {
    Math.random = () => 0;
    const swapped = run('bubble-sort', 'shuffle', [1, 2]);
    assert.equal(swapped.ok, true);
    assert.deepEqual(swapped.values, [2, 1]);

    Math.random = () => .999;
    const unchanged = run('bubble-sort', 'shuffle', [1, 2]);
    assert.equal(unchanged.ok, true);
    assert.deepEqual(unchanged.values, [1, 2]);
    const randomFrame = unchanged.frames.find(frame => frame.variables?.some(item => item.name === 'other'));
    assert.equal(randomFrame.variables.find(item => item.name === 'other').value, 1);
  } finally {
    Math.random = previousRandom;
  }
});

test('Resolver y paso a paso rechazan el mismo laberinto sin salida sin anunciar éxito', () => {
  const blocked = algorithm('laberinto').values.map((_, index) => index === 0 ? 0 : 1);
  const solve = run('laberinto', 'solve', blocked);
  const step = run('laberinto', 'step-solution', blocked);
  assert.equal(solve.ok, false);
  assert.equal(step.ok, false);
  assert.equal(step.message, solve.message);
  assert.deepEqual(step.values, blocked);
});
