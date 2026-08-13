import { DEFAULT_PATH_MAP, runGridPathfinding } from './pathfindingMap.js';
import { astPreorderPositions, parseSimpleJavaAssignment } from './ast.js';
import {
  DENSE_MATRIX_CELL_COUNT,
  DENSE_MATRIX_SIZE,
  denseMatrixIndex,
  normalizeDenseMatrixValues,
  validDenseMatrixCoordinate,
} from './denseMatrix.js';
import {
  generalizedItemToString,
  generalizedListDepth,
  generalizedListToString,
  parseGeneralizedList,
} from './generalizedList.js';
import {
  addPolynomials,
  combinePolynomialValues,
  formatPolynomial,
  insertPolynomialTerm,
  polynomialTerms,
} from './polynomial.js';

export const DEFAULT_GRAPH_EDGES = [
  [0, 1, 4], [1, 2, 2], [0, 3, 7], [1, 3, 3], [1, 4, 5],
  [2, 4, 6], [3, 4, 1], [4, 5, 4], [2, 5, 8],
];

export const DEFAULT_GRAPH_POSITIONS = [[14,24],[42,12],[72,20],[90,48],[72,76],[42,68],[14,76],[7,48]];

const field = (id, label, type = 'text') => ({ id, label, type });
const action = (id, label, tone = 'default') => ({ id, label, tone });

const definitions = {
  theory: {
    fields: [],
    actions: [],
  },
  complexity: {
    fields: [],
    actions: [],
  },
  oop: {
    fields: [],
    actions: [],
  },
  foundation: {
    fields: [],
    actions: [],
  },
  array: {
    fields: [field('value', 'Valor', 'number'), field('index', 'Índice', 'number')],
    actions: [action('add-start', 'Agregar inicio'), action('add-end', 'Agregar final'), action('add-index', 'Agregar en índice'), action('set-index', 'Actualizar índice'), action('remove-start', 'Eliminar inicio', 'danger'), action('remove-end', 'Eliminar final', 'danger'), action('remove-index', 'Eliminar índice', 'danger')],
  },
  stack: {
    fields: [field('value', 'Valor', 'number')],
    actions: [action('push', 'Push'), action('pop', 'Pop', 'danger'), action('peek', 'Peek'), action('clear', 'Vaciar', 'danger')],
  },
  queue: {
    fields: [field('value', 'Valor', 'number')],
    actions: [action('enqueue', 'Enqueue'), action('dequeue', 'Dequeue', 'danger'), action('front', 'Ver frente'), action('clear', 'Vaciar', 'danger')],
  },
  deque: {
    fields: [field('value', 'Valor', 'number')],
    actions: [action('add-start', 'Agregar frente'), action('add-end', 'Agregar final'), action('remove-start', 'Quitar frente', 'danger'), action('remove-end', 'Quitar final', 'danger')],
  },
  list: {
    fields: [field('value', 'Valor', 'number'), field('index', 'Índice', 'number')],
    actions: [
      action('add-start', 'Insertar inicio'),
      action('add-end', 'Insertar final'),
      action('add-index', 'Insertar en índice'),
      action('remove-start', 'Eliminar inicio', 'danger'),
      action('remove-end', 'Eliminar final', 'danger'),
      action('remove-index', 'Eliminar índice', 'danger'),
      action('remove-value', 'Eliminar valor', 'danger'),
      action('find', 'Buscar'),
    ],
  },
  skip: {
    fields: [field('value', 'Valor', 'number')],
    actions: [action('sorted-add', 'Insertar'), action('remove-value', 'Eliminar', 'danger'), action('find', 'Buscar'), action('clear', 'Vaciar', 'danger')],
  },
  tree: {
    fields: [field('value', 'Valor', 'number')],
    actions: [action('tree-add', 'Insertar nodo'), action('remove-value', 'Eliminar nodo', 'danger'), action('find', 'Buscar'), action('preorder', 'Preorden'), action('inorder', 'Inorden'), action('postorder', 'Postorden')],
  },
  threadedTree: {
    fields: [field('value', 'Valor', 'number')],
    actions: [action('tree-add', 'Insertar nodo'), action('remove-value', 'Eliminar nodo', 'danger'), action('find', 'Buscar'), action('inorder', 'Inorden sin pila')],
  },
  spatial: {
    fields: [field('value', 'Punto / valor')],
    actions: [action('tree-add', 'Insertar punto'), action('remove-value', 'Eliminar', 'danger'), action('find', 'Buscar'), action('preorder', 'Recorrer')],
  },
  heap: {
    fields: [field('value', 'Prioridad', 'number')],
    actions: [action('heap-add', 'Insertar'), action('heap-extract', 'Extraer raíz', 'danger'), action('peek', 'Ver raíz'), action('clear', 'Vaciar', 'danger')],
  },
  trie: {
    fields: [field('value', 'Palabra')],
    actions: [action('set-word', 'Insertar palabra'), action('word-find', 'Buscar palabra'), action('remove-word', 'Eliminar palabra', 'danger'), action('clear', 'Vaciar', 'danger')],
  },
  range: {
    fields: [field('value', 'Valor / delta', 'number'), field('index', 'Índice / límite', 'number')],
    actions: [action('range-update', 'Actualizar índice'), action('prefix-sum', 'Suma prefijo'), action('range-min', 'Mínimo prefijo'), action('reset', 'Restablecer')],
  },
  btree: {
    fields: [field('value', 'Clave', 'number')],
    actions: [action('sorted-add', 'Insertar clave'), action('remove-value', 'Eliminar clave', 'danger'), action('find', 'Buscar'), action('range-view', 'Recorrer hojas')],
  },
  merkle: {
    fields: [field('value', 'Bloque')],
    actions: [action('add-end', 'Agregar bloque'), action('remove-end', 'Quitar bloque', 'danger'), action('merkle-root', 'Calcular raíz'), action('clear', 'Vaciar', 'danger')],
  },
  expression: {
    fields: [field('value', 'Expresión')],
    actions: [action('set-expression', 'Construir'), action('evaluate', 'Evaluar'), action('preorder', 'Prefija'), action('postorder', 'Postfija')],
  },
  ast: {
    fields: [field('value', 'Código Java simple')],
    actions: [
      action('ast-build', 'Construir AST'),
      action('ast-preorder', 'Recorrer preorden'),
      action('ast-clear', 'Vaciar', 'danger'),
    ],
  },
  hash: {
    fields: [field('value', 'Clave'), field('second', 'Valor')],
    actions: [action('hash-put', 'Guardar'), action('remove-value', 'Eliminar clave', 'danger'), action('find', 'Buscar clave'), action('clear', 'Vaciar', 'danger')],
  },
  graph: {
    fields: [field('value', 'Origen / vértice'), field('second', 'Destino'), field('index', 'Peso', 'number')],
    actions: [action('vertex-add', 'Agregar vértice'), action('vertex-remove', 'Eliminar vértice', 'danger'), action('edge-add', 'Agregar arista'), action('edge-remove', 'Eliminar arista', 'danger'), action('bfs-run', 'Recorrer BFS'), action('dfs-run', 'Recorrer DFS')],
  },
  shortestPath: {
    fields: [],
    actions: [action('shortest-path', 'Buscar ruta'), action('reset', 'Restablecer')],
  },
  sort: {
    fields: [field('value', 'Valor', 'number')],
    actions: [action('add-end', 'Agregar'), action('remove-value', 'Eliminar', 'danger'), action('shuffle', 'Mezclar'), action('sort', 'Ordenar'), action('reset', 'Restablecer')],
  },
  math: {
    fields: [field('value', 'Número n', 'number')],
    actions: [action('calculate', 'Calcular'), action('reset', 'Restablecer')],
  },
  hanoi: {
    fields: [field('value', 'Cantidad de discos', 'number')],
    actions: [action('hanoi-set', 'Crear torres'), action('hanoi-solve', 'Resolver'), action('reset', 'Restablecer')],
  },
  queens: {
    fields: [field('value', 'Tamaño', 'number')],
    actions: [action('solve', 'Resolver'), action('step-solution', 'Ejecutar paso a paso'), action('reset', 'Restablecer')],
  },
  maze: {
    fields: [],
    actions: [action('solve', 'Resolver recursivamente'), action('step-solution', 'Siguiente paso'), action('reset', 'Restablecer')],
  },
  sudoku: {
    fields: [],
    actions: [action('solve', 'Resolver 9×9'), action('step-solution', 'Ejecutar paso a paso'), action('reset', 'Restablecer')],
  },
  union: {
    fields: [field('value', 'Elemento A', 'number'), field('second', 'Elemento B', 'number')],
    actions: [action('union', 'Unir'), action('find-root', 'Encontrar raíz'), action('reset', 'Restablecer')],
  },
  cache: {
    fields: [field('value', 'Clave'), field('second', 'Valor')],
    actions: [action('cache-put', 'Put'), action('cache-get', 'Get'), action('remove-value', 'Eliminar', 'danger'), action('clear', 'Vaciar', 'danger')],
  },
  bloom: {
    fields: [field('value', 'Elemento')],
    actions: [action('bloom-add', 'Agregar'), action('bloom-check', 'Comprobar'), action('clear-bits', 'Limpiar bits', 'danger')],
  },
  sparseMatrix: {
    fields: [
      field('second', 'Fila', 'number'),
      field('index', 'Columna', 'number'),
      field('value', 'Valor', 'number'),
    ],
    actions: [
      action('matrix-insert', 'Insertar / actualizar'),
      action('matrix-get', 'Buscar posición'),
      action('matrix-remove', 'Eliminar posición', 'danger'),
      action('matrix-row', 'Recorrer fila'),
      action('matrix-column', 'Recorrer columna'),
      action('matrix-clear', 'Vaciar matriz', 'danger'),
    ],
  },
  matrix: {
    fields: [
      field('second', 'Fila', 'number'),
      field('index', 'Columna', 'number'),
      field('value', 'Valor', 'number'),
    ],
    actions: [
      action('matrix-set', 'Guardar valor'),
      action('matrix-get', 'Consultar celda'),
      action('matrix-row', 'Recorrer fila'),
      action('matrix-column', 'Recorrer columna'),
      action('matrix-transpose', 'Transponer'),
      action('matrix-fill', 'Rellenar'),
      action('matrix-clear', 'Limpiar', 'danger'),
    ],
  },
  polynomial: {
    fields: [
      field('value', 'Coeficiente', 'number'),
      field('index', 'Exponente', 'number'),
    ],
    actions: [
      action('poly-insert-a', 'Insertar / agrupar en A'),
      action('poly-insert-b', 'Insertar / agrupar en B'),
      action('poly-remove-a', 'Eliminar de A', 'danger'),
      action('poly-remove-b', 'Eliminar de B', 'danger'),
      action('poly-add', 'Sumar A + B'),
      action('poly-clear-result', 'Limpiar C', 'danger'),
    ],
  },
  generalizedList: {
    fields: [field('value', 'Lista generalizada')],
    actions: [
      action('glist-build', 'Construir lista'),
      action('glist-head', 'Obtener Head'),
      action('glist-tail', 'Obtener Tail'),
      action('glist-length', 'Calcular longitud'),
      action('glist-depth', 'Calcular profundidad'),
      action('glist-share', 'Compartir raíz'),
      action('glist-release', 'Liberar referencia', 'danger'),
    ],
  },
};

export function operationGroup(algorithm) {
  if (algorithm.type === 'theory') return 'theory';
  if (algorithm.id === 'complejidad-algoritmica') return 'complexity';
  if (algorithm.type === 'oop') return 'oop';
  if (algorithm.type === 'foundation') return 'foundation';
  if (algorithm.id === 'polinomios') return 'polynomial';
  if (algorithm.id === 'listas-generalizadas') return 'generalizedList';
  if (algorithm.id === 'matriz') return 'matrix';
  if (algorithm.id === 'matriz-dispersa') return 'sparseMatrix';
  if (algorithm.id === 'arbol-enhebrado') return 'threadedTree';
  if (algorithm.id === 'array') return 'array';
  if (algorithm.id === 'pila') return 'stack';
  if (algorithm.id === 'cola') return 'queue';
  if (algorithm.id === 'deque') return 'deque';
  if (['lista-simple','lista-doble','lista-circular-simple','lista-circular-doble'].includes(algorithm.id)) return 'list';
  if (algorithm.id === 'skip-list') return 'skip';
  if (['segment-tree','fenwick-tree'].includes(algorithm.id)) return 'range';
  if (['btree','bplus-tree','bstar-tree'].includes(algorithm.id)) return 'btree';
  if (algorithm.id === 'merkle-tree') return 'merkle';
  if (['kd-tree','quadtree','octree'].includes(algorithm.id)) return 'spatial';
  if (algorithm.id === 'expression-tree') return 'expression';
  if (algorithm.id === 'ast') return 'ast';
  if (algorithm.type === 'heap') return 'heap';
  if (algorithm.type === 'trie') return 'trie';
  if (algorithm.category === 'Árboles') return 'tree';
  if (algorithm.type === 'hash') return 'hash';
  if (['dijkstra', 'a-star'].includes(algorithm.id)) return 'shortestPath';
  if (algorithm.category === 'Grafos') return 'graph';
  if (algorithm.type === 'sort') return 'sort';
  if (algorithm.type === 'recursion') return 'math';
  if (algorithm.type === 'hanoi') return 'hanoi';
  if (algorithm.type === 'queens') return 'queens';
  if (algorithm.type === 'maze') return 'maze';
  if (algorithm.type === 'sudoku') return 'sudoku';
  if (algorithm.type === 'union') return 'union';
  if (algorithm.type === 'cache') return 'cache';
  if (algorithm.type === 'bloom') return 'bloom';
  return 'array';
}

export function getOperationDefinition(algorithm) {
  const group = operationGroup(algorithm);
  const definition = definitions[group];
  if (group === 'graph') {
    const editingActions = definition.actions.slice(0, 4);
    const fields = algorithm.type === 'weighted'
      ? definition.fields
      : definition.fields.slice(0, 2);
    if (algorithm.id === 'dfs') {
      return { ...definition, fields, actions: [...editingActions, action('dfs-run', 'Ejecutar DFS')] };
    }
    if (algorithm.id === 'bfs') {
      return { ...definition, fields, actions: [...editingActions, action('bfs-run', 'Ejecutar BFS')] };
    }
    if (algorithm.id === 'prim') {
      return { ...definition, fields, actions: [...editingActions, action('prim-run', 'Ejecutar Prim')] };
    }
    if (algorithm.id === 'kruskal') {
      return { ...definition, fields, actions: [...editingActions, action('kruskal-run', 'Ejecutar Kruskal')] };
    }
    return { ...definition, fields };
  }
  if (group !== 'shortestPath') return definition;
  return {
    ...definition,
    actions: definition.actions.map(item => item.id === 'shortest-path'
      ? { ...item, label: algorithm.id === 'a-star' ? 'Ejecutar A*' : 'Ejecutar Dijkstra' }
      : item),
  };
}

const numericValue = (raw, current, forceText = false) => {
  if (raw === '') return null;
  if (forceText) return raw.trim() || null;
  const presentValues = current.filter(value => value !== undefined && value !== null);
  const numbers = presentValues.length === 0 || presentValues.every(value => typeof value === 'number');
  if (!numbers) return raw.trim();
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const entryKey = item => String(item).split(':')[0];

const findRoot = (parents, element) => {
  let root = element;
  const visited = new Set();
  while (parents[root] !== root && !visited.has(root)) {
    visited.add(root);
    root = parents[root];
  }
  return root;
};

const binaryTraversal = (values, order) => {
  const result = [];
  const visit = index => {
    if (index >= values.length || values[index] === undefined) return;
    if (order === 'preorder') result.push(values[index]);
    visit(index * 2 + 1);
    if (order === 'inorder') result.push(values[index]);
    visit(index * 2 + 2);
    if (order === 'postorder') result.push(values[index]);
  };
  visit(0);
  return result;
};

const binaryRecursiveInsertionFrames = (before, after, value, insertedAt) => {
  const frames = [];
  const variables = (level, index, currentValues, extras = []) => [
    { name: 'valor', value, role: 'input' },
    { name: 'nivel', value: level, role: 'index' },
    { name: 'nodo', value: currentValues[index] ?? 'null', role: 'value' },
    ...extras,
  ];
  const addFrame = (codeNeedle, message, position = 0, level = 0, values = before, extras = {}) => {
    frames.push({
      values: [...values],
      position: Math.max(0, position),
      codeNeedle,
      message,
      variables: variables(level, position, values, extras.variables ?? []),
      completed: extras.completed ?? false,
    });
  };

  addFrame('Node insert(Node root, int value)', `Comienza insert(root, ${value}).`);
  addFrame('if (root == null) return new Node(value);', 'Comprueba si el árbol está vacío.');
  if (!before.length) {
    addFrame('if (root == null) return new Node(value);', `${value} se convierte en la raíz.`, 0, 0, after, { completed: true });
    return frames;
  }
  addFrame('if (contains(root, value)) return root;', `Comprueba recursivamente que ${value} no esté repetido.`);
  addFrame('boolean contains(Node node, int value)', 'Entra al método recursivo contains.');
  addFrame('if (node == null) return false;', 'Cada referencia null indica que esa rama terminó sin encontrar el valor.');
  const scanForDuplicate = index => {
    if (index >= before.length || before[index] === undefined) return;
    addFrame('if (node.value == value) return true;', `Compara ${value} con el nodo ${before[index]}.`, index);
    scanForDuplicate(index * 2 + 1);
    scanForDuplicate(index * 2 + 2);
  };
  scanForDuplicate(0);
  addFrame('return contains(node.left, value) || contains(node.right, value);', `${value} no existe; la inserción puede continuar.`);
  addFrame('insertAtFirstAvailableLevel(root, value, 1);', 'La búsqueda recursiva comienza en el nivel 1.');

  const targetDepth = Math.floor(Math.log2(insertedAt + 1));
  const targetParent = Math.floor((insertedAt - 1) / 2);
  const visitLevel = (index, remainingLevel, requestedLevel) => {
    if (index >= before.length || before[index] === undefined) {
      addFrame('if (node == null) return false;', 'La llamada llegó a una referencia null.', Math.max(0, Math.floor((index - 1) / 2)), requestedLevel);
      return false;
    }

    addFrame('boolean insertAtLevel(Node node, int value, int level)', `Llamada recursiva sobre el nodo ${before[index]} con level = ${remainingLevel}.`, index, requestedLevel, before, {
      variables: [{ name: 'level restante', value: remainingLevel, role: 'index' }],
    });
    addFrame('if (node == null) return false;', `El nodo ${before[index]} existe; la recursión continúa.`, index, requestedLevel);

    if (remainingLevel === 1) {
      addFrame('if (level == 1)', `El nodo ${before[index]} pertenece al nivel que se está revisando.`, index, requestedLevel);
      const leftIndex = index * 2 + 1;
      addFrame('if (node.left == null)', `Comprueba el hijo izquierdo de ${before[index]}.`, index, requestedLevel);
      if (leftIndex === insertedAt && index === targetParent) {
        addFrame('node.left = new Node(value);', `${value} ocupa el primer espacio libre: hijo izquierdo de ${before[index]}.`, insertedAt, requestedLevel, after);
        return true;
      }

      const rightIndex = index * 2 + 2;
      addFrame('if (node.right == null)', `Comprueba el hijo derecho de ${before[index]}.`, index, requestedLevel);
      if (rightIndex === insertedAt && index === targetParent) {
        addFrame('node.right = new Node(value);', `${value} ocupa el primer espacio libre: hijo derecho de ${before[index]}.`, insertedAt, requestedLevel, after);
        return true;
      }
      addFrame('return false;', `El nodo ${before[index]} no tiene espacios libres en este nivel.`, index, requestedLevel);
      return false;
    }

    addFrame('if (insertAtLevel(node.left, value, level - 1)) return true;', `Desciende recursivamente por la izquierda de ${before[index]}.`, index, requestedLevel);
    if (visitLevel(index * 2 + 1, remainingLevel - 1, requestedLevel)) return true;
    addFrame('return insertAtLevel(node.right, value, level - 1);', `La izquierda está completa; desciende por la derecha de ${before[index]}.`, index, requestedLevel);
    return visitLevel(index * 2 + 2, remainingLevel - 1, requestedLevel);
  };

  for (let level = 1; level <= targetDepth; level++) {
    addFrame('void insertAtFirstAvailableLevel(Node root, int value, int level)', `Busca recursivamente un espacio en el nivel ${level}.`, 0, level);
    addFrame('if (insertAtLevel(root, value, level)) return;', `Ejecuta insertAtLevel para el nivel ${level}.`, 0, level);
    if (visitLevel(0, level, level)) {
      addFrame('return root;', `Nodo ${value} insertado recursivamente; el árbol conserva su forma completa.`, insertedAt, level, after, { completed: true });
      return frames;
    }
    addFrame('insertAtFirstAvailableLevel(root, value, level + 1);', `El nivel ${level} está lleno; llama recursivamente al nivel ${level + 1}.`, 0, level);
  }
  return frames;
};

const orderedBinaryTreeIds = new Set(['bst', 'avl', 'rojo-negro', 'splay-tree', 'kd-tree']);
const balancedBinaryTreeIds = new Set(['avl', 'rojo-negro']);
const compactTreeValues = values => values.filter(value => value !== undefined && value !== null);

const trimTreeSlots = values => {
  const result = [...values];
  while (result.length && result.at(-1) === undefined) result.pop();
  return result;
};

const buildBinarySearchTree = values => {
  const tree = [];
  for (const value of values) {
    let index = 0;
    while (index < 15 && tree[index] !== undefined) {
      if (Number(value) === Number(tree[index])) break;
      index = Number(value) < Number(tree[index]) ? index * 2 + 1 : index * 2 + 2;
    }
    if (index < 15) tree[index] = value;
  }
  return trimTreeSlots(tree);
};

const buildBalancedBinaryTree = values => {
  const sorted = [...values].sort((first, second) => Number(first) - Number(second));
  const tree = [];
  const place = (start, end, index) => {
    if (start > end || index >= 15) return;
    const middle = Math.floor((start + end) / 2);
    tree[index] = sorted[middle];
    place(start, middle - 1, index * 2 + 1);
    place(middle + 1, end, index * 2 + 2);
  };
  place(0, sorted.length - 1, 0);
  return trimTreeSlots(tree);
};

const avlHeight = node => node?.height ?? 0;

const updateAvlHeight = node => {
  if (node) node.height = 1 + Math.max(avlHeight(node.left), avlHeight(node.right));
  return node;
};

const treeSlotsToAvl = (values, index = 0) => {
  if (index >= values.length || values[index] === undefined || values[index] === null) return null;
  const node = {
    value: values[index],
    left: treeSlotsToAvl(values, index * 2 + 1),
    right: treeSlotsToAvl(values, index * 2 + 2),
    height: 1,
  };
  return updateAvlHeight(node);
};

const rotateAvlRight = oldRoot => {
  const newRoot = oldRoot.left;
  const transferred = newRoot.right;
  newRoot.right = oldRoot;
  oldRoot.left = transferred;
  updateAvlHeight(oldRoot);
  return updateAvlHeight(newRoot);
};

const rotateAvlLeft = oldRoot => {
  const newRoot = oldRoot.right;
  const transferred = newRoot.left;
  newRoot.left = oldRoot;
  oldRoot.right = transferred;
  updateAvlHeight(oldRoot);
  return updateAvlHeight(newRoot);
};

const insertAvlNode = (node, value, rotations) => {
  if (!node) return { value, left: null, right: null, height: 1 };
  if (Number(value) < Number(node.value)) node.left = insertAvlNode(node.left, value, rotations);
  else if (Number(value) > Number(node.value)) node.right = insertAvlNode(node.right, value, rotations);
  else return node;

  updateAvlHeight(node);
  const balance = avlHeight(node.left) - avlHeight(node.right);
  if (balance > 1 && Number(value) < Number(node.left.value)) {
    rotations.push({ type: 'LL', pivot: node.value });
    return rotateAvlRight(node);
  }
  if (balance < -1 && Number(value) > Number(node.right.value)) {
    rotations.push({ type: 'RR', pivot: node.value });
    return rotateAvlLeft(node);
  }
  if (balance > 1 && Number(value) > Number(node.left.value)) {
    rotations.push({ type: 'LR', pivot: node.value });
    node.left = rotateAvlLeft(node.left);
    return rotateAvlRight(node);
  }
  if (balance < -1 && Number(value) < Number(node.right.value)) {
    rotations.push({ type: 'RL', pivot: node.value });
    node.right = rotateAvlRight(node.right);
    return rotateAvlLeft(node);
  }
  return node;
};

const minimumAvlNode = node => {
  let current = node;
  while (current?.left) current = current.left;
  return current;
};

const removeAvlNode = (node, value, rotations) => {
  if (!node) return null;
  if (Number(value) < Number(node.value)) node.left = removeAvlNode(node.left, value, rotations);
  else if (Number(value) > Number(node.value)) node.right = removeAvlNode(node.right, value, rotations);
  else if (!node.left || !node.right) {
    return node.left ?? node.right;
  } else {
    const successor = minimumAvlNode(node.right);
    node.value = successor.value;
    node.right = removeAvlNode(node.right, successor.value, rotations);
  }

  updateAvlHeight(node);
  const balance = avlHeight(node.left) - avlHeight(node.right);
  const leftBalance = node.left ? avlHeight(node.left.left) - avlHeight(node.left.right) : 0;
  const rightBalance = node.right ? avlHeight(node.right.left) - avlHeight(node.right.right) : 0;
  if (balance > 1 && leftBalance >= 0) {
    rotations.push({ type: 'LL', pivot: node.value });
    return rotateAvlRight(node);
  }
  if (balance > 1) {
    rotations.push({ type: 'LR', pivot: node.value });
    node.left = rotateAvlLeft(node.left);
    return rotateAvlRight(node);
  }
  if (balance < -1 && rightBalance <= 0) {
    rotations.push({ type: 'RR', pivot: node.value });
    return rotateAvlLeft(node);
  }
  if (balance < -1) {
    rotations.push({ type: 'RL', pivot: node.value });
    node.right = rotateAvlRight(node.right);
    return rotateAvlLeft(node);
  }
  return node;
};

const avlToTreeSlots = root => {
  const values = [];
  let hiddenNode = false;
  const place = (node, index) => {
    if (!node) return;
    if (index >= 15) {
      hiddenNode = true;
      return;
    }
    values[index] = node.value;
    place(node.left, index * 2 + 1);
    place(node.right, index * 2 + 2);
  };
  place(root, 0);
  return { values: trimTreeSlots(values), hiddenNode };
};

const insertIntoAvl = (values, value) => {
  const rotations = [];
  const root = insertAvlNode(treeSlotsToAvl(values), value, rotations);
  return { ...avlToTreeSlots(root), rotations };
};

const removeFromAvl = (values, value) => {
  const rotations = [];
  const root = removeAvlNode(treeSlotsToAvl(values), value, rotations);
  return { ...avlToTreeSlots(root), rotations };
};

const buildSplayedBinaryTree = (values, rootValue) => {
  const numericRoot = Number(rootValue);
  const remaining = [...values].filter(value => Number(value) !== numericRoot);
  const lower = remaining.filter(value => Number(value) < numericRoot);
  const higher = remaining.filter(value => Number(value) > numericRoot);
  const tree = [rootValue];
  const place = (items, index) => {
    if (!items.length || index >= 15) return;
    const middle = Math.floor((items.length - 1) / 2);
    tree[index] = items[middle];
    place(items.slice(0, middle), index * 2 + 1);
    place(items.slice(middle + 1), index * 2 + 2);
  };
  place(lower.sort((a, b) => Number(a) - Number(b)), 1);
  place(higher.sort((a, b) => Number(a) - Number(b)), 2);
  return trimTreeSlots(tree);
};

const binarySearchPosition = (values, target) => {
  let index = 0;
  while (index < values.length && values[index] !== undefined) {
    if (Number(values[index]) === Number(target)) return index;
    index = Number(target) < Number(values[index]) ? index * 2 + 1 : index * 2 + 2;
  }
  return -1;
};

const occupiedThreadedPosition = (values, index) => (
  index >= 0 && index < values.length && values[index] !== undefined && values[index] !== null
);

export function getThreadedTreeLinks(values) {
  const inorder = [];
  const visit = index => {
    if (!occupiedThreadedPosition(values, index)) return;
    visit(index * 2 + 1);
    inorder.push(index);
    visit(index * 2 + 2);
  };
  visit(0);

  const links = new Map();
  inorder.forEach((index, order) => {
    const leftChild = index * 2 + 1;
    const rightChild = index * 2 + 2;
    links.set(index, {
      index,
      value: values[index],
      order,
      leftThread: !occupiedThreadedPosition(values, leftChild),
      rightThread: !occupiedThreadedPosition(values, rightChild),
      predecessor: order > 0 ? inorder[order - 1] : null,
      successor: order < inorder.length - 1 ? inorder[order + 1] : null,
    });
  });
  return { inorder, links };
}

const treeSlotsToPlainNode = (values, index = 0) => {
  if (!occupiedThreadedPosition(values, index)) return null;
  return {
    value: values[index],
    left: treeSlotsToPlainNode(values, index * 2 + 1),
    right: treeSlotsToPlainNode(values, index * 2 + 2),
  };
};

const plainNodeToTreeSlots = root => {
  const values = [];
  let hiddenNode = false;
  const place = (node, index) => {
    if (!node) return;
    if (index >= 15) {
      hiddenNode = true;
      return;
    }
    values[index] = node.value;
    place(node.left, index * 2 + 1);
    place(node.right, index * 2 + 2);
  };
  place(root, 0);
  return { values: trimTreeSlots(values), hiddenNode };
};

const removePlainBstNode = (node, target) => {
  if (!node) return null;
  if (Number(target) < Number(node.value)) {
    node.left = removePlainBstNode(node.left, target);
  } else if (Number(target) > Number(node.value)) {
    node.right = removePlainBstNode(node.right, target);
  } else if (!node.left) {
    return node.right;
  } else if (!node.right) {
    return node.left;
  } else {
    let successor = node.right;
    while (successor.left) successor = successor.left;
    node.value = successor.value;
    node.right = removePlainBstNode(node.right, successor.value);
  }
  return node;
};

const threadedVariables = (values, position, extras = []) => {
  const meta = getThreadedTreeLinks(values).links.get(position);
  return [
    { name: 'actual', value: values[position] ?? 'null', role: 'value' },
    { name: 'leftThread', value: meta?.leftThread ?? '—', role: meta?.leftThread ? 'true' : 'false' },
    { name: 'rightThread', value: meta?.rightThread ?? '—', role: meta?.rightThread ? 'true' : 'false' },
    ...extras,
  ];
};

const threadedFrame = (values, position, codeNeedle, message, extras = {}) => ({
  values: [...values],
  position: Math.max(0, position),
  codeNeedle,
  message,
  variables: threadedVariables(values, position, extras.variables ?? []),
  threadPhase: extras.threadPhase,
  activeThread: extras.activeThread,
  completed: extras.completed ?? false,
  delayMs: extras.delayMs ?? 760,
});

const threadedSearchPath = (values, target, includeMissing = false) => {
  const positions = [];
  let index = 0;
  while (index < 15 && occupiedThreadedPosition(values, index)) {
    positions.push(index);
    if (Number(values[index]) === Number(target)) break;
    index = Number(target) < Number(values[index]) ? index * 2 + 1 : index * 2 + 2;
  }
  if (includeMissing && index < 15 && !occupiedThreadedPosition(values, index)) positions.push(index);
  return positions;
};

function executeThreadedTreeOperation({ actionId, fields, values, initialValues, edges }) {
  const before = [...values];
  const value = numericValue(fields.value ?? '', before);
  const fail = message => ({ ok: false, values: before, edges, message, step: 0 });
  const done = (updated, message, position, frames) => ({
    ok: true,
    values: updated,
    edges,
    message,
    step: Math.max(0, position),
    frames,
  });

  if (actionId === 'reset') {
    return done([...initialValues], 'Estructura restablecida a su estado inicial.', 0, [
      threadedFrame(initialValues, 0, 'root = buildInitialTree();', 'El árbol enhebrado volvió a su ejemplo inicial.', { completed: true }),
    ]);
  }

  if (actionId === 'tree-add') {
    if (value === null) return fail('Ingresa un valor válido antes de insertar.');
    if (binarySearchPosition(before, value) >= 0) return fail(`${value} ya existe en el árbol.`);
    if (compactTreeValues(before).length >= 15) return fail('La demostración admite hasta 15 nodos visibles.');

    const path = threadedSearchPath(before, value);
    const parent = path.at(-1);
    const insertedAt = parent === undefined
      ? 0
      : Number(value) < Number(before[parent]) ? parent * 2 + 1 : parent * 2 + 2;
    if (insertedAt >= 15) return fail('La inserción produciría un nivel que no cabe completo en el visualizador.');

    const after = [...before];
    after[insertedAt] = value;
    const trimmedAfter = trimTreeSlots(after);
    const frames = [];
    if (!before.length) {
      frames.push(threadedFrame(before, 0, 'if (parent == null) return newNode;', 'El árbol está vacío; el nuevo nodo será la raíz.'));
    } else {
      path.forEach((position, visitIndex) => {
        frames.push(threadedFrame(before, position, 'while (current != null)', `Se visita ${before[position]} y se compara con ${value}.`, {
          variables: [{ name: 'value', value, role: 'input' }, { name: 'comparación', value: `${visitIndex + 1} de ${path.length}`, role: 'index' }],
        }));
        const goesLeft = Number(value) < Number(before[position]);
        frames.push(threadedFrame(before, position, goesLeft ? 'if (value < current.value)' : '} else {', `${value} es ${goesLeft ? 'menor' : 'mayor'} que ${before[position]}; se revisa la referencia ${goesLeft ? 'izquierda' : 'derecha'}.`, {
          variables: [{ name: 'value', value, role: 'input' }],
        }));
      });
    }

    const afterMeta = getThreadedTreeLinks(trimmedAfter).links.get(insertedAt);
    const predecessorThread = afterMeta?.predecessor === null ? null : { from: insertedAt, to: afterMeta.predecessor, side: 'left' };
    const successorThread = afterMeta?.successor === null ? null : { from: insertedAt, to: afterMeta.successor, side: 'right' };
    frames.push(threadedFrame(trimmedAfter, insertedAt, 'Node newNode = new Node(value);', `Se crea el nodo ${value}; sus dos referencias comienzan como hilos.`, {
      variables: [{ name: 'value', value, role: 'input' }],
    }));
    if (parent !== undefined && Number(value) < Number(before[parent])) {
      frames.push(threadedFrame(trimmedAfter, insertedAt, 'newNode.left = parent.left;', `El hilo izquierdo de ${value} apunta a ${afterMeta?.predecessor === null ? 'null' : trimmedAfter[afterMeta.predecessor]}, su predecesor.`, { threadPhase: 'link', activeThread: predecessorThread }));
      frames.push(threadedFrame(trimmedAfter, insertedAt, 'newNode.right = parent;', `El hilo derecho de ${value} apunta a ${before[parent]}, su sucesor.`, { threadPhase: 'link', activeThread: successorThread }));
      frames.push(threadedFrame(trimmedAfter, parent, 'parent.leftThread = false;', `${before[parent]} deja de usar un hilo izquierdo: ahora tiene un hijo real.`, { threadPhase: 'child' }));
    } else if (parent !== undefined) {
      frames.push(threadedFrame(trimmedAfter, insertedAt, 'newNode.left = parent;', `El hilo izquierdo de ${value} apunta a ${before[parent]}, su predecesor.`, { threadPhase: 'link', activeThread: predecessorThread }));
      frames.push(threadedFrame(trimmedAfter, insertedAt, 'newNode.right = parent.right;', `El hilo derecho de ${value} apunta a ${afterMeta?.successor === null ? 'null' : trimmedAfter[afterMeta.successor]}, su sucesor.`, { threadPhase: 'link', activeThread: successorThread }));
      frames.push(threadedFrame(trimmedAfter, parent, 'parent.rightThread = false;', `${before[parent]} deja de usar un hilo derecho: ahora tiene un hijo real.`, { threadPhase: 'child' }));
    }
    frames.push(threadedFrame(trimmedAfter, insertedAt, 'return root;', `Nodo ${value} insertado y enhebrado correctamente.`, { completed: true }));
    return done(trimmedAfter, `Nodo ${value} insertado y enhebrado correctamente.`, insertedAt, frames);
  }

  if (actionId === 'find') {
    if (value === null) return fail('Ingresa el valor que quieres buscar.');
    const path = threadedSearchPath(before, value);
    const found = binarySearchPosition(before, value);
    const frames = path.flatMap(position => {
      const current = before[position];
      const comparison = Number(value) === Number(current)
        ? `${value} coincide con el nodo actual.`
        : `${value} es ${Number(value) < Number(current) ? 'menor' : 'mayor'} que ${current}.`;
      return [
        threadedFrame(before, position, 'while (current != null)', `La búsqueda está en ${current}.`, { variables: [{ name: 'target', value, role: 'input' }] }),
        threadedFrame(before, position, 'if (target == current.value) return current;', comparison, { variables: [{ name: 'target', value, role: 'input' }] }),
      ];
    });
    if (found < 0) {
      const last = path.at(-1) ?? 0;
      const goesLeft = Number(value) < Number(before[last]);
      frames.push(threadedFrame(before, last, goesLeft ? 'if (current.leftThread) return null;' : 'if (current.rightThread) return null;', `La referencia ${goesLeft ? 'izquierda' : 'derecha'} es un hilo, por lo que ${value} no está en el árbol.`, { completed: true }));
      return { ...fail(`${value} no fue encontrado.`), frames };
    }
    frames.push(threadedFrame(before, found, 'return current;', `${value} fue encontrado sin atravesar ningún hilo como si fuera un hijo.`, { completed: true }));
    return done(before, `${value} fue encontrado.`, found, frames);
  }

  if (actionId === 'inorder') {
    if (!before.length) return fail('El árbol está vacío.');
    const { inorder, links } = getThreadedTreeLinks(before);
    const frames = [];
    let leftMost = 0;
    frames.push(threadedFrame(before, leftMost, 'Node current = leftMost(root);', 'El recorrido comienza buscando el nodo más a la izquierda.'));
    while (occupiedThreadedPosition(before, leftMost * 2 + 1)) {
      frames.push(threadedFrame(before, leftMost, 'while (!node.leftThread)', `${before[leftMost]} tiene un hijo izquierdo real; se desciende hacia él.`));
      leftMost = leftMost * 2 + 1;
    }
    frames.push(threadedFrame(before, leftMost, 'return node;', `${before[leftMost]} es el primer nodo del orden inorden.`));

    inorder.forEach((position, orderIndex) => {
      const meta = links.get(position);
      frames.push(threadedFrame(before, position, 'System.out.println(current.value);', `Se visita ${before[position]} (${orderIndex + 1} de ${inorder.length}).`, {
        variables: [{ name: 'salida', value: inorder.slice(0, orderIndex + 1).map(index => before[index]).join(' → '), role: 'value' }],
      }));
      if (meta.rightThread) {
        frames.push(threadedFrame(before, position, 'if (current.rightThread)', `${before[position]} no tiene hijo derecho: se sigue su hilo hacia ${meta.successor === null ? 'null' : before[meta.successor]}.`, {
          threadPhase: 'follow',
          activeThread: meta.successor === null ? null : { from: position, to: meta.successor, side: 'right' },
        }));
      } else {
        const rightChild = position * 2 + 2;
        frames.push(threadedFrame(before, rightChild, 'current = leftMost(current.right);', `${before[position]} tiene hijo derecho real; se busca el menor nodo de ese subárbol.`));
      }
    });
    frames.push(threadedFrame(before, inorder.at(-1), 'while (current != null)', `Recorrido terminado: ${inorder.map(index => before[index]).join(' → ')}.`, { completed: true }));
    return done(before, `inorder: ${inorder.map(index => before[index]).join(' → ')}.`, inorder.at(-1), frames);
  }

  if (actionId === 'remove-value') {
    if (value === null) return fail('Ingresa el valor que quieres eliminar.');
    const found = binarySearchPosition(before, value);
    if (found < 0) return fail(`${value} no existe en el árbol.`);
    const path = threadedSearchPath(before, value);
    const root = treeSlotsToPlainNode(before);
    const removal = plainNodeToTreeSlots(removePlainBstNode(root, value));
    if (removal.hiddenNode) return fail('La eliminación produciría una forma que no cabe en el visualizador.');
    const after = removal.values;
    const hasLeft = occupiedThreadedPosition(before, found * 2 + 1);
    const hasRight = occupiedThreadedPosition(before, found * 2 + 2);
    const frames = path.map(position => threadedFrame(before, position, 'while (current != null && current.value != target)', `Se busca ${value}; ahora se revisa el nodo ${before[position]}.`, {
      variables: [{ name: 'target', value, role: 'input' }],
    }));
    frames.push(threadedFrame(before, found, 'if (!current.leftThread && !current.rightThread)', hasLeft && hasRight
      ? `${value} tiene dos hijos reales; se copiará su sucesor inorden antes de retirar el nodo sucesor.`
      : `${value} tiene ${hasLeft || hasRight ? 'un hijo real' : 'sólo hilos'}; puede desconectarse directamente.`));

    if (hasLeft && hasRight) {
      const successorIndex = getThreadedTreeLinks(before).links.get(found).successor;
      const intermediate = [...before];
      intermediate[found] = before[successorIndex];
      frames.push(threadedFrame(intermediate, found, 'current.value = successor.value;', `El sucesor ${before[successorIndex]} reemplaza temporalmente el valor ${value}.`));
    }
    frames.push(threadedFrame(after, Math.min(found, Math.max(0, after.length - 1)), 'Node predecessor = inorderPredecessor(current);', 'Se localiza el predecesor que debe conservar su hilo.'));
    frames.push(threadedFrame(after, Math.min(found, Math.max(0, after.length - 1)), 'Node successor = inorderSuccessor(current);', 'Se localiza el sucesor que debe conservar su hilo.'));
    frames.push(threadedFrame(after, Math.min(found, Math.max(0, after.length - 1)), 'return root;', `${value} fue eliminado; los hijos reales y los hilos fueron reconectados.`, { completed: true }));
    return done(after, `${value} fue eliminado y el enhebrado quedó consistente.`, Math.min(found, Math.max(0, after.length - 1)), frames);
  }

  return fail('La operación del árbol enhebrado todavía no está disponible.');
}

const expressionPrecedence = operator => ({ '+': 1, '-': 1, '*': 2, '/': 2 }[operator] ?? 0);

const expressionTreeFromInfix = source => {
  const tokens = source.replaceAll('×', '*').replaceAll('−', '-').match(/\d+|[()+\-*/]/g) ?? [];
  const output = [];
  const operators = [];
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      output.push(token);
    } else if (token === '(') {
      operators.push(token);
    } else if (token === ')') {
      while (operators.length && operators.at(-1) !== '(') output.push(operators.pop());
      if (operators.pop() !== '(') return null;
    } else {
      while (operators.length && operators.at(-1) !== '('
          && expressionPrecedence(operators.at(-1)) >= expressionPrecedence(token)) {
        output.push(operators.pop());
      }
      operators.push(token);
    }
  }
  while (operators.length) {
    const operator = operators.pop();
    if (operator === '(') return null;
    output.push(operator);
  }

  const stack = [];
  for (const token of output) {
    if (/^\d+$/.test(token)) {
      stack.push({ value: token, left: null, right: null });
    } else {
      const right = stack.pop();
      const left = stack.pop();
      if (!left || !right) return null;
      stack.push({ value: token, left, right });
    }
  }
  if (stack.length !== 1) return null;

  const values = [];
  const place = (node, index) => {
    if (!node || index >= 15) return;
    values[index] = node.value;
    place(node.left, index * 2 + 1);
    place(node.right, index * 2 + 2);
  };
  place(stack[0], 0);
  return trimTreeSlots(values);
};

