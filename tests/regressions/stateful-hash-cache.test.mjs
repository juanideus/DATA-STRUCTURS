import assert from 'node:assert/strict';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { executeOperation } from '../../src/logic/operations.js';

const entries = values => values.map(entry => {
  const separator = entry.indexOf(':');
  return separator < 0 ? [entry, entry] : [entry.slice(0, separator), entry.slice(separator + 1)];
});

for (const id of ['hash-table', 'hash-open', 'hash-chaining', 'lru-cache']) {
  test(`${id}: reproducible operation sequences agree with an independent Map oracle`, () => {
    const algorithm = algorithms.find(item => item.id === id);
    const cache = id === 'lru-cache';
    for (const seed of [1, 42, 2026]) {
      let random = seed, values = [], hashTable = null;
      const oracle = new Map();
      const keys = ['A', 'M', 'Y', 'B', 'N', 'Z', 'C', 'O', 'D', 'P', 'E', 'Q', 'F', 'R'];
      const next = limit => {
        random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
        return Math.floor(random / 2 ** 32 * limit);
      };
      for (let step = 0; step < 500; step++) {
        // A/M/Y share a starting slot in open addressing; other keys fill it.
        const key = step < 28 ? keys[step % 14] : keys[next(14)];
        const value = ['', '0', 'hello:world', 'áé🙂', '-2147483648'][next(5)];
        // First fill beyond capacity, delete every key, query the tombstones,
        // then insert again; random sequences follow these boundary cases.
        const kind = step < 14 ? 0 : !cache && step < 28 ? 2
          : !cache && step === 28 ? 1 : step === 29 ? 0 : next(cache ? 3 : 4);
        const actionId = kind === 0 ? cache ? 'cache-put' : 'hash-put'
          : kind === 1 ? cache ? 'cache-get' : 'find'
            : kind === 2 && !cache ? 'remove-value' : 'clear';
        const beforeValues = structuredClone(values), beforeTable = structuredClone(hashTable);
        const result = executeOperation({ algorithm, actionId, fields: { value: key, second: value }, values, hashTable, edges: [], initialValues: algorithm.values });
        let success = true;
        if (actionId.endsWith('-put')) {
          const full = !cache && id !== 'hash-chaining' && !oracle.has(key) && oracle.size === 12;
          success = !full;
          if (success) {
            if (cache) oracle.delete(key);
            oracle.set(key, value);
            if (cache && oracle.size > 5) oracle.delete(oracle.keys().next().value);
          }
        } else if (actionId === 'find' || actionId === 'cache-get') {
          success = oracle.has(key);
          if (success && cache) { const prior = oracle.get(key); oracle.delete(key); oracle.set(key, prior); }
        } else if (actionId === 'remove-value') success = oracle.delete(key);
        else oracle.clear();
        const label = `${id}, seed ${seed}, step ${step}, ${actionId}(${key})`;
        assert.equal(result.ok, success, label);
        assert.deepEqual(values, beforeValues, `${label}: caller values mutated`);
        assert.deepEqual(hashTable, beforeTable, `${label}: caller slot state mutated`);
        const actual = entries(result.values);
        assert.deepEqual(cache ? actual : actual.sort(), cache ? [...oracle] : [...oracle].sort(), label);
        if (!success) assert.deepEqual(result.values, beforeValues, label);
        if (result.hashTable) {
          const occupied = result.hashTable.filter(slot => slot.state === 'occupied').map(slot => slot.entry);
          assert.deepEqual(occupied.sort(), [...result.values].sort(), `${label}: slot/value disagreement`);
        }
        values = result.values;
        hashTable = result.hashTable ?? hashTable;
      }
    }
  });
}
