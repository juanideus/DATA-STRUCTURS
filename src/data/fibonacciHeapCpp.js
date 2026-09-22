const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'heap-add': `Node* insert(int value) {
    Node* node = new Node(value);
    addToRootList(node);
    if (minimum == nullptr || value < minimum->value) minimum = node;
    nodeCount++;
    return node;
}`,
  'heap-extract': `bool extractMinimum(int& removedValue) {
    Node* removed = minimum;
    if (removed == nullptr) return false;
    removedValue = removed->value;

    Node** children = new Node*[CAPACITY]{};
    int childCount = 0;
    if (removed->child != nullptr) {
        Node* child = removed->child;
        do {
            children[childCount++] = child;
            child = child->right;
        } while (child != removed->child && childCount < CAPACITY);
    }
    for (int i = 0; i < childCount; i++) {
        removeFromList(children[i]);
        children[i]->parent = nullptr;
        children[i]->marked = false;
        addToRootList(children[i]);
    }
    delete[] children;

    Node* nextRoot = removed->right;
    bool wasOnlyRoot = nextRoot == removed;
    removeFromList(removed);
    if (wasOnlyRoot) minimum = nullptr;
    else {
        minimum = nextRoot;
        consolidate();
    }
    delete removed;
    nodeCount--;
    return true;
}`,
  peek: `bool peekMinimum(int& value) const {
    if (minimum == nullptr) return false;
    value = minimum->value;
    return true;
}`,
  clear: `void clear() {
    destroyCircular(minimum);
    minimum = nullptr;
    nodeCount = 0;
}`,
};

const helpers = `void addToRootList(Node* node) {
    if (minimum == nullptr) {
        node->left = node;
        node->right = node;
        minimum = node;
        return;
    }
    node->right = minimum->right;
    node->left = minimum;
    minimum->right->left = node;
    minimum->right = node;
}

void removeFromList(Node* node) {
    node->left->right = node->right;
    node->right->left = node->left;
    node->left = node;
    node->right = node;
}

void linkAsChild(Node* child, Node* parent) {
    removeFromList(child);
    child->parent = parent;
    child->marked = false;
    if (parent->child == nullptr) {
        parent->child = child;
    } else {
        child->right = parent->child->right;
        child->left = parent->child;
        parent->child->right->left = child;
        parent->child->right = child;
    }
    parent->degree++;
}

void consolidate() {
    Node** degreeTable = new Node*[MAX_DEGREE]{};
    Node** roots = new Node*[CAPACITY]{};
    int rootCount = 0;
    Node* current = minimum;
    do {
        roots[rootCount++] = current;
        current = current->right;
    } while (current != minimum && rootCount < CAPACITY);

    for (int i = 0; i < rootCount; i++) {
        Node* first = roots[i];
        int degree = first->degree;
        while (degreeTable[degree] != nullptr) {
            Node* second = degreeTable[degree];
            if (first->value > second->value) {
                Node* temporary = first;
                first = second;
                second = temporary;
            }
            linkAsChild(second, first);
            degreeTable[degree] = nullptr;
            degree++;
        }
        degreeTable[degree] = first;
    }

    minimum = nullptr;
    for (int degree = 0; degree < MAX_DEGREE; degree++) {
        Node* root = degreeTable[degree];
        if (root == nullptr) continue;
        root->left = root;
        root->right = root;
        addToRootList(root);
        if (root->value < minimum->value) minimum = root;
    }
    delete[] degreeTable;
    delete[] roots;
}`;

export function getFibonacciHeapCpp(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  return `class FibonacciHeap {
public:
    static const int CAPACITY = 1024;
    static const int MAX_DEGREE = 64;
    struct Node {
        int value;
        int degree;
        bool marked;
        Node* parent;
        Node* child;
        Node* left;
        Node* right;
        explicit Node(int value)
            : value(value), degree(0), marked(false), parent(nullptr), child(nullptr), left(this), right(this) {}
    };
    Node* minimum = nullptr;
    int nodeCount = 0;

    ~FibonacciHeap() { destroyCircular(minimum); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Circular-list linking and degree consolidation
${indent(helpers)}

private:
    void destroyCircular(Node* start) {
        if (start == nullptr) return;
        Node* current = start;
        do {
            Node* next = current->right;
            destroyCircular(current->child);
            delete current;
            current = next;
        } while (current != start);
    }
};`;
}
