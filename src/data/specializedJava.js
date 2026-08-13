const indent = source => source.split('\n').map(line => `    ${line}`).join('\n');

const wrap = (name, fields, operation, helpers = '') => `class ${name} {
${indent(fields)}

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation${helpers ? `\n\n${indent(helpers)}` : ''}
}`;

function skipListJava(actionId) {
  const fields = `static final int MAX_LEVEL = 3;
static class Node {
    int value;
    Node[] next = new Node[MAX_LEVEL + 1];
    Node(int value) { this.value = value; }
}
Node head = new Node(Integer.MIN_VALUE);
int level = 0;
int size = 0;`;
  const operations = {
    'sorted-add': `void insert(int value) {
    int newLevel = randomLevel();
    Node[] update = new Node[MAX_LEVEL + 1];
    Node current = head;
    for (int currentLevel = level; currentLevel >= 0; currentLevel--) {
        while (current.next[currentLevel] != null
                && current.next[currentLevel].value < value) {
            current = current.next[currentLevel];
        }
        update[currentLevel] = current;
    }
    if (newLevel > level) {
        for (int currentLevel = level + 1; currentLevel <= newLevel; currentLevel++) {
            update[currentLevel] = head;
        }
        level = newLevel;
    }
    Node newNode = new Node(value);
    for (int currentLevel = 0; currentLevel <= newLevel; currentLevel++) {
        newNode.next[currentLevel] = update[currentLevel].next[currentLevel];
        update[currentLevel].next[currentLevel] = newNode;
    }
    size++;
}`,
    'remove-value': `boolean remove(int value) {
    Node[] update = new Node[MAX_LEVEL + 1];
    Node current = head;
    for (int currentLevel = level; currentLevel >= 0; currentLevel--) {
        while (current.next[currentLevel] != null
                && current.next[currentLevel].value < value) {
            current = current.next[currentLevel];
        }
        update[currentLevel] = current;
    }
    Node target = current.next[0];
    if (target == null || target.value != value) return false;
    for (int currentLevel = 0; currentLevel <= level; currentLevel++) {
        if (update[currentLevel].next[currentLevel] != target) break;
        update[currentLevel].next[currentLevel] = target.next[currentLevel];
    }
    while (level > 0 && head.next[level] == null) level--;
    size--;
    return true;
}`,
    find: `boolean contains(int value) {
    Node current = head;
    for (int currentLevel = level; currentLevel >= 0; currentLevel--) {
        while (current.next[currentLevel] != null
                && current.next[currentLevel].value < value) {
            current = current.next[currentLevel];
        }
    }
    current = current.next[0];
    return current != null && current.value == value;
}`,
    clear: `void clear() {
    for (int currentLevel = 0; currentLevel <= MAX_LEVEL; currentLevel++) {
        head.next[currentLevel] = null;
    }
    level = 0;
    size = 0;
}`,
  };
  const helpers = actionId === 'sorted-add' ? `int randomLevel() {
    int newLevel = 0;
    while (newLevel < MAX_LEVEL && Math.random() < 0.5) newLevel++;
    return newLevel;
}` : '';
  return operations[actionId] ? wrap('SkipList', fields, operations[actionId], helpers) : null;
}

function openHashJava(actionId) {
  const fields = `String[] keys = new String[12];
String[] values = new String[12];
byte[] states = new byte[12]; // 0: vacía, 1: ocupada, 2: eliminada
int size = 0;
int hash(String key) { return Math.floorMod(key.hashCode(), keys.length); }`;
  const operations = {
    'hash-put': `void put(String key, String value) {
    int index = hash(key);
    int firstDeleted = -1;
    int probes = 0;
    while (states[index] != 0 && probes < keys.length) {
        if (states[index] == 1 && keys[index].equals(key)) {
            values[index] = value;
            return;
        }
        if (states[index] == 2 && firstDeleted == -1) firstDeleted = index;
        index = (index + 1) % keys.length;
        probes++;
    }
    if (firstDeleted != -1) index = firstDeleted;
    else if (probes == keys.length) return;
    keys[index] = key;
    values[index] = value;
    states[index] = 1;
    size++;
}`,
    find: `String get(String key) {
    int index = hash(key);
    int start = index;
    while (states[index] != 0) {
        if (states[index] == 1 && keys[index].equals(key)) return values[index];
        index = (index + 1) % keys.length;
        if (index == start) break;
    }
    return null;
}`,
    'remove-value': `boolean remove(String key) {
    int index = hash(key);
    int start = index;
    while (states[index] != 0) {
        if (states[index] == 1 && keys[index].equals(key)) {
            states[index] = 2;
            keys[index] = null;
            values[index] = null;
            size--;
            return true;
        }
        index = (index + 1) % keys.length;
        if (index == start) break;
    }
    return false;
}`,
    clear: `void clear() {
    for (int index = 0; index < keys.length; index++) {
        states[index] = 0;
        keys[index] = null;
        values[index] = null;
    }
    size = 0;
}`,
  };
  return operations[actionId] ? wrap('OpenAddressingTable', fields, operations[actionId]) : null;
}

