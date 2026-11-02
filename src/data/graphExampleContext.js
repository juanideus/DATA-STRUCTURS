import { graphEdgesFor } from './graphDesigns.js';
import { DEFAULT_PATH_MAP } from '../logic/pathfindingMap.js';

export function seedGraphExample(source, algorithm, cpp = false) {
  const id = algorithm.id;
  if (['dijkstra', 'a-star'].includes(id)) {
    const map = algorithm.map ?? DEFAULT_PATH_MAP;
    const cells = map.cells.map(cell => Number.isFinite(cell.cost) ? cell.cost : -1);
    if (cpp) {
      return source.replace('        for (int cell = 0; cell < CELL_COUNT; cell++) {\n            int value = cells == nullptr ? 1 : cells[cell];', `        int* startingMap = new int[CELL_COUNT]{${cells.join(', ')}};\n        for (int cell = 0; cell < CELL_COUNT; cell++) {\n            int value = cells == nullptr ? startingMap[cell] : cells[cell];`)
        .replace('        resetSearchStorage();\n    }\n\n    ~', '        delete[] startingMap;\n        resetSearchStorage();\n    }\n\n    ~')
        .replace('int minStepCost = 0;', `int start = ${map.start};\n    int goal = ${map.goal};\n    int minStepCost = 0;`);
    }
    // Java search methods accept their map as an argument; expose the exact
    // input alongside the method so the standalone example can reproduce it.
    return source.replace(/int rows = 9;/, `int rows = ${map.rows};`)
      .replace(/int columns = 9;/, `int columns = ${map.columns};`)
      .replace(/}\s*$/, `    int[] map = {${cells.join(', ')}};\n    int start = ${map.start};\n    int goal = ${map.goal};\n}`);
  }
  if (!['grafo', 'grafo-dirigido', 'bfs', 'dfs', 'prim', 'kruskal'].includes(id)) return source;
  const values = algorithm.values ?? [];
  const edges = (algorithm.edges ?? graphEdgesFor(id)).filter(([a, b]) => a < values.length && b < values.length);
  const weighted = ['prim', 'kruskal'].includes(id);
  const lines = [`vertexCount = ${values.length};`];
  values.forEach((value, i) => lines.push(`vertexNames[${i}] = ${cpp ? `'${value}'` : JSON.stringify(value)};`));
  edges.forEach(([a, b, weight], i) => {
    const field = weighted ? 'weights' : 'adjacency';
    const value = weighted ? weight : 'true';
    if (id !== 'kruskal' || cpp) {
      lines.push(`${field}[${a}][${b}] = ${value};`);
      if (id !== 'grafo-dirigido') lines.push(`${field}[${b}][${a}] = ${value};`);
    }
    if (id === 'kruskal') lines.push(cpp ? `edges[${i}] = Edge{${a}, ${b}, ${weight}};` : `edges[${i}] = new Edge(${a}, ${b}, ${weight});`);
  });
  if (id === 'kruskal') lines.push(`edgeCount = ${edges.length};`);
  const body = lines.map(line => `        ${line}`).join('\n');
  if (!cpp && id !== 'prim') {
    const name = source.match(/class (\w+)/)[1];
    return source.replace(/}\s*$/, `    ${name}() {\n${body}\n    }\n}`);
  }
  const start = source.indexOf(cpp ? '        : vertexNames' : '    PrimGraph()');
  const end = start + source.slice(start).match(/^    }/m).index;
  return source.slice(0, end) + body + '\n' + source.slice(end);
}
