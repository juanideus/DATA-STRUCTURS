import assert from 'node:assert/strict';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { educationalDescriptions } from '../src/data/educationalDescriptions.js';
import { guideJavaExamples } from '../src/data/guideJavaExamples.js';
import {
  DEFAULT_GRAPH_EDGES,
  executeOperation,
  getOperationDefinition,
  operationGroup,
} from '../src/logic/operations.js';

const edges = () => DEFAULT_GRAPH_EDGES.map(edge => [...edge]);

function fieldsFor(algorithm, actionId) {
  const first = algorithm.values[0];
  const samples = {
    value: typeof first === 'number' ? '17' : 'NUEVO',
    second: 'VALOR',
    index: '1',
  };

  if (['remove-value', 'find'].includes(actionId)) samples.value = String(first);
  if (actionId === 'sorted-add') samples.value = '99';
  if (['set-index', 'range-update'].includes(actionId)) samples.value = '23';
  if (actionId === 'add-index') samples.index = '1';
  if (['prefix-sum', 'range-min'].includes(actionId)) samples.index = '2';
  if (['set-word', 'word-find', 'remove-word'].includes(actionId)) samples.value = algorithm.id === 'suffix-tree' ? 'ANA' : 'CASA';
  if (['hash-put', 'cache-put'].includes(actionId)) Object.assign(samples, { value: 'NUEVA', second: '42' });
  if (actionId === 'cache-get') samples.value = String(first).split(':')[0];
  if (['bloom-add', 'bloom-check'].includes(actionId)) samples.value = 'hola';
  if (actionId === 'set-expression' || actionId === 'evaluate') samples.value = '8+3*2';
  if (actionId === 'calculate') samples.value = '6';
  if (actionId === 'hanoi-set') samples.value = '4';
  if (algorithm.id === 'n-reinas') samples.value = '4';
  if (actionId === 'union') Object.assign(samples, { value: '1', second: '2' });
  if (actionId === 'find-root') samples.value = '1';
  if (actionId === 'vertex-add') samples.value = 'G';
  if (actionId === 'vertex-remove') samples.value = 'A';
  if (actionId === 'edge-add') Object.assign(samples, { value: 'A', second: 'C', index: '5' });
  if (actionId === 'edge-remove') Object.assign(samples, { value: 'A', second: 'B' });
  if (['bfs-run', 'dfs-run'].includes(actionId)) samples.value = 'A';
  return samples;
}

function run(algorithm, actionId, fields = fieldsFor(algorithm, actionId), values = algorithm.values, graphEdges = edges()) {
  return executeOperation({
    algorithm,
    actionId,
    fields,
    values: [...values],
    edges: graphEdges,
    initialValues: algorithm.values,
  });
}

function validSudoku(board) {
  const expected = '123456789';
  const unit = indexes => indexes.map(index => board[index]).sort().join('') === expected;
  for (let row = 0; row < 9; row++) {
    if (!unit(Array.from({ length: 9 }, (_, column) => row * 9 + column))) return false;
  }
  for (let column = 0; column < 9; column++) {
    if (!unit(Array.from({ length: 9 }, (_, row) => row * 9 + column))) return false;
  }
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxColumn = 0; boxColumn < 3; boxColumn++) {
      const indexes = [];
      for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) {
        indexes.push((boxRow * 3 + row) * 9 + boxColumn * 3 + column);
      }
      if (!unit(indexes)) return false;
    }
  }
  return true;
}

function validQueens(queens) {
  return queens.every((column, row) => queens.every((other, previousRow) => (
    row === previousRow || (column !== other && Math.abs(column - other) !== Math.abs(row - previousRow))
  )));
}

assert.equal(algorithms.length, 51, 'El catálogo debe contener 51 temas.');

let actionCount = 0;
const actionIds = new Set();
for (const algorithm of algorithms) {
  const description = educationalDescriptions[algorithm.id];
  const guideExample = guideJavaExamples[algorithm.id];
  assert.ok(description, `${algorithm.id}: falta descripción educativa.`);
  assert.ok(description.definition.length > 80, `${algorithm.id}: la definición es demasiado breve.`);
  assert.ok(description.how.length > 100, `${algorithm.id}: falta explicar el funcionamiento interno.`);
  assert.ok([description.operations, description.strengths, description.limits, description.uses].every(list => list.length >= 4), `${algorithm.id}: la guía debe incluir al menos cuatro puntos por sección.`);
  assert.ok(guideExample?.title && guideExample?.explanation, `${algorithm.id}: falta presentar el ejemplo Java.`);
  assert.ok(guideExample.code.split('\n').length >= 3, `${algorithm.id}: el ejemplo Java es demasiado corto.`);
  const definition = getOperationDefinition(algorithm);
  assert.ok(definition.fields && definition.actions.length, `${algorithm.id}: faltan controles.`);
  for (const action of definition.actions) {
    actionCount++;
    actionIds.add(action.id);
    const result = run(algorithm, action.id);
    assert.ok(Array.isArray(result.values), `${algorithm.id}/${action.id}: values no es un arreglo.`);
    assert.ok(Array.isArray(result.edges), `${algorithm.id}/${action.id}: edges no es un arreglo.`);
    assert.equal(typeof result.message, 'string', `${algorithm.id}/${action.id}: falta mensaje.`);
    assert.ok(result.message.length > 0, `${algorithm.id}/${action.id}: mensaje vacío.`);
    const java = getBeginnerJava(algorithm, action.id);
    assert.ok(!java.includes('Follow the visual steps'), `${algorithm.id}/${action.id}: falta código Java.`);
  }
}

