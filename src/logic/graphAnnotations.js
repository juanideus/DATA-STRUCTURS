// Annotations describe the current graph/trace, never the decorative seed layout.
export function graphAnnotations({ values, edges, directed = false, state, language = 'es' }) {
  const en = language === 'en';
  const size = values.length;
  const validEdges = edges.filter(([a, b]) => a >= 0 && b >= 0 && a < size && b < size);
  const origin = ['bfs', 'dfs', 'prim'].includes(state?.mode) ? state.start : null;
  if (['bfs', 'dfs'].includes(state?.mode)) {
    const depths = new Map(Number.isInteger(origin) ? [[origin, 0]] : []);
    for (const [parent, child] of state.visitedEdges ?? []) {
      if (depths.has(parent) && !depths.has(child)) depths.set(child, depths.get(parent) + 1);
    }
    const label = state.mode === 'bfs' ? (en ? 'level' : 'nivel') : (en ? 'depth' : 'prof.');
    return { origin, labels: values.map((_, index) => depths.has(index)
      ? `${label} ${depths.get(index)}` : (en ? 'undiscovered' : 'sin descubrir')) };
  }
  if (state?.mode === 'prim') {
    const selected = new Set(state.treeVertices ?? []);
    return { origin, labels: values.map((_, index) => index === origin
      ? (en ? 'start' : 'inicio')
      : selected.has(index) ? (en ? 'in tree' : 'en árbol')
        : validEdges.some(([a, b]) => (a === index && selected.has(b)) || (b === index && selected.has(a)))
          ? (en ? 'frontier' : 'frontera') : (en ? 'outside' : 'fuera')) };
  }
  if (state?.mode === 'kruskal') {
    const parent = values.map((_, index) => index);
    const root = index => {
      while (parent[index] !== index) index = parent[index];
      return index;
    };
    for (const [a, b] of state.visitedEdges ?? []) {
      const first = root(a), second = root(b);
      parent[Math.max(first, second)] = Math.min(first, second);
    }
    return { origin: null, labels: values.map((_, index) => `comp. ${values[root(index)]}`) };
  }
  return { origin: null, labels: values.map((_, index) => directed
    ? `${en ? 'in' : 'ent.'} ${validEdges.filter(([, b]) => b === index).length} · ${en ? 'out' : 'sal.'} ${validEdges.filter(([a]) => a === index).length}`
    : `${en ? 'degree' : 'grado'} ${validEdges.reduce((count, [a, b]) => count + Number(a === index) + Number(b === index), 0)}`) };
}
