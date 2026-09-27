// A small, serializable Fibonacci-heap forest for the visible demonstration.
// Insert only adds a root. Equal-degree trees are linked only after extract-min.
export function createFibonacciForest(values = [], previous = null) {
  const roots = previous?.roots
    ? structuredClone(previous.roots)
    : values.map((value, id) => ({ id, value: Number(value), children: [] }));
  let nextId = previous?.nextId ?? roots.length;
  const all = () => {
    const nodes = [];
    const visit = node => { nodes.push(node); node.children.forEach(visit); };
    roots.forEach(visit);
    return nodes;
  };
  const snapshot = () => ({ roots: structuredClone(roots), nextId });
  const insert = value => {
    roots.push({ id: nextId++, value: Number(value), children: [] });
    return snapshot();
  };
  const extractMinimum = () => {
    if (!roots.length) return null;
    let minimumIndex = 0;
    for (let index = 1; index < roots.length; index++) {
      if (roots[index].value < roots[minimumIndex].value) minimumIndex = index;
    }
    const [removed] = roots.splice(minimumIndex, 1);
    roots.push(...removed.children);
    const stages = [{ phase: 'promote', forest: snapshot(), removed: removed.value }];
    const byDegree = new Map();
    const work = roots.splice(0);
    for (let index = 0; index < work.length; index++) {
      const root = work[index];
      let current = root;
      while (byDegree.has(current.children.length)) {
        const degree = current.children.length;
        let other = byDegree.get(degree);
        byDegree.delete(degree);
        if (other.value < current.value) [current, other] = [other, current];
        current.children.push(other);
        stages.push({
          phase: 'link',
          forest: { roots: structuredClone([...byDegree.values(), current, ...work.slice(index + 1)]), nextId },
          parent: current.value,
          child: other.value,
        });
      }
      byDegree.set(current.children.length, current);
    }
    roots.push(...[...byDegree.entries()].sort(([a], [b]) => a - b).map(([, root]) => root));
    stages.push({ phase: 'settled', forest: snapshot() });
    return { removed: removed.value, forest: snapshot(), stages };
  };
  return { roots, all, snapshot, insert, extractMinimum };
}