const sudoku = algorithms.find(item => item.id === 'sudoku');
const sudokuResult = run(sudoku, 'solve');
assert.ok(validSudoku(sudokuResult.values), 'Sudoku: la solución no es válida.');
assert.ok(sudokuResult.frames?.length > 2, 'Sudoku: falta animación paso a paso.');

const queens = algorithms.find(item => item.id === 'n-reinas');
const queensResult = run(queens, 'solve', { value: '8', second: '', index: '' });
assert.ok(validQueens(queensResult.values), 'N-Reinas: la solución contiene conflictos.');
assert.ok(queensResult.frames?.some(frame => frame.codeLine === 25), 'N-Reinas: isSafe no aparece en la animación.');

const maze = algorithms.find(item => item.id === 'laberinto');
const mazeResult = run(maze, 'solve');
assert.equal(mazeResult.values[35], 2, 'Laberinto: la ruta no llega a la salida.');
assert.ok(mazeResult.frames?.some(frame => frame.values.includes(3)), 'Laberinto: no muestra el retroceso.');

const hash = algorithms.find(item => item.id === 'hash-table');
const storedHash = run(hash, 'hash-put', { value: 'curso', second: 'java', index: '' });
const foundHash = run(hash, 'find', { value: 'curso', second: '', index: '' }, storedHash.values);
assert.ok(foundHash.step > 0 && !/no fue/i.test(foundHash.message), 'Hash: no busca una entrada por su clave.');
const removedHash = run(hash, 'remove-value', { value: 'curso', second: '', index: '' }, storedHash.values);
assert.ok(!removedHash.values.some(item => String(item).startsWith('curso:')), 'Hash: no elimina una entrada por su clave.');

const merkle = algorithms.find(item => item.id === 'merkle-tree');
const emptyMerkle = run(merkle, 'clear');
const refilledMerkle = run(merkle, 'add-end', { value: 'BLOQUE', second: '', index: '' }, emptyMerkle.values);
assert.deepEqual(refilledMerkle.values, ['BLOQUE'], 'Merkle: no permite insertar texto después de vaciarse.');

const unionFind = algorithms.find(item => item.id === 'union-find');
let unionValues = run(unionFind, 'union', { value: '0', second: '2', index: '' }).values;
unionValues = run(unionFind, 'union', { value: '2', second: '4', index: '' }, unionValues).values;
const rootResult = run(unionFind, 'find-root', { value: '4', second: '', index: '' }, unionValues);
assert.match(rootResult.message, /es 0/i, 'Union-Find: find no sigue la cadena hasta la raíz real.');

const fibonacciHeap = algorithms.find(item => item.id === 'fibonacci-heap');
const heapInsert = run(fibonacciHeap, 'heap-add', { value: '1', second: '', index: '' });
assert.equal(heapInsert.values[0], 1, 'Fibonacci Heap: la raíz debe representar el mínimo.');

const bplus = algorithms.find(item => item.id === 'bplus-tree');
let bplusValues = [...bplus.values];
let sawBplusPromotion = false;
for (let value = 100; value < 115; value++) {
  const result = run(bplus, 'sorted-add', { value: String(value), second: '', index: '' }, bplusValues);
  bplusValues = result.values;
  sawBplusPromotion ||= result.frames?.some(frame => frame.treePhase === 'promote') ?? false;
}
assert.equal(bplusValues.length, bplus.values.length + 15, 'B+ Tree: debe aceptar al menos 15 inserciones consecutivas.');
assert.ok(sawBplusPromotion, 'B+ Tree: la animacion debe mostrar una clave subiendo al nodo padre.');

const graph = algorithms.find(item => item.id === 'grafo');
const bfsResult = run(graph, 'bfs-run', { value: 'A', second: '', index: '' });
const dfsResult = run(graph, 'dfs-run', { value: 'A', second: '', index: '' });
assert.match(bfsResult.message, /A → B → D → C → E → F/, 'Grafo: BFS no respeta niveles y aristas.');
assert.match(dfsResult.message, /A → B → C → E → D → F/, 'Grafo: DFS no recorre en profundidad.');

const hanoi = algorithms.find(item => item.id === 'hanoi');
const hanoiResult = run(hanoi, 'hanoi-solve');
assert.equal(hanoiResult.frames?.length, 32, 'Hanoi: 5 discos deben producir 31 movimientos más el estado inicial.');
assert.ok(hanoiResult.values.every(disk => disk.rod === 2), 'Hanoi: todos los discos deben terminar en la torre C.');

assert.match(getBeginnerJava(sudoku, 'solve'), /boolean isValid/, 'Sudoku: falta mostrar isValid en Java.');
assert.match(getBeginnerJava(maze, 'solve'), /boolean isFree/, 'Laberinto: falta mostrar isFree en Java.');
assert.match(getBeginnerJava(maze, 'solve'), /boolean isExit/, 'Laberinto: falta mostrar isExit en Java.');

console.log(`AUDITORÍA OK: ${algorithms.length} temas, ${actionCount} acciones y ${actionIds.size} funciones distintas.`);
