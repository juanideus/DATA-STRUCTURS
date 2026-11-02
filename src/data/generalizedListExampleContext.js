export function seedGeneralizedListExample(source, algorithm, cpp = false) {
  if (algorithm.id !== 'listas-generalizadas') return source;
  const lines = [], names = new Map();
  const access = cpp ? '->' : '.';
  const create = model => {
    if (names.has(model)) return names.get(model);
    const name = `seed${names.size}`;
    names.set(model, name);
    lines.push(`${cpp ? 'Node*' : 'Node'} ${name} = new Node();`);
    return name;
  };
  const build = list => {
    if (names.has(list)) return names.get(list);
    const header = create(list);
    lines.push(`${header}${access}tag = REFERENCE;`, `${header}${access}ref = ${list.refs ?? 1};`);
    let previous = header;
    for (const item of list.items) {
      const node = create(item);
      lines.push(`${previous}${access}link = ${node};`);
      if (item.kind === 'atom') lines.push(`${node}${access}tag = ATOM;`, `${node}${access}data = '${item.value}';`);
      else {
        const child = build(item.list);
        lines.push(`${node}${access}tag = SUBLIST;`, `${node}${access}dlink = ${child};`);
      }
      previous = node;
    }
    return header;
  };
  if (algorithm.values?.[0]) lines.push(`root = ${build(algorithm.values[0])};`);
  const constructor = `GeneralizedList() {\n${lines.map(line => `        ${line}`).join('\n')}\n    }`;
  return cpp ? source.replace('GeneralizedList() = default;', constructor) : source.replace(/}\s*$/, `    ${constructor}\n}`);
}
