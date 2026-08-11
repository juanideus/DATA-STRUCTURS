import { algorithms } from '../data/algorithms.js';
import { DEFAULT_GRAPH_EDGES, executeOperation, getOperationDefinition, operationGroup } from './operations.js';

const THEORY_TYPES = new Set(['theory', 'complexity', 'oop']);
const SPECIALIZED_CHALLENGE_IDS = new Set(['array', 'pila', 'cola', 'bst', 'avl']);

export const CHALLENGE_ALGORITHM_IDS = Object.freeze(
  algorithms.filter(algorithm => !THEORY_TYPES.has(algorithm.type)).map(algorithm => algorithm.id),
);

export const EMPTY_CHALLENGE_PROGRESS = Object.freeze({
  attempts: 0,
  correct: 0,
  hints: 0,
  byAlgorithm: {},
});

const present = value => value !== undefined && value !== null && value !== '∅';
const numericValues = values => values.filter(present).map(Number).filter(Number.isFinite);

export function supportsChallenges(algorithmOrId) {
  if (typeof algorithmOrId === 'string') return CHALLENGE_ALGORITHM_IDS.includes(algorithmOrId);
  return Boolean(algorithmOrId?.id && !THEORY_TYPES.has(algorithmOrId.type) && getOperationDefinition(algorithmOrId)?.actions?.length);
}

export function normalizeChallengeProgress(value) {
  const progress = value && typeof value === 'object' ? value : {};
  const byAlgorithm = progress.byAlgorithm && typeof progress.byAlgorithm === 'object'
    ? Object.fromEntries(Object.entries(progress.byAlgorithm).map(([id, item]) => [id, {
        attempts: Math.max(0, Number(item?.attempts) || 0),
        correct: Math.max(0, Number(item?.correct) || 0),
      }]))
    : {};
  return {
    attempts: Math.max(0, Number(progress.attempts) || 0),
    correct: Math.max(0, Number(progress.correct) || 0),
    hints: Math.max(0, Number(progress.hints) || 0),
    byAlgorithm,
  };
}

export function recordChallengeAttempt(progress, algorithmId, correct, usedHint = false) {
  const current = normalizeChallengeProgress(progress);
  const topic = current.byAlgorithm[algorithmId] ?? { attempts: 0, correct: 0 };
  return {
    attempts: current.attempts + 1,
    correct: current.correct + (correct ? 1 : 0),
    hints: current.hints + (usedHint ? 1 : 0),
    byAlgorithm: {
      ...current.byAlgorithm,
      [algorithmId]: {
        attempts: topic.attempts + 1,
        correct: topic.correct + (correct ? 1 : 0),
      },
    },
  };
}

function nextUniqueValue(values, direction = 1) {
  const numbers = numericValues(values);
  const occupied = new Set(numbers);
  let candidate = numbers.length
    ? (direction < 0 ? Math.min(...numbers) - 1 : Math.max(...numbers) + 1)
    : 10;
  while (occupied.has(candidate)) candidate += direction < 0 ? -1 : 1;
  return candidate;
}

function makeChoices(correctValue, distractors, seed = 0, formatter = value => String(value)) {
  const unique = [];
  for (const value of [correctValue, ...distractors]) {
    if (value === undefined || value === null) continue;
    if (!unique.some(item => String(item) === String(value))) unique.push(value);
    if (unique.length === 3) break;
  }
  let offset = 1;
  while (unique.length < 3) {
    const fallback = typeof correctValue === 'number' ? correctValue + offset : `Opción ${offset}`;
    if (!unique.some(item => String(item) === String(fallback))) unique.push(fallback);
    offset += 1;
  }
  const rotation = Math.abs(Number(seed) || 0) % unique.length;
  const ordered = [...unique.slice(rotation), ...unique.slice(0, rotation)];
  const options = ordered.map((value, index) => ({
    id: `option-${index}`,
    label: formatter(value),
    value,
  }));
  const correctChoiceId = options.find(option => String(option.value) === String(correctValue))?.id;
  return { options, correctChoiceId };
}

