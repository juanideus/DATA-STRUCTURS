import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseAst } from 'rolldown/parseAst';
import { theoryLessonEnglish } from '../../src/data/theoryLessonEnglish.js';

const source = readFileSync(new URL('../../src/components/TheoryLessons.jsx', import.meta.url), 'utf8');
const ast = parseAst(source, { lang: 'jsx' }, 'TheoryLessons.jsx');
const visibleData = new Set(['orderRows', 'operations', 'families', 'pillars', 'modifiers']);
const normalize = value => value.trim().replace(/\s+/g, ' ');

function collectVisibleMessages(node, parents = [], messages = new Set()) {
  if (!node || typeof node !== 'object') return messages;
  if (node.type === 'JSXText' && node.value.trim()) messages.add(normalize(node.value));
  if (node.type === 'Literal' && typeof node.value === 'string') {
    const dataCell = parents.some(parent => parent.type === 'VariableDeclarator' && visibleData.has(parent.id?.name));
    const accessibleLabel = parents.at(-1)?.type === 'JSXAttribute' && parents.at(-1).name.name === 'aria-label';
    if (dataCell || accessibleLabel) messages.add(normalize(node.value));
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) collectVisibleMessages(child, [...parents, node], messages);
    } else if (value && typeof value === 'object') collectVisibleMessages(value, [...parents, node], messages);
  }
  return messages;
}

test('Every visible TheoryLessons message has one exact English catalog entry', () => {
  const messages = collectVisibleMessages(ast);
  assert.deepEqual([...messages].filter(message => !Object.hasOwn(theoryLessonEnglish, message)), []);
  assert.deepEqual(Object.keys(theoryLessonEnglish).filter(message => !messages.has(message)), []);
  for (const message of messages) assert.equal(typeof theoryLessonEnglish[message], 'string', message);
});

test('Java identifiers and notation remain intact; the OOP sentence supports an empty article', () => {
  for (const token of ['n', 'O(n²)', 'new', 'this', 'null', 'Estudiante', 'Perro', 'Auto', 'sumar(int a, int b)', '@Override hacerSonido()']) {
    assert.equal(theoryLessonEnglish[token], token);
  }
  assert.equal(theoryLessonEnglish.La, '');
  assert.equal(theoryLessonEnglish.POO, 'Object-oriented programming (OOP)');
});
