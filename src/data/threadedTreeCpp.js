const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'tree-add': `bool insert(int value) {
    Node* parent = root;
    Node* current = root->left;
    while (current != root) {
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
    if (parent == root) {
        newNode->left = root;
        newNode->right = root;
        root->left = newNode;
        root->leftThread = false;
    } else if (value < parent->value) {
        newNode->left = parent->left;
        newNode->right = parent;
        parent->left = newNode;
        parent->leftThread = false;
    } else {
        newNode->left = parent;
        newNode->right = parent->right;
        parent->right = newNode;
        parent->rightThread = false;
    }
    return true;
}`,
  find: `Node* search(int target) const {
    Node* current = root->left;
    while (current != root) {
        if (current->value == target) return current;
        if (target < current->value) {
            if (current->leftThread) return root;
            current = current->left;
        } else {
            if (current->rightThread) return root;
            current = current->right;
        }
    }
    return root;
}`,
  inorder: `void inorder() {
    Node* current = leftMost(root->left);
    while (current != root) {
        visit(current->value);
        if (current->rightThread) current = current->right;
        else current = leftMost(current->right);
    }
}`,
  'remove-value': `bool remove(int target) {
    Node* parent = root;
    Node* current = root->left;
    while (current != root && current->value != target) {
        parent = current;
        if (target < current->value) {
            if (current->leftThread) return false;
            current = current->left;
        } else {
            if (current->rightThread) return false;
            current = current->right;
        }
    }
    if (current == root) return false;

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
    Node* child;
    if (!current->leftThread) child = current->left;
    else if (!current->rightThread) child = current->right;
    else child = root;

    Node* predecessor = inorderPredecessor(current);
    Node* successor = inorderSuccessor(current);

    if (parent == root) {
        root->left = child;
        root->leftThread = (child == root);
    } else if (current == parent->left) {
        if (child == root) {
            parent->left = predecessor;
            parent->leftThread = true;
        } else {
            parent->left = child;
        }
    } else {
        if (child == root) {
            parent->right = successor;
            parent->rightThread = true;
        } else {
            parent->right = child;
        }
    }

    if (child != root && !current->leftThread) {
        predecessor->right = successor;
    } else if (child != root && !current->rightThread) {
        successor->left = predecessor;
    }
    delete current;
    return true;
}`,
};

const helpers = `Node* leftMost(Node* node) const {
    while (!node->leftThread) node = node->left;
    return node;
}

Node* inorderPredecessor(Node* node) const {
    if (node->leftThread) return node->left;
    Node* current = node->left;
    while (!current->rightThread) current = current->right;
    return current;
}

Node* inorderSuccessor(Node* node) const {
    if (node->rightThread) return node->right;
    Node* current = node->right;
    while (!current->leftThread) current = current->left;
    return current;
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
            : value(value), left(this), right(this), leftThread(true), rightThread(true) {}
    };
    Node* root;
    int lastVisited = 0;

    ThreadedBinaryTree() : root(new Node(0)) {
        // root is a header; its value is never compared or visited.
        root->rightThread = false;
    }
    ThreadedBinaryTree(const ThreadedBinaryTree&) = delete;
    ThreadedBinaryTree& operator=(const ThreadedBinaryTree&) = delete;
    ~ThreadedBinaryTree() {
        if (!root->leftThread) destroyChildren(root->left);
        delete root;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Thread-aware helpers used above
${indent(helpers)}

private:
    void destroyChildren(Node* node) {
        if (!node->leftThread) destroyChildren(node->left);
        if (!node->rightThread) destroyChildren(node->right);
        delete node;
    }
};`;
}