function createArrayChallenge(values, attempt) {
  const before = values.filter(present);
  if (before.length > 1 && attempt % 2 === 1) {
    const correct = before[1];
    const choices = makeChoices(correct, [before[0], before.at(-1)], attempt + before.length);
    return {
      question: 'Si eliminamos el elemento del inicio, ¿qué valor quedará en el índice 0?',
      hint: 'Al eliminar el inicio, todos los elementos restantes se desplazan una posición hacia la izquierda.',
      explanation: `${before[0]} sale del arreglo y ${correct}, que estaba en el índice 1, pasa al índice 0.`,
      action: { id: 'remove-start', fields: {} },
      expectedOutcome: { kind: 'first', value: correct },
      ...choices,
    };
  }
  const value = nextUniqueValue(before);
  const index = before.length;
  const choices = makeChoices(index, [Math.max(0, index - 1), index + 1], attempt + value, value => `Índice ${value}`);
  return {
    question: `El arreglo tiene ${before.length} elementos. Si agregamos ${value} al final, ¿en qué índice quedará?`,
    hint: 'Los índices empiezan en 0. El índice del nuevo elemento es igual al tamaño anterior del arreglo.',
    explanation: `Antes de insertar, el tamaño es ${before.length}; por eso ${value} ocupa el índice ${index}. El nuevo tamaño será ${before.length + 1}.`,
    action: { id: 'add-end', fields: { value: String(value), index: '' } },
    expectedOutcome: { kind: 'indexOf', target: value, value: index },
    ...choices,
  };
}

function createStackChallenge(values, attempt) {
  const before = values.filter(present);
  if (before.length > 1 && (attempt % 2 === 0 || before.length >= 15)) {
    const correct = before.at(-2);
    const choices = makeChoices(correct, [before.at(-1), before[0]], attempt + before.length);
    return {
      question: `Si ejecutamos Pop, ¿cuál será el nuevo tope después de retirar ${before.at(-1)}?`,
      hint: 'Una pila sigue la regla LIFO: el último elemento agregado es el primero que sale.',
      explanation: `${before.at(-1)} sale primero y el elemento que estaba justo debajo, ${correct}, se convierte en el nuevo tope.`,
      action: { id: 'pop', fields: {} },
      expectedOutcome: { kind: 'last', value: correct },
      ...choices,
    };
  }
  const value = nextUniqueValue(before);
  const choices = makeChoices(value, [before.at(-1), before[0]], attempt + value);
  return {
    question: `Si hacemos Push(${value}), ¿qué valor quedará en el tope de la pila?`,
    hint: 'Push siempre coloca el nuevo valor por encima del tope actual.',
    explanation: `Push agrega ${value} en la última posición y top avanza hasta ese elemento.`,
    action: { id: 'push', fields: { value: String(value) } },
    expectedOutcome: { kind: 'last', value },
    ...choices,
  };
}

function createQueueChallenge(values, attempt) {
  const before = values.filter(present);
  if (before.length > 1 && (attempt % 2 === 0 || before.length >= 15)) {
    const correct = before[1];
    const choices = makeChoices(correct, [before[0], before.at(-1)], attempt + before.length);
    return {
      question: `Si ejecutamos Dequeue y sale ${before[0]}, ¿qué valor se convertirá en el nuevo front?`,
      hint: 'Una cola sigue la regla FIFO: sale primero quien lleva más tiempo esperando.',
      explanation: `front avanza desde ${before[0]} hasta el siguiente nodo, que contiene ${correct}.`,
      action: { id: 'dequeue', fields: {} },
      expectedOutcome: { kind: 'first', value: correct },
      ...choices,
    };
  }
  const value = nextUniqueValue(before);
  const choices = makeChoices(value, [before[0], before.at(-1)], attempt + value);
  return {
    question: `Si hacemos Enqueue(${value}), ¿qué valor quedará señalado por rear?`,
    hint: 'Enqueue agrega el nuevo nodo al final; rear siempre apunta al último nodo.',
    explanation: `${value} se enlaza después del antiguo final y rear avanza hasta el nodo nuevo.`,
    action: { id: 'enqueue', fields: { value: String(value) } },
    expectedOutcome: { kind: 'last', value },
    ...choices,
  };
}

