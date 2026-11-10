export const MAP_ROWS = 12;
export const MAP_COLUMNS = 22;

const DIRECTIONS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function indexOf(row, column, columns = MAP_COLUMNS) {
  return row * columns + column;
}

function coordinates(index, columns = MAP_COLUMNS) {
  return [Math.floor(index / columns), index % columns];
}

function cloneMap(map) {
  return {
    ...map,
    cells: map.cells.map((cell) => ({ ...cell })),
  };
}

export function createCityMap(seed = Date.now()) {
  const random = seededRandom(seed);
  const rows = MAP_ROWS;
  const columns = MAP_COLUMNS;
  const cells = Array.from({ length: rows * columns }, () => {
    const roll = random();
    if (roll < 0.22) return { kind: 'building', cost: Infinity };
    if (roll < 0.29) return { kind: 'park', cost: 1 };
    if (roll < 0.34) return { kind: 'water', cost: Infinity };
    return { kind: 'road', cost: 1 };
  });

  const startRow = Math.floor(random() * rows);
  const startColumn = Math.floor(random() * 3);
  const goalRow = Math.floor(random() * rows);
  const goalColumn = columns - 1 - Math.floor(random() * 3);
  const start = indexOf(startRow, startColumn, columns);
  const goal = indexOf(goalRow, goalColumn, columns);

  let row = startRow;
  let column = startColumn;
  cells[start] = { kind: 'road', cost: 1 };

  while (row !== goalRow || column !== goalColumn) {
    const canMoveRow = row !== goalRow;
    const canMoveColumn = column !== goalColumn;
    const moveRow = canMoveRow && (!canMoveColumn || random() < 0.42);

    if (moveRow) row += goalRow > row ? 1 : -1;
    else column += goalColumn > column ? 1 : -1;

    cells[indexOf(row, column, columns)] = { kind: 'road', cost: 1 };

    if (random() < 0.45) {
      const sideRow = Math.max(0, Math.min(rows - 1, row + (random() < 0.5 ? -1 : 1)));
      cells[indexOf(sideRow, column, columns)] = { kind: 'road', cost: 1 };
    }
  }

  cells[goal] = { kind: 'road', cost: 1 };

  return { rows, columns, cells, start, goal, seed };
}

export const DEFAULT_PATH_MAP = createCityMap(20260716);

export function createRandomPathMap(previousMap = DEFAULT_PATH_MAP) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = createCityMap(Math.floor(Math.random() * 2147483647));
    if (candidate.start !== previousMap.start && candidate.goal !== previousMap.goal) {
      return candidate;
    }
  }

  return createCityMap(Date.now() + 97);
}

function heuristic(from, to, columns, minimumStepCost) {
  const [fromRow, fromColumn] = coordinates(from, columns);
  const [toRow, toColumn] = coordinates(to, columns);
  return (Math.abs(fromRow - toRow) + Math.abs(fromColumn - toColumn)) * minimumStepCost;
}

function neighborsOf(position, map) {
  const [row, column] = coordinates(position, map.columns);
  return DIRECTIONS.map(([rowDelta, columnDelta]) => [row + rowDelta, column + columnDelta])
    .filter(([nextRow, nextColumn]) => (
      nextRow >= 0
      && nextRow < map.rows
      && nextColumn >= 0
      && nextColumn < map.columns
    ))
    .map(([nextRow, nextColumn]) => indexOf(nextRow, nextColumn, map.columns))
    .filter((next) => Number.isFinite(map.cells[next].cost) && map.cells[next].cost >= 0);
}

function reconstructPath(previous, start, goal) {
  const path = [];
  let current = goal;

  while (current !== -1) {
    path.unshift(current);
    if (current === start) return path;
    current = previous[current];
  }

  return [];
}