const evaluateExpressionTree = (values, index = 0) => {
  if (!occupiedTreeValue(values, index)) return null;
  const token = String(values[index]);
  if (/^\d+$/.test(token)) return Number(token);
  const left = evaluateExpressionTree(values, index * 2 + 1);
  const right = evaluateExpressionTree(values, index * 2 + 2);
  if (left === null || right === null) return null;
  if (token === '+') return left + right;
  if (token === '-') return left - right;
  if (token === '*' || token === '×') return left * right;
  if (token === '/') return right === 0 ? null : left / right;
  return null;
};

function occupiedTreeValue(values, index) {
  return index >= 0 && index < values.length && values[index] !== undefined && values[index] !== null;
}

function graphTraversalTrace({ algorithm, values, edges, start, depthFirst }) {
  const directed = algorithm.type === 'digraph';
  const mode = depthFirst ? 'dfs' : 'bfs';
  const adjacency = Array.from({ length: values.length }, () => []);
  edges.forEach((edge, edgeIndex) => {
    const [from, to] = edge;
    if (from >= values.length || to >= values.length) return;
    adjacency[from].push({ vertex: to, edge: [from, to], edgeIndex });
    if (!directed) adjacency[to].push({ vertex: from, edge: [to, from], edgeIndex });
  });
  const frames = [];
  const visited = new Set();
  const order = [];
  const visitedEdges = [];
  const addFrame = ({
    codeNeedle,
    message,
    current = start,
    frontier = [],
    relaxedEdge = null,
    variables = [],
    completed = false,
    delayMs = 300,
  }) => {
    frames.push({
      values: [...values],
      edges: edges.map(edge => [...edge]),
      position: Math.max(0, current),
      codeNeedle,
      message,
      completed,
      delayMs,
      graphState: {
        mode,
        current,
        order: [...order],
        frontier: [...frontier],
        visitedEdges: visitedEdges.map(edge => [...edge]),
        relaxedEdge,
      },
      variables: [
        { name: 'inicio', value: values[start], role: 'input' },
        { name: 'vértice actual', value: values[current] ?? '—', role: 'value' },
        { name: 'visitados', value: order.map(index => values[index]).join(' → ') || '∅', role: 'value' },
        ...variables,
      ],
    });
  };

  addFrame({
    codeNeedle: depthFirst
      ? 'void depthFirst(String startName) {'
      : 'void breadthFirst(String startName) {',
    message: `${mode.toUpperCase()} comienza desde el vértice ${values[start]}.`,
  });
  addFrame({
    codeNeedle: 'int start = findVertex(startName);',
    message: `${values[start]} corresponde al índice ${start}.`,
    variables: [{ name: 'start', value: start, role: 'index' }],
  });
  addFrame({
    codeNeedle: 'if (start == -1) {',
    message: 'start es válido, por lo tanto el recorrido puede continuar.',
    variables: [{ name: 'condición', value: 'false', role: 'false' }],
  });

  if (!depthFirst) {
    const queue = [start];
    let front = 0;
    visited.add(start);
    addFrame({
      codeNeedle: 'int[] queue = new int[vertexCount];',
      message: `Se crea una cola con capacidad para ${values.length} vértices.`,
      frontier: [...queue],
      variables: [{ name: 'front', value: front, role: 'index' }, { name: 'end', value: queue.length, role: 'size' }],
    });
    addFrame({
      codeNeedle: 'queue[end] = start;',
      message: `${values[start]} entra primero en la cola.`,
      frontier: [...queue],
      variables: [{ name: 'front', value: front, role: 'index' }, { name: 'end', value: queue.length - 1, role: 'index' }],
    });
    addFrame({
      codeNeedle: 'visited[start] = true;',
      message: `${values[start]} se marca para no volver a encolarlo.`,
      frontier: [...queue],
    });

    while (front < queue.length) {
      const current = queue[front];
      addFrame({
        codeNeedle: 'while (front < end) {',
        message: `front (${front}) es menor que end (${queue.length}); la cola aún contiene elementos.`,
        current,
        frontier: queue.slice(front),
        variables: [{ name: 'front', value: front, role: 'index' }, { name: 'end', value: queue.length, role: 'size' }, { name: 'condición', value: 'true', role: 'true' }],
      });
      addFrame({
        codeNeedle: 'int vertex = queue[front];',
        message: `${values[current]} está al frente de la cola.`,
        current,
        frontier: queue.slice(front),
        variables: [{ name: 'front', value: front, role: 'index' }, { name: 'vertex', value: current, role: 'index' }],
      });
      front++;
      if (!visited.has(current)) visited.add(current);
      order.push(current);
      addFrame({
        codeNeedle: 'front++;',
        message: `front avanza a ${front}.`,
        current,
        frontier: queue.slice(front),
        variables: [{ name: 'front', value: front, role: 'index' }, { name: 'end', value: queue.length, role: 'size' }],
      });
      addFrame({
        codeNeedle: 'System.out.println(vertexNames[vertex]);',
        message: `BFS visita ${values[current]}.`,
        current,
        frontier: queue.slice(front),
      });

      for (let next = 0; next < values.length; next++) {
        const connection = adjacency[current].find(item => item.vertex === next);
        const canVisit = Boolean(connection) && !visited.has(next);
        addFrame({
          codeNeedle: 'for (int next = 0; next < vertexCount; next++) {',
          message: `Se revisa si ${values[current]} conecta con ${values[next]}.`,
          current,
          frontier: queue.slice(front),
          relaxedEdge: connection?.edge ?? null,
          variables: [{ name: 'next', value: next, role: 'index' }],
        });
        addFrame({
          codeNeedle: 'boolean hasEdge = adjacency[vertex][next];',
          message: connection
            ? `Sí existe una arista entre ${values[current]} y ${values[next]}.`
            : `No existe una arista entre ${values[current]} y ${values[next]}.`,
          current,
          frontier: queue.slice(front),
          relaxedEdge: connection?.edge ?? null,
          variables: [{ name: 'hasEdge', value: String(Boolean(connection)), role: connection ? 'true' : 'false' }],
        });
        addFrame({
          codeNeedle: 'if (hasEdge && !visited[next]) {',
          message: canVisit
            ? `${values[next]} tiene arista y todavía no fue visitado.`
            : `${values[next]} no se encola porque falta la arista o ya fue descubierto.`,
          current,
          frontier: queue.slice(front),
          relaxedEdge: connection?.edge ?? null,
          variables: [{ name: 'condición', value: String(canVisit), role: canVisit ? 'true' : 'false' }, { name: 'next', value: next, role: 'index' }],
        });
        if (!canVisit) continue;

        visited.add(next);
        visitedEdges.push(connection.edge);
        addFrame({
          codeNeedle: 'visited[next] = true;',
          message: `${values[next]} queda marcado antes de entrar en la cola.`,
          current: next,
          frontier: queue.slice(front),
          relaxedEdge: connection.edge,
        });
        queue.push(next);
        addFrame({
          codeNeedle: 'queue[end] = next;',
          message: `${values[next]} se guarda en queue[${queue.length - 1}].`,
          current: next,
          frontier: queue.slice(front),
          relaxedEdge: connection.edge,
          variables: [{ name: 'end', value: queue.length - 1, role: 'index' }],
        });
        addFrame({
          codeNeedle: 'end++;',
          message: `end avanza a ${queue.length}.`,
          current: next,
          frontier: queue.slice(front),
          variables: [{ name: 'end', value: queue.length, role: 'size' }],
        });
      }
    }
    addFrame({
      codeNeedle: 'while (front < end) {',
      message: 'front alcanzó a end; la cola quedó vacía y BFS termina.',
      current: order.at(-1) ?? start,
      frontier: [],
      variables: [{ name: 'front', value: front, role: 'index' }, { name: 'end', value: queue.length, role: 'size' }, { name: 'condición', value: 'false', role: 'false' }],
      completed: true,
      delayMs: 420,
    });
  } else {
    addFrame({
      codeNeedle: 'boolean[] visited = new boolean[vertexCount];',
      message: `Se crea visited con ${values.length} posiciones inicialmente falsas.`,
    });
    addFrame({
      codeNeedle: 'depthFirstFrom(start, visited);',
      message: `Comienza la primera llamada recursiva con ${values[start]}.`,
      frontier: [start],
    });

    const visit = (current, stack) => {
      addFrame({
        codeNeedle: 'void depthFirstFrom(int vertex, boolean[] visited) {',
        message: `Entra depthFirstFrom(${values[current]}) con una pila de ${stack.length} llamadas.`,
        current,
        frontier: [...stack],
        variables: [{ name: 'profundidad', value: stack.length - 1, role: 'index' }],
      });
      visited.add(current);
      order.push(current);
      addFrame({
        codeNeedle: 'visited[vertex] = true;',
        message: `${values[current]} queda marcado como visitado.`,
        current,
        frontier: [...stack],
      });
      addFrame({
        codeNeedle: 'System.out.println(vertexNames[vertex]);',
        message: `DFS visita ${values[current]}.`,
        current,
        frontier: [...stack],
      });

      for (let next = 0; next < values.length; next++) {
        const connection = adjacency[current].find(item => item.vertex === next);
        const canVisit = Boolean(connection) && !visited.has(next);
        addFrame({
          codeNeedle: 'for (int next = 0; next < vertexCount; next++) {',
          message: `Desde ${values[current]} se revisa el índice ${next}.`,
          current,
          frontier: [...stack],
          relaxedEdge: connection?.edge ?? null,
          variables: [{ name: 'next', value: next, role: 'index' }],
        });
        addFrame({
          codeNeedle: 'boolean hasEdge = adjacency[vertex][next];',
          message: connection
            ? `${values[current]} sí conecta con ${values[next]}.`
            : `${values[current]} no conecta con ${values[next]}.`,
          current,
          frontier: [...stack],
          relaxedEdge: connection?.edge ?? null,
          variables: [{ name: 'hasEdge', value: String(Boolean(connection)), role: connection ? 'true' : 'false' }],
        });
        addFrame({
          codeNeedle: 'if (hasEdge && !visited[next]) {',
          message: canVisit
            ? `${values[next]} no fue visitado: DFS profundiza por esa arista.`
            : `La llamada hacia ${values[next]} se omite.`,
          current,
          frontier: [...stack],
          relaxedEdge: connection?.edge ?? null,
          variables: [{ name: 'condición', value: String(canVisit), role: canVisit ? 'true' : 'false' }],
        });
        if (!canVisit) continue;

        visitedEdges.push(connection.edge);
        addFrame({
          codeNeedle: 'depthFirstFrom(next, visited);',
          message: `Se llama recursivamente a depthFirstFrom(${values[next]}).`,
          current: next,
          frontier: [...stack, next],
          relaxedEdge: connection.edge,
        });
        visit(next, [...stack, next]);
      }
    };
    visit(start, [start]);
    addFrame({
      codeNeedle: 'depthFirstFrom(start, visited);',
      message: 'Todas las llamadas recursivas regresaron; DFS terminó.',
      current: order.at(-1) ?? start,
      frontier: [],
      completed: true,
      delayMs: 420,
    });
  }

  const labels = order.map(index => values[index]);
  return {
    ok: true,
    values: [...values],
    edges: edges.map(edge => [...edge]),
    message: `${mode.toUpperCase()} desde ${values[start]}: ${labels.join(' → ')}.`,
    step: start,
    frames,
  };
}

