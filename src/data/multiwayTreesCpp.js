const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const btreeOperations = {
  'sorted-add': `bool insert(int value) {
    if (contains(root, value)) return false;
    if (root->keyCount == MAX_KEYS) {
        Node* newRoot = new Node(false);
        newRoot->children[0] = root;
        splitChild(newRoot, 0);
        root = newRoot;
    }
    insertNonFull(root, value);
    return true;
}`,
  'remove-value': `bool remove(int target) {
    if (!contains(root, target)) return false;
    removeFromNode(root, target);
    if (root->keyCount == 0 && !root->leaf) {
        Node* oldRoot = root;
        root = root->children[0];
        oldRoot->children[0] = nullptr;
        delete oldRoot;
    }
    return true;
}`,
  find: `Node* search(Node* node, int target) const {
    int index = 0;
    while (index < node->keyCount && target > node->keys[index]) index++;
    if (index < node->keyCount && target == node->keys[index]) return node;
    if (node->leaf) return nullptr;
    return search(node->children[index], target);
}`,
  'range-view': `void inorder(Node* node) {
    for (int index = 0; index < node->keyCount; index++) {
        if (!node->leaf) inorder(node->children[index]);
        lastVisited = node->keys[index];
    }
    if (!node->leaf) inorder(node->children[node->keyCount]);
}`,
};

