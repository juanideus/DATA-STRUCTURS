const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const unionOperations = {
  union: `void unite(int first, int second) {
    if (first < 0 || first >= size || second < 0 || second >= size) return;
    int rootA = findRoot(first);
    int rootB = findRoot(second);
    if (rootA == rootB) return;
    if (rank[rootA] < rank[rootB]) parent[rootA] = rootB;
    else if (rank[rootA] > rank[rootB]) parent[rootB] = rootA;
    else {
        parent[rootB] = rootA;
        rank[rootA]++;
    }
}`,
  'find-root': `int findRoot(int value) {
    if (value < 0 || value >= size) return -1;
    if (parent[value] != value) parent[value] = findRoot(parent[value]);
    return parent[value];
}`,
  reset: `void reset() {
    loadInitialExample();
}`,
};

const findRoot = unionOperations['find-root'];

function unionFindCpp(actionId) {
  const operation = unionOperations[actionId];
  if (!operation) return null;
  const helper = actionId === 'union' ? findRoot : null;
  return `class UnionFind {
public:
    static const int CAPACITY = 100;
    int* parent;
    int* rank;
    int size = 0;

    UnionFind() : parent(new int[CAPACITY]{}), rank(new int[CAPACITY]{}) {
        loadInitialExample();
    }
    UnionFind(const UnionFind&) = delete;
    UnionFind& operator=(const UnionFind&) = delete;
    ~UnionFind() {
        delete[] parent;
        delete[] rank;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${helper ? `\n    // Auxiliary method used above\n${indent(helper)}` : ''}

private:
    void loadInitialExample() {
        size = 8;
        for (int i = 0; i < size; i++) {
            parent[i] = i - i % 2;
            rank[i] = i % 2 == 0 ? 1 : 0;
        }
    }
};`;
}

const bloomOperations = {
  'bloom-add': `void add(const std::string& word) {
    for (int i = 0; i < HASH_COUNT; i++) {
        int index = hash(word, seeds[i]);
        bits[index] = true;
    }
}`,
  'bloom-check': `bool possiblyContains(const std::string& word) const {
    for (int i = 0; i < HASH_COUNT; i++) {
        int index = hash(word, seeds[i]);
        if (!bits[index]) return false;
    }
    return true;
}`,
  'clear-bits': `void clear() {
    for (int i = 0; i < BIT_COUNT; i++) bits[i] = false;
}`,
};

const bloomHash = `int hash(const std::string& word, int seed) const {
    if (word.empty()) throw std::invalid_argument("Word must not be empty");
    for (unsigned char character : word) {
        if (character < 32 || character > 126) throw std::invalid_argument("Use printable ASCII characters");
    }
    return static_cast<int>((word.size() * seed + static_cast<unsigned char>(word[0])) % BIT_COUNT);
}`;

function bloomCpp(actionId, initialValues) {
  const operation = bloomOperations[actionId];
  if (!operation) return null;
  const needsHash = actionId !== 'clear-bits';
  const bits = Array.from({ length: 12 }, (_, index) => Boolean(initialValues?.[index]) ? 'true' : 'false');
  return `#include <stdexcept>
#include <string>

class BloomFilter {
public:
    static const int BIT_COUNT = 12;
    static const int HASH_COUNT = 3;
    bool* bits;
    int* seeds;