function mapFrame({ map, mode, current, open, closed, distance, minimumStepCost, message, codeLine, codePhase, neighbor = null, candidate = null, condition = null, path = [], delayMs }) {
  const h = current == null ? 0 : heuristic(current, map.goal, map.columns, minimumStepCost);
  const g = current == null ? 0 : distance[current];
  const [row, column] = current == null ? [null, null] : coordinates(current, map.columns);
  const algorithmName = mode === 'astar' ? 'A*' : 'Dijkstra';
  const javaNeedles = {
    'check-bounds': 'if (nextRow < 0 || nextRow >= rows) continue;',
    'check-obstacle': mode === 'astar' ? 'if (map[next] < 0 || closed[next]) continue;' : 'if (map[next] < 0 || visited[next]) continue;',
    neighbors: 'for (int i = 0; i < 4; i++) {',
    'skip-neighbor': mode === 'astar' ? 'if (map[next] < 0 || closed[next]) continue;' : 'if (map[next] < 0 || visited[next]) continue;',
    candidate: mode === 'astar' ? 'int newG = g[current] + map[next];' : 'int newDistance = distance[current] + map[next];',
    'compare-distance': mode === 'astar' ? 'if (newG < g[next]) {' : 'if (newDistance < distance[next]) {',
    relax: mode === 'astar' ? 'g[next] = newG;' : 'distance[next] = newDistance;',
    'set-previous': 'previous[next] = current;',
    'set-score': 'f[next] = newG + heuristic(next, goal, columns, minCost);',
  };

  return {
    position: current ?? 0,
    codeLine,
    codeNeedle: javaNeedles[codePhase],
    codePhase,
    delayMs: delayMs ?? (path.length > 0 ? 520 : closed.size === 0 ? 320 : 90),
    message,
    mapState: {
      mode,
      start: map.start,
      goal: map.goal,
      current,
      open: [...open],
      closed: [...closed],
      path: [...path],
      cost: path.length ? distance[map.goal] : null,
    },
    variables: [
      { name: 'algoritmo', value: algorithmName },
      { name: 'casilla', value: row == null ? '—' : `(${row}, ${column})` },
      ...(neighbor == null ? [] : [{ name: 'next', value: `(${coordinates(neighbor, map.columns).join(', ')})` }]),
      ...(candidate == null ? [] : [{ name: mode === 'astar' ? 'newG' : 'newDistance', value: candidate }]),
      ...(condition == null ? [] : [{ name: 'condición', value: condition }]),
      { name: 'distancia g', value: Number.isFinite(g) ? g : '∞' },
      ...(mode === 'astar' ? [
        { name: 'heurística h', value: h },
        { name: 'prioridad f', value: Number.isFinite(g) ? g + h : '∞' },
      ] : []),
      { name: 'frontera', value: open.size },
      { name: 'visitadas', value: closed.size },
    ],
  };
}

