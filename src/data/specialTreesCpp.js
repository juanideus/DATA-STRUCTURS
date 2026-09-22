const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const trieOperations = {
  'set-word': `void insertWord(const std::string& word) {
    Node* current = root;
    for (int i = 0; i < static_cast<int>(word.length()); i++) {
        int letter = word[i] - 'A';
        if (letter < 0 || letter >= ALPHABET) return;
        if (current->children[letter] == nullptr) current->children[letter] = new Node();
        current = current->children[letter];
    }
    current->isWord = true;
}`,
  'word-find': `bool searchWord(const std::string& word) const {
    Node* current = root;
    for (int i = 0; i < static_cast<int>(word.length()); i++) {
        int letter = word[i] - 'A';
        if (letter < 0 || letter >= ALPHABET || current->children[letter] == nullptr) return false;
        current = current->children[letter];
    }
    return current->isWord;
}`,
  'remove-word': `bool removeWord(const std::string& word) {
    bool removed = false;
    removeRecursive(root, word, 0, removed);
    return removed;
}`,
  clear: `void clear() {
    for (int letter = 0; letter < ALPHABET; letter++) {
        destroy(root->children[letter]);
        root->children[letter] = nullptr;
    }
    root->isWord = false;
}`,
};

const trieRemove = `bool removeRecursive(Node* node, const std::string& word, int depth, bool& removed) {
    if (depth == static_cast<int>(word.length())) {
        if (!node->isWord) return false;
        node->isWord = false;
        removed = true;
    } else {
        int letter = word[depth] - 'A';
        if (letter < 0 || letter >= ALPHABET || node->children[letter] == nullptr) return false;
        if (removeRecursive(node->children[letter], word, depth + 1, removed)) {
            delete node->children[letter];
            node->children[letter] = nullptr;
        }
    }
    if (node->isWord) return false;
    for (int letter = 0; letter < ALPHABET; letter++) {
        if (node->children[letter] != nullptr) return false;
    }
    return node != root;
}`;

function trieCpp(actionId) {
  const operation = trieOperations[actionId];
  if (!operation) return null;
  return `class Trie {
public:
    static const int ALPHABET = 26;
    struct Node {
        Node** children;
        bool isWord;
        Node() : children(new Node*[ALPHABET]{}), isWord(false) {}
        ~Node() { delete[] children; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;
    };
    Node* root = new Node();

    ~Trie() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${actionId === 'remove-word' ? `\n    // Recursive removal used above\n${indent(trieRemove)}` : ''}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        for (int letter = 0; letter < ALPHABET; letter++) destroy(node->children[letter]);
        delete node;
    }
};`;
}

const suffixOperations = {
  'set-word': `void buildSuffixTree(const std::string& newText) {
    clearTree();
    text = newText;
    for (int start = 0; start < static_cast<int>(text.length()); start++) {
        insertSuffix(text, start);
    }
}`,
  'word-find': `bool contains(const std::string& pattern) const {
    Node* current = root;
    for (int i = 0; i < static_cast<int>(pattern.length()); i++) {
        int letter = pattern[i] - 'A';
        if (letter < 0 || letter >= ALPHABET || current->children[letter] == nullptr) return false;
        current = current->children[letter];
    }
    return true;
}`,
  'remove-word': `void clearText() {
    clearTree();
    text.clear();
}`,
  clear: `void clear() {
    clearTree();
    text.clear();
}`,
};

const suffixHelpers = `void insertSuffix(const std::string& value, int start) {
    Node* current = root;
    for (int i = start; i < static_cast<int>(value.length()); i++) {
        int letter = value[i] - 'A';
        if (letter < 0 || letter >= ALPHABET) return;
        if (current->children[letter] == nullptr) current->children[letter] = new Node();
        current = current->children[letter];
    }
    current->isSuffixEnd = true;
}

