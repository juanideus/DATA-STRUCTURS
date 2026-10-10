import assert from 'node:assert/strict';
import { createFibonacciForest } from '../src/logic/fibonacciHeap.js';
import { createMultiwayTree } from '../src/logic/multiwayTree.js';
import { createRedBlackTree } from '../src/logic/redBlackTree.js';
import { formatMerkleHash, merkleHash, merkleLevels } from '../src/logic/merkle.js';
import { initialNaryParents, naryTraversal, removeNarySubtree } from '../src/logic/naryTree.js';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../src/data/beginnerCpp.js';
import { createCodeSynchronizedFrames, createTreeSynchronizedFrames } from '../src/logic/codeAnimation.js';
import { DEFAULT_GRAPH_EDGES, executeOperation } from '../src/logic/operations.js';

const collectMultiway = (root, id) => {
  if (!root.children.length) return [...root.keys];
  const result = [];
  root.keys.forEach((key, index) => {
    result.push(...collectMultiway(root.children[index], id));
    if (id !== 'bplus-tree') result.push(key);
  });
  result.push(...collectMultiway(root.children.at(-1), id));
  return result;
};

for (const id of ['btree', 'bplus-tree', 'bstar-tree']) {
  const initial = [4, 9, 13, 18, 24, 30];
  const model = createMultiwayTree(id, initial);
  let expected = [...initial];
  for (const value of [1, 15, 20, 32, 8, 10, 11, 12, 14, 16, 17, 19, 21]) {
    model.insert(value);
    expected.push(value);
    assert.deepEqual(collectMultiway(model.snapshot().root, id), expected.toSorted((a, b) => a - b), `${id}: insertar ${value}`);
  }
  for (const value of [15, 4, 32, 10]) {
    model.remove(value);
    expected = expected.filter(item => item !== value);
    assert.deepEqual(collectMultiway(model.snapshot().root, id), expected.toSorted((a, b) => a - b), `${id}: eliminar ${value}`);
  }
  const max = id === 'bstar-tree' ? 5 : 3;
  const check = current => {
    assert.ok(current.keys.length <= max, `${id}: nodo excede capacidad`);
    if (current.children.length) {
      assert.equal(current.children.length, current.keys.length + 1, `${id}: cantidad de hijos`);
      current.children.forEach(check);
    }
  };
  check(model.snapshot().root);
}

const forest = createFibonacciForest([3, 7, 18, 24, 31, 39]);
assert.equal(forest.roots.length, 6);
forest.insert(1);
assert.equal(forest.roots.length, 7, 'Insertar no debe consolidar');
const first = forest.extractMinimum();
assert.equal(first.removed, 1);
assert.equal(first.forest.roots.length, 2, 'Después de extraer, grados iguales se consolidan');
assert.equal(first.stages[0].phase, 'promote');
assert.ok(first.stages.some(stage => stage.phase === 'link'), 'La extracción debe mostrar enlaces durante la consolidación');
assert.equal(first.stages.at(-1).phase, 'settled');
assert.deepEqual(forest.all().map(node => node.value).toSorted((a, b) => a - b), [3, 7, 18, 24, 31, 39]);

const redBlack = createRedBlackTree([11, 6, 18, 3, 8, 15, 21]);
redBlack.insert(1);
assert.equal(redBlack.snapshot().values[0], 11, 'Insertar 1 no debe reconstruir la raíz como mediana');
redBlack.remove(6);
assert.equal(redBlack.snapshot().colors[0], 'black');
const checkRedBlack = ({ values, colors, hiddenNode }) => {
  if (hiddenNode) return;
  const visit = (index, minimum, maximum) => {
    const value = values[index];
    if (value === undefined) return 1;
    assert.ok(value > minimum && value < maximum, 'El orden BST debe conservarse');
    if (colors[index] === 'red') {
      assert.notEqual(colors[index * 2 + 1], 'red', 'No puede haber rojos consecutivos');
      assert.notEqual(colors[index * 2 + 2], 'red', 'No puede haber rojos consecutivos');
    }
    const left = visit(index * 2 + 1, minimum, value);
    const right = visit(index * 2 + 2, value, maximum);
    assert.equal(left, right, 'Todas las rutas requieren igual altura negra');
    return left + (colors[index] === 'black' ? 1 : 0);
  };
  if (values.length) assert.equal(colors[0], 'black');
  visit(0, -Infinity, Infinity);
};
for (let shift = 0; shift < 24; shift++) {
  const model = createRedBlackTree([]);
  const sequence = Array.from({ length: 10 }, (_, index) => (index * 7 + shift) % 29);
  sequence.forEach(value => { model.insert(value); checkRedBlack(model.snapshot()); });
  sequence.slice().reverse().forEach(value => { model.remove(value); checkRedBlack(model.snapshot()); });
}