function minimumSpanningTreeTrace({ algorithm, values, edges, start = 0 }) {
  const mode = algorithm.id === 'kruskal' ? 'kruskal' : 'prim';
  const frames = [];
  const selectedEdges = [];
  const treeVertices = new Set();
  let totalCost = 0;
  const addFrame = ({
    codeNeedle,
    message,
    current = start,
    relaxedEdge = null,
    variables = [],
    completed = false,
    delayMs = 340,
  }) => {
    frames.push({
      values: [...values],
      edges: edges.map(edge => [...edge]),
      position: Math.max(0, current),
      codeNeedle,
      message,
      completed,
      delayMs,
      graphState: {
        mode,
        current,
        visitedEdges: selectedEdges.map(edge => [edge[0], edge[1]]),
        relaxedEdge,
        treeVertices: [...treeVertices],
        totalCost,
      },
      variables: [
        { name: 'aristas elegidas', value: selectedEdges.length, role: 'size' },
        { name: 'costo total', value: totalCost, role: 'value' },
        ...variables,
      ],
    });
  };

  if (mode === 'prim') {
    const size = values.length;
    const matrix = Array.from({ length: size }, () => Array(size).fill(Infinity));
    edges.forEach(([from, to, weight]) => {
      if (from >= size || to >= size) return;
      matrix[from][to] = Number(weight);
      matrix[to][from] = Number(weight);
    });
    const inTree = Array(size).fill(false);
    const bestWeight = Array(size).fill(Infinity);
    const parent = Array(size).fill(-1);
    bestWeight[start] = 0;

    addFrame({
      codeNeedle: 'void prim(String startName) {',
      message: `Prim comenzará desde ${values[start]}.`,
      variables: [{ name: 'start', value: start, role: 'index' }],
    });
    addFrame({
      codeNeedle: 'boolean[] inTree = new boolean[vertexCount];',
      message: 'Se crea inTree para distinguir los vértices que ya pertenecen al árbol.',
    });
    addFrame({
      codeNeedle: 'bestWeight[start] = 0;',
      message: `El costo inicial de ${values[start]} se establece en 0.`,
      current: start,
    });

    for (let added = 0; added < size; added++) {
      let current = -1;
      addFrame({
        codeNeedle: 'for (int added = 0; added < vertexCount; added++) {',
        message: `Prim elegirá el vértice ${added + 1} de ${size}.`,
        current: Math.max(0, current),
        variables: [{ name: 'added', value: added, role: 'index' }],
      });
      for (let vertex = 0; vertex < size; vertex++) {
        const better = !inTree[vertex] && (
          current === -1 || bestWeight[vertex] < bestWeight[current]
        );
        addFrame({
          codeNeedle: 'if (!inTree[vertex]',
          message: better
            ? `${values[vertex]} es el mejor candidato disponible hasta ahora.`
            : `${values[vertex]} no mejora al candidato actual.`,
          current: vertex,
          variables: [
            { name: 'vertex', value: vertex, role: 'index' },
            { name: 'bestWeight', value: Number.isFinite(bestWeight[vertex]) ? bestWeight[vertex] : '∞', role: 'value' },
            { name: 'condición', value: String(better), role: better ? 'true' : 'false' },
          ],
        });
        if (better) current = vertex;
      }
      if (current === -1 || !Number.isFinite(bestWeight[current])) {
        const message = 'Prim se detuvo: el grafo no es conexo y no posee un árbol de expansión que incluya todos sus vértices.';
        addFrame({
          codeNeedle: 'if (current == -1 || bestWeight[current] == NO_EDGE) {',
          message,
          current: Math.max(0, current),
          completed: true,
        });
        return { ok: false, values: [...values], edges: edges.map(edge => [...edge]), message, step: 0, frames };
      }

      inTree[current] = true;
      treeVertices.add(current);
      addFrame({
        codeNeedle: 'inTree[current] = true;',
        message: `${values[current]} entra definitivamente al árbol.`,
        current,
      });
      if (parent[current] !== -1) {
        const selected = [parent[current], current, matrix[parent[current]][current]];
        selectedEdges.push(selected);
        totalCost += selected[2];
        addFrame({
          codeNeedle: 'System.out.println(vertexNames[parent[current]]',
          message: `Se elige ${values[selected[0]]} — ${values[selected[1]]} con peso ${selected[2]}.`,
          current,
          relaxedEdge: [selected[0], selected[1]],
        });
      }

      for (let next = 0; next < size; next++) {
        const weight = matrix[current][next];
        const improves = !inTree[next] && weight < bestWeight[next];
        const candidateEdge = Number.isFinite(weight) ? [current, next] : null;
        addFrame({
          codeNeedle: 'if (!inTree[next] && weight < bestWeight[next]) {',
          message: improves
            ? `La arista hacia ${values[next]} mejora su conexión a peso ${weight}.`
            : `${values[next]} conserva su mejor conexión anterior.`,
          current,
          relaxedEdge: candidateEdge,
          variables: [
            { name: 'next', value: next, role: 'index' },
            { name: 'weight', value: Number.isFinite(weight) ? weight : '∞', role: 'value' },
            { name: 'condición', value: String(improves), role: improves ? 'true' : 'false' },
          ],
        });
        if (!improves) continue;
        bestWeight[next] = weight;
        parent[next] = current;
        addFrame({
          codeNeedle: 'bestWeight[next] = weight;',
          message: `bestWeight[${next}] ahora vale ${weight}.`,
          current: next,
          relaxedEdge: candidateEdge,
        });
        addFrame({
          codeNeedle: 'parent[next] = current;',
          message: `${values[current]} queda como posible padre de ${values[next]}.`,
          current: next,
          relaxedEdge: candidateEdge,
        });
      }
    }
  } else {
    const sortedEdges = edges
      .filter(([from, to]) => from < values.length && to < values.length && from !== to)
      .map(edge => [...edge])
      .sort((first, second) => Number(first[2]) - Number(second[2]));
    const parent = Array.from({ length: values.length }, (_, index) => index);
    const rank = Array(values.length).fill(0);
    const find = vertex => {
      if (parent[vertex] !== vertex) parent[vertex] = find(parent[vertex]);
      return parent[vertex];
    };
    const union = (firstRoot, secondRoot) => {
      if (rank[firstRoot] < rank[secondRoot]) parent[firstRoot] = secondRoot;
      else if (rank[firstRoot] > rank[secondRoot]) parent[secondRoot] = firstRoot;
      else {
        parent[secondRoot] = firstRoot;
        rank[firstRoot]++;
      }
    };

    addFrame({
      codeNeedle: 'void kruskal() {',
      message: 'Kruskal reunirá y ordenará todas las aristas por su peso.',
    });
    addFrame({
      codeNeedle: 'int[] parent = new int[vertexCount];',
      message: 'Se prepara Union-Find para detectar ciclos.',
    });
    for (let vertex = 0; vertex < values.length; vertex++) {
      treeVertices.add(vertex);
      addFrame({
        codeNeedle: 'parent[vertex] = vertex;',
        message: `${values[vertex]} comienza como representante de su propio conjunto.`,
        current: vertex,
        variables: [{ name: 'vertex', value: vertex, role: 'index' }],
      });
    }

    for (let edgeIndex = 0; edgeIndex < sortedEdges.length && selectedEdges.length < values.length - 1; edgeIndex++) {
      const [from, to, weight] = sortedEdges[edgeIndex];
      addFrame({
        codeNeedle: 'for (int edge = 0; edge < edgeCount && selected < vertexCount - 1; edge++) {',
        message: `Se considera ${values[from]} — ${values[to]} con peso ${weight}.`,
        current: from,
        relaxedEdge: [from, to],
        variables: [{ name: 'edge', value: edgeIndex, role: 'index' }],
      });
      const firstRoot = find(from);
      addFrame({
        codeNeedle: 'int firstRoot = find(parent, from[edge]);',
        message: `La raíz del conjunto de ${values[from]} es ${values[firstRoot]}.`,
        current: from,
        relaxedEdge: [from, to],
      });
      const secondRoot = find(to);
      addFrame({
        codeNeedle: 'int secondRoot = find(parent, to[edge]);',
        message: `La raíz del conjunto de ${values[to]} es ${values[secondRoot]}.`,
        current: to,
        relaxedEdge: [from, to],
      });
      const joinsDifferentTrees = firstRoot !== secondRoot;
      addFrame({
        codeNeedle: 'if (firstRoot != secondRoot) {',
        message: joinsDifferentTrees
          ? 'Las raíces son distintas: la arista no forma un ciclo.'
          : 'Ambos vértices ya están conectados: la arista formaría un ciclo.',
        current: to,
        relaxedEdge: [from, to],
        variables: [{ name: 'condición', value: String(joinsDifferentTrees), role: joinsDifferentTrees ? 'true' : 'false' }],
      });
      if (!joinsDifferentTrees) continue;

      union(firstRoot, secondRoot);
      addFrame({
        codeNeedle: 'union(parent, rank, firstRoot, secondRoot);',
        message: `Se unen los conjuntos de ${values[from]} y ${values[to]}.`,
        current: to,
        relaxedEdge: [from, to],
      });
      selectedEdges.push([from, to, Number(weight)]);
      totalCost += Number(weight);
      addFrame({
        codeNeedle: 'System.out.println(vertexNames[from[edge]]',
        message: `La arista ${values[from]} — ${values[to]} entra al árbol.`,
        current: to,
        relaxedEdge: [from, to],
      });
    }
    if (selectedEdges.length !== Math.max(0, values.length - 1)) {
      const message = 'Kruskal se detuvo: el grafo no es conexo.';
      addFrame({
        codeNeedle: 'for (int edge = 0; edge < edgeCount && selected < vertexCount - 1; edge++) {',
        message,
        current: 0,
        completed: true,
      });
      return { ok: false, values: [...values], edges: edges.map(edge => [...edge]), message, step: 0, frames };
    }
  }

  const message = `${algorithm.name} completó el árbol de expansión mínima con costo total ${totalCost}.`;
  addFrame({
    codeNeedle: mode === 'prim'
      ? 'for (int added = 0; added < vertexCount; added++) {'
      : 'for (int edge = 0; edge < edgeCount && selected < vertexCount - 1; edge++) {',
    message,
    current: selectedEdges.at(-1)?.[1] ?? start,
    completed: true,
    delayMs: 460,
  });
  return {
    ok: true,
    values: [...values],
    edges: edges.map(edge => [...edge]),
    message,
    step: start,
    frames,
  };
}

const pathFromParents = (parents, start, goal) => {
  const path = [];
  let current = goal;
  const seen = new Set();
  while (current !== -1 && !seen.has(current)) {
    seen.add(current);
    path.unshift(current);
    if (current === start) return path;
    current = parents[current];
  }
  return [];
};

const pathEdges = path => path.slice(1).map((vertex, index) => [path[index], vertex]);
const printableCost = value => Number.isFinite(value) ? Number(value.toFixed(2)) : '∞';

const shortestPathTrace = ({ algorithm, values, edges, start, goal }) => {
  const size = values.length;
  const positions = (algorithm.positions ?? DEFAULT_GRAPH_POSITIONS).map(position => [...position]);
  const adjacency = Array.from({ length: size }, () => []);
  const usableEdges = edges.filter(([from, to, weight]) => (
    from < size && to < size && Number.isFinite(Number(weight)) && Number(weight) >= 0
  ));
  usableEdges.forEach(([from, to, weight]) => {
    adjacency[from].push({ vertex: to, weight: Number(weight), edge: [from, to] });
    adjacency[to].push({ vertex: from, weight: Number(weight), edge: [from, to] });
  });

  const isAStar = algorithm.id === 'a-star';
  const distance = new Array(size).fill(Infinity);
  const score = new Array(size).fill(Infinity);
  const heuristic = new Array(size).fill(0);
  const parents = new Array(size).fill(-1);
  const closed = new Set();
  const open = new Set([start]);
  const examinedEdges = [];
  const ratios = usableEdges.map(([from, to, weight]) => {
    const [x1, y1] = positions[from] ?? DEFAULT_GRAPH_POSITIONS[from];
    const [x2, y2] = positions[to] ?? DEFAULT_GRAPH_POSITIONS[to];
    const geometricDistance = Math.hypot(x2 - x1, y2 - y1);
    return geometricDistance > 0 ? Number(weight) / geometricDistance : 0;
  }).filter(value => value > 0);
  const heuristicScale = ratios.length ? Math.min(...ratios) : 0;
  if (isAStar) {
    const [goalX, goalY] = positions[goal] ?? DEFAULT_GRAPH_POSITIONS[goal];
    for (let vertex = 0; vertex < size; vertex++) {
      const [x, y] = positions[vertex] ?? DEFAULT_GRAPH_POSITIONS[vertex];
      heuristic[vertex] = Math.hypot(goalX - x, goalY - y) * heuristicScale;
    }
  }
  distance[start] = 0;
  score[start] = heuristic[start];

  const state = ({ current = start, searchPosition = current, relaxedEdge = null, candidate = null, condition = null, finalPath = [] } = {}) => ({
    current,
    searchPosition,
    start,
    goal,
    distances: distance.map(printableCost),
    heuristic: heuristic.map(printableCost),
    scores: score.map(printableCost),
    parents: [...parents],
    open: [...open],
    closed: [...closed],
    visitedEdges: examinedEdges.map(edge => [...edge]),
    relaxedEdge,
    candidate: printableCost(candidate),
    condition,
    path: [...finalPath],
    pathEdges: pathEdges(finalPath),
    cost: printableCost(distance[goal]),
    mode: isAStar ? 'astar' : 'dijkstra',
  });
  const variables = (current, candidate = null, condition = null) => {
    const result = [
      { name: 'actual', value: values[current], role: 'position' },
      { name: isAStar ? 'g' : 'distancia', value: printableCost(distance[current]), role: 'value' },
    ];
    if (isAStar) result.push(
      { name: 'h', value: printableCost(heuristic[current]), role: 'input' },
      { name: 'f = g + h', value: printableCost(score[current]), role: 'size' },
    );
    if (candidate !== null) result.push({ name: 'nuevo costo', value: printableCost(candidate), role: 'input' });
    if (condition !== null) result.push({ name: '¿mejora?', value: condition ? 'true' : 'false', role: condition ? 'true' : 'false' });
    return result;
  };
  const frames = [{
    values: [...values], edges: edges.map(edge => [...edge]), position: start,
    codeLine: isAStar ? 11 : 8,
    message: `Origen ${values[start]} con costo 0. Los demás vértices comienzan en infinito.`,
    graphState: state(), variables: variables(start),
  }];

  while (open.size) {
    let current = -1;
    let best = Infinity;
    for (const vertex of open) {
      const value = isAStar ? score[vertex] : distance[vertex];
      if (value < best) { best = value; current = vertex; }
    }
    if (current === -1) break;
    open.delete(current);
    closed.add(current);
    frames.push({
      values: [...values], edges: edges.map(edge => [...edge]), position: current,
      codeLine: isAStar ? 16 : 10,
      message: `${values[current]} tiene el menor ${isAStar ? 'valor f' : 'costo tentativo'} y pasa a ser el vértice actual.`,
      graphState: state({ current }), variables: variables(current),
    });
    if (current === goal) break;

    for (const neighbor of adjacency[current]) {
      if (closed.has(neighbor.vertex)) continue;
      examinedEdges.push(neighbor.edge);
      const candidate = distance[current] + neighbor.weight;
      const improves = candidate < distance[neighbor.vertex];
      frames.push({
        values: [...values], edges: edges.map(edge => [...edge]), position: neighbor.vertex,
        codeLine: isAStar ? 23 : 17,
        message: `${values[current]} → ${values[neighbor.vertex]}: ${printableCost(distance[current])} + ${neighbor.weight} = ${printableCost(candidate)}. ${improves ? 'Mejora la ruta conocida.' : 'No mejora la ruta conocida.'}`,
        graphState: state({ current, searchPosition: neighbor.vertex, relaxedEdge: neighbor.edge, candidate, condition: improves }),
        variables: variables(current, candidate, improves),
      });
      if (!improves) continue;
      parents[neighbor.vertex] = current;
      distance[neighbor.vertex] = candidate;
      score[neighbor.vertex] = candidate + heuristic[neighbor.vertex];
      open.add(neighbor.vertex);
      frames.push({
        values: [...values], edges: edges.map(edge => [...edge]), position: neighbor.vertex,
        codeLine: isAStar ? 26 : 19,
        message: `Se actualiza ${values[neighbor.vertex]}: ${isAStar ? `g=${printableCost(candidate)}, h=${printableCost(heuristic[neighbor.vertex])}, f=${printableCost(score[neighbor.vertex])}` : `distancia=${printableCost(candidate)}`}. Su anterior ahora es ${values[current]}.`,
        graphState: state({ current: neighbor.vertex, relaxedEdge: neighbor.edge, candidate, condition: true }),
        variables: variables(neighbor.vertex, candidate, true),
      });
    }
  }

  const path = pathFromParents(parents, start, goal);
  const found = path.length > 0;
  frames.push({
    values: [...values], edges: edges.map(edge => [...edge]), position: goal,
    codeLine: isAStar ? 33 : 24,
    message: found
      ? `Ruta mínima: ${path.map(vertex => values[vertex]).join(' → ')}. Costo total: ${printableCost(distance[goal])}.`
      : `No existe una ruta entre ${values[start]} y ${values[goal]}.`,
    graphState: state({ current: goal, finalPath: path }),
    variables: [
      { name: 'ruta', value: found ? path.map(vertex => values[vertex]).join(' → ') : 'sin ruta', role: 'position' },
      { name: 'costo total', value: printableCost(distance[goal]), role: found ? 'true' : 'false' },
      { name: 'visitados', value: closed.size, role: 'size' },
    ],
    completed: true,
  });

  return { found, path, cost: distance[goal], frames };
};

const solveHanoiWithTrace = diskValues => {
  const disks = diskValues
    .map(item => typeof item === 'object' ? Number(item.size) : Number(item))
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  const positions = disks.map(size => ({ size, rod: 0 }));
  const frames = [];
  const names = ['A', 'B', 'C'];
  let moveCount = 0;

  const addFrame = ({ amount, from, to, help, depth, codeLine, phase, message, delayMs = 150 }) => {
    frames.push({
      values: positions.map(item => ({ ...item })),
      position: amount,
      codeLine,
      delayMs,
      message,
      hanoiState: {
        phase,
        activeDisk: amount,
        from,
        to,
        help,
        depth,
        moveCount,
        totalMoves: 2 ** disks.length - 1,
      },
      variables: [
        { name: 'disks', value: amount, role: 'size' },
        { name: 'from', value: names[from], role: 'position' },
        { name: 'to', value: names[to], role: 'position' },
        { name: 'help', value: names[help], role: 'position' },
        { name: 'profundidad', value: depth, role: 'index' },
        { name: 'movimiento', value: `${moveCount}/${2 ** disks.length - 1}`, role: 'value' },
      ],
    });
  };

  const move = (amount, from, to, help, depth = 0) => {
    addFrame({
      amount, from, to, help, depth,
      codeLine: 0,
      phase: 'call',
      message: `Llamada hanoi(${amount}, ${names[from]}, ${names[to]}, ${names[help]}).`,
    });

    if (amount === 0) {
      addFrame({
        amount, from, to, help, depth,
        codeLine: 1,
        phase: 'base',
        message: 'Caso base: no quedan discos en esta llamada y regresamos.',
        delayMs: 120,
      });
      return;
    }

    addFrame({
      amount, from, to, help, depth,
      codeLine: 2,
      phase: 'first-call',
      message: `Primero movemos ${amount - 1} ${amount - 1 === 1 ? 'disco' : 'discos'} desde ${names[from]} hacia ${names[help]}.`,
      delayMs: 135,
    });
    move(amount - 1, from, help, to, depth + 1);

    const disk = positions.find(item => item.size === amount);
    disk.rod = to;
    moveCount += 1;
    addFrame({
      amount, from, to, help, depth,
      codeLine: 3,
      phase: 'move',
      message: `Mover disco ${amount} desde ${names[from]} hasta ${names[to]}.`,
      delayMs: 430,
    });

    addFrame({
      amount, from: help, to, help: from, depth,
      codeLine: 4,
      phase: 'second-call',
      message: `Ahora movemos ${amount - 1} ${amount - 1 === 1 ? 'disco' : 'discos'} desde ${names[help]} hacia ${names[to]}.`,
      delayMs: 135,
    });
    move(amount - 1, help, to, from, depth + 1);
  };

  move(disks.length, 0, 2, 1);
  if (frames.length) frames.at(-1).completed = true;
  return { values: positions, frames, moves: moveCount };
};

const validIndex = (raw, length, allowEnd = false) => {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;
  const index = Number(raw);
  const maximum = allowEnd ? length : length - 1;
  return Number.isInteger(index) && index >= 0 && index <= maximum ? index : null;
};

const fibonacci = number => {
  let previous = 0, current = 1;
  const result = [];
  for (let index = 0; index <= number; index++) {
    result.push(previous);
    [previous, current] = [current, previous + current];
  }
  return result;
};

const SUDOKU_TRACE_LIMITS = {
  call: 4,
  'row-check': 4,
  'column-check': 3,
  'column-transition': 3,
  'given-check': 4,
  'given-recursion': 3,
  'number-loop': 6,
  'valid-call': 6,
  choose: 5,
  recursion: 5,
  undo: 4,
  'dead-end': 3,
  'valid-entry': 5,
  'index-loop': 6,
  'row-comparison': 3,
  'row-conflict': 3,
  'column-comparison': 3,
  'column-conflict': 3,
  'box-row': 2,
  'box-column': 2,
  'box-row-loop': 3,
  'box-column-loop': 3,
  'box-comparison': 3,
  'box-conflict': 3,
  'valid-return': 4,
};

const sudokuVariables = (row, column, number = null, extras = []) => [
  { name: 'fila', value: row, role: 'index' },
  { name: 'columna', value: column, role: 'index' },
  ...(number === null ? [] : [{ name: 'número', value: number, role: 'input' }]),
  ...extras,
];

const createSudokuTracer = () => {
  const tracer = {
    frames: [],
    skipped: 0,
    occurrences: new Map(),
    record(board, {
      row,
      column,
      number = null,
      traceKey,
      codeNeedle,
      message,
      extras = [],
      force = false,
      completed = false,
      iteration = null,
      totalIterations = null,
    }) {
      const count = tracer.occurrences.get(traceKey) ?? 0;
      const limit = SUDOKU_TRACE_LIMITS[traceKey] ?? 2;
      if (!force && count >= limit) {
        tracer.skipped++;
        return;
      }
      tracer.occurrences.set(traceKey, count + 1);
      const safeRow = Math.max(0, Math.min(8, row));
      const safeColumn = Math.max(0, Math.min(8, column));
      tracer.frames.push({
        values: [...board],
        position: safeRow * 9 + safeColumn,
        codeNeedle,
        message,
        variables: sudokuVariables(row, column, number, extras),
        completed,
        iteration,
        totalIterations,
      });
    },
  };
  return tracer;
};

const canPlaceSudoku = (board, row, column, number, tracer = null) => {
  const record = (traceKey, codeNeedle, message, extras = [], options = {}) => tracer?.record(board, {
    row, column, number, traceKey, codeNeedle, message, extras, ...options,
  });

  record('valid-entry', 'boolean isValid(int row, int column, int number)', `Entra a isValid(${row}, ${column}, ${number}).`);
  for (let index = 0; index < 9; index++) {
    const loopData = [{ name: 'index', value: index, role: 'index' }];
    record('index-loop', 'for (int index = 0; index < 9; index++)', `El ciclo revisa el índice ${index} de la fila y la columna.`, loopData, {
      iteration: index,
      totalIterations: 9,
    });
    record('row-comparison', 'if (board[row][index] == number)', `Compara ${number} con la fila ${row + 1}, columna ${index + 1}.`, loopData);
    if (board[row * 9 + index] === number) {
      record('row-conflict', 'if (board[row][index] == number) return false;', `${number} ya existe en la fila ${row + 1}: isValid devuelve false.`, [
        ...loopData,
        { name: 'resultado', value: false, role: 'false' },
      ]);
      return false;
    }
    record('column-comparison', 'if (board[index][column] == number)', `Compara ${number} con la columna ${column + 1}, fila ${index + 1}.`, loopData);
    if (board[index * 9 + column] === number) {
      record('column-conflict', 'if (board[index][column] == number) return false;', `${number} ya existe en la columna ${column + 1}: isValid devuelve false.`, [
        ...loopData,
        { name: 'resultado', value: false, role: 'false' },
      ]);
      return false;
    }
  }

  const firstRow = Math.floor(row / 3) * 3;
  const firstColumn = Math.floor(column / 3) * 3;
  record('box-row', 'int firstRow = (row / 3) * 3;', `El subcuadro comienza en la fila ${firstRow}.`, [
    { name: 'firstRow', value: firstRow, role: 'index' },
  ]);
  record('box-column', 'int firstColumn = (column / 3) * 3;', `El subcuadro comienza en la columna ${firstColumn}.`, [
    { name: 'firstColumn', value: firstColumn, role: 'index' },
  ]);
  for (let r = firstRow; r < firstRow + 3; r++) {
    record('box-row-loop', 'for (int r = firstRow; r < firstRow + 3; r++)', `Revisa la fila ${r + 1} del subcuadro 3×3.`, [
      { name: 'r', value: r, role: 'index' },
    ], { iteration: r - firstRow, totalIterations: 3 });
    for (let c = firstColumn; c < firstColumn + 3; c++) {
      const boxData = [
        { name: 'r', value: r, role: 'index' },
        { name: 'c', value: c, role: 'index' },
      ];
      record('box-column-loop', 'for (int c = firstColumn; c < firstColumn + 3; c++)', `Revisa la celda (${r + 1}, ${c + 1}) del subcuadro.`, boxData, {
        iteration: c - firstColumn,
        totalIterations: 3,
      });
      record('box-comparison', 'if (board[r][c] == number)', `Compara la celda del subcuadro con ${number}.`, boxData);
      if (board[r * 9 + c] === number) {
        record('box-conflict', 'if (board[r][c] == number) return false;', `${number} ya existe en el subcuadro: isValid devuelve false.`, [
          ...boxData,
          { name: 'resultado', value: false, role: 'false' },
        ]);
        return false;
      }
    }
  }
  record('valid-return', 'return true;', `La fila, la columna y el subcuadro aceptan ${number}: isValid devuelve true.`, [
    { name: 'resultado', value: true, role: 'true' },
  ]);
  return true;
};

const solveSudoku = (board, row = 0, column = 0, tracer = null) => {
  const record = (traceKey, codeNeedle, message, extras = [], options = {}) => tracer?.record(board, {
    row, column, traceKey, codeNeedle, message, extras, ...options,
  });

  record('call', 'boolean solveSudoku(int row, int column)', `Entra a solveSudoku(${row}, ${column}).`);
  record('row-check', 'if (row == 9) return true;', `Comprueba el caso base: row vale ${row}.`);
  if (row === 9) {
    record('row-check', 'if (row == 9) return true;', 'row es 9: el tablero está completo y la recursión devuelve true.', [
      { name: 'resultado', value: true, role: 'true' },
    ], { force: true, completed: true });
    return true;
  }

  record('column-check', 'if (column == 9) return solveSudoku(row + 1, 0);', `Comprueba si terminó la fila ${row + 1}: column vale ${column}.`);
  if (column === 9) {
    record('column-transition', 'if (column == 9) return solveSudoku(row + 1, 0);', `Terminó la fila ${row + 1}; continúa en solveSudoku(${row + 1}, 0).`);
    return solveSudoku(board, row + 1, 0, tracer);
  }

  const position = row * 9 + column;
  record('given-check', 'if (board[row][column] != 0)', `Comprueba si (${row + 1}, ${column + 1}) contiene una pista.`);
  if (board[position] !== 0) {
    record('given-recursion', 'return solveSudoku(row, column + 1);', `La celda contiene ${board[position]}; avanza sin modificarla.`, [
      { name: 'pista', value: board[position], role: 'value' },
    ]);
    return solveSudoku(board, row, column + 1, tracer);
  }

  for (let number = 1; number <= 9; number++) {
    record('number-loop', 'for (int number = 1; number <= 9; number++)', `El ciclo prueba el número ${number}.`, [], {
      number,
      iteration: number - 1,
      totalIterations: 9,
    });
    record('valid-call', 'if (isValid(row, column, number))', `Llama a isValid(${row}, ${column}, ${number}).`, [], { number });
    if (canPlaceSudoku(board, row, column, number, tracer)) {
      board[position] = number;
      record('choose', 'board[row][column] = number;', `Coloca ${number} en (${row + 1}, ${column + 1}).`, [], { number });
      record('recursion', 'if (solveSudoku(row, column + 1)) return true;', `Llama recursivamente a la columna ${column + 2}.`, [], { number });
      if (solveSudoku(board, row, column + 1, tracer)) return true;
      board[position] = 0;
      record('undo', 'board[row][column] = 0;', `${number} bloqueó una rama: borra la celda y retrocede.`, [], { number });
    }
  }
  record('dead-end', 'return false;', `Ningún número funciona en (${row + 1}, ${column + 1}); devuelve false.`, [
    { name: 'resultado', value: false, role: 'false' },
  ]);
  return false;
};

const completeSudokuTrace = (tracer, solvedBoard) => {
  const finalFrame = tracer.frames.at(-1);
  if (finalFrame) {
    finalFrame.values = [...solvedBoard];
    finalFrame.position = 80;
    finalFrame.completed = true;
    finalFrame.message = 'Sudoku 9×9 resuelto. Las iteraciones idénticas se agruparon, pero se recorrieron todas las líneas ejecutables y los bucles representativos.';
  }
  return tracer.frames;
};

const solveQueensWithTrace = size => {
  const queens = new Array(size).fill(-1);
  const trace = [{ values: [...queens], position: 0, codeLine: 3, message: `Se inicializa el tablero y comienza solveQueens(${size}).` }];
  const safe = (row, column) => {
    trace.push({ values: [...queens], position: row * size + column, codeLine: 25, message: `isSafe comprueba la posición (${row + 1}, ${column + 1}).` });
    for (let previous = 0; previous < row; previous++) {
      if (queens[previous] === column) {
        trace.push({ values: [...queens], position: row * size + column, codeLine: 28, message: `No es segura: ya existe una reina en la columna ${column + 1}.` });
        return false;
      }
      if (Math.abs(queens[previous] - column) === row - previous) {
        trace.push({ values: [...queens], position: row * size + column, codeLine: 31, message: 'No es segura: otra reina se encuentra en la misma diagonal.' });
        return false;
      }
    }
    trace.push({ values: [...queens], position: row * size + column, codeLine: 33, message: 'La columna y las diagonales están libres: isSafe devuelve true.' });
    return true;
  };
  const place = row => {
    if (row === size) {
      trace.push({ values: [...queens], position: size * size - 1, codeLine: 13, message: 'Caso base: todas las reinas fueron colocadas sin conflictos.' });
      return true;
    }
    for (let column = 0; column < size; column++) {
      if (!safe(row, column)) continue;
      queens[row] = column;
      trace.push({ values: [...queens], position: row * size + column, codeLine: 17, message: `isSafe devolvió true. Se coloca una reina en fila ${row + 1}, columna ${column + 1}.` });
      if (place(row + 1)) return true;
      queens[row] = -1;
      trace.push({ values: [...queens], position: row * size + column, codeLine: 19, message: `La reina en (${row + 1}, ${column + 1}) conduce a un conflicto: se retira y se vuelve atrás.` });
    }
    return false;
  };
  return { solved: place(0), values: queens, frames: trace };
};

const solveMazeWithTrace = initialMaze => {
  const maze = [...initialMaze];
  const trace = [];
  const directions = [
    { rowChange: 0, columnChange: 1, name: 'derecha', codeNeedle: 'if (solveMaze(row, column + 1)) return true;' },
    { rowChange: 1, columnChange: 0, name: 'abajo', codeNeedle: 'if (solveMaze(row + 1, column)) return true;' },
    { rowChange: 0, columnChange: -1, name: 'izquierda', codeNeedle: 'if (solveMaze(row, column - 1)) return true;' },
    { rowChange: -1, columnChange: 0, name: 'arriba', codeNeedle: 'if (solveMaze(row - 1, column)) return true;' },
  ];
  const validPosition = (row, column) => row >= 0 && row < 6 && column >= 0 && column < 6;
  const addFrame = (row, column, codeNeedle, message, extras = {}) => {
    const fallbackPosition = Number.isInteger(extras.fromPosition) ? extras.fromPosition : 0;
    const position = validPosition(row, column) ? row * 6 + column : fallbackPosition;
    trace.push({
      values: [...maze],
      position,
      codeNeedle,
      message,
      delayMs: extras.delayMs ?? 260,
      completed: extras.completed ?? false,
      variables: [
        { name: 'row', value: row, role: 'index' },
        { name: 'column', value: column, role: 'index' },
        { name: 'profundidad', value: extras.depth ?? 0, role: 'size' },
        ...(extras.result === undefined ? [] : [{ name: 'resultado', value: extras.result, role: extras.result ? 'true' : 'false' }]),
      ],
    });
  };

  const explore = (row, column, depth = 0, fromPosition = 0) => {
    const inside = validPosition(row, column);
    const position = inside ? row * 6 + column : fromPosition;
    const free = inside && maze[position] === 0;
    addFrame(
      row,
      column,
      'if (!isFree(row, column)) return false;',
      free
        ? `isFree(${row}, ${column}) devuelve true: la celda está disponible.`
        : `isFree(${row}, ${column}) devuelve false: la llamada regresa sin avanzar.`,
      { depth, fromPosition, result: free, delayMs: free ? 280 : 170 },
    );
    if (!free) return false;

    maze[position] = 2;
    addFrame(row, column, 'path[row][column] = true;', `Se elige la celda (${row}, ${column}) como parte del camino.`, { depth });

    const exit = row === 5 && column === 5;
    addFrame(
      row,
      column,
      'if (isExit(row, column)) return true;',
      exit
        ? `isExit(${row}, ${column}) devuelve true: se alcanzó la salida.`
        : `isExit(${row}, ${column}) devuelve false: hay que seguir explorando.`,
      { depth, result: exit },
    );
    addFrame(
      row,
      column,
      'return row == 5 && column == 5;',
      exit ? 'La condición de isExit es verdadera.' : 'La condición de isExit es falsa.',
      { depth, result: exit, delayMs: 210 },
    );
    if (exit) return true;

    for (const direction of directions) {
      const nextRow = row + direction.rowChange;
      const nextColumn = column + direction.columnChange;
      addFrame(
        row,
        column,
        direction.codeNeedle,
        `Llama recursivamente hacia ${direction.name}: solveMaze(${nextRow}, ${nextColumn}).`,
        { depth, result: undefined, delayMs: 230 },
      );
      if (explore(nextRow, nextColumn, depth + 1, position)) {
        addFrame(
          row,
          column,
          direction.codeNeedle,
          `La llamada hacia ${direction.name} devolvió true; esta llamada también retorna true.`,
          { depth, result: true, delayMs: 190 },
        );
        return true;
      }
    }

    maze[position] = 3;
    addFrame(
      row,
      column,
      'path[row][column] = false;',
      `Callejón sin salida en (${row}, ${column}): se desmarca la celda y se vuelve atrás.`,
      { depth, result: false },
    );
    addFrame(row, column, 'return false;', 'Ninguna dirección funcionó; la llamada devuelve false.', { depth, result: false, delayMs: 190 });
    return false;
  };

  addFrame(0, 0, 'boolean solveMaze(int row, int column)', 'Comienza solveMaze(0, 0).', { depth: 0, delayMs: 220 });
  const solved = explore(0, 0);
  if (solved) {
    addFrame(5, 5, 'if (solveMaze(row, column + 1)) return true;', 'La respuesta true regresa hasta la llamada inicial: el laberinto quedó resuelto.', {
      depth: 0,
      result: true,
      completed: true,
      delayMs: 300,
    });
  }
  return { solved, values: maze, frames: trace };
};