function treeHasValue(values, value) {
  return values.some(item => present(item) && Number(item) === Number(value));
}

function findTreePosition(values, value) {
  let index = 0;
  let comparisons = 0;
  while (index < 15 && present(values[index])) {
    comparisons += 1;
    if (Number(values[index]) === Number(value)) return { index, comparisons, found: true };
    index = Number(value) < Number(values[index]) ? index * 2 + 1 : index * 2 + 2;
  }
  return { index, comparisons, found: false };
}

function treeFallbackChallenge(algorithmId, values, attempt) {
  const populated = values
    .map((value, index) => ({ value, index }))
    .filter(item => present(item.value));
  const target = populated.sort((first, second) => second.index - first.index)[0]?.value ?? values[0] ?? 0;
  const { comparisons } = findTreePosition(values, target);
  const choices = makeChoices(comparisons, [Math.max(1, comparisons - 1), comparisons + 1], attempt + comparisons, value => `${value} comparaciones`);
  return {
    question: `Al buscar ${target}, ¿cuántos nodos se compararán antes de encontrarlo?`,
    hint: 'Cuenta la raíz y cada nodo del camino elegido por las comparaciones menor/mayor.',
    explanation: `La búsqueda llega hasta ${target} después de ${comparisons} comparaciones.`,
    action: { id: 'find', fields: { value: String(target) } },
    expectedOutcome: { kind: 'unchanged', values: [...values] },
    ...choices,
  };
}

function createBstChallenge(values, attempt) {
  const numbers = numericValues(values);
  if (!numbers.length) {
    const value = 10;
    const choices = makeChoices(value, [5, 15], attempt + value);
    return {
      question: `El Binary Search Tree está vacío. Si insertamos ${value}, ¿qué nodo será la raíz?`,
      hint: 'Cuando root es null, el primer nodo insertado se convierte directamente en la raíz.',
      explanation: `${value} es el primer valor y ocupa la raíz porque todavía no existen nodos para comparar.`,
      action: { id: 'tree-add', fields: { value: String(value) } },
      expectedOutcome: { kind: 'root', value },
      ...choices,
    };
  }
  const candidates = [nextUniqueValue(numbers, -1), nextUniqueValue(numbers, 1)];
  for (let value = 1; value <= 99 && candidates.length < 100; value += 1) {
    if (!treeHasValue(values, value)) candidates.push(value);
  }
  const candidate = candidates.find(value => findTreePosition(values, value).index < 15);
  if (candidate === undefined) return treeFallbackChallenge('bst', values, attempt);
  const position = findTreePosition(values, candidate).index;
  const parentIndex = Math.floor((position - 1) / 2);
  const parent = values[parentIndex];
  const side = position === parentIndex * 2 + 1 ? 'izquierdo' : 'derecho';
  const correct = `${side} de ${parent}`;
  const choices = makeChoices(correct, [
    `${side === 'izquierdo' ? 'derecho' : 'izquierdo'} de ${parent}`,
    `raíz del árbol`,
  ], attempt + candidate);
  return {
    question: `¿Dónde se insertará ${candidate} al seguir las comparaciones del Binary Search Tree?`,
    hint: `Comienza en ${values[0]}. Si ${candidate} es menor avanza a la izquierda; si es mayor, a la derecha.`,
    explanation: `${candidate} sigue el orden del BST hasta una referencia null y queda como hijo ${correct}.`,
    action: { id: 'tree-add', fields: { value: String(candidate) } },
    expectedOutcome: { kind: 'treeIndex', target: candidate, value: position },
    ...choices,
  };
}

const avlHeight = node => node?.height ?? 0;
const updateHeight = node => {
  if (node) node.height = 1 + Math.max(avlHeight(node.left), avlHeight(node.right));
  return node;
};