const merkle = merkleLevels(['A', 'B', 'C']);
assert.equal(merkle.at(-1).length, 1);
assert.match(formatMerkleHash(merkle.at(-1)[0].hash), /^0x[0-9A-F]{8}$/);

const naryValues = [1, 2, 3, 4, 5, 6, 7];
const naryParents = initialNaryParents('arbol-nario', naryValues);
assert.equal(naryParents.filter(parent => parent === 0).length, 4);
assert.deepEqual(naryTraversal(naryValues, naryParents, 'preorder'), [1, 2, 6, 7, 3, 4, 5]);
const removedBranch = removeNarySubtree(naryValues, naryParents, 1);
assert.deepEqual(removedBranch.values, [1, 3, 4, 5]);
assert.deepEqual(removedBranch.parents, [-1, 0, 0, 0]);

for (const sourceOf of [getBeginnerJava, getBeginnerCpp]) {
  for (const [id, actionId, fields] of [
    ['hash-table', 'find', { value: 'mar' }],
    ['hash-chaining', 'find', { value: '25' }],
    ['arbol-general', 'find', { value: '15' }],
    ['arbol-nario', 'find', { value: '7' }],
    ['arbol-binario', 'find', { value: '15' }],
    ['trie', 'word-find', { value: 'CASA' }],
    ['segment-tree', 'range-min', { index: '3' }],
  ]) {
    const algorithm = algorithms.find(item => item.id === id);
    const code = sourceOf(algorithm, actionId);
    const result = executeOperation({
      algorithm, actionId, fields, values: algorithm.values,
      edges: DEFAULT_GRAPH_EDGES, initialValues: algorithm.values,
    });
    assert.ok(result.ok, `${id}/${actionId}: el caso de prueba debe tener éxito`);
    const factory = algorithm.category === 'Árboles' ? createTreeSynchronizedFrames : createCodeSynchronizedFrames;
    const frames = factory({
      algorithm, code, actionId,
      beforeValues: algorithm.values, afterValues: result.values,
      beforeEdges: DEFAULT_GRAPH_EDGES, afterEdges: result.edges,
      finalStep: result.step, finalMessage: result.message,
      succeeded: true, inputValues: fields,
      beforeTreeParents: initialNaryParents(id, algorithm.values),
    });
    assert.ok(frames.length > 1, `${id}/${actionId}: faltan pasos`);
    const lastFrame = frames.at(-1);
    if (lastFrame.codeLine === null) {
      assert.equal(lastFrame.traceMode, 'summary', `${id}/${actionId}: una traza sin línea debe identificarse como resumen`);
      assert.ok(frames.every(frame => frame.codeLine === null && frame.iteration == null), `${id}/${actionId}: un resumen no debe inventar instrucciones o iteraciones`);
    } else {
      const lastLine = code.split('\n')[lastFrame.codeLine];
      assert.doesNotMatch(lastLine, /return (?:false|null|nullptr);/, `${id}/${actionId}: terminó en la rama de fracaso`);
    }
    assert.equal(frames.at(-1).completed, true, `${id}/${actionId}: la animación no termina`);
  }
}

assert.equal(merkleHash('á'), 0x3285, 'Merkle debe procesar los dos bytes UTF-8 de á.');
assert.notEqual(merkleHash('😀'), merkleHash('😁'), 'Merkle debe conservar todos los bytes de los caracteres suplementarios.');

console.log('FIDELIDAD DE ESTRUCTURAS OK: B/B+/B*, Fibonacci Heap, rojo-negro, Merkle y N-ario.');
