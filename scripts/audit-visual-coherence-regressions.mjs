import assert from 'node:assert/strict';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../src/data/beginnerCpp.js';
import { graphEdgesFor } from '../src/data/graphDesigns.js';
import { getOperationPseudocode } from '../src/data/operationPseudocode.js';
import { adaptFramesToCode, createTreeSynchronizedFrames } from '../src/logic/codeAnimation.js';
import { graphAnnotations } from '../src/logic/graphAnnotations.js';
import { createMultiwayTree } from '../src/logic/multiwayTree.js';
import { executeOperation, getOperationDefinition } from '../src/logic/operations.js';

const algorithm = id => algorithms.find(item => item.id === id);
const run = (id, actionId, fields, values = algorithm(id).values, extras = {}) => executeOperation({
  algorithm: algorithm(id), actionId, fields, values, initialValues: algorithm(id).values,
  edges: [], ...extras,
});

// Starting a traversal away from A must not retain the decorative seed levels.
const bfs = algorithm('bfs');
const bfsEdges = graphEdgesFor('bfs');
const bfsResult = run('bfs', 'bfs-run', { value: 'F' }, bfs.values, { edges: bfsEdges });
assert.equal(bfsResult.ok, true);
const bfsInitial = graphAnnotations({ values: bfs.values, edges: bfsEdges, state: bfsResult.frames[0].graphState });
assert.equal(bfsInitial.origin, 5);
assert.equal(bfsInitial.labels[5], 'nivel 0');
assert.equal(bfsInitial.labels[0], 'sin descubrir');
const bfsFinal = graphAnnotations({ values: bfs.values, edges: bfsEdges, state: bfsResult.frames.at(-1).graphState });
assert.deepEqual(bfsFinal.labels, ['nivel 1', 'nivel 2', 'nivel 2', 'nivel 2', 'nivel 2', 'nivel 0']);
assert.equal(graphAnnotations({ values: bfs.values, edges: bfsEdges, state: bfsResult.frames.at(-1).graphState, language: 'en' }).labels[5], 'level 0');

// Prim's start, frontier, and selected vertices come from its actual trace.
const prim = algorithm('prim');
const primEdges = graphEdgesFor('prim');
const primResult = run('prim', 'prim-run', { value: 'D' }, prim.values, { edges: primEdges });
assert.equal(primResult.ok, true);
const primFirstSelection = primResult.frames.find(frame => frame.graphState.treeVertices.length === 1);
assert.deepEqual(primFirstSelection.graphState.treeVertices, [3]);
const primLabels = graphAnnotations({ values: prim.values, edges: primEdges, state: primFirstSelection.graphState, language: 'en' });
assert.equal(primLabels.origin, 3);
assert.equal(primLabels.labels[3], 'start');
assert.equal(primLabels.labels[0], 'frontier');
assert.equal(primLabels.labels[4], 'frontier');
assert.equal(primLabels.labels[5], 'outside');
const primFinal = graphAnnotations({ values: prim.values, edges: primEdges, state: primResult.frames.at(-1).graphState });
assert.ok(primFinal.labels.every((label, index) => label === (index === 3 ? 'inicio' : 'en árbol')));

// A Segment Tree frame identifies a real node range, not an unrelated leaf.
const segment = algorithm('segment-tree');
const nodeRanges = new Set();
const collectRanges = (left, right) => {
  nodeRanges.add(`${left}:${right}`);
  if (left === right) return;
  const middle = Math.floor((left + right) / 2);
  collectRanges(left, middle);
  collectRanges(middle + 1, right);
};
collectRanges(0, segment.values.length - 1);
for (const actionId of ['prefix-sum', 'range-min']) {
  for (const [language, codeFactory] of [['Java', getBeginnerJava], ['C++', getBeginnerCpp]]) {
    const fields = { index: '2' };
    const result = run('segment-tree', actionId, fields);
    assert.equal(result.ok, true);
    const code = codeFactory(segment, actionId);
    const frames = createTreeSynchronizedFrames({
      algorithm: segment, code, actionId, beforeValues: segment.values, afterValues: result.values,
      beforeEdges: [], afterEdges: [], finalStep: result.step, finalMessage: result.message,
      succeeded: result.ok, inputValues: fields,
    });
    assert.ok(frames.length > 3, `${language}/${actionId} must trace a partial range query`);
    assert.deepEqual(frames[0].segmentRange, [0, segment.values.length - 1]);
    for (const frame of frames) {
      assert.ok(Array.isArray(frame.segmentRange), `${language}/${actionId}: missing segmentRange`);
      assert.ok(nodeRanges.has(frame.segmentRange.join(':')), `${language}/${actionId}: not a real node range`);
      assert.ok(frame.codeLine >= 0 && frame.codeLine < code.split('\n').length);
    }
    const adapted = adaptFramesToCode(frames, code, true);
    assert.deepEqual(adapted.map(frame => frame.segmentRange), frames.map(frame => frame.segmentRange));
    const expected = actionId === 'prefix-sum'
      ? segment.values.slice(0, 3).reduce((sum, value) => sum + value, 0)
      : Math.min(...segment.values.slice(0, 3));
    assert.equal(frames.at(-1).variables.find(item => item.name === 'resultado parcial')?.value, expected);
    assert.equal(frames.at(-1).completed, true);
  }
}