function slotsToAvl(values, index = 0) {
  if (index >= values.length || !present(values[index])) return null;
  return updateHeight({
    value: values[index],
    left: slotsToAvl(values, index * 2 + 1),
    right: slotsToAvl(values, index * 2 + 2),
    height: 1,
  });
}

function rotateRight(root) {
  const nextRoot = root.left;
  root.left = nextRoot.right;
  nextRoot.right = root;
  updateHeight(root);
  return updateHeight(nextRoot);
}

function rotateLeft(root) {
  const nextRoot = root.right;
  root.right = nextRoot.left;
  nextRoot.left = root;
  updateHeight(root);
  return updateHeight(nextRoot);
}

function insertAvl(root, value, rotations) {
  if (!root) return { value, left: null, right: null, height: 1 };
  if (Number(value) < Number(root.value)) root.left = insertAvl(root.left, value, rotations);
  else if (Number(value) > Number(root.value)) root.right = insertAvl(root.right, value, rotations);
  else return root;
  updateHeight(root);
  const balance = avlHeight(root.left) - avlHeight(root.right);
  if (balance > 1 && Number(value) < Number(root.left.value)) {
    rotations.push('LL');
    return rotateRight(root);
  }
  if (balance < -1 && Number(value) > Number(root.right.value)) {
    rotations.push('RR');
    return rotateLeft(root);
  }
  if (balance > 1 && Number(value) > Number(root.left.value)) {
    rotations.push('LR');
    root.left = rotateLeft(root.left);
    return rotateRight(root);
  }
  if (balance < -1 && Number(value) < Number(root.right.value)) {
    rotations.push('RL');
    root.right = rotateRight(root.right);
    return rotateLeft(root);
  }
  return root;
}

function avlToSlots(root) {
  const values = [];
  let hidden = false;
  const place = (node, index) => {
    if (!node) return;
    if (index >= 15) {
      hidden = true;
      return;
    }
    values[index] = node.value;
    place(node.left, index * 2 + 1);
    place(node.right, index * 2 + 2);
  };
  place(root, 0);
  return { values, hidden };
}

function simulateAvlInsertion(values, value) {
  const rotations = [];
  const root = insertAvl(slotsToAvl(values), value, rotations);
  const slots = avlToSlots(root);
  return {
    ...slots,
    rotations,
    root: root?.value,
    balance: root ? avlHeight(root.left) - avlHeight(root.right) : 0,
  };
}

function createAvlChallenge(values, attempt) {
  if (numericValues(values).length >= 15) return treeFallbackChallenge('avl', values, attempt);
  const numbers = numericValues(values);
  const candidates = [nextUniqueValue(numbers, -1), nextUniqueValue(numbers, 1)];
  for (let value = 1; value <= 99 && candidates.length < 100; value += 1) {
    if (!treeHasValue(values, value)) candidates.push(value);
  }
  const simulations = candidates
    .map(value => ({ value, result: simulateAvlInsertion(values, value) }))
    .filter(item => !item.result.hidden);
  const selected = simulations.find(item => item.result.rotations.length) ?? simulations[attempt % Math.max(1, simulations.length)];
  if (!selected) return treeFallbackChallenge('avl', values, attempt);

  const { value, result } = selected;
  if (result.rotations.length) {
    const choices = makeChoices(result.root, [values[0], value], attempt + value);
    return {
      question: `Al insertar ${value}, el AVL necesita una rotación ${result.rotations.join(' + ')}. ¿Cuál será la nueva raíz?`,
      hint: 'Una rotación mueve hacia arriba el nodo central para recuperar una diferencia de alturas de −1, 0 o 1.',
      explanation: `La inserción desequilibra el árbol y la rotación ${result.rotations.join(' + ')} deja a ${result.root} como raíz balanceada.`,
      action: { id: 'tree-add', fields: { value: String(value) } },
      expectedOutcome: { kind: 'root', value: result.root },
      ...choices,
    };
  }

  const balanceLabel = balance => balance === 0
    ? '0 · alturas iguales'
    : balance > 0 ? `${balance} · más alto a la izquierda` : `${balance} · más alto a la derecha`;
  const choices = makeChoices(result.balance, [result.balance === 0 ? 1 : 0, result.balance === -1 ? 1 : -1], attempt + value, balanceLabel);
  return {
    question: `Después de insertar ${value}, ¿qué factor de balance tendrá la raíz ${result.root}?`,
    hint: 'Factor de balance = altura del subárbol izquierdo − altura del subárbol derecho.',
    explanation: `Tras insertar ${value}, las alturas de la raíz ${result.root} producen un factor ${result.balance}. Como está entre −1 y 1, no necesita rotación.`,
    action: { id: 'tree-add', fields: { value: String(value) } },
    expectedOutcome: { kind: 'rootBalance', value: result.balance },
    ...choices,
  };
}

