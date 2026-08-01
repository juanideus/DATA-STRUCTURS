import assert from 'node:assert/strict';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { adaptFramesToCode, createCodeSynchronizedFrames, createTreeSynchronizedFrames } from '../src/logic/codeAnimation.js';
import {
  DEFAULT_GRAPH_EDGES,
  executeOperation,
  getOperationDefinition,
} from '../src/logic/operations.js';

const EDGE_INPUTS = [
  '',
  ' ',
  '-1',
  '0',
  '1',
  '1.5',
  '0002',
  '999999999',
  'NaN',
  'Infinity',
  'abc',
  'áéíóú',
  '🙂',
  'A:B',
  '<script>alert(1)</script>',
];

const clone = value => structuredClone(value);
const defaultEdges = () => DEFAULT_GRAPH_EDGES.map(edge => [...edge]);
const failures = [];
let stressExecutions = 0;
let sequenceExecutions = 0;

function baselineFields(algorithm, actionId, trial = 0) {
  const length = Math.max(1, algorithm.values.length);
  const first = algorithm.values[trial % length] ?? algorithm.values[0];
  const fields = {
    value: typeof first === 'number' ? String(70 + trial) : `NUEVO${trial}`,
    second: `VALOR${trial}`,
    index: String(trial % length),
  };

  if (['remove-value', 'find'].includes(actionId)) fields.value = String(first);
  if (actionId === 'sorted-add') fields.value = String(90 + trial);
  if (['set-index', 'range-update'].includes(actionId)) fields.value = String(23 + trial);
  if (actionId === 'add-index') fields.index = String(trial % (algorithm.values.length + 1));
  if (['prefix-sum', 'range-min'].includes(actionId)) fields.index = String(trial % length);
  if (actionId === 'set-word') fields.value = algorithm.id === 'suffix-tree' ? `CASA${trial}` : `NODO${trial}`;
  if (['word-find', 'remove-word'].includes(actionId)) fields.value = algorithm.id === 'suffix-tree' ? 'ANA' : String(first);
  if (['hash-put', 'cache-put'].includes(actionId)) Object.assign(fields, { value: `NUEVA${trial}`, second: String(42 + trial) });
  if (actionId === 'cache-get') fields.value = String(first).split(':')[0];
  if (['bloom-add', 'bloom-check'].includes(actionId)) fields.value = `hola${trial}`;
  if (['set-expression', 'evaluate'].includes(actionId)) fields.value = '8+3*2';
  if (actionId === 'ast-build') fields.value = 'total = price + quantity * 2;';
  if (actionId === 'calculate') fields.value = String(trial % 10);
  if (actionId === 'hanoi-set') fields.value = String(1 + (trial % 7));
  if (algorithm.id === 'n-reinas') fields.value = String(4 + (trial % 5));
  if (actionId === 'union') Object.assign(fields, { value: String(trial % length), second: String((trial + 1) % length) });
  if (actionId === 'find-root') fields.value = String(trial % length);
  if (actionId === 'vertex-add') fields.value = String.fromCharCode(71 + (trial % 20));
  if (actionId === 'vertex-remove') fields.value = String(first);
  if (actionId === 'edge-add') Object.assign(fields, { value: 'A', second: 'C', index: '5' });
  if (actionId === 'edge-remove') Object.assign(fields, { value: 'A', second: 'B' });
  if (['bfs-run', 'dfs-run'].includes(actionId)) fields.value = String(first);
  if (actionId === 'shortest-path') Object.assign(fields, { value: String(algorithm.values[0]), second: String(algorithm.values.at(-1)), index: '' });
  if (algorithm.id === 'polinomios') {
    Object.assign(fields, {
      value: String(2 + trial),
      index: String(actionId === 'poly-remove-a' ? 14 : actionId === 'poly-remove-b' ? 10 : 12 - (trial % 6)),
    });
  }
  if (algorithm.id === 'listas-generalizadas') fields.value = '((a,b),((c,d),e))';
  if (algorithm.id === 'matriz') {
    Object.assign(fields, {
      value: String(30 + trial),
      second: String(trial % 4),
      index: String((trial + 1) % 4),
    });
  }
  if (algorithm.id === 'matriz-dispersa') {
    const cell = algorithm.values[trial % algorithm.values.length] ?? { value: 1, row: 0, column: 0 };
    Object.assign(fields, {
      value: String(actionId === 'matrix-insert' ? 30 + trial : cell.value),
      second: String(actionId === 'matrix-row' ? trial % 5 : cell.row),
      index: String(actionId === 'matrix-column' ? trial % 6 : cell.column),
    });
  }
  return fields;
}

