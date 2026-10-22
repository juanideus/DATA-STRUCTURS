import assert from 'node:assert/strict';
import { algorithms } from '../src/data/algorithms.js';
import { executeOperation } from '../src/logic/operations.js';
import { generalizedListToString } from '../src/logic/generalizedList.js';

const algorithm = id => algorithms.find(item => item.id === id);
const run = (id, actionId, fields = {}, values = algorithm(id).values) => executeOperation({
  algorithm: algorithm(id), actionId, fields, values, initialValues: algorithm(id).values, edges: [],
});
const variable = (frame, name) => frame.variables.find(item => item.name === name)?.value;
const frameAt = (result, needle) => result.frames.find(frame => frame.codeNeedle === needle);

// A rejected coefficient must preserve A, B and an already computed C.
const summed = run('polinomios', 'poly-add');
for (const fields of [
  { value: '2147483648', index: '2' },
  { value: '-2147483649', index: '2' },
  { value: '1', index: '2147483648' },
  { value: '2147483647', index: '14' },
]) {
  const rejected = run('polinomios', 'poly-insert-a', fields, summed.values);
  assert.equal(rejected.ok, false);
  assert.deepEqual(rejected.values, summed.values);
}
const overflowSum = [
  { polynomial: 'A', coefficient: 2147483647, exponent: 1 },
  { polynomial: 'B', coefficient: 1, exponent: 1 },
  { polynomial: 'C', coefficient: 7, exponent: 0 },
];
assert.equal(run('polinomios', 'poly-add', {}, overflowSum).ok, false);
assert.deepEqual(run('polinomios', 'poly-add', {}, overflowSum).values, overflowSum);
assert.equal(run('polinomios', 'poly-insert-a', { value: '-2147483648', index: '2' }).ok, true);
assert.equal(run('polinomios', 'poly-insert-b', { value: '-2147483648', index: '10' }).ok, false);
const underflowSum = overflowSum.map(term => ({ ...term, coefficient: term.polynomial === 'A' ? -2147483648 : term.polynomial === 'B' ? -1 : 7 }));
assert.equal(run('polinomios', 'poly-add', {}, underflowSum).ok, false);
assert.deepEqual(run('polinomios', 'poly-add', {}, underflowSum).values, underflowSum);

for (const text of ['(a)x', '(a,']) {
  const rejected = run('listas-generalizadas', 'glist-build', { value: text });
  assert.equal(rejected.ok, false);
  assert.deepEqual(rejected.values, algorithm('listas-generalizadas').values);
}
const built = run('listas-generalizadas', 'glist-build', { value: '(a,(b,c))' });
assert.equal(built.frames.length, 2);
assert.ok(built.frames.every(frame => frame.traceMode === 'summary' && frame.codeLine === null));
assert.equal(generalizedListToString(built.frames[0].values[0]), '((a,b),((c,d),e))');
assert.equal(generalizedListToString(built.frames[1].values[0]), '(a,(b,c))');

assert.equal(run('union-find', 'union', { value: '', second: '2' }).ok, false);
assert.equal(run('union-find', 'union', { value: '2', second: ' ' }).ok, false);
assert.equal(run('union-find', 'find-root', { value: '' }).ok, false);
assert.equal(run('union-find', 'find-root', { value: '0' }).ok, true);

const putEmpty = run('lru-cache', 'cache-put', { value: 'a', second: '' });
assert.ok(putEmpty.values.includes('a:'));
assert.match(run('lru-cache', 'cache-get', { value: 'a' }, putEmpty.values).message, /^Get\(a\) = \./);

const queens = run('n-reinas', 'solve', { value: '4' });
assert.equal(variable(queens.frames.at(-1), 'row'), 4);
assert.equal(variable(queens.frames.at(-1), 'condición'), 'true');
assert.equal(run('n-reinas', 'reset', {}, run('n-reinas', 'solve', { value: '5' }).values).values.length, 4);
assert.equal(run('hanoi', 'reset', {}, run('hanoi', 'hanoi-set', { value: '3' }).values).values.length, 5);

const enqueue = run('cola', 'enqueue', { value: '9' }, [1, 2]);
assert.equal(variable(frameAt(enqueue, 'rear.next = newNode;'), 'rear'), 2);
assert.equal(variable(frameAt(enqueue, 'rear = newNode;'), 'rear'), 9);
assert.equal(variable(frameAt(enqueue, 'rear = newNode;'), 'size'), 2);
assert.equal(variable(frameAt(enqueue, 'size++;'), 'size'), 3);
assert.equal(frameAt(enqueue, 'rear.next = newNode;').queueState.rearIndex, 1);
assert.equal(frameAt(enqueue, 'rear = newNode;').queueState.rearIndex, 2);
const duplicateQueue = run('cola', 'enqueue', { value: '2' }, [2, 2]);
assert.equal(frameAt(duplicateQueue, 'rear.next = newNode;').queueState.rearIndex, 1);
assert.equal(frameAt(duplicateQueue, 'rear = newNode;').queueState.rearIndex, 2);
const enqueueEmpty = run('cola', 'enqueue', { value: '9' }, []);
assert.equal(variable(frameAt(enqueueEmpty, 'front = newNode;'), 'rear'), 'null');
assert.equal(variable(frameAt(enqueueEmpty, 'rear = front;'), 'rear'), 9);
assert.equal(variable(frameAt(enqueueEmpty, 'rear = front;'), 'size'), 0);
assert.equal(frameAt(enqueueEmpty, 'front = newNode;').queueState.frontIndex, 0);
assert.equal(frameAt(enqueueEmpty, 'front = newNode;').queueState.rearIndex, null);
assert.equal(frameAt(enqueueEmpty, 'rear = front;').queueState.rearIndex, 0);
const dequeue = run('cola', 'dequeue', {}, [9]);
assert.equal(variable(frameAt(dequeue, 'front = front.next;'), 'rear'), 9);
assert.equal(variable(frameAt(dequeue, 'front = front.next;'), 'size'), 1);
assert.equal(variable(frameAt(dequeue, 'rear = null;'), 'rear'), 'null');
assert.equal(variable(frameAt(dequeue, 'rear = null;'), 'size'), 1);
assert.equal(variable(frameAt(dequeue, 'size--;'), 'size'), 0);
const dequeueMany = run('cola', 'dequeue', {}, [2, 2, 2]);
assert.equal(frameAt(dequeueMany, 'front = front.next;').queueState.frontIndex, 0);
assert.equal(frameAt(dequeueMany, 'front = front.next;').queueState.rearIndex, 1);
const cleared = run('cola', 'clear', {}, [1, 2]);
assert.equal(variable(frameAt(cleared, 'front = null;'), 'rear'), 2);
assert.equal(variable(frameAt(cleared, 'rear = null;'), 'size'), 2);
assert.equal(variable(frameAt(cleared, 'size = 0;'), 'size'), 0);

console.log('State-coherence regressions: polynomial, generalized list, Union-Find, LRU, resets, N-Queens and queue passed.');
