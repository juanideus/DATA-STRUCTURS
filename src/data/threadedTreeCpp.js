const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'tree-add': `bool insert(int value) {
    Node* parent = nullptr;
    Node* current = root;
    while (current != nullptr) {
        if (current->value == value) return false;
        parent = current;
        if (value < current->value) {
            if (!current->leftThread) current = current->left;
            else break;
        } else {
            if (!current->rightThread) current = current->right;
            else break;
        }
    }

    Node* newNode = new Node(value);
    if (parent == nullptr) root = newNode;
    else if (value < parent->value) {
        newNode->left = parent->left;
        newNode->right = parent;
        parent->leftThread = false;
        parent->left = newNode;
    } else {
        newNode->left = parent;
        newNode->right = parent->right;
        parent->rightThread = false;
        parent->right = newNode;
    }
    return true;
}`,
  find: `Node* search(int target) const {
    Node* current = root;
    while (current != nullptr) {
        if (current->value == target) return current;
        if (target < current->value) {
            if (current->leftThread) return nullptr;
            current = current->left;
        } else {
            if (current->rightThread) return nullptr;
            current = current->right;
        }
    }
    return nullptr;
}`,
  inorder: `void inorder() {
    Node* current = leftMost(root);
    while (current != nullptr) {
        visit(current->value);
        if (current->rightThread) current = current->right;
        else current = leftMost(current->right);
    }
}`,
  'remove-value': `bool remove(int target) {
    Node* parent = nullptr;
    Node* current = root;
    while (current != nullptr && current->value != target) {
        parent = current;
        if (target < current->value) {
            if (current->leftThread) return false;
            current = current->left;
        } else {
            if (current->rightThread) return false;
            current = current->right;
        }
    }
    if (current == nullptr) return false;

    if (!current->leftThread && !current->rightThread) {
        Node* successorParent = current;
        Node* successor = current->right;
        while (!successor->leftThread) {
            successorParent = successor;
            successor = successor->left;
        }
        current->value = successor->value;
        parent = successorParent;
        current = successor;
    }
    removeAtMostOneChild(parent, current);
    return true;
}`,
};

const helpers = `Node* leftMost(Node* node) const {
    if (node == nullptr) return nullptr;
    while (!node->leftThread) node = node->left;
    return node;
}

void removeAtMostOneChild(Node* parent, Node* node) {
    Node* child = !node->leftThread ? node->left : !node->rightThread ? node->right : nullptr;
    if (parent == nullptr) root = child;
    else if (parent->left == node) {
        if (child == nullptr) {
            parent->leftThread = true;
            parent->left = node->left;
        } else parent->left = child;
    } else {
        if (child == nullptr) {
            parent->rightThread = true;
            parent->right = node->right;
        } else parent->right = child;
    }

    if (!node->leftThread && node->rightThread) {
        Node* predecessor = node->left;
        while (!predecessor->rightThread) predecessor = predecessor->right;
        predecessor->right = node->right;
    } else if (node->leftThread && !node->rightThread) {
        Node* successor = node->right;
        while (!successor->leftThread) successor = successor->left;
        successor->left = node->left;
    }
    delete node;
}

void visit(int value) {
    lastVisited = value;
}`;

export function getThreadedTreeCpp(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  return `class ThreadedBinaryTree {
public:
    struct Node {
        int value;
        Node* left;
        Node* right;
        bool leftThread;
        bool rightThread;
        explicit Node(int value)
            : value(value), left(nullptr), right(nullptr), leftThread(true), rightThread(true) {}
    };
    Node* root = nullptr;
    int lastVisited = 0;

    ~ThreadedBinaryTree() { destroyChildren(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Thread-aware helpers used above
${indent(helpers)}

private:
    void destroyChildren(Node* node) {
        if (node == nullptr) return;
        if (!node->leftThread) destroyChildren(node->left);
        if (!node->rightThread) destroyChildren(node->right);
        delete node;
    }
};`;
}
