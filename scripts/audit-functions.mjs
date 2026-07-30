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
  getThreadedTreeLinks,
  operationGroup,
} from '../src/logic/operations.js';
import {
  adaptFramesToCode,
  buildCodeExecutionTrace,
  createCodeSynchronizedFrames,
  createLinkedListSynchronizedFrames,
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

assert.equal(algorithms.length, 54, 'El catálogo debe contener 54 temas.');
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
        assert.ok(result.frames.every(frame => {
          const hasValidLine = Number.isInteger(frame.codeLine)
            && frame.codeLine >= 0
            && frame.codeLine < javaLineCount;
          const hasValidNeedle = typeof frame.codeNeedle === 'string'
            && frame.codeNeedle.length > 0
            && java.includes(frame.codeNeedle);
          return hasValidLine || hasValidNeedle;
        }), `${label}: un fotograma apunta fuera del código Java.`);
      }
      const frameFactory = operationGroup(algorithm) === 'list'
        ? createLinkedListSynchronizedFrames
        : algorithm.category === 'Árboles'
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
        if (!result.ok && operationGroup(algorithm) !== 'list') {
          assert.equal(frames.length, 1, `${label}: un error no debe reproducir una animación falsa.`);
        }

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
        if (result.ok && operationGroup(algorithm) !== 'list' && firstLoopLine >= 0 && iterations > 1) {
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
    assert.doesNotMatch(java, /\bNode tail\b|\btail\b/, `${listId}/${actionId}: no debe existir una variable tail.`);
    assert.match(java, /int size = 0;/, `${listId}/${actionId}: falta mostrar size.`);
    assert.match(java, /Start of the selected operation/, `${listId}/${actionId}: falta delimitar la operación animada.`);
    assert.ok(!java.includes('values['), `${listId}/${actionId}: no debe reutilizar código de Array.`);
    if (listId.includes('doble')) {
      assert.match(java, /Node prev;/, `${listId}/${actionId}: falta el enlace prev.`);
    }
  }
}

