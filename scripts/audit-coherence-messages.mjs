import assert from 'node:assert/strict';
import { algorithms } from '../src/data/algorithms.js';
import { executeOperation } from '../src/logic/operations.js';
import { translateCoherenceMessage } from '../src/data/coherenceMessagesEnglish.js';

const algorithm = id => algorithms.find(item => item.id === id);
const run = (id, actionId, fields = {}, values = algorithm(id).values) => executeOperation({
  algorithm: algorithm(id), actionId, fields, values, initialValues: algorithm(id).values, edges: [],
});
const scenarios = [
  ['polinomios', 'poly-insert-a', { value: '2147483648', index: '2' }],
  ['polinomios', 'poly-insert-a', { value: '2147483647', index: '14' }],
  ['polinomios', 'poly-add', {}, [{ polynomial: 'A', coefficient: 2147483647, exponent: 1 }, { polynomial: 'B', coefficient: 1, exponent: 1 }]],
  ['union-find', 'union', { value: '', second: '2' }],
  ['union-find', 'find-root', { value: '' }],
  ['matriz', 'matrix-set', { value: '2147483648', second: '0', index: '0' }],
  ['matriz', 'matrix-fill', { value: '2147483648' }],
  ['matriz-dispersa', 'matrix-insert', { value: '2147483648', second: '0', index: '0' }],
  ['bubble-sort', 'add-end', { value: '1' }, Array(100).fill(0)],
  ['fenwick-tree', 'range-update', { value: '2147483647', index: '0' }],
  ['expression-tree', 'set-expression', { value: '1.5+2' }],
  ['expression-tree', 'set-expression', { value: '2147483648+1' }],
  ['expression-tree', 'set-expression', { value: '1 2' }],
  ['expression-tree', 'evaluate', { value: '1 2' }],
  ['expression-tree', 'evaluate', { value: '1/0' }],
  ['expression-tree', 'evaluate', { value: '2147483647+1' }],
  ['counting-sort', 'sort', {}, [-2147483648, 2147483647]],
];
for (const [id, actionId, fields, values] of scenarios) {
  const result = run(id, actionId, fields, values);
  assert.equal(result.ok, false, `${id}/${actionId} must reach its validation error`);
  assert.equal(typeof translateCoherenceMessage(result.message), 'string', `${id}/${actionId}: ${result.message}`);
}

const built = run('listas-generalizadas', 'glist-build', { value: '(a,(b,c))' });
for (const id of ['lista-simple', 'lista-doble', 'lista-circular-simple', 'lista-circular-doble']) {
  for (const [action, fields] of [
    ['add-start', { value: '9' }], ['add-end', { value: '9' }], ['add-index', { value: '9', index: '1' }],
    ['remove-start', {}], ['remove-end', {}], ['remove-index', { index: '1' }],
    ['remove-value', { value: '1' }], ['remove-value', { value: '7' }],
    ['find', { value: '2' }], ['find', { value: '7' }],
  ]) {
    const result = run(id, action, fields, [1, 2]);
    assert.equal(typeof translateCoherenceMessage(result.message), 'string', `${id}/${action}: ${result.message}`);
  }
}
for (const frame of built.frames) assert.equal(translateCoherenceMessage(frame.message), frame.messageEn);
assert.equal(translateCoherenceMessage(built.message), 'A = (a,(b,c)) was constructed.');
assert.equal(translateCoherenceMessage('El rango se calcula sin desbordar un entero de 32 bits: 4294967296.'), 'The range is calculated without overflowing a 32-bit integer: 4294967296.');
assert.equal(translateCoherenceMessage('placeQueen entra por primera vez con row = 4.'), 'placeQueen is entered for the first time with row = 4.');
assert.equal(translateCoherenceMessage('Hay contenido inesperado desde la posición 4.'), 'There is unexpected content starting at position 4.');
assert.equal(translateCoherenceMessage('Recorrido ordenado de claves: -2147483648 → 0 → 2147483647.'), 'Ordered key traversal: -2147483648 → 0 → 2147483647.');
assert.equal(translateCoherenceMessage('Recorrido ordenado de hojas: .'), 'Ordered leaf traversal: .');

// Every Radix frame must have a complete translation, including int32 extrema.
let radixFramesChecked = 0;
for (const values of [[12, 11], [-2147483648, 2147483647], [7], []]) {
  const result = run('radix-sort', 'sort', {}, values);
  assert.equal(result.ok, true);
  assert.deepEqual(result.values, [...values].sort((first, second) => first - second));
  for (const frame of result.frames) {
    const english = translateCoherenceMessage(frame.message);
    assert.equal(typeof english, 'string', `Untranslated Radix frame ${frame.sortPhase}: ${frame.message}`);
    assert.notEqual(english, frame.message);
    radixFramesChecked++;
  }
  assert.equal(typeof translateCoherenceMessage(result.message), 'string');
}
assert.equal(translateCoherenceMessage('Se usa -2147483648 como desplazamiento; value - offset será una clave no negativa.'), 'Use -2147483648 as the offset; value - offset will be a nonnegative key.');
assert.equal(translateCoherenceMessage('La clave desplazada más grande es 4294967295.'), 'The largest shifted key is 4294967295.');
assert.equal(translateCoherenceMessage('-2147483648 se coloca de forma estable en output[0].'), '-2147483648 is placed stably at output[0].');

// Whole-sentence matching must not translate substrings or unrelated messages.
for (const input of [null, 42, '', 'An unrelated English message.', 'prefijo Ingresa ambos elementos antes de unir sus conjuntos.', 'Ingresa ambos elementos antes de unir sus conjuntos. sufijo', 'Recorrido ordenado de nodos: 1 → 2.', 'prefijo 12 tiene dígito 1 en esta pasada.', '12 tiene dígito 1 en esta pasada. sufijo']) {
  assert.equal(translateCoherenceMessage(input), null);
}
console.log(`Coherence messages: validation scenarios, dynamic sentences, construction frames, ${radixFramesChecked} Radix frames and unknown-message fallback passed.`);