const btreeHelpers = `bool contains(Node* node, int target) const {
    int index = 0;
    while (index < node->keyCount && target > node->keys[index]) index++;
    if (index < node->keyCount && target == node->keys[index]) return true;
    return !node->leaf && contains(node->children[index], target);
}

void insertNonFull(Node* node, int value) {
    int index = node->keyCount - 1;
    if (node->leaf) {
        while (index >= 0 && value < node->keys[index]) {
            node->keys[index + 1] = node->keys[index];
            index--;
        }
        node->keys[index + 1] = value;
        node->keyCount++;
        return;
    }
    while (index >= 0 && value < node->keys[index]) index--;
    index++;
    if (node->children[index]->keyCount == MAX_KEYS) {
        splitChild(node, index);
        if (value > node->keys[index]) index++;
    }
    insertNonFull(node->children[index], value);
}

void splitChild(Node* parent, int childIndex) {
    Node* full = parent->children[childIndex];
    Node* right = new Node(full->leaf);
    right->keyCount = MIN_KEYS;
    for (int i = 0; i < MIN_KEYS; i++) right->keys[i] = full->keys[i + DEGREE];
    if (!full->leaf) {
        for (int i = 0; i < DEGREE; i++) {
            right->children[i] = full->children[i + DEGREE];
            full->children[i + DEGREE] = nullptr;
        }
    }
    full->keyCount = MIN_KEYS;
    for (int i = parent->keyCount; i > childIndex; i--) parent->children[i + 1] = parent->children[i];
    parent->children[childIndex + 1] = right;
    for (int i = parent->keyCount - 1; i >= childIndex; i--) parent->keys[i + 1] = parent->keys[i];
    parent->keys[childIndex] = full->keys[MIN_KEYS];
    parent->keyCount++;
}

int findKey(Node* node, int target) const {
    int index = 0;
    while (index < node->keyCount && node->keys[index] < target) index++;
    return index;
}

void removeFromNode(Node* node, int target) {
    int index = findKey(node, target);
    if (index < node->keyCount && node->keys[index] == target) {
        if (node->leaf) {
            for (int i = index; i < node->keyCount - 1; i++) node->keys[i] = node->keys[i + 1];
            node->keyCount--;
        } else if (node->children[index]->keyCount >= DEGREE) {
            int predecessor = greatest(node->children[index]);
            node->keys[index] = predecessor;
            removeFromNode(node->children[index], predecessor);
        } else if (node->children[index + 1]->keyCount >= DEGREE) {
            int successor = smallest(node->children[index + 1]);
            node->keys[index] = successor;
            removeFromNode(node->children[index + 1], successor);
        } else {
            mergeChildren(node, index);
            removeFromNode(node->children[index], target);
        }
        return;
    }
    if (node->leaf) return;
    bool lastChild = index == node->keyCount;
    if (node->children[index]->keyCount == MIN_KEYS) fillChild(node, index);
    if (lastChild && index > node->keyCount) removeFromNode(node->children[index - 1], target);
    else removeFromNode(node->children[index], target);
}

int smallest(Node* node) const {
    while (!node->leaf) node = node->children[0];
    return node->keys[0];
}

int greatest(Node* node) const {
    while (!node->leaf) node = node->children[node->keyCount];
    return node->keys[node->keyCount - 1];
}

void fillChild(Node* parent, int index) {
    if (index > 0 && parent->children[index - 1]->keyCount >= DEGREE) borrowPrevious(parent, index);
    else if (index < parent->keyCount && parent->children[index + 1]->keyCount >= DEGREE) borrowNext(parent, index);
    else if (index < parent->keyCount) mergeChildren(parent, index);
    else mergeChildren(parent, index - 1);
}

void borrowPrevious(Node* parent, int index) {
    Node* child = parent->children[index];
    Node* sibling = parent->children[index - 1];
    for (int i = child->keyCount; i > 0; i--) child->keys[i] = child->keys[i - 1];
    if (!child->leaf) {
        for (int i = child->keyCount + 1; i > 0; i--) child->children[i] = child->children[i - 1];
        child->children[0] = sibling->children[sibling->keyCount];
        sibling->children[sibling->keyCount] = nullptr;
    }
    child->keys[0] = parent->keys[index - 1];
    parent->keys[index - 1] = sibling->keys[sibling->keyCount - 1];
    child->keyCount++;
    sibling->keyCount--;
}

void borrowNext(Node* parent, int index) {
    Node* child = parent->children[index];
    Node* sibling = parent->children[index + 1];
    child->keys[child->keyCount] = parent->keys[index];
    if (!child->leaf) child->children[child->keyCount + 1] = sibling->children[0];
    parent->keys[index] = sibling->keys[0];
    for (int i = 0; i < sibling->keyCount - 1; i++) sibling->keys[i] = sibling->keys[i + 1];
    if (!sibling->leaf) {
        for (int i = 0; i < sibling->keyCount; i++) sibling->children[i] = sibling->children[i + 1];
        sibling->children[sibling->keyCount] = nullptr;
    }
    child->keyCount++;
    sibling->keyCount--;
}

void mergeChildren(Node* parent, int leftIndex) {
    Node* left = parent->children[leftIndex];
    Node* right = parent->children[leftIndex + 1];
    left->keys[MIN_KEYS] = parent->keys[leftIndex];
    for (int i = 0; i < right->keyCount; i++) left->keys[i + DEGREE] = right->keys[i];
    if (!left->leaf) {
        for (int i = 0; i <= right->keyCount; i++) {
            left->children[i + DEGREE] = right->children[i];
            right->children[i] = nullptr;
        }
    }
    left->keyCount += right->keyCount + 1;
    for (int i = leftIndex; i < parent->keyCount - 1; i++) parent->keys[i] = parent->keys[i + 1];
    for (int i = leftIndex + 1; i < parent->keyCount; i++) parent->children[i] = parent->children[i + 1];
    parent->children[parent->keyCount] = nullptr;
    parent->keyCount--;
    delete right;
}`;

function btreeCpp(actionId) {
  const operation = btreeOperations[actionId];
  if (!operation) return null;
  return `class BTree {
public:
    static const int DEGREE = 2;
    static const int MAX_KEYS = DEGREE * 2 - 1;
    static const int MIN_KEYS = DEGREE - 1;
    struct Node {
        int* keys;
        Node** children;
        int keyCount;
        bool leaf;
        explicit Node(bool leaf)
            : keys(new int[MAX_KEYS]{}), children(new Node*[MAX_KEYS + 1]{}),
              keyCount(0), leaf(leaf) {}
        ~Node() { delete[] keys; delete[] children; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;
    };
    Node* root = new Node(true);
    int lastVisited = 0;

    ~BTree() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // B-Tree split, borrow and merge helpers
${indent(btreeHelpers)}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        if (!node->leaf) {
            for (int i = 0; i <= node->keyCount; i++) destroy(node->children[i]);
        }
        delete node;
    }
};`;
}

