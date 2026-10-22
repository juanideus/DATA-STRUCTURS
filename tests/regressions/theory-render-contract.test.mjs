import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { format } from 'node:util';
import test from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// localizeTheory contains plain JavaScript, although its source uses .jsx.
// Resolve its two imports explicitly so Node can exercise the real function
// without a build, a JSX loader, or a copy of the implementation.
const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../../src/components/localizeTheory.jsx', import.meta.url), 'utf8')
  .replace("from 'react'", `from ${JSON.stringify(pathToFileURL(require.resolve('react')).href)}`)
  .replace("from '../data/theoryLessonEnglish.js'", `from ${JSON.stringify(new URL('../../src/data/theoryLessonEnglish.js', import.meta.url).href)}`);
const { localizeTheory } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function renderWithoutKeyWarnings(createTree) {
  const messages = [];
  const previousError = console.error;
  const previousWarn = console.warn;
  console.error = (...args) => messages.push(format(...args));
  console.warn = (...args) => messages.push(format(...args));
  try {
    const html = renderToStaticMarkup(createTree());
    assert.deepEqual(messages.filter(message => /each child.*key|unique.*key|same key/i.test(message)), []);
    return html;
  } finally {
    console.error = previousError;
    console.warn = previousWarn;
  }
}

test('Localized nested static siblings and keyed table arrays render without React key warnings', () => {
  const html = renderWithoutKeyWarnings(() => localizeTheory(h('section', null,
    h('h2', null, '¿Qué es la complejidad algorítmica?'),
    h('article', null,
      h('p', null, 'Las instrucciones consecutivas se ', h('b', null, 'suman'), '.'),
      h('p', null, 'La ', h('b', null, 'POO'), ' es una manera de diseñar programas agrupando la información y las operaciones que trabajan con ella dentro de ', h('b', null, 'objetos')),
    ),
    h('div', { role: 'table' }, ['Constante', 'Lineal'].map(name => h('div', { role: 'row', key: name },
      h('span', { role: 'cell' }, name),
      h('span', { role: 'cell' }, 'Ejemplo'),
    ))),
  ), 'en'));
  assert.match(html, /What is algorithmic complexity\?/);
  assert.match(html, /The costs of consecutive statements are <b>added<\/b>\./);
  assert.match(html, /<b>Object-oriented programming \(OOP\)<\/b> is a way/);
  assert.match(html, /<span role="cell">Constant<\/span>/);
  assert.match(html, /<span role="cell">Linear<\/span>/);
});

test('Localization preserves pre/code contents and Java text while translating surrounding prose', () => {
  const java = 'class Estudiante {\n    String nombre = "Ana";\n    // Ejemplo: Encapsulación\n}';
  const html = renderWithoutKeyWarnings(() => localizeTheory(h('section', null,
    h('p', null, 'Ejemplo'),
    h('pre', null, java),
    h('pre', null, 'Encapsulación'),
    h('code', null, 'Encapsulación'),
    h('pre', null, h('code', null, java)),
  ), 'en'));
  assert.match(html, /<p>Example<\/p>/);
  assert.ok(html.includes(renderToStaticMarkup(h('pre', null, java))));
  assert.ok(html.includes('<pre>Encapsulación</pre>'));
  assert.ok(html.includes('<code>Encapsulación</code>'));
  assert.ok(html.includes(renderToStaticMarkup(h('pre', null, h('code', null, java)))));
});

test('Localization translates aria/title, preserves boundary spaces and leaves Spanish untouched', () => {
  const original = h('p', {
    'aria-label': 'Comparación de órdenes de complejidad',
    title: 'Cómo analizar un algoritmo',
  }, '  Tiempo  ');
  const localized = localizeTheory(original, 'en');
  assert.equal(localized.props['aria-label'], 'Comparison of complexity orders');
  assert.equal(localized.props.title, 'How to analyze an algorithm');
  assert.equal(localized.props.children, '  Time  ');
  assert.equal(localizeTheory(original, 'es'), original);
  const html = renderWithoutKeyWarnings(() => localized);
  assert.match(html, /aria-label="Comparison of complexity orders"/);
  assert.match(html, /title="How to analyze an algorithm"/);
  assert.ok(html.endsWith('>  Time  </p>'));
});
