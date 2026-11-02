import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseAst } from 'rolldown/parseAst';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getOperationPseudocode } from '../../src/data/operationPseudocode.js';
import { getOperationDefinition } from '../../src/logic/operationMetadata.js';
import { executeOperation } from '../../src/logic/operations.js';

const suffix = algorithms.find(item => item.id === 'suffix-tree');
const run = (actionId, value, values = suffix.values) => executeOperation({
  algorithm: suffix, actionId, fields: { value }, values, initialValues: suffix.values, edges: [],
});

test('suffix actions describe rebuilding a text and querying patterns instead of appending independent words', () => {
  const definition = getOperationDefinition(suffix);
  assert.equal(definition.fields[0].label, 'Texto / patrón');
  assert.deepEqual(definition.actions.map(action => [action.id, action.label]), [
    ['set-word', 'Reconstruir desde texto'], ['word-find', 'Buscar patrón'], ['remove-word', 'Eliminar patrón'], ['clear', 'Vaciar'],
  ]);
  const rebuilt = run('set-word', 'CASA');
  assert.equal(rebuilt.ok, true);
  assert.equal(rebuilt.values.join(''), 'CASA');
  assert.equal(run('word-find', 'AS', rebuilt.values).ok, true);
  assert.equal(run('remove-word', 'CA', rebuilt.values).values.join(''), 'SA');
  for (const code of [getBeginnerJava(suffix, 'set-word'), getBeginnerCpp(suffix, 'set-word')]) {
    assert.match(code, /buildSuffixTrie\(/);
    assert.match(code, /start < (?:static_cast<int>\()?text\.length\(\)/);
    assert.match(code, /insertSuffix\(/);
  }
});

test('suffix rebuilding pseudocode covers every suffix and replacing the old text in both languages', () => {
  const es = getOperationPseudocode(suffix, 'set-word', 'es');
  const en = getOperationPseudocode(suffix, 'set-word', 'en');
  assert.match(es, /reemplazar text por newText/);
  assert.match(es, /para start desde 0/);
  assert.match(es, /sufijo text\[start\.\.fin\]/);
  assert.match(en, /replace text with newText/);
  assert.match(en, /for start from 0/);
  assert.match(en, /suffix text\[start\.\.end\]/);
  assert.equal(run('set-word', '').ok, false);
  assert.equal(run('set-word', 'CASA1').ok, false);
});

test('suffix-specific controls have English labels and other tries preserve word operations', async () => {
  const source = readFileSync(new URL('../../src/i18n.jsx', import.meta.url), 'utf8');
  const ast = parseAst(source, { lang: 'jsx' }, 'i18n.jsx');
  const catalog = ast.body.find(node => node.type === 'VariableDeclaration'
    && node.declarations.some(item => item.id.name === 'operationLabels'));
  const translator = ast.body.find(node => node.type === 'ExportNamedDeclaration'
    && node.declaration?.type === 'FunctionDeclaration' && node.declaration.id.name === 'translateOperationLabel');
  const extracted = [catalog, translator].map(node => source.slice(node.start, node.end)).join('\n');
  const { translateOperationLabel } = await import(`data:text/javascript;base64,${Buffer.from(extracted).toString('base64')}`);
  assert.deepEqual(['Texto / patrón', 'Reconstruir desde texto', 'Buscar patrón', 'Eliminar patrón'].map(label => translateOperationLabel(label, 'en')),
    ['Text / pattern', 'Rebuild from text', 'Search pattern', 'Delete pattern']);
  const trie = algorithms.find(item => item.id === 'trie');
  assert.equal(getOperationDefinition(trie).actions[0].label, 'Insertar palabra');
});

test('all backtracking step actions describe starting a step-by-step execution', () => {
  for (const id of ['laberinto', 'n-reinas', 'sudoku']) {
    const definition = getOperationDefinition(algorithms.find(item => item.id === id));
    assert.equal(definition.actions.find(action => action.id === 'step-solution').label, 'Ejecutar paso a paso');
  }
});