    BloomFilter() : bits(new bool[BIT_COUNT]{${bits.join(', ')}}), seeds(new int[HASH_COUNT]{3, 7, 11}) {}
    BloomFilter(const BloomFilter&) = delete;
    BloomFilter& operator=(const BloomFilter&) = delete;
    ~BloomFilter() {
        delete[] bits;
        delete[] seeds;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${needsHash ? `\n    // Auxiliary method used above\n${indent(bloomHash)}` : ''}
};`;
}

const lruOperations = {
  'cache-put': `void put(const std::string& key, const std::string& value) {
    Node* node = findNode(key);
    if (node != nullptr) {
        node->value = value;
        markRecent(node);
        return;
    }
    if (size == CAPACITY) removeNode(head);
    node = new Node(key, value);
    insertInTable(node);
    addLast(node);
    size++;
}`,
  'cache-get': `bool get(const std::string& key, std::string& value) {
    Node* node = findNode(key);
    if (node == nullptr) return false;
    value = node->value;
    markRecent(node);
    return true;
}`,
  'remove-value': `bool remove(const std::string& key) {
    Node* node = findNode(key);
    if (node == nullptr) return false;
    removeNode(node);
    return true;
}`,
  clear: `void clear() {
    while (head != nullptr) removeNode(head);
}`,
};

const lruHelpers = `int hash(const std::string& key) const {
    unsigned int result = 0;
    for (char character : key) result = result * 31u + static_cast<unsigned char>(character);
    return static_cast<int>(result % BUCKETS);
}

Node* findNode(const std::string& key) const {
    Node* current = table[hash(key)];
    while (current != nullptr && current->key != key) current = current->bucketNext;
    return current;
}

void insertInTable(Node* node) {
    int index = hash(node->key);
    node->bucketNext = table[index];
    table[index] = node;
}

void detachFromTable(Node* node) {
    int index = hash(node->key);
    Node* current = table[index];
    Node* previous = nullptr;
    while (current != nullptr && current != node) {
        previous = current;
        current = current->bucketNext;
    }
    if (current == nullptr) return;
    if (previous == nullptr) table[index] = current->bucketNext;
    else previous->bucketNext = current->bucketNext;
}

void detach(Node* node) {
    if (node->prev != nullptr) node->prev->next = node->next;
    else head = node->next;
    if (node->next != nullptr) node->next->prev = node->prev;
    else tail = node->prev;
}

void addLast(Node* node) {
    node->prev = tail;
    node->next = nullptr;
    if (tail != nullptr) tail->next = node;
    else head = node;
    tail = node;
}

void markRecent(Node* node) {
    detach(node);
    addLast(node);
}

void removeNode(Node* node) {
    detach(node);
    detachFromTable(node);
    delete node;
    size--;
}`;

function lruCpp(actionId) {
  const operation = lruOperations[actionId];
  if (!operation) return null;
  return `#include <string>

class LRUCache {
public:
    static const int CAPACITY = 5;
    static const int BUCKETS = 11;
    struct Node {
        std::string key;
        std::string value;
        Node* prev;
        Node* next;
        Node* bucketNext;
        Node(const std::string& key, const std::string& value)
            : key(key), value(value), prev(nullptr), next(nullptr), bucketNext(nullptr) {}
    };
    Node** table;
    Node* head = nullptr;
    Node* tail = nullptr;
    int size = 0;

    LRUCache() : table(new Node*[BUCKETS]{}) {
        addInitial("A"); addInitial("D"); addInitial("B"); addInitial("F"); addInitial("C");
    }
    LRUCache(const LRUCache&) = delete;
    LRUCache& operator=(const LRUCache&) = delete;
    ~LRUCache() {
        clearNodes();
        delete[] table;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Auxiliary methods used above
${indent(lruHelpers)}

private:
    void addInitial(const std::string& key) {
        Node* node = new Node(key, key);
        insertInTable(node);
        addLast(node);
        size++;
    }

    void clearNodes() {
        Node* current = head;
        while (current != nullptr) {
            Node* removed = current;
            current = current->next;
            delete removed;
        }
        for (int i = 0; i < BUCKETS; i++) table[i] = nullptr;
        head = nullptr;
        tail = nullptr;
        size = 0;
    }
};`;
}

export function getOtherCpp(algorithmId, actionId, initialValues = []) {
  if (algorithmId === 'union-find') return unionFindCpp(actionId);
  if (algorithmId === 'bloom-filter') return bloomCpp(actionId, initialValues);
  if (algorithmId === 'lru-cache') return lruCpp(actionId);
  return null;
}
