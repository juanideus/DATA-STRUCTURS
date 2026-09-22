const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const openOperations = {
  'hash-put': `bool put(const std::string& key, const std::string& value) {
    int index = hash(key);
    int firstDeleted = -1;
    int probes = 0;
    while (states[index] != EMPTY && probes < CAPACITY) {
        if (states[index] == OCCUPIED && keys[index] == key) {
            values[index] = value;
            return true;
        }
        if (states[index] == DELETED && firstDeleted == -1) firstDeleted = index;
        index = (index + 1) % CAPACITY;
        probes++;
    }
    if (firstDeleted != -1) index = firstDeleted;
    else if (probes == CAPACITY) return false;
    keys[index] = key;
    values[index] = value;
    states[index] = OCCUPIED;
    size++;
    return true;
}`,
  'remove-value': `bool remove(const std::string& key) {
    int index = hash(key);
    int probes = 0;
    while (states[index] != EMPTY && probes < CAPACITY) {
        if (states[index] == OCCUPIED && keys[index] == key) {
            states[index] = DELETED;
            keys[index].clear();
            values[index].clear();
            size--;
            return true;
        }
        index = (index + 1) % CAPACITY;
        probes++;
    }
    return false;
}`,
  find: `bool find(const std::string& key, std::string& value) const {
    int index = hash(key);
    int probes = 0;
    while (states[index] != EMPTY && probes < CAPACITY) {
        if (states[index] == OCCUPIED && keys[index] == key) {
            value = values[index];
            return true;
        }
        index = (index + 1) % CAPACITY;
        probes++;
    }
    return false;
}`,
  clear: `void clear() {
    for (int i = 0; i < CAPACITY; i++) {
        states[i] = EMPTY;
        keys[i].clear();
        values[i].clear();
    }
    size = 0;
}`,
};

const stringHash = `int hash(const std::string& key) const {
    unsigned int result = 0;
    for (char character : key) result = result * 31u + static_cast<unsigned char>(character);
    return static_cast<int>(result % CAPACITY);
}`;

function openCpp(actionId) {
  const operation = openOperations[actionId];
  if (!operation) return null;
  return `class OpenAddressingTable {
public:
    static const int CAPACITY = 12;
    static const unsigned char EMPTY = 0;
    static const unsigned char OCCUPIED = 1;
    static const unsigned char DELETED = 2;
    std::string* keys;
    std::string* values;
    unsigned char* states;
    int size = 0;

    OpenAddressingTable()
        : keys(new std::string[CAPACITY]), values(new std::string[CAPACITY]),
          states(new unsigned char[CAPACITY]{}) {}
    OpenAddressingTable(const OpenAddressingTable&) = delete;
    OpenAddressingTable& operator=(const OpenAddressingTable&) = delete;
    ~OpenAddressingTable() {
        delete[] keys;
        delete[] values;
        delete[] states;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Auxiliary method used above
${indent(stringHash)}
};`;
}

const chainingOperations = {
  'hash-put': `void put(const std::string& key, const std::string& value) {
    int index = hash(key);
    Node* current = buckets[index];
    while (current != nullptr) {
        if (current->key == key) {
            current->value = value;
            return;
        }
        current = current->next;
    }
    buckets[index] = new Node(key, value, buckets[index]);
    size++;
}`,
  'remove-value': `bool remove(const std::string& key) {
    int index = hash(key);
    Node* current = buckets[index];
    Node* previous = nullptr;
    while (current != nullptr) {
        if (current->key == key) {
            if (previous == nullptr) buckets[index] = current->next;
            else previous->next = current->next;
            delete current;
            size--;
            return true;
        }
        previous = current;
        current = current->next;
    }
    return false;
}`,
  find: `bool find(const std::string& key, std::string& value) const {
    Node* current = buckets[hash(key)];
    while (current != nullptr) {
        if (current->key == key) {
            value = current->value;
            return true;
        }
        current = current->next;
    }
    return false;
}`,
  clear: `void clear() {
    for (int index = 0; index < BUCKET_COUNT; index++) {
        Node* current = buckets[index];
        while (current != nullptr) {
            Node* removed = current;
            current = current->next;
            delete removed;
        }
        buckets[index] = nullptr;
    }
    size = 0;
}`,
};

function chainingCpp(actionId) {
  const operation = chainingOperations[actionId];
  if (!operation) return null;
  return `class SeparateChainingTable {
public:
    static const int BUCKET_COUNT = 8;
    struct Node {
        std::string key;
        std::string value;
        Node* next;
        Node(const std::string& key, const std::string& value, Node* next)
            : key(key), value(value), next(next) {}
    };
    Node** buckets;
    int size = 0;

    SeparateChainingTable() : buckets(new Node*[BUCKET_COUNT]{}) {}
    SeparateChainingTable(const SeparateChainingTable&) = delete;
    SeparateChainingTable& operator=(const SeparateChainingTable&) = delete;
    ~SeparateChainingTable() {
        clearNodes();
        delete[] buckets;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    int hash(const std::string& key) const {
        unsigned int result = 0;
        for (char character : key) result = result * 31u + static_cast<unsigned char>(character);
        return static_cast<int>(result % BUCKET_COUNT);
    }

private:
    void clearNodes() {
        for (int index = 0; index < BUCKET_COUNT; index++) {
            Node* current = buckets[index];
            while (current != nullptr) {
                Node* removed = current;
                current = current->next;
                delete removed;
            }
            buckets[index] = nullptr;
        }
        size = 0;
    }
};`;
}

export function getHashCpp(algorithmId, actionId) {
  if (['hash-table', 'hash-open'].includes(algorithmId)) return openCpp(actionId);
  if (algorithmId === 'hash-chaining') return chainingCpp(actionId);
  return null;
}
