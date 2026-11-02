// The editable example and the catalog's reset target are separate snapshots.
export function seedResetExample(source, algorithm, cpp = false) {
  const values = algorithm.initialValues ?? algorithm.values;
  if (!Array.isArray(values)) return source;
  if (['segment-tree', 'fenwick-tree'].includes(algorithm.id) || algorithm.id.endsWith('-sort')) {
    if (!/\bint(?:\[\]|\*) initialValues\b/.test(source)) return source;
    const lines = values.map((value, i) => `        initialValues[${i}] = ${value};`);
    lines.push(`        initialSize = ${values.length};`);
    const name = source.match(/(?:public )?class (\w+)/)[1];
    const start = source.indexOf(`${name}()`);
    const closing = start + source.slice(start).match(/^    }/m).index;
    return source.slice(0, closing) + lines.join('\n') + '\n' + source.slice(closing);
  }
  if (algorithm.id === 'laberinto' && /resetPath|void reset\(/.test(source)) {
    const side = Math.sqrt(values.length);
    if (!cpp) {
      const rows = Array.from({ length: side }, (_, i) => `{${values.slice(i * side, (i + 1) * side).map(v => v === 1 ? 1 : 0).join(', ')}}`);
      if (!/int\[\]\[\] maze =/.test(source)) source = source.replace(/}\s*$/, `    int[][] maze = new int[${side}][${side}];\n}`);
      return source.replace('path[row][column] = false;', 'maze[row][column] = initialMaze[row][column];\n            path[row][column] = false;')
        .replace(/}\s*$/, `    int[][] initialMaze = {${rows.join(', ')}};\n}`);
    }
    const assignments = values.map((value, i) => `    maze[${Math.floor(i / side)}][${i % side}] = ${value === 1 ? 1 : 0};`).join('\n');
    return source.replace('void reset() {\n        clearPath();', `void reset() {\n${assignments}\n        clearPath();`);
  }
  return source;
}
