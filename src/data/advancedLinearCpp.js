const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'sorted-add': `void insert(int value) {
    Node** update = new Node*[MAX_LEVEL]{};
    Node* current = head;
    for (int level = currentLevel; level >= 0; level--) {
        while (current->next[level] != nullptr && current->next[level]->value < value) {
            current = current->next[level];
        }
        update[level] = current;
    }
    current = current->next[0];
    if (current != nullptr && current->value == value) {
        delete[] update;
        return;
    }

    int newLevel = randomLevel();
    if (newLevel > currentLevel) {
        for (int level = currentLevel + 1; level <= newLevel; level++) update[level] = head;
        currentLevel = newLevel;
    }
    Node* newNode = new Node(value, newLevel);
    for (int level = 0; level <= newLevel; level++) {
        newNode->next[level] = update[level]->next[level];
        update[level]->next[level] = newNode;
    }
    size++;
    delete[] update;
}`,
  'remove-value': `bool remove(int value) {
    Node** update = new Node*[MAX_LEVEL]{};
    Node* current = head;
    for (int level = currentLevel; level >= 0; level--) {
        while (current->next[level] != nullptr && current->next[level]->value < value) {
            current = current->next[level];
        }
        update[level] = current;
    }
    current = current->next[0];
    if (current == nullptr || current->value != value) {
        delete[] update;
        return false;
    }
    for (int level = 0; level <= currentLevel; level++) {
        if (update[level]->next[level] != current) break;
        update[level]->next[level] = current->next[level];
    }
    delete current;
    while (currentLevel > 0 && head->next[currentLevel] == nullptr) currentLevel--;
    size--;
    delete[] update;
    return true;
}`,
  find: `bool contains(int value) const {
    Node* current = head;
    for (int level = currentLevel; level >= 0; level--) {
        while (current->next[level] != nullptr && current->next[level]->value < value) {
            current = current->next[level];
        }
    }
    current = current->next[0];
    return current != nullptr && current->value == value;
}`,
  clear: `void clear() {
    Node* current = head->next[0];
    while (current != nullptr) {
        Node* removed = current;
        current = current->next[0];
        delete removed;
    }
    for (int level = 0; level < MAX_LEVEL; level++) head->next[level] = nullptr;
    currentLevel = 0;
    size = 0;
}`,
};

const randomLevel = `int randomLevel() {
    seed = seed * 1103515245u + 12345u;
    int level = 0;
    while (level < MAX_LEVEL - 1 && ((seed >> level) & 1u) == 1u) level++;
    return level;
}`;

export function getSkipListCpp(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  return `class SkipList {
public:
    static const int MAX_LEVEL = 6;
    struct Node {
        int value;
        int level;
        Node** next;
        Node(int value, int level)
            : value(value), level(level), next(new Node*[MAX_LEVEL]{}) {}
        ~Node() { delete[] next; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;
    };
    Node* head = new Node(0, MAX_LEVEL - 1);
    int currentLevel = 0;
    int size = 0;
    unsigned int seed = 123456789u;

    ~SkipList() {
        clearNodes();
        delete head;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${actionId === 'sorted-add' ? `\n    // Auxiliary method used above\n${indent(randomLevel)}` : ''}

private:
    void clearNodes() {
        Node* current = head->next[0];
        while (current != nullptr) {
            Node* removed = current;
            current = current->next[0];
            delete removed;
        }
        for (int level = 0; level < MAX_LEVEL; level++) head->next[level] = nullptr;
        currentLevel = 0;
        size = 0;
    }
};`;
}
