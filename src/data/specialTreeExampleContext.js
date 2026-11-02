import { createRedBlackTree } from '../logic/redBlackTree.js';
import { createMultiwayTree } from '../logic/multiwayTree.js';
import { createSpatialPartitionTree } from '../logic/spatialPartitionTree.js';
import { createFibonacciForest } from '../logic/fibonacciHeap.js';

// Assign pointers directly: the selected snippet need not include insertion.
export function seedSpecialTreeExample(source, algorithm, cpp = false) {
  const id = algorithm.id, values = algorithm.values ?? [], access = cpp ? '->' : '.';
  const lines = [];
  let serial = 0;
  const node = (args = '') => {
    const name = `seed${serial++}`;
    lines.push(`${cpp ? 'Node*' : 'Node'} ${name} = new Node(${args});`);
    return name;
  };
  const ctor = (prefix = '') => {
    const name = source.match(/(?:public )?class (\w+)/)[1];
    const body = lines.map(line => `        ${line}`).join('\n');
    if (!cpp) return source.replace(/}\s*$/, `    ${name}() {\n${body}\n    }\n}`);
    return source.replace(`${name}() = default;`, `${name}()${prefix} {\n${body}\n    }`);
  };
  if (id === 'rojo-negro') {
    const snapshot = createRedBlackTree(values, algorithm.treeColors).snapshot();
    const build = (i, parent = cpp ? 'nullptr' : 'null') => {
      if (!Number.isInteger(snapshot.values[i])) return 'nil';
      const current = node(`${snapshot.values[i]}, ${snapshot.colors[i] === 'red'}`);
      lines.push(`${current}${access}parent = ${parent};`);
      const left = build(i * 2 + 1, current), right = build(i * 2 + 2, current);
      lines.push(`${current}${access}left = ${left};`, `${current}${access}right = ${right};`);
      return current;
    };
    lines.push(`root = ${build(0)};`);
    return source.replace('        root = nil;', `        root = nil;\n${lines.map(line => `        ${line}`).join('\n')}`);
  }
  if (id === 'fibonacci-heap') {
    const forest = algorithm.fibonacciForest ?? createFibonacciForest(values).snapshot();
    const ring = (roots, parent = cpp ? 'nullptr' : 'null') => {
      const names = roots.map(root => {
        const current = node(root.value);
        lines.push(`${current}${access}parent = ${parent};`, `${current}${access}degree = ${root.children.length};`);
        if (root.children.length) {
          const children = ring(root.children, current);
          lines.push(`${current}${access}child = ${children[0]};`);
        }
        return current;
      });
      names.forEach((name, i) => lines.push(`${name}${access}left = ${names[(i + names.length - 1) % names.length]};`, `${name}${access}right = ${names[(i + 1) % names.length]};`));
      return names;
    };
    const roots = ring(forest.roots);
    if (roots.length) lines.push(`minimum = ${roots[forest.roots.reduce((best, root, i) => root.value < forest.roots[best].value ? i : best, 0)]};`);
    lines.push(`${cpp ? 'nodeCount' : 'size'} = ${serial};`);
    return ctor();
  }
  if (['btree', 'bplus-tree', 'bstar-tree'].includes(id)) {
    const tree = algorithm.multiwayTree ?? createMultiwayTree(id, values).snapshot();
    const leaves = [];
    const build = (model, parent = cpp ? 'nullptr' : 'null') => {
      const current = node(String(model.children.length === 0));
      lines.push(`${current}${access}keyCount = ${model.keys.length};`);
      model.keys.forEach((key, i) => lines.push(`${current}${access}keys[${i}] = ${key};`));
      if (/\bNode\*? parent;/.test(source)) lines.push(`${current}${access}parent = ${parent};`);
      model.children.forEach((child, i) => {
        const name = build(child, current);
        lines.push(`${current}${access}children[${i}] = ${name};`);
      });
      if (!model.children.length) leaves.push(current);
      return current;
    };
    const root = build(tree.root);
    if (cpp) lines.push('delete root;'); // Existing root is an empty leaf.
    lines.push(`root = ${root};`);
    if (id === 'bplus-tree') leaves.slice(0, -1).forEach((leaf, i) => lines.push(`${leaf}${access}next = ${leaves[i + 1]};`));
    return ctor();
  }
  if (['quadtree', 'octree'].includes(id)) {
    const tree = algorithm.spatialTree ?? createSpatialPartitionTree(id, values).snapshot();
    const dimensions = id === 'octree' ? 3 : 2;
    const build = model => {
      const current = node(model.bounds.flat().join(', '));
      lines.push(`${current}${access}${cpp ? 'divided' : 'isDivided'} = ${Boolean(model.children)};`, `${current}${access}pointCount = ${model.points.length};`);
      model.points.forEach((point, i) => {
        if (cpp) lines.push(`${current}->points[${i}] = Point{${point.join(', ')}};`);
        else {
          const name = `point${serial++}`;
          lines.push(`Point ${name} = new Point();`);
          ['x', 'y', 'z'].slice(0, dimensions).forEach((axis, j) => lines.push(`${name}.${axis} = ${point[j]};`));
          lines.push(`${current}.points[${i}] = ${name};`);
        }
      });
      model.children?.forEach((child, i) => {
        const name = build(child);
        lines.push(`${current}${access}children[${i}] = ${name};`);
      });
      return current;
    };
    const root = build(tree);
    if (cpp) lines.push('delete root;');
    else if (!/^\s*Node root[; =]/m.test(source)) source = source.replace(/}\s*$/, '    Node root;\n}');
    lines.push(`root = ${root};`);
    return ctor();
  }
  if (id === 'merkle-tree') {
    values.forEach((value, i) => lines.push(`blocks[${i}] = ${JSON.stringify(String(value))};`));
    lines.push(`size = ${values.length};`);
    if (!cpp) return ctor();
    return source.replace('MerkleTree() : blocks(new std::string[CAPACITY]) {}', `MerkleTree() : blocks(new std::string[CAPACITY]) {\n${lines.map(line => `        ${line}`).join('\n')}\n    }`);
  }
  if (['kd-tree', 'expression-tree', 'ast', 'arbol-enhebrado'].includes(id)) {
    const threaded = id === 'arbol-enhebrado', names = new Map();
    values.forEach((value, i) => {
      if (value === undefined || value === null) return;
      const args = id === 'ast' ? JSON.stringify(value) : id === 'expression-tree' && !/^\d+$/.test(String(value)) ? `'${value}', ${cpp ? 'nullptr, nullptr' : 'null, null'}` : value;
      names.set(i, node(args));
    });
    if (!cpp && !/^\s*Node root[; =]/m.test(source)) source = source.replace(/}\s*$/, '    Node root;\n}');
    const inorder = [];
    const visit = i => { if (!names.has(i)) return; visit(i * 2 + 1); inorder.push(i); visit(i * 2 + 2); };
    visit(0);
    for (const [i, name] of names) {
      for (const [side, child] of [['left', i * 2 + 1], ['right', i * 2 + 2]]) {
        if (names.has(child)) {
          lines.push(`${name}${access}${side} = ${names.get(child)};`);
          if (threaded) lines.push(`${name}${access}${side}Thread = false;`);
        } else if (threaded) {
          const neighbor = inorder[inorder.indexOf(i) + (side === 'left' ? -1 : 1)];
          lines.push(`${name}${access}${side} = ${names.get(neighbor) ?? 'root'};`);
        }
      }
    }
    if (names.size) lines.push(threaded ? `root${access}left = ${names.get(0)};\n        root${access}leftThread = false;` : `root = ${names.get(0)};`);
    if (threaded) return source.replace(`        root${access}rightThread = false;`, `        root${access}rightThread = false;\n${lines.map(line => `        ${line}`).join('\n')}`);
    return ctor();
  }
  return source;
}
