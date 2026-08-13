const copyEdges = edges => edges.map(edge => [...edge]);

function resultFor(kind, number) {
  if (kind === 'factorial') {
    let result = 1;
    for (let value = 2; value <= number; value++) result *= value;
    return result;
  }
  let previous = 0;
  let current = 1;
  for (let index = 0; index < number; index++) [previous, current] = [current, previous + current];
  return previous;
}

export function buildRecursionCallTree(kind, number, completed = true) {
  const nodes = [];
  const createNode = (value, parentId = null, depth = 0, branch = 'root') => {
    const id = nodes.length;
    const node = {
      id,
      parentId,
      number: value,
      depth,
      branch,
      children: [],
      status: completed ? 'returned' : 'pending',
      result: completed ? resultFor(kind, value) : null,
    };
    nodes.push(node);
    if (kind === 'fibonacci' && value > 1) {
      node.children.push(createNode(value - 1, id, depth + 1, 'left'));
      node.children.push(createNode(value - 2, id, depth + 1, 'right'));
    } else if (kind === 'factorial' && value > 1) {
      node.children.push(createNode(value - 1, id, depth + 1, 'child'));
    }
    return id;
  };

  const rootId = createNode(number);
  let leafIndex = 0;
  const placeNode = id => {
    const node = nodes[id];
    if (node.children.length === 0) {
      node.leaf = leafIndex++;
      return node.leaf;
    }
    const childPositions = node.children.map(placeNode);
    node.leaf = childPositions.reduce((total, position) => total + position, 0) / childPositions.length;
    return node.leaf;
  };
  placeNode(rootId);
  const leafCount = Math.max(1, leafIndex);
  const maxDepth = Math.max(0, ...nodes.map(node => node.depth));
  nodes.forEach(node => {
    node.x = ((node.leaf + 0.5) / leafCount) * 100;
    node.y = ((node.depth + 0.55) / (maxDepth + 1)) * 100;
  });
  return { kind, input: number, rootId, nodes, leafCount, maxDepth, activeId: null, phase: completed ? 'completed' : 'ready' };
}

export function createRecursionCallTrace({ kind, number, beforeValues, edges }) {
  const tree = buildRecursionCallTree(kind, number, false);
  const nodes = tree.nodes;
  const revealed = new Set();
  const frames = [];
  const methodName = kind === 'fibonacci' ? 'fibonacci' : 'factorial';
  const snapshot = (activeId, phase, codeNeedle, message, variables = [], completed = false) => {
    frames.push({
      values: completed ? [nodes[tree.rootId].result] : [...beforeValues],
      edges: copyEdges(edges),
      position: activeId,
      codeNeedle,
      message,
      completed,
      variables,
      recursionTree: {
        ...tree,
        activeId,
        phase,
        nodes: nodes.filter(node => revealed.has(node.id)).map(node => ({ ...node, children: [...node.children] })),
      },
    });
  };

  const evaluate = id => {
    const node = nodes[id];
    revealed.add(id);
    node.status = 'active';
    snapshot(id, 'call', `int ${methodName}(int number) {`, `Entra la llamada ${methodName}(${node.number}).`, [
      { name: 'number', value: node.number, role: 'input' },
      { name: 'profundidad', value: node.depth, role: 'size' },
    ]);

    node.status = 'checking';
    snapshot(id, 'check-base', 'if (number <= 1)', `${node.number} ${node.number <= 1 ? 'sí' : 'no'} cumple el caso base number <= 1.`, [
      { name: 'number', value: node.number, role: 'input' },
      { name: 'number <= 1', value: node.number <= 1, role: node.number <= 1 ? 'true' : 'false' },
    ]);

    if (node.number <= 1) {
      node.result = kind === 'fibonacci' ? node.number : 1;
      node.status = 'returned';
      const baseNeedle = kind === 'fibonacci' ? 'if (number <= 1) return number;' : 'if (number <= 1) return 1;';
      snapshot(id, 'base-return', baseNeedle, `${methodName}(${node.number}) retorna ${node.result}; la rama termina aquí.`, [
        { name: 'return', value: node.result, role: 'value' },
      ], id === tree.rootId);
      return node.result;
    }

    node.status = 'waiting';
    if (kind === 'fibonacci') {
      snapshot(id, 'call-left', 'int left = fibonacci(number - 1);', `${methodName}(${node.number}) llama primero a fibonacci(${node.number - 1}).`, [
        { name: 'number', value: node.number, role: 'input' },
        { name: 'number - 1', value: node.number - 1, role: 'value' },
      ]);
      const left = evaluate(node.children[0]);
      node.status = 'waiting';
      snapshot(id, 'call-right', 'int right = fibonacci(number - 2);', `La rama izquierda devolvió ${left}; ahora llama a fibonacci(${node.number - 2}).`, [
        { name: 'left', value: left, role: 'value' },
        { name: 'number - 2', value: node.number - 2, role: 'value' },
      ]);
      const right = evaluate(node.children[1]);
      node.result = left + right;
      node.status = 'returned';
      snapshot(id, 'return', 'return left + right;', `fibonacci(${node.number}) suma ${left} + ${right} y retorna ${node.result}.`, [
        { name: 'left', value: left, role: 'value' },
        { name: 'right', value: right, role: 'value' },
        { name: 'return', value: node.result, role: 'value' },
      ], id === tree.rootId);
      return node.result;
    }

    snapshot(id, 'recursive-call', 'int smaller = factorial(number - 1);', `factorial(${node.number}) queda esperando y llama a factorial(${node.number - 1}).`, [
      { name: 'number', value: node.number, role: 'input' },
      { name: 'number - 1', value: node.number - 1, role: 'value' },
    ]);
    const smaller = evaluate(node.children[0]);
    node.result = node.number * smaller;
    node.status = 'returned';
    snapshot(id, 'return', 'return number * smaller;', `factorial(${node.number}) multiplica ${node.number} × ${smaller} y retorna ${node.result}.`, [
      { name: 'number', value: node.number, role: 'input' },
      { name: 'smaller', value: smaller, role: 'value' },
      { name: 'return', value: node.result, role: 'value' },
    ], id === tree.rootId);
    return node.result;
  };

  const result = evaluate(tree.rootId);
  return { result, frames, tree };
}
