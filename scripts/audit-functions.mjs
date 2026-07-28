import assert from 'node:assert/strict';
import { algorithms } from '../src/data/algorithms.js';
import { completeJavaSnippet, getBeginnerJava } from '../src/data/beginnerJava.js';
import { educationalDescriptions } from '../src/data/educationalDescriptions.js';
import { GRAPH_DESIGNS, graphEdgesFor, graphPositionsFor } from '../src/data/graphDesigns.js';
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
  createTreeSynchronizedFrames,
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

function missingJavaMethods(source) {
  const cleanSource = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  const classNames = new Set(
    [...cleanSource.matchAll(/\bclass\s+([A-Za-z_]\w*)/g)].map(match => match[1]),
  );
  const definitions = new Set(
    [...cleanSource.matchAll(/(?:^|\n)\s*(?:(?:public|private|protected|static|final|synchronized)\s+)*(?:[\w<>\[\],?]+\s+)+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/g)]
      .map(match => match[1]),
  );
  const languageWords = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'new', 'throw', 'super', 'this']);
  const calls = new Set();
  for (const match of cleanSource.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)) {
    const name = match[1];
    const prefix = cleanSource.slice(Math.max(0, match.index - 6), match.index);
    const previousCharacter = cleanSource[match.index - 1];
    if (languageWords.has(name) || classNames.has(name) || previousCharacter === '.' || /\bnew\s+$/.test(prefix)) continue;
    calls.add(name);
  }
  return [...calls].filter(name => !definitions.has(name)).sort();
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
  if (algorithm.id === 'matriz-dispersa') {
    const cell = algorithm.values[trial % algorithm.values.length];
    Object.assign(samples, {
      value: String(actionId === 'matrix-insert' ? 30 + trial : cell.value),
      second: String(actionId === 'matrix-row' ? trial % 5 : cell.row),
      index: String(actionId === 'matrix-column' ? trial % 6 : cell.column),
    });
  }
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

assert.equal(algorithms.length, 53, 'El catálogo debe contener 53 temas.');
assert.equal(new Set(algorithms.map(algorithm => algorithm.id)).size, algorithms.length, 'El catálogo contiene identificadores duplicados.');
assert.equal(new Set(algorithms.map(algorithm => algorithm.name)).size, algorithms.length, 'El catálogo contiene nombres duplicados.');
assert.equal(Object.keys(educationalDescriptions).length, algorithms.length, 'La cantidad de descripciones no coincide con el catálogo.');
assert.equal(Object.keys(guideJavaExamples).length, algorithms.length, 'La cantidad de ejemplos Java no coincide con el catálogo.');

