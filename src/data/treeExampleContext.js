import { initialNaryParents } from '../logic/naryTree.js';

export function seedTreeExample(source, algorithm, cpp = false) {
  if (!['arbol-general', 'arbol-nario'].includes(algorithm.id)) return source;
  const values = algorithm.values ?? [];
  const parents = algorithm.treeParents ?? initialNaryParents(algorithm.id, values);
  const access = cpp ? '->' : '.';
  const lines = values.map((value, i) => `${cpp ? 'Node*' : 'Node'} seed${i} = new Node(${value});`);
  if (values.length) lines.push('root = seed0;');
  const counts = new Map();
  parents.forEach((parent, i) => {
    if (parent < 0) return;
    const count = counts.get(parent) ?? 0;
    if (algorithm.id === 'arbol-general' && !cpp) lines.push(`seed${parent}.children.add(seed${i});`);
    else {
      if (algorithm.id === 'arbol-general' && cpp && count >= 4) lines.push(`if (seed${parent}->childCount == seed${parent}->capacity) seed${parent}->growChildren();`);
      lines.push(`seed${parent}${access}children[${count}] = seed${i};`, `seed${parent}${access}childCount++;`);
    }
    counts.set(parent, count + 1);
  });
  const name = source.match(/class (\w+)/)[1];
  const constructor = `${name}() {\n${lines.map(line => `        ${line}`).join('\n')}\n    }`;
  return cpp ? source.replace(`${name}() = default;`, constructor) : source.replace(/}\s*$/, `    ${constructor}\n}`);
}