const bplusOperations = {
  'sorted-add': `bool insert(int value) {
    Node* leaf = findLeaf(value);
    if (containsInLeaf(leaf, value)) return false;
    insertInLeaf(leaf, value);
    if (leaf->keyCount > MAX_KEYS) splitLeaf(leaf);
    return true;
}`,
  'remove-value': `bool remove(int target) {
    Node* leaf = findLeaf(target);
    int index = 0;
    while (index < leaf->keyCount && leaf->keys[index] < target) index++;
    if (index == leaf->keyCount || leaf->keys[index] != target) return false;
    for (int i = index; i < leaf->keyCount - 1; i++) leaf->keys[i] = leaf->keys[i + 1];
    leaf->keyCount--;
    if (leaf != root && leaf->keyCount < MIN_LEAF_KEYS) rebalanceLeaf(leaf);
    else updateAncestorSeparator(leaf);
    return true;
}`,
  find: `Node* search(int target) const {
    Node* leaf = findLeaf(target);
    return containsInLeaf(leaf, target) ? leaf : nullptr;
}`,
  'range-view': `void traverseLeaves() {
    Node* leaf = firstLeaf();
    while (leaf != nullptr) {
        for (int i = 0; i < leaf->keyCount; i++) lastVisited = leaf->keys[i];
        leaf = leaf->next;
    }
}`,
};

