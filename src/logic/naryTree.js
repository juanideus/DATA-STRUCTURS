export function initialNaryParents(id, values) {
  if (!['arbol-general', 'arbol-nario'].includes(id)) return null;
  const seed = id === 'arbol-nario'
    ? [-1, 0, 0, 0, 0, 1, 1, 2, 2, 3]
    : [-1, 0, 0, 0, 1, 1, 1, 2, 2, 3];
  return values.map((_, index) => seed[index] ?? 0);
}

export function naryChildren(parents, parent) {
  return parents.flatMap((value, index) => value === parent ? [index] : []);
}

export function removeNarySubtree(values, parents, target) {
  const removed = new Set();
  const visit = index => {
    removed.add(index);
    naryChildren(parents, index).forEach(visit);
  };
  visit(target);
  const survivors = values.flatMap((value, index) => removed.has(index) ? [] : [{ oldIndex: index, value }]);
  const indices = new Map(survivors.map((entry, index) => [entry.oldIndex, index]));
  return {
    values: survivors.map(entry => entry.value),
    parents: survivors.map(entry => entry.oldIndex === 0 ? -1 : indices.get(parents[entry.oldIndex])),
    removed: removed.size,
  };
}

export function naryTraversal(values, parents, mode) {
  const output = [];
  const visit = index => {
    const children = naryChildren(parents, index);
    if (mode === 'preorder') output.push(values[index]);
    if (mode === 'inorder') {
      if (children.length) visit(children[0]);
      output.push(values[index]);
      children.slice(1).forEach(visit);
    } else children.forEach(visit);
    if (mode === 'postorder') output.push(values[index]);
  };
  if (values.length) visit(0);
  return output;
}
