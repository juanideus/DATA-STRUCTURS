export const DEFAULT_GRAPH_EDGES = [
  [0, 1, 4], [1, 2, 2], [0, 3, 7], [1, 3, 3], [1, 4, 5],
  [2, 4, 6], [3, 4, 1], [4, 5, 4], [2, 5, 8],
];

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
    actions: [action('add-start', 'Insertar inicio'), action('add-end', 'Insertar final'), action('add-index', 'Insertar en índice'), action('remove-value', 'Eliminar valor', 'danger'), action('find', 'Buscar')],
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
};

export function operationGroup(algorithm) {
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
  return definitions[operationGroup(algorithm)];
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

const solveHanoiWithTrace = diskValues => {
  const disks = diskValues
    .map(item => typeof item === 'object' ? Number(item.size) : Number(item))
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  const positions = disks.map(size => ({ size, rod: 0 }));
  const frames = [{
    values: positions.map(disk => ({ ...disk })),
    position: 0,
    codeLine: 0,
    message: `Comienza Hanoi con ${disks.length} discos en la torre A.`,
  }];
  const names = ['A', 'B', 'C'];
  const move = (amount, from, to, help) => {
    if (amount === 0) return;
    move(amount - 1, from, help, to);
    const disk = positions.find(item => item.size === amount);
    disk.rod = to;
    frames.push({
      values: positions.map(item => ({ ...item })),
      position: amount,
      codeLine: 3,
      message: `Mover disco ${amount} desde ${names[from]} hasta ${names[to]}.`,
    });
    move(amount - 1, help, to, from);
  };
  move(disks.length, 0, 2, 1);
  return { values: positions, frames };
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

export function executeOperation({ algorithm, actionId, fields, values, edges, initialValues }) {
  const group = operationGroup(algorithm);
  const next = [...values];
  const forceText = ['merkle', 'spatial', 'hash', 'cache'].includes(group);
  const value = numericValue(fields.value ?? '', values, forceText);
  const index = validIndex(fields.index ?? '', values.length, actionId === 'add-index');
  const fail = message => ({ values, edges, message, step: 0 });
  const done = (updated, message, step = Math.max(0, updated.length - 1), updatedEdges = edges) => ({ values: updated, edges: updatedEdges, message, step });

  if (actionId === 'reset') return done([...initialValues], 'Estructura restablecida a su estado inicial.', 0, DEFAULT_GRAPH_EDGES.map(edge => [...edge]));
  if (actionId === 'clear') return done([], 'Estructura vaciada.', 0);
  if (actionId === 'clear-bits') return done(values.map(() => 0), 'Todos los bits fueron limpiados.', 0);
  if (['add-start','add-end','add-index','push','enqueue','sorted-add','tree-add','heap-add'].includes(actionId) && value === null) return fail('Ingresa un valor válido antes de ejecutar la operación.');
  if (group === 'merkle' && actionId === 'add-end' && next.length >= 8) return fail('La demostración Merkle admite hasta 8 bloques visibles.');
  if (group === 'btree' && actionId === 'sorted-add' && next.length >= 9) return fail('El árbol multicamino admite hasta 9 claves en esta demostración.');

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
      const found = next.findIndex(item => (
        ['hash', 'cache'].includes(group) ? entryKey(item) === String(value) : String(item) === String(value)
      ));
      if (found < 0) return fail(`${value} no existe en la estructura.`);
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
      next.push(value); next.sort((a,b) => Number(a) - Number(b));
      return done(next, `${value} fue insertado manteniendo el orden.`, next.indexOf(value));
    }
    case 'tree-add': {
      const maximum = ['arbol-general','arbol-nario'].includes(algorithm.id) ? 10 : group === 'spatial' ? 12 : 15;
      if (next.length >= maximum) return fail(`La demostración admite hasta ${maximum} nodos visibles.`);
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
      const found = next.findIndex(item => (
        ['hash', 'cache'].includes(group) ? entryKey(item) === String(value) : String(item) === String(value)
      ));
      return found < 0 ? fail(`${value} no fue encontrado.`) : done(next, `${value} fue encontrado en la posición ${found}.`, found);
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
      return done(expression.replace(/\s/g,'').split('').slice(0,7), `Árbol creado desde ${expression}.`, 0);
    }
    case 'evaluate': {
      const expression = (String(fields.value ?? '').trim() || next.join('')).replaceAll('×', '*').replaceAll('−', '-');
      if (!/^[0-9+*/().\s-]+$/.test(expression)) return fail('Usa solamente números, paréntesis y operadores aritméticos.');
      try { return done(next, `Resultado de ${expression}: ${Function(`"use strict"; return (${expression})`)()}.`, 0); }
      catch { return fail('La expresión no es válida.'); }
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
      if (algorithm.id === 'dijkstra' && weight < 0) return fail('Dijkstra no admite pesos negativos.');
      return done(next, `Arista agregada con peso ${weight}.`, 0, [...edges,[from,to,weight]]);
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
        ...done(hanoi.values, `Solución completa: ${hanoi.frames.length - 1} movimientos.`, 0),
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
