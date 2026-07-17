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
import {
  adaptFramesToCode,
  buildCodeExecutionTrace,
  createCodeSynchronizedFrames,
  estimateLoopIterations,
} from '../src/logic/codeAnimation.js';
import { DEFAULT_PATH_MAP } from '../src/logic/pathfindingMap.js';

const edges = () => DEFAULT_GRAPH_EDGES.map(edge => [...edge]);
const mojibake = /Ã|â€|â†|�/;

function balanced(source, opening, closing) {
  let depth = 0;
  for (const character of source) {
    if (character === opening) depth++;
    if (character === closing) depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function fieldsFor(algorithm, actionId, trial = 0) {
  const length = Math.max(1, algorithm.values.length);
  const first = algorithm.values[trial % length] ?? algorithm.values[0];
  const samples = {
    value: typeof first === 'number' ? String(70 + trial) : `NUEVO${trial}`,
    second: `VALOR${trial}`,
    index: String(trial % length),
  };

  if (['remove-value', 'find'].includes(actionId)) samples.value = String(first);
  if (actionId === 'sorted-add') samples.value = String(90 + trial);
  if (['set-index', 'range-update'].includes(actionId)) samples.value = String(23 + trial);
  if (actionId === 'add-index') samples.index = String(trial % (algorithm.values.length + 1));
  if (['prefix-sum', 'range-min'].includes(actionId)) samples.index = String(trial % length);
  if (actionId === 'set-word') samples.value = algorithm.id === 'suffix-tree' ? `CASA${trial}` : `NODO${trial}`;
  if (['word-find', 'remove-word'].includes(actionId)) samples.value = algorithm.id === 'suffix-tree' ? 'ANA' : String(first);
  if (['hash-put', 'cache-put'].includes(actionId)) Object.assign(samples, { value: `NUEVA${trial}`, second: String(42 + trial) });
  if (actionId === 'cache-get') samples.value = String(first).split(':')[0];
  if (['bloom-add', 'bloom-check'].includes(actionId)) samples.value = `hola${trial}`;
  if (actionId === 'set-expression' || actionId === 'evaluate') samples.value = '8+3*2';
  if (actionId === 'calculate') samples.value = String(trial % 10);
  if (actionId === 'hanoi-set') samples.value = String(1 + (trial % 7));
  if (algorithm.id === 'n-reinas') samples.value = String(4 + (trial % 5));
  if (actionId === 'union') Object.assign(samples, { value: String(trial % length), second: String((trial + 1) % length) });
  if (actionId === 'find-root') samples.value = String(trial % length);
  if (actionId === 'vertex-add') samples.value = String.fromCharCode(71 + trial);
  if (actionId === 'vertex-remove') samples.value = String(first);
  if (actionId === 'edge-add') Object.assign(samples, { value: 'A', second: 'C', index: '5' });
  if (actionId === 'edge-remove') Object.assign(samples, { value: 'A', second: 'B' });
  if (['bfs-run', 'dfs-run'].includes(actionId)) samples.value = String(first);
  if (actionId === 'shortest-path') Object.assign(samples, { value: String(algorithm.values[0]), second: String(algorithm.values.at(-1)), index: '' });
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

assert.equal(algorithms.length, 52, 'El catálogo debe contener 52 temas.');
assert.equal(new Set(algorithms.map(algorithm => algorithm.id)).size, algorithms.length, 'El catálogo contiene identificadores duplicados.');
assert.equal(new Set(algorithms.map(algorithm => algorithm.name)).size, algorithms.length, 'El catálogo contiene nombres duplicados.');
assert.equal(Object.keys(educationalDescriptions).length, algorithms.length, 'La cantidad de descripciones no coincide con el catálogo.');
assert.equal(Object.keys(guideJavaExamples).length, algorithms.length, 'La cantidad de ejemplos Java no coincide con el catálogo.');

let actionCount = 0;
let executionCount = 0;
const actionIds = new Set();
for (const algorithm of algorithms) {
  assert.ok(algorithm.id && algorithm.name && algorithm.category && algorithm.type, `${algorithm.id || '(sin id)'}: faltan datos principales.`);
  assert.ok(algorithm.complexity.length >= 4, `${algorithm.id}: falta indicar una complejidad útil.`);
  assert.ok(algorithm.description.length >= 45, `${algorithm.id}: el resumen principal es demasiado breve.`);
  assert.ok(algorithm.code.split('\n').length >= 2, `${algorithm.id}: falta pseudocódigo.`);
  assert.ok(Array.isArray(algorithm.values) && algorithm.values.length > 0, `${algorithm.id}: falta un ejemplo inicial.`);
  assert.ok(!mojibake.test(`${algorithm.name} ${algorithm.description} ${algorithm.code}`), `${algorithm.id}: contiene texto mal codificado.`);
  const description = educationalDescriptions[algorithm.id];
  const guideExample = guideJavaExamples[algorithm.id];
  assert.ok(description, `${algorithm.id}: falta descripción educativa.`);
  assert.ok(description.definition.length > 80, `${algorithm.id}: la definición es demasiado breve.`);
  assert.ok(description.how.length > 100, `${algorithm.id}: falta explicar el funcionamiento interno.`);
  assert.ok([description.operations, description.strengths, description.limits, description.uses].every(list => list.length >= 4), `${algorithm.id}: la guía debe incluir al menos cuatro puntos por sección.`);
  assert.ok([description.operations, description.strengths, description.limits, description.uses].flat().every(item => item.trim().length >= 3), `${algorithm.id}: una lista educativa contiene un punto vacío o incompleto.`);
  assert.ok(!mojibake.test(Object.values(description).flat().join(' ')), `${algorithm.id}: la descripción contiene texto mal codificado.`);
  assert.ok(guideExample?.title && guideExample?.explanation, `${algorithm.id}: falta presentar el ejemplo Java.`);
  assert.ok(guideExample.code.split('\n').length >= 3, `${algorithm.id}: el ejemplo Java es demasiado corto.`);
  assert.ok(!mojibake.test(`${guideExample.title} ${guideExample.explanation} ${guideExample.code}`), `${algorithm.id}: el ejemplo Java contiene texto mal codificado.`);
  const definition = getOperationDefinition(algorithm);
  assert.ok(definition.fields && definition.actions.length, `${algorithm.id}: faltan controles.`);
  assert.equal(new Set(definition.fields.map(item => item.id)).size, definition.fields.length, `${algorithm.id}: hay campos duplicados.`);
  assert.equal(new Set(definition.actions.map(item => item.id)).size, definition.actions.length, `${algorithm.id}: hay acciones duplicadas.`);
  for (const action of definition.actions) {
    actionCount++;
    actionIds.add(action.id);
    const java = getBeginnerJava(algorithm, action.id);
    assert.ok(!java.includes('Follow the visual steps'), `${algorithm.id}/${action.id}: falta código Java.`);
    assert.ok(java.split('\n').length >= 3, `${algorithm.id}/${action.id}: el código Java es demasiado breve.`);
    assert.ok(balanced(java, '{', '}'), `${algorithm.id}/${action.id}: el código Java tiene llaves desbalanceadas.`);
    assert.ok(balanced(java, '(', ')'), `${algorithm.id}/${action.id}: el código Java tiene paréntesis desbalanceados.`);
    assert.ok(balanced(java, '[', ']'), `${algorithm.id}/${action.id}: el código Java tiene corchetes desbalanceados.`);
    assert.ok(!mojibake.test(java), `${algorithm.id}/${action.id}: el código Java contiene texto mal codificado.`);
    for (let trial = 0; trial < 10; trial++) {
      executionCount++;
      const initialValues = [...algorithm.values];
      const initialEdges = edges();
      const result = run(algorithm, action.id, fieldsFor(algorithm, action.id, trial), initialValues, initialEdges);
      const label = `${algorithm.id}/${action.id}/prueba-${trial + 1}`;
      assert.ok(Array.isArray(result.values), `${label}: values no es un arreglo.`);
      assert.ok(Array.isArray(result.edges), `${label}: edges no es un arreglo.`);
      assert.equal(typeof result.message, 'string', `${label}: falta mensaje.`);
      assert.ok(result.message.length > 0, `${label}: mensaje vacío.`);
      assert.equal(typeof result.ok, 'boolean', `${label}: no informa si la operación tuvo éxito.`);

      const usesCustomFrames = Boolean(result.frames?.length);
      if (usesCustomFrames) {
        const javaLineCount = java.split('\n').length;
        assert.ok(result.frames.every(frame => Number.isInteger(frame.codeLine) && frame.codeLine >= 0 && frame.codeLine < javaLineCount), `${label}: un fotograma apunta fuera del código Java.`);
      }
      const frames = usesCustomFrames
        ? adaptFramesToCode(result.frames, java, true)
        : createCodeSynchronizedFrames({
            code: java,
            actionId: action.id,
            beforeValues: initialValues,
            afterValues: result.values,
            beforeEdges: initialEdges,
            afterEdges: result.edges,
            finalStep: result.step,
            finalMessage: result.message,
            succeeded: result.ok,
          });
      assert.ok(frames.length > 0, `${label}: no genera fotogramas.`);
      assert.ok(frames.every(frame => Array.isArray(frame.values)), `${label}: un fotograma no contiene values.`);
      assert.ok(frames.every(frame => Number.isInteger(frame.codeLine)), `${label}: una línea de código no está sincronizada.`);
      assert.ok(frames.every(frame => typeof frame.message === 'string' && frame.message.length > 0), `${label}: un fotograma no explica lo que ocurre.`);
      assert.deepEqual(frames.at(-1).values, result.values, `${label}: el último fotograma no coincide con el resultado.`);

      if (!usesCustomFrames) {
        assert.deepEqual(frames.at(-1).edges, result.edges, `${label}: las aristas finales no coinciden.`);
        if (!result.ok) assert.equal(frames.length, 1, `${label}: un error no debe reproducir una animación falsa.`);

        const firstLoopLine = java.split('\n').findIndex(line => /\b(?:for|while)\s*\(/.test(line));
        const iterations = estimateLoopIterations({
          actionId: action.id,
          beforeValues: initialValues,
          afterValues: result.values,
          finalStep: result.step,
          finalMessage: result.message,
        });
        if (result.ok && firstLoopLine >= 0 && iterations > 1) {
          assert.ok(frames.filter(frame => frame.codeLine === firstLoopLine).length >= 2, `${label}: el ciclo no vuelve a su condición.`);
        }
      }
    }
  }
}

const loopExample = algorithms.find(item => item.id === 'array');
const loopCode = getBeginnerJava(loopExample, 'add-start');
const loopIterations = loopExample.values.length;
const loopTrace = buildCodeExecutionTrace(loopCode, loopIterations);
const loopLine = loopCode.split('\n').findIndex(line => /\bfor\s*\(/.test(line));
assert.ok(loopTrace.filter(frame => frame.index === loopLine).length >= loopIterations, 'Motor visual: el for no repite su condición en cada iteración.');

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

for (const algorithmId of ['dijkstra', 'a-star']) {
  const pathAlgorithm = algorithms.find(item => item.id === algorithmId);
  const pathResult = run(pathAlgorithm, 'shortest-path');
  const finalState = pathResult.frames?.at(-1)?.mapState;
  assert.equal(pathResult.ok, true, `${pathAlgorithm.name}: no encuentra una ruta existente.`);
  assert.ok(Number.isFinite(pathResult.cost), `${pathAlgorithm.name}: el costo de la ruta debe ser finito.`);
  assert.deepEqual([pathResult.path[0], pathResult.path.at(-1)], [DEFAULT_PATH_MAP.start, DEFAULT_PATH_MAP.goal], `${pathAlgorithm.name}: la ruta debe unir el inicio y la meta del mapa.`);
  assert.ok(pathResult.frames?.length > 4, `${pathAlgorithm.name}: falta animación paso a paso.`);
  assert.deepEqual(finalState?.path, pathResult.path, `${pathAlgorithm.name}: la ruta final no resalta todas sus casillas.`);
  const visibleClosedCounts = new Set(pathResult.frames.map(frame => frame.mapState.closed.length));
  for (let closedCount = 0; closedCount <= finalState.closed.length; closedCount++) {
    assert.ok(visibleClosedCounts.has(closedCount), `${pathAlgorithm.name}: falta mostrar el estado con ${closedCount} casillas exploradas.`);
  }
  for (let frameIndex = 1; frameIndex < pathResult.frames.length; frameIndex++) {
    const previousClosed = pathResult.frames[frameIndex - 1].mapState.closed.length;
    const currentClosed = pathResult.frames[frameIndex].mapState.closed.length;
    assert.ok(currentClosed - previousClosed <= 1, `${pathAlgorithm.name}: la animación salta varias casillas en un solo cuadro.`);
  }
  assert.ok(new Set(pathResult.frames.map(frame => frame.codeLine)).size >= 5, `${pathAlgorithm.name}: el código debe avanzar por las fases de selección, visita, vecinos y resultado.`);
  assert.ok(pathResult.frames.some(frame => frame.variables?.some(variable => variable.name === (algorithmId === 'a-star' ? 'prioridad f' : 'distancia g'))), `${pathAlgorithm.name}: faltan variables educativas.`);
  assert.match(getBeginnerJava(pathAlgorithm, 'shortest-path'), /int\[\] map/, `${pathAlgorithm.name}: el código Java debe recorrer el mismo mapa cuadriculado.`);
}

const hanoi = algorithms.find(item => item.id === 'hanoi');
const hanoiResult = run(hanoi, 'hanoi-solve');
assert.equal(hanoiResult.frames?.length, 32, 'Hanoi: 5 discos deben producir 31 movimientos más el estado inicial.');
assert.ok(hanoiResult.values.every(disk => disk.rod === 2), 'Hanoi: todos los discos deben terminar en la torre C.');

assert.match(getBeginnerJava(sudoku, 'solve'), /boolean isValid/, 'Sudoku: falta mostrar isValid en Java.');
assert.match(getBeginnerJava(maze, 'solve'), /boolean isFree/, 'Laberinto: falta mostrar isFree en Java.');
assert.match(getBeginnerJava(maze, 'solve'), /boolean isExit/, 'Laberinto: falta mostrar isExit en Java.');

console.log(`AUDITORÍA OK: ${algorithms.length} temas, ${actionCount} acciones, ${executionCount} pruebas funcionales y ${actionIds.size} funciones distintas.`);