export const SPARSE_MATRIX_ROWS = 5;
export const SPARSE_MATRIX_COLUMNS = 6;

function executePolynomialOperation({ actionId, fields, values, edges }) {
  const beforeValues = values.map(term => ({ ...term }));
  const A = polynomialTerms(beforeValues, 'A');
  const B = polynomialTerms(beforeValues, 'B');
  const C = polynomialTerms(beforeValues, 'C');
  const copiedEdges = edges.map(edge => [...edge]);
  const parseInteger = raw => {
    if (raw === undefined || raw === null || String(raw).trim() === '') return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) ? parsed : null;
  };
  const coefficient = parseInteger(fields.value);
  const exponent = parseInteger(fields.index);
  const stateValues = (nextA = A, nextB = B, nextC = C) => combinePolynomialValues(nextA, nextB, nextC);
  const frame = ({
    nextA = A,
    nextB = B,
    nextC = C,
    codeNeedle,
    message,
    pIndex = null,
    qIndex = null,
    activePolynomial = null,
    activeIndex = null,
    phase = 'idle',
    completed = false,
    extras = [],
  }) => ({
    values: stateValues(nextA, nextB, nextC),
    edges: copiedEdges,
    position: Math.max(0, activeIndex ?? pIndex ?? qIndex ?? 0),
    codeNeedle,
    message,
    delayMs: 620,
    completed,
    polynomialState: {
      pIndex,
      qIndex,
      activePolynomial,
      activeIndex,
      phase,
      resultCount: nextC.length,
    },
    variables: [
      { name: 'p', value: pIndex === null ? '—' : A[pIndex] ? `${A[pIndex].coefficient}x^${A[pIndex].exponent}` : 'null', role: 'position' },
      { name: 'q', value: qIndex === null ? '—' : B[qIndex] ? `${B[qIndex].coefficient}x^${B[qIndex].exponent}` : 'null', role: 'position' },
      { name: 'términos en C', value: nextC.length, role: 'size' },
      ...extras,
    ],
  });
  const finish = (ok, updated, message, frames, step = 0) => ({
    ok,
    values: updated,
    edges: copiedEdges,
    message,
    step,
    frames,
  });

  if (['poly-insert-a', 'poly-insert-b'].includes(actionId)) {
    if (coefficient === null || exponent === null || exponent < 0) {
      return finish(false, beforeValues, 'Ingresa un coeficiente entero y un exponente entero mayor o igual que 0.', []);
    }
    const targetName = actionId.endsWith('a') ? 'A' : 'B';
    const source = targetName === 'A' ? A : B;
    const wrapper = targetName === 'A' ? 'void insertInA(int coefficient, int exponent) {' : 'void insertInB(int coefficient, int exponent) {';
    const assignment = targetName === 'A'
      ? 'A = insertOrdered(A, coefficient, exponent);'
      : 'B = insertOrdered(B, coefficient, exponent);';
    const frames = [
      frame({ codeNeedle: wrapper, message: `Se insertará ${coefficient}x^${exponent} en ${targetName}.`, activePolynomial: targetName, extras: [
        { name: 'coefficient', value: coefficient, role: 'input' },
        { name: 'exponent', value: exponent, role: 'input' },
      ] }),
      frame({ codeNeedle: assignment, message: `Se llama a insertOrdered con la cabeza de ${targetName}.`, activePolynomial: targetName }),
      frame({ codeNeedle: 'if (coefficient == 0) {', message: coefficient === 0
        ? 'El coeficiente es 0: el término no debe almacenarse.'
        : 'El coeficiente es distinto de 0 y puede formar un término.', activePolynomial: targetName, extras: [
        { name: 'condición', value: String(coefficient === 0), role: coefficient === 0 ? 'true' : 'false' },
      ] }),
    ];
    let currentIndex = 0;
    while (currentIndex < source.length && source[currentIndex].exponent > exponent) {
      frames.push(frame({
        codeNeedle: 'while (current != null && current.exponent > exponent) {',
        message: `Exp(${source[currentIndex].exponent}) es mayor que ${exponent}; previous y current avanzan.`,
        activePolynomial: targetName,
        activeIndex: currentIndex,
        phase: 'scan',
        extras: [{ name: 'current.exp', value: source[currentIndex].exponent, role: 'value' }],
      }));
      frames.push(
        frame({ codeNeedle: 'previous = current;', message: `previous queda en el término de exponente ${source[currentIndex].exponent}.`, activePolynomial: targetName, activeIndex: currentIndex }),
        frame({ codeNeedle: 'current = current.next;', message: 'current avanza mediante LINK.', activePolynomial: targetName, activeIndex: Math.min(currentIndex + 1, Math.max(0, source.length - 1)) }),
      );
      currentIndex++;
    }
    const sameExponent = source[currentIndex]?.exponent === exponent;
    frames.push(frame({
      codeNeedle: 'if (current != null && current.exponent == exponent) {',
      message: sameExponent
        ? `Ya existe el exponente ${exponent}; se agruparán los coeficientes.`
        : `No existe otro término con exponente ${exponent}; se creará un nodo.`,
      activePolynomial: targetName,
      activeIndex: Math.min(currentIndex, Math.max(0, source.length - 1)),
      extras: [{ name: 'condición', value: String(sameExponent), role: sameExponent ? 'true' : 'false' }],
    }));
    const updatedTarget = insertPolynomialTerm(source, coefficient, exponent);
    if (sameExponent) {
      const grouped = source[currentIndex].coefficient + coefficient;
      frames.push(frame({
        codeNeedle: 'current.coefficient += coefficient;',
        message: `${source[currentIndex].coefficient} + ${coefficient} = ${grouped}.`,
        activePolynomial: targetName,
        activeIndex: currentIndex,
        extras: [{ name: 'coeficiente agrupado', value: grouped, role: 'value' }],
      }));
      frames.push(frame({
        codeNeedle: 'if (current.coefficient == 0) {',
        message: grouped === 0
          ? 'La suma dio 0; el nodo se elimina porque los coeficientes cero no se guardan.'
          : 'El coeficiente final no es cero; el nodo permanece.',
        activePolynomial: targetName,
        activeIndex: Math.min(currentIndex, Math.max(0, updatedTarget.length - 1)),
        extras: [{ name: 'condición', value: String(grouped === 0), role: grouped === 0 ? 'true' : 'false' }],
      }));
    } else if (coefficient !== 0) {
      frames.push(
        frame({ codeNeedle: 'Node newNode = new Node(coefficient, exponent);', message: `Se crea el nodo [${coefficient} | ${exponent} | LINK].`, activePolynomial: targetName, activeIndex: currentIndex, phase: 'create' }),
        frame({ codeNeedle: 'newNode.next = current;', message: 'LINK del nuevo nodo apunta al término menor que sigue.', activePolynomial: targetName, activeIndex: currentIndex, phase: 'link' }),
        frame({ codeNeedle: currentIndex === 0 ? 'return newNode;' : 'previous.next = newNode;', message: currentIndex === 0
          ? `El nuevo nodo se convierte en la cabeza de ${targetName}.`
          : 'LINK de previous se conecta con el nuevo nodo.', activePolynomial: targetName, activeIndex: currentIndex, phase: 'link' }),
      );
    }
    const nextA = targetName === 'A' ? updatedTarget : A;
    const nextB = targetName === 'B' ? updatedTarget : B;
    const updated = stateValues(nextA, nextB, []);
    const finalMessage = coefficient === 0
      ? 'El término no se almacenó porque su coeficiente es 0.'
      : `${targetName} = ${formatPolynomial(updatedTarget)}. C se limpió porque cambió un operando.`;
    frames.push(frame({
      nextA,
      nextB,
      nextC: C,
      codeNeedle: assignment,
      message: `${targetName} recibe la cabeza devuelta por insertOrdered; el cambio ya es visible.`,
      activePolynomial: targetName,
      activeIndex: Math.max(0, updatedTarget.findIndex(term => term.exponent === exponent)),
      phase: 'assign',
    }));
    frames.push(frame({
      nextA,
      nextB,
      nextC: [],
      codeNeedle: 'C = null;',
      message: finalMessage,
      activePolynomial: targetName,
      activeIndex: Math.max(0, updatedTarget.findIndex(term => term.exponent === exponent)),
      completed: true,
    }));
    return finish(true, updated, finalMessage, frames);
  }

  if (['poly-remove-a', 'poly-remove-b'].includes(actionId)) {
    if (exponent === null || exponent < 0) {
      return finish(false, beforeValues, 'Ingresa el exponente entero que quieres eliminar.', []);
    }
    const targetName = actionId.endsWith('a') ? 'A' : 'B';
    const source = targetName === 'A' ? A : B;
    const foundIndex = source.findIndex(term => term.exponent === exponent);
    const wrapper = targetName === 'A' ? 'void removeFromA(int exponent) {' : 'void removeFromB(int exponent) {';
    const assignment = targetName === 'A'
      ? 'A = removeExponent(A, exponent);'
      : 'B = removeExponent(B, exponent);';
    const frames = [
      frame({ codeNeedle: wrapper, message: `Se buscará x^${exponent} en ${targetName}.`, activePolynomial: targetName }),
      frame({ codeNeedle: assignment, message: 'Entra al método removeExponent.', activePolynomial: targetName }),
    ];
    source.forEach((term, index) => {
      if (foundIndex >= 0 && index > foundIndex) return;
      frames.push(frame({
        codeNeedle: 'while (current != null && current.exponent != exponent) {',
        message: term.exponent === exponent
          ? `Exp(${term.exponent}) coincide: el ciclo termina.`
          : `Exp(${term.exponent}) no coincide: se sigue por LINK.`,
        activePolynomial: targetName,
        activeIndex: index,
        phase: 'scan',
      }));
    });
    if (foundIndex < 0) {
      frames.push(frame({ codeNeedle: 'if (current == null) {', message: `El exponente ${exponent} no existe en ${targetName}.`, activePolynomial: targetName, completed: true }));
      return finish(false, beforeValues, `No existe un término x^${exponent} en ${targetName}.`, frames);
    }
    const updatedTarget = source.filter((_, index) => index !== foundIndex);
    frames.push(frame({
      nextA: targetName === 'A' ? updatedTarget : A,
      nextB: targetName === 'B' ? updatedTarget : B,
      nextC: [],
      codeNeedle: foundIndex === 0 ? 'return current.next;' : 'previous.next = current.next;',
      message: foundIndex === 0 ? 'La cabeza avanza al segundo término.' : 'previous salta el nodo eliminado.',
      activePolynomial: targetName,
      activeIndex: Math.max(0, foundIndex - 1),
      phase: 'remove',
    }));
    const nextA = targetName === 'A' ? updatedTarget : A;
    const nextB = targetName === 'B' ? updatedTarget : B;
    const finalMessage = `Se eliminó x^${exponent} de ${targetName}. C se limpió.`;
    frames.push(frame({ nextA, nextB, nextC: C, codeNeedle: assignment, message: `${targetName} recibe la lista sin x^${exponent}.`, activePolynomial: targetName, completed: false }));
    frames.push(frame({ nextA, nextB, nextC: [], codeNeedle: 'C = null;', message: finalMessage, activePolynomial: targetName, completed: true }));
    return finish(true, stateValues(nextA, nextB, []), finalMessage, frames);
  }

  if (actionId === 'poly-add') {
    const result = [];
    let p = 0;
    let q = 0;
    const frames = [
      frame({ codeNeedle: 'void sumPolynomials() {', message: 'Comienza la suma de A y B.', pIndex: 0, qIndex: 0 }),
      frame({ codeNeedle: 'C = add(A, B);', message: 'Se llama al método que mezcla ambas listas ordenadas.', pIndex: 0, qIndex: 0 }),
      frame({ codeNeedle: 'Node p = first;', message: 'p apunta al primer término de A.', pIndex: 0, qIndex: 0 }),
      frame({ codeNeedle: 'Node q = second;', message: 'q apunta al primer término de B.', pIndex: 0, qIndex: 0 }),
    ];
    const append = (term, codeNeedle, message, activePolynomial) => {
      result.push({ coefficient: term.coefficient, exponent: term.exponent });
      frames.push(
        frame({ nextC: result, codeNeedle, message, pIndex: p, qIndex: q, activePolynomial, activeIndex: activePolynomial === 'A' ? p : q, phase: 'append' }),
        frame({ nextC: result, codeNeedle: 'end = end.next;', message: 'end avanza al último nodo creado en C.', pIndex: p, qIndex: q, activePolynomial: 'C', activeIndex: result.length - 1 }),
      );
    };
    while (p < A.length && q < B.length) {
      frames.push(frame({
        nextC: result,
        codeNeedle: 'while (p != null && q != null) {',
        message: `Se comparan Exp(p)=${A[p].exponent} y Exp(q)=${B[q].exponent}.`,
        pIndex: p,
        qIndex: q,
        phase: 'compare',
      }));
      if (A[p].exponent === B[q].exponent) {
        const sum = A[p].coefficient + B[q].coefficient;
        frames.push(
          frame({ nextC: result, codeNeedle: 'if (p.exponent == q.exponent) {', message: 'Los exponentes son iguales; ambos términos serán considerados.', pIndex: p, qIndex: q, phase: 'equal' }),
          frame({ nextC: result, codeNeedle: 'int coefficient = p.coefficient + q.coefficient;', message: `${A[p].coefficient} + ${B[q].coefficient} = ${sum}.`, pIndex: p, qIndex: q, extras: [{ name: 'coefficient', value: sum, role: 'value' }] }),
        );
        if (sum !== 0) append({ coefficient: sum, exponent: A[p].exponent }, 'end.next = new Node(coefficient, p.exponent);', `C recibe ${sum}x^${A[p].exponent}.`, 'C');
        frames.push(
          frame({ nextC: result, codeNeedle: 'p = p.next;', message: 'p avanza porque su término ya fue considerado.', pIndex: p + 1, qIndex: q }),
          frame({ nextC: result, codeNeedle: 'q = q.next;', message: 'q también avanza.', pIndex: p + 1, qIndex: q + 1 }),
        );
        p++;
        q++;
      } else if (A[p].exponent > B[q].exponent) {
        frames.push(frame({ nextC: result, codeNeedle: '} else if (p.exponent > q.exponent) {', message: 'Exp(p) es mayor: se copia p y q espera.', pIndex: p, qIndex: q, phase: 'p-greater' }));
        append(A[p], 'end.next = new Node(p.coefficient, p.exponent);', `C recibe ${A[p].coefficient}x^${A[p].exponent}.`, 'A');
        frames.push(frame({ nextC: result, codeNeedle: 'p = p.next;', message: 'Sólo p avanza.', pIndex: p + 1, qIndex: q }));
        p++;
      } else {
        frames.push(frame({ nextC: result, codeNeedle: '} else {', message: 'Exp(q) es mayor: se copia q y p espera.', pIndex: p, qIndex: q, phase: 'q-greater' }));
        append(B[q], 'end.next = new Node(q.coefficient, q.exponent);', `C recibe ${B[q].coefficient}x^${B[q].exponent}.`, 'B');
        frames.push(frame({ nextC: result, codeNeedle: 'q = q.next;', message: 'Sólo q avanza.', pIndex: p, qIndex: q + 1 }));
        q++;
      }
    }
    while (p < A.length) {
      frames.push(frame({ nextC: result, codeNeedle: 'while (p != null) {', message: 'B terminó; se copian los términos restantes de A.', pIndex: p, qIndex: q, phase: 'remaining' }));
      append(A[p], 'end.next = new Node(p.coefficient, p.exponent);', `C recibe ${A[p].coefficient}x^${A[p].exponent}.`, 'A');
      frames.push(frame({ nextC: result, codeNeedle: 'p = p.next;', message: 'p avanza al siguiente término restante.', pIndex: p + 1, qIndex: q }));
      p++;
    }
    while (q < B.length) {
      frames.push(frame({ nextC: result, codeNeedle: 'while (q != null) {', message: 'A terminó; se copian los términos restantes de B.', pIndex: p, qIndex: q, phase: 'remaining' }));
      append(B[q], 'end.next = new Node(q.coefficient, q.exponent);', `C recibe ${B[q].coefficient}x^${B[q].exponent}.`, 'B');
      frames.push(frame({ nextC: result, codeNeedle: 'q = q.next;', message: 'q avanza al siguiente término restante.', pIndex: p, qIndex: q + 1 }));
      q++;
    }
    const finalMessage = `C = ${formatPolynomial(result)}.`;
    frames.push(
      frame({ nextC: result, codeNeedle: 'return dummy.next;', message: 'El método devuelve el primer nodo real de C.', pIndex: p, qIndex: q }),
      frame({ nextC: result, codeNeedle: 'C = add(A, B);', message: finalMessage, pIndex: p, qIndex: q, activePolynomial: 'C', completed: true }),
    );
    return finish(true, stateValues(A, B, result), finalMessage, frames);
  }

  if (actionId === 'poly-clear-result') {
    const updated = stateValues(A, B, []);
    const frames = [
      frame({ codeNeedle: 'void clearResult() {', message: 'Se limpiará únicamente el resultado C.', activePolynomial: 'C' }),
      frame({ nextC: [], codeNeedle: 'C = null;', message: 'C queda en null; A y B no cambian.', activePolynomial: 'C', completed: true }),
    ];
    return finish(true, updated, 'El resultado C quedó vacío.', frames);
  }

  return null;
}

function executeGeneralizedListOperation({ actionId, fields, values, edges }) {
  const before = structuredClone(values);
  const root = before[0] ?? null;
  const copiedEdges = edges.map(edge => [...edge]);
  const cloneValues = nextRoot => nextRoot ? [structuredClone(nextRoot)] : [];
  const frame = ({
    nextRoot = root,
    codeNeedle,
    message,
    activePaths = [],
    phase = 'idle',
    completed = false,
    extras = [],
  }) => ({
    values: cloneValues(nextRoot),
    edges: copiedEdges,
    position: 0,
    codeNeedle,
    message,
    delayMs: 650,
    completed,
    generalizedListState: { activePaths, phase },
    variables: [
      { name: 'ref raíz', value: nextRoot?.refs ?? 0, role: 'size' },
      { name: 'longitud nivel 1', value: nextRoot?.items?.length ?? 0, role: 'size' },
      { name: 'profundidad', value: generalizedListDepth(nextRoot), role: 'value' },
      ...extras,
    ],
  });
  const finish = (ok, updated, message, frames) => ({
    ok,
    values: updated,
    edges: copiedEdges,
    message,
    step: 0,
    frames,
  });

  if (actionId === 'glist-build') {
    let parsed;
    try {
      parsed = parseGeneralizedList(fields.value);
    } catch (error) {
      return finish(false, before, error.message, []);
    }
    const nextRoot = parsed.root;
    const frames = [
      frame({ nextRoot, codeNeedle: 'Node build(String text) {', message: `Comienza el análisis de ${parsed.source}.`, phase: 'build' }),
      frame({ nextRoot, codeNeedle: 'source = text;', message: 'source guarda la notación con paréntesis y comas.', phase: 'build', extras: [
        { name: 'source', value: parsed.source, role: 'input' },
      ] }),
      frame({ nextRoot, codeNeedle: 'position = 0;', message: 'El lector comienza en el primer carácter.', phase: 'build' }),
      frame({ nextRoot, codeNeedle: 'root = parseList();', message: 'parseList construirá el encabezamiento y sus elementos.', activePaths: ['root.header'], phase: 'build' }),
    ];
    parsed.events.forEach(event => {
      frames.push(frame({
        nextRoot,
        codeNeedle: event.codeNeedle,
        message: event.kind === 'encabezamiento'
          ? 'Se crea un nodo tag 2 con contador de referencias igual a 1.'
          : event.kind === 'átomo'
            ? `Se crea un nodo tag 0 que almacena el átomo ${event.value}.`
            : event.kind === 'sublista'
              ? 'Se crea un nodo tag 1 cuyo dlink apunta a una sublista.'
              : `${event.value} conecta el elemento dentro de su mismo nivel.`,
        activePaths: [event.path],
        phase: event.kind,
        extras: [
          { name: 'tag', value: event.kind === 'átomo' ? 0 : event.kind === 'sublista' ? 1 : event.kind === 'encabezamiento' ? 2 : 'link', role: 'value' },
        ],
      }));
    });
    frames.push(
      frame({ nextRoot, codeNeedle: 'if (position != source.length()) {', message: 'No queda contenido inesperado después del último paréntesis.', phase: 'validate', extras: [
        { name: 'condición', value: 'false', role: 'false' },
      ] }),
      frame({ nextRoot, codeNeedle: 'return root;', message: `A = ${generalizedListToString(nextRoot)} quedó construida.`, activePaths: ['root.header'], phase: 'complete', completed: true }),
    );
    return finish(true, [nextRoot], `A = ${generalizedListToString(nextRoot)} quedó construida.`, frames);
  }

  if (actionId === 'glist-head') {
    if (!root?.items?.length) return finish(false, before, 'La lista está vacía y no tiene Head.', []);
    const head = root.items[0];
    const result = generalizedItemToString(head);
    const frames = [
      frame({ codeNeedle: 'Node head() {', message: 'Head consulta el primer elemento del nivel 1.', activePaths: ['root.header'] }),
      frame({ codeNeedle: 'if (root == null || root.link == null) {', message: 'La raíz y su primer LINK existen; la condición es falsa.', activePaths: ['root.header'], extras: [
        { name: 'condición', value: 'false', role: 'false' },
      ] }),
      frame({ codeNeedle: 'return root.link;', message: `Head(A) = ${result}.`, activePaths: ['root.0'], phase: 'head', completed: true, extras: [
        { name: 'Head(A)', value: result, role: 'value' },
      ] }),
    ];
    return finish(true, before, `Head(A) = ${result}.`, frames);
  }

  if (actionId === 'glist-tail') {
    if (!root?.items?.length) return finish(false, before, 'La lista está vacía y no tiene Tail.', []);
    const tailItems = root.items.slice(1);
    const result = `(${tailItems.map(generalizedItemToString).join(',')})`;
    const activePaths = tailItems.map((_, index) => `root.${index + 1}`);
    const frames = [
      frame({ codeNeedle: 'Node tail() {', message: 'Tail comienza después del primer elemento.', activePaths: ['root.header'] }),
      frame({ codeNeedle: 'if (root == null || root.link == null) {', message: 'La lista contiene al menos un elemento.', activePaths: ['root.0'], extras: [
        { name: 'condición', value: 'false', role: 'false' },
      ] }),
      frame({ codeNeedle: 'return root.link.link;', message: `Tail(A) = ${result}.`, activePaths, phase: 'tail', completed: true, extras: [
        { name: 'Tail(A)', value: result, role: 'value' },
      ] }),
    ];
    return finish(true, before, `Tail(A) = ${result}.`, frames);
  }

  if (actionId === 'glist-length') {
    if (!root) return finish(false, before, 'Primero construye una lista generalizada.', []);
    let count = 0;
    const frames = [
      frame({ codeNeedle: 'int length() {', message: 'La longitud cuenta sólo los elementos del nivel 1.', activePaths: ['root.header'] }),
      frame({ codeNeedle: 'int count = 0;', message: 'count comienza en 0.', extras: [{ name: 'count', value: 0, role: 'size' }] }),
      frame({ codeNeedle: 'Node current = root == null ? null : root.link;', message: 'current apunta al primer elemento.', activePaths: root.items.length ? ['root.0'] : [] }),
    ];
    root.items.forEach((_, index) => {
      frames.push(
        frame({ codeNeedle: 'while (current != null) {', message: `current existe en la posición ${index}; el ciclo continúa.`, activePaths: [`root.${index}`], phase: 'length', extras: [
          { name: 'count', value: count, role: 'size' },
          { name: 'condición', value: 'true', role: 'true' },
        ] }),
        frame({ codeNeedle: 'count++;', message: `count aumenta a ${count + 1}.`, activePaths: [`root.${index}`], phase: 'length', extras: [
          { name: 'count', value: ++count, role: 'size' },
        ] }),
        frame({ codeNeedle: 'current = current.link;', message: 'current avanza por LINK dentro del mismo nivel.', activePaths: index + 1 < root.items.length ? [`root.${index + 1}`] : [], phase: 'length' }),
      );
    });
    frames.push(
      frame({ codeNeedle: 'while (current != null) {', message: 'current es null; el ciclo termina.', extras: [
        { name: 'condición', value: 'false', role: 'false' },
        { name: 'count', value: count, role: 'size' },
      ] }),
      frame({ codeNeedle: 'return count;', message: `Length(A) = ${count}.`, activePaths: root.items.map((_, index) => `root.${index}`), phase: 'complete', completed: true, extras: [
        { name: 'Length(A)', value: count, role: 'value' },
      ] }),
    );
    return finish(true, before, `Length(A) = ${count}.`, frames);
  }

  if (actionId === 'glist-depth') {
    if (!root) return finish(false, before, 'Primero construye una lista generalizada.', []);
    const frames = [
      frame({ codeNeedle: 'int depth() {', message: 'Depth buscará el mayor número de listas anidadas.', activePaths: ['root.header'] }),
      frame({ codeNeedle: 'if (root == null) {', message: 'root existe; la profundidad no es 0.', activePaths: ['root.header'], extras: [
        { name: 'condición', value: 'false', role: 'false' },
      ] }),
      frame({ codeNeedle: 'return depthOf(root);', message: 'Comienza la función recursiva desde el encabezamiento A.', activePaths: ['root.header'] }),
    ];
    const visit = (list, path, level) => {
      let maximum = 1;
      frames.push(
        frame({ codeNeedle: 'int depthOf(Node header) {', message: `Entra a depthOf en el nivel ${level}.`, activePaths: [`${path}.header`], phase: 'depth', extras: [
          { name: 'nivel', value: level, role: 'index' },
        ] }),
        frame({ codeNeedle: 'int maximum = 1;', message: 'Una lista aporta un par de paréntesis como mínimo.', activePaths: [`${path}.header`], extras: [
          { name: 'maximum', value: maximum, role: 'value' },
        ] }),
      );
      list.items.forEach((item, index) => {
        const itemPath = `${path}.${index}`;
        frames.push(
          frame({ codeNeedle: 'while (current != null) {', message: 'current apunta a otro elemento del nivel actual.', activePaths: [itemPath], phase: 'depth' }),
          frame({ codeNeedle: 'if (current.tag == SUBLIST) {', message: item.kind === 'sublist'
            ? 'tag es 1: se debe entrar recursivamente por dlink.'
            : 'tag es 0: el elemento es un átomo.', activePaths: [itemPath], phase: 'depth', extras: [
            { name: 'tag', value: item.kind === 'sublist' ? 1 : 0, role: 'value' },
            { name: 'condición', value: String(item.kind === 'sublist'), role: item.kind === 'sublist' ? 'true' : 'false' },
          ] }),
        );
        if (item.kind === 'sublist') {
          const childDepth = visit(item.list, `${itemPath}.list`, level + 1);
          maximum = Math.max(maximum, 1 + childDepth);
          frames.push(frame({
            codeNeedle: 'maximum = Math.max(maximum, 1 + depthOf(current.dlink));',
            message: `La sublista produce profundidad ${1 + childDepth}; maximum queda en ${maximum}.`,
            activePaths: [itemPath, `${itemPath}.list.header`],
            phase: 'depth',
            extras: [{ name: 'maximum', value: maximum, role: 'value' }],
          }));
        }
        frames.push(frame({ codeNeedle: 'current = current.link;', message: 'current avanza al siguiente elemento del mismo nivel.', activePaths: [itemPath], phase: 'depth' }));
      });
      frames.push(frame({ codeNeedle: 'return maximum;', message: `Este nivel devuelve ${maximum}.`, activePaths: [`${path}.header`], phase: 'depth', extras: [
        { name: 'return', value: maximum, role: 'value' },
      ] }));
      return maximum;
    };
    const depth = visit(root, 'root', 1);
    frames.push(frame({ codeNeedle: 'return depthOf(root);', message: `Depth(A) = ${depth}.`, activePaths: ['root.header'], phase: 'complete', completed: true, extras: [
      { name: 'Depth(A)', value: depth, role: 'value' },
    ] }));
    return finish(true, before, `Depth(A) = ${depth}.`, frames);
  }

  if (actionId === 'glist-share') {
    if (!root) return finish(false, before, 'Primero construye una lista generalizada.', []);
    if (root.refs >= 5) return finish(false, before, 'La demostración admite hasta cinco referencias externas.', []);
    const nextRoot = structuredClone(root);
    nextRoot.refs++;
    nextRoot.aliases = [...(nextRoot.aliases ?? ['A']), `R${nextRoot.refs}`];
    const frames = [
      frame({ codeNeedle: 'void shareRoot() {', message: 'Se creará otra referencia externa a la misma lista.', activePaths: ['root.header'], phase: 'reference' }),
      frame({ codeNeedle: 'if (root != null) {', message: 'root existe; el contador puede incrementarse.', activePaths: ['root.header'], extras: [
        { name: 'condición', value: 'true', role: 'true' },
      ] }),
      frame({ nextRoot, codeNeedle: 'root.ref++;', message: `El encabezamiento ahora registra ${nextRoot.refs} referencias.`, activePaths: ['root.header'], phase: 'reference', completed: true, extras: [
        { name: 'root.ref', value: nextRoot.refs, role: 'size' },
      ] }),
    ];
    return finish(true, [nextRoot], `La raíz ahora tiene ${nextRoot.refs} referencias compartidas.`, frames);
  }

  if (actionId === 'glist-release') {
    if (!root) return finish(false, before, 'La lista ya no tiene referencias.', []);
    const nextRoot = structuredClone(root);
    nextRoot.refs--;
    nextRoot.aliases = (nextRoot.aliases ?? ['A']).slice(0, Math.max(0, nextRoot.refs));
    const frames = [
      frame({ codeNeedle: 'void releaseRoot() {', message: 'Se eliminará una referencia externa, no necesariamente toda la lista.', activePaths: ['root.header'], phase: 'reference' }),
      frame({ codeNeedle: 'if (root == null) {', message: 'root existe; se puede disminuir su contador.', activePaths: ['root.header'], extras: [
        { name: 'condición', value: 'false', role: 'false' },
      ] }),
      frame({ nextRoot, codeNeedle: 'root.ref--;', message: `ref disminuye a ${nextRoot.refs}.`, activePaths: ['root.header'], phase: 'reference', extras: [
        { name: 'root.ref', value: nextRoot.refs, role: 'size' },
      ] }),
      frame({ nextRoot, codeNeedle: 'if (root.ref == 0) {', message: nextRoot.refs === 0
        ? 'El contador llegó a 0: ya no queda ningún acceso a la lista.'
        : 'Aún existen referencias; la estructura debe conservarse.', activePaths: ['root.header'], phase: 'reference', extras: [
        { name: 'condición', value: String(nextRoot.refs === 0), role: nextRoot.refs === 0 ? 'true' : 'false' },
      ] }),
    ];
    if (nextRoot.refs === 0) {
      frames.push(frame({ nextRoot: null, codeNeedle: 'root = null;', message: 'root queda en null y la lista puede liberarse de forma segura.', phase: 'complete', completed: true }));
      return finish(true, [], 'La última referencia fue liberada; la lista quedó vacía.', frames);
    }
    frames.at(-1).completed = true;
    return finish(true, [nextRoot], `Quedan ${nextRoot.refs} referencias; la lista se conserva.`, frames);
  }

  return null;
}