// Exercise the two distinct B* splits through both the model and operation API.
const bstar = createMultiwayTree('bstar-tree');
const inserted = [];
const observedStrategies = new Set();
for (let key = 1; key <= 12; key++) {
  const before = bstar.snapshot();
  const modeled = bstar.insert(key);
  const split = modeled.events.find(event => event.type === 'split');
  const result = run('bstar-tree', 'sorted-add', { value: String(key) }, [...inserted], { multiwayTree: before });
  assert.equal(result.ok, true);
  assert.deepEqual(result.multiwayTree, modeled.tree);
  if (split) {
    observedStrategies.add(split.strategy);
    const frame = result.frames.find(item => item.treePhase === 'split');
    assert.ok(frame, `B* split ${split.strategy} must have a frame`);
    assert.match(frame.message, /5 claves/);
    assert.doesNotMatch(frame.message, /3 claves/);
    assert.match(frame.messageEn, /5 keys/);
    if (split.strategy === 'root-split') {
      assert.match(frame.message, /raíz B\*/);
      assert.match(frame.messageEn, /new root with two children/);
    } else if (split.strategy === 'two-to-three') {
      assert.match(frame.message, /Dos nodos B\*.*en tres/);
      assert.match(frame.messageEn, /Two full B\* nodes.*into three/);
    }
  }
  inserted.push(key);
}
assert.deepEqual([...observedStrategies].sort(), ['root-split', 'two-to-three']);

// Specialized pseudocode must retain each implementation's actual contract.
for (const language of ['es', 'en']) {
  const pseudo = (id, action) => getOperationPseudocode(algorithm(id), action, language);
  assert.match(pseudo('segment-tree', 'range-update'), /64 bits/);
  assert.match(pseudo('segment-tree', 'prefix-sum'), /64 bits|64-bit/);
  assert.match(pseudo('segment-tree', 'range-min'), /2147483647/);
  assert.match(pseudo('fenwick-tree', 'range-update'), /rechazar sin modificar|reject without changing/);
  assert.match(pseudo('fenwick-tree', 'prefix-sum'), /index & -index/);
  assert.match(pseudo('fenwick-tree', 'range-min'), /lineal no usa bit|linear query does not use bit/);
  const transpose = pseudo('matriz', 'matrix-transpose');
  assert.match(transpose, /row \+ 1/);
  assert.doesNotMatch(transpose, /crear matriz|create matrix/);
  const row = pseudo('matriz', 'matrix-row');
  assert.match(row, /values\[row\]\[column\]/);
  assert.doesNotMatch(row, /AROW/);
  const fibInsert = pseudo('fibonacci-heap', 'heap-add');
  assert.match(fibInsert, /minimum/);
  assert.match(fibInsert, /circular/);
  assert.doesNotMatch(fibInsert, /última hoja|last leaf|intercambiar|swap/);
  const fibExtract = pseudo('fibonacci-heap', 'heap-extract');
  assert.match(fibExtract, /mismo grado|equal degree/);
  for (const id of ['btree', 'bstar-tree']) {
    const range = pseudo(id, 'range-view');
    assert.match(range, /inorden|in order/);
    assert.match(range, /claves internas|internal keys/);
    assert.equal(getOperationDefinition(algorithm(id)).actions.find(item => item.id === 'range-view').label, 'Recorrer claves');
  }
  assert.equal(getOperationDefinition(algorithm('bplus-tree')).actions.find(item => item.id === 'range-view').label, 'Recorrer hojas');
  assert.match(pseudo('suffix-tree', 'word-find'), /aunque no termine|even if it does not end/);
  for (const id of ['arbol-general', 'arbol-nario']) {
    const insert = pseudo(id, 'tree-add');
    assert.match(insert, /padre|parent/);
    assert.match(insert, /no ordenar|do not sort/);
  }
  assert.match(pseudo('arbol-nario', 'tree-add'), /4/);
  assert.match(pseudo('arbol-binario', 'tree-add'), /niveles|levels/);
  assert.match(pseudo('arbol-binario', 'tree-add'), /no es un BST|not a BST/);
  assert.match(pseudo('lru-cache', 'cache-put'), /tail/);
  assert.match(pseudo('lru-cache', 'cache-put'), /head/);
  assert.match(pseudo('lru-cache', 'cache-get'), /cadena vacía|empty string/);
}

console.log('Visual coherence: graph annotations, Java/C++ segment ranges, both B* split strategies and specialized pseudocode passed.');
