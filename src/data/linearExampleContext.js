const ids = new Set(['array', 'pila', 'cola', 'deque', 'lista-simple', 'lista-doble', 'lista-circular-simple', 'lista-circular-doble']);

// Seed the standalone example without calling a method that may not be included
// in the selected operation's snippet.
export function seedLinearExample(source, algorithm, cpp = false) {
  if (!ids.has(algorithm.id) || (!cpp && algorithm.id === 'array')) return source;
  const values = algorithm.values;
  if (!Array.isArray(values) || !values.every(Number.isInteger)) return source;
  const className = source.match(/(?:public )?class (\w+)/)?.[1];
  if (!className) return source;
  const list = algorithm.id.startsWith('lista-');
  const linked = list || algorithm.id === 'cola';
  const circular = algorithm.id.includes('circular');
  const doubly = algorithm.id.includes('doble');
  const lines = [];
  if (linked) {
    values.forEach((value, index) => {
      lines.push(`${cpp ? 'Node*' : 'Node'} seed${index} = new Node(${value});`);
      if (index) {
        lines.push(`seed${index - 1}${cpp ? '->' : '.'}next = seed${index};`);
        if (doubly) lines.push(`seed${index}${cpp ? '->' : '.'}prev = seed${index - 1};`);
      }
    });
    if (values.length) {
      lines.push(`${list ? 'head' : 'front'} = seed0;`);
      if (!list) lines.push(`rear = seed${values.length - 1};`);
      if (circular) lines.push(`seed${values.length - 1}${cpp ? '->' : '.'}next = seed0;`);
      if (circular && doubly) lines.push(`seed0${cpp ? '->' : '.'}prev = seed${values.length - 1};`);
    }
    lines.push(`size = ${values.length};`);
  } else {
    values.forEach((value, index) => lines.push(`values[${index}] = ${value};`));
    lines.push(algorithm.id === 'pila' ? `top = ${values.length - 1};` : `size = ${values.length};`);
  }
  const body = lines.map(line => `        ${line}`).join('\n');
  if (cpp) {
    const ctor = new RegExp(`${className}\\(\\) (?:= default;|: values\\(new int\\[CAPACITY\\]\\{\\}\\) \\{\\})`);
    const arrayCapacity = Math.max(100, values.length);
    const allocationCapacity = algorithm.id === 'array' && arrayCapacity > 100 ? arrayCapacity : 'CAPACITY';
    const allocation = linked ? '' : ` : values(new int[${allocationCapacity}]{})`;
    if (algorithm.id === 'array') lines.push(`capacity = ${arrayCapacity};`);
    return source.replace(ctor, `${className}()${allocation} {\n${lines.map(line => `        ${line}`).join('\n')}\n    }`);
  }
  return source.replace(/}\s*$/, `    ${className}() {\n${body}\n    }\n}`);
}