function executeDenseMatrixOperation({ actionId, fields, values, edges }) {
  const before = normalizeDenseMatrixValues(values);
  const copiedEdges = edges.map(edge => [...edge]);
  const parseInteger = raw => {
    if (raw === undefined || raw === null || String(raw).trim() === '') return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) ? parsed : null;
  };
  const row = parseInteger(fields.second);
  const column = parseInteger(fields.index);
  const value = parseInteger(fields.value);
  const rowIsValid = validDenseMatrixCoordinate(row);
  const columnIsValid = validDenseMatrixCoordinate(column);
  const valueIsValid = Number.isInteger(value);
  const positionOf = (currentRow = row, currentColumn = column) => (
    validDenseMatrixCoordinate(currentRow) && validDenseMatrixCoordinate(currentColumn)
      ? denseMatrixIndex(currentRow, currentColumn)
      : 0
  );
  const matrixVariables = (currentRow = row, currentColumn = column, extras = []) => [
    { name: 'fila', value: Number.isFinite(currentRow) ? currentRow : '—', role: 'index' },
    { name: 'columna', value: Number.isFinite(currentColumn) ? currentColumn : '—', role: 'index' },
    { name: 'índice lineal', value: validDenseMatrixCoordinate(currentRow) && validDenseMatrixCoordinate(currentColumn)
      ? `${currentRow} × ${DENSE_MATRIX_SIZE} + ${currentColumn} = ${positionOf(currentRow, currentColumn)}`
      : 'fuera de rango', role: 'position' },
    ...extras,
  ];
  const frame = (currentValues, codeNeedle, message, currentRow = row, currentColumn = column, extras = [], options = {}) => ({
    values: [...currentValues],
    edges: copiedEdges,
    position: positionOf(currentRow, currentColumn),
    codeNeedle,
    message,
    variables: matrixVariables(currentRow, currentColumn, extras),
    delayMs: 560,
    ...options,
  });
  const finish = (ok, updated, message, frames, position = 0) => ({
    ok,
    values: updated,
    edges: copiedEdges,
    message,
    step: position,
    frames,
  });
  const invalidPosition = () => finish(false, before, `La fila y la columna deben estar entre 0 y ${DENSE_MATRIX_SIZE - 1}.`, [], 0);
  const invalidRow = () => finish(false, before, `La fila debe estar entre 0 y ${DENSE_MATRIX_SIZE - 1}.`, [], 0);
  const invalidColumn = () => finish(false, before, `La columna debe estar entre 0 y ${DENSE_MATRIX_SIZE - 1}.`, [], 0);

  if (actionId === 'matrix-set') {
    if (!rowIsValid || !columnIsValid) return invalidPosition();
    if (!valueIsValid) return finish(false, before, 'Ingresa un valor entero para guardar.', [], 0);
    const after = [...before];
    const previous = after[positionOf()];
    after[positionOf()] = value;
    const frames = [
      frame(before, 'boolean set(int row, int column, int value) {', `Set recibe (${row}, ${column}) y el valor ${value}.`, row, column, [
        { name: 'valor', value, role: 'input' },
      ]),
      frame(before, 'if (!validPosition(row, column)) {', 'La posición pertenece a la matriz; la condición es falsa.', row, column, [
        { name: 'posición válida', value: 'true', role: 'true' },
      ]),
      frame(before, 'boolean validPosition(int row, int column) {', 'Se comprueban ambos índices antes de acceder al arreglo.', row, column),
      frame(before, 'return row >= 0 && row < SIZE', `fila = ${row} y columna = ${column} están dentro de 0..3.`, row, column, [
        { name: 'resultado', value: 'true', role: 'true' },
      ]),
      frame(after, 'values[row][column] = value;', `${previous} se reemplaza por ${value} en la celda (${row}, ${column}).`, row, column, [
        { name: 'valor anterior', value: previous, role: 'value' },
        { name: 'valor nuevo', value, role: 'input' },
      ]),
      frame(after, 'return true;', `Celda (${row}, ${column}) actualizada: ${previous} → ${value}.`, row, column, [], { completed: true }),
    ];
    return finish(true, after, `Celda (${row}, ${column}) actualizada: ${previous} → ${value}.`, frames, positionOf());
  }

  if (actionId === 'matrix-get') {
    if (!rowIsValid || !columnIsValid) return invalidPosition();
    const found = before[positionOf()];
    const frames = [
      frame(before, 'Integer get(int row, int column) {', `Get consulta la celda (${row}, ${column}).`),
      frame(before, 'if (!validPosition(row, column)) {', 'La posición es válida; no se retorna null.', row, column, [
        { name: 'posición válida', value: 'true', role: 'true' },
      ]),
      frame(before, 'boolean validPosition(int row, int column) {', 'Se validan la fila y la columna.', row, column),
      frame(before, 'return row >= 0 && row < SIZE', 'Los dos índices están dentro de la matriz.', row, column, [
        { name: 'resultado', value: 'true', role: 'true' },
      ]),
      frame(before, 'return values[row][column];', `values[${row}][${column}] contiene ${found}.`, row, column, [
        { name: 'retorno', value: found, role: 'value' },
      ], { completed: true }),
    ];
    return finish(true, before, `La celda (${row}, ${column}) contiene ${found}.`, frames, positionOf());
  }

  if (actionId === 'matrix-row') {
    if (!rowIsValid) return invalidRow();
    const result = [];
    const frames = [
      frame(before, 'int[] readRow(int row) {', `Comienza el recorrido horizontal de la fila ${row}.`, row, 0),
      frame(before, 'if (!validIndex(row)) {', `La fila ${row} es válida.`, row, 0, [
        { name: 'índice válido', value: 'true', role: 'true' },
      ]),
      frame(before, 'boolean validIndex(int index) {', 'Se comprueba el índice antes de recorrer.', row, 0),
      frame(before, 'return index >= 0 && index < SIZE;', `${row} está dentro de 0..3.`, row, 0, [
        { name: 'resultado', value: 'true', role: 'true' },
      ]),
      frame(before, 'int[] result = new int[SIZE];', 'Se crea un arreglo de cuatro posiciones para el resultado.', row, 0, [
        { name: 'result.length', value: DENSE_MATRIX_SIZE, role: 'size' },
      ]),
    ];
    for (let currentColumn = 0; currentColumn < DENSE_MATRIX_SIZE; currentColumn++) {
      result.push(before[denseMatrixIndex(row, currentColumn)]);
      frames.push(
        frame(before, 'for (int column = 0; column < SIZE; column++) {', `column vale ${currentColumn}; el ciclo continúa.`, row, currentColumn, [
          { name: 'condición', value: 'true', role: 'true' },
        ]),
        frame(before, 'result[column] = values[row][column];', `Copia ${result.at(-1)} desde (${row}, ${currentColumn}).`, row, currentColumn, [
          { name: 'resultado parcial', value: result.join(', '), role: 'value' },
        ]),
      );
    }
    frames.push(
      frame(before, 'for (int column = 0; column < SIZE; column++) {', 'column vale 4; la condición es falsa y el ciclo termina.', row, DENSE_MATRIX_SIZE - 1, [
        { name: 'column', value: DENSE_MATRIX_SIZE, role: 'index' },
        { name: 'condición', value: 'false', role: 'false' },
      ]),
      frame(before, 'return result;', `Fila obtenida: [${result.join(', ')}].`, row, DENSE_MATRIX_SIZE - 1, [
        { name: 'result', value: result.join(', '), role: 'value' },
      ], { completed: true }),
    );
    return finish(true, before, `Fila ${row}: ${result.join(' → ')}`, frames, denseMatrixIndex(row, DENSE_MATRIX_SIZE - 1));
  }

  if (actionId === 'matrix-column') {
    if (!columnIsValid) return invalidColumn();
    const result = [];
    const frames = [
      frame(before, 'int[] readColumn(int column) {', `Comienza el recorrido vertical de la columna ${column}.`, 0, column),
      frame(before, 'if (!validIndex(column)) {', `La columna ${column} es válida.`, 0, column, [
        { name: 'índice válido', value: 'true', role: 'true' },
      ]),
      frame(before, 'boolean validIndex(int index) {', 'Se comprueba el índice antes de recorrer.', 0, column),
      frame(before, 'return index >= 0 && index < SIZE;', `${column} está dentro de 0..3.`, 0, column, [
        { name: 'resultado', value: 'true', role: 'true' },
      ]),
      frame(before, 'int[] result = new int[SIZE];', 'Se crea el arreglo que recibirá la columna.', 0, column, [
        { name: 'result.length', value: DENSE_MATRIX_SIZE, role: 'size' },
      ]),
    ];
    for (let currentRow = 0; currentRow < DENSE_MATRIX_SIZE; currentRow++) {
      result.push(before[denseMatrixIndex(currentRow, column)]);
      frames.push(
        frame(before, 'for (int row = 0; row < SIZE; row++) {', `row vale ${currentRow}; el ciclo continúa.`, currentRow, column, [
          { name: 'condición', value: 'true', role: 'true' },
        ]),
        frame(before, 'result[row] = values[row][column];', `Copia ${result.at(-1)} desde (${currentRow}, ${column}).`, currentRow, column, [
          { name: 'resultado parcial', value: result.join(', '), role: 'value' },
        ]),
      );
    }
    frames.push(
      frame(before, 'for (int row = 0; row < SIZE; row++) {', 'row vale 4; la condición es falsa y el ciclo termina.', DENSE_MATRIX_SIZE - 1, column, [
        { name: 'row', value: DENSE_MATRIX_SIZE, role: 'index' },
        { name: 'condición', value: 'false', role: 'false' },
      ]),
      frame(before, 'return result;', `Columna obtenida: [${result.join(', ')}].`, DENSE_MATRIX_SIZE - 1, column, [
        { name: 'result', value: result.join(', '), role: 'value' },
      ], { completed: true }),
    );
    return finish(true, before, `Columna ${column}: ${result.join(' → ')}`, frames, denseMatrixIndex(DENSE_MATRIX_SIZE - 1, column));
  }

  if (actionId === 'matrix-transpose') {
    const working = [...before];
    const frames = [
      frame(working, 'void transpose() {', 'La transposición intercambiará cada celda sobre la diagonal con su reflejo.', 0, 0),
    ];
    for (let currentRow = 0; currentRow < DENSE_MATRIX_SIZE; currentRow++) {
      frames.push(frame(working, 'for (int row = 0; row < SIZE; row++) {', `row vale ${currentRow}.`, currentRow, currentRow, [
        { name: 'row', value: currentRow, role: 'index' },
      ]));
      for (let currentColumn = currentRow + 1; currentColumn < DENSE_MATRIX_SIZE; currentColumn++) {
        const firstIndex = denseMatrixIndex(currentRow, currentColumn);
        const secondIndex = denseMatrixIndex(currentColumn, currentRow);
        const temporary = working[firstIndex];
        frames.push(
          frame(working, 'for (int column = row + 1; column < SIZE; column++) {', `Se intercambiarán (${currentRow}, ${currentColumn}) y (${currentColumn}, ${currentRow}).`, currentRow, currentColumn),
          frame(working, 'int temporary = values[row][column];', `${temporary} se guarda en temporary.`, currentRow, currentColumn, [
            { name: 'temporary', value: temporary, role: 'value' },
          ]),
        );
        working[firstIndex] = working[secondIndex];
        frames.push(frame(working, 'values[row][column] = values[column][row];', `${working[firstIndex]} pasa a (${currentRow}, ${currentColumn}).`, currentRow, currentColumn, [
          { name: 'temporary', value: temporary, role: 'value' },
        ]));
        working[secondIndex] = temporary;
        frames.push(frame(working, 'values[column][row] = temporary;', `${temporary} pasa a (${currentColumn}, ${currentRow}); el intercambio termina.`, currentColumn, currentRow, [
          { name: 'temporary', value: temporary, role: 'value' },
        ]));
      }
    }
    frames.at(-1).completed = true;
    frames.at(-1).message = 'La matriz transpuesta está completa.';
    return finish(true, working, 'La matriz fue transpuesta sobre su diagonal principal.', frames, frames.at(-1).position);
  }

  if (actionId === 'matrix-fill' || actionId === 'matrix-clear') {
    const fillValue = actionId === 'matrix-clear' ? 0 : value;
    if (!Number.isInteger(fillValue)) return finish(false, before, 'Ingresa un valor entero para rellenar.', [], 0);
    const working = [...before];
    const frames = actionId === 'matrix-clear'
      ? [
          frame(working, 'void clear() {', 'Limpiar delega el trabajo al método fill.', 0, 0),
          frame(working, 'fill(0);', 'Se llama a fill con el valor 0.', 0, 0, [
            { name: 'value', value: 0, role: 'input' },
          ]),
          frame(working, 'void fill(int value) {', 'Entra al método que recorrerá todas las celdas.', 0, 0),
        ]
      : [frame(working, 'void fill(int value) {', `Fill recorrerá la matriz usando el valor ${fillValue}.`, 0, 0, [
          { name: 'value', value: fillValue, role: 'input' },
        ])];
    for (let currentRow = 0; currentRow < DENSE_MATRIX_SIZE; currentRow++) {
      frames.push(frame(working, 'for (int row = 0; row < SIZE; row++) {', `Comienza la fila ${currentRow}.`, currentRow, 0));
      for (let currentColumn = 0; currentColumn < DENSE_MATRIX_SIZE; currentColumn++) {
        frames.push(frame(working, 'for (int column = 0; column < SIZE; column++) {', `Se visita (${currentRow}, ${currentColumn}).`, currentRow, currentColumn));
        working[denseMatrixIndex(currentRow, currentColumn)] = fillValue;
        frames.push(frame(working, 'values[row][column] = value;', `La celda (${currentRow}, ${currentColumn}) recibe ${fillValue}.`, currentRow, currentColumn, [
          { name: 'value', value: fillValue, role: 'input' },
        ]));
      }
    }
    frames.at(-1).completed = true;
    const message = actionId === 'matrix-clear'
      ? 'La matriz quedó limpia: todas sus celdas contienen 0.'
      : `Todas las celdas ahora contienen ${fillValue}.`;
    frames.at(-1).message = message;
    return finish(true, working, message, frames, DENSE_MATRIX_CELL_COUNT - 1);
  }

  return null;
}

const sparseCellKey = cell => `${cell.row}:${cell.column}`;
const sparseCellLabel = cell => cell ? `(${cell.row}, ${cell.column}) = ${cell.value}` : 'cabecera';
const sortSparseCells = cells => [...cells]
  .map(cell => ({ value: Number(cell.value), row: Number(cell.row), column: Number(cell.column) }))
  .sort((first, second) => first.row - second.row || first.column - second.column);

function sparseVariables({ row, column, value, previousRow, currentRow, previousColumn, currentColumn, count }) {
  const variables = [
    { name: 'fila', value: row, role: 'input' },
    { name: 'columna', value: column, role: 'input' },
  ];
  if (value !== undefined) variables.push({ name: 'valor', value, role: 'input' });
  if (previousRow !== undefined) variables.push({ name: 'anteriorFila', value: previousRow, role: 'position' });
  if (currentRow !== undefined) variables.push({ name: 'actualFila', value: currentRow, role: 'value' });
  if (previousColumn !== undefined) variables.push({ name: 'anteriorCol', value: previousColumn, role: 'position' });
  if (currentColumn !== undefined) variables.push({ name: 'actualCol', value: currentColumn, role: 'value' });
  variables.push({ name: 'noCeros', value: count, role: 'size' });
  return variables;
}

function executeSparseMatrixOperation({ actionId, fields, values, edges }) {
  const before = sortSparseCells(values);
  const row = Number(fields.second);
  const column = Number(fields.index);
  const value = Number(fields.value);
  const validRow = Number.isInteger(row) && row >= 0 && row < SPARSE_MATRIX_ROWS;
  const validColumn = Number.isInteger(column) && column >= 0 && column < SPARSE_MATRIX_COLUMNS;
  const key = `${row}:${column}`;
  const positionOf = (cells, requestedKey = key) => Math.max(0, cells.findIndex(cell => sparseCellKey(cell) === requestedKey));
  const makeFrame = ({
    cells = before,
    message,
    codeNeedle,
    phase,
    activeCell = null,
    extraState = {},
    variables = sparseVariables({ row, column, value, count: cells.length }),
    completed = false,
    failed = false,
  }) => ({
    values: sortSparseCells(cells),
    edges,
    position: activeCell ? positionOf(cells, sparseCellKey(activeCell)) : 0,
    codeLine: 0,
    codeNeedle,
    message,
    delayMs: completed ? 650 : 560,
    completed,
    failed,
    variables,
    sparseState: {
      phase,
      activeRow: validRow ? row : null,
      activeColumn: validColumn ? column : null,
      activeCellKey: activeCell ? sparseCellKey(activeCell) : null,
      ...extraState,
    },
  });
  const fail = (message, codeNeedle = null, frames = []) => ({
    ok: false,
    values: before,
    edges,
    message,
    step: 0,
    frames: [...frames, makeFrame({
      message,
      codeNeedle,
      phase: 'error',
      failed: true,
      variables: sparseVariables({
        row: Number.isFinite(row) ? row : '—',
        column: Number.isFinite(column) ? column : '—',
        value: Number.isFinite(value) ? value : undefined,
        count: before.length,
      }),
    })],
  });
  const finishNeedle = (activeCell, resultCount) => actionId === 'matrix-insert'
    ? resultCount > before.length
      ? 'nonZeroCount++;'
      : activeCell
        ? 'currentRow.value = value;'
        : 'return;'
    : actionId === 'matrix-remove'
      ? 'return true;'
      : actionId === 'matrix-clear'
        ? 'nonZeroCount = 0;'
        : actionId === 'matrix-get'
          ? activeCell ? 'return current.value;' : 'return 0;'
          : actionId === 'matrix-row'
            ? 'current = current.left;'
            : 'current = current.up;';
  const done = (cells, message, frames, activeCell = null) => {
    const updated = sortSparseCells(cells);
    return {
      ok: true,
      values: updated,
      edges,
      message,
      step: activeCell ? positionOf(updated, sparseCellKey(activeCell)) : 0,
      frames: [...frames, makeFrame({
        cells: updated,
        message,
        codeNeedle: finishNeedle(activeCell, updated.length),
        phase: 'completed',
        activeCell,
        completed: true,
        variables: sparseVariables({
          row: validRow ? row : '—',
          column: validColumn ? column : '—',
          value: Number.isFinite(value) ? value : undefined,
          currentRow: activeCell ? sparseCellLabel(activeCell) : undefined,
          currentColumn: activeCell ? sparseCellLabel(activeCell) : undefined,
          count: updated.length,
        }),
      })],
    };
  };

  if (actionId === 'matrix-clear') {
    if (!before.length) return done([], 'La matriz ya estaba vacía.', [], null);
    const frames = [
      makeFrame({
        message: 'Cada cabecera AROW vuelve a apuntarse a sí misma.',
        codeNeedle: 'AROW[row].left = AROW[row];',
        phase: 'clear-rows',
        extraState: { clearedRows: true },
        variables: [{ name: 'fila', value: `0…${SPARSE_MATRIX_ROWS - 1}`, role: 'index' }, { name: 'noCeros', value: before.length, role: 'size' }],
      }),
      makeFrame({
        message: 'Cada cabecera ACOL vuelve a apuntarse a sí misma.',
        codeNeedle: 'ACOL[column].up = ACOL[column];',
        phase: 'clear-columns',
        extraState: { clearedRows: true, clearedColumns: true },
        variables: [{ name: 'columna', value: `0…${SPARSE_MATRIX_COLUMNS - 1}`, role: 'index' }, { name: 'noCeros', value: before.length, role: 'size' }],
      }),
    ];
    return done([], 'La matriz quedó vacía y todas sus cabeceras siguen siendo circulares.', frames, null);
  }

  if (actionId === 'matrix-row') {
    if (!validRow) return fail(`La fila debe estar entre 0 y ${SPARSE_MATRIX_ROWS - 1}.`, 'if (row < 0 || row >= rowCount)');
    const rowCells = before.filter(cell => cell.row === row).sort((a, b) => b.column - a.column);
    const frames = [makeFrame({
      message: `El recorrido comienza en la cabecera AROW[${row}].`,
      codeNeedle: 'Node current = rowHeader.left;',
      phase: 'row-header',
      variables: sparseVariables({ row, column: '—', count: before.length }),
    })];
    rowCells.forEach((cell, index) => frames.push(makeFrame({
      message: `left visita ${sparseCellLabel(cell)} de derecha a izquierda; nodo ${index + 1} de ${rowCells.length}.`,
      codeNeedle: 'current = current.left;',
      phase: 'row-scan',
      activeCell: cell,
      extraState: { visitedRowKeys: rowCells.slice(0, index + 1).map(sparseCellKey) },
      variables: sparseVariables({ row, column: cell.column, currentRow: sparseCellLabel(cell), count: before.length }),
    })));
    return done(
      before,
      rowCells.length
        ? `AROW[${row}]: ${rowCells.map(cell => cell.value).join(' ← ')} y vuelve a su cabecera.`
        : `AROW[${row}] no contiene datos y se apunta a sí misma.`,
      frames,
      rowCells.at(-1) ?? null,
    );
  }

  if (actionId === 'matrix-column') {
    if (!validColumn) return fail(`La columna debe estar entre 0 y ${SPARSE_MATRIX_COLUMNS - 1}.`, 'if (column < 0 || column >= columnCount)');
    const columnCells = before.filter(cell => cell.column === column).sort((a, b) => b.row - a.row);
    const frames = [makeFrame({
      message: `El recorrido comienza en la cabecera ACOL[${column}].`,
      codeNeedle: 'Node current = columnHeader.up;',
      phase: 'column-header',
      variables: sparseVariables({ row: '—', column, count: before.length }),
    })];
    columnCells.forEach((cell, index) => frames.push(makeFrame({
      message: `up visita ${sparseCellLabel(cell)} de abajo hacia arriba; nodo ${index + 1} de ${columnCells.length}.`,
      codeNeedle: 'current = current.up;',
      phase: 'column-scan',
      activeCell: cell,
      extraState: { visitedColumnKeys: columnCells.slice(0, index + 1).map(sparseCellKey) },
      variables: sparseVariables({ row: cell.row, column, currentColumn: sparseCellLabel(cell), count: before.length }),
    })));
    return done(
      before,
      columnCells.length
        ? `ACOL[${column}]: ${columnCells.map(cell => cell.value).join(' ↑ ')} y vuelve a su cabecera.`
        : `ACOL[${column}] no contiene datos y se apunta a sí misma.`,
      frames,
      columnCells.at(-1) ?? null,
    );
  }

  if (!validRow || !validColumn) {
    return fail(`Usa una fila entre 0 y ${SPARSE_MATRIX_ROWS - 1} y una columna entre 0 y ${SPARSE_MATRIX_COLUMNS - 1}.`, 'validatePosition(row, column);');
  }

  const rowCells = before.filter(cell => cell.row === row).sort((a, b) => b.column - a.column);
  const rowVisits = rowCells.filter(cell => cell.column > column);
  const existing = before.find(cell => sparseCellKey(cell) === key) ?? null;
  const baseFrames = [makeFrame({
    message: `La posición (${row}, ${column}) está dentro de la matriz ${SPARSE_MATRIX_ROWS} × ${SPARSE_MATRIX_COLUMNS}.`,
    codeNeedle: 'validatePosition(row, column);',
    phase: 'validate',
    variables: sparseVariables({ row, column, value: Number.isFinite(value) ? value : undefined, count: before.length }),
  })];
  rowVisits.forEach((cell, index) => baseFrames.push(makeFrame({
    message: `Se avanza por AROW[${row}] hasta ${sparseCellLabel(cell)}.`,
    codeNeedle: actionId === 'matrix-remove'
      ? 'target = target.left;'
      : actionId === 'matrix-get'
        ? 'current = current.left;'
        : 'currentRow = currentRow.left;',
    phase: 'search-row',
    activeCell: cell,
    extraState: { visitedRowKeys: rowVisits.slice(0, index + 1).map(sparseCellKey) },
    variables: sparseVariables({
      row,
      column,
      value: Number.isFinite(value) ? value : undefined,
      previousRow: index === 0 ? `AROW[${row}]` : sparseCellLabel(rowVisits[index - 1]),
      currentRow: sparseCellLabel(cell),
      count: before.length,
    }),
  })));

  if (actionId === 'matrix-get') {
    if (!existing) {
      const frames = [...baseFrames, makeFrame({
        message: `No existe un nodo en (${row}, ${column}); su valor implícito es 0.`,
        codeNeedle: 'return 0;',
        phase: 'not-found',
        variables: sparseVariables({ row, column, count: before.length }),
      })];
      return done(before, `La posición (${row}, ${column}) contiene 0 porque no necesita un nodo.`, frames, null);
    }
    return done(before, `La posición (${row}, ${column}) contiene ${existing.value}.`, baseFrames, existing);
  }

  if (actionId === 'matrix-remove') {
    if (!existing) return fail(`No existe un nodo en (${row}, ${column}).`, 'return false;', baseFrames);
    const previousRowCell = rowCells.filter(cell => cell.column > column).at(-1) ?? null;
    const columnCells = before.filter(cell => cell.column === column).sort((a, b) => b.row - a.row);
    const columnVisits = columnCells.filter(cell => cell.row > row);
    const after = before.filter(cell => sparseCellKey(cell) !== key);
    const frames = [...baseFrames, makeFrame({
      message: `Se desconecta ${sparseCellLabel(existing)} de AROW[${row}].`,
      codeNeedle: 'previousRow.left = target.left;',
      phase: 'detach-row',
      activeCell: existing,
      extraState: { detachedRowKey: key },
      variables: sparseVariables({
        row,
        column,
        previousRow: previousRowCell ? sparseCellLabel(previousRowCell) : `AROW[${row}]`,
        currentRow: sparseCellLabel(existing),
        count: before.length,
      }),
    })];
    columnVisits.forEach((cell, index) => frames.push(makeFrame({
      message: 'Se localiza el mismo nodo en ACOL avanzando hacia arriba.',
      codeNeedle: 'currentColumn = currentColumn.up;',
      phase: 'search-column',
      activeCell: cell,
      extraState: { detachedRowKey: key, visitedColumnKeys: columnVisits.slice(0, index + 1).map(sparseCellKey) },
      variables: sparseVariables({
        row,
        column,
        previousColumn: index === 0 ? `ACOL[${column}]` : sparseCellLabel(columnVisits[index - 1]),
        currentColumn: sparseCellLabel(cell),
        count: before.length,
      }),
    })));
    frames.push(makeFrame({
      cells: after,
      message: `Se desconecta el nodo de ACOL[${column}]; ya no queda en ninguna lista.`,
      codeNeedle: 'previousColumn.up = target.up;',
      phase: 'detach-column',
      extraState: { removedCellKey: key },
      variables: sparseVariables({ row, column, count: after.length }),
    }));
    return done(after, `${existing.value} fue eliminado de (${row}, ${column}) en AROW y ACOL.`, frames, null);
  }

  if (actionId === 'matrix-insert') {
    if (!Number.isInteger(value)) return fail('El valor debe ser un número entero.', 'public void insert(int value, int row, int column)');
    if (value === 0) {
      if (!existing) return done(before, `La posición (${row}, ${column}) ya representa cero.`, baseFrames, null);
      const after = before.filter(cell => sparseCellKey(cell) !== key);
      const frames = [...baseFrames, makeFrame({
        cells: after,
        message: `Como el valor es 0, remove desconecta ${sparseCellLabel(existing)} de AROW y ACOL.`,
        codeNeedle: 'remove(row, column);',
        phase: 'detach-both',
        extraState: { removedCellKey: key },
        variables: sparseVariables({ row, column, value, count: after.length }),
      })];
      return done(after, `La posición (${row}, ${column}) volvió a ser cero y dejó de necesitar un nodo.`, frames, null);
    }
    if (existing) {
      const after = before.map(cell => sparseCellKey(cell) === key ? { ...cell, value } : cell);
      const updated = after.find(cell => sparseCellKey(cell) === key);
      const frames = [...baseFrames, makeFrame({
        cells: after,
        message: `La posición ya existe: se actualiza ${existing.value} por ${value} sin crear otro nodo.`,
        codeNeedle: 'currentRow.value = value;',
        phase: 'update',
        activeCell: updated,
        variables: sparseVariables({ row, column, value, currentRow: sparseCellLabel(updated), count: before.length }),
      })];
      return done(after, `La posición (${row}, ${column}) fue actualizada a ${value}; no se duplicó el nodo.`, frames, updated);
    }

    const previousRowCell = rowCells.filter(cell => cell.column > column).at(-1) ?? null;
    const nextRowCell = rowCells.find(cell => cell.column < column) ?? null;
    const columnCells = before.filter(cell => cell.column === column).sort((a, b) => b.row - a.row);
    const columnVisits = columnCells.filter(cell => cell.row > row);
    const previousColumnCell = columnVisits.at(-1) ?? null;
    const nextColumnCell = columnCells.find(cell => cell.row < row) ?? null;
    const newCell = { value, row, column };
    const after = sortSparseCells([...before, newCell]);
    const frames = [...baseFrames];
    columnVisits.forEach((cell, index) => frames.push(makeFrame({
      message: `Se avanza por ACOL[${column}] hasta ${sparseCellLabel(cell)}.`,
      codeNeedle: 'currentColumn = currentColumn.up;',
      phase: 'search-column',
      activeCell: cell,
      extraState: { visitedColumnKeys: columnVisits.slice(0, index + 1).map(sparseCellKey) },
      variables: sparseVariables({
        row,
        column,
        value,
        previousColumn: index === 0 ? `ACOL[${column}]` : sparseCellLabel(columnVisits[index - 1]),
        currentColumn: sparseCellLabel(cell),
        count: before.length,
      }),
    })));
    frames.push(
      makeFrame({
        message: `Se crea un único nodo ${sparseCellLabel(newCell)}.`,
        codeNeedle: 'Node newNode = new Node(value, row, column);',
        phase: 'create',
        extraState: { pendingNode: newCell },
        variables: sparseVariables({
          row,
          column,
          value,
          previousRow: previousRowCell ? sparseCellLabel(previousRowCell) : `AROW[${row}]`,
          currentRow: nextRowCell ? sparseCellLabel(nextRowCell) : `AROW[${row}]`,
          previousColumn: previousColumnCell ? sparseCellLabel(previousColumnCell) : `ACOL[${column}]`,
          currentColumn: nextColumnCell ? sparseCellLabel(nextColumnCell) : `ACOL[${column}]`,
          count: before.length,
        }),
      }),
      makeFrame({
        cells: after,
        message: `left incluye el nuevo nodo en AROW[${row}] y conserva el recorrido de derecha a izquierda.`,
        codeNeedle: 'previousRow.left = newNode;',
        phase: 'link-row',
        activeCell: newCell,
        extraState: { linkedRowKey: key, pendingColumnKey: key },
        variables: sparseVariables({ row, column, value, currentRow: sparseCellLabel(newCell), count: after.length }),
      }),
      makeFrame({
        cells: after,
        message: `up incluye el mismo nodo en ACOL[${column}] y conserva el recorrido de abajo hacia arriba.`,
        codeNeedle: 'previousColumn.up = newNode;',
        phase: 'link-column',
        activeCell: newCell,
        extraState: { linkedRowKey: key, linkedColumnKey: key },
        variables: sparseVariables({ row, column, value, currentColumn: sparseCellLabel(newCell), count: after.length }),
      }),
    );
    return done(after, `${value} fue insertado en (${row}, ${column}) usando un nodo compartido por AROW y ACOL.`, frames, newCell);
  }

  return fail('La operación de matriz todavía no está disponible.');
}

