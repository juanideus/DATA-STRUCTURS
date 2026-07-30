export const AST_EXAMPLES = [
  'total = price + quantity * 2;',
  'area = base * height / 2;',
  'result = (a + b) * c;',
  'finalPrice = price - discount;',
];

function createNode(label, kind, left = null, right = null) {
  return { label, kind, left, right };
}

class SimpleJavaParser {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.created = [];
  }

  current() {
    return this.position < this.source.length ? this.source[this.position] : '\0';
  }

  skipSpaces() {
    while (/\s/.test(this.current())) this.position++;
  }

  readIdentifier() {
    this.skipSpaces();
    const start = this.position;
    if (!/[A-Za-z_]/.test(this.current())) {
      throw new Error(`Se esperaba un identificador en la posición ${this.position + 1}.`);
    }
    this.position++;
    while (/[A-Za-z0-9_]/.test(this.current())) this.position++;
    return this.source.slice(start, this.position);
  }

  readNumber() {
    this.skipSpaces();
    const start = this.position;
    while (/[0-9]/.test(this.current())) this.position++;
    return this.source.slice(start, this.position);
  }

  expect(expected) {
    this.skipSpaces();
    if (this.current() !== expected) {
      throw new Error(`Se esperaba '${expected}' en la posición ${this.position + 1}.`);
    }
    this.position++;
  }

  remember(node, codeNeedle, tokenPosition) {
    this.created.push({ node, codeNeedle, tokenPosition });
    return node;
  }

  parseFactor() {
    this.skipSpaces();
    const tokenPosition = this.position;
    if (this.current() === '(') {
      this.position++;
      const expression = this.parseExpression();
      this.expect(')');
      return expression;
    }
    if (/[0-9]/.test(this.current())) {
      return this.remember(
        createNode(this.readNumber(), 'literal'),
        'return new Node(readNumber());',
        tokenPosition,
      );
    }
    if (/[A-Za-z_]/.test(this.current())) {
      return this.remember(
        createNode(this.readIdentifier(), 'identifier'),
        'return new Node(readIdentifier());',
        tokenPosition,
      );
    }
    throw new Error(`Token '${this.current()}' no válido en la posición ${this.position + 1}.`);
  }

  parseTerm() {
    let term = this.parseFactor();
    while (true) {
      this.skipSpaces();
      const operator = this.current();
      if (operator !== '*' && operator !== '/') break;
      const tokenPosition = this.position;
      this.position++;
      const right = this.parseFactor();
      term = this.remember(
        createNode(operator, 'operator', term, right),
        'term = new Node(String.valueOf(operator), term, right);',
        tokenPosition,
      );
    }
    return term;
  }

  parseExpression() {
    let expression = this.parseTerm();
    while (true) {
      this.skipSpaces();
      const operator = this.current();
      if (operator !== '+' && operator !== '-') break;
      const tokenPosition = this.position;
      this.position++;
      const right = this.parseTerm();
      expression = this.remember(
        createNode(operator, 'operator', expression, right),
        'expression = new Node(String.valueOf(operator), expression, right);',
        tokenPosition,
      );
    }
    return expression;
  }

  parseAssignment() {
    this.skipSpaces();
    const targetPosition = this.position;
    const target = this.remember(
      createNode(this.readIdentifier(), 'identifier'),
      'Node target = new Node(readIdentifier());',
      targetPosition,
    );
    this.expect('=');
    const value = this.parseExpression();
    this.skipSpaces();
    if (this.current() === ';') this.position++;
    this.skipSpaces();
    if (this.position !== this.source.length) {
      throw new Error(`Hay contenido inesperado desde la posición ${this.position + 1}.`);
    }
    const root = this.remember(
      createNode('ASSIGN', 'statement', target, value),
      'root = new Node("ASSIGN", target, value);',
      Math.max(0, this.source.indexOf('=')),
    );
    return { root, created: this.created };
  }
}

function nodePositions(root, maximumNodes = 15) {
  const positions = new Map();
  const values = [];
  const kinds = [];
  const place = (node, index) => {
    if (!node) return;
    if (index >= maximumNodes) {
      throw new Error('El AST supera cuatro niveles. Usa una instrucción más corta para mantenerlo visible.');
    }
    positions.set(node, index);
    values[index] = node.label;
    kinds[index] = node.kind;
    place(node.left, index * 2 + 1);
    place(node.right, index * 2 + 2);
  };
  place(root, 0);
  return {
    positions,
    values: Array.from({ length: values.length }, (_, index) => values[index]),
    kinds: Array.from({ length: kinds.length }, (_, index) => kinds[index]),
  };
}

export function parseSimpleJavaAssignment(rawSource) {
  const source = String(rawSource ?? '').trim();
  if (!source) throw new Error('Escribe una asignación Java, por ejemplo: total = price + 2;');
  if (source.length > 80) throw new Error('Usa una instrucción de hasta 80 caracteres.');
  const parser = new SimpleJavaParser(source);
  const parsed = parser.parseAssignment();
  const layout = nodePositions(parsed.root);
  return {
    source,
    root: parsed.root,
    values: layout.values,
    kinds: layout.kinds,
    created: parsed.created.map(event => ({
      ...event,
      treeIndex: layout.positions.get(event.node),
      label: event.node.label,
      kind: event.node.kind,
    })),
  };
}

export function astValuesFromSource(source) {
  return parseSimpleJavaAssignment(source).values;
}

export function astPreorderPositions(values, index = 0, result = []) {
  if (index >= values.length || values[index] === undefined) return result;
  result.push(index);
  astPreorderPositions(values, index * 2 + 1, result);
  astPreorderPositions(values, index * 2 + 2, result);
  return result;
}
