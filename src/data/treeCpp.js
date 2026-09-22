const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const traversalMethods = {
  preorder: `void preorder(Node* node) {
    if (node == nullptr) return;
    visit(node->value);
    preorder(node->left);
    preorder(node->right);
}`,
  inorder: `void inorder(Node* node) {
    if (node == nullptr) return;
    inorder(node->left);
    visit(node->value);
    inorder(node->right);
}`,
  postorder: `void postorder(Node* node) {
    if (node == nullptr) return;
    postorder(node->left);
    postorder(node->right);
    visit(node->value);
}`,
};

const visit = `void visit(int value) {
    lastVisited = value;
}`;

const bstMethods = {
  'tree-add': `Node* insert(Node* node, int value) {
    if (node == nullptr) return new Node(value);
    if (value < node->value) node->left = insert(node->left, value);
    else if (value > node->value) node->right = insert(node->right, value);
    return node;
}`,
  'remove-value': `Node* remove(Node* node, int target) {
    if (node == nullptr) return nullptr;
    if (target < node->value) node->left = remove(node->left, target);
    else if (target > node->value) node->right = remove(node->right, target);
    else {
        if (node->left == nullptr) {
            Node* right = node->right;
            delete node;
            return right;
        }
        if (node->right == nullptr) {
            Node* left = node->left;
            delete node;
            return left;
        }
        Node* successor = smallest(node->right);
        node->value = successor->value;
        node->right = remove(node->right, successor->value);
    }
    return node;
}`,
  find: `Node* search(Node* node, int target) const {
    if (node == nullptr || node->value == target) return node;
    if (target < node->value) return search(node->left, target);
    return search(node->right, target);
}`,
  ...traversalMethods,
};

const bstSmallest = `Node* smallest(Node* node) const {
    while (node->left != nullptr) node = node->left;
    return node;
}`;

const avlInsert = `Node* insert(Node* node, int value) {
    if (node == nullptr) return new Node(value);
    if (value < node->value) node->left = insert(node->left, value);
    else if (value > node->value) node->right = insert(node->right, value);
    else return node;

    updateHeight(node);
    int balance = balanceOf(node);
    if (balance > 1 && value < node->left->value) return rotateRight(node);
    if (balance < -1 && value > node->right->value) return rotateLeft(node);
    if (balance > 1 && value > node->left->value) {
        node->left = rotateLeft(node->left);
        return rotateRight(node);
    }
    if (balance < -1 && value < node->right->value) {
        node->right = rotateRight(node->right);
        return rotateLeft(node);
    }
    return node;
}`;

const avlRemove = `Node* remove(Node* node, int target) {
    if (node == nullptr) return nullptr;
    if (target < node->value) node->left = remove(node->left, target);
    else if (target > node->value) node->right = remove(node->right, target);
    else if (node->left == nullptr || node->right == nullptr) {
        Node* child = node->left != nullptr ? node->left : node->right;
        delete node;
        return child;
    } else {
        Node* successor = smallest(node->right);
        node->value = successor->value;
        node->right = remove(node->right, successor->value);
    }

    updateHeight(node);
    int balance = balanceOf(node);
    if (balance > 1 && balanceOf(node->left) >= 0) return rotateRight(node);
    if (balance > 1) {
        node->left = rotateLeft(node->left);
        return rotateRight(node);
    }
    if (balance < -1 && balanceOf(node->right) <= 0) return rotateLeft(node);
    if (balance < -1) {
        node->right = rotateRight(node->right);
        return rotateLeft(node);
    }
    return node;
}`;

const avlHelpers = `int height(Node* node) const {
    return node == nullptr ? 0 : node->height;
}

void updateHeight(Node* node) {
    int leftHeight = height(node->left);
    int rightHeight = height(node->right);
    node->height = 1 + (leftHeight > rightHeight ? leftHeight : rightHeight);
}

int balanceOf(Node* node) const {
    return node == nullptr ? 0 : height(node->left) - height(node->right);
}

Node* rotateRight(Node* oldRoot) {
    Node* newRoot = oldRoot->left;
    Node* transferred = newRoot->right;
    newRoot->right = oldRoot;
    oldRoot->left = transferred;
    updateHeight(oldRoot);
    updateHeight(newRoot);
    return newRoot;
}

Node* rotateLeft(Node* oldRoot) {
    Node* newRoot = oldRoot->right;
    Node* transferred = newRoot->left;
    newRoot->left = oldRoot;
    oldRoot->right = transferred;
    updateHeight(oldRoot);
    updateHeight(newRoot);
    return newRoot;
}`;

