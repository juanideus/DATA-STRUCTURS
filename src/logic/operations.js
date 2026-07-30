import { DEFAULT_PATH_MAP, runGridPathfinding } from './pathfindingMap.js';

export const DEFAULT_GRAPH_EDGES = [
  [0, 1, 4], [1, 2, 2], [0, 3, 7], [1, 3, 3], [1, 4, 5],
  [2, 4, 6], [3, 4, 1], [4, 5, 4], [2, 5, 8],
];

export const DEFAULT_GRAPH_POSITIONS = [[14,24],[42,12],[72,20],[90,48],[72,76],[42,68],[14,76],[7,48]];

const field = (id, label, type = 'text') => ({ id, label, type });
const action = (id, label, tone = 'default') => ({ id, label, tone });

const definitions = {
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
};

export function operationGroup(algorithm) {
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

const graphTraversal = (values, edges, start, depthFirst, directed) => {
  const adjacency = Array.from({ length: values.length }, () => []);
  edges.forEach(([from, to]) => {
    if (from >= values.length || to >= values.length) return;
    adjacency[from].push(to);
    if (!directed) adjacency[to].push(from);
  });
  const visited = new Set();
  const result = [];
  if (depthFirst) {
    const visit = vertex => {
      if (visited.has(vertex)) return;
      visited.add(vertex);
      result.push(values[vertex]);
      adjacency[vertex].forEach(visit);
    };
    visit(start);
  } else {
    const pending = [start];
    visited.add(start);
    while (pending.length) {
      const vertex = pending.shift();
      result.push(values[vertex]);
      adjacency[vertex].forEach(next => {
        if (visited.has(next)) return;
        visited.add(next);
        pending.push(next);
      });
    }
  }
  return result;
};

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

export function executeOperation({ algorithm, actionId, fields, values, edges, initialValues, initialEdges = DEFAULT_GRAPH_EDGES }) {
  const group = operationGroup(algorithm);
  if (group === 'sparseMatrix') return executeSparseMatrixOperation({ actionId, fields, values, edges });
  if (group === 'threadedTree') return executeThreadedTreeOperation({ actionId, fields, values, initialValues, edges });
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
        next.push(word);
        return done(next, `La palabra ${word} fue insertada en el Trie.`, next.length - 1);
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
      const order = graphTraversal(next, edges, start, actionId === 'dfs-run', algorithm.type === 'digraph');
      return done(next, `${actionId === 'bfs-run' ? 'BFS' : 'DFS'} desde ${startLabel}: ${order.join(' → ')}.`, start);
    }
    case 'shuffle': return done([...next].sort(()=>Math.random()-.5), 'Valores mezclados.', 0);
    case 'sort':
      if (algorithm.id === 'quick-sort') return executeQuickSort(next, edges);
      if (algorithm.id === 'merge-sort') return executeMergeSort(next, edges);
      return done([...next].sort((a,b)=>Number(a)-Number(b)), 'Arreglo ordenado de menor a mayor.', 0);
    case 'calculate': {
      if (String(fields.value ?? '').trim() === '') return fail('Ingresa un entero entre 0 y 20.');
      const number = Number(fields.value);
      if (!Number.isInteger(number) || number < 0 || number > 20) return fail('Ingresa un entero entre 0 y 20.');
      if (algorithm.id === 'fibonacci') return done(fibonacci(number), `Fibonacci(${number}) = ${fibonacci(number).at(-1)}.`);
      const result = Array.from({length:number},(_,i)=>i+1).reduce((total,item)=>total*item,1);
      return done(Array.from({length:Math.min(number,8)},(_,i)=>Array.from({length:i+1},(_,j)=>j+1).reduce((a,b)=>a*b,1)), `Factorial(${number}) = ${result}.`);
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
      [3,7,11].forEach(seed=>updated[(text.length*seed+text.charCodeAt(0))%updated.length]=1);
      return done(updated, `${text} fue agregado usando 3 funciones hash.`, 0);
    }
    case 'bloom-check': {
      const text = String(fields.value ?? '').trim();
      if (!text) return fail('Ingresa un elemento.');
      const indexes=[3,7,11].map(seed=>(text.length*seed+text.charCodeAt(0))%next.length);
      return done(next, indexes.every(index=>next[index]===1) ? `${text} posiblemente pertenece al conjunto.` : `${text} definitivamente no pertenece al conjunto.`, indexes[0]);
    }
    default: return fail('La operación todavía no está disponible.');
  }
}
