export const HASH_CAPACITY = 12;

export function javaStringHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
  }
  return hash;
}

const keyOf = entry => String(entry).split(':')[0];
const emptySlot = () => ({ state: 'empty', entry: null });

export function createOpenAddressingTable(values = [], previousSlots = null) {
  const slots = previousSlots
    ? previousSlots.map(slot => ({ ...slot }))
    : Array.from({ length: HASH_CAPACITY }, emptySlot);

  const probe = key => {
    let index = ((javaStringHash(key) % HASH_CAPACITY) + HASH_CAPACITY) % HASH_CAPACITY;
    let firstDeleted = -1;
    for (let visited = 0; visited < HASH_CAPACITY; visited++) {
      const slot = slots[index];
      if (slot.state === 'empty') return { found: -1, available: firstDeleted >= 0 ? firstDeleted : index };
      if (slot.state === 'deleted' && firstDeleted < 0) firstDeleted = index;
      if (slot.state === 'occupied' && keyOf(slot.entry) === key) return { found: index, available: index };
      index = (index + 1) % HASH_CAPACITY;
    }
    return { found: -1, available: firstDeleted };
  };

  const model = {
    find(key) { return probe(key).found; },
    put(entry) {
      const result = probe(keyOf(entry));
      if (result.available < 0) return -1;
      slots[result.available] = { state: 'occupied', entry };
      return result.available;
    },
    remove(key) {
      const index = probe(key).found;
      if (index < 0) return -1;
      slots[index] = { state: 'deleted', entry: null };
      return index;
    },
    snapshot() { return slots.map(slot => ({ ...slot })); },
  };
  if (!previousSlots) values.forEach(value => model.put(value));
  return model;
}