function chainingJava(actionId) {
  const fields = `static class Node {
    String key;
    String value;
    Node next;
    Node(String key, String value, Node next) {
        this.key = key;
        this.value = value;
        this.next = next;
    }
}
Node[] buckets = new Node[8];
int size = 0;
int hash(String key) { return Math.floorMod(key.hashCode(), buckets.length); }`;
  const operations = {
    'hash-put': `void put(String key, String value) {
    int index = hash(key);
    Node current = buckets[index];
    while (current != null) {
        if (current.key.equals(key)) {
            current.value = value;
            return;
        }
        current = current.next;
    }
    buckets[index] = new Node(key, value, buckets[index]);
    size++;
}`,
    find: `String get(String key) {
    int index = hash(key);
    Node current = buckets[index];
    while (current != null) {
        if (current.key.equals(key)) return current.value;
        current = current.next;
    }
    return null;
}`,
    'remove-value': `boolean remove(String key) {
    int index = hash(key);
    Node current = buckets[index];
    Node previous = null;
    while (current != null) {
        if (current.key.equals(key)) {
            if (previous == null) buckets[index] = current.next;
            else previous.next = current.next;
            size--;
            return true;
        }
        previous = current;
        current = current.next;
    }
    return false;
}`,
    clear: `void clear() {
    for (int index = 0; index < buckets.length; index++) {
        buckets[index] = null;
    }
    size = 0;
}`,
  };
  return operations[actionId] ? wrap('SeparateChainingTable', fields, operations[actionId]) : null;
}

function lruJava(actionId) {
  const fields = `static class Node {
    String key;
    String value;
    Node prev;
    Node next;
    Node(String key, String value) { this.key = key; this.value = value; }
}
java.util.HashMap<String, Node> cache = new java.util.HashMap<>();
Node head;
Node tail;
int capacity = 5;`;
  const helpers = `void remove(Node node) {
    if (node.prev != null) node.prev.next = node.next;
    else head = node.next;
    if (node.next != null) node.next.prev = node.prev;
    else tail = node.prev;
}
void addLast(Node node) {
    node.prev = tail;
    node.next = null;
    if (tail != null) tail.next = node;
    else head = node;
    tail = node;
}
void markRecent(Node node) {
    remove(node);
    addLast(node);
}`;
  const operations = {
    'cache-get': `String get(String key) {
    Node node = cache.get(key);
    if (node == null) return null;
    markRecent(node);
    return node.value;
}`,
    'cache-put': `void put(String key, String value) {
    Node node = cache.get(key);
    if (node != null) {
        node.value = value;
        markRecent(node);
        return;
    }
    if (cache.size() == capacity) {
        cache.remove(head.key);
        remove(head);
    }
    node = new Node(key, value);
    cache.put(key, node);
    addLast(node);
}`,
    'remove-value': `boolean removeKey(String key) {
    Node node = cache.remove(key);
    if (node == null) return false;
    remove(node);
    return true;
}`,
    clear: `void clear() {
    cache.clear();
    head = null;
    tail = null;
}`,
  };
  return operations[actionId] ? wrap('LRUCache', fields, operations[actionId], helpers) : null;
}

function bloomJava(actionId) {
  const fields = `boolean[] bits = new boolean[12];
int[] seeds = {3, 7, 11};
int hash(String word, int seed) {
    return (word.length() * seed + word.charAt(0)) % bits.length;
}`;
  const operations = {
    'bloom-add': `void add(String word) {
    for (int seed : seeds) {
        int index = hash(word, seed);
        bits[index] = true;
    }
}`,
    'bloom-check': `boolean mightContain(String word) {
    for (int seed : seeds) {
        int index = hash(word, seed);
        if (!bits[index]) return false;
    }
    return true;
}`,
    'clear-bits': `void clearBits() {
    for (int index = 0; index < bits.length; index++) {
        bits[index] = false;
    }
}`,
  };
  return operations[actionId] ? wrap('BloomFilter', fields, operations[actionId]) : null;
}

export function getSpecializedJava(algorithmId, actionId) {
  if (algorithmId === 'skip-list') return skipListJava(actionId);
  if (algorithmId === 'hash-chaining') return chainingJava(actionId);
  if (['hash-table', 'hash-open'].includes(algorithmId)) return openHashJava(actionId);
  if (algorithmId === 'lru-cache') return lruJava(actionId);
  if (algorithmId === 'bloom-filter') return bloomJava(actionId);
  return null;
}