const bplusHelpers = `Node* findLeaf(int value) const {
    Node* current = root;
    while (!current->leaf) {
        int child = 0;
        while (child < current->keyCount && value >= current->keys[child]) child++;
        current = current->children[child];
    }
    return current;
}

Node* firstLeaf() const {
    Node* current = root;
    while (!current->leaf) current = current->children[0];
    return current;
}

bool containsInLeaf(const Node* leaf, int value) const {
    for (int i = 0; i < leaf->keyCount; i++) if (leaf->keys[i] == value) return true;
    return false;
}

void insertInLeaf(Node* leaf, int value) {
    int index = leaf->keyCount;
    while (index > 0 && leaf->keys[index - 1] > value) {
        leaf->keys[index] = leaf->keys[index - 1];
        index--;
    }
    leaf->keys[index] = value;
    leaf->keyCount++;
}

void splitLeaf(Node* leaf) {
    Node* right = new Node(true);
    int middle = (leaf->keyCount + 1) / 2;
    for (int i = middle; i < leaf->keyCount; i++) right->keys[right->keyCount++] = leaf->keys[i];
    leaf->keyCount = middle;
    right->next = leaf->next;
    leaf->next = right;
    right->parent = leaf->parent;
    insertIntoParent(leaf, right->keys[0], right);
}

void insertIntoParent(Node* left, int separator, Node* right) {
    if (left == root) {
        Node* newRoot = new Node(false);
        newRoot->keys[0] = separator;
        newRoot->keyCount = 1;
        newRoot->children[0] = left;
        newRoot->children[1] = right;
        left->parent = newRoot;
        right->parent = newRoot;
        root = newRoot;
        return;
    }
    Node* parent = left->parent;
    int childIndex = indexOfChild(parent, left);
    for (int i = parent->keyCount; i > childIndex; i--) {
        parent->keys[i] = parent->keys[i - 1];
        parent->children[i + 1] = parent->children[i];
    }
    parent->keys[childIndex] = separator;
    parent->children[childIndex + 1] = right;
    right->parent = parent;
    parent->keyCount++;
    if (parent->keyCount > MAX_KEYS) splitInternal(parent);
}

void splitInternal(Node* node) {
    int middle = node->keyCount / 2;
    int separator = node->keys[middle];
    Node* right = new Node(false);
    right->parent = node->parent;
    for (int i = middle + 1; i < node->keyCount; i++) right->keys[right->keyCount++] = node->keys[i];
    for (int i = middle + 1; i <= node->keyCount; i++) {
        int destination = i - middle - 1;
        right->children[destination] = node->children[i];
        right->children[destination]->parent = right;
        node->children[i] = nullptr;
    }
    node->keyCount = middle;
    insertIntoParent(node, separator, right);
}

int indexOfChild(const Node* parent, const Node* child) const {
    int index = 0;
    while (index <= parent->keyCount && parent->children[index] != child) index++;
    return index;
}

int firstKey(Node* node) const {
    while (!node->leaf) node = node->children[0];
    return node->keys[0];
}

void updateAncestorSeparator(Node* node) {
    while (node != root) {
        Node* parent = node->parent;
        int index = indexOfChild(parent, node);
        if (index > 0) {
            parent->keys[index - 1] = firstKey(node);
            return;
        }
        node = parent;
    }
}

void rebalanceLeaf(Node* leaf) {
    Node* parent = leaf->parent;
    int index = indexOfChild(parent, leaf);
    Node* left = index > 0 ? parent->children[index - 1] : nullptr;
    Node* right = index < parent->keyCount ? parent->children[index + 1] : nullptr;
    if (left != nullptr && left->keyCount > MIN_LEAF_KEYS) {
        for (int i = leaf->keyCount; i > 0; i--) leaf->keys[i] = leaf->keys[i - 1];
        leaf->keys[0] = left->keys[--left->keyCount];
        leaf->keyCount++;
        updateAncestorSeparator(leaf);
    } else if (right != nullptr && right->keyCount > MIN_LEAF_KEYS) {
        leaf->keys[leaf->keyCount++] = right->keys[0];
        for (int i = 0; i < right->keyCount - 1; i++) right->keys[i] = right->keys[i + 1];
        right->keyCount--;
        updateAncestorSeparator(right);
    } else if (left != nullptr) {
        for (int i = 0; i < leaf->keyCount; i++) left->keys[left->keyCount++] = leaf->keys[i];
        left->next = leaf->next;
        removeChild(parent, index - 1, index);
        delete leaf;
    } else if (right != nullptr) {
        for (int i = 0; i < right->keyCount; i++) leaf->keys[leaf->keyCount++] = right->keys[i];
        leaf->next = right->next;
        removeChild(parent, index, index + 1);
        delete right;
    }
}

void removeChild(Node* parent, int keyIndex, int childIndex) {
    for (int i = keyIndex; i < parent->keyCount - 1; i++) parent->keys[i] = parent->keys[i + 1];
    for (int i = childIndex; i < parent->keyCount; i++) parent->children[i] = parent->children[i + 1];
    parent->children[parent->keyCount] = nullptr;
    parent->keyCount--;
    if (parent == root && parent->keyCount == 0) {
        root = parent->children[0];
        root->parent = nullptr;
        parent->children[0] = nullptr;
        delete parent;
    } else if (parent != root && parent->keyCount < MIN_INTERNAL_KEYS) {
        rebalanceInternal(parent);
    }
}

void rebalanceInternal(Node* node) {
    Node* parent = node->parent;
    int index = indexOfChild(parent, node);
    Node* left = index > 0 ? parent->children[index - 1] : nullptr;
    Node* right = index < parent->keyCount ? parent->children[index + 1] : nullptr;
    if (left != nullptr && left->keyCount > MIN_INTERNAL_KEYS) {
        for (int i = node->keyCount; i > 0; i--) node->keys[i] = node->keys[i - 1];
        for (int i = node->keyCount + 1; i > 0; i--) node->children[i] = node->children[i - 1];
        node->keys[0] = parent->keys[index - 1];
        node->children[0] = left->children[left->keyCount];
        node->children[0]->parent = node;
        parent->keys[index - 1] = left->keys[left->keyCount - 1];
        left->children[left->keyCount] = nullptr;
        left->keyCount--;
        node->keyCount++;
    } else if (right != nullptr && right->keyCount > MIN_INTERNAL_KEYS) {
        node->keys[node->keyCount] = parent->keys[index];
        node->children[node->keyCount + 1] = right->children[0];
        node->children[node->keyCount + 1]->parent = node;
        parent->keys[index] = right->keys[0];
        for (int i = 0; i < right->keyCount - 1; i++) right->keys[i] = right->keys[i + 1];
        for (int i = 0; i < right->keyCount; i++) right->children[i] = right->children[i + 1];
        right->children[right->keyCount] = nullptr;
        right->keyCount--;
        node->keyCount++;
    } else if (left != nullptr) {
        mergeInternal(left, node, parent->keys[index - 1]);
        removeChild(parent, index - 1, index);
        delete node;
    } else if (right != nullptr) {
        mergeInternal(node, right, parent->keys[index]);
        removeChild(parent, index, index + 1);
        delete right;
    }
}

void mergeInternal(Node* left, Node* right, int separator) {
    int original = left->keyCount;
    left->keys[left->keyCount++] = separator;
    for (int i = 0; i < right->keyCount; i++) left->keys[left->keyCount++] = right->keys[i];
    for (int i = 0; i <= right->keyCount; i++) {
        left->children[original + 1 + i] = right->children[i];
        left->children[original + 1 + i]->parent = left;
        right->children[i] = nullptr;
    }
}`;