function execute(algorithm, actionId, fields, values, edges) {
  return executeOperation({
    algorithm,
    actionId,
    fields,
    values: clone(values),
    edges: clone(edges),
    initialValues: clone(algorithm.values),
    initialEdges: defaultEdges(),
  });
}

function collectNumbers(value, path = 'result', found = []) {
  if (typeof value === 'number') found.push({ path, value });
  else if (Array.isArray(value)) value.forEach((item, index) => collectNumbers(item, `${path}[${index}]`, found));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) collectNumbers(item, `${path}.${key}`, found);
  }
  return found;
}

function normalized(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

function threadedInorderValues(values) {
  const result = [];
  const visit = index => {
    if (index >= values.length || values[index] === undefined || values[index] === null) return;
    visit(index * 2 + 1);
    result.push(Number(values[index]));
    visit(index * 2 + 2);
  };
  visit(0);
  return result;
}

function validateResult({ algorithm, actionId, fields, beforeValues, beforeEdges, result, label }) {
  assert.equal(typeof result.ok, 'boolean', `${label}: falta result.ok.`);
  assert.ok(Array.isArray(result.values), `${label}: result.values no es un arreglo.`);
  assert.ok(Array.isArray(result.edges), `${label}: result.edges no es un arreglo.`);
  assert.ok(typeof result.message === 'string' && result.message.trim(), `${label}: falta un mensaje útil.`);
  assert.doesNotThrow(() => JSON.stringify(result), `${label}: el resultado no se puede serializar.`);

  const invalidNumbers = collectNumbers({ values: result.values, edges: result.edges })
    .filter(item => !Number.isFinite(item.value));
  assert.deepEqual(invalidNumbers, [], `${label}: aparecieron NaN o infinitos.`);

  if (!result.ok) {
    assert.deepEqual(result.values, beforeValues, `${label}: una operación fallida modificó los valores.`);
    assert.deepEqual(result.edges, beforeEdges, `${label}: una operación fallida modificó las aristas.`);
  }

  if (algorithm.id === 'matriz-dispersa' && result.ok) {
    const keys = result.values.map(cell => `${cell.row}:${cell.column}`);
    assert.equal(new Set(keys).size, keys.length, `${label}: la matriz contiene coordenadas duplicadas.`);
    assert.ok(result.values.every(cell => (
      Number.isInteger(cell.row) && cell.row >= 0 && cell.row < 5
      && Number.isInteger(cell.column) && cell.column >= 0 && cell.column < 6
      && Number.isFinite(Number(cell.value))
    )), `${label}: la matriz contiene una celda fuera de rango.`);
  }

  if (algorithm.category === 'Grafos' && result.ok) {
    assert.equal(new Set(result.values.map(String)).size, result.values.length, `${label}: el grafo contiene vértices duplicados.`);
    assert.ok(result.edges.every(([from, to, weight = 1]) => (
      Number.isInteger(from) && Number.isInteger(to)
      && from >= 0 && to >= 0
      && from < result.values.length && to < result.values.length
      && from !== to && Number.isFinite(Number(weight))
    )), `${label}: el grafo contiene una arista inválida.`);
  }

  if (algorithm.id === 'arbol-enhebrado' && result.ok) {
    const compact = result.values.filter(value => value !== undefined && value !== null).map(Number);
    const inorder = threadedInorderValues(result.values);
    assert.deepEqual(inorder, [...inorder].sort((first, second) => first - second), `${label}: el orden BST se rompió.`);
    assert.equal(new Set(compact).size, compact.length, `${label}: aparecieron claves duplicadas.`);
    result.values.forEach((value, index) => {
      if (index === 0 || value === undefined || value === null) return;
      const parent = Math.floor((index - 1) / 2);
      assert.notEqual(result.values[parent], undefined, `${label}: el nodo ${value} quedó desconectado de su padre.`);
    });
  }

  const java = getBeginnerJava(algorithm, actionId);
  const sourceLines = java.split('\n');
  const customFrames = result.frames?.length ? result.frames : null;
  const frameFactory = algorithm.category === 'Árboles'
    ? createTreeSynchronizedFrames
    : createCodeSynchronizedFrames;
  const frames = customFrames
    ? adaptFramesToCode(customFrames, java, true)
    : frameFactory({
        algorithm,
        code: java,
        actionId,
        beforeValues,
        afterValues: result.values,
        beforeEdges,
        afterEdges: result.edges,
        finalStep: result.step,
        finalMessage: result.message,
        succeeded: result.ok,
        inputValues: fields,
      });

  assert.ok(frames.length > 0, `${label}: no genera animación.`);
  assert.ok(frames.every(frame => (
    Number.isInteger(frame.codeLine)
    && frame.codeLine >= 0
    && frame.codeLine < sourceLines.length
  )), `${label}: una animación apunta fuera del código.`);
  assert.ok(frames.every(frame => typeof frame.message === 'string' && frame.message.trim()), `${label}: un cuadro no explica el paso.`);
  assert.deepEqual(frames.at(-1).values, result.values, `${label}: el último cuadro no coincide con los valores finales.`);
  if (frames.at(-1).edges !== undefined) {
    assert.deepEqual(frames.at(-1).edges, result.edges, `${label}: el último cuadro no coincide con las aristas finales.`);
  }

  for (let index = 0; index < (customFrames?.length ?? 0); index++) {
    const needle = customFrames[index].codeNeedle;
    if (!needle) continue;
    const mappedLine = normalized(sourceLines[frames[index].codeLine]);
    assert.ok(
      mappedLine.includes(normalized(needle)),
      `${label}: "${needle}" se iluminó sobre "${sourceLines[frames[index].codeLine]?.trim()}".`,
    );
  }

  for (const [frameIndex, frame] of frames.entries()) {
    if (frame.variables === undefined) continue;
    assert.ok(Array.isArray(frame.variables), `${label}/cuadro-${frameIndex}: variables no es un arreglo.`);
    assert.ok(frame.variables.every(variable => (
      typeof variable.name === 'string' && variable.name.trim()
      && Object.hasOwn(variable, 'value')
    )), `${label}/cuadro-${frameIndex}: una variable está incompleta.`);
  }
}

function recordFailure(label, error) {
  failures.push(`${label}: ${String(error.message).split('\n')[0]}`);
}

for (const algorithm of algorithms) {
  const definition = getOperationDefinition(algorithm);
  for (const action of definition.actions) {
    const baseline = baselineFields(algorithm, action.id);
    const profiles = [{ name: 'válido', fields: baseline }];

    for (const field of definition.fields) {
      for (const edgeValue of EDGE_INPUTS) {
        profiles.push({
          name: `${field.id}=${JSON.stringify(edgeValue)}`,
          fields: { ...baseline, [field.id]: edgeValue },
        });
      }
    }
    for (const edgeValue of EDGE_INPUTS) {
      profiles.push({
        name: `todos=${JSON.stringify(edgeValue)}`,
        fields: Object.fromEntries(definition.fields.map(field => [field.id, edgeValue])),
      });
    }

    for (const profile of profiles) {
      stressExecutions++;
      const beforeValues = clone(algorithm.values);
      const beforeEdges = defaultEdges();
      const label = `${algorithm.id}/${action.id}/${profile.name}`;
      try {
        const result = execute(algorithm, action.id, profile.fields, beforeValues, beforeEdges);
        validateResult({
          algorithm,
          actionId: action.id,
          fields: profile.fields,
          beforeValues,
          beforeEdges,
          result,
          label,
        });
      } catch (error) {
        recordFailure(label, error);
      }
    }
  }
}

// Secuencias deterministas: mezclan éxitos y errores sobre el mismo estado.
for (const algorithm of algorithms) {
  const actions = getOperationDefinition(algorithm).actions;
  if (actions.length === 0) continue;
  let values = clone(algorithm.values);
  let edges = defaultEdges();
  for (let index = 0; index < 60; index++) {
    const action = actions[index % actions.length];
    const baseline = baselineFields(algorithm, action.id, index);
    const fields = index % 4 === 0
      ? Object.fromEntries(getOperationDefinition(algorithm).fields.map(field => [
          field.id,
          EDGE_INPUTS[(index + field.id.length) % EDGE_INPUTS.length],
        ]))
      : baseline;
    const beforeValues = clone(values);
    const beforeEdges = clone(edges);
    const label = `${algorithm.id}/secuencia-${index + 1}/${action.id}`;
    sequenceExecutions++;
    try {
      const result = execute(algorithm, action.id, fields, beforeValues, beforeEdges);
      validateResult({
        algorithm,
        actionId: action.id,
        fields,
        beforeValues,
        beforeEdges,
        result,
        label,
      });
      values = clone(result.values);
      edges = clone(result.edges);
    } catch (error) {
      recordFailure(label, error);
    }
  }
}

if (failures.length) {
  console.error(`AUDITORÍA DE ESTRÉS: ${failures.length} errores encontrados.`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `AUDITORÍA DE ESTRÉS OK: ${stressExecutions} entradas extremas y `
    + `${sequenceExecutions} operaciones encadenadas (${stressExecutions + sequenceExecutions} pruebas).`,
  );
}