export function runGridPathfinding({ map = DEFAULT_PATH_MAP, mode = 'dijkstra' } = {}) {
  const cityMap = cloneMap(map);
  const total = cityMap.cells.length;
  const minimumCost = cityMap.cells.reduce((best, cell) => (
    Number.isFinite(cell.cost) && cell.cost >= 0 ? Math.min(best, cell.cost) : best
  ), Infinity);
  const minimumStepCost = Number.isFinite(minimumCost) ? minimumCost : 0;
  const distance = Array(total).fill(Infinity);
  const previous = Array(total).fill(-1);
  const open = new Set([cityMap.start]);
  const closed = new Set();
  const frames = [];
  distance[cityMap.start] = 0;

  frames.push(mapFrame({
    map: cityMap,
    minimumStepCost,
    mode,
    current: cityMap.start,
    open,
    closed,
    distance,
    codeLine: mode === 'astar' ? 13 : 10,
    codePhase: 'initialize',
    message: 'Comenzamos en la marca de inicio y preparamos las distancias.',
  }));

  while (open.size > 0) {
    let current = null;
    let bestPriority = Infinity;

    for (const candidate of open) {
      const priority = distance[candidate]
        + (mode === 'astar' ? heuristic(candidate, cityMap.goal, cityMap.columns, minimumStepCost) : 0);
      if (priority < bestPriority || (priority === bestPriority && (current === null || candidate < current))) {
        bestPriority = priority;
        current = candidate;
      }
    }

    frames.push(mapFrame({
      map: cityMap,
      minimumStepCost,
      mode,
      current,
      open,
      closed,
      distance,
      delayMs: 110,
      codeLine: mode === 'astar' ? 19 : 14,
      codePhase: 'select',
      message: mode === 'astar'
        ? 'Elegimos la casilla abierta con el menor valor f = g + h.'
        : 'Elegimos la casilla pendiente con la menor distancia conocida.',
    }));

    open.delete(current);
    closed.add(current);

    if (current === cityMap.goal) {
      frames.push(mapFrame({
        map: cityMap,
        minimumStepCost,
        mode,
        current,
        open,
        closed,
        distance,
        delayMs: 220,
        codeLine: mode === 'astar' ? 20 : 17,
        codePhase: 'goal',
        message: 'La casilla actual es la meta. Terminamos la exploración.',
      }));
      break;
    }

    frames.push(mapFrame({
      map: cityMap,
      minimumStepCost,
      mode,
      current,
      open,
      closed,
      distance,
      delayMs: 110,
      codeLine: mode === 'astar' ? 24 : 16,
      codePhase: 'close',
      message: mode === 'astar'
        ? 'Quitamos la casilla de abiertos y la guardamos en cerrados.'
        : 'Marcamos la casilla actual como visitada.',
    }));

    const [currentRow, currentColumn] = coordinates(current, cityMap.columns);
    for (const [rowDelta, columnDelta] of DIRECTIONS) {
      const nextRow = currentRow + rowDelta;
      const nextColumn = currentColumn + columnDelta;
      const inBounds = nextRow >= 0 && nextRow < cityMap.rows && nextColumn >= 0 && nextColumn < cityMap.columns;
      if (!inBounds) {
        frames.push(mapFrame({ map: cityMap, minimumStepCost, mode, current, open, closed, distance,
          codePhase: 'check-bounds', condition: false, delayMs: 110,
          message: `La posición (${nextRow}, ${nextColumn}) está fuera del mapa.` }));
        continue;
      }
      const neighbor = indexOf(nextRow, nextColumn, cityMap.columns);
      const base = { map: cityMap, minimumStepCost, mode, current, neighbor, open, closed, distance, delayMs: 110 };
      if (!Number.isFinite(cityMap.cells[neighbor].cost) || cityMap.cells[neighbor].cost < 0) {
        frames.push(mapFrame({ ...base, codePhase: 'check-obstacle', condition: false, message: 'La casilla es un obstáculo; se omite.' }));
        continue;
      }
      frames.push(mapFrame({ ...base, codePhase: 'neighbors', message: `Se examina la casilla vecina ${coordinates(neighbor, cityMap.columns).join(', ')}.` }));
      if (closed.has(neighbor)) {
        frames.push(mapFrame({ ...base, codePhase: 'skip-neighbor', condition: false, message: 'La casilla ya está cerrada; se omite.' }));
        continue;
      }
      const candidate = distance[current] + cityMap.cells[neighbor].cost;
      const improves = candidate < distance[neighbor];
      frames.push(mapFrame({ ...base, codePhase: 'candidate', candidate, message: `El coste candidato para esta casilla es ${candidate}.` }));
      frames.push(mapFrame({ ...base, codePhase: 'compare-distance', candidate, condition: improves, message: improves ? 'El candidato mejora la distancia.' : 'El candidato no mejora la distancia.' }));
      if (improves) {
        distance[neighbor] = candidate;
        frames.push(mapFrame({ ...base, codePhase: 'relax', candidate, message: `La distancia de esta casilla cambia a ${candidate}.` }));
        previous[neighbor] = current;
        frames.push(mapFrame({ ...base, codePhase: 'set-previous', candidate, message: 'La casilla actual queda como predecesora.' }));
        open.add(neighbor);
        if (mode === 'astar') frames.push(mapFrame({ ...base, codePhase: 'set-score', candidate, message: 'Se actualiza la prioridad estimada.' }));
      }
    }
  }

  const found = Number.isFinite(distance[cityMap.goal]);
  const path = found ? reconstructPath(previous, cityMap.start, cityMap.goal) : [];

  frames.push(mapFrame({
    map: cityMap,
    minimumStepCost,
    mode,
    current: found ? cityMap.goal : null,
    open,
    closed,
    distance,
    path,
    codeLine: mode === 'astar' ? 20 : 37,
    codePhase: 'finish',
    message: found
      ? `Ruta encontrada: ${path.length} casillas y costo ${distance[cityMap.goal]}.`
      : 'No existe una ruta disponible entre el inicio y la meta.',
  }));

  return {
    found,
    path,
    cost: found ? distance[cityMap.goal] : Infinity,
    frames,
    map: cityMap,
  };
}