function bplusCpp(actionId) {
  const operation = bplusOperations[actionId];
  if (!operation) return null;
  return `class BPlusTree {
public:
    static const int MAX_KEYS = 3;
    static const int MIN_LEAF_KEYS = 2;
    static const int MIN_INTERNAL_KEYS = 1;
    struct Node {
        int* keys;
        Node** children;
        int keyCount;
        bool leaf;
        Node* parent;
        Node* next;
        explicit Node(bool leaf)
            : keys(new int[MAX_KEYS + 1]{}), children(new Node*[MAX_KEYS + 2]{}),
              keyCount(0), leaf(leaf), parent(nullptr), next(nullptr) {}
        ~Node() { delete[] keys; delete[] children; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;
    };
    Node* root = new Node(true);
    int lastVisited = 0;

    ~BPlusTree() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // B+ internal indexes, leaf splits and linked-leaf rebalancing
${indent(bplusHelpers)}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        if (!node->leaf) {
            for (int i = 0; i <= node->keyCount; i++) destroy(node->children[i]);
        }
        delete node;
    }
};`;
}

const bstarOperations = {
  'sorted-add': `bool insert(int value) {
    if (locate(root, value) != nullptr) return false;
    Node* leaf = findLeaf(value);
    insertKey(leaf, value);
    if (leaf->keyCount > MAX_KEYS) fixOverflow(leaf);
    return true;
}`,
  'remove-value': `bool remove(int target) {
    Node* node = locate(root, target);
    if (node == nullptr) return false;
    int index = keyIndex(node, target);
    if (!node->leaf) {
        Node* predecessor = node->children[index];
        while (!predecessor->leaf) predecessor = predecessor->children[predecessor->keyCount];
        node->keys[index] = predecessor->keys[predecessor->keyCount - 1];
        node = predecessor;
        index = predecessor->keyCount - 1;
    }
    for (int i = index; i < node->keyCount - 1; i++) node->keys[i] = node->keys[i + 1];
    node->keyCount--;
    if (node != root && node->keyCount < minimumKeys(node)) fixUnderflow(node);
    if (!root->leaf && root->keyCount == 0) {
        Node* oldRoot = root;
        root = root->children[0];
        root->parent = nullptr;
        oldRoot->children[0] = nullptr;
        delete oldRoot;
    }
    return true;
}`,
  find: `Node* search(Node* node, int target) const {
    int index = 0;
    while (index < node->keyCount && target > node->keys[index]) index++;
    if (index < node->keyCount && node->keys[index] == target) return node;
    return node->leaf ? nullptr : search(node->children[index], target);
}`,
  'range-view': `void inorder(Node* node) {
    for (int i = 0; i < node->keyCount; i++) {
        if (!node->leaf) inorder(node->children[i]);
        lastVisited = node->keys[i];
    }
    if (!node->leaf) inorder(node->children[node->keyCount]);
}`,
};

