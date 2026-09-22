const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const generalOperations = {
  'tree-add': `bool addChild(Node* parent, int value) {
    if (parent == nullptr || parent->childCount == MAX_CHILDREN) return false;
    parent->children[parent->childCount] = new Node(value);
    parent->childCount++;
    return true;
}`,
  'remove-value': `Node* remove(Node* node, int target) {
    if (node == nullptr) return nullptr;
    if (node->value == target) {
        destroy(node);
        return nullptr;
    }
    for (int i = 0; i < node->childCount; i++) {
        Node* original = node->children[i];
        node->children[i] = remove(original, target);
        if (original != nullptr && node->children[i] == nullptr) {
            for (int j = i; j < node->childCount - 1; j++) node->children[j] = node->children[j + 1];
            node->childCount--;
            break;
        }
    }
    return node;
}`,
  find: `Node* find(Node* node, int target) const {
    if (node == nullptr || node->value == target) return node;
    for (int i = 0; i < node->childCount; i++) {
        Node* result = find(node->children[i], target);
        if (result != nullptr) return result;
    }
    return nullptr;
}`,
  preorder: `void preorder(Node* node) {
    if (node == nullptr) return;
    visit(node->value);
    for (int i = 0; i < node->childCount; i++) preorder(node->children[i]);
}`,
  inorder: `void inorder(Node* node) {
    if (node == nullptr) return;
    if (node->childCount > 0) inorder(node->children[0]);
    visit(node->value);
    for (int i = 1; i < node->childCount; i++) inorder(node->children[i]);
}`,
  postorder: `void postorder(Node* node) {
    if (node == nullptr) return;
    for (int i = 0; i < node->childCount; i++) postorder(node->children[i]);
    visit(node->value);
}`,
};

const visit = `void visit(int value) {
    lastVisited = value;
}`;

function generalTreeCpp(algorithmId, actionId) {
  const operation = generalOperations[actionId];
  if (!operation) return null;
  const className = algorithmId === 'arbol-nario' ? 'NaryTree' : 'GeneralTree';
  return `class ${className} {
public:
    static const int MAX_CHILDREN = ${algorithmId === 'arbol-nario' ? '4' : '16'};
    struct Node {
        int value;
        Node** children;
        int childCount;
        explicit Node(int value)
            : value(value), children(new Node*[MAX_CHILDREN]{}), childCount(0) {}
        ~Node() { delete[] children; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;
    };
    Node* root = nullptr;
    int lastVisited = 0;

    ~${className}() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    void destroy(Node* node) {
        if (node == nullptr) return;
        for (int i = 0; i < node->childCount; i++) destroy(node->children[i]);
        delete node;
    }

${indent(visit)}
};`;
}

const splayOperations = {
  'tree-add': `Node* insert(Node* root, int value) {
    if (root == nullptr) return new Node(value);
    root = splay(root, value);
    if (root->value == value) return root;
    Node* newNode = new Node(value);
    if (value < root->value) {
        newNode->right = root;
        newNode->left = root->left;
        root->left = nullptr;
    } else {
        newNode->left = root;
        newNode->right = root->right;
        root->right = nullptr;
    }
    return newNode;
}`,
  'remove-value': `Node* remove(Node* root, int target) {
    if (root == nullptr) return nullptr;
    root = splay(root, target);
    if (root->value != target) return root;
    Node* removed = root;
    if (root->left == nullptr) root = root->right;
    else {
        Node* right = root->right;
        root = splay(root->left, target);
        root->right = right;
    }
    delete removed;
    return root;
}`,
  find: `Node* search(Node*& root, int target) {
    root = splay(root, target);
    return root != nullptr && root->value == target ? root : nullptr;
}`,
  preorder: `void preorder(Node* node) { if (node != nullptr) { visit(node->value); preorder(node->left); preorder(node->right); } }`,
  inorder: `void inorder(Node* node) { if (node != nullptr) { inorder(node->left); visit(node->value); inorder(node->right); } }`,
  postorder: `void postorder(Node* node) { if (node != nullptr) { postorder(node->left); postorder(node->right); visit(node->value); } }`,
};

const splayHelpers = `Node* rotateRight(Node* node) {
    Node* newRoot = node->left;
    node->left = newRoot->right;
    newRoot->right = node;
    return newRoot;
}

Node* rotateLeft(Node* node) {
    Node* newRoot = node->right;
    node->right = newRoot->left;
    newRoot->left = node;
    return newRoot;
}

Node* splay(Node* node, int target) {
    if (node == nullptr || node->value == target) return node;
    if (target < node->value) {
        if (node->left == nullptr) return node;
        if (target < node->left->value) {
            node->left->left = splay(node->left->left, target);
            node = rotateRight(node);
        } else if (target > node->left->value) {
            node->left->right = splay(node->left->right, target);
            if (node->left->right != nullptr) node->left = rotateLeft(node->left);
        }
        return node->left == nullptr ? node : rotateRight(node);
    }
    if (node->right == nullptr) return node;
    if (target > node->right->value) {
        node->right->right = splay(node->right->right, target);
        node = rotateLeft(node);
    } else if (target < node->right->value) {
        node->right->left = splay(node->right->left, target);
        if (node->right->left != nullptr) node->right = rotateRight(node->right);
    }
    return node->right == nullptr ? node : rotateLeft(node);
}`;

function splayCpp(actionId) {
  const operation = splayOperations[actionId];
  if (!operation) return null;
  return `class SplayTree {
public:
    struct Node {
        int value;
        Node* left;
        Node* right;
        explicit Node(int value) : value(value), left(nullptr), right(nullptr) {}
    };
    Node* root = nullptr;
    int lastVisited = 0;

    ~SplayTree() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Rotation and splay helpers
${indent(splayHelpers)}

${indent(visit)}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        destroy(node->left);
        destroy(node->right);
        delete node;
    }
};`;
}

export function getMoreTreesCpp(algorithmId, actionId) {
  if (['arbol-general', 'arbol-nario'].includes(algorithmId)) return generalTreeCpp(algorithmId, actionId);
  if (algorithmId === 'splay-tree') return splayCpp(actionId);
  return null;
}