let actionCount = 0;
let executionCount = 0;
const actionIds = new Set();
const incompleteJavaSnippets = [];
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
  const completeGuideCode = completeJavaSnippet(guideExample.code, algorithm.id);
  assert.ok(balanced(completeGuideCode, '{', '}'), `${algorithm.id}/guía: el código Java tiene llaves desbalanceadas.`);
  assert.ok(balanced(completeGuideCode, '(', ')'), `${algorithm.id}/guía: el código Java tiene paréntesis desbalanceados.`);
  assert.ok(balanced(completeGuideCode, '[', ']'), `${algorithm.id}/guía: el código Java tiene corchetes desbalanceados.`);
  const missingGuideMethods = missingJavaMethods(completeGuideCode);
  if (missingGuideMethods.length) incompleteJavaSnippets.push({ source: `${algorithm.id}/guía`, methods: missingGuideMethods });
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
    const missingActionMethods = missingJavaMethods(java);
    if (missingActionMethods.length) incompleteJavaSnippets.push({ source: `${algorithm.id}/${action.id}`, methods: missingActionMethods });
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
      const frameFactory = algorithm.category === 'Árboles'
        ? createTreeSynchronizedFrames
        : createCodeSynchronizedFrames;
      const frames = usesCustomFrames
        ? adaptFramesToCode(result.frames, java, true)
        : frameFactory({
            algorithm,
            code: java,
            actionId: action.id,
            beforeValues: initialValues,
            afterValues: result.values,
            beforeEdges: initialEdges,
            afterEdges: result.edges,
            finalStep: result.step,
            finalMessage: result.message,
            succeeded: result.ok,
            inputValues: fieldsFor(algorithm, action.id, trial),
          });
      assert.ok(frames.length > 0, `${label}: no genera fotogramas.`);
      assert.ok(frames.every(frame => Array.isArray(frame.values)), `${label}: un fotograma no contiene values.`);
      assert.ok(frames.every(frame => Number.isInteger(frame.codeLine)), `${label}: una línea de código no está sincronizada.`);
      assert.ok(frames.every(frame => typeof frame.message === 'string' && frame.message.length > 0), `${label}: un fotograma no explica lo que ocurre.`);
      assert.deepEqual(frames.at(-1).values, result.values, `${label}: el último fotograma no coincide con el resultado.`);

      if (!usesCustomFrames) {
        assert.deepEqual(frames.at(-1).edges, result.edges, `${label}: las aristas finales no coinciden.`);
        if (!result.ok) assert.equal(frames.length, 1, `${label}: un error no debe reproducir una animación falsa.`);

        const javaLines = java.split('\n');
        const startMarker = javaLines.findIndex(line => line.trim() === '// Start of the selected operation');
        const endMarker = javaLines.findIndex((line, index) => (
          index > startMarker && line.trim() === '// End of the selected operation'
        ));
        const firstLoopLine = javaLines.findIndex((line, index) => (
          /\b(?:for|while)\s*\(/.test(line)
          && (startMarker < 0 || index > startMarker)
          && (endMarker < 0 || index < endMarker)
        ));
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

assert.deepEqual(incompleteJavaSnippets, [], `Hay métodos Java utilizados pero no mostrados:\n${JSON.stringify(incompleteJavaSnippets, null, 2)}`);

const sparseMatrix = algorithms.find(item => item.id === 'matriz-dispersa');
assert.ok(sparseMatrix, 'Falta la matriz poco poblada.');
const sparseInsertJava = getBeginnerJava(sparseMatrix, 'matrix-insert');
assert.match(sparseInsertJava, /Node left;/, 'La matriz debe enseñar el nexo horizontal invertido left.');
assert.match(sparseInsertJava, /Node up;/, 'La matriz debe enseñar el nexo vertical invertido up.');
assert.match(sparseInsertJava, /AROW\[row\]\.left = AROW\[row\]/, 'AROW debe quedar circular.');
assert.match(sparseInsertJava, /ACOL\[column\]\.up = ACOL\[column\]/, 'ACOL debe quedar circular.');
assert.match(sparseInsertJava, /currentRow\.column > column/, 'AROW debe recorrerse de derecha a izquierda.');
assert.match(sparseInsertJava, /currentColumn\.row > row/, 'ACOL debe recorrerse de abajo hacia arriba.');

const sparseInserted = run(
  sparseMatrix,
  'matrix-insert',
  { value: '99', second: '4', index: '4' },
);
assert.equal(sparseInserted.ok, true, 'La inserción dispersa debe completarse.');
assert.ok(sparseInserted.values.some(cell => cell.value === 99 && cell.row === 4 && cell.column === 4), 'La nueva celda no fue creada.');
assert.ok(sparseInserted.frames.some(frame => frame.sparseState?.phase === 'link-row'), 'Falta animar el enlace en AROW.');
assert.ok(sparseInserted.frames.some(frame => frame.sparseState?.phase === 'link-column'), 'Falta animar el enlace en ACOL.');

const sparseUpdated = run(
  sparseMatrix,
  'matrix-insert',
  { value: '77', second: '0', index: '1' },
);
assert.equal(sparseUpdated.values.length, sparseMatrix.values.length, 'Actualizar una coordenada no debe duplicar el nodo.');
assert.equal(sparseUpdated.values.find(cell => cell.row === 0 && cell.column === 1)?.value, 77, 'No se actualizó el valor existente.');

const sparseRemoved = run(
  sparseMatrix,
  'matrix-remove',
  { value: '', second: '1', index: '4' },
);
assert.ok(!sparseRemoved.values.some(cell => cell.row === 1 && cell.column === 4), 'Eliminar debe retirar la celda de ambas listas.');
assert.ok(sparseRemoved.frames.some(frame => frame.sparseState?.phase === 'detach-row'), 'Falta animar la desconexión de AROW.');
assert.ok(sparseRemoved.frames.some(frame => frame.sparseState?.phase === 'detach-column'), 'Falta animar la desconexión de ACOL.');

const sparseRow = run(sparseMatrix, 'matrix-row', { value: '', second: '1', index: '' });
assert.deepEqual(
  sparseRow.frames.filter(frame => frame.sparseState?.phase === 'row-scan').map(frame => frame.sparseState.activeCellKey),
  ['1:5', '1:4', '1:3', '1:0'],
  'AROW debe recorrer la fila de derecha a izquierda.',
);
const sparseColumn = run(sparseMatrix, 'matrix-column', { value: '', second: '', index: '4' });
assert.deepEqual(
  sparseColumn.frames.filter(frame => frame.sparseState?.phase === 'column-scan').map(frame => frame.sparseState.activeCellKey),
  ['1:4', '0:4'],
  'ACOL debe recorrer la columna de abajo hacia arriba.',
);

let fifteenSparseCells = [];
for (let index = 0; index < 15; index++) {
  const result = run(
    sparseMatrix,
    'matrix-insert',
    { value: String(index + 1), second: String(Math.floor(index / 6)), index: String(index % 6) },
    fifteenSparseCells,
  );
  assert.equal(result.ok, true, `La inserción dispersa ${index + 1} debe estar permitida.`);
  fifteenSparseCells = result.values;
}
assert.equal(fifteenSparseCells.length, 15, 'La matriz debe admitir al menos 15 inserciones distintas.');
assert.equal(new Set(fifteenSparseCells.map(cell => `${cell.row}:${cell.column}`)).size, 15, 'No debe haber coordenadas duplicadas.');

const linkedListIds = ['lista-simple', 'lista-doble', 'lista-circular-simple', 'lista-circular-doble'];
const linkedListActions = ['add-start', 'add-end', 'add-index', 'remove-start', 'remove-end', 'remove-index', 'remove-value', 'find'];
for (const listId of linkedListIds) {
  const list = algorithms.find(item => item.id === listId);
  const actions = getOperationDefinition(list).actions.map(item => item.id);
  assert.deepEqual(actions, linkedListActions, `${listId}: faltan operaciones completas de inserción o eliminación.`);

  for (const actionId of linkedListActions) {
    const java = getBeginnerJava(list, actionId);
    assert.match(java, /class \w+LinkedList/, `${listId}/${actionId}: falta la clase completa de la lista.`);
    assert.match(java, /class Node/, `${listId}/${actionId}: falta mostrar la clase Node.`);
    assert.match(java, /Node head = null;/, `${listId}/${actionId}: falta mostrar head.`);
    assert.match(java, /Node tail = null;/, `${listId}/${actionId}: falta mostrar tail.`);
    assert.match(java, /int size = 0;/, `${listId}/${actionId}: falta mostrar size.`);
    assert.match(java, /Start of the selected operation/, `${listId}/${actionId}: falta delimitar la operación animada.`);
    assert.ok(!java.includes('values['), `${listId}/${actionId}: no debe reutilizar código de Array.`);
    if (listId.includes('doble')) {
      assert.match(java, /Node prev;/, `${listId}/${actionId}: falta el enlace prev.`);
    }
  }
}

function occupiedTree(values, index) {
  return index >= 0 && index < values.length && values[index] !== undefined && values[index] !== null;
}

function assertOrderedBinaryTree(values, label, index = 0, minimum = -Infinity, maximum = Infinity) {
  if (!occupiedTree(values, index)) return;
  const value = Number(values[index]);
  assert.ok(value > minimum && value < maximum, `${label}: ${value} rompe el orden BST.`);
  assertOrderedBinaryTree(values, label, index * 2 + 1, minimum, value);
  assertOrderedBinaryTree(values, label, index * 2 + 2, value, maximum);
}

function binaryTreeHeight(values, index = 0) {
  if (!occupiedTree(values, index)) return 0;
  return 1 + Math.max(
    binaryTreeHeight(values, index * 2 + 1),
    binaryTreeHeight(values, index * 2 + 2),
  );
}

function assertAvlBalance(values, label) {
  for (let index = 0; index < values.length; index++) {
    if (!occupiedTree(values, index)) continue;
    const balance = binaryTreeHeight(values, index * 2 + 1)
      - binaryTreeHeight(values, index * 2 + 2);
    assert.ok(Math.abs(balance) <= 1, `${label}: el nodo ${values[index]} tiene factor ${balance}.`);
  }
}
assert.match(getBeginnerJava(algorithms.find(item => item.id === 'lista-circular-simple'), 'add-start'), /tail\.next = head;/, 'Lista circular simple: no se cierra el ciclo.');
assert.match(getBeginnerJava(algorithms.find(item => item.id === 'lista-circular-doble'), 'add-end'), /head\.prev = newNode;/, 'Lista circular doble: no se conserva el enlace hacia atrás.');

const circularRemovalCode = getBeginnerJava(algorithms.find(item => item.id === 'lista-circular-simple'), 'remove-value');
const circularRemovalTrace = buildCodeExecutionTrace(circularRemovalCode, 4);
const circularOperationLine = circularRemovalCode.split('\n').findIndex(line => line.includes('boolean removeValue'));
const circularDoLine = circularRemovalCode.split('\n').findIndex(line => line.trim() === 'do {');
const circularWhileLine = circularRemovalCode.split('\n').findIndex(line => line.includes('while (current != head)'));
assert.equal(circularRemovalTrace[0].index, circularOperationLine, 'Lista circular: la animación debe comenzar en el método seleccionado.');
assert.equal(circularRemovalTrace.filter(frame => frame.index === circularDoLine).length, 4, 'Lista circular: do debe repetirse una vez por nodo visitado.');
assert.ok(circularRemovalTrace.some(frame => frame.index === circularWhileLine && frame.loopExit), 'Lista circular: falta animar la salida de do-while.');

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

const bst = algorithms.find(item => item.id === 'bst');
const bstInsertResult = run(bst, 'tree-add', { value: '17', second: '', index: '' });
assertOrderedBinaryTree(bstInsertResult.values, 'BST/insertar');
assert.equal(bstInsertResult.values[14], 17, 'BST: la inserción debe seguir comparaciones hasta el hijo derecho disponible.');
const bstSearchResult = run(bst, 'find', { value: '1', second: '', index: '' });
const bstSearchCode = getBeginnerJava(bst, 'find');
const bstSearchFrames = createTreeSynchronizedFrames({
  algorithm: bst,
  code: bstSearchCode,
  actionId: 'find',
  beforeValues: bst.values,
  afterValues: bstSearchResult.values,
  beforeEdges: edges(),
  afterEdges: edges(),
  finalStep: bstSearchResult.step,
  finalMessage: bstSearchResult.message,
  succeeded: bstSearchResult.ok,
  inputValues: { value: '1', second: '', index: '' },
});
assert.deepEqual(
  [...new Set(bstSearchFrames.filter(frame => !frame.completed).map(frame => frame.position))],
  [0, 1, 3],
  'BST: buscar 1 debe iluminar raíz, hijo izquierdo y nodo encontrado.',
);
const bstSearchMethodLine = bstSearchCode.split('\n').findIndex(line => line.includes('Node search'));
assert.ok(
  bstSearchFrames.filter(frame => frame.codeLine === bstSearchMethodLine).length >= 3,
  'BST: cada llamada recursiva debe volver a iluminar el inicio del método.',
);

const avl = algorithms.find(item => item.id === 'avl');
let avlValues = [...avl.values];
for (const value of [5, 15, 45, 60, 55]) {
  avlValues = run(avl, 'tree-add', { value: String(value), second: '', index: '' }, avlValues).values;
  assertOrderedBinaryTree(avlValues, `AVL/insertar-${value}`);
  assertAvlBalance(avlValues, `AVL/insertar-${value}`);
}
assert.match(getBeginnerJava(avl, 'tree-add'), /balanceOf/, 'AVL: el código debe calcular el factor de balance.');
assert.match(getBeginnerJava(avl, 'tree-add'), /rotateRight/, 'AVL: el código debe mostrar las rotaciones.');

const redBlack = algorithms.find(item => item.id === 'rojo-negro');
assert.match(getBeginnerJava(redBlack, 'tree-add'), /fixAfterInsert/, 'Rojo-Negro: falta corregir colores y rotaciones.');
assert.match(getBeginnerJava(redBlack, 'remove-value'), /fixAfterDelete/, 'Rojo-Negro: falta corregir el doble negro al eliminar.');

const splay = algorithms.find(item => item.id === 'splay-tree');
const splayFindResult = run(splay, 'find', { value: '7', second: '', index: '' });
assert.equal(splayFindResult.values[0], 7, 'Splay Tree: el nodo encontrado debe terminar en la raíz.');
assert.match(getBeginnerJava(splay, 'find'), /Node splay/, 'Splay Tree: el código debe mostrar el método splay utilizado.');

const segmentTree = algorithms.find(item => item.id === 'segment-tree');
assert.match(getBeginnerJava(segmentTree, 'range-update'), /tree\[node\]/, 'Segment Tree: actualizar debe modificar los nodos del árbol.');
const fenwickTree = algorithms.find(item => item.id === 'fenwick-tree');
assert.match(getBeginnerJava(fenwickTree, 'prefix-sum'), /index\s*&\s*-index/, 'Fenwick Tree: falta mostrar el salto por el bit menos significativo.');
const suffixTree = algorithms.find(item => item.id === 'suffix-tree');
assert.match(getBeginnerJava(suffixTree, 'set-word'), /insertSuffix/, 'Suffix Tree: construir debe insertar todos los sufijos.');
assert.match(getBeginnerJava(bplus, 'sorted-add'), /Leaf splitLeaf/, 'B+ Tree: falta mostrar la división de una hoja.');
const bstar = algorithms.find(item => item.id === 'bstar-tree');
assert.match(getBeginnerJava(bstar, 'sorted-add'), /redistribute/, 'B* Tree: debe intentar redistribuir antes de dividir.');
const expressionTree = algorithms.find(item => item.id === 'expression-tree');
const builtExpression = run(expressionTree, 'set-expression', { value: '8+3*2', second: '', index: '' });
assert.deepEqual(
  builtExpression.values,
  ['+', '8', '*', undefined, undefined, '3', '2'],
  'Árbol de expresión: la precedencia debe dejar la multiplicación debajo de la suma.',
);
const evaluatedExpression = run(expressionTree, 'evaluate', { value: '', second: '', index: '' }, builtExpression.values);
assert.match(evaluatedExpression.message, /14/, 'Árbol de expresión: 8 + 3 × 2 debe producir 14.');
assert.match(getBeginnerJava(expressionTree, 'set-expression'), /applyTop/, 'Árbol de expresión: falta mostrar cómo se conectan operadores y operandos.');
assert.match(getBeginnerJava(merkle, 'merkle-root'), /combineHash/, 'Merkle Tree: la raíz debe combinar hashes por parejas.');
for (const treeAlgorithm of algorithms.filter(item => item.category === 'Árboles')) {
  for (const action of getOperationDefinition(treeAlgorithm).actions) {
    const java = getBeginnerJava(treeAlgorithm, action.id);
    assert.doesNotMatch(java, /\/\/\s*TODO\b|Follow the visual steps|Reconnect node|Borrow from a sibling|Insert separator in|Move the median to/i, `${treeAlgorithm.id}/${action.id}: contiene código incompleto.`);
  }
}

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
const hanoiMoves = hanoiResult.frames.filter(frame => frame.hanoiState?.phase === 'move');
assert.equal(hanoiMoves.length, 31, 'Hanoi: 5 discos deben producir exactamente 31 movimientos.');
assert.equal(hanoiResult.frames.length, 188, 'Hanoi: la traza debe incluir llamadas, casos base y movimientos recursivos.');
assert.deepEqual([...new Set(hanoiResult.frames.map(frame => frame.codeLine))].sort(), [0, 1, 2, 3, 4], 'Hanoi: el código debe recorrer todas las líneas del método recursivo.');
assert.ok(hanoiResult.frames.every(frame => frame.variables?.some(variable => variable.name === 'profundidad')), 'Hanoi: cada paso debe mostrar la profundidad recursiva.');
assert.equal(hanoiMoves.at(-1)?.hanoiState?.moveCount, 31, 'Hanoi: el contador visual debe terminar en 31 movimientos.');
assert.ok(hanoiResult.values.every(disk => disk.rod === 2), 'Hanoi: todos los discos deben terminar en la torre C.');

const visualGraphIds = ['grafo', 'grafo-dirigido', 'dfs', 'bfs', 'prim', 'kruskal'];
assert.equal(new Set(visualGraphIds.map(id => JSON.stringify(graphPositionsFor(id)))).size, visualGraphIds.length, 'Grafos: cada tema debe tener una distribución visual distinta.');
assert.equal(new Set(visualGraphIds.map(id => JSON.stringify(graphEdgesFor(id)))).size, visualGraphIds.length, 'Grafos: cada tema debe tener una topología distinta.');
for (const graphId of visualGraphIds) {
  assert.ok(GRAPH_DESIGNS[graphId], `Grafos: falta el diseño de ${graphId}.`);
  assert.ok(graphPositionsFor(graphId).length >= 8, `Grafos: ${graphId} debe admitir hasta 8 vértices visibles.`);
  assert.ok(graphEdgesFor(graphId).every(([from, to]) => from !== to), `Grafos: ${graphId} contiene una arista hacia el mismo vértice.`);
}

assert.match(getBeginnerJava(sudoku, 'solve'), /boolean isValid/, 'Sudoku: falta mostrar isValid en Java.');
assert.match(getBeginnerJava(maze, 'solve'), /boolean isFree/, 'Laberinto: falta mostrar isFree en Java.');
assert.match(getBeginnerJava(maze, 'solve'), /boolean isExit/, 'Laberinto: falta mostrar isExit en Java.');

console.log(`AUDITORÍA OK: ${algorithms.length} temas, ${actionCount} acciones, ${executionCount} pruebas funcionales y ${actionIds.size} funciones distintas.`);
