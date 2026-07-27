const design = (label, caption, positions, edges, nodeMeta) => ({
  label,
  caption,
  positions,
  edges,
  nodeMeta,
});

export const GRAPH_DESIGNS = {
  grafo: design(
    'Red no dirigida',
    'Cada conexión puede recorrerse en ambos sentidos',
    [[50, 10], [82, 30], [77, 73], [50, 88], [18, 70], [22, 29], [50, 48], [50, 29]],
    [[0, 1, 4], [1, 2, 2], [2, 3, 6], [3, 4, 3], [4, 5, 5], [5, 0, 4], [0, 3, 7], [1, 4, 1]],
    ['grado 3', 'grado 3', 'grado 2', 'grado 3', 'grado 3', 'grado 2', 'nuevo', 'nuevo'],
  ),
  'grafo-dirigido': design(
    'Flujo dirigido',
    'Las flechas muestran exactamente hacia dónde se puede avanzar',
    [[9, 50], [34, 17], [34, 82], [65, 17], [65, 82], [91, 50], [50, 50], [79, 50]],
    [[0, 1, 4], [0, 2, 2], [1, 3, 3], [1, 4, 6], [2, 4, 1], [3, 5, 5], [4, 3, 2], [4, 5, 4]],
    ['entrada', 'etapa 1', 'etapa 1', 'etapa 2', 'etapa 2', 'salida', 'etapa 2', 'etapa 3'],
  ),
  dfs: design(
    'Exploración profunda',
    'La búsqueda baja por una rama antes de volver atrás',
    [[50, 9], [27, 34], [73, 34], [14, 70], [39, 70], [86, 70], [62, 70], [50, 90]],
    [[0, 1, 3], [1, 3, 5], [1, 4, 2], [0, 2, 4], [2, 5, 6], [4, 5, 7]],
    ['prof. 0', 'prof. 1', 'prof. 1', 'prof. 2', 'prof. 2', 'prof. 2', 'prof. 2', 'prof. 3'],
  ),
  bfs: design(
    'Expansión por niveles',
    'La cola descubre primero todos los vecinos cercanos',
    [[50, 50], [50, 10], [86, 33], [73, 84], [27, 84], [14, 33], [50, 28], [50, 73]],
    [[0, 1, 2], [0, 2, 4], [0, 3, 3], [0, 4, 5], [0, 5, 1], [1, 2, 6], [3, 4, 2]],
    ['nivel 0', 'nivel 1', 'nivel 1', 'nivel 1', 'nivel 1', 'nivel 1', 'nivel 2', 'nivel 2'],
  ),
  prim: design(
    'Árbol en crecimiento',
    'Se incorpora la arista más barata conectada al árbol actual',
    [[11, 20], [45, 9], [84, 24], [21, 78], [55, 55], [88, 82], [68, 88], [34, 40]],
    [[0, 1, 4], [0, 3, 7], [1, 2, 3], [1, 4, 2], [2, 4, 6], [2, 5, 8], [3, 4, 1], [4, 5, 5]],
    ['inicio', 'candidato', 'fuera', 'fuera', 'frontera', 'fuera', 'fuera', 'frontera'],
  ),
  kruskal: design(
    'Aristas por costo',
    'Se ordenan los pesos y se unen componentes sin crear ciclos',
    [[10, 34], [33, 10], [36, 69], [62, 38], [82, 12], [90, 78], [56, 83], [72, 66]],
    [[0, 1, 4], [0, 2, 2], [1, 2, 7], [1, 3, 3], [2, 3, 5], [3, 4, 1], [3, 5, 6], [4, 5, 8]],
    ['comp. A', 'comp. B', 'comp. C', 'comp. D', 'comp. E', 'comp. F', 'comp. G', 'comp. H'],
  ),
};

export function getGraphDesign(algorithmId) {
  return GRAPH_DESIGNS[algorithmId] ?? GRAPH_DESIGNS.grafo;
}

export function graphPositionsFor(algorithmId, jitter = false) {
  const positions = getGraphDesign(algorithmId).positions;
  if (!jitter) return positions.map(position => [...position]);
  return positions.map(([x, y]) => [
    Math.max(7, Math.min(93, x + Math.round((Math.random() - 0.5) * 8))),
    Math.max(8, Math.min(90, y + Math.round((Math.random() - 0.5) * 8))),
  ]);
}

export function graphEdgesFor(algorithmId, randomizeWeights = false) {
  return getGraphDesign(algorithmId).edges.map(([from, to, weight]) => [
    from,
    to,
    randomizeWeights ? Math.floor(Math.random() * 9) + 1 : weight,
  ]);
}