const bstarHelpers = `Node* locate(Node* node, int target) const {
    int index = 0;
    while (index < node->keyCount && target > node->keys[index]) index++;
    if (index < node->keyCount && node->keys[index] == target) return node;
    return node->leaf ? nullptr : locate(node->children[index], target);
}

Node* findLeaf(int value) const {
    Node* current = root;
    while (!current->leaf) {
        int index = 0;
        while (index < current->keyCount && value > current->keys[index]) index++;
        current = current->children[index];
    }
    return current;
}

int keyIndex(const Node* node, int value) const {
    int index = 0;
    while (index < node->keyCount && node->keys[index] < value) index++;
    return index;
}

int childIndex(const Node* parent, const Node* child) const {
    int index = 0;
    while (index <= parent->keyCount && parent->children[index] != child) index++;
    return index;
}

void insertKey(Node* node, int value) {
    int index = node->keyCount;
    while (index > 0 && node->keys[index - 1] > value) {
        node->keys[index] = node->keys[index - 1];
        index--;
    }
    node->keys[index] = value;
    node->keyCount++;
}

void fixOverflow(Node* node) {
    if (node == root) {
        splitRoot();
        return;
    }
    Node* parent = node->parent;
    int index = childIndex(parent, node);
    Node* left = index > 0 ? parent->children[index - 1] : nullptr;
    Node* right = index < parent->keyCount ? parent->children[index + 1] : nullptr;
    if (right != nullptr && right->keyCount < MAX_KEYS) {
        redistributePair(node, right, index);
        return;
    }
    if (left != nullptr && left->keyCount < MAX_KEYS) {
        redistributePair(left, node, index - 1);
        return;
    }
    if (right != nullptr) splitTwoIntoThree(node, right, index);
    else splitTwoIntoThree(left, node, index - 1);
    if (parent->keyCount > MAX_KEYS) fixOverflow(parent);
}

void splitRoot() {
    Node* oldRoot = root;
    Node* left = new Node(oldRoot->leaf);
    Node* right = new Node(oldRoot->leaf);
    int middle = oldRoot->keyCount / 2;
    for (int i = 0; i < middle; i++) left->keys[left->keyCount++] = oldRoot->keys[i];
    for (int i = middle + 1; i < oldRoot->keyCount; i++) right->keys[right->keyCount++] = oldRoot->keys[i];
    if (!oldRoot->leaf) {
        for (int i = 0; i <= middle; i++) {
            left->children[i] = oldRoot->children[i];
            left->children[i]->parent = left;
            oldRoot->children[i] = nullptr;
        }
        for (int i = middle + 1; i <= oldRoot->keyCount; i++) {
            int destination = i - middle - 1;
            right->children[destination] = oldRoot->children[i];
            right->children[destination]->parent = right;
            oldRoot->children[i] = nullptr;
        }
    }
    oldRoot->leaf = false;
    oldRoot->keyCount = 1;
    oldRoot->keys[0] = oldRoot->keys[middle];
    oldRoot->children[0] = left;
    oldRoot->children[1] = right;
    left->parent = oldRoot;
    right->parent = oldRoot;
}

void collectPair(Node* left, Node* right, int separator, int* values, Node** children) {
    int valueCount = 0;
    for (int i = 0; i < left->keyCount; i++) values[valueCount++] = left->keys[i];
    values[valueCount++] = separator;
    for (int i = 0; i < right->keyCount; i++) values[valueCount++] = right->keys[i];
    if (!left->leaf) {
        int childCount = 0;
        for (int i = 0; i <= left->keyCount; i++) children[childCount++] = left->children[i];
        for (int i = 0; i <= right->keyCount; i++) children[childCount++] = right->children[i];
    }
}

void redistributePair(Node* left, Node* right, int separatorIndex) {
    Node* parent = left->parent;
    int* values = new int[MAX_KEYS * 2 + 2]{};
    Node** children = new Node*[MAX_KEYS * 2 + 3]{};
    int total = left->keyCount + right->keyCount + 1;
    collectPair(left, right, parent->keys[separatorIndex], values, children);
    int leftCount = total / 2;
    int rightCount = total - leftCount - 1;
    left->keyCount = leftCount;
    right->keyCount = rightCount;
    for (int i = 0; i < leftCount; i++) left->keys[i] = values[i];
    parent->keys[separatorIndex] = values[leftCount];
    for (int i = 0; i < rightCount; i++) right->keys[i] = values[leftCount + 1 + i];
    if (!left->leaf) {
        for (int i = 0; i <= leftCount; i++) {
            left->children[i] = children[i];
            left->children[i]->parent = left;
        }
        for (int i = 0; i <= rightCount; i++) {
            right->children[i] = children[leftCount + 1 + i];
            right->children[i]->parent = right;
        }
    }
    delete[] values;
    delete[] children;
}

void splitTwoIntoThree(Node* left, Node* right, int separatorIndex) {
    Node* parent = left->parent;
    int* values = new int[MAX_KEYS * 2 + 2]{};
    Node** children = new Node*[MAX_KEYS * 2 + 3]{};
    int total = left->keyCount + right->keyCount + 1;
    collectPair(left, right, parent->keys[separatorIndex], values, children);
    Node* middle = new Node(left->leaf);
    middle->parent = parent;
    int distributable = total - 2;
    int firstCount = distributable / 3;
    int secondCount = distributable / 3;
    int thirdCount = distributable - firstCount - secondCount;
    int firstSeparator = firstCount;
    int secondSeparator = firstCount + 1 + secondCount;
    left->keyCount = firstCount;
    middle->keyCount = secondCount;
    right->keyCount = thirdCount;
    for (int i = 0; i < firstCount; i++) left->keys[i] = values[i];
    for (int i = 0; i < secondCount; i++) middle->keys[i] = values[firstSeparator + 1 + i];
    for (int i = 0; i < thirdCount; i++) right->keys[i] = values[secondSeparator + 1 + i];
    if (!left->leaf) {
        int offset = 0;
        for (int i = 0; i <= firstCount; i++) { left->children[i] = children[offset++]; left->children[i]->parent = left; }
        for (int i = 0; i <= secondCount; i++) { middle->children[i] = children[offset++]; middle->children[i]->parent = middle; }
        for (int i = 0; i <= thirdCount; i++) { right->children[i] = children[offset++]; right->children[i]->parent = right; }
    }
    for (int i = parent->keyCount; i > separatorIndex + 1; i--) {
        parent->keys[i] = parent->keys[i - 1];
        parent->children[i + 1] = parent->children[i];
    }
    parent->keys[separatorIndex] = values[firstSeparator];
    parent->keys[separatorIndex + 1] = values[secondSeparator];
    parent->children[separatorIndex + 1] = middle;
    parent->children[separatorIndex + 2] = right;
    parent->keyCount++;
    delete[] values;
    delete[] children;
}

int minimumKeys(const Node* node) const {
    return node->parent == root ? ROOT_CHILD_MIN_KEYS : MIN_KEYS;
}

void fixUnderflow(Node* node) {
    Node* parent = node->parent;
    int index = childIndex(parent, node);
    Node* left = index > 0 ? parent->children[index - 1] : nullptr;
    Node* right = index < parent->keyCount ? parent->children[index + 1] : nullptr;
    if (left != nullptr && left->keyCount > minimumKeys(left)) {
        borrowFromLeft(node, left, parent, index - 1);
        return;
    }
    if (right != nullptr && right->keyCount > minimumKeys(right)) {
        borrowFromRight(node, right, parent, index);
        return;
    }
    if (parent == root && parent->keyCount == 1) {
        if (left != nullptr) mergePair(left, node, parent, 0);
        else mergePair(node, right, parent, 0);
        return;
    }
    int start = index == 0 ? 0 : index - 1;
    if (start + 2 > parent->keyCount) start = parent->keyCount - 2;
    mergeThreeIntoTwo(parent, start);
    if (parent != root && parent->keyCount < minimumKeys(parent)) fixUnderflow(parent);
}

void borrowFromLeft(Node* node, Node* left, Node* parent, int separator) {
    for (int i = node->keyCount; i > 0; i--) node->keys[i] = node->keys[i - 1];
    if (!node->leaf) {
        for (int i = node->keyCount + 1; i > 0; i--) node->children[i] = node->children[i - 1];
        node->children[0] = left->children[left->keyCount];
        node->children[0]->parent = node;
        left->children[left->keyCount] = nullptr;
    }
    node->keys[0] = parent->keys[separator];
    parent->keys[separator] = left->keys[left->keyCount - 1];
    left->keyCount--;
    node->keyCount++;
}

void borrowFromRight(Node* node, Node* right, Node* parent, int separator) {
    node->keys[node->keyCount] = parent->keys[separator];
    if (!node->leaf) {
        node->children[node->keyCount + 1] = right->children[0];
        node->children[node->keyCount + 1]->parent = node;
    }
    parent->keys[separator] = right->keys[0];
    for (int i = 0; i < right->keyCount - 1; i++) right->keys[i] = right->keys[i + 1];
    if (!right->leaf) {
        for (int i = 0; i < right->keyCount; i++) right->children[i] = right->children[i + 1];
        right->children[right->keyCount] = nullptr;
    }
    right->keyCount--;
    node->keyCount++;
}

void mergePair(Node* left, Node* right, Node* parent, int separator) {
    left->keys[left->keyCount++] = parent->keys[separator];
    int childOffset = left->keyCount;
    for (int i = 0; i < right->keyCount; i++) left->keys[left->keyCount++] = right->keys[i];
    if (!left->leaf) {
        for (int i = 0; i <= right->keyCount; i++) {
            left->children[childOffset + i] = right->children[i];
            left->children[childOffset + i]->parent = left;
            right->children[i] = nullptr;
        }
    }
    parent->keyCount = 0;
    parent->children[0] = left;
    parent->children[1] = nullptr;
    delete right;
}

void mergeThreeIntoTwo(Node* parent, int start) {
    Node* first = parent->children[start];
    Node* second = parent->children[start + 1];
    Node* third = parent->children[start + 2];
    int* values = new int[MAX_KEYS * 3 + 2]{};
    Node** children = new Node*[MAX_KEYS * 3 + 3]{};
    int total = 0;
    for (int i = 0; i < first->keyCount; i++) values[total++] = first->keys[i];
    values[total++] = parent->keys[start];
    for (int i = 0; i < second->keyCount; i++) values[total++] = second->keys[i];
    values[total++] = parent->keys[start + 1];
    for (int i = 0; i < third->keyCount; i++) values[total++] = third->keys[i];
    if (!first->leaf) {
        int count = 0;
        for (int i = 0; i <= first->keyCount; i++) children[count++] = first->children[i];
        for (int i = 0; i <= second->keyCount; i++) children[count++] = second->children[i];
        for (int i = 0; i <= third->keyCount; i++) children[count++] = third->children[i];
    }
    int firstCount = (total - 1) / 2;
    int secondCount = total - firstCount - 1;
    first->keyCount = firstCount;
    second->keyCount = secondCount;
    for (int i = 0; i < firstCount; i++) first->keys[i] = values[i];
    parent->keys[start] = values[firstCount];
    for (int i = 0; i < secondCount; i++) second->keys[i] = values[firstCount + 1 + i];
    if (!first->leaf) {
        int offset = 0;
        for (int i = 0; i <= firstCount; i++) { first->children[i] = children[offset++]; first->children[i]->parent = first; }
        for (int i = 0; i <= secondCount; i++) { second->children[i] = children[offset++]; second->children[i]->parent = second; }
        for (int i = 0; i <= third->keyCount; i++) third->children[i] = nullptr;
    }
    for (int i = start + 1; i < parent->keyCount - 1; i++) parent->keys[i] = parent->keys[i + 1];
    for (int i = start + 2; i < parent->keyCount; i++) parent->children[i] = parent->children[i + 1];
    parent->children[parent->keyCount] = nullptr;
    parent->keyCount--;
    delete third;
    delete[] values;
    delete[] children;
}`;