const frameVariable = (frame, name) => frame.variables?.find(variable => variable.name === name)?.value;
for (const listId of linkedListIds) {
  const list = algorithms.find(item => item.id === listId);
  const beforeValues = [...list.values];
  const requestedIndex = Math.min(3, beforeValues.length);
  const fields = { value: '99', second: '', index: String(requestedIndex) };
  const result = run(list, 'add-index', fields, beforeValues);
  const java = getBeginnerJava(list, 'add-index');
  const javaLines = java.split('\n');
  const frames = createLinkedListSynchronizedFrames({
    algorithm: list,
    code: java,
    actionId: 'add-index',
    beforeValues,
    afterValues: result.values,
    beforeEdges: edges(),
    afterEdges: result.edges,
    finalStep: result.step,
    finalMessage: result.message,
    succeeded: result.ok,
    inputValues: fields,
  });

  const visitedIndexes = frames
    .map(frame => Number(frameVariable(frame, 'i')))
    .filter(Number.isFinite);
  assert.equal(visitedIndexes[0], 0, `${listId}: el recorrido por índice debe comenzar en 0.`);
  assert.ok(
    visitedIndexes.every((value, index) => index === 0 || value >= visitedIndexes[index - 1]),
    `${listId}: el recorrido por índice retrocede en vez de avanzar desde head.`,
  );
  assert.ok(
    frames.every(frame => frameVariable(frame, 'sentido') === 'head → next'),
    `${listId}: la animación debe indicar el recorrido head → next.`,
  );

  const loopLine = javaLines.findIndex(line => /for \(int i = 0; i < index(?: - 1)?; i\+\+\)/.test(line));
  assert.ok(frames.filter(frame => frame.codeLine === loopLine).length >= 2, `${listId}: el for no muestra su evaluación y su repetición.`);
  const conditionValues = frames.map(frame => frameVariable(frame, 'condición')).filter(Boolean);
  assert.ok(conditionValues.includes('true') && conditionValues.includes('false'), `${listId}: faltan resultados true/false en las condiciones.`);

  const headAssignmentLines = javaLines
    .map((line, index) => line.trim() === 'head = newNode;' ? index : -1)
    .filter(index => index >= 0);
  assert.ok(
    frames.every(frame => !headAssignmentLines.includes(frame.codeLine)),
    `${listId}: entró al bloque index == 0 aunque el índice solicitado fue ${requestedIndex}.`,
  );
  assert.deepEqual(frames.at(-1).values, result.values, `${listId}: la inserción animada no termina con los datos reales.`);

  const invalidFields = { value: '99', second: '', index: '-1' };
  const invalidResult = run(list, 'add-index', invalidFields, beforeValues);
  const invalidFrames = createLinkedListSynchronizedFrames({
    algorithm: list,
    code: java,
    actionId: 'add-index',
    beforeValues,
    afterValues: invalidResult.values,
    beforeEdges: edges(),
    afterEdges: invalidResult.edges,
    finalStep: invalidResult.step,
    finalMessage: invalidResult.message,
    succeeded: invalidResult.ok,
    inputValues: invalidFields,
  });
  const creationLine = javaLines.findIndex(line => line.includes('Node newNode = new Node(value)'));
  assert.ok(invalidFrames.every(frame => frame.codeLine !== creationLine), `${listId}: un índice inválido no debe crear ni insertar un nodo.`);
  assert.equal(
    frameVariable(invalidFrames.find(frame => frameVariable(frame, 'condición')), 'condición'),
    'true',
    `${listId}: la validación de un índice inválido debe ser true.`,
  );
  assert.deepEqual(invalidFrames.at(-1).values, beforeValues, `${listId}: un índice inválido modificó la lista.`);
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
assert.match(getBeginnerJava(algorithms.find(item => item.id === 'lista-circular-simple'), 'add-start'), /last\.next = newNode;/, 'Lista circular simple: no se cierra el ciclo.');
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
const arrayWithoutIndex = run(loopExample, 'add-index', { value: '99', second: '', index: '' });
assert.equal(arrayWithoutIndex.ok, false, 'Array: un índice vacío no debe interpretarse como la posición 0.');
assert.deepEqual(arrayWithoutIndex.values, loopExample.values, 'Array: una inserción sin índice no debe modificar los datos.');
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
const mazeCode = getBeginnerJava(maze, 'solve');
const synchronizedMazeFrames = adaptFramesToCode(mazeResult.frames, mazeCode, true);
const mazeCodeLines = mazeCode.split('\n');
const mazePathLine = mazeCodeLines.findIndex(line => line.includes('path[row][column] = true'));
const mazeExitLine = mazeCodeLines.findIndex(line => line.includes('if (isExit(row, column))'));
const mazeDirectionLines = [
  'solveMaze(row, column + 1)',
  'solveMaze(row + 1, column)',
  'solveMaze(row, column - 1)',
  'solveMaze(row - 1, column)',
].map(needle => mazeCodeLines.findIndex(line => line.includes(needle)));
assert.ok(synchronizedMazeFrames.some(frame => frame.codeLine === mazePathLine), 'Laberinto: el código no ilumina la elección de una celda.');
assert.ok(synchronizedMazeFrames.some(frame => frame.codeLine === mazeExitLine), 'Laberinto: el código no evalúa isExit.');
assert.ok(mazeDirectionLines.every(line => synchronizedMazeFrames.some(frame => frame.codeLine === line)), 'Laberinto: faltan llamadas recursivas en la animación del código.');
assert.ok(new Set(synchronizedMazeFrames.map(frame => frame.codeLine)).size >= 8, 'Laberinto: la animación queda detenida en una sola línea.');
for (let index = 1; index < synchronizedMazeFrames.length; index++) {
  const previousPathCells = synchronizedMazeFrames[index - 1].values.filter(value => value === 2).length;
  const currentPathCells = synchronizedMazeFrames[index].values.filter(value => value === 2).length;
  if (currentPathCells > previousPathCells) {
    assert.equal(synchronizedMazeFrames[index].codeLine, mazePathLine, 'Laberinto: una celda cambia antes de iluminar path[row][column] = true.');
  }
}

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

const binaryTree = algorithms.find(item => item.id === 'arbol-binario');
const binaryTreeInsertCode = getBeginnerJava(binaryTree, 'tree-add');
assert.doesNotMatch(binaryTreeInsertCode, /Queue|ArrayDeque/, 'Árbol binario/insertar: no debe utilizar una cola.');
assert.match(binaryTreeInsertCode, /boolean contains\(Node node, int value\)/, 'Árbol binario/insertar: debe validar valores repetidos recursivamente.');
assert.match(binaryTreeInsertCode, /insertAtFirstAvailableLevel\(root, value, level \+ 1\)/, 'Árbol binario/insertar: debe avanzar recursivamente al siguiente nivel.');
assert.match(binaryTreeInsertCode, /insertAtLevel\(node\.left, value, level - 1\)/, 'Árbol binario/insertar: debe recorrer recursivamente el hijo izquierdo.');
const repeatedBinaryTreeInsert = run(binaryTree, 'tree-add', { value: '1', second: '', index: '' });
assert.equal(repeatedBinaryTreeInsert.ok, false, 'Árbol binario/insertar: no debe aceptar un valor repetido.');
assert.deepEqual(repeatedBinaryTreeInsert.values, binaryTree.values, 'Árbol binario/insertar: un duplicado no debe alterar el árbol.');
const insertAfterRepeatedValue = run(binaryTree, 'tree-add', { value: '2', second: '', index: '' }, repeatedBinaryTreeInsert.values);
assert.deepEqual(
  insertAfterRepeatedValue.values,
  [8, 3, 12, 1, 5, 10, 15, 2],
  'Árbol binario/insertar: después de rechazar 1, el 2 debe ocupar el primer espacio libre.',
);
const binaryTreeInsert = run(binaryTree, 'tree-add', { value: '99', second: '', index: '' });
assert.deepEqual(
  binaryTreeInsert.values,
  [8, 3, 12, 1, 5, 10, 15, 99],
  'Árbol binario/insertar: la recursión debe ocupar el primer espacio libre por nivel.',
);
const binaryTreeInsertFrames = adaptFramesToCode(binaryTreeInsert.frames, binaryTreeInsertCode, true);
assert.ok(
  [0, 1, 3, 7].every(position => binaryTreeInsertFrames.some(frame => frame.position === position)),
  'Árbol binario/insertar: la animación debe mostrar las llamadas recursivas hasta el nuevo nodo.',
);

const threadedTree = algorithms.find(item => item.id === 'arbol-enhebrado');
const initialThreads = getThreadedTreeLinks(threadedTree.values);
assert.deepEqual(
  initialThreads.inorder.map(index => threadedTree.values[index]),
  [5, 10, 15, 20, 25, 30, 35],
  'Árbol enhebrado: el orden inorden inicial es incorrecto.',
);
assert.equal(initialThreads.links.get(3).successor, 1, 'Árbol enhebrado: 5 debe enhebrarse hacia el sucesor 10.');
assert.equal(initialThreads.links.get(4).predecessor, 1, 'Árbol enhebrado: 15 debe enhebrarse hacia el predecesor 10.');
assert.equal(initialThreads.links.get(4).successor, 0, 'Árbol enhebrado: 15 debe enhebrarse hacia el sucesor 20.');
const threadedInsertResult = run(threadedTree, 'tree-add', { value: '12', second: '', index: '' });
assert.equal(threadedInsertResult.values[9], 12, 'Árbol enhebrado: 12 debe insertarse como hijo izquierdo de 15.');
assert.ok(threadedInsertResult.frames.some(frame => frame.activeThread), 'Árbol enhebrado: la inserción debe mostrar los hilos creados.');
const threadedAfterInsert = getThreadedTreeLinks(threadedInsertResult.values);
assert.deepEqual(
  threadedAfterInsert.inorder.map(index => threadedInsertResult.values[index]),
  [5, 10, 12, 15, 20, 25, 30, 35],
  'Árbol enhebrado: insertar debe conservar el orden BST.',
);
const threadedInorder = run(threadedTree, 'inorder');
assert.match(threadedInorder.message, /5 → 10 → 15 → 20 → 25 → 30 → 35/, 'Árbol enhebrado: el recorrido no sigue los hilos en orden.');
assert.ok(
  threadedInorder.frames.some(frame => frame.threadPhase === 'follow' && frame.activeThread),
  'Árbol enhebrado: la animación inorden debe seguir al menos un hilo.',
);
const threadedRemove = run(threadedTree, 'remove-value', { value: '10', second: '', index: '' });
const threadedAfterRemove = getThreadedTreeLinks(threadedRemove.values);
assert.deepEqual(
  threadedAfterRemove.inorder.map(index => threadedRemove.values[index]),
  [5, 15, 20, 25, 30, 35],
  'Árbol enhebrado: eliminar un nodo con dos hijos debe conservar el orden.',
);
const threadedRemoveLeaf = run(threadedTree, 'remove-value', { value: '5', second: '', index: '' });
assertOrderedBinaryTree(threadedRemoveLeaf.values, 'Árbol enhebrado/eliminar-hoja');
assert.deepEqual(threadedRemoveLeaf.values.filter(value => value !== undefined).sort((a, b) => a - b), [10, 15, 20, 25, 30, 35], 'Árbol enhebrado: eliminar una hoja retiró un valor incorrecto.');
const threadedRemoveOneChild = run(threadedTree, 'remove-value', { value: '15', second: '', index: '' }, threadedInsertResult.values);
assertOrderedBinaryTree(threadedRemoveOneChild.values, 'Árbol enhebrado/eliminar-un-hijo');
assert.equal(threadedRemoveOneChild.values[4], 12, 'Árbol enhebrado: el único hijo de 15 debe ocupar su enlace real.');
const threadedRemoveRoot = run(threadedTree, 'remove-value', { value: '20', second: '', index: '' });
assertOrderedBinaryTree(threadedRemoveRoot.values, 'Árbol enhebrado/eliminar-raíz');
assert.equal(threadedRemoveRoot.values[0], 25, 'Árbol enhebrado: la raíz con dos hijos debe recibir su sucesor inorden.');
const threadedInsertEmpty = run(threadedTree, 'tree-add', { value: '40', second: '', index: '' }, []);
assert.deepEqual(threadedInsertEmpty.values, [40], 'Árbol enhebrado: insertar en un árbol vacío debe crear la raíz.');
for (const actionId of ['tree-add', 'remove-value', 'find', 'inorder']) {
  const code = getBeginnerJava(threadedTree, actionId);
  assert.match(code, /leftThread/, `Árbol enhebrado/${actionId}: falta distinguir el hilo izquierdo.`);
  assert.match(code, /rightThread/, `Árbol enhebrado/${actionId}: falta distinguir el hilo derecho.`);
}
assert.doesNotMatch(getBeginnerJava(threadedTree, 'inorder'), /Stack|Queue|inorder\s*\(\s*current/, 'Árbol enhebrado/inorden: no debe usar pila, cola ni recursión.');

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
const avlInsertOne = run(avl, 'tree-add', { value: '1', second: '', index: '' }, [...avl.values]);
assert.deepEqual(
  avlInsertOne.values,
  [30, 20, 40, 10, 25, 35, 50, 1],
  'AVL/insertar-1: debe conservar la raíz 30 porque ningún factor supera 1.',
);
assert.doesNotMatch(avlInsertOne.message, /rotación (?:LL|RR|LR|RL)/i, 'AVL/insertar-1: no debe informar una rotación inexistente.');
assertAvlBalance(avlInsertOne.values, 'AVL/insertar-1');
const avlLlRotation = run(avl, 'tree-add', { value: '0', second: '', index: '' }, avlInsertOne.values);
assert.deepEqual(
  avlLlRotation.values,
  [30, 20, 40, 1, 25, 35, 50, 0, 10],
  'AVL/insertar-0: debe aplicar la rotación LL únicamente en el subárbol de 10.',
);
assert.match(avlLlRotation.message, /rotación LL/i, 'AVL/insertar-0: debe explicar la rotación LL aplicada.');
assertAvlBalance(avlLlRotation.values, 'AVL/rotación-LL');
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
assert.deepEqual(
  bfsResult.frames.at(-1).graphState.order.map(index => graph.values[index]),
  ['A', 'B', 'D', 'C', 'E', 'F'],
  'Grafo/BFS: la animación no termina con el mismo orden que el algoritmo.',
);
assert.deepEqual(
  dfsResult.frames.at(-1).graphState.order.map(index => graph.values[index]),
  ['A', 'B', 'C', 'E', 'D', 'F'],
  'Grafo/DFS: la animación no termina con el mismo orden que el algoritmo.',
);

const stackAlgorithm = algorithms.find(item => item.id === 'pila');
const queueAlgorithm = algorithms.find(item => item.id === 'cola');
const stackMethods = {
  push: /boolean push\(int value\)/,
  pop: /Integer pop\(\)/,
  peek: /Integer peek\(\)/,
  clear: /void clear\(\)/,
};
for (const [actionId, methodPattern] of Object.entries(stackMethods)) {
  const java = getBeginnerJava(stackAlgorithm, actionId);
  const result = run(stackAlgorithm, actionId, { value: '99', second: '', index: '' });
  assert.match(java, /class ArrayStack \{/, `Stack/${actionId}: falta mostrar la clase completa.`);
  assert.match(java, /int\[\] values = new int\[MAX_SIZE\]/, `Stack/${actionId}: falta mostrar el arreglo.`);
  assert.match(java, /int top = -1;/, `Stack/${actionId}: falta declarar top.`);
  assert.match(java, methodPattern, `Stack/${actionId}: falta el método seleccionado.`);
  assert.ok(result.frames.length >= 3, `Stack/${actionId}: la animación no recorre el código.`);
  assert.ok(result.frames.every(frame => java.includes(frame.codeNeedle)), `Stack/${actionId}: una línea animada no existe en el Java mostrado.`);
  assert.ok(new Set(result.frames.map(frame => frame.codeNeedle)).size >= 3, `Stack/${actionId}: el código permanece detenido en una sola línea.`);
}
const stackPush = run(stackAlgorithm, 'push', { value: '99', second: '', index: '' });
assert.ok(stackPush.frames.some(frame => frame.values.at(-1) === 99 && !frame.completed), 'Stack/Push: el nuevo tope debe aparecer mientras se ejecuta la asignación.');
const stackPop = run(stackAlgorithm, 'pop');
assert.ok(stackPop.frames.some(frame => frame.values.length === stackAlgorithm.values.length - 1 && !frame.completed), 'Stack/Pop: el elemento debe desaparecer cuando top disminuye.');
assert.equal(run(stackAlgorithm, 'push', { value: '99' }, Array.from({ length: 15 }, (_, index) => index)).ok, false, 'Stack/Push: debe impedir overflow al alcanzar MAX_SIZE.');

const queueMethods = {
  enqueue: /boolean enqueue\(int value\)/,
  dequeue: /Integer dequeue\(\)/,
  front: /Integer peekFront\(\)/,
  clear: /void clear\(\)/,
};
for (const [actionId, methodPattern] of Object.entries(queueMethods)) {
  const java = getBeginnerJava(queueAlgorithm, actionId);
  const result = run(queueAlgorithm, actionId, { value: '99', second: '', index: '' });
  assert.match(java, /class LinkedQueue \{/, `Queue/${actionId}: falta mostrar la clase completa.`);
  assert.match(java, /static class Node \{/, `Queue/${actionId}: falta mostrar la clase Node.`);
  assert.match(java, /Node front = null;/, `Queue/${actionId}: falta declarar front.`);
  assert.match(java, /Node rear = null;/, `Queue/${actionId}: falta declarar rear.`);
  assert.match(java, methodPattern, `Queue/${actionId}: falta el método seleccionado.`);
  assert.ok(result.frames.length >= 3, `Queue/${actionId}: la animación no recorre el código.`);
  assert.ok(result.frames.every(frame => java.includes(frame.codeNeedle)), `Queue/${actionId}: una línea animada no existe en el Java mostrado.`);
  assert.ok(new Set(result.frames.map(frame => frame.codeNeedle)).size >= 3, `Queue/${actionId}: el código permanece detenido en una sola línea.`);
}
const queueEnqueueJava = getBeginnerJava(queueAlgorithm, 'enqueue');
const queueDequeueJava = getBeginnerJava(queueAlgorithm, 'dequeue');
assert.match(queueEnqueueJava, /rear\.next = newNode;[\s\S]*rear = newNode;/, 'Queue/Enqueue: falta enlazar y actualizar rear.');
assert.match(queueDequeueJava, /front = front\.next;/, 'Queue/Dequeue: front debe avanzar en O(1).');
assert.doesNotMatch(queueDequeueJava, /for\s*\(|queue\[i\] = queue\[i \+ 1\]/, 'Queue/Dequeue: no debe desplazar todo el arreglo si declara complejidad O(1).');
const queueEnqueue = run(queueAlgorithm, 'enqueue', { value: '99', second: '', index: '' });
assert.ok(queueEnqueue.frames.some(frame => frame.values.at(-1) === 99 && !frame.completed), 'Queue/Enqueue: el nuevo rear debe aparecer durante el enlace.');
const queueDequeue = run(queueAlgorithm, 'dequeue');
assert.ok(queueDequeue.frames.some(frame => frame.values[0] === queueAlgorithm.values[1] && !frame.completed), 'Queue/Dequeue: front debe avanzar durante la ejecución.');
assert.equal(run(queueAlgorithm, 'enqueue', { value: '99' }, Array.from({ length: 15 }, (_, index) => index)).ok, false, 'Queue/Enqueue: debe impedir overflow al alcanzar MAX_SIZE.');

const editableGraphIds = ['grafo', 'grafo-dirigido', 'dfs', 'bfs', 'prim', 'kruskal'];
const graphProfiles = {
  grafo: ['UndirectedGraph', /boolean\[\]\[\] adjacency/],
  'grafo-dirigido': ['DirectedGraph', /boolean\[\]\[\] adjacency/],
  dfs: ['DepthFirstGraph', /boolean\[\]\[\] adjacency/],
  bfs: ['BreadthFirstGraph', /boolean\[\]\[\] adjacency/],
  prim: ['PrimGraph', /int\[\]\[\] weights/],
  kruskal: ['KruskalGraph', /Edge\[\] edges/],
};
for (const graphId of editableGraphIds) {
  const graphAlgorithm = algorithms.find(item => item.id === graphId);
  const [className, storagePattern] = graphProfiles[graphId];
  for (const action of getOperationDefinition(graphAlgorithm).actions) {
    const java = getBeginnerJava(graphAlgorithm, action.id);
    assert.match(java, new RegExp(`class ${className} \\{`), `${graphId}/${action.id}: falta mostrar su clase específica.`);
    assert.match(java, /String\[\] vertexNames/, `${graphId}/${action.id}: falta mostrar dónde se guardan los vértices.`);
    assert.match(java, storagePattern, `${graphId}/${action.id}: falta mostrar la representación propia de sus aristas.`);
    assert.match(java, /int vertexCount = 0;/, `${graphId}/${action.id}: falta declarar vertexCount.`);
    assert.match(java, /Start of the selected operation/, `${graphId}/${action.id}: falta delimitar la operación animada.`);
    assert.match(java, /End of the selected operation/, `${graphId}/${action.id}: falta cerrar la operación animada.`);
  }
}
assert.equal(
  new Set(Object.values(graphProfiles).map(([className]) => className)).size,
  editableGraphIds.length,
  'Grafos: cada tema debe mostrar una clase Java identificable y distinta.',
);

const graphAddVertexJava = getBeginnerJava(graph, 'vertex-add');
assert.match(graphAddVertexJava, /boolean addVertex\(String name\)/, 'Grafo/insertar vértice: falta el método completo.');
assert.match(graphAddVertexJava, /int findVertex\(String name\)/, 'Grafo/insertar vértice: falta mostrar la validación de duplicados.');
assert.match(graphAddVertexJava, /vertexNames\[vertexCount\] = name\.trim\(\)\.toUpperCase\(\)/, 'Grafo/insertar vértice: falta almacenar la etiqueta.');
assert.match(graphAddVertexJava, /vertexCount\+\+;/, 'Grafo/insertar vértice: falta aumentar el tamaño.');
assert.doesNotMatch(graphAddVertexJava, /int\[\]\[\] weights|Edge\[\] edges|boolean directed/, 'Grafo simple: no debe cargar pesos, lista de aristas ni una bandera de dirección.');

const graphRemoveVertexJava = getBeginnerJava(graph, 'vertex-remove');
assert.match(graphRemoveVertexJava, /vertexNames\[index\] = vertexNames\[index \+ 1\]/, 'Grafo/eliminar vértice: falta desplazar las etiquetas.');
assert.match(graphRemoveVertexJava, /adjacency\[row\]\[column\] = adjacency\[row \+ 1\]\[column\]/, 'Grafo/eliminar vértice: falta desplazar las filas.');
assert.match(graphRemoveVertexJava, /adjacency\[row\]\[column\] = adjacency\[row\]\[column \+ 1\]/, 'Grafo/eliminar vértice: falta desplazar las columnas.');

const directedGraph = algorithms.find(item => item.id === 'grafo-dirigido');
const directedEdgeJava = getBeginnerJava(directedGraph, 'edge-add');
const undirectedEdgeJava = getBeginnerJava(graph, 'edge-add');
assert.match(directedEdgeJava, /adjacency\[from\]\[to\] = true;/, 'Grafo dirigido: falta crear la arista de origen a destino.');
assert.doesNotMatch(directedEdgeJava, /adjacency\[to\]\[from\] = true;|directed/, 'Grafo dirigido: no debe crear el enlace inverso ni usar una bandera genérica.');
assert.match(undirectedEdgeJava, /adjacency\[from\]\[to\] = true;[\s\S]*adjacency\[to\]\[from\] = true;/, 'Grafo no dirigido: debe crear ambos sentidos de la arista.');

const dfsAlgorithm = algorithms.find(item => item.id === 'dfs');
const dfsJava = getBeginnerJava(dfsAlgorithm, 'dfs-run');
assert.match(dfsJava, /void depthFirst\(String startName\)/, 'DFS: falta el método público que recibe el inicio.');
assert.match(dfsJava, /boolean\[\] visited = new boolean\[vertexCount\]/, 'DFS: falta crear visited.');
assert.match(dfsJava, /void depthFirstFrom\(int vertex, boolean\[\] visited\)/, 'DFS: falta mostrar el método recursivo auxiliar.');
assert.doesNotMatch(dfsJava, /int\[\] queue|void breadthFirst|void prim|void kruskal|int\[\]\[\] weights/, 'DFS: contiene estructuras o algoritmos que no utiliza.');

const bfsAlgorithm = algorithms.find(item => item.id === 'bfs');
const bfsJava = getBeginnerJava(bfsAlgorithm, 'bfs-run');
assert.match(bfsJava, /int\[\] queue = new int\[vertexCount\]/, 'BFS: falta mostrar la cola.');
assert.match(bfsJava, /while \(front < end\)/, 'BFS: falta recorrer la cola completa.');
assert.doesNotMatch(bfsJava, /depthFirst|void prim|void kruskal|int\[\]\[\] weights/, 'BFS: contiene estructuras o algoritmos que no utiliza.');
assert.deepEqual(getOperationDefinition(bfsAlgorithm).fields.map(item => item.id), ['value', 'second'], 'BFS: no debe pedir peso porque recorre un grafo no ponderado.');
assert.deepEqual(getOperationDefinition(dfsAlgorithm).fields.map(item => item.id), ['value', 'second'], 'DFS: no debe pedir peso porque recorre un grafo no ponderado.');

for (const [algorithmId, actionId, expectedCost] of [
  ['prim', 'prim-run', 14],
  ['kruskal', 'kruskal-run', 14],
]) {
  const spanningAlgorithm = algorithms.find(item => item.id === algorithmId);
  const actions = getOperationDefinition(spanningAlgorithm).actions.map(item => item.id);
  assert.ok(actions.includes(actionId), `${spanningAlgorithm.name}: falta su botón de ejecución propio.`);
  assert.ok(!actions.includes('bfs-run') && !actions.includes('dfs-run'), `${spanningAlgorithm.name}: no debe sustituirse por BFS o DFS.`);
  const java = getBeginnerJava(spanningAlgorithm, actionId);
  assert.match(java, algorithmId === 'prim' ? /void prim\(String startName\)/ : /void kruskal\(\)/, `${spanningAlgorithm.name}: falta el algoritmo Java completo.`);
  if (algorithmId === 'prim') {
    assert.match(java, /int\[\]\[\] weights/, 'Prim: debe usar una matriz de pesos para comparar conexiones desde el árbol.');
    assert.doesNotMatch(java, /Edge\[\] edges|void kruskal|int\[\] queue|depthFirst|union\(/, 'Prim: contiene estructuras o métodos ajenos a su lógica.');
  } else {
    assert.match(java, /Edge\[\] edges/, 'Kruskal: debe guardar una lista de aristas para ordenarlas.');
    assert.match(java, /int find\(int\[\] parent, int vertex\)/, 'Kruskal: falta Union-Find para detectar ciclos.');
    assert.doesNotMatch(java, /int\[\]\[\] weights|boolean\[\]\[\] adjacency|void prim|int\[\] queue|depthFirst/, 'Kruskal: contiene representaciones o métodos ajenos a su lógica.');
  }
  assert.deepEqual(getOperationDefinition(spanningAlgorithm).fields.map(item => item.id), ['value', 'second', 'index'], `${spanningAlgorithm.name}: debe conservar el campo de peso.`);
  const result = run(spanningAlgorithm, actionId, { value: 'A', second: '', index: '' });
  assert.equal(result.ok, true, `${spanningAlgorithm.name}: no construye el árbol de expansión mínima.`);
  assert.equal(result.frames.at(-1).graphState.visitedEdges.length, spanningAlgorithm.values.length - 1, `${spanningAlgorithm.name}: debe elegir V - 1 aristas.`);
  assert.equal(result.frames.at(-1).graphState.totalCost, expectedCost, `${spanningAlgorithm.name}: el costo mínimo calculado es incorrecto.`);
  assert.ok(result.frames.every(frame => java.includes(frame.codeNeedle)), `${spanningAlgorithm.name}: un paso no corresponde al Java mostrado.`);
}

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

const arrayAlgorithm = algorithms.find(item => item.id === 'array');
const arrayCases = [
  ['add-start', { value: '99' }],
  ['add-end', { value: '99' }],
  ['add-index', { value: '99', index: '2' }],
  ['set-index', { value: '99', index: '2' }],
  ['remove-start', {}],
  ['remove-end', {}],
  ['remove-index', { index: '2' }],
];
for (const [actionId, fields] of arrayCases) {
  const beforeValues = [...arrayAlgorithm.values];
  const result = run(arrayAlgorithm, actionId, fields);
  const code = getBeginnerJava(arrayAlgorithm, actionId);
  const frames = createCodeSynchronizedFrames({
    algorithm: arrayAlgorithm,
    code,
    actionId,
    beforeValues,
    afterValues: result.values,
    beforeEdges: edges(),
    afterEdges: result.edges,
    finalStep: result.step,
    finalMessage: result.message,
    succeeded: result.ok,
    inputValues: fields,
  });
  const indexes = frames.flatMap(frame => (
    frame.variables?.filter(variable => variable.name === 'i').map(variable => Number(variable.value)) ?? []
  ));

  assert.match(code, /int n = values\.length;/, `Array ${actionId}: debe explicar de dónde sale n.`);
  assert.doesNotMatch(code, /\bsize\b/, `Array ${actionId}: no debe depender de un size sin declarar.`);
  assert.ok(indexes.every((value, index) => index === 0 || value >= indexes[index - 1]), `Array ${actionId}: el recorrido debe avanzar desde 0.`);
  assert.deepEqual(frames.at(-1)?.values, result.values, `Array ${actionId}: código y animación terminan en estados distintos.`);
}

const sortingCases = [
  { label: 'mezclado', values: [5, 1, 4, 2, 8, 0, 2] },
  { label: 'ordenado', values: [-4, -1, 0, 3, 7, 12] },
  { label: 'inverso', values: [9, 7, 5, 3, 1, -1] },
  { label: 'repetidos', values: [4, 4, 2, 4, 2, 2, 4] },
  { label: 'negativos', values: [-3, -12, 5, 0, -3, 8] },
  { label: 'unitario', values: [42] },
  { label: 'vacío', values: [] },
];
for (const algorithmId of ['quick-sort', 'merge-sort']) {
  const sortAlgorithm = algorithms.find(item => item.id === algorithmId);
  const java = getBeginnerJava(sortAlgorithm, 'sort');
  assert.doesNotMatch(java, /bubbleSort|values\[i\]\s*>\s*values\[i\s*\+\s*1\]/, `${sortAlgorithm.name}: no debe reutilizar Bubble Sort.`);

  for (const { label, values } of sortingCases) {
    const result = run(sortAlgorithm, 'sort', {}, values);
    const expected = [...values].sort((a, b) => a - b);
    assert.deepEqual(result.values, expected, `${sortAlgorithm.name}/${label}: el resultado no quedó ordenado.`);
    assert.deepEqual(result.frames.at(-1)?.values, expected, `${sortAlgorithm.name}/${label}: el último fotograma no coincide con el resultado.`);
    assert.ok(
      result.frames.every(frame => typeof frame.codeNeedle === 'string' && java.includes(frame.codeNeedle)),
      `${sortAlgorithm.name}/${label}: un paso visual no corresponde a una línea del código mostrado.`,
    );
  }

  const trace = run(sortAlgorithm, 'sort', {}, [5, 1, 4, 2, 8, 0, 2]).frames;
  const synchronizedTrace = adaptFramesToCode(trace, java, true);
  assert.ok(synchronizedTrace.every(frame => Number.isInteger(frame.codeLine)), `${sortAlgorithm.name}: faltan líneas de código sincronizadas.`);

  if (algorithmId === 'quick-sort') {
    assert.match(java, /int partition\(int low, int high\)/, 'Quick Sort: falta mostrar partition.');
    assert.match(java, /int pivot = values\[high\]/, 'Quick Sort: falta seleccionar el pivote real.');
    assert.match(java, /quickSort\(low, pivotIndex - 1\)/, 'Quick Sort: falta la recursión izquierda.');
    assert.match(java, /quickSort\(pivotIndex \+ 1, high\)/, 'Quick Sort: falta la recursión derecha.');
    for (const phase of ['pivot-selected', 'partition-compare', 'quick-swap-call', 'pivot-fixed', 'quick-recursion']) {
      assert.ok(trace.some(frame => frame.sortPhase === phase), `Quick Sort: falta animar la fase ${phase}.`);
    }
    const conditions = trace
      .flatMap(frame => frame.variables ?? [])
      .filter(variable => variable.name === 'condición')
      .map(variable => variable.value);
    assert.ok(conditions.includes('true') && conditions.includes('false'), 'Quick Sort: las comparaciones deben mostrar resultados true y false.');
    assert.ok(trace.some(frame => frame.sortFixedPositions?.length > 0), 'Quick Sort: no marca los pivotes en su posición definitiva.');
  } else {
    assert.match(java, /int\[\] help = new int\[size\]/, 'Merge Sort: falta crear el arreglo auxiliar.');
    assert.match(java, /void mergeSort\(int left, int right, int\[\] help\)/, 'Merge Sort: falta mostrar la división recursiva.');
    assert.match(java, /void merge\(int left, int middle, int right, int\[\] help\)/, 'Merge Sort: falta mostrar el método merge.');
    for (const phase of ['merge-divide', 'merge-compare', 'merge-copy-left', 'merge-copy-right', 'merge-write']) {
      assert.ok(trace.some(frame => frame.sortPhase === phase), `Merge Sort: falta animar la fase ${phase}.`);
    }
    assert.ok(
      trace.some(frame => frame.sortAuxValues?.some(value => value !== undefined)),
      'Merge Sort: el arreglo help nunca muestra los valores copiados.',
    );
    assert.ok(
      trace.some(frame => frame.sortLeftRange && frame.sortRightRange),
      'Merge Sort: no distingue visualmente las dos mitades.',
    );
  }
}

console.log(`AUDITORÍA OK: ${algorithms.length} temas, ${actionCount} acciones, ${executionCount} pruebas funcionales y ${actionIds.size} funciones distintas.`);
