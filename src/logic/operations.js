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
  const numbers = current.length === 0 || current.every(value => typeof value === 'number');
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

const canPlaceSudoku = (board, position, number) => {
  const row = Math.floor(position / 9);
  const column = position % 9;
  for (let index = 0; index < 9; index++) {
    if (board[row * 9 + index] === number) return false;
    if (board[index * 9 + column] === number) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxColumn; c < boxColumn + 3; c++) {
      if (board[r * 9 + c] === number) return false;
    }
  }
  return true;
};

const solveSudoku = (board, position = 0, trace = null) => {
  if (position === 81) return true;
  if (board[position] !== 0) return solveSudoku(board, position + 1, trace);
  for (let number = 1; number <= 9; number++) {
    if (!canPlaceSudoku(board, position, number)) continue;
    board[position] = number;
    trace?.push({ values: [...board], position, codeLine: 9, message: `Se prueba ${number} en fila ${Math.floor(position / 9) + 1}, columna ${position % 9 + 1}.` });
    if (solveSudoku(board, position + 1, trace)) return true;
    board[position] = 0;
    trace?.push({ values: [...board], position, codeLine: 11, message: `${number} bloqueó la solución. Se borra la celda y se retrocede.` });
  }
  return false;
};

const compactSudokuTrace = (trace, solvedBoard, initialBoard) => {
  const maximumFrames = 52;
  const initialFrame = { values: [...initialBoard], position: 0, codeLine: 0, message: 'Comienza la llamada recursiva solveSudoku(0, 0).' };
  if (trace.length <= maximumFrames) return [initialFrame, ...trace, { values: [...solvedBoard], position: 80, codeLine: 1, message: 'Caso base alcanzado: las 81 celdas están completas.' }];
  const first = trace.slice(0, 20);
  const last = trace.slice(-(maximumFrames - 22));
  const skipped = trace.length - first.length - last.length;
  const bridge = {
    values: [...first[first.length - 1].values],
    position: first[first.length - 1].position,
    codeLine: 7,
    message: `Se omiten ${skipped} intentos repetidos para mantener la animación breve.`,
  };
  return [initialFrame, ...first, bridge, ...last, { values: [...solvedBoard], position: 80, codeLine: 1, message: 'Caso base alcanzado: Sudoku 9×9 resuelto.' }];
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
  const trace = [{ values: [...maze], position: 0, codeLine: 0, message: 'Comienza resolverLaberinto(0, 0).' }];
  const directions = [[0,1],[1,0],[0,-1],[-1,0]]; // right, down, left, up

  const explore = (row, column) => {
    if (row < 0 || row >= 6 || column < 0 || column >= 6) return false;
    const position = row * 6 + column;
    if (maze[position] !== 0) return false;

    maze[position] = 2;
    trace.push({ values: [...maze], position, codeLine: 4, message: `Se marca la celda (${row + 1}, ${column + 1}) como parte del camino.` });
    if (position === 35) {
      trace.push({ values: [...maze], position, codeLine: 1, message: 'Caso base: se alcanzó la salida.' });
      return true;
    }

    for (let direction = 0; direction < directions.length; direction++) {
      const [rowChange, columnChange] = directions[direction];
      if (explore(row + rowChange, column + columnChange)) return true;
    }

    maze[position] = 3;
    trace.push({ values: [...maze], position, codeLine: 10, message: `Callejón sin salida en (${row + 1}, ${column + 1}): se deshace el paso y se vuelve atrás.` });
    return false;
  };

  return { solved: explore(0, 0), values: maze, frames: trace };
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

export function executeOperation({ algorithm, actionId, fields, values, edges, initialValues, initialEdges = DEFAULT_GRAPH_EDGES }) {
  const group = operationGroup(algorithm);
  if (group === 'sparseMatrix') return executeSparseMatrixOperation({ actionId, fields, values, edges });
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
      next.push(value); return done(next, `Nodo ${value} insertado en el siguiente espacio disponible.`);
    }
    case 'heap-add': {
      const maximum = algorithm.id === 'fibonacci-heap' ? 9 : 15;
      if (next.length >= maximum) return fail(`El heap visual admite hasta ${maximum} nodos.`);
      const minimumHeap = algorithm.id === 'fibonacci-heap';
      next.push(value); next.sort((a,b) => minimumHeap ? Number(a) - Number(b) : Number(b) - Number(a));
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
    case 'sort': return done([...next].sort((a,b)=>Number(a)-Number(b)), 'Arreglo ordenado de menor a mayor.', 0);
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
        const initialBoard = [...next];
        const board = [...next];
        const trace = [];
        const solved = solveSudoku(board, 0, trace);
        if (!solved) return fail('El tablero no tiene una solución válida.');
        return {
          ...done(board, 'Sudoku 9×9 resuelto con recursividad y backtracking.', 0),
          frames: compactSudokuTrace(trace, board, initialBoard),
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
        const initialBoard = [...next];
        const board = [...next];
        const trace = [];
        const solved = solveSudoku(board, 0, trace);
        if (!solved) return fail('El tablero no tiene una solución válida desde este estado.');
        return {
          ...done(board, 'Ejecución paso a paso del Sudoku preparada.', 0),
          frames: compactSudokuTrace(trace, board, initialBoard),
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
