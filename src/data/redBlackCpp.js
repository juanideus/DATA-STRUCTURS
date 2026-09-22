const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'tree-add': `bool insert(int value) {
    Node* parent = nullptr;
    Node* current = root;
    while (current != nil) {
        parent = current;
        if (value == current->value) return false;
        current = value < current->value ? current->left : current->right;
    }
    Node* node = new Node(value, true);
    node->left = nil;
    node->right = nil;
    node->parent = parent;
    if (parent == nullptr) root = node;
    else if (value < parent->value) parent->left = node;
    else parent->right = node;
    fixAfterInsert(node);
    return true;
}`,
  'remove-value': `bool remove(int target) {
    Node* node = findNode(target);
    if (node == nil) return false;
    Node* removed = node;
    bool removedWasRed = removed->red;
    Node* moved = nil;
    if (node->left == nil) {
        moved = node->right;
        transplant(node, node->right);
    } else if (node->right == nil) {
        moved = node->left;
        transplant(node, node->left);
    } else {
        removed = smallest(node->right);
        removedWasRed = removed->red;
        moved = removed->right;
        if (removed->parent == node) {
            moved->parent = removed;
        } else {
            transplant(removed, removed->right);
            removed->right = node->right;
            removed->right->parent = removed;
        }
        transplant(node, removed);
        removed->left = node->left;
        removed->left->parent = removed;
        removed->red = node->red;
    }
    delete node;
    if (!removedWasRed) fixAfterDelete(moved);
    return true;
}`,
  find: `Node* search(int target) const {
    Node* result = findNode(target);
    return result == nil ? nullptr : result;
}`,
  preorder: `void preorder(Node* node) {
    if (node == nil) return;
    lastVisited = node->value;
    preorder(node->left);
    preorder(node->right);
}`,
  inorder: `void inorder(Node* node) {
    if (node == nil) return;
    inorder(node->left);
    lastVisited = node->value;
    inorder(node->right);
}`,
  postorder: `void postorder(Node* node) {
    if (node == nil) return;
    postorder(node->left);
    postorder(node->right);
    lastVisited = node->value;
}`,
};

const helpers = `Node* findNode(int target) const {
    Node* current = root;
    while (current != nil && current->value != target) {
        current = target < current->value ? current->left : current->right;
    }
    return current;
}

Node* smallest(Node* node) const {
    while (node->left != nil) node = node->left;
    return node;
}

void rotateLeft(Node* node) {
    Node* child = node->right;
    node->right = child->left;
    if (child->left != nil) child->left->parent = node;
    child->parent = node->parent;
    if (node->parent == nullptr) root = child;
    else if (node == node->parent->left) node->parent->left = child;
    else node->parent->right = child;
    child->left = node;
    node->parent = child;
}

void rotateRight(Node* node) {
    Node* child = node->left;
    node->left = child->right;
    if (child->right != nil) child->right->parent = node;
    child->parent = node->parent;
    if (node->parent == nullptr) root = child;
    else if (node == node->parent->right) node->parent->right = child;
    else node->parent->left = child;
    child->right = node;
    node->parent = child;
}

void fixAfterInsert(Node* node) {
    while (node->parent != nullptr && node->parent->red) {
        Node* parent = node->parent;
        Node* grandparent = parent->parent;
        if (parent == grandparent->left) {
            Node* uncle = grandparent->right;
            if (uncle->red) {
                parent->red = false;
                uncle->red = false;
                grandparent->red = true;
                node = grandparent;
            } else {
                if (node == parent->right) {
                    node = parent;
                    rotateLeft(node);
                    parent = node->parent;
                    grandparent = parent->parent;
                }
                parent->red = false;
                grandparent->red = true;
                rotateRight(grandparent);
            }
        } else {
            Node* uncle = grandparent->left;
            if (uncle->red) {
                parent->red = false;
                uncle->red = false;
                grandparent->red = true;
                node = grandparent;
            } else {
                if (node == parent->left) {
                    node = parent;
                    rotateRight(node);
                    parent = node->parent;
                    grandparent = parent->parent;
                }
                parent->red = false;
                grandparent->red = true;
                rotateLeft(grandparent);
            }
        }
    }
    root->red = false;
}

void transplant(Node* oldNode, Node* newNode) {
    if (oldNode->parent == nullptr) root = newNode;
    else if (oldNode == oldNode->parent->left) oldNode->parent->left = newNode;
    else oldNode->parent->right = newNode;
    newNode->parent = oldNode->parent;
}

void fixAfterDelete(Node* node) {
    while (node != root && !node->red) {
        if (node == node->parent->left) {
            Node* sibling = node->parent->right;
            if (sibling->red) {
                sibling->red = false;
                node->parent->red = true;
                rotateLeft(node->parent);
                sibling = node->parent->right;
            }
            if (!sibling->left->red && !sibling->right->red) {
                sibling->red = true;
                node = node->parent;
            } else {
                if (!sibling->right->red) {
                    sibling->left->red = false;
                    sibling->red = true;
                    rotateRight(sibling);
                    sibling = node->parent->right;
                }
                sibling->red = node->parent->red;
                node->parent->red = false;
                sibling->right->red = false;
                rotateLeft(node->parent);
                node = root;
            }
        } else {
            Node* sibling = node->parent->left;
            if (sibling->red) {
                sibling->red = false;
                node->parent->red = true;
                rotateRight(node->parent);
                sibling = node->parent->left;
            }
            if (!sibling->right->red && !sibling->left->red) {
                sibling->red = true;
                node = node->parent;
            } else {
                if (!sibling->left->red) {
                    sibling->right->red = false;
                    sibling->red = true;
                    rotateLeft(sibling);
                    sibling = node->parent->left;
                }
                sibling->red = node->parent->red;
                node->parent->red = false;
                sibling->left->red = false;
                rotateRight(node->parent);
                node = root;
            }
        }
    }
    node->red = false;
}`;

export function getRedBlackCpp(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  return `class RedBlackTree {
public:
    struct Node {
        int value;
        bool red;
        Node* left;
        Node* right;
        Node* parent;
        Node(int value, bool red)
            : value(value), red(red), left(nullptr), right(nullptr), parent(nullptr) {}
    };
    Node* nil;
    Node* root;
    int lastVisited = 0;

    RedBlackTree() {
        nil = new Node(0, false);
        nil->left = nil;
        nil->right = nil;
        root = nil;
    }

    ~RedBlackTree() {
        destroy(root);
        delete nil;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Rotations, recoloring and NIL-sentinel helpers
${indent(helpers)}

private:
    void destroy(Node* node) {
        if (node == nil) return;
        destroy(node->left);
        destroy(node->right);
        delete node;
    }
};`;
}