function genericFields(actionId, algorithm, values, attempt) {
  const available = values.filter(present);
  const first = available[0];
  const second = available[1] ?? first;
  const nextNumber = nextUniqueValue(available);
  const nextLabel = `N${available.length + attempt + 1}`;
  const fields = { value: '', second: '', index: '' };

  if (['add-start', 'add-end', 'add-index', 'set-index', 'push', 'enqueue', 'sorted-add', 'tree-add', 'heap-add'].includes(actionId)) {
    fields.value = String(['quadtree', 'octree', 'merkle-tree'].includes(algorithm.id) ? nextLabel : nextNumber);
  }
  if (['remove-value', 'find', 'word-find', 'remove-word', 'cache-get', 'bloom-check'].includes(actionId)) fields.value = String(first ?? nextNumber);
  if (['remove-index', 'set-index', 'add-index', 'range-update', 'prefix-sum', 'range-min'].includes(actionId)) fields.index = '0';
  if (actionId === 'range-update') fields.value = '2';
  if (actionId === 'set-word') fields.value = `PALABRA${attempt + 1}`;
  if (actionId === 'set-expression') fields.value = '(8 + 3) * 2';
  if (actionId === 'ast-build') fields.value = 'total = price + quantity * 2;';
  if (actionId === 'hash-put' || actionId === 'cache-put') {
    fields.value = nextLabel;
    fields.second = `dato${attempt + 1}`;
  }
  if (actionId === 'vertex-add') fields.value = nextLabel;
  if (actionId === 'vertex-remove') fields.value = String(first ?? 'A');
  if (['edge-add', 'edge-remove'].includes(actionId)) {
    fields.value = String(first ?? 'A');
    fields.second = String(second ?? 'B');
    fields.index = '2';
  }
  if (['bfs-run', 'dfs-run', 'prim-run'].includes(actionId)) fields.value = String(first ?? 'A');
  if (actionId === 'calculate') fields.value = '5';
  if (actionId === 'hanoi-set') fields.value = '4';
  if (['solve', 'step-solution'].includes(actionId) && algorithm.id === 'n-reinas') fields.value = '4';
  if (['matrix-set', 'matrix-get', 'matrix-row', 'matrix-column', 'matrix-insert', 'matrix-remove'].includes(actionId)) {
    fields.second = '0';
    fields.index = '0';
    fields.value = '9';
  }
  if (actionId.startsWith('poly-')) {
    fields.value = '2';
    fields.index = '3';
  }
  if (actionId === 'glist-build') fields.value = '(a,(b,c),d)';
  if (actionId === 'union') {
    fields.value = '0';
    fields.second = '1';
  }
  if (actionId === 'find-root') fields.value = '1';
  if (actionId === 'bloom-add') fields.value = `dato-${attempt + 1}`;
  return fields;
}

