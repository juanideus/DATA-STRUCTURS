import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseAst } from 'rolldown/parseAst';

const source = readFileSync(new URL('../../src/i18n.jsx', import.meta.url), 'utf8');
const ast = parseAst(source, { lang: 'jsx' }, 'i18n.jsx');
const replacements = ast.body.find(node => node.type === 'VariableDeclaration'
  && node.declarations.some(declaration => declaration.id.name === 'codeReplacements'));
const translator = ast.body.find(node => node.type === 'ExportNamedDeclaration'
  && node.declaration?.type === 'FunctionDeclaration'
  && node.declaration.id.name === 'translateCodeText');
assert.ok(replacements, 'Extract the real pseudocode replacement catalog');
assert.ok(translator, 'Extract the real source-localization function');
const extracted = [replacements, translator].map(node => source.slice(node.start, node.end)).join('\n');
const { translateCodeText } = await import(`data:text/javascript;base64,${Buffer.from(extracted).toString('base64')}`);

test('English Java preserves final, identifiers, literals and comments exactly', () => {
  const java = [
    'public class BreadthFirstSearch {',
    '    static final int MAX_VERTICES = 8;',
    '    final int finalValue = 3;',
    '    int valorActual = finalValue;',
    '    String label = "final valor cola nodo raíz";',
    "    char character = 'ñ';",
    '    // El nodo actual conserva el valor final.',
    '    /* recorrer la cola sin modificar finalValue */',
    '}',
  ].join('\r\n');
  assert.equal(translateCodeText(java, 'en', 'java'), java);
  assert.equal(translateCodeText(java, 'es', 'java'), java);
  assert.equal(translateCodeText(java, 'en', 'java').split('\n').length, java.split('\n').length);
});

test('English C++ preserves fragment-containing identifiers, raw strings and syntax', () => {
  const cpp = [
    'class Queue final {',
    '    int finalValue = 5;',
    '    int colaCount = 1;',
    '    const char* palabra = "valor final; nodo actual";',
    '    const char* raw = R"tag(final raíz cola \\"valor\\")tag";',
    '    void recorrerNodo() { colaCount += finalValue; }',
    '    // liberar el nodo anterior después de recorrer',
    '};',
  ].join('\n');
  assert.equal(translateCodeText(cpp, 'en', 'cpp'), cpp);
  assert.equal(translateCodeText(cpp, 'en', 'cpp').split('\n').length, cpp.split('\n').length);
});

test('Missing or unknown code modes fail closed without translating executable text', () => {
  const executable = 'static final int valor = 8; String s = "final";';
  assert.equal(translateCodeText(executable, 'en'), executable);
  assert.equal(translateCodeText(executable, 'en', 'unknown'), executable);
  assert.equal(translateCodeText(null, 'en', 'java'), null);
  assert.equal(translateCodeText(undefined, 'en', 'pseudo'), undefined);
});

test('Pseudocode retains its existing English translation and line count', () => {
  const pseudo = 'mientras actual ≠ vacío\n  retornar valor';
  assert.equal(translateCodeText(pseudo, 'en', 'pseudo'), 'while current ≠ empty\n  return value');
  assert.equal(translateCodeText(pseudo, 'es', 'pseudo'), pseudo);
  assert.equal(translateCodeText(pseudo, 'en', 'pseudo').split('\n').length, pseudo.split('\n').length);
});

test('App supplies the selected code mode and invalidates the display memo when it changes', () => {
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  const tree = parseAst(app, { lang: 'jsx' }, 'App.jsx');
  let declaration;
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator' && node.id.name === 'displayedCode') declaration = node;
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  };
  visit(tree);
  assert.ok(declaration);
  const [compute, dependencies] = declaration.init.arguments;
  assert.equal(compute.body.callee.name, 'translateCodeText');
  assert.equal(compute.body.arguments[2].name, 'codeMode');
  assert.ok(dependencies.elements.some(item => item.name === 'codeMode'));
});
