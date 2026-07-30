export const GENERALIZED_LIST_EXAMPLES = [
  '((a,b),((c,d),e))',
  '(a,(b,c,d),e,(f,g))',
  '((a),(b,(c,d)),e)',
  '(a,(b,(c)),d)',
];

class GeneralizedListParser {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.atomCount = 0;
    this.events = [];
  }

  current() {
    return this.position < this.source.length ? this.source[this.position] : '\0';
  }

  skipSpaces() {
    while (/\s/.test(this.current())) this.position++;
  }

  expect(expected) {
    this.skipSpaces();
    if (this.current() !== expected) {
      throw new Error(`Se esperaba '${expected}' en la posición ${this.position + 1}.`);
    }
    this.position++;
  }

  readAtom() {
    this.skipSpaces();
    const atom = this.current();
    if (!/[a-z0-9]/.test(atom)) {
      throw new Error(`Se esperaba un átomo minúsculo en la posición ${this.position + 1}.`);
    }
    this.position++;
    this.atomCount++;
    if (this.atomCount > 20) throw new Error('La demostración admite hasta 20 átomos visibles.');
    return atom;
  }

  parseElement(path, depth) {
    this.skipSpaces();
    if (this.current() === '(') {
      const list = this.parseList(`${path}.list`, depth + 1);
      const item = { kind: 'sublist', list };
      this.events.push({
        path,
        kind: 'sublista',
        value: generalizedListToString(list),
        codeNeedle: 'return Node.sublistNode(parseList());',
      });
      return item;
    }
    const value = this.readAtom();
    const item = { kind: 'atom', value };
    this.events.push({
      path,
      kind: 'átomo',
      value,
      codeNeedle: 'return Node.atomNode(readAtom());',
    });
    return item;
  }

  parseList(path = 'root', depth = 1) {
    if (depth > 4) throw new Error('La lista supera cuatro niveles de profundidad visibles.');
    this.expect('(');
    const list = { kind: 'list', refs: 1, aliases: depth === 1 ? ['A'] : [], items: [] };
    this.events.push({
      path: `${path}.header`,
      kind: 'encabezamiento',
      value: 'ref = 1',
      codeNeedle: 'Node header = Node.referenceNode();',
    });
    this.skipSpaces();
    if (this.current() === ')') {
      this.position++;
      return list;
    }

    while (true) {
      const itemPath = `${path}.${list.items.length}`;
      const item = this.parseElement(itemPath, depth);
      list.items.push(item);
      this.events.push({
        path: itemPath,
        kind: 'link',
        value: list.items.length === 1 ? 'header.link' : 'last.link',
        codeNeedle: list.items.length === 1
          ? 'header.link = element;'
          : 'last.link = element;',
      });
      this.skipSpaces();
      if (this.current() === ',') {
        this.position++;
        continue;
      }
      this.expect(')');
      return list;
    }
  }

  parse() {
    const root = this.parseList();
    this.skipSpaces();
    if (this.position !== this.source.length) {
      throw new Error(`Hay contenido inesperado desde la posición ${this.position + 1}.`);
    }
    return { root, events: this.events };
  }
}

export function parseGeneralizedList(rawSource) {
  const source = String(rawSource ?? '').trim();
  if (!source) throw new Error('Escribe una lista, por ejemplo: ((a,b),((c,d),e))');
  if (source.length > 100) throw new Error('Usa una lista de hasta 100 caracteres.');
  const parsed = new GeneralizedListParser(source).parse();
  return { source, ...parsed };
}

export function generalizedListToString(list) {
  if (!list) return '()';
  return `(${list.items.map(item => (
    item.kind === 'atom' ? item.value : generalizedListToString(item.list)
  )).join(',')})`;
}

export function generalizedItemToString(item) {
  if (!item) return '()';
  return item.kind === 'atom' ? item.value : generalizedListToString(item.list);
}

export function generalizedListDepth(list) {
  if (!list) return 0;
  let maximum = 1;
  for (const item of list.items) {
    if (item.kind === 'sublist') maximum = Math.max(maximum, 1 + generalizedListDepth(item.list));
  }
  return maximum;
}

export function generalizedListValuesFromSource(source) {
  return [parseGeneralizedList(source).root];
}

export const DEFAULT_GENERALIZED_LIST_VALUES = generalizedListValuesFromSource('((a,b),((c,d),e))');