const binaryMethods = {
  'tree-add': `Node* insert(Node* root, int value) {
    if (root == nullptr) return new Node(value);
    if (contains(root, value)) return root;
    insertAtFirstAvailableLevel(root, value, 1);
    return root;
}`,
  'remove-value': `Node* remove(Node* root, int target) {
    Node* targetNode = find(root, target);
    if (targetNode == nullptr) return root;
    int depth = maximumDepth(root);
    Node* deepest = nodeAtDepth(root, depth);
    targetNode->value = deepest->value;
    removeNode(root, deepest);
    return root;
}`,
  find: `Node* find(Node* node, int target) const {
    if (node == nullptr || node->value == target) return node;
    Node* leftResult = find(node->left, target);
    return leftResult != nullptr ? leftResult : find(node->right, target);
}`,
  ...traversalMethods,
};

const binaryHelpers = `bool contains(Node* node, int value) const {
    return find(node, value) != nullptr;
}

void insertAtFirstAvailableLevel(Node* root, int value, int level) {
    if (insertAtLevel(root, value, level)) return;
    insertAtFirstAvailableLevel(root, value, level + 1);
}

bool insertAtLevel(Node* node, int value, int level) {
    if (node == nullptr) return false;
    if (level == 1) {
        if (node->left == nullptr) {
            node->left = new Node(value);
            return true;
        }
        if (node->right == nullptr) {
            node->right = new Node(value);
            return true;
        }
        return false;
    }
    if (insertAtLevel(node->left, value, level - 1)) return true;
    return insertAtLevel(node->right, value, level - 1);
}

int maximumDepth(Node* node) const {
    if (node == nullptr) return -1;
    int left = maximumDepth(node->left);
    int right = maximumDepth(node->right);
    return 1 + (left > right ? left : right);
}

Node* nodeAtDepth(Node* node, int depth) const {
    if (node == nullptr) return nullptr;
    if (depth == 0) return node;
    Node* left = nodeAtDepth(node->left, depth - 1);
    return left != nullptr ? left : nodeAtDepth(node->right, depth - 1);
}

bool removeNode(Node*& node, Node* target) {
    if (node == nullptr) return false;
    if (node == target) {
        delete node;
        node = nullptr;
        return true;
    }
    return removeNode(node->left, target) || removeNode(node->right, target);
}`;

function wrapTree(className, selected, helpers, avl = false) {
  return `class ${className} {
public:
    struct Node {
        int value;
        int height;
        Node* left;
        Node* right;
        explicit Node(int value) : value(value), height(1), left(nullptr), right(nullptr) {}
    };
    Node* root = nullptr;
    int lastVisited = 0;

    ~${className}() { destroy(root); }

    // Start of the selected operation
${indent(selected)}
    // End of the selected operation

    // Recursive helpers used above
${helpers.map(indent).join('\n\n')}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        destroy(node->left);
        destroy(node->right);
        delete node;
    }
};`;
}

export function getTreeCpp(algorithmId, actionId) {
  if (algorithmId === 'bst') {
    const selected = bstMethods[actionId];
    if (!selected) return null;
    const helpers = [visit];
    if (actionId === 'remove-value') helpers.unshift(bstSmallest);
    return wrapTree('BinarySearchTree', selected, helpers);
  }
  if (algorithmId === 'avl') {
    const selected = actionId === 'tree-add'
      ? avlInsert
      : actionId === 'remove-value'
        ? avlRemove
        : bstMethods[actionId];
    if (!selected) return null;
    const helpers = [avlHelpers, visit];
    if (actionId === 'remove-value') helpers.unshift(bstSmallest);
    return wrapTree('AVLTree', selected, helpers, true);
  }
  if (algorithmId === 'arbol-binario') {
    const selected = binaryMethods[actionId];
    if (!selected) return null;
    const helpers = [visit];
    if (actionId === 'tree-add') helpers.unshift(binaryMethods.find, binaryHelpers);
    if (actionId === 'remove-value') helpers.unshift(binaryMethods.find, binaryHelpers);
    return wrapTree('BinaryTree', selected, helpers);
  }
  return null;
}