function itemLabel(algorithm) {
  const group = operationGroup(algorithm);
  if (group === 'matrix') return 'celdas';
  if (group === 'sparseMatrix') return 'celdas no nulas';
  if (group === 'graph' || group === 'shortestPath') return 'vértices';
  if (['tree', 'threadedTree', 'heap', 'btree', 'spatial', 'ast'].includes(group)) return 'posiciones del árbol';
  if (group === 'polynomial') return 'términos almacenados';
  if (group === 'bloom') return 'bits visibles';
  if (group === 'sudoku') return 'celdas del tablero';
  if (group === 'maze') return 'celdas del laberinto';
  return 'datos visibles';
}

function createGenericChallenge(algorithm, values, attempt) {
  const definition = getOperationDefinition(algorithm);
  const actions = definition?.actions ?? [];
  const edges = Array.isArray(algorithm.edges) ? algorithm.edges.map(edge => [...edge]) : DEFAULT_GRAPH_EDGES.map(edge => [...edge]);

  for (let offset = 0; offset < actions.length; offset += 1) {
    const action = actions[(attempt + offset) % actions.length];
    if (action.id === 'shuffle') continue;
    const fields = genericFields(action.id, algorithm, values, attempt);
    const result = executeOperation({
      algorithm,
      actionId: action.id,
      fields,
      values: [...values],
      edges,
      initialValues: [...values],
      initialEdges: edges,
    });
    if (!result || result.ok === false || !Array.isArray(result.values)) continue;

    const count = result.values.filter(present).length;
    const beforeCount = values.filter(present).length;
    const noun = itemLabel(algorithm);
    const choices = makeChoices(count, [Math.max(0, count - 1), count + 1], attempt + count, value => `${value} ${noun}`);
    const change = count === beforeCount
      ? `La cantidad se mantiene en ${count}`
      : `La cantidad cambia de ${beforeCount} a ${count}`;
    return {
      question: `Después de ejecutar «${action.label}», ¿cuántos ${noun} tendrá ${algorithm.name}?`,
      hint: `Sigue la operación «${action.label}» paso a paso y cuenta solamente los datos que permanecen almacenados al terminar.`,
      explanation: `${change}. ${result.message}`,
      action: { id: action.id, fields },
      expectedOutcome: { kind: 'length', value: count },
      ...choices,
    };
  }

  return null;
}

export function createChallenge(algorithm, values, attempt = 0) {
  if (!supportsChallenges(algorithm)) return null;
  const safeValues = Array.isArray(values) ? [...values] : [];
  const factories = {
    array: createArrayChallenge,
    pila: createStackChallenge,
    cola: createQueueChallenge,
    bst: createBstChallenge,
    avl: createAvlChallenge,
  };
  const safeAttempt = Math.max(0, Number(attempt) || 0);
  const challenge = SPECIALIZED_CHALLENGE_IDS.has(algorithm.id)
    ? factories[algorithm.id](safeValues, safeAttempt)
    : createGenericChallenge(algorithm, safeValues, safeAttempt);
  if (!challenge) return null;
  return {
    id: `${algorithm.id}-${attempt}-${challenge.action.id}`,
    algorithmId: algorithm.id,
    ...challenge,
  };
}

export function challengeOutcomeMatches(challenge, resultValues) {
  if (!challenge?.expectedOutcome || !Array.isArray(resultValues)) return false;
  const expected = challenge.expectedOutcome;
  switch (expected.kind) {
    case 'first': return String(resultValues[0]) === String(expected.value);
    case 'last': return String(resultValues.at(-1)) === String(expected.value);
    case 'indexOf': return resultValues.findIndex(value => Number(value) === Number(expected.target)) === expected.value;
    case 'treeIndex': return resultValues.findIndex(value => Number(value) === Number(expected.target)) === expected.value;
    case 'root': return Number(resultValues[0]) === Number(expected.value);
    case 'rootBalance': {
      const root = slotsToAvl(resultValues);
      const balance = root ? avlHeight(root.left) - avlHeight(root.right) : 0;
      return balance === expected.value;
    }
    case 'length': return resultValues.filter(present).length === expected.value;
    case 'unchanged': return JSON.stringify(resultValues) === JSON.stringify(expected.values);
    default: return false;
  }
}