function bstarCpp(actionId) {
  const operation = bstarOperations[actionId];
  if (!operation) return null;
  return `class BStarTree {
public:
    static const int MAX_KEYS = 5;
    static const int MIN_KEYS = 3;
    static const int ROOT_CHILD_MIN_KEYS = 2;
    struct Node {
        int* keys;
        Node** children;
        int keyCount;
        bool leaf;
        Node* parent;
        explicit Node(bool leaf)
            : keys(new int[MAX_KEYS + 1]{}), children(new Node*[MAX_KEYS + 2]{}),
              keyCount(0), leaf(leaf), parent(nullptr) {}
        ~Node() { delete[] keys; delete[] children; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;
    };
    Node* root = new Node(true);
    int lastVisited = 0;

    ~BStarTree() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // B* redistribution, 2-to-3 split and 3-to-2 underflow repair
${indent(bstarHelpers)}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        if (!node->leaf) {
            for (int i = 0; i <= node->keyCount; i++) destroy(node->children[i]);
        }
        delete node;
    }
};`;
}

export function getMultiwayTreesCpp(algorithmId, actionId) {
  if (algorithmId === 'btree') return btreeCpp(actionId);
  if (algorithmId === 'bplus-tree') return bplusCpp(actionId);
  if (algorithmId === 'bstar-tree') return bstarCpp(actionId);
  return null;
}