void clearTree() {
    destroy(root);
    root = new Node();
}`;

function suffixCpp(actionId) {
  const operation = suffixOperations[actionId];
  if (!operation) return null;
  return `class SuffixTrie {
public:
    static const int ALPHABET = 26;
    struct Node {
        Node** children;
        bool isSuffixEnd;
        Node() : children(new Node*[ALPHABET]{}), isSuffixEnd(false) {}
        ~Node() { delete[] children; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;
    };
    Node* root = new Node();
    std::string text;

    ~SuffixTrie() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Pointer helpers used above
${indent(suffixHelpers)}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        for (int letter = 0; letter < ALPHABET; letter++) destroy(node->children[letter]);
        delete node;
    }
};`;
}

const segmentOperations = {
  'range-update': `void update(int node, int left, int right, int index, int value) {
    if (left == right) {
        tree[node] = value;
        minimumTree[node] = value;
        return;
    }
    int middle = (left + right) / 2;
    if (index <= middle) update(node * 2, left, middle, index, value);
    else update(node * 2 + 1, middle + 1, right, index, value);
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
    minimumTree[node] = minimumTree[node * 2] < minimumTree[node * 2 + 1]
        ? minimumTree[node * 2] : minimumTree[node * 2 + 1];
}`,
  'prefix-sum': `int prefixSum(int node, int left, int right, int end) const {
    if (right <= end) return tree[node];
    if (left > end) return 0;
    int middle = (left + right) / 2;
    return prefixSum(node * 2, left, middle, end)
        + prefixSum(node * 2 + 1, middle + 1, right, end);
}`,
  'range-min': `int prefixMinimum(int node, int left, int right, int end) const {
    if (right <= end) return minimumTree[node];
    if (left > end) return INF;
    int middle = (left + right) / 2;
    int first = prefixMinimum(node * 2, left, middle, end);
    int second = prefixMinimum(node * 2 + 1, middle + 1, right, end);
    return first < second ? first : second;
}`,
  reset: `void reset() {
    size = initialSize;
    for (int i = 0; i < size; i++) values[i] = initialValues[i];
}`,
};

function segmentCpp(actionId) {
  const operation = segmentOperations[actionId];
  if (!operation) return null;
  return `class SegmentTree {
public:
    static const int CAPACITY = 100;
    static const int INF = 1000000000;
    int* values;
    int* initialValues;
    int* tree;
    int* minimumTree;
    int size = 0;
    int initialSize = 0;

    SegmentTree()
        : values(new int[CAPACITY]{}), initialValues(new int[CAPACITY]{}),
          tree(new int[CAPACITY * 4]{}), minimumTree(new int[CAPACITY * 4]{}) {}
    ~SegmentTree() {
        delete[] values;
        delete[] initialValues;
        delete[] tree;
        delete[] minimumTree;
    }
    SegmentTree(const SegmentTree&) = delete;
    SegmentTree& operator=(const SegmentTree&) = delete;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
};`;
}

const fenwickOperations = {
  'range-update': `void add(int index, int delta) {
    values[index] += delta;
    index++;
    while (index <= size) {
        bit[index] += delta;
        index += index & -index;
    }
}`,
  'prefix-sum': `int prefixSum(int index) const {
    index++;
    int sum = 0;
    while (index > 0) {
        sum += bit[index];
        index -= index & -index;
    }
    return sum;
}`,
  'range-min': `int prefixMinimum(int end) const {
    int minimum = values[0];
    for (int index = 1; index <= end; index++) {
        if (values[index] < minimum) minimum = values[index];
    }
    return minimum;
}`,
  reset: segmentOperations.reset,
};

function fenwickCpp(actionId) {
  const operation = fenwickOperations[actionId];
  if (!operation) return null;
  return `class FenwickTree {
public:
    static const int CAPACITY = 100;
    int* values;
    int* initialValues;
    int* bit;
    int size = 0;
    int initialSize = 0;

    FenwickTree()
        : values(new int[CAPACITY]{}), initialValues(new int[CAPACITY]{}),
          bit(new int[CAPACITY + 1]{}) {}
    ~FenwickTree() {
        delete[] values;
        delete[] initialValues;
        delete[] bit;
    }
    FenwickTree(const FenwickTree&) = delete;
    FenwickTree& operator=(const FenwickTree&) = delete;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
};`;
}

const merkleOperations = {
  'add-end': `bool addBlock(const std::string& value) {
    if (size == CAPACITY) return false;
    blocks[size] = value;
    size++;
    return true;
}`,
  'remove-end': `bool removeLastBlock(std::string& removed) {
    if (size == 0) return false;
    size--;
    removed = blocks[size];
    blocks[size].clear();
    return true;
}`,
  'merkle-root': `unsigned int calculateMerkleRoot() const {
    if (size == 0) return 0;
    unsigned int* level = new unsigned int[CAPACITY]{};
    for (int i = 0; i < size; i++) level[i] = simpleHash(blocks[i]);
    int count = size;
    while (count > 1) {
        int nextCount = (count + 1) / 2;
        for (int i = 0; i < nextCount; i++) {
            unsigned int left = level[i * 2];
            unsigned int right = i * 2 + 1 < count ? level[i * 2 + 1] : left;
            level[i] = combineHash(left, right);
        }
        count = nextCount;
    }
    unsigned int rootHash = level[0];
    delete[] level;
    return rootHash;
}`,
  clear: `void clear() {
    for (int i = 0; i < size; i++) blocks[i].clear();
    size = 0;
}`,
};

const merkleHelpers = `unsigned int simpleHash(const std::string& text) const {
    unsigned int hash = 7;
    for (char character : text) hash = hash * 31u + static_cast<unsigned char>(character);
    return hash;
}

