import { createOpenAddressingTable, javaStringHash } from '../logic/openAddressing.js';

// The visualizer stores an entry as key or key:value. Mirror that representation
// in the executable examples, including the default value for a bare key.
export function hashExampleEntries(values = []) {
  if (!Array.isArray(values)) return [];
  return values.map(value => {
    const entry = String(value);
    const separator = entry.indexOf(':');
    const key = separator < 0 ? entry : entry.slice(0, separator);
    return { key, value: separator < 0 ? key : entry.slice(separator + 1), entry };
  });
}

export function hashExampleSlots(values = [], previousSlots = null) {
  return createOpenAddressingTable(hashExampleEntries(values).map(item => item.entry), previousSlots).snapshot();
}

export function hashExampleBuckets(values = []) {
  const buckets = Array.from({ length: 8 }, () => []);
  for (const item of hashExampleEntries(values)) {
    const index = ((javaStringHash(item.key) % buckets.length) + buckets.length) % buckets.length;
    const prior = buckets[index].find(node => node.key === item.key);
    if (prior) prior.value = item.value;
    else buckets[index].unshift(item);
  }
  return buckets;
}
