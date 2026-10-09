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
  if (['arbol-general', 'arbol-nario'].includes(algorithm.id)) {
    return { ...definition, fields: [field('value', 'Valor', 'number'), field('second', 'Valor del padre', 'number')] };
  }
  if (group === 'spatial' && algorithm.id === 'quadtree') {
    return {
      ...definition,
      fields: [field('value', 'Coordenada X', 'number'), field('second', 'Coordenada Y', 'number')],
    };
  }
  if (group === 'spatial' && algorithm.id === 'octree') {
    return {
      ...definition,
      fields: [
        field('value', 'Coordenada X', 'number'),
        field('second', 'Coordenada Y', 'number'),
        field('index', 'Coordenada Z', 'number'),
      ],
    };
  }
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

export const initialUnionRanks = parents => {
  const ranks = Array(parents.length).fill(0);
  parents.forEach((_, index) => {
    let current = index;
    let depth = 0;
    const seen = new Set();
    while (parents[current] !== current && !seen.has(current) && depth < parents.length) {
      seen.add(current);
      current = parents[current];
      depth++;
    }
    if (current >= 0 && current < ranks.length) ranks[current] = Math.max(ranks[current], depth);
  });
  return ranks;
};

export const occupiedThreadedPosition = (values, index) => (
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

export const SPARSE_MATRIX_ROWS = 5;
export const SPARSE_MATRIX_COLUMNS = 6;
