import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../../src/data/algorithms.js';
import { getOperationPseudocode } from '../../src/data/operationPseudocode.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { executeOperation } from '../../src/logic/operations.js';
import { adaptFramesToCode, createLinkedListSynchronizedFrames } from '../../src/logic/codeAnimation.js';
import { createFibonacciForest } from '../../src/logic/fibonacciHeap.js';
import { runGridPathfinding } from '../../src/logic/pathfindingMap.js';
import { merkleLevels } from '../../src/logic/merkle.js';

const item = id => algorithms.find(algorithm => algorithm.id === id);
const run = (id, actionId, fields = {}, values = item(id).values, edges = []) => executeOperation({
  algorithm: item(id), actionId, fields, values, edges, initialValues: item(id).values,
});
const variable = (frame, name) => frame.variables.find(entry => entry.name === name)?.value;

test('introductory examples and operation pseudocode describe the implemented policies', () => {
  assert.match(item('hash-table').code, /i ← \(i \+ 1\) mod capacidad/);
  assert.match(item('hash-table').code, /actualizar su valor/);
  assert.match(item('matriz').complexity, /O\(F·C\)/);
  assert.match(item('lru-cache').code, /tail/);
  assert.match(item('lru-cache').code, /head/);
  assert.match(getOperationPseudocode(item('bfs'), 'bfs-run'), /marcar vecino como visitado\n\s*encolar vecino/);
  assert.match(getOperationPseudocode(item('hanoi'), 'hanoi-solve'), /si n = 0: retornar/);
  assert.match(getOperationPseudocode(item('prim'), 'prim-run'), /grafo desconectado/);
});

test('pseudocode maps an explicit semantic step and leaves unknown steps unhighlighted', () => {
  const code = getOperationPseudocode(item('bfs'), 'bfs-run');
  const frames = adaptFramesToCode([
    { pseudoStep: 'marcar vecino como visitado' },
    { pseudoStep: 'un paso sin equivalencia' },
  ], code, false);
  assert.equal(code.split('\n')[frames[0].codeLine].trim(), 'marcar vecino como visitado');
  assert.equal(frames[1].codeLine, null);
});

test('C++ tree examples include the string header', () => {
  for (const id of ['trie', 'merkle-tree']) {
    const action = id === 'trie' ? 'set-word' : 'add-end';
    assert.match(getBeginnerCpp(item(id), action), /^#include <string>/);
  }
});

test('heap compares with the old candidate before assigning largest', () => {
  const result = run('heap', 'heap-extract', {}, [42, 29, 31, 14, 18, 7, 11]);
  const comparison = result.frames.find(frame => frame.heapPhase === 'compare-left' && variable(frame, 'condición') === 'true');
  assert.equal(variable(comparison, 'largest'), variable(comparison, 'index'));
  const assignment = result.frames[result.frames.indexOf(comparison) + 1];
  assert.equal(assignment.codeNeedle, 'largest = left;');
  assert.equal(variable(assignment, 'largest'), variable(assignment, 'left'));
});

test('BFS marks a diamond neighbor before enqueue and Prim stops on a disconnected graph', () => {
  const edges = [[0, 1], [0, 2], [1, 3], [2, 3]];
  const bfs = run('bfs', 'bfs-run', { value: 'A' }, ['A', 'B', 'C', 'D'], edges);
  assert.equal(bfs.ok, true);
  assert.equal(bfs.frames.filter(frame => frame.codeNeedle === 'queue[end] = next;' && variable(frame, 'end') === 3).length, 1);
  const prim = run('prim', 'prim-run', { value: 'A' }, ['A', 'B', 'C'], [[0, 1, 1]]);
  assert.equal(prim.ok, false);
  assert.match(prim.message, /no es conexo/);
});

test('non-head list removal highlights the size and return of its executed branch', () => {
  const algorithm = item('lista-simple');
  const code = getBeginnerJava(algorithm, 'remove-index');
  const frames = createLinkedListSynchronizedFrames({ algorithm, code, codeMode: 'java', actionId: 'remove-index',
    beforeValues: [8, 13, 21, 34], afterValues: [8, 13, 34], beforeEdges: [], afterEdges: [],
    finalStep: 2, finalMessage: 'eliminado', inputValues: { index: '2' } });
  const lines = code.split('\n');
  const sizeLines = lines.flatMap((line, index) => line.trim() === 'size--;' ? [index] : []);
  const returnLines = lines.flatMap((line, index) => line.trim() === 'return true;' ? [index] : []);
  assert.equal(frames.findLast(frame => frame.message.startsWith('size disminuye')).codeLine, sizeLines.at(-1));
  assert.equal(frames.at(-1).codeLine, returnLines.at(-1));
});

test('pathfinding exposes each candidate and comparison before relaxation', () => {
  for (const mode of ['dijkstra', 'astar']) {
    const frames = runGridPathfinding({ mode }).frames;
    const relax = frames.findIndex(frame => frame.codePhase === 'relax');
    assert.ok(relax > 1);
    assert.equal(frames[relax - 1].codePhase, 'compare-distance');
    assert.notEqual(variable(frames[relax], 'next'), undefined);
    assert.notEqual(variable(frames[relax], mode === 'astar' ? 'newG' : 'newDistance'), undefined);
  }
});

test('merge and radix writes identify their actual destination', () => {
  const merge = run('merge-sort', 'sort', {}, [2, 1]);
  assert.ok(merge.frames.some(frame => frame.sortWriteTarget === 'help'));
  assert.ok(merge.frames.some(frame => frame.sortWriteTarget === 'values'));
  const radix = run('radix-sort', 'sort', {}, [1, 1, 2]);
  const decrement = radix.frames.find(frame => frame.sortPhase === 'radix-decrement');
  assert.equal(decrement.sortWriteTarget, 'count');
  assert.equal(decrement.sortWriteIndex, variable(decrement, 'digit'));
  assert.ok(radix.frames.some(frame => frame.sortWriteTarget === 'output'));
});

test('Fibonacci extract without children has no fictitious promotion', () => {
  const forest = createFibonacciForest([3, 7, 18, 24, 31, 39]);
  const extraction = forest.extractMinimum();
  assert.equal(extraction.stages[0].phase, 'detach');
  assert.ok(!extraction.stages.some(stage => stage.phase === 'promote'));
});

test('Merkle teaching hash collides for distinct accepted blocks', () => {
  assert.equal(merkleLevels(['Aa']).at(-1)[0].hash, merkleLevels(['BB']).at(-1)[0].hash);
});

test('sparse C++ removal frees the disconnected node before decrementing the count', () => {
  const result = run('matriz-dispersa', 'matrix-remove', { second: '0', index: '4' });
  const frames = result.frames.filter(frame => frame.codeNeedle === 'previousColumn.up = target.up;'
    || frame.codeNeedle === 'delete target;' || frame.codeNeedle === 'nonZeroCount--;');
  assert.deepEqual(frames.map(frame => frame.codeNeedle),
    ['previousColumn.up = target.up;', 'delete target;', 'nonZeroCount--;']);
  assert.deepEqual(frames.map(frame => variable(frame, 'noCeros')), [10, 10, 9]);
});