function sortFrameVariables(values, variables = {}) {
  const roleFor = name => {
    if (['low', 'high', 'left', 'middle', 'right', 'current', 'smaller', 'i', 'j', 'k', 'index'].includes(name)) return 'index';
    if (name === 'condición') return variables[name] ? 'true' : 'false';
    if (name === 'pivot') return 'input';
    return 'value';
  };
  return [
    { name: 'size', value: values.length, role: 'size' },
    ...Object.entries(variables)
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => ({
        name,
        value: name === 'condición' ? (value ? 'true' : 'false') : value,
        role: roleFor(name),
      })),
  ];
}

function executeQuickSort(values, edges) {
  const working = [...values];
  const frames = [];
  const fixed = new Set();
  const addFrame = ({
    codeNeedle,
    message,
    phase,
    position = 0,
    range = null,
    pivotIndex = null,
    compareIndex = null,
    swapPositions = [],
    variables = {},
    completed = false,
    delayMs = 330,
  }) => {
    frames.push({
      values: [...working],
      position: Math.max(0, Math.min(Math.max(0, working.length - 1), position)),
      codeNeedle,
      message,
      sortPhase: phase,
      sortRange: range,
      sortPivotIndex: pivotIndex,
      sortCompareIndex: compareIndex,
      sortSwapPositions: swapPositions,
      sortFixedPositions: [...fixed],
      variables: sortFrameVariables(working, variables),
      delayMs,
      completed,
    });
  };

  addFrame({
    codeNeedle: 'void sort() {',
    message: 'Quick Sort prepara la llamada recursiva sobre todo el arreglo.',
    phase: 'quick-start',
    range: working.length ? [0, working.length - 1] : null,
  });
  addFrame({
    codeNeedle: 'quickSort(0, size - 1);',
    message: `Se ordenará el rango completo [0..${Math.max(0, working.length - 1)}].`,
    phase: 'quick-call',
    range: working.length ? [0, working.length - 1] : null,
    variables: { low: 0, high: working.length - 1 },
  });

  const swapValues = (first, second, callNeedle, message, range, pivotIndex, variables) => {
    addFrame({
      codeNeedle: callNeedle,
      message,
      phase: 'quick-swap-call',
      position: second,
      range,
      pivotIndex,
      swapPositions: [first, second],
      variables,
    });
    if (first === second) {
      addFrame({
        codeNeedle: 'int temporary = values[first];',
        message: `Se guarda temporalmente ${working[first]}, aunque ambos índices sean ${first}.`,
        phase: 'quick-swap-save',
        position: first,
        range,
        pivotIndex,
        swapPositions: [first],
        variables,
      });
      addFrame({
        codeNeedle: 'values[first] = values[second];',
        message: `values[${first}] recibe el mismo valor porque first y second coinciden.`,
        phase: 'quick-swap-first',
        position: first,
        range,
        pivotIndex,
        swapPositions: [first],
        variables,
      });
      addFrame({
        codeNeedle: 'values[second] = temporary;',
        message: `El temporal vuelve a values[${second}]; el intercambio termina sin alterar el arreglo.`,
        phase: 'quick-swap-complete',
        position: first,
        range,
        pivotIndex,
        swapPositions: [first],
        variables,
      });
      return;
    }
    const temporary = working[first];
    addFrame({
      codeNeedle: 'int temporary = values[first];',
      message: `Se guarda temporalmente ${temporary}, ubicado en el índice ${first}.`,
      phase: 'quick-swap-save',
      position: first,
      range,
      pivotIndex,
      swapPositions: [first, second],
      variables,
    });
    working[first] = working[second];
    addFrame({
      codeNeedle: 'values[first] = values[second];',
      message: `${working[first]} pasa al índice ${first}.`,
      phase: 'quick-swap-first',
      position: first,
      range,
      pivotIndex,
      swapPositions: [first, second],
      variables,
    });
    working[second] = temporary;
    addFrame({
      codeNeedle: 'values[second] = temporary;',
      message: `${temporary} pasa al índice ${second}; el intercambio termina.`,
      phase: 'quick-swap-complete',
      position: second,
      range,
      pivotIndex,
      swapPositions: [first, second],
      variables,
    });
  };

  const quickSort = (low, high, depth) => {
    addFrame({
      codeNeedle: 'void quickSort(int low, int high) {',
      message: `Llamada quickSort(${low}, ${high}) en profundidad ${depth}.`,
      phase: 'quick-recursion',
      position: Math.max(0, low),
      range: low <= high ? [low, high] : null,
      variables: { low, high, depth },
    });
    const baseCase = low >= high;
    addFrame({
      codeNeedle: 'if (low >= high) {',
      message: baseCase
        ? 'El rango tiene cero o un elemento: ya está ordenado.'
        : 'El rango contiene varios elementos y debe particionarse.',
      phase: 'quick-base',
      position: Math.max(0, low),
      range: low <= high ? [low, high] : null,
      variables: { low, high, depth, condición: baseCase },
    });
    if (baseCase) {
      if (low === high && low >= 0 && low < working.length) fixed.add(low);
      addFrame({
        codeNeedle: 'return;',
        message: `La llamada quickSort(${low}, ${high}) regresa.`,
        phase: 'quick-return',
        position: Math.max(0, low),
        range: low === high ? [low, high] : null,
        variables: { low, high, depth },
      });
      return;
    }

    addFrame({
      codeNeedle: 'int pivotIndex = partition(low, high);',
      message: `Se particiona [${low}..${high}] usando inicialmente el último elemento como pivote.`,
      phase: 'partition-call',
      position: high,
      range: [low, high],
      pivotIndex: high,
      variables: { low, high, depth },
    });
    addFrame({
      codeNeedle: 'int partition(int low, int high) {',
      message: `Comienza partition(${low}, ${high}).`,
      phase: 'partition-start',
      position: high,
      range: [low, high],
      pivotIndex: high,
      variables: { low, high, depth },
    });

    const pivot = working[high];
    let smaller = low - 1;
    addFrame({
      codeNeedle: 'int pivot = values[high];',
      message: `${pivot} es el pivote porque está en el extremo derecho del rango.`,
      phase: 'pivot-selected',
      position: high,
      range: [low, high],
      pivotIndex: high,
      variables: { low, high, pivot, smaller, depth },
    });
    addFrame({
      codeNeedle: 'int smaller = low - 1;',
      message: `smaller comienza en ${smaller}; todavía no hay valores menores o iguales al pivote.`,
      phase: 'partition-boundary',
      position: low,
      range: [low, high],
      pivotIndex: high,
      variables: { low, high, pivot, smaller, depth },
    });

    for (let current = low; current < high; current++) {
      addFrame({
        codeNeedle: 'for (int current = low; current < high; current++) {',
        message: `current visita el índice ${current}.`,
        phase: 'partition-loop',
        position: current,
        range: [low, high],
        pivotIndex: high,
        compareIndex: current,
        variables: { low, high, pivot, smaller, current, condición: true, depth },
      });
      const goesLeft = Number(working[current]) <= Number(pivot);
      addFrame({
        codeNeedle: 'if (values[current] <= pivot) {',
        message: goesLeft
          ? `${working[current]} ≤ ${pivot}: debe quedar a la izquierda del pivote.`
          : `${working[current]} > ${pivot}: permanece en la zona derecha.`,
        phase: 'partition-compare',
        position: current,
        range: [low, high],
        pivotIndex: high,
        compareIndex: current,
        variables: { low, high, pivot, smaller, current, condición: goesLeft, depth },
      });
      if (!goesLeft) continue;

      smaller++;
      addFrame({
        codeNeedle: 'smaller++;',
        message: `La frontera de valores pequeños avanza al índice ${smaller}.`,
        phase: 'partition-boundary',
        position: smaller,
        range: [low, high],
        pivotIndex: high,
        compareIndex: current,
        variables: { low, high, pivot, smaller, current, depth },
      });
      swapValues(
        smaller,
        current,
        'swap(smaller, current);',
        `Se intercambian los índices ${smaller} y ${current} para ampliar la zona menor o igual al pivote.`,
        [low, high],
        high,
        { low, high, pivot, smaller, current, depth },
      );
    }
    addFrame({
      codeNeedle: 'for (int current = low; current < high; current++) {',
      message: `current llegó a high (${high}); termina el recorrido de partición.`,
      phase: 'partition-loop-end',
      position: high,
      range: [low, high],
      pivotIndex: high,
      variables: { low, high, pivot, smaller, current: high, condición: false, depth },
    });

    const pivotTarget = smaller + 1;
    swapValues(
      pivotTarget,
      high,
      'swap(smaller + 1, high);',
      `El pivote ${pivot} se mueve a su posición definitiva, índice ${pivotTarget}.`,
      [low, high],
      high,
      { low, high, pivot, smaller, current: high, depth },
    );
    fixed.add(pivotTarget);
    addFrame({
      codeNeedle: 'return smaller + 1;',
      message: `partition devuelve ${pivotTarget}; el pivote ya no volverá a moverse.`,
      phase: 'pivot-fixed',
      position: pivotTarget,
      range: [low, high],
      pivotIndex: pivotTarget,
      variables: { low, high, pivot, smaller, pivotIndex: pivotTarget, depth },
    });

    addFrame({
      codeNeedle: 'quickSort(low, pivotIndex - 1);',
      message: `Se ordena recursivamente el lado izquierdo [${low}..${pivotTarget - 1}].`,
      phase: 'quick-left-call',
      position: low,
      range: low <= pivotTarget - 1 ? [low, pivotTarget - 1] : null,
      pivotIndex: pivotTarget,
      variables: { low, high, pivotIndex: pivotTarget, depth },
    });
    quickSort(low, pivotTarget - 1, depth + 1);

    addFrame({
      codeNeedle: 'quickSort(pivotIndex + 1, high);',
      message: `Se ordena recursivamente el lado derecho [${pivotTarget + 1}..${high}].`,
      phase: 'quick-right-call',
      position: Math.min(high, pivotTarget + 1),
      range: pivotTarget + 1 <= high ? [pivotTarget + 1, high] : null,
      pivotIndex: pivotTarget,
      variables: { low, high, pivotIndex: pivotTarget, depth },
    });
    quickSort(pivotTarget + 1, high, depth + 1);
  };

  quickSort(0, working.length - 1, 0);
  for (let index = 0; index < working.length; index++) fixed.add(index);
  const message = 'Quick Sort terminó: cada partición colocó su pivote y las llamadas recursivas ordenaron ambos lados.';
  addFrame({
    codeNeedle: 'quickSort(0, size - 1);',
    message,
    phase: 'quick-complete',
    position: 0,
    range: working.length ? [0, working.length - 1] : null,
    completed: true,
    delayMs: 450,
  });
  return { ok: true, values: working, edges, message, step: 0, frames };
}

function executeMergeSort(values, edges) {
  const working = [...values];
  const help = new Array(working.length);
  const frames = [];
  const addFrame = ({
    codeNeedle,
    message,
    phase,
    position = 0,
    range = null,
    leftRange = null,
    rightRange = null,
    comparePositions = [],
    writeIndex = null,
    variables = {},
    completed = false,
    delayMs = 330,
  }) => {
    frames.push({
      values: [...working],
      position: Math.max(0, Math.min(Math.max(0, working.length - 1), position)),
      codeNeedle,
      message,
      sortPhase: phase,
      sortRange: range,
      sortLeftRange: leftRange,
      sortRightRange: rightRange,
      sortComparePositions: comparePositions,
      sortWriteIndex: writeIndex,
      sortAuxValues: [...help],
      variables: sortFrameVariables(working, variables),
      delayMs,
      completed,
    });
  };

  addFrame({
    codeNeedle: 'void sort() {',
    message: 'Merge Sort prepara un arreglo auxiliar del mismo tamaño.',
    phase: 'merge-start',
    range: working.length ? [0, working.length - 1] : null,
  });
  addFrame({
    codeNeedle: 'int[] help = new int[size];',
    message: `help reserva ${working.length} posiciones para realizar las mezclas.`,
    phase: 'merge-help',
    range: working.length ? [0, working.length - 1] : null,
  });
  addFrame({
    codeNeedle: 'mergeSort(0, size - 1, help);',
    message: `Se inicia la división recursiva del rango [0..${Math.max(0, working.length - 1)}].`,
    phase: 'merge-call',
    range: working.length ? [0, working.length - 1] : null,
    variables: { left: 0, right: working.length - 1 },
  });

  const mergeSort = (left, right, depth) => {
    addFrame({
      codeNeedle: 'void mergeSort(int left, int right, int[] help) {',
      message: `Llamada mergeSort(${left}, ${right}) en profundidad ${depth}.`,
      phase: 'merge-recursion',
      position: Math.max(0, left),
      range: left <= right ? [left, right] : null,
      variables: { left, right, depth },
    });
    const baseCase = left >= right;
    addFrame({
      codeNeedle: 'if (left >= right) {',
      message: baseCase
        ? 'El rango tiene un solo elemento: ya está ordenado.'
        : 'El rango tiene varios elementos y debe dividirse.',
      phase: 'merge-base',
      position: Math.max(0, left),
      range: left <= right ? [left, right] : null,
      variables: { left, right, depth, condición: baseCase },
    });
    if (baseCase) {
      addFrame({
        codeNeedle: 'return;',
        message: `La llamada mergeSort(${left}, ${right}) regresa.`,
        phase: 'merge-return',
        position: Math.max(0, left),
        range: left === right ? [left, right] : null,
        variables: { left, right, depth },
      });
      return;
    }

    const middle = Math.floor((left + right) / 2);
    const leftRange = [left, middle];
    const rightRange = [middle + 1, right];
    addFrame({
      codeNeedle: 'int middle = (left + right) / 2;',
      message: `El rango [${left}..${right}] se divide en [${left}..${middle}] y [${middle + 1}..${right}].`,
      phase: 'merge-divide',
      position: middle,
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, depth },
    });
    addFrame({
      codeNeedle: 'mergeSort(left, middle, help);',
      message: `Primero se ordena la mitad izquierda [${left}..${middle}].`,
      phase: 'merge-left-call',
      position: left,
      range: leftRange,
      leftRange,
      rightRange,
      variables: { left, middle, right, depth },
    });
    mergeSort(left, middle, depth + 1);
    addFrame({
      codeNeedle: 'mergeSort(middle + 1, right, help);',
      message: `Después se ordena la mitad derecha [${middle + 1}..${right}].`,
      phase: 'merge-right-call',
      position: middle + 1,
      range: rightRange,
      leftRange,
      rightRange,
      variables: { left, middle, right, depth },
    });
    mergeSort(middle + 1, right, depth + 1);
    addFrame({
      codeNeedle: 'merge(left, middle, right, help);',
      message: `Ambas mitades ordenadas se mezclarán en [${left}..${right}].`,
      phase: 'merge-call-halves',
      position: left,
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, depth },
    });
    addFrame({
      codeNeedle: 'void merge(int left, int middle, int right, int[] help) {',
      message: `Comienza merge(${left}, ${middle}, ${right}).`,
      phase: 'merge-halves',
      position: left,
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, depth },
    });

    let i = left;
    let j = middle + 1;
    let k = left;
    addFrame({
      codeNeedle: 'int i = left;',
      message: `i comienza al inicio de la mitad izquierda: ${i}.`,
      phase: 'merge-pointers',
      position: i,
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, i, j, k, depth },
    });
    addFrame({
      codeNeedle: 'int j = middle + 1;',
      message: `j comienza al inicio de la mitad derecha: ${j}.`,
      phase: 'merge-pointers',
      position: j,
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, i, j, k, depth },
    });
    addFrame({
      codeNeedle: 'int k = left;',
      message: `k indica la posición ${k} del arreglo auxiliar.`,
      phase: 'merge-pointers',
      position: k,
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, i, j, k, depth },
    });

    while (i <= middle && j <= right) {
      addFrame({
        codeNeedle: 'while (i <= middle && j <= right) {',
        message: `Las dos mitades conservan elementos: se comparan los índices ${i} y ${j}.`,
        phase: 'merge-loop',
        position: i,
        range: [left, right],
        leftRange,
        rightRange,
        comparePositions: [i, j],
        variables: { left, middle, right, i, j, k, condición: true, depth },
      });
      const takeLeft = Number(working[i]) <= Number(working[j]);
      addFrame({
        codeNeedle: 'if (values[i] <= values[j]) {',
        message: takeLeft
          ? `${working[i]} ≤ ${working[j]}: se toma el elemento izquierdo.`
          : `${working[i]} > ${working[j]}: se toma el elemento derecho.`,
        phase: 'merge-compare',
        position: takeLeft ? i : j,
        range: [left, right],
        leftRange,
        rightRange,
        comparePositions: [i, j],
        writeIndex: k,
        variables: { left, middle, right, i, j, k, condición: takeLeft, depth },
      });
      if (takeLeft) {
        help[k] = working[i];
        addFrame({
          codeNeedle: 'help[k] = values[i];',
          message: `${working[i]} se copia en help[${k}].`,
          phase: 'merge-copy-left',
          position: i,
          range: [left, right],
          leftRange,
          rightRange,
          comparePositions: [i, j],
          writeIndex: k,
          variables: { left, middle, right, i, j, k, depth },
        });
        i++;
        addFrame({
          codeNeedle: 'i++;',
          message: `i avanza a ${i}.`,
          phase: 'merge-pointer-move',
          position: Math.min(i, middle),
          range: [left, right],
          leftRange,
          rightRange,
          variables: { left, middle, right, i, j, k, depth },
        });
      } else {
        help[k] = working[j];
        addFrame({
          codeNeedle: 'help[k] = values[j];',
          message: `${working[j]} se copia en help[${k}].`,
          phase: 'merge-copy-right',
          position: j,
          range: [left, right],
          leftRange,
          rightRange,
          comparePositions: [i, j],
          writeIndex: k,
          variables: { left, middle, right, i, j, k, depth },
        });
        j++;
        addFrame({
          codeNeedle: 'j++;',
          message: `j avanza a ${j}.`,
          phase: 'merge-pointer-move',
          position: Math.min(j, right),
          range: [left, right],
          leftRange,
          rightRange,
          variables: { left, middle, right, i, j, k, depth },
        });
      }
      k++;
      addFrame({
        codeNeedle: 'k++;',
        message: `k avanza a la posición auxiliar ${k}.`,
        phase: 'merge-pointer-move',
        position: Math.min(k, right),
        range: [left, right],
        leftRange,
        rightRange,
        writeIndex: Math.min(k, right),
        variables: { left, middle, right, i, j, k, depth },
      });
    }
    addFrame({
      codeNeedle: 'while (i <= middle && j <= right) {',
      message: 'Una de las dos mitades se agotó; termina el ciclo de comparación.',
      phase: 'merge-loop-end',
      position: Math.min(i <= middle ? i : j, right),
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, i, j, k, condición: false, depth },
    });

    while (i <= middle) {
      addFrame({
        codeNeedle: 'while (i <= middle) {',
        message: `Queda ${working[i]} en la mitad izquierda.`,
        phase: 'merge-left-rest',
        position: i,
        range: [left, right],
        leftRange,
        rightRange,
        writeIndex: k,
        variables: { left, middle, right, i, j, k, condición: true, depth },
      });
      help[k] = working[i];
      addFrame({
        codeNeedle: 'help[k] = values[i];',
        message: `${working[i]} se copia en help[${k}].`,
        phase: 'merge-copy-left',
        position: i,
        range: [left, right],
        leftRange,
        rightRange,
        writeIndex: k,
        variables: { left, middle, right, i, j, k, depth },
      });
      i++;
      k++;
    }
    addFrame({
      codeNeedle: 'while (i <= middle) {',
      message: 'No quedan elementos en la mitad izquierda.',
      phase: 'merge-left-rest-end',
      position: Math.min(Math.max(left, i - 1), right),
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, i, j, k, condición: false, depth },
    });

    while (j <= right) {
      addFrame({
        codeNeedle: 'while (j <= right) {',
        message: `Queda ${working[j]} en la mitad derecha.`,
        phase: 'merge-right-rest',
        position: j,
        range: [left, right],
        leftRange,
        rightRange,
        writeIndex: k,
        variables: { left, middle, right, i, j, k, condición: true, depth },
      });
      help[k] = working[j];
      addFrame({
        codeNeedle: 'help[k] = values[j];',
        message: `${working[j]} se copia en help[${k}].`,
        phase: 'merge-copy-right',
        position: j,
        range: [left, right],
        leftRange,
        rightRange,
        writeIndex: k,
        variables: { left, middle, right, i, j, k, depth },
      });
      j++;
      k++;
    }
    addFrame({
      codeNeedle: 'while (j <= right) {',
      message: 'No quedan elementos en la mitad derecha.',
      phase: 'merge-right-rest-end',
      position: Math.min(Math.max(left, j - 1), right),
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, i, j, k, condición: false, depth },
    });

    for (let index = left; index <= right; index++) {
      addFrame({
        codeNeedle: 'for (int index = left; index <= right; index++) {',
        message: `Se escribe help[${index}] de vuelta en values[${index}].`,
        phase: 'merge-write-loop',
        position: index,
        range: [left, right],
        leftRange,
        rightRange,
        writeIndex: index,
        variables: { left, middle, right, index, condición: true, depth },
      });
      working[index] = help[index];
      addFrame({
        codeNeedle: 'values[index] = help[index];',
        message: `${working[index]} queda guardado en values[${index}].`,
        phase: 'merge-write',
        position: index,
        range: [left, right],
        leftRange,
        rightRange,
        writeIndex: index,
        variables: { left, middle, right, index, depth },
      });
    }
    addFrame({
      codeNeedle: 'for (int index = left; index <= right; index++) {',
      message: `La mezcla [${left}..${right}] quedó ordenada.`,
      phase: 'merge-range-complete',
      position: left,
      range: [left, right],
      leftRange,
      rightRange,
      variables: { left, middle, right, index: right + 1, condición: false, depth },
    });
  };

  mergeSort(0, working.length - 1, 0);
  const message = 'Merge Sort terminó: las mitades se dividieron recursivamente y se mezclaron en orden.';
  addFrame({
    codeNeedle: 'mergeSort(0, size - 1, help);',
    message,
    phase: 'merge-complete',
    position: 0,
    range: working.length ? [0, working.length - 1] : null,
    completed: true,
    delayMs: 450,
  });
  return { ok: true, values: working, edges, message, step: 0, frames };
}

function heapFrameVariables({
  heap,
  root,
  last,
  index,
  left,
  right,
  largest,
  condition,
}) {
  return [
    { name: 'root', value: root, role: 'value' },
    { name: 'size', value: heap.length, role: 'size' },
    ...(last === undefined ? [] : [{ name: 'last', value: last, role: 'value' }]),
    ...(index === undefined ? [] : [{ name: 'index', value: index, role: 'index' }]),
    ...(left === undefined ? [] : [{ name: 'left', value: left, role: 'index' }]),
    ...(right === undefined ? [] : [{ name: 'right', value: right, role: 'index' }]),
    ...(largest === undefined ? [] : [{ name: 'largest', value: largest, role: 'position' }]),
    ...(condition === undefined ? [] : [{
      name: 'condición',
      value: condition ? 'true' : 'false',
      role: condition ? 'true' : 'false',
    }]),
  ];
}