unsigned int combineHash(unsigned int left, unsigned int right) const {
    return left * 31u + right;
}`;

function merkleCpp(actionId) {
  const operation = merkleOperations[actionId];
  if (!operation) return null;
  return `class MerkleTree {
public:
    static const int CAPACITY = 8;
    std::string* blocks;
    int size = 0;

    MerkleTree() : blocks(new std::string[CAPACITY]) {}
    ~MerkleTree() { delete[] blocks; }
    MerkleTree(const MerkleTree&) = delete;
    MerkleTree& operator=(const MerkleTree&) = delete;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${actionId === 'merkle-root' ? `\n    // Hash helpers used above\n${indent(merkleHelpers)}` : ''}
};`;
}

const kdOperations = {
  'tree-add': `Node* insert(Node* node, int value, int depth) {
    if (node == nullptr) return new Node(value);
    int axis = depth % DIMENSIONS;
    if (coordinate(value, axis) < coordinate(node->value, axis)) {
        node->left = insert(node->left, value, depth + 1);
    } else {
        node->right = insert(node->right, value, depth + 1);
    }
    return node;
}`,
  'remove-value': `Node* remove(Node* node, int target, int depth) {
    if (node == nullptr) return nullptr;
    int axis = depth % DIMENSIONS;
    if (node->value == target) {
        if (node->right != nullptr) {
            Node* replacement = findMin(node->right, axis, depth + 1);
            node->value = replacement->value;
            node->right = remove(node->right, replacement->value, depth + 1);
        } else if (node->left != nullptr) {
            Node* replacement = findMin(node->left, axis, depth + 1);
            node->value = replacement->value;
            node->right = remove(node->left, replacement->value, depth + 1);
            node->left = nullptr;
        } else {
            delete node;
            return nullptr;
        }
    } else if (coordinate(target, axis) < coordinate(node->value, axis)) {
        node->left = remove(node->left, target, depth + 1);
    } else {
        node->right = remove(node->right, target, depth + 1);
    }
    return node;
}`,
  find: `Node* search(Node* node, int target, int depth) const {
    if (node == nullptr || node->value == target) return node;
    int axis = depth % DIMENSIONS;
    if (coordinate(target, axis) < coordinate(node->value, axis)) return search(node->left, target, depth + 1);
    return search(node->right, target, depth + 1);
}`,
  preorder: `void preorder(Node* node) {
    if (node == nullptr) return;
    lastVisited = node->value;
    preorder(node->left);
    preorder(node->right);
}`,
};

const kdHelpers = `int coordinate(int point, int axis) const {
    return axis == 0 ? point / 10 : point % 10;
}

Node* findMin(Node* node, int targetAxis, int depth) const {
    if (node == nullptr) return nullptr;
    int axis = depth % DIMENSIONS;
    if (axis == targetAxis) return node->left == nullptr ? node : findMin(node->left, targetAxis, depth + 1);
    Node* left = findMin(node->left, targetAxis, depth + 1);
    Node* right = findMin(node->right, targetAxis, depth + 1);
    Node* minimum = node;
    if (left != nullptr && coordinate(left->value, targetAxis) < coordinate(minimum->value, targetAxis)) minimum = left;
    if (right != nullptr && coordinate(right->value, targetAxis) < coordinate(minimum->value, targetAxis)) minimum = right;
    return minimum;
}`;

function kdCpp(actionId) {
  const operation = kdOperations[actionId];
  if (!operation) return null;
  return `class KDTree {
public:
    static const int DIMENSIONS = 2;
    struct Node {
        int value;
        Node* left;
        Node* right;
        explicit Node(int value) : value(value), left(nullptr), right(nullptr) {}
    };
    Node* root = nullptr;
    int lastVisited = 0;

    ~KDTree() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Coordinate helpers used above
${indent(kdHelpers)}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        destroy(node->left);
        destroy(node->right);
        delete node;
    }
};`;
}

export function getSpecialTreesCpp(algorithmId, actionId) {
  if (algorithmId === 'trie') return trieCpp(actionId);
  if (algorithmId === 'suffix-tree') return suffixCpp(actionId);
  if (algorithmId === 'segment-tree') return segmentCpp(actionId);
  if (algorithmId === 'fenwick-tree') return fenwickCpp(actionId);
  if (algorithmId === 'merkle-tree') return merkleCpp(actionId);
  if (algorithmId === 'kd-tree') return kdCpp(actionId);
  return null;
}