function extractBinaryMaxHeap(values, edges) {
  const before = [...values];
  const root = before[0];
  const lastIndex = before.length - 1;
  const last = before[lastIndex];
  const frames = [];
  const addFrame = ({
    heap,
    position,
    codeNeedle,
    message,
    phase,
    index,
    left,
    right,
    largest,
    condition,
    source,
    target,
    candidates,
    completed = false,
    delayMs = 360,
  }) => {
    frames.push({
      values: [...heap],
      position: Math.max(0, position ?? 0),
      codeNeedle,
      message,
      heapPhase: phase,
      heapSourcePosition: source,
      heapTargetPosition: target,
      heapParentPosition: index,
      heapCandidatePositions: candidates ?? [],
      delayMs,
      completed,
      variables: heapFrameVariables({
        heap,
        root,
        last,
        index,
        left,
        right,
        largest,
        condition,
      }),
    });
  };

  addFrame({
    heap: before,
    position: 0,
    codeNeedle: 'if (size == 0) {',
    message: 'size es mayor que 0, por lo tanto la extracción puede continuar.',
    phase: 'validate-size',
    condition: false,
  });
  addFrame({
    heap: before,
    position: 0,
    codeNeedle: 'int root = heap[0];',
    message: `${root} es la raíz y el máximo que se extraerá.`,
    phase: 'capture-root',
  });
  addFrame({
    heap: before,
    position: lastIndex,
    codeNeedle: 'heap[0] = heap[size - 1];',
    message: `El último nodo del árbol completo es ${last}, ubicado en el índice ${lastIndex}. Se moverá a la raíz.`,
    phase: 'move-last',
    source: lastIndex,
    target: 0,
    delayMs: 1200,
  });

  const replaced = [...before];
  replaced[0] = last;
  addFrame({
    heap: replaced,
    position: 0,
    codeNeedle: 'heap[0] = heap[size - 1];',
    message: `${last} reemplaza a ${root} en la raíz. Por un instante también sigue visible en la última posición.`,
    phase: 'root-replaced',
    source: lastIndex,
    target: 0,
    delayMs: 460,
  });

  let heap = replaced.slice(0, -1);
  addFrame({
    heap,
    position: 0,
    codeNeedle: 'size--;',
    message: `size disminuye a ${heap.length}; se elimina la última posición y el árbol continúa siendo completo.`,
    phase: 'remove-last',
  });
  addFrame({
    heap,
    position: 0,
    codeNeedle: 'heapifyDown(0);',
    message: 'Se llama a heapifyDown desde la raíz para recuperar la propiedad de max-heap.',
    phase: 'heapify-call',
    index: 0,
  });

  if (heap.length === 0) {
    addFrame({
      heap,
      position: 0,
      codeNeedle: 'void heapifyDown(int index) {',
      message: 'heapifyDown recibe el índice 0, pero el heap ya quedó vacío.',
      phase: 'heapify-start',
      index: 0,
    });
    addFrame({
      heap,
      position: 0,
      codeNeedle: 'while (true) {',
      message: 'Se evalúa una vez el ciclo de heapifyDown.',
      phase: 'heapify-loop',
      index: 0,
    });
    addFrame({
      heap,
      position: 0,
      codeNeedle: 'int left = index * 2 + 1;',
      message: 'left vale 1 y queda fuera del heap vacío.',
      phase: 'calculate-left',
      index: 0,
      left: 1,
    });
    addFrame({
      heap,
      position: 0,
      codeNeedle: 'int right = index * 2 + 2;',
      message: 'right vale 2 y también queda fuera del heap.',
      phase: 'calculate-right',
      index: 0,
      left: 1,
      right: 2,
    });
    addFrame({
      heap,
      position: 0,
      codeNeedle: 'int largest = index;',
      message: 'largest permanece en 0 porque no existen hijos.',
      phase: 'select-largest',
      index: 0,
      left: 1,
      right: 2,
      largest: 0,
    });
    addFrame({
      heap,
      position: 0,
      codeNeedle: 'if (left < size && heap[left] > heap[largest]) {',
      message: 'left < size es false.',
      phase: 'compare-left',
      index: 0,
      left: 1,
      right: 2,
      largest: 0,
      condition: false,
    });
    addFrame({
      heap,
      position: 0,
      codeNeedle: 'if (right < size && heap[right] > heap[largest]) {',
      message: 'right < size es false.',
      phase: 'compare-right',
      index: 0,
      left: 1,
      right: 2,
      largest: 0,
      condition: false,
    });
    addFrame({
      heap,
      position: 0,
      codeNeedle: 'if (largest == index) {',
      message: 'largest == index es true; no se necesita ningún intercambio.',
      phase: 'heapify-stop',
      index: 0,
      left: 1,
      right: 2,
      largest: 0,
      condition: true,
    });
  }

  if (heap.length > 0) {
    let index = 0;
    addFrame({
      heap,
      position: index,
      codeNeedle: 'void heapifyDown(int index) {',
      message: 'heapifyDown comienza en la raíz, índice 0.',
      phase: 'heapify-start',
      index,
    });

    while (true) {
      addFrame({
        heap,
        position: index,
        codeNeedle: 'while (true) {',
        message: `Se revisa si el nodo ${heap[index]} debe bajar desde el índice ${index}.`,
        phase: 'heapify-loop',
        index,
      });

      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let largest = index;
      const candidates = [left, right].filter(position => position < heap.length);

      addFrame({
        heap,
        position: Math.min(left, Math.max(0, heap.length - 1)),
        codeNeedle: 'int left = index * 2 + 1;',
        message: `El hijo izquierdo corresponde al índice ${left}${left < heap.length ? ` y contiene ${heap[left]}` : ', fuera del heap'}.`,
        phase: 'calculate-left',
        index,
        left,
        candidates,
      });
      addFrame({
        heap,
        position: Math.min(right, Math.max(0, heap.length - 1)),
        codeNeedle: 'int right = index * 2 + 2;',
        message: `El hijo derecho corresponde al índice ${right}${right < heap.length ? ` y contiene ${heap[right]}` : ', fuera del heap'}.`,
        phase: 'calculate-right',
        index,
        left,
        right,
        candidates,
      });
      addFrame({
        heap,
        position: index,
        codeNeedle: 'int largest = index;',
        message: `Por ahora, largest es el nodo actual en el índice ${index}.`,
        phase: 'select-largest',
        index,
        left,
        right,
        largest,
        candidates,
      });

      const leftIsLarger = left < heap.length && Number(heap[left]) > Number(heap[largest]);
      if (leftIsLarger) largest = left;
      addFrame({
        heap,
        position: left < heap.length ? left : index,
        codeNeedle: 'if (left < size && heap[left] > heap[largest]) {',
        message: leftIsLarger
          ? `${heap[left]} es mayor que ${heap[index]}; largest cambia al hijo izquierdo.`
          : 'El hijo izquierdo no existe o no supera al candidato actual.',
        phase: 'compare-left',
        index,
        left,
        right,
        largest,
        condition: leftIsLarger,
        candidates,
      });

      const previousLargest = largest;
      const rightIsLarger = right < heap.length && Number(heap[right]) > Number(heap[largest]);
      if (rightIsLarger) largest = right;
      addFrame({
        heap,
        position: right < heap.length ? right : largest,
        codeNeedle: 'if (right < size && heap[right] > heap[largest]) {',
        message: rightIsLarger
          ? `${heap[right]} supera al candidato ${heap[previousLargest]}; largest cambia al hijo derecho.`
          : 'El hijo derecho no existe o no supera al candidato actual.',
        phase: 'compare-right',
        index,
        left,
        right,
        largest,
        condition: rightIsLarger,
        candidates,
      });

      const heapPropertyRestored = largest === index;
      addFrame({
        heap,
        position: index,
        codeNeedle: 'if (largest == index) {',
        message: heapPropertyRestored
          ? `${heap[index]} ya es mayor o igual que sus hijos; heapifyDown termina.`
          : `${heap[largest]} debe subir y ${heap[index]} debe bajar.`,
        phase: heapPropertyRestored ? 'heapify-stop' : 'swap-required',
        index,
        left,
        right,
        largest,
        condition: heapPropertyRestored,
        source: largest,
        target: index,
        candidates,
      });
      if (heapPropertyRestored) break;

      const temporary = heap[index];
      addFrame({
        heap,
        position: index,
        codeNeedle: 'int temp = heap[index];',
        message: `${temporary} se guarda temporalmente antes del intercambio.`,
        phase: 'swap-save',
        index,
        left,
        right,
        largest,
        source: index,
        target: largest,
        candidates,
      });

      const partialSwap = [...heap];
      partialSwap[index] = heap[largest];
      addFrame({
        heap: partialSwap,
        position: index,
        codeNeedle: 'heap[index] = heap[largest];',
        message: `${heap[largest]} sube desde el índice ${largest} al índice ${index}.`,
        phase: 'swap-up',
        index,
        left,
        right,
        largest,
        source: largest,
        target: index,
        candidates,
      });

      partialSwap[largest] = temporary;
      heap = partialSwap;
      addFrame({
        heap,
        position: largest,
        codeNeedle: 'heap[largest] = temp;',
        message: `${temporary} baja al índice ${largest}; el intercambio queda completo.`,
        phase: 'swap-complete',
        index,
        left,
        right,
        largest,
        source: index,
        target: largest,
        candidates,
      });

      index = largest;
      addFrame({
        heap,
        position: index,
        codeNeedle: 'index = largest;',
        message: `heapifyDown continúa desde el índice ${index}.`,
        phase: 'continue-down',
        index,
      });
    }
  }

  const finalMessage = `${root} fue extraído; ${last} ocupó primero la raíz y heapifyDown restauró el max-heap.`;
  addFrame({
    heap,
    position: 0,
    codeNeedle: 'return root;',
    message: finalMessage,
    phase: 'complete',
    completed: true,
    delayMs: 420,
  });
  return {
    ok: true,
    values: heap,
    edges,
    message: finalMessage,
    step: 0,
    frames,
  };
}

function linearStructureFrame(values, edges, codeNeedle, message, position, variables, extras = {}) {
  return {
    values: [...values],
    edges: edges.map(edge => [...edge]),
    position: Math.max(0, position),
    codeNeedle,
    message,
    delayMs: 560,
    variables,
    ...extras,
  };
}

function stackVariables(values, top, extras = []) {
  return [
    { name: 'top', value: top, role: 'index' },
    { name: 'size', value: values.length, role: 'size' },
    ...extras,
  ];
}

function executeStackOperation({ actionId, fields, values, edges }) {
  const before = [...values];
  const top = before.length - 1;
  const value = numericValue(fields.value ?? '', values);
  const frame = (currentValues, codeNeedle, message, position = Math.max(0, currentValues.length - 1), extras = [], options = {}) => (
    linearStructureFrame(
      currentValues,
      edges,
      codeNeedle,
      message,
      position,
      stackVariables(currentValues, currentValues.length - 1, extras),
      options,
    )
  );
  const finish = (ok, updated, message, frames, position = Math.max(0, updated.length - 1)) => ({
    ok,
    values: updated,
    edges: edges.map(edge => [...edge]),
    message,
    step: position,
    frames,
  });

  if (actionId === 'push') {
    if (value === null) return finish(false, before, 'Ingresa un valor válido antes de ejecutar Push.', []);
    const frames = [
      frame(before, 'boolean push(int value) {', `Push recibe el valor ${value}.`, Math.max(0, top), [{ name: 'value', value, role: 'input' }]),
      frame(before, 'if (top == MAX_SIZE - 1) {', before.length === 15
        ? 'top alcanzó el último espacio: la pila está llena.'
        : `top vale ${top}; todavía existe espacio para insertar.`, Math.max(0, top), [
        { name: 'MAX_SIZE', value: 15, role: 'size' },
        { name: 'condición', value: String(before.length === 15), role: before.length === 15 ? 'true' : 'false' },
      ]),
    ];
    if (before.length === 15) {
      frames.push(frame(before, 'return false;', 'Push termina sin modificar la pila porque ocurrió overflow.', Math.max(0, top), [], { completed: true }));
      return finish(false, before, 'La pila está llena: capacidad máxima de 15 elementos.', frames);
    }

    const after = [...before, value];
    frames.push(
      linearStructureFrame(before, edges, 'top++;', `top avanza de ${top} a ${top + 1}.`, Math.max(0, top), stackVariables(before, top + 1, [{ name: 'value', value, role: 'input' }])),
      frame(after, 'values[top] = value;', `${value} se guarda en values[${top + 1}] y aparece en el tope.`, top + 1, [{ name: 'value', value, role: 'input' }]),
      frame(after, 'return true;', `Push terminó: ${value} es el nuevo tope.`, top + 1, [], { completed: true }),
    );
    return finish(true, after, `Push: ${value} ahora está en el tope.`, frames, top + 1);
  }

  if (actionId === 'pop') {
    const frames = [
      frame(before, 'Integer pop() {', 'Pop intentará retirar el elemento ubicado en top.'),
      frame(before, 'if (top == -1) {', top === -1
        ? 'top vale -1: la pila está vacía.'
        : `top vale ${top}; existe un elemento para retirar.`, Math.max(0, top), [
        { name: 'condición', value: String(top === -1), role: top === -1 ? 'true' : 'false' },
      ]),
    ];
    if (top === -1) {
      frames.push(frame(before, 'return null;', 'Pop devuelve null porque ocurrió underflow.', 0, [], { completed: true }));
      return finish(false, before, 'La pila está vacía: no se puede ejecutar Pop.', frames, 0);
    }

    const removed = before[top];
    const cleared = [...before];
    cleared[top] = '∅';
    const after = before.slice(0, -1);
    frames.push(
      frame(before, 'int removed = values[top];', `${removed} se guarda en la variable removed.`, top, [{ name: 'removed', value: removed, role: 'value' }]),
      frame(cleared, 'values[top] = 0;', `La posición ${top} se limpia antes de bajar el tope.`, top, [{ name: 'removed', value: removed, role: 'value' }]),
      frame(after, 'top--;', `top baja de ${top} a ${top - 1}; ${removed} deja la pila.`, Math.max(0, top - 1), [{ name: 'removed', value: removed, role: 'value' }]),
      frame(after, 'return removed;', `Pop devuelve ${removed}.`, Math.max(0, top - 1), [{ name: 'removed', value: removed, role: 'value' }], { completed: true }),
    );
    return finish(true, after, `Pop: ${removed} fue retirado del tope.`, frames);
  }

  if (actionId === 'peek') {
    const frames = [
      frame(before, 'Integer peek() {', 'Peek consulta el tope sin modificar la pila.'),
      frame(before, 'if (top == -1) {', top === -1
        ? 'top vale -1: no existe un elemento visible.'
        : `top vale ${top}; la pila contiene ${before[top]}.`, Math.max(0, top), [
        { name: 'condición', value: String(top === -1), role: top === -1 ? 'true' : 'false' },
      ]),
    ];
    if (top === -1) {
      frames.push(frame(before, 'return null;', 'Peek devuelve null porque la pila está vacía.', 0, [], { completed: true }));
      return finish(false, before, 'La pila está vacía.', frames, 0);
    }
    frames.push(frame(before, 'return values[top];', `Peek devuelve ${before[top]} sin eliminarlo.`, top, [
      { name: 'retorno', value: before[top], role: 'value' },
    ], { completed: true }));
    return finish(true, before, `Peek: el elemento del tope es ${before[top]}.`, frames, top);
  }

  if (actionId === 'clear') {
    const frames = [frame(before, 'void clear() {', 'Vaciar comienza desde el tope actual.')];
    let working = [...before];
    while (working.length) {
      const currentTop = working.length - 1;
      frames.push(frame(working, 'while (top >= 0) {', `top vale ${currentTop}; el ciclo debe limpiar otra posición.`, currentTop, [
        { name: 'condición', value: 'true', role: 'true' },
      ]));
      const cleared = [...working];
      cleared[currentTop] = '∅';
      frames.push(frame(cleared, 'values[top] = 0;', `values[${currentTop}] se limpia.`, currentTop));
      working = working.slice(0, -1);
      frames.push(frame(working, 'top--;', `top baja a ${working.length - 1}.`, Math.max(0, working.length - 1)));
    }
    frames.push(frame([], 'while (top >= 0) {', 'top vale -1; la condición es falsa y el ciclo termina.', 0, [
      { name: 'condición', value: 'false', role: 'false' },
    ], { completed: true }));
    return finish(true, [], 'La pila quedó completamente vacía.', frames, 0);
  }

  return null;
}

function queueVariables(values, extras = []) {
  return [
    { name: 'front', value: values[0] ?? 'null', role: 'value' },
    { name: 'rear', value: values.at(-1) ?? 'null', role: 'value' },
    { name: 'size', value: values.length, role: 'size' },
    ...extras,
  ];
}

function executeQueueOperation({ actionId, fields, values, edges }) {
  const before = [...values];
  const value = numericValue(fields.value ?? '', values);
  const frame = (currentValues, codeNeedle, message, position = 0, extras = [], options = {}) => (
    linearStructureFrame(currentValues, edges, codeNeedle, message, position, queueVariables(currentValues, extras), options)
  );
  const finish = (ok, updated, message, frames, position = 0) => ({
    ok,
    values: updated,
    edges: edges.map(edge => [...edge]),
    message,
    step: position,
    frames,
  });

  if (actionId === 'enqueue') {
    if (value === null) return finish(false, before, 'Ingresa un valor válido antes de ejecutar Enqueue.', []);
    const full = before.length === 15;
    const frames = [
      frame(before, 'boolean enqueue(int value) {', `Enqueue recibe el valor ${value}.`, Math.max(0, before.length - 1), [{ name: 'value', value, role: 'input' }]),
      frame(before, 'if (size == MAX_SIZE) {', full
        ? 'size alcanzó MAX_SIZE: la cola está llena.'
        : `size vale ${before.length}; existe espacio para otro nodo.`, Math.max(0, before.length - 1), [
        { name: 'MAX_SIZE', value: 15, role: 'size' },
        { name: 'condición', value: String(full), role: full ? 'true' : 'false' },
      ]),
    ];
    if (full) {
      frames.push(frame(before, 'return false;', 'Enqueue termina sin modificar la cola porque ocurrió overflow.', Math.max(0, before.length - 1), [], { completed: true }));
      return finish(false, before, 'La cola está llena: capacidad máxima de 15 elementos.', frames);
    }

    const after = [...before, value];
    const wasEmpty = before.length === 0;
    frames.push(
      frame(before, 'Node newNode = new Node(value);', `Se crea un nodo nuevo que guarda ${value}.`, Math.max(0, before.length - 1), [{ name: 'newNode.value', value, role: 'input' }]),
      frame(before, 'if (rear == null) {', wasEmpty
        ? 'rear es null: el nuevo nodo será frente y final.'
        : `rear apunta a ${before.at(-1)}: el nuevo nodo se enlazará después.`, Math.max(0, before.length - 1), [
        { name: 'condición', value: String(wasEmpty), role: wasEmpty ? 'true' : 'false' },
      ]),
    );
    if (wasEmpty) {
      frames.push(
        frame(after, 'front = newNode;', `${value} se convierte en el frente de la cola.`, 0),
        frame(after, 'rear = front;', `${value} también se convierte en el final.`, 0),
      );
    } else {
      frames.push(
        frame(after, 'rear.next = newNode;', `El antiguo final ${before.at(-1)} enlaza al nodo ${value}.`, before.length),
        frame(after, 'rear = newNode;', `rear avanza y ahora apunta a ${value}.`, before.length),
      );
    }
    frames.push(
      frame(after, 'size++;', `size aumenta de ${before.length} a ${after.length}.`, after.length - 1),
      frame(after, 'return true;', `Enqueue terminó: ${value} está al final de la cola.`, after.length - 1, [], { completed: true }),
    );
    return finish(true, after, `Enqueue: ${value} fue agregado al final de la cola.`, frames, after.length - 1);
  }

  if (actionId === 'dequeue') {
    const empty = before.length === 0;
    const frames = [
      frame(before, 'Integer dequeue() {', 'Dequeue intentará retirar el nodo ubicado en front.'),
      frame(before, 'if (front == null) {', empty
        ? 'front es null: la cola está vacía.'
        : `front apunta a ${before[0]}; existe un nodo para retirar.`, 0, [
        { name: 'condición', value: String(empty), role: empty ? 'true' : 'false' },
      ]),
    ];
    if (empty) {
      frames.push(frame(before, 'return null;', 'Dequeue devuelve null porque ocurrió underflow.', 0, [], { completed: true }));
      return finish(false, before, 'La cola está vacía: no se puede ejecutar Dequeue.', frames);
    }

    const removed = before[0];
    const after = before.slice(1);
    frames.push(
      frame(before, 'int removed = front.value;', `${removed} se guarda en la variable removed.`, 0, [{ name: 'removed', value: removed, role: 'value' }]),
      frame(after, 'front = front.next;', after.length
        ? `front avanza al siguiente nodo, que contiene ${after[0]}.`
        : 'front avanza a null porque no quedan nodos.', 0, [{ name: 'removed', value: removed, role: 'value' }]),
      frame(after, 'if (front == null) {', after.length === 0
        ? 'front es null: también se debe limpiar rear.'
        : 'front no es null: rear conserva el último nodo.', 0, [
        { name: 'condición', value: String(after.length === 0), role: after.length === 0 ? 'true' : 'false' },
      ]),
    );
    if (!after.length) frames.push(frame(after, 'rear = null;', 'rear queda en null; la cola está completamente vacía.', 0));
    frames.push(
      frame(after, 'size--;', `size disminuye de ${before.length} a ${after.length}.`, 0, [{ name: 'removed', value: removed, role: 'value' }]),
      frame(after, 'return removed;', `Dequeue devuelve ${removed}.`, 0, [{ name: 'removed', value: removed, role: 'value' }], { completed: true }),
    );
    return finish(true, after, `Dequeue: ${removed} fue retirado del frente.`, frames, 0);
  }

  if (actionId === 'front') {
    const empty = before.length === 0;
    const frames = [
      frame(before, 'Integer peekFront() {', 'La operación consulta front sin retirar ningún nodo.'),
      frame(before, 'if (front == null) {', empty
        ? 'front es null: la cola está vacía.'
        : `front apunta al nodo que contiene ${before[0]}.`, 0, [
        { name: 'condición', value: String(empty), role: empty ? 'true' : 'false' },
      ]),
    ];
    if (empty) {
      frames.push(frame(before, 'return null;', 'La consulta devuelve null porque no existe frente.', 0, [], { completed: true }));
      return finish(false, before, 'La cola está vacía.', frames, 0);
    }
    frames.push(frame(before, 'return front.value;', `La consulta devuelve ${before[0]} sin modificar la cola.`, 0, [
      { name: 'retorno', value: before[0], role: 'value' },
    ], { completed: true }));
    return finish(true, before, `El frente de la cola es ${before[0]}.`, frames, 0);
  }

  if (actionId === 'clear') {
    const frames = [
      frame(before, 'void clear() {', 'Vaciar desconectará las referencias principales de la cola.'),
      frame([], 'front = null;', 'front deja de apuntar al primer nodo.', 0),
      frame([], 'rear = null;', 'rear también queda en null.', 0),
      frame([], 'size = 0;', 'size queda en 0 y la cola está vacía.', 0, [], { completed: true }),
    ];
    return finish(true, [], 'La cola quedó completamente vacía.', frames, 0);
  }

  return null;
}

function executeAstOperation({ actionId, fields, values, edges }) {
  const before = [...values];
  const copiedEdges = edges.map(edge => [...edge]);
  const frame = (currentValues, codeNeedle, message, position = 0, variables = [], options = {}) => ({
    values: [...currentValues],
    edges: copiedEdges,
    position: Math.max(0, position),
    codeNeedle,
    message,
    variables,
    delayMs: 720,
    ...options,
  });
  const finish = (ok, updated, message, frames, position = 0) => ({
    ok,
    values: updated,
    edges: copiedEdges,
    message,
    step: position,
    frames,
  });

  if (actionId === 'ast-build') {
    const source = String(fields.value ?? '').trim();
    let parsed;
    try {
      parsed = parseSimpleJavaAssignment(source);
    } catch (error) {
      return finish(false, before, error.message, [], 0);
    }

    const revealed = new Array(parsed.values.length);
    const commonVariables = (event = null) => [
      { name: 'source', value: parsed.source, role: 'input' },
      { name: 'position', value: event?.tokenPosition ?? 0, role: 'index' },
      { name: 'token', value: event?.label ?? 'inicio', role: 'value' },
      { name: 'tipo', value: event?.kind ?? 'sentencia', role: 'value' },
      { name: 'nodos creados', value: revealed.filter(value => value !== undefined).length, role: 'size' },
    ];
    const frames = [
      frame(revealed, 'Node buildAst(String code) {', 'Comienza el análisis de una asignación Java.', 0, commonVariables()),
      frame(revealed, 'source = code;', `source guarda: ${parsed.source}`, 0, commonVariables()),
      frame(revealed, 'position = 0;', 'El lector comienza en el primer carácter.', 0, commonVariables()),
    ];

    parsed.created.forEach(event => {
      revealed[event.treeIndex] = event.label;
      const kindNames = {
        statement: 'sentencia',
        operator: 'operador',
        identifier: 'identificador',
        literal: 'literal',
      };
      frames.push(frame(
        revealed,
        event.codeNeedle,
        `Se crea el nodo ${event.label} como ${kindNames[event.kind]}.`,
        event.treeIndex,
        commonVariables(event),
      ));
    });
    frames.push(frame(
      parsed.values,
      'return root;',
      'El AST está completo y conserva la precedencia de la instrucción.',
      0,
      [
        { name: 'root', value: 'ASSIGN', role: 'value' },
        { name: 'nodos', value: parsed.created.length, role: 'size' },
      ],
      { completed: true },
    ));
    return finish(true, parsed.values, `AST construido desde: ${parsed.source}`, frames, 0);
  }

  if (actionId === 'ast-preorder') {
    const positions = astPreorderPositions(before);
    if (!positions.length) {
      return finish(false, before, 'Primero construye un AST para poder recorrerlo.', [], 0);
    }

    const output = [];
    const variables = (index, depth, condition = null) => [
      { name: 'node', value: index === null ? 'null' : before[index], role: 'value' },
      { name: 'profundidad', value: depth, role: 'index' },
      { name: 'salida', value: output.join(' → ') || 'vacía', role: 'value' },
      ...(condition === null ? [] : [{ name: 'node == null', value: String(condition), role: condition ? 'true' : 'false' }]),
    ];
    const frames = [
      frame(before, 'void showPreorder() {', 'Comienza el recorrido preorden del AST.', 0, variables(0, 0)),
      frame(before, 'preorder(root);', 'La primera llamada recibe la raíz ASSIGN.', 0, variables(0, 0)),
    ];

    const visit = (index, depth) => {
      if (index >= before.length || before[index] === undefined) {
        frames.push(
          frame(before, 'if (node == null) {', 'La referencia es null: esta rama terminó.', 0, variables(null, depth, true)),
          frame(before, 'return;', 'La llamada retorna a su nodo anterior.', 0, variables(null, depth)),
        );
        return;
      }
      frames.push(
        frame(before, 'void preorder(Node node) {', `Entra a preorder con el nodo ${before[index]}.`, index, variables(index, depth)),
        frame(before, 'if (node == null) {', `${before[index]} existe, por lo tanto la condición es falsa.`, index, variables(index, depth, false)),
      );
      output.push(before[index]);
      frames.push(frame(
        before,
        'System.out.println(node.label);',
        `Visita ${before[index]}. Salida: ${output.join(' → ')}`,
        index,
        variables(index, depth),
      ));
      frames.push(frame(before, 'preorder(node.left);', `Intenta recorrer el hijo izquierdo de ${before[index]}.`, index, variables(index, depth)));
      visit(index * 2 + 1, depth + 1);
      frames.push(frame(before, 'preorder(node.right);', `Intenta recorrer el hijo derecho de ${before[index]}.`, index, variables(index, depth)));
      visit(index * 2 + 2, depth + 1);
    };

    visit(0, 0);
    frames.push(frame(
      before,
      'preorder(node.right);',
      `Preorden: ${output.join(' → ')}`,
      positions.at(-1),
      variables(positions.at(-1), 0),
      { completed: true },
    ));
    return finish(true, before, `Preorden: ${output.join(' → ')}`, frames, positions.at(-1));
  }

  if (actionId === 'ast-clear') {
    const frames = [
      frame(before, 'void clear() {', 'La operación vaciará la referencia principal del AST.', 0, [
        { name: 'root', value: before[0] ?? 'null', role: 'value' },
      ]),
      frame([], 'root = null;', 'root queda en null y el árbol deja de tener nodos accesibles.', 0, [
        { name: 'root', value: 'null', role: 'value' },
        { name: 'nodos', value: 0, role: 'size' },
      ], { completed: true }),
    ];
    return finish(true, [], 'El AST quedó vacío.', frames, 0);
  }

  return null;
}

export function executeOperation({ algorithm, actionId, fields, values, edges, initialValues, initialEdges = DEFAULT_GRAPH_EDGES }) {
  const group = operationGroup(algorithm);
  if (group === 'polynomial') return executePolynomialOperation({ actionId, fields, values, edges });
  if (group === 'generalizedList') return executeGeneralizedListOperation({ actionId, fields, values, edges });
  if (group === 'matrix') return executeDenseMatrixOperation({ actionId, fields, values, edges });
  if (group === 'sparseMatrix') return executeSparseMatrixOperation({ actionId, fields, values, edges });
  if (group === 'threadedTree') return executeThreadedTreeOperation({ actionId, fields, values, initialValues, edges });
  if (group === 'ast') return executeAstOperation({ actionId, fields, values, edges });
  if (group === 'stack') return executeStackOperation({ actionId, fields, values, edges });
  if (group === 'queue') return executeQueueOperation({ actionId, fields, values, edges });
  const next = [...values];
  const forceText = ['merkle', 'hash', 'cache'].includes(group) || (group === 'spatial' && algorithm.id !== 'kd-tree');
  const value = numericValue(fields.value ?? '', values, forceText);
  const index = validIndex(fields.index ?? '', values.length, actionId === 'add-index');
  const fail = message => ({ ok: false, values, edges, message, step: 0 });
  const done = (updated, message, step = Math.max(0, updated.length - 1), updatedEdges = edges) => ({ ok: true, values: updated, edges: updatedEdges, message, step });

  if (actionId === 'reset') return done([...initialValues], 'Estructura restablecida a su estado inicial.', 0, initialEdges.map(edge => [...edge]));
  if (actionId === 'clear') return done([], 'Estructura vaciada.', 0);
  if (actionId === 'clear-bits') return done(values.map(() => 0), 'Todos los bits fueron limpiados.', 0);
  if (['add-start','add-end','add-index','push','enqueue','sorted-add','tree-add','heap-add'].includes(actionId) && value === null) return fail('Ingresa un valor válido antes de ejecutar la operación.');
  if (group === 'merkle' && actionId === 'add-end' && next.length >= 8) return fail('La demostración Merkle admite hasta 8 bloques visibles.');
  if (group === 'btree' && actionId === 'sorted-add' && next.length >= 24) return fail('El árbol multicamino admite hasta 24 claves visibles en esta demostración.');

  switch (actionId) {
    case 'add-start': next.unshift(value); return done(next, `${value} fue agregado al inicio.`, 0);
    case 'add-end': next.push(value); return done(next, `${value} fue agregado al final.`);
    case 'add-index':
      if (index === null) return fail('El índice debe estar dentro del rango permitido.');
      next.splice(index, 0, value); return done(next, `${value} fue insertado en el índice ${index}.`, index);
    case 'set-index':
    case 'range-update': {
      if (value === null || index === null) return fail('Ingresa un índice existente y un valor válido.');
      next[index] = actionId === 'range-update' && algorithm.id === 'fenwick-tree' ? Number(next[index]) + Number(value) : value;
      return done(next, `Índice ${index} actualizado a ${next[index]}.`, index);
    }
    case 'remove-start': {
      if (!next.length) return fail('La estructura ya está vacía.');
      const removed = next.shift(); return done(next, `${removed} fue eliminado del inicio.`, 0);
    }
    case 'remove-end':
    case 'pop':
    case 'dequeue':
    case 'heap-extract': {
      if (!next.length) return fail('La estructura ya está vacía.');
      if (actionId === 'heap-extract' && algorithm.id === 'heap') {
        return extractBinaryMaxHeap(next, edges);
      }
      const removeFromStart = actionId === 'dequeue' || actionId === 'heap-extract';
      const removed = removeFromStart ? next.shift() : next.pop();
      if (actionId === 'heap-extract') {
        const minimumHeap = algorithm.id === 'fibonacci-heap';
        next.sort((a,b) => minimumHeap ? Number(a) - Number(b) : Number(b) - Number(a));
      }
      return done(next, `${removed} fue extraído de la estructura.`, Math.max(0, next.length - 1));
    }
    case 'remove-index': {
      if (index === null) return fail('Ingresa un índice existente.');
      const [removed] = next.splice(index, 1); return done(next, `${removed} fue eliminado del índice ${index}.`, index);
    }
    case 'remove-value': {
      if (value === null) return fail('Ingresa el valor que quieres eliminar.');
      const found = orderedBinaryTreeIds.has(algorithm.id)
        ? binarySearchPosition(next, value)
        : next.findIndex(item => (
            ['hash', 'cache'].includes(group) ? entryKey(item) === String(value) : String(item) === String(value)
          ));
      if (found < 0) return fail(`${value} no existe en la estructura.`);
      if (orderedBinaryTreeIds.has(algorithm.id)) {
        if (algorithm.id === 'avl') {
          const removal = removeFromAvl(next, value);
          const rotationDetail = removal.rotations.length
            ? ` y aplicó rotación ${removal.rotations.map(rotation => rotation.type).join(' + ')}`
            : ' y actualizó sus alturas sin necesitar una rotación';
          return done(removal.values, `${value} fue eliminado; el AVL conservó su balance${rotationDetail}.`, Math.max(0, found));
        }
        const remaining = compactTreeValues(next).filter(item => String(item) !== String(value));
        const rebuilt = balancedBinaryTreeIds.has(algorithm.id)
          ? buildBalancedBinaryTree(remaining)
          : buildBinarySearchTree(remaining);
        return done(rebuilt, `${value} fue eliminado y se conservaron las reglas del árbol.`, Math.max(0, found));
      }
      if (['arbol-general', 'arbol-nario', 'arbol-binario'].includes(algorithm.id)) {
        const last = next.pop();
        if (found < next.length) next[found] = last;
        return done(next, `${value} fue eliminado; el nodo más profundo ocupó su lugar.`, Math.max(0, found));
      }
      next.splice(found, 1); return done(next, `${value} fue eliminado.`, Math.max(0, found - 1));
    }
    case 'push': next.push(value); return done(next, `Push: ${value} ahora está en el tope.`);
    case 'enqueue': next.push(value); return done(next, `Enqueue: ${value} fue agregado a la cola.`);
    case 'peek':
    case 'front': {
      if (!next.length) return fail('La estructura está vacía.');
      const position = actionId === 'front' || group === 'heap' ? 0 : next.length - 1;
      return done(next, `El elemento visible es ${next[position]}.`, position);
    }
    case 'sorted-add': {
      if (value === null) return fail('Ingresa una clave válida.');
      if (next.some(item => String(item) === String(value))) return fail(`${value} ya existe.`);
      const before = [...next];
      const leavesBefore = Math.ceil(before.length / 3);
      next.push(value); next.sort((a,b) => Number(a) - Number(b));
      if (group === 'btree') {
        const position = next.indexOf(value);
        const leavesAfter = Math.ceil(next.length / 3);
        const splitOccurred = leavesAfter > leavesBefore;
        const leafBaseSize = Math.floor(next.length / leavesAfter);
        const largerLeaves = next.length % leavesAfter;
        const lastLeafStart = (leavesAfter - 1) * leafBaseSize + largerLeaves;
        const promotedKey = splitOccurred ? next[lastLeafStart] : null;
        const frames = [
          {
            values: before,
            position: Math.min(position, Math.max(0, before.length - 1)),
            codeLine: 1,
            treePhase: 'search',
            message: `Se busca la hoja ordenada donde debe entrar ${value}.`,
          },
          {
            values: [...next],
            position,
            codeLine: 2,
            treePhase: 'insert',
            promotedKey,
            message: `${value} se inserta en orden dentro de la hoja.`,
          },
        ];

        if (splitOccurred) {
          frames.push(
            {
              values: [...next],
              position,
              codeLine: 5,
              treePhase: 'split',
              promotedKey,
              message: 'La hoja superó el máximo de 3 claves, por eso se divide en dos nodos.',
            },
            {
              values: [...next],
              position,
              codeLine: 6,
              treePhase: 'promote',
              promotedKey,
              message: `${promotedKey} se convierte en separador y sube al nodo padre.`,
            },
            {
              values: [...next],
              position,
              codeLine: 7,
              treePhase: 'settled',
              promotedKey,
              message: `${value} fue insertado: la nueva hoja quedó conectada y ${promotedKey} ya está en el padre.`,
            },
          );
        } else {
          frames[1].message = `${value} fue insertado manteniendo el orden; la hoja aún tiene espacio.`;
        }

        return { ...done(next, frames.at(-1).message, position), frames };
      }
      return done(next, `${value} fue insertado manteniendo el orden.`, next.indexOf(value));
    }
    case 'tree-add': {
      const maximum = ['arbol-general','arbol-nario'].includes(algorithm.id) ? 10 : group === 'spatial' ? 12 : 15;
      if (compactTreeValues(next).length >= maximum) return fail(`La demostración admite hasta ${maximum} nodos visibles.`);
      if (orderedBinaryTreeIds.has(algorithm.id)) {
        if (compactTreeValues(next).some(item => Number(item) === Number(value))) return fail(`${value} ya existe en el árbol.`);
        if (algorithm.id === 'avl') {
          const insertion = insertIntoAvl(next, value);
          if (insertion.hiddenNode) return fail('La inserción produciría un nivel que no cabe completo en el visualizador.');
          const insertedAt = insertion.values.findIndex(item => Number(item) === Number(value));
          const rotationDetail = insertion.rotations.length
            ? ` Se aplicó rotación ${insertion.rotations.map(rotation => rotation.type).join(' + ')}.`
            : ' Se actualizaron las alturas y no fue necesaria una rotación.';
          return done(insertion.values, `Nodo ${value} insertado siguiendo el BST.${rotationDetail}`, insertedAt);
        }
        const insertedValues = [...compactTreeValues(next), value];
        const rebuilt = balancedBinaryTreeIds.has(algorithm.id)
          ? buildBalancedBinaryTree(insertedValues)
          : algorithm.id === 'splay-tree'
            ? buildSplayedBinaryTree(insertedValues, value)
            : buildBinarySearchTree(insertedValues);
        const insertedAt = rebuilt.findIndex(item => Number(item) === Number(value));
        if (insertedAt < 0) return fail('No queda un espacio visible para insertar ese nodo sin ocultar parte del árbol.');
        const detail = balancedBinaryTreeIds.has(algorithm.id)
          ? ' y se reequilibró'
          : algorithm.id === 'splay-tree'
            ? ' y fue llevado a la raíz'
            : '';
        return done(rebuilt, `Nodo ${value} insertado${detail}.`, insertedAt);
      }
      if (algorithm.id === 'arbol-binario') {
        if (compactTreeValues(next).some(item => Number(item) === Number(value))) {
          return fail(`${value} ya existe en el árbol. Ingresa un valor diferente.`);
        }
        const before = [...next];
        next.push(value);
        const insertedAt = next.length - 1;
        const message = `Nodo ${value} insertado recursivamente en el primer espacio libre.`;
        return {
          ...done(next, message, insertedAt),
          frames: binaryRecursiveInsertionFrames(before, next, value, insertedAt),
        };
      }
      next.push(value); return done(next, `Nodo ${value} insertado en el siguiente espacio disponible.`);
    }
    case 'heap-add': {
      const maximum = algorithm.id === 'fibonacci-heap' ? 9 : 15;
      if (next.length >= maximum) return fail(`El heap visual admite hasta ${maximum} nodos.`);
      const minimumHeap = algorithm.id === 'fibonacci-heap';
      next.push(value);
      if (minimumHeap) {
        next.sort((a,b) => Number(a) - Number(b));
      } else {
        let index = next.length - 1;
        while (index > 0) {
          const parent = Math.floor((index - 1) / 2);
          if (Number(next[parent]) >= Number(next[index])) break;
          [next[parent], next[index]] = [next[index], next[parent]];
          index = parent;
        }
      }
      return done(next, `${value} fue insertado y el heap fue reorganizado.`, next.indexOf(value));
    }
    case 'find': {
      if (value === null) return fail('Ingresa el valor que quieres buscar.');
      const found = orderedBinaryTreeIds.has(algorithm.id)
        ? binarySearchPosition(next, value)
        : next.findIndex(item => (
            ['hash', 'cache'].includes(group) ? entryKey(item) === String(value) : String(item) === String(value)
          ));
      if (found < 0) return fail(`${value} no fue encontrado.`);
      if (algorithm.id === 'splay-tree') {
        const splayed = buildSplayedBinaryTree(compactTreeValues(next), value);
        return done(splayed, `${value} fue encontrado y movido a la raíz mediante splay.`, 0);
      }
      return done(next, `${value} fue encontrado en la posición ${found}.`, found);
    }
    case 'preorder':
    case 'inorder':
    case 'postorder': {
      let order;
      if (['arbol-general', 'arbol-nario'].includes(algorithm.id)) {
        const children = algorithm.id === 'arbol-nario'
          ? [[1,2,3],[4,5,6],[7,8],[9]]
          : [[1,2,3],[4,5,6],[7,8],[9]];
        order = [];
        const visit = position => {
          if (position >= next.length) return;
          order.push(next[position]);
          (children[position] ?? []).forEach(visit);
        };
        visit(0);
      } else {
        order = binaryTraversal(next, actionId);
      }
      return done(next, `${actionId}: ${order.join(' → ')}.`, 0);
    }
    case 'set-word': {
      const word = String(fields.value ?? '').trim().toUpperCase();
      if (!word) return fail('Escribe una palabra.');
      if (algorithm.id === 'trie') {
        if (word.length > 8) return fail('Usa una palabra de hasta 8 letras para mantener visible el árbol.');
        if (next.includes(word)) return fail(`${word} ya existe en el Trie.`);
        if (next.length >= 6) return fail('El Trie visual admite hasta 6 palabras.');
        const beforeWords = [...next];
        const frames = [{
          values: [...beforeWords], edges, position: 0,
          codeNeedle: 'TrieNode current = root;',
          message: 'current comienza en la raíz del Prefix Tree.',
          trieState: { word, revealed: 0, marked: false },
          variables: [{ name: 'current', value: 'root', role: 'position' }],
        }];
        let prefix = '';
        [...word].forEach((letter, letterIndex) => {
          prefix += letter;
          const existed = beforeWords.some(item => String(item).startsWith(prefix));
          const state = { word, revealed: letterIndex + 1, marked: false };
          frames.push({ values: [...beforeWords], edges, position: letterIndex, codeNeedle: 'for (int i = 0; i < word.length(); i++) {', message: `Iteración ${letterIndex + 1}: se procesa ${letter}.`, trieState: state, variables: [{ name: 'i', value: letterIndex, role: 'index' }, { name: 'letter', value: letter, role: 'value' }] });
          frames.push({ values: [...beforeWords], edges, position: letterIndex, codeNeedle: 'if (current.children[letter] == null) {', message: existed ? `${prefix} ya comparte un nodo.` : `${prefix} todavía no tiene nodo.`, trieState: state, variables: [{ name: `children[${letter}]`, value: existed ? 'nodo' : 'null', role: existed ? 'true' : 'false' }] });
          if (!existed) frames.push({ values: [...beforeWords], edges, position: letterIndex, codeNeedle: 'current.children[letter] = new TrieNode();', message: `Se crea el nodo ${letter}.`, trieState: state, variables: [{ name: 'nuevo prefijo', value: prefix, role: 'value' }] });
          frames.push({ values: [...beforeWords], edges, position: letterIndex, codeNeedle: 'current = current.children[letter];', message: `current avanza hasta ${prefix}.`, trieState: state, variables: [{ name: 'current', value: prefix, role: 'position' }] });
        });
        next.push(word);
        frames.push({ values: [...next], edges, position: word.length - 1, codeNeedle: 'current.isWord = true;', message: `El último nodo se marca como FIN de ${word}.`, trieState: { word, revealed: word.length, marked: true }, variables: [{ name: 'current.isWord', value: true, role: 'true' }], completed: true });
        return { ...done(next, `La palabra ${word} fue insertada en el Trie.`, next.length - 1), frames };
      }
      return done([...word], `La palabra ${word} fue insertada en el Trie.`, word.length - 1);
    }
    case 'word-find': {
      const word = String(fields.value ?? '').trim().toUpperCase();
      if (algorithm.id === 'trie') {
        const found = next.indexOf(word);
        return found >= 0 ? done(next, `${word} existe y termina en un nodo marcado como FIN.`, found) : fail(`${word || 'La palabra'} no existe en el Trie.`);
      }
      const current = next.join('');
      return word && current.includes(word) ? done(next, `${word} coincide con la ruta de prefijos.`, word.length - 1) : fail(`${word || 'La palabra'} no aparece en la ruta actual.`);
    }
    case 'remove-word': {
      const word = String(fields.value ?? '').trim().toUpperCase();
      if (algorithm.id === 'trie') {
        const found = next.indexOf(word);
        if (!word) return fail('Escribe la palabra que quieres eliminar.');
        if (found < 0) return fail(`${word} no existe en el Trie.`);
        next.splice(found, 1);
        return done(next, `La palabra ${word} fue eliminada del Trie.`, Math.max(0, found - 1));
      }
      const current = next.join('');
      if (!word) return fail('Escribe la palabra que quieres eliminar.');
      if (!current.includes(word)) return fail(`${word} no aparece en la ruta actual.`);
      return done([], `La palabra ${word} fue eliminada.`, 0);
    }
    case 'prefix-sum':
    case 'range-min': {
      const limit = validIndex(fields.index ?? '', next.length);
      if (limit === null) return fail('Ingresa un límite de prefijo válido.');
      const slice = next.slice(0, limit + 1).map(Number);
      const result = actionId === 'prefix-sum' ? slice.reduce((sum,item)=>sum+item,0) : Math.min(...slice);
      return done(next, `${actionId === 'prefix-sum' ? 'Suma' : 'Mínimo'} en [0, ${limit}] = ${result}.`, limit);
    }
    case 'range-view': return done(next, `Recorrido ordenado de hojas: ${next.join(' → ')}.`, 0);
    case 'merkle-root': return done(next, `Raíz Merkle simulada: H(${next.join(' + ') || '∅'}).`, 0);
    case 'set-expression': {
      const expression = String(fields.value ?? '').trim();
      if (!expression) return fail('Escribe una expresión, por ejemplo: 8+3*2.');
      if (!/^[0-9+*/().\s×−-]+$/.test(expression)) return fail('Usa solamente números, paréntesis y operadores aritméticos.');
      const treeValues = expressionTreeFromInfix(expression);
      if (!treeValues) return fail('La expresión no es válida o está incompleta.');
      return done(treeValues, `Árbol creado desde ${expression}; cada operador quedó sobre sus operandos.`, 0);
    }
    case 'evaluate': {
      const expression = String(fields.value ?? '').trim();
      const treeValues = expression ? expressionTreeFromInfix(expression) : next;
      if (!treeValues) return fail('La expresión no es válida.');
      const result = evaluateExpressionTree(treeValues);
      if (!Number.isFinite(result)) return fail('La expresión no se puede evaluar.');
      return done(treeValues, `Resultado del árbol de expresión: ${result}.`, 0);
    }
    case 'hash-put':
    case 'cache-put': {
      const key = String(fields.value ?? '').trim();
      if (!key) return fail('Ingresa una clave.');
      const found = next.findIndex(item => String(item).split(':')[0] === key);
      if (actionId === 'hash-put' && algorithm.id !== 'hash-chaining' && found < 0 && next.length >= 12) {
        return fail('La tabla visual de direccionamiento abierto está llena (12 casillas). Elimina una clave antes de insertar otra.');
      }
      if (actionId === 'hash-put' && algorithm.id === 'hash-chaining' && found < 0 && next.length >= 24) {
        return fail('La demostración admite hasta 24 entradas distribuidas en sus cadenas.');
      }
      const entry = fields.second ? `${key}:${fields.second}` : key;
      if (found >= 0) next[found] = entry; else next.push(entry);
      if (actionId === 'cache-put' && next.length > 5) next.shift();
      return done(next, `${entry} fue guardado.`, Math.max(0,next.indexOf(entry)));
    }
    case 'cache-get': {
      const key = String(fields.value ?? '').trim();
      const found = next.findIndex(item => String(item).split(':')[0] === key);
      if (found < 0) return fail(`La clave ${key} no está en la caché.`);
      const [entry] = next.splice(found,1); next.push(entry);
      return done(next, `Get(${key}) = ${String(entry).split(':')[1] ?? entry}. Se marcó como reciente.`, next.length-1);
    }
    case 'vertex-add': {
      const label = String(fields.value ?? '').trim().toUpperCase();
      if (!label) return fail('Ingresa la etiqueta del nuevo vértice.');
      if (next.length >= 8) return fail('El grafo visual admite hasta 8 vértices.');
      if (next.includes(label)) return fail(`El vértice ${label} ya existe.`);
      next.push(label); return done(next, `Vértice ${label} agregado.`);
    }
    case 'vertex-remove': {
      const label = String(fields.value ?? '').trim().toUpperCase();
      const position = next.indexOf(label);
      if (position < 0) return fail(`El vértice ${label} no existe.`);
      next.splice(position,1);
      const updatedEdges = edges.filter(([from,to])=>from!==position&&to!==position).map(([from,to,weight])=>[from>position?from-1:from,to>position?to-1:to,weight]);
      return done(next, `Vértice ${label} y sus aristas fueron eliminados.`, 0, updatedEdges);
    }
    case 'edge-add':
    case 'edge-remove': {
      const from = next.indexOf(String(fields.value ?? '').trim().toUpperCase());
      const to = next.indexOf(String(fields.second ?? '').trim().toUpperCase());
      if (from < 0 || to < 0 || from === to) return fail('Origen y destino deben ser vértices distintos existentes.');
      const found = edges.findIndex(edge => (
        (edge[0] === from && edge[1] === to) || (algorithm.type !== 'digraph' && edge[0] === to && edge[1] === from)
      ));
      if (actionId === 'edge-remove') {
        if (found < 0) return fail('Esa arista no existe.');
        const updated = edges.filter((_,index)=>index!==found);
        return done(next, 'Arista eliminada.', 0, updated);
      }
      if (found >= 0) return fail('Esa arista ya existe.');
      const weight = fields.index === '' ? 1 : Number(fields.index);
      if (!Number.isFinite(weight)) return fail('El peso debe ser un número válido.');
      if (['dijkstra', 'a-star'].includes(algorithm.id) && weight < 0) return fail(`${algorithm.name} no admite pesos negativos.`);
      return done(next, `Arista agregada con peso ${weight}.`, 0, [...edges,[from,to,weight]]);
    }
    case 'shortest-path': {
      const result = runGridPathfinding({
        map: algorithm.map ?? DEFAULT_PATH_MAP,
        mode: algorithm.id === 'a-star' ? 'astar' : 'dijkstra',
      });
      const frames = result.frames.map(frame => ({
        ...frame,
        values: [...next],
        edges: edges.map(edge => [...edge]),
      }));
      return {
        ...done(next, frames.at(-1).message, result.map.goal),
        ok: result.found,
        frames,
        path: result.path,
        cost: result.cost,
      };
    }
    case 'bfs-run':
    case 'dfs-run': {
      const startLabel = String(fields.value ?? '').trim().toUpperCase() || String(next[0] ?? '');
      const start = next.findIndex(item => String(item).toUpperCase() === startLabel);
      if (start < 0) return fail(`El vértice ${startLabel || '(vacío)'} no existe.`);
      return graphTraversalTrace({
        algorithm,
        values: next,
        edges,
        start,
        depthFirst: actionId === 'dfs-run',
      });
    }
    case 'prim-run': {
      const startLabel = String(fields.value ?? '').trim().toUpperCase() || String(next[0] ?? '');
      const start = next.findIndex(item => String(item).toUpperCase() === startLabel);
      if (start < 0) return fail(`El vértice ${startLabel || '(vacío)'} no existe.`);
      return minimumSpanningTreeTrace({ algorithm, values: next, edges, start });
    }
    case 'kruskal-run': {
      return minimumSpanningTreeTrace({ algorithm, values: next, edges, start: 0 });
    }
    case 'shuffle': {
      const working = [...next];
      const frames = [];
      const addFrame = (codeNeedle, message, position, variables = []) => frames.push({
        values: [...working],
        edges: edges.map(edge => [...edge]),
        position,
        codeNeedle,
        message,
        variables,
      });
      for (let i = working.length - 1; i > 0; i--) {
        addFrame('for (int i = size - 1; i > 0; i--) {', `Fisher–Yates procesa el índice ${i}.`, i, [
          { name: 'i', value: i, role: 'index' },
        ]);
        const other = i === 1 ? 0 : Math.floor(Math.random() * (i + 1));
        addFrame('int other = (int) (Math.random() * (i + 1));', `Se elige el índice ${other} entre 0 y ${i}.`, other, [
          { name: 'i', value: i, role: 'index' },
          { name: 'other', value: other, role: 'index' },
        ]);
        const temporary = working[i];
        addFrame('int temp = values[i];', `temp guarda ${temporary}.`, i, [
          { name: 'temp', value: temporary, role: 'value' },
        ]);
        working[i] = working[other];
        addFrame('values[i] = values[other];', `values[${i}] recibe ${working[i]}.`, i, [
          { name: 'i', value: i, role: 'index' },
          { name: 'other', value: other, role: 'index' },
        ]);
        working[other] = temporary;
        addFrame('values[other] = temp;', `values[${other}] recibe ${temporary}; el intercambio queda visible.`, other, [
          { name: 'other', value: other, role: 'index' },
          { name: 'temp', value: temporary, role: 'value' },
        ]);
      }
      if (frames.length) frames.at(-1).completed = true;
      return { ...done(working, 'Valores mezclados con Fisher–Yates.', 0), frames };
    }
    case 'sort':
      if (algorithm.id === 'quick-sort') return executeQuickSort(next, edges);
      if (algorithm.id === 'merge-sort') return executeMergeSort(next, edges);
      return done([...next].sort((a,b)=>Number(a)-Number(b)), 'Arreglo ordenado de menor a mayor.', 0);
    case 'calculate': {
      if (String(fields.value ?? '').trim() === '') return fail('Ingresa un entero entre 0 y 20.');
      const number = Number(fields.value);
      if (!Number.isInteger(number) || number < 0 || number > 20) return fail('Ingresa un entero entre 0 y 20.');
      if (algorithm.id === 'fibonacci') return done(fibonacci(number), `Fibonacci(${number}) = ${fibonacci(number).at(-1)}.`, number);
      if (number === 0) return {
        ...done([1], 'Factorial(0) = 1 por definición.', 0),
        frames: [
          { values: [...next], edges, position: 0, codeNeedle: 'if (number == 0)', message: 'Se comprueba el caso especial 0!.' },
          { values: [1], edges, position: 0, codeNeedle: 'return new int[] {1};', message: 'Por definición, 0! es igual a 1.', completed: true },
        ],
      };
      const result = Array.from({length:number},(_,i)=>i+1).reduce((total,item)=>total*item,1);
      return done(Array.from({length:number},(_,i)=>Array.from({length:i+1},(_,j)=>j+1).reduce((a,b)=>a*b,1)), `Factorial(${number}) = ${result}.`, Math.max(0, number - 1));
    }
    case 'hanoi-set': {
      const disks = Math.max(1,Math.min(7,Number(fields.value)));
      if (!Number.isInteger(disks)) return fail('Ingresa entre 1 y 7 discos.');
      return done(Array.from({length:disks},(_,i)=>disks-i), `Torres creadas con ${disks} discos.`, 0);
    }
    case 'hanoi-solve': {
      if (!next.length) return fail('Primero crea al menos un disco.');
      const hanoi = solveHanoiWithTrace(next);
      return {
        ...done(hanoi.values, `Solución completa: ${hanoi.moves} movimientos.`, 0),
        frames: hanoi.frames,
      };
    }
    case 'solve': {
      if (algorithm.id === 'sudoku') {
        const board = [...next];
        const tracer = createSudokuTracer();
        const solved = solveSudoku(board, 0, 0, tracer);
        if (!solved) return fail('El tablero no tiene una solución válida.');
        return {
          ...done(board, 'Sudoku 9×9 resuelto con recursividad y backtracking.', 0),
          frames: completeSudokuTrace(tracer, board),
        };
      }
      if (algorithm.id === 'n-reinas') {
        const size = Math.max(4, Math.min(8, Number(fields.value) || next.length || 4));
        const queenResult = solveQueensWithTrace(size);
        if (!queenResult.solved) return fail(`No se encontró una solución para ${size} reinas.`);
        return {
          ...done(queenResult.values, `${size} reinas colocadas mediante llamadas recursivas y backtracking.`, 0),
          frames: queenResult.frames,
        };
      }
      if (algorithm.id === 'laberinto') {
        const mazeResult = solveMazeWithTrace(next.map(cell => cell === 1 ? 1 : 0));
        if (!mazeResult.solved) return fail('El laberinto no tiene una ruta válida hasta la salida.');
        return {
          ...done(mazeResult.values, 'Laberinto resuelto con recursividad y backtracking.', 0),
          frames: mazeResult.frames,
        };
      }
      return done(next, 'Solución completada mediante recursividad y backtracking.', Math.max(0,next.length-1));
    }
    case 'step-solution': {
      if (algorithm.id === 'sudoku') {
        const board = [...next];
        const tracer = createSudokuTracer();
        const solved = solveSudoku(board, 0, 0, tracer);
        if (!solved) return fail('El tablero no tiene una solución válida desde este estado.');
        return {
          ...done(board, 'Ejecución paso a paso del Sudoku preparada.', 0),
          frames: completeSudokuTrace(tracer, board),
        };
      }
      if (algorithm.id === 'n-reinas') {
        const size = Math.max(4, Math.min(8, Number(fields.value) || next.length || 4));
        const queenResult = solveQueensWithTrace(size);
        return {
          ...done(queenResult.values, `Ejecución paso a paso para ${size} reinas.`, 0),
          frames: queenResult.frames,
        };
      }
      if (algorithm.id === 'laberinto') {
        const mazeResult = solveMazeWithTrace(next.map(cell => cell === 1 ? 1 : 0));
        return {
          ...done(mazeResult.values, 'Ejecución paso a paso del laberinto.', 0),
          frames: mazeResult.frames,
        };
      }
      return done(next, `${algorithm.name}: se prueba una decisión; si no conduce a la solución, se deshace.`, (Date.now()/1000|0)%Math.max(1,next.length));
    }
    case 'union': {
      const first = Number(fields.value), second = Number(fields.second);
      if (![first,second].every(Number.isInteger) || first<0 || second<0 || first>=next.length || second>=next.length) return fail('Los elementos deben ser índices existentes.');
      const rootA = findRoot(next, first);
      const rootB = findRoot(next, second);
      if (rootA === rootB) return done(next, `${first} y ${second} ya pertenecen al conjunto con raíz ${rootA}.`, second);
      next[rootB] = rootA;
      return done(next, `${first} y ${second} ahora pertenecen al conjunto con raíz ${rootA}.`, second);
    }
    case 'find-root': {
      const element = Number(fields.value);
      if (!Number.isInteger(element)||element<0||element>=next.length) return fail('Ingresa un elemento existente.');
      const root = findRoot(next, element);
      let current = element;
      while (next[current] !== current) {
        const parent = next[current];
        next[current] = root;
        current = parent;
      }
      return done(next, `La raíz de ${element} es ${root}.`, element);
    }
    case 'bloom-add': {
      const text = String(fields.value ?? '').trim();
      if (!text) return fail('Ingresa un elemento.');
      const updated = [...next];
      const frames = [];
      [3,7,11].forEach((seed, iteration) => {
        const position = (text.length * seed + text.charCodeAt(0)) % updated.length;
        frames.push({ values: [...updated], edges, position, codeNeedle: 'for (int seed : seeds) {', message: `Hash ${iteration + 1} de 3: se usa la semilla ${seed}.`, variables: [{ name: 'seed', value: seed, role: 'value' }] });
        frames.push({ values: [...updated], edges, position, codeNeedle: 'int index = hash(word, seed);', message: `La función hash entrega el índice ${position}.`, variables: [{ name: 'seed', value: seed, role: 'value' }, { name: 'index', value: position, role: 'index' }] });
        updated[position] = 1;
        frames.push({ values: [...updated], edges, position, codeNeedle: 'bits[index] = true;', message: `bits[${position}] cambia a 1.`, variables: [{ name: 'index', value: position, role: 'index' }, { name: `bits[${position}]`, value: true, role: 'true' }] });
      });
      const message = `${text} fue agregado usando exactamente 3 funciones hash.`;
      if (frames.length) { frames.at(-1).message = message; frames.at(-1).completed = true; }
      return { ...done(updated, message, frames.at(-1)?.position ?? 0), frames };
    }
    case 'bloom-check': {
      const text = String(fields.value ?? '').trim();
      if (!text) return fail('Ingresa un elemento.');
      const frames = [];
      let missingIndex = -1;
      for (const [iteration, seed] of [3,7,11].entries()) {
        const position = (text.length * seed + text.charCodeAt(0)) % next.length;
        frames.push({ values: [...next], edges, position, codeNeedle: 'for (int seed : seeds) {', message: `Hash ${iteration + 1} de 3: se usa la semilla ${seed}.`, variables: [{ name: 'seed', value: seed, role: 'value' }] });
        frames.push({ values: [...next], edges, position, codeNeedle: 'int index = hash(word, seed);', message: `Se revisará bits[${position}].`, variables: [{ name: 'index', value: position, role: 'index' }] });
        const exists = next[position] === 1;
        frames.push({ values: [...next], edges, position, codeNeedle: 'if (!bits[index]) return false;', message: exists ? `bits[${position}] es 1; la búsqueda continúa.` : `bits[${position}] es 0; el elemento definitivamente no pertenece.`, variables: [{ name: `bits[${position}]`, value: Boolean(exists), role: exists ? 'true' : 'false' }] });
        if (!exists) { missingIndex = position; break; }
      }
      const belongs = missingIndex < 0;
      const message = belongs ? `${text} posiblemente pertenece al conjunto.` : `${text} definitivamente no pertenece al conjunto.`;
      if (belongs) frames.push({ values: [...next], edges, position: frames.at(-1)?.position ?? 0, codeNeedle: 'return true;', message, completed: true });
      else { frames.at(-1).message = message; frames.at(-1).completed = true; }
      return { ...done(next, message, frames.at(-1)?.position ?? 0), frames };
    }
    default: return fail('La operación todavía no está disponible.');
  }
}
