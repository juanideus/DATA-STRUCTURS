const animated = (operation, helpers = '') => `// Start of the selected operation
${operation}
// End of the selected operation${helpers ? `\n\n${helpers}` : ''}`;

const binaryTraversals = {
  preorder: animated(`void preorder(Node node) {
    if (node == null) return;
    System.out.println(node.value);
    preorder(node.left);
    preorder(node.right);
}`),
  inorder: animated(`void inorder(Node node) {
    if (node == null) return;
    inorder(node.left);
    System.out.println(node.value);
    inorder(node.right);
}`),
  postorder: animated(`void postorder(Node node) {
    if (node == null) return;
    postorder(node.left);
    postorder(node.right);
    System.out.println(node.value);
}`),
};

const breadthFirstFind = animated(`Node find(Node root, int target) {
    if (root == null) return null;
    Queue<Node> pending = new ArrayDeque<>();
    pending.add(root);

    while (!pending.isEmpty()) {
        Node current = pending.remove();
        if (current.value == target) return current;
        if (current.left != null) pending.add(current.left);
        if (current.right != null) pending.add(current.right);
    }
    return null;
}`);

const completeBinaryInsert = animated(`Node insert(Node root, int value) {
    if (root == null) return new Node(value);
    if (contains(root, value)) return root;
    insertAtFirstAvailableLevel(root, value, 1);
    return root;
}

boolean contains(Node node, int value) {
    if (node == null) return false;
    if (node.value == value) return true;
    return contains(node.left, value) || contains(node.right, value);
}

void insertAtFirstAvailableLevel(Node root, int value, int level) {
    if (insertAtLevel(root, value, level)) return;
    insertAtFirstAvailableLevel(root, value, level + 1);
}

boolean insertAtLevel(Node node, int value, int level) {
    if (node == null) return false;
    if (level == 1) {
        if (node.left == null) {
            node.left = new Node(value);
            return true;
        }
        if (node.right == null) {
            node.right = new Node(value);
            return true;
        }
        return false;
    }
    if (insertAtLevel(node.left, value, level - 1)) return true;
    return insertAtLevel(node.right, value, level - 1);
}`);

const completeBinaryRemove = animated(`Node remove(Node root, int target) {
    if (root == null) return null;
    Node targetNode = null;
    Node deepest = null;
    Node parentOfDeepest = null;
    Queue<Node> pending = new ArrayDeque<>();
    pending.add(root);

    while (!pending.isEmpty()) {
        deepest = pending.remove();
        if (deepest.value == target) targetNode = deepest;
        if (deepest.left != null) {
            parentOfDeepest = deepest;
            pending.add(deepest.left);
        }
        if (deepest.right != null) {
            parentOfDeepest = deepest;
            pending.add(deepest.right);
        }
    }
    if (targetNode == null) return root;
    targetNode.value = deepest.value;
    if (parentOfDeepest == null) return null;
    if (parentOfDeepest.right == deepest) parentOfDeepest.right = null;
    else parentOfDeepest.left = null;
    return root;
}`);

const bstFind = animated(`Node search(Node node, int target) {
    if (node == null || node.value == target) return node;
    if (target < node.value) {
        return search(node.left, target);
    }
    return search(node.right, target);
}`);

const bstRemove = animated(`Node remove(Node node, int target) {
    if (node == null) return null;
    if (target < node.value) {
        node.left = remove(node.left, target);
    } else if (target > node.value) {
        node.right = remove(node.right, target);
    } else {
        if (node.left == null) return node.right;
        if (node.right == null) return node.left;
        Node successor = smallest(node.right);
        node.value = successor.value;
        node.right = remove(node.right, successor.value);
    }
    return node;
}`, `Node smallest(Node node) {
    while (node.left != null) node = node.left;
    return node;
}`);

const bstInsert = animated(`Node insert(Node node, int value) {
    if (node == null) return new Node(value);
    if (value < node.value) {
        node.left = insert(node.left, value);
    } else if (value > node.value) {
        node.right = insert(node.right, value);
    }
    return node;
}`);

const avlInsert = animated(`Node insert(Node node, int value) {
    if (node == null) return new Node(value);
    if (value < node.value) node.left = insert(node.left, value);
    else if (value > node.value) node.right = insert(node.right, value);
    else return node;

    updateHeight(node);
    int balance = balanceOf(node);

    if (balance > 1 && value < node.left.value) return rotateRight(node);
    if (balance < -1 && value > node.right.value) return rotateLeft(node);
    if (balance > 1 && value > node.left.value) {
        node.left = rotateLeft(node.left);
        return rotateRight(node);
    }
    if (balance < -1 && value < node.right.value) {
        node.right = rotateRight(node.right);
        return rotateLeft(node);
    }
    return node;
}`, `void updateHeight(Node node) {
    node.height = 1 + Math.max(height(node.left), height(node.right));
}

int height(Node node) {
    return node == null ? 0 : node.height;
}

int balanceOf(Node node) {
    return node == null ? 0 : height(node.left) - height(node.right);
}

Node rotateRight(Node oldRoot) {
    Node newRoot = oldRoot.left;
    oldRoot.left = newRoot.right;
    newRoot.right = oldRoot;
    updateHeight(oldRoot);
    updateHeight(newRoot);
    return newRoot;
}

Node rotateLeft(Node oldRoot) {
    Node newRoot = oldRoot.right;
    oldRoot.right = newRoot.left;
    newRoot.left = oldRoot;
    updateHeight(oldRoot);
    updateHeight(newRoot);
    return newRoot;
}`);

const avlRemove = animated(`Node remove(Node node, int target) {
    if (node == null) return null;
    if (target < node.value) node.left = remove(node.left, target);
    else if (target > node.value) node.right = remove(node.right, target);
    else {
        if (node.left == null) return node.right;
        if (node.right == null) return node.left;
        Node successor = smallest(node.right);
        node.value = successor.value;
        node.right = remove(node.right, successor.value);
    }

    updateHeight(node);
    int balance = balanceOf(node);
    if (balance > 1 && balanceOf(node.left) >= 0) return rotateRight(node);
    if (balance > 1) {
        node.left = rotateLeft(node.left);
        return rotateRight(node);
    }
    if (balance < -1 && balanceOf(node.right) <= 0) return rotateLeft(node);
    if (balance < -1) {
        node.right = rotateRight(node.right);
        return rotateLeft(node);
    }
    return node;
}`, `Node smallest(Node node) {
    while (node.left != null) node = node.left;
    return node;
}

void updateHeight(Node node) {
    node.height = 1 + Math.max(height(node.left), height(node.right));
}

int height(Node node) {
    return node == null ? 0 : node.height;
}

int balanceOf(Node node) {
    return node == null ? 0 : height(node.left) - height(node.right);
}

Node rotateRight(Node oldRoot) {
    Node newRoot = oldRoot.left;
    oldRoot.left = newRoot.right;
    newRoot.right = oldRoot;
    updateHeight(oldRoot);
    updateHeight(newRoot);
    return newRoot;
}

Node rotateLeft(Node oldRoot) {
    Node newRoot = oldRoot.right;
    oldRoot.right = newRoot.left;
    newRoot.left = oldRoot;
    updateHeight(oldRoot);
    updateHeight(newRoot);
    return newRoot;
}`);

const redBlackInsert = animated(`void insert(int value) {
    Node newNode = new Node(value);
    newNode.red = true;
    root = insertAsBST(root, newNode);
    fixAfterInsert(newNode);
    root.red = false;
}`, `Node insertAsBST(Node node, Node newNode) {
    if (node == null) return newNode;
    if (newNode.value < node.value) {
        node.left = insertAsBST(node.left, newNode);
        node.left.parent = node;
    } else {
        node.right = insertAsBST(node.right, newNode);
        node.right.parent = node;
    }
    return node;
}

void fixAfterInsert(Node node) {
    while (node != root && node.parent.red) {
        Node parent = node.parent;
        Node grandparent = parent.parent;
        Node uncle = parent == grandparent.left
                ? grandparent.right : grandparent.left;
        if (uncle != null && uncle.red) {
            parent.red = false;
            uncle.red = false;
            grandparent.red = true;
            node = grandparent;
        } else {
            if (parent == grandparent.left) rotateRight(grandparent);
            else rotateLeft(grandparent);
            parent.red = false;
            grandparent.red = true;
        }
    }
}

void rotateLeft(Node node) {
    Node child = node.right;
    node.right = child.left;
    if (child.left != null) child.left.parent = node;
    child.parent = node.parent;
    if (node.parent == null) root = child;
    else if (node == node.parent.left) node.parent.left = child;
    else node.parent.right = child;
    child.left = node;
    node.parent = child;
}

void rotateRight(Node node) {
    Node child = node.left;
    node.left = child.right;
    if (child.right != null) child.right.parent = node;
    child.parent = node.parent;
    if (node.parent == null) root = child;
    else if (node == node.parent.right) node.parent.right = child;
    else node.parent.left = child;
    child.right = node;
    node.parent = child;
}`);

const redBlackRemove = animated(`void remove(int target) {
    Node node = search(root, target);
    if (node == nil) return;

    Node removed = node;
    boolean removedWasRed = removed.red;
    Node moved;
    if (node.left == nil) {
        moved = node.right;
        transplant(node, node.right);
    } else if (node.right == nil) {
        moved = node.left;
        transplant(node, node.left);
    } else {
        removed = smallest(node.right);
        removedWasRed = removed.red;
        moved = removed.right;
        if (removed.parent == node) {
            moved.parent = removed;
        } else {
            transplant(removed, removed.right);
            removed.right = node.right;
            removed.right.parent = removed;
        }
        transplant(node, removed);
        removed.left = node.left;
        removed.left.parent = removed;
        removed.red = node.red;
    }
    if (!removedWasRed) fixAfterDelete(moved);
    root.red = false;
}`, `Node search(Node node, int target) {
    if (node == nil || node.value == target) return node;
    return target < node.value ? search(node.left, target) : search(node.right, target);
}

Node smallest(Node node) {
    while (node.left != nil) node = node.left;
    return node;
}

void transplant(Node oldNode, Node newNode) {
    if (oldNode.parent == null) root = newNode;
    else if (oldNode == oldNode.parent.left) oldNode.parent.left = newNode;
    else oldNode.parent.right = newNode;
    newNode.parent = oldNode.parent;
}

void fixAfterDelete(Node node) {
    while (node != root && !node.red) {
        if (node == node.parent.left) {
            Node sibling = node.parent.right;
            if (sibling.red) {
                sibling.red = false;
                node.parent.red = true;
                rotateLeft(node.parent);
                sibling = node.parent.right;
            }
            if (!sibling.left.red && !sibling.right.red) {
                sibling.red = true;
                node = node.parent;
            } else {
                if (!sibling.right.red) {
                    sibling.left.red = false;
                    sibling.red = true;
                    rotateRight(sibling);
                    sibling = node.parent.right;
                }
                sibling.red = node.parent.red;
                node.parent.red = false;
                sibling.right.red = false;
                rotateLeft(node.parent);
                node = root;
            }
        } else {
            Node sibling = node.parent.left;
            if (sibling.red) {
                sibling.red = false;
                node.parent.red = true;
                rotateRight(node.parent);
                sibling = node.parent.left;
            }
            if (!sibling.right.red && !sibling.left.red) {
                sibling.red = true;
                node = node.parent;
            } else {
                if (!sibling.left.red) {
                    sibling.right.red = false;
                    sibling.red = true;
                    rotateLeft(sibling);
                    sibling = node.parent.left;
                }
                sibling.red = node.parent.red;
                node.parent.red = false;
                sibling.left.red = false;
                rotateRight(node.parent);
                node = root;
            }
        }
    }
    node.red = false;
}

void rotateLeft(Node node) {
    Node child = node.right;
    node.right = child.left;
    if (child.left != nil) child.left.parent = node;
    child.parent = node.parent;
    if (node.parent == null) root = child;
    else if (node == node.parent.left) node.parent.left = child;
    else node.parent.right = child;
    child.left = node;
    node.parent = child;
}

void rotateRight(Node node) {
    Node child = node.left;
    node.left = child.right;
    if (child.right != nil) child.right.parent = node;
    child.parent = node.parent;
    if (node.parent == null) root = child;
    else if (node == node.parent.right) node.parent.right = child;
    else node.parent.left = child;
    child.right = node;
    node.parent = child;
}`);

const splayHelpers = `Node splay(Node node, int target) {
    if (node == null || node.value == target) return node;
    if (target < node.value) {
        if (node.left == null) return node;
        if (target < node.left.value) {
            node.left.left = splay(node.left.left, target);
            node = rotateRight(node);
        } else if (target > node.left.value) {
            node.left.right = splay(node.left.right, target);
            if (node.left.right != null) node.left = rotateLeft(node.left);
        }
        return node.left == null ? node : rotateRight(node);
    }
    if (node.right == null) return node;
    if (target > node.right.value) {
        node.right.right = splay(node.right.right, target);
        node = rotateLeft(node);
    } else if (target < node.right.value) {
        node.right.left = splay(node.right.left, target);
        if (node.right.left != null) node.right = rotateRight(node.right);
    }
    return node.right == null ? node : rotateLeft(node);
}

Node rotateRight(Node oldRoot) {
    Node newRoot = oldRoot.left;
    oldRoot.left = newRoot.right;
    newRoot.right = oldRoot;
    return newRoot;
}

Node rotateLeft(Node oldRoot) {
    Node newRoot = oldRoot.right;
    oldRoot.right = newRoot.left;
    newRoot.left = oldRoot;
    return newRoot;
}`;

const splayInsert = animated(`Node insert(Node root, int value) {
    if (root == null) return new Node(value);
    root = splay(root, value);
    if (root.value == value) return root;

    Node newRoot = new Node(value);
    if (value < root.value) {
        newRoot.right = root;
        newRoot.left = root.left;
        root.left = null;
    } else {
        newRoot.left = root;
        newRoot.right = root.right;
        root.right = null;
    }
    return newRoot;
}`, splayHelpers);

const splayFind = animated(`Node search(Node root, int target) {
    return splay(root, target);
}`, splayHelpers);

const splayRemove = animated(`Node remove(Node root, int target) {
    if (root == null) return null;
    root = splay(root, target);
    if (root.value != target) return root;
    if (root.left == null) return root.right;
    Node rightSubtree = root.right;
    root = splay(root.left, target);
    root.right = rightSubtree;
    return root;
}`, splayHelpers);

const generalTree = {
  'tree-add': animated(`void addChild(Node parent, int value) {
    Node child = new Node(value);
    parent.children.add(child);
}`),
  find: animated(`Node find(Node node, int target) {
    if (node == null || node.value == target) return node;
    for (Node child : node.children) {
        Node found = find(child, target);
        if (found != null) return found;
    }
    return null;
}`),
  'remove-value': animated(`boolean remove(Node parent, int target) {
    for (int i = 0; i < parent.children.size(); i++) {
        Node child = parent.children.get(i);
        if (child.value == target) {
            parent.children.remove(i);
            return true;
        }
        if (remove(child, target)) return true;
    }
    return false;
}`),
  preorder: animated(`void preorder(Node node) {
    if (node == null) return;
    System.out.println(node.value);
    for (Node child : node.children) preorder(child);
}`),
  inorder: animated(`void inorder(Node node) {
    if (node == null) return;
    if (!node.children.isEmpty()) inorder(node.children.get(0));
    System.out.println(node.value);
    for (int i = 1; i < node.children.size(); i++) {
        inorder(node.children.get(i));
    }
}`),
  postorder: animated(`void postorder(Node node) {
    if (node == null) return;
    for (Node child : node.children) postorder(child);
    System.out.println(node.value);
}`),
};

const naryTree = {
  'tree-add': animated(`boolean addChild(Node parent, int value) {
    if (parent.childCount == N) return false;
    parent.children[parent.childCount] = new Node(value);
    parent.childCount++;
    return true;
}`),
  find: animated(`Node find(Node node, int target) {
    if (node == null || node.value == target) return node;
    for (int i = 0; i < node.childCount; i++) {
        Node found = find(node.children[i], target);
        if (found != null) return found;
    }
    return null;
}`),
  'remove-value': animated(`boolean remove(Node parent, int target) {
    for (int i = 0; i < parent.childCount; i++) {
        Node child = parent.children[i];
        if (child.value == target) {
            for (int j = i; j < parent.childCount - 1; j++) {
                parent.children[j] = parent.children[j + 1];
            }
            parent.childCount--;
            parent.children[parent.childCount] = null;
            return true;
        }
        if (remove(child, target)) return true;
    }
    return false;
}`),
  preorder: animated(`void preorder(Node node) {
    if (node == null) return;
    System.out.println(node.value);
    for (int i = 0; i < node.childCount; i++) {
        preorder(node.children[i]);
    }
}`),
  inorder: animated(`void inorder(Node node) {
    if (node == null) return;
    if (node.childCount > 0) inorder(node.children[0]);
    System.out.println(node.value);
    for (int i = 1; i < node.childCount; i++) {
        inorder(node.children[i]);
    }
}`),
  postorder: animated(`void postorder(Node node) {
    if (node == null) return;
    for (int i = 0; i < node.childCount; i++) {
        postorder(node.children[i]);
    }
    System.out.println(node.value);
}`),
};

const suffixTree = {
  'set-word': animated(`void buildSuffixTree(String newText) {
    text = newText;
    root = new Node();
    for (int start = 0; start < text.length(); start++) {
        insertSuffix(text.substring(start));
    }
}`, `void insertSuffix(String suffix) {
    Node current = root;
    for (int i = 0; i < suffix.length(); i++) {
        int letter = suffix.charAt(i) - 'A';
        if (current.children[letter] == null) {
            current.children[letter] = new Node();
        }
        current = current.children[letter];
    }
    current.isSuffixEnd = true;
}`),
  'word-find': animated(`boolean contains(String pattern) {
    Node current = root;
    for (int i = 0; i < pattern.length(); i++) {
        int letter = pattern.charAt(i) - 'A';
        if (current.children[letter] == null) return false;
        current = current.children[letter];
    }
    return true;
}`),
  'remove-word': animated(`void clearText() {
    text = "";
    root = new Node();
}`),
  clear: animated(`void clear() {
    text = "";
    root = new Node();
}`),
};

const segmentTree = {
  'range-update': animated(`void update(int node, int left, int right,
            int index, int value) {
    if (left == right) {
        tree[node] = value;
        return;
    }
    int middle = (left + right) / 2;
    if (index <= middle) update(node * 2, left, middle, index, value);
    else update(node * 2 + 1, middle + 1, right, index, value);
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
}`),
  'prefix-sum': animated(`int prefixSum(int node, int left, int right, int end) {
    if (right <= end) return tree[node];
    if (left > end) return 0;
    int middle = (left + right) / 2;
    return prefixSum(node * 2, left, middle, end)
         + prefixSum(node * 2 + 1, middle + 1, right, end);
}`),
  'range-min': animated(`int prefixMinimum(int node, int left, int right, int end) {
    if (right <= end) return minimumTree[node];
    if (left > end) return 999999;
    int middle = (left + right) / 2;
    return Math.min(
        prefixMinimum(node * 2, left, middle, end),
        prefixMinimum(node * 2 + 1, middle + 1, right, end)
    );
}`),
};

const fenwickTree = {
  'range-update': animated(`void add(int index, int delta) {
    index++;
    while (index < bit.length) {
        bit[index] += delta;
        index += index & -index;
    }
}`),
  'prefix-sum': animated(`int prefixSum(int index) {
    index++;
    int sum = 0;
    while (index > 0) {
        sum += bit[index];
        index -= index & -index;
    }
    return sum;
}`),
  'range-min': animated(`int prefixMinimum(int end) {
    int minimum = values[0];
    for (int index = 1; index <= end; index++) {
        if (values[index] < minimum) minimum = values[index];
    }
    return minimum;
}`),
};

const btreeCommon = {
  find: animated(`Node search(Node node, int target) {
    int index = 0;
    while (index < node.keyCount && target > node.keys[index]) index++;
    if (index < node.keyCount && target == node.keys[index]) return node;
    if (node.isLeaf) return null;
    return search(node.children[index], target);
}`),
  'remove-value': animated(`void remove(Node node, int target) {
    int index = findKey(node, target);
    if (node.isLeaf) {
        for (int i = index; i < node.keyCount - 1; i++) {
            node.keys[i] = node.keys[i + 1];
        }
        node.keyCount--;
        return;
    }
    Node child = node.children[index];
    if (child.keyCount == MIN_KEYS) rebalanceBeforeRemove(node, index);
    remove(node.children[index], target);
}`, `int findKey(Node node, int target) {
    int index = 0;
    while (index < node.keyCount && node.keys[index] < target) index++;
    return index;
}

void rebalanceBeforeRemove(Node parent, int childIndex) {
    Node child = parent.children[childIndex];
    if (childIndex > 0
            && parent.children[childIndex - 1].keyCount > MIN_KEYS) {
        borrowFromPrevious(parent, childIndex);
    } else if (childIndex < parent.keyCount
            && parent.children[childIndex + 1].keyCount > MIN_KEYS) {
        borrowFromNext(parent, childIndex);
    } else if (childIndex < parent.keyCount) {
        mergeChildren(parent, childIndex);
    } else {
        mergeChildren(parent, childIndex - 1);
    }
}

void borrowFromPrevious(Node parent, int childIndex) {
    Node child = parent.children[childIndex];
    Node sibling = parent.children[childIndex - 1];
    for (int i = child.keyCount; i > 0; i--) child.keys[i] = child.keys[i - 1];
    if (!child.isLeaf) {
        for (int i = child.keyCount + 1; i > 0; i--) {
            child.children[i] = child.children[i - 1];
        }
        child.children[0] = sibling.children[sibling.keyCount];
    }
    child.keys[0] = parent.keys[childIndex - 1];
    parent.keys[childIndex - 1] = sibling.keys[sibling.keyCount - 1];
    sibling.keyCount--;
    child.keyCount++;
}

void borrowFromNext(Node parent, int childIndex) {
    Node child = parent.children[childIndex];
    Node sibling = parent.children[childIndex + 1];
    child.keys[child.keyCount] = parent.keys[childIndex];
    if (!child.isLeaf) child.children[child.keyCount + 1] = sibling.children[0];
    parent.keys[childIndex] = sibling.keys[0];
    for (int i = 0; i < sibling.keyCount - 1; i++) {
        sibling.keys[i] = sibling.keys[i + 1];
    }
    if (!sibling.isLeaf) {
        for (int i = 0; i < sibling.keyCount; i++) {
            sibling.children[i] = sibling.children[i + 1];
        }
    }
    sibling.keyCount--;
    child.keyCount++;
}

void mergeChildren(Node parent, int leftIndex) {
    Node left = parent.children[leftIndex];
    Node right = parent.children[leftIndex + 1];
    left.keys[left.keyCount++] = parent.keys[leftIndex];
    for (int i = 0; i < right.keyCount; i++) {
        left.keys[left.keyCount++] = right.keys[i];
    }
    if (!left.isLeaf) {
        int childStart = left.keyCount - right.keyCount;
        for (int i = 0; i <= right.keyCount; i++) {
            left.children[childStart + i] = right.children[i];
        }
    }
    for (int i = leftIndex; i < parent.keyCount - 1; i++) {
        parent.keys[i] = parent.keys[i + 1];
        parent.children[i + 1] = parent.children[i + 2];
    }
    parent.keyCount--;
}`),
  'range-view': animated(`void printInOrder(Node node) {
    for (int index = 0; index < node.keyCount; index++) {
        if (!node.isLeaf) printInOrder(node.children[index]);
        System.out.println(node.keys[index]);
    }
    if (!node.isLeaf) printInOrder(node.children[node.keyCount]);
}`),
};

const btreeInsert = animated(`void insert(int value) {
    if (root.keyCount == MAX_KEYS) {
        Node newRoot = new Node(false);
        newRoot.children[0] = root;
        splitChild(newRoot, 0);
        root = newRoot;
    }
    insertNonFull(root, value);
}`, `void insertNonFull(Node node, int value) {
    int index = node.keyCount - 1;
    if (node.isLeaf) {
        while (index >= 0 && value < node.keys[index]) {
            node.keys[index + 1] = node.keys[index];
            index--;
        }
        node.keys[index + 1] = value;
        node.keyCount++;
        return;
    }
    while (index >= 0 && value < node.keys[index]) index--;
    index++;
    if (node.children[index].keyCount == MAX_KEYS) {
        splitChild(node, index);
        if (value > node.keys[index]) index++;
    }
    insertNonFull(node.children[index], value);
}

void splitChild(Node parent, int childIndex) {
    Node full = parent.children[childIndex];
    Node right = new Node(full.isLeaf);
    right.keyCount = T - 1;
    for (int i = 0; i < T - 1; i++) {
        right.keys[i] = full.keys[i + T];
    }
    if (!full.isLeaf) {
        for (int i = 0; i < T; i++) {
            right.children[i] = full.children[i + T];
        }
    }
    full.keyCount = T - 1;
    for (int i = parent.keyCount; i > childIndex; i--) {
        parent.children[i + 1] = parent.children[i];
    }
    parent.children[childIndex + 1] = right;
    for (int i = parent.keyCount - 1; i >= childIndex; i--) {
        parent.keys[i + 1] = parent.keys[i];
    }
    parent.keys[childIndex] = full.keys[T - 1];
    parent.keyCount++;
}`);

const bplusInsert = animated(`void insert(int value) {
    Leaf leaf = findLeaf(value);
    insertInOrder(leaf, value);
    if (leaf.keyCount > MAX_KEYS) {
        Leaf right = splitLeaf(leaf);
        int separator = right.keys[0];
        insertIntoParent(leaf, separator, right);
    }
}`, `Leaf findLeaf(int value) {
    Node current = root;
    while (!current.isLeaf) {
        int child = 0;
        while (child < current.keyCount && value >= current.keys[child]) child++;
        current = current.children[child];
    }
    return (Leaf) current;
}

void insertInOrder(Leaf leaf, int value) {
    int index = leaf.keyCount;
    while (index > 0 && leaf.keys[index - 1] > value) {
        leaf.keys[index] = leaf.keys[index - 1];
        index--;
    }
    leaf.keys[index] = value;
    leaf.keyCount++;
}

Leaf splitLeaf(Leaf leaf) {
    Leaf right = new Leaf();
    right.parent = leaf.parent;
    int middle = leaf.keyCount / 2;
    for (int i = middle; i < leaf.keyCount; i++) {
        right.keys[right.keyCount++] = leaf.keys[i];
    }
    leaf.keyCount = middle;
    right.next = leaf.next;
    leaf.next = right;
    return right;
}

void insertIntoParent(Node left, int separator, Node right) {
    if (left == root) {
        Node newRoot = new Node(false);
        newRoot.keys[0] = separator;
        newRoot.keyCount = 1;
        newRoot.children[0] = left;
        newRoot.children[1] = right;
        left.parent = newRoot;
        right.parent = newRoot;
        root = newRoot;
        return;
    }

    Node parent = left.parent;
    int childIndex = 0;
    while (parent.children[childIndex] != left) childIndex++;
    for (int i = parent.keyCount; i > childIndex; i--) {
        parent.keys[i] = parent.keys[i - 1];
        parent.children[i + 1] = parent.children[i];
    }
    parent.keys[childIndex] = separator;
    parent.children[childIndex + 1] = right;
    right.parent = parent;
    parent.keyCount++;
    if (parent.keyCount > MAX_KEYS) splitInternal(parent);
}

void splitInternal(Node node) {
    int middle = node.keyCount / 2;
    int separator = node.keys[middle];
    Node right = new Node(false);
    right.parent = node.parent;
    for (int i = middle + 1; i < node.keyCount; i++) {
        right.keys[right.keyCount++] = node.keys[i];
    }
    for (int i = middle + 1; i <= node.keyCount; i++) {
        int rightIndex = i - middle - 1;
        right.children[rightIndex] = node.children[i];
        right.children[rightIndex].parent = right;
    }
    node.keyCount = middle;
    insertIntoParent(node, separator, right);
}`);

const bstarInsert = animated(`void insert(int value) {
    Node leaf = findLeaf(value);
    insertInOrder(leaf, value);
    if (leaf.keyCount <= MAX_KEYS) return;
    Node sibling = closestSibling(leaf);
    if (sibling.keyCount < MAX_KEYS) {
        redistribute(leaf, sibling);
    } else {
        splitTwoNodesIntoThree(leaf, sibling);
    }
}`, `Node findLeaf(int value) {
    Node current = root;
    while (!current.isLeaf) {
        int child = 0;
        while (child < current.keyCount && value > current.keys[child]) child++;
        current = current.children[child];
    }
    return current;
}

void insertInOrder(Node node, int value) {
    int index = node.keyCount;
    while (index > 0 && node.keys[index - 1] > value) {
        node.keys[index] = node.keys[index - 1];
        index--;
    }
    node.keys[index] = value;
    node.keyCount++;
}

Node closestSibling(Node node) {
    Node parent = node.parent;
    int index = childIndex(parent, node);
    if (index < parent.keyCount) return parent.children[index + 1];
    return parent.children[index - 1];
}

int childIndex(Node parent, Node child) {
    int index = 0;
    while (parent.children[index] != child) index++;
    return index;
}

void redistribute(Node full, Node sibling) {
    Node parent = full.parent;
    int fullIndex = childIndex(parent, full);
    int siblingIndex = childIndex(parent, sibling);
    if (siblingIndex > fullIndex) {
        for (int i = sibling.keyCount; i > 0; i--) {
            sibling.keys[i] = sibling.keys[i - 1];
        }
        sibling.keys[0] = parent.keys[fullIndex];
        parent.keys[fullIndex] = full.keys[full.keyCount - 1];
    } else {
        sibling.keys[sibling.keyCount] = parent.keys[siblingIndex];
        parent.keys[siblingIndex] = full.keys[0];
        for (int i = 0; i < full.keyCount - 1; i++) {
            full.keys[i] = full.keys[i + 1];
        }
    }
    full.keyCount--;
    sibling.keyCount++;
}

void splitTwoNodesIntoThree(Node left, Node right) {
    Node parent = left.parent;
    int leftIndex = childIndex(parent, left);
    if (childIndex(parent, right) < leftIndex) {
        Node temporary = left;
        left = right;
        right = temporary;
        leftIndex--;
    }

    int total = left.keyCount + right.keyCount + 1;
    int[] ordered = new int[total];
    int count = 0;
    for (int i = 0; i < left.keyCount; i++) ordered[count++] = left.keys[i];
    ordered[count++] = parent.keys[leftIndex];
    for (int i = 0; i < right.keyCount; i++) ordered[count++] = right.keys[i];

    Node middle = new Node(left.isLeaf);
    int firstSeparator = total / 3;
    int secondSeparator = (total * 2) / 3;
    left.keyCount = 0;
    middle.keyCount = 0;
    right.keyCount = 0;
    for (int i = 0; i < firstSeparator; i++) left.keys[left.keyCount++] = ordered[i];
    for (int i = firstSeparator + 1; i < secondSeparator; i++) {
        middle.keys[middle.keyCount++] = ordered[i];
    }
    for (int i = secondSeparator + 1; i < total; i++) {
        right.keys[right.keyCount++] = ordered[i];
    }
    parent.keys[leftIndex] = ordered[firstSeparator];
    insertSeparator(parent, leftIndex + 1, ordered[secondSeparator], middle);
}

void insertSeparator(Node parent, int index, int value, Node middle) {
    for (int i = parent.keyCount; i > index; i--) {
        parent.keys[i] = parent.keys[i - 1];
        parent.children[i + 1] = parent.children[i];
    }
    parent.keys[index] = value;
    parent.children[index] = middle;
    middle.parent = parent;
    parent.keyCount++;
}`);

const bplusRange = animated(`void printLeafRange() {
    Leaf leaf = firstLeaf();
    while (leaf != null) {
        for (int index = 0; index < leaf.keyCount; index++) {
            System.out.println(leaf.keys[index]);
        }
        leaf = leaf.next;
    }
}`, `Leaf firstLeaf() {
    Node current = root;
    while (!current.isLeaf) current = current.children[0];
    return (Leaf) current;
}`);

const kdTree = {
  'tree-add': animated(`Node insert(Node node, int value, int depth) {
    if (node == null) return new Node(value);
    int axis = depth % DIMENSIONS;
    if (coordinate(value, axis) < coordinate(node.value, axis)) {
        node.left = insert(node.left, value, depth + 1);
    } else {
        node.right = insert(node.right, value, depth + 1);
    }
    return node;
}`, `int coordinate(int point, int axis) {
    return axis == 0 ? point / 10 : point % 10;
}`),
  find: animated(`Node search(Node node, int target, int depth) {
    if (node == null || node.value == target) return node;
    int axis = depth % DIMENSIONS;
    if (coordinate(target, axis) < coordinate(node.value, axis)) {
        return search(node.left, target, depth + 1);
    }
    return search(node.right, target, depth + 1);
}`, `int coordinate(int point, int axis) {
    return axis == 0 ? point / 10 : point % 10;
}`),
  'remove-value': animated(`Node remove(Node node, int target, int depth) {
    if (node == null) return null;
    int axis = depth % DIMENSIONS;

    if (node.value == target) {
        if (node.right != null) {
            Node replacement = findMin(node.right, axis, depth + 1);
            node.value = replacement.value;
            node.right = remove(node.right, replacement.value, depth + 1);
        } else if (node.left != null) {
            Node replacement = findMin(node.left, axis, depth + 1);
            node.value = replacement.value;
            node.right = remove(node.left, replacement.value, depth + 1);
            node.left = null;
        } else {
            return null;
        }
    } else if (coordinate(target, axis) < coordinate(node.value, axis)) {
        node.left = remove(node.left, target, depth + 1);
    } else {
        node.right = remove(node.right, target, depth + 1);
    }
    return node;
}`, `Node findMin(Node node, int targetAxis, int depth) {
    if (node == null) return null;
    int axis = depth % DIMENSIONS;
    if (axis == targetAxis && node.left == null) return node;
    if (axis == targetAxis) return findMin(node.left, targetAxis, depth + 1);

    Node leftMin = findMin(node.left, targetAxis, depth + 1);
    Node rightMin = findMin(node.right, targetAxis, depth + 1);
    return smallestCoordinate(node, leftMin, rightMin, targetAxis);
}

Node smallestCoordinate(Node first, Node second, Node third, int axis) {
    Node minimum = first;
    if (second != null && coordinate(second.value, axis) < coordinate(minimum.value, axis)) minimum = second;
    if (third != null && coordinate(third.value, axis) < coordinate(minimum.value, axis)) minimum = third;
    return minimum;
}

int coordinate(int point, int axis) {
    return axis == 0 ? point / 10 : point % 10;
}`),
  preorder: binaryTraversals.preorder,
};

const spatialTree = dimension => {
  const isOctree = dimension === 8;
  const inside = isOctree
    ? `boolean isInside(Node node, Point point) {
    return point.x >= node.minX && point.x < node.maxX
        && point.y >= node.minY && point.y < node.maxY
        && point.z >= node.minZ && point.z < node.maxZ;
}`
    : `boolean isInside(Node node, Point point) {
    return point.x >= node.minX && point.x < node.maxX
        && point.y >= node.minY && point.y < node.maxY;
}`;
  const samePoint = isOctree
    ? `boolean samePoint(Point first, Point second) {
    return first.x == second.x && first.y == second.y && first.z == second.z;
}`
    : `boolean samePoint(Point first, Point second) {
    return first.x == second.x && first.y == second.y;
}`;
  const childIndex = isOctree
    ? `int childIndex(Node node, Point point) {
    int index = 0;
    if (point.x >= (node.minX + node.maxX) / 2) index += 1;
    if (point.y >= (node.minY + node.maxY) / 2) index += 2;
    if (point.z >= (node.minZ + node.maxZ) / 2) index += 4;
    return index;
}`
    : `int childIndex(Node node, Point point) {
    int index = 0;
    if (point.x >= (node.minX + node.maxX) / 2) index += 1;
    if (point.y >= (node.minY + node.maxY) / 2) index += 2;
    return index;
}`;
  const subdivide = isOctree
    ? `void subdivide(Node node) {
    int middleX = (node.minX + node.maxX) / 2;
    int middleY = (node.minY + node.maxY) / 2;
    int middleZ = (node.minZ + node.maxZ) / 2;
    for (int index = 0; index < 8; index++) {
        int minX = (index & 1) == 0 ? node.minX : middleX;
        int maxX = (index & 1) == 0 ? middleX : node.maxX;
        int minY = (index & 2) == 0 ? node.minY : middleY;
        int maxY = (index & 2) == 0 ? middleY : node.maxY;
        int minZ = (index & 4) == 0 ? node.minZ : middleZ;
        int maxZ = (index & 4) == 0 ? middleZ : node.maxZ;
        node.children[index] = new Node(minX, maxX, minY, maxY, minZ, maxZ);
    }
    node.isDivided = true;
}`
    : `void subdivide(Node node) {
    int middleX = (node.minX + node.maxX) / 2;
    int middleY = (node.minY + node.maxY) / 2;
    node.children[0] = new Node(node.minX, middleX, node.minY, middleY);
    node.children[1] = new Node(middleX, node.maxX, node.minY, middleY);
    node.children[2] = new Node(node.minX, middleX, middleY, node.maxY);
    node.children[3] = new Node(middleX, node.maxX, middleY, node.maxY);
    node.isDivided = true;
}`;
  const sharedHelpers = `${inside}\n\n${childIndex}`;

  return {
    'tree-add': animated(`void insert(Node node, Point point) {
    if (!isInside(node, point)) return;
    if (node.pointCount < CAPACITY && !node.isDivided) {
        node.points[node.pointCount] = point;
        node.pointCount++;
        return;
    }
    if (!node.isDivided) subdivide(node);
    insert(node.children[childIndex(node, point)], point);
}`, `${sharedHelpers}\n\n${subdivide}`),
    find: animated(`boolean contains(Node node, Point point) {
    if (!isInside(node, point)) return false;
    for (int i = 0; i < node.pointCount; i++) {
        if (samePoint(node.points[i], point)) return true;
    }
    if (!node.isDivided) return false;
    return contains(node.children[childIndex(node, point)], point);
}`, `${sharedHelpers}\n\n${samePoint}`),
    'remove-value': animated(`boolean remove(Node node, Point point) {
    if (!isInside(node, point)) return false;
    for (int i = 0; i < node.pointCount; i++) {
        if (samePoint(node.points[i], point)) {
            for (int j = i; j < node.pointCount - 1; j++) {
                node.points[j] = node.points[j + 1];
            }
            node.pointCount--;
            return true;
        }
    }
    if (!node.isDivided) return false;
    return remove(node.children[childIndex(node, point)], point);
}`, `${sharedHelpers}\n\n${samePoint}`),
    preorder: animated(`void preorder(Node node) {
    if (node == null) return;
    System.out.println(node.pointCount);
    if (!node.isDivided) return;
    for (int i = 0; i < ${dimension}; i++) preorder(node.children[i]);
}`),
  };
};

const merkleTree = {
  'add-end': animated(`void addBlock(String value) {
    blocks[size] = value;
    size++;
}`),
  'remove-end': animated(`String removeLastBlock() {
    if (size == 0) return null;
    size--;
    String removed = blocks[size];
    blocks[size] = null;
    return removed;
}`),
  'merkle-root': animated(`int calculateMerkleRoot() {
    if (size == 0) return 0;
    int[] level = new int[size];
    for (int i = 0; i < size; i++) {
        level[i] = simpleHash(blocks[i]);
    }

    int count = size;
    while (count > 1) {
        int nextCount = (count + 1) / 2;
        for (int i = 0; i < nextCount; i++) {
            int left = level[i * 2];
            int right = i * 2 + 1 < count ? level[i * 2 + 1] : left;
            level[i] = combineHash(left, right);
        }
        count = nextCount;
    }
    return level[0];
}`, `int simpleHash(String text) {
    int hash = 7;
    for (int i = 0; i < text.length(); i++) {
        hash = hash * 31 + text.charAt(i);
    }
    return hash;
}

int combineHash(int left, int right) {
    return left * 31 + right;
}`),
  clear: animated(`void clear() {
    for (int i = 0; i < size; i++) blocks[i] = null;
    size = 0;
}`),
};

const expressionTree = {
  'set-expression': animated(`Node buildExpressionTree(String expression) {
    Stack<Node> nodes = new Stack<>();
    Stack<Character> operators = new Stack<>();

    for (int i = 0; i < expression.length(); i++) {
        char token = expression.charAt(i);
        if (token == ' ') continue;
        if (Character.isDigit(token)) {
            int number = 0;
            while (i < expression.length()
                    && Character.isDigit(expression.charAt(i))) {
                number = number * 10 + expression.charAt(i) - '0';
                i++;
            }
            i--;
            nodes.push(new Node(number));
        } else if (token == 40) {
            operators.push(token);
        } else if (token == 41) {
            while (operators.peek() != 40) applyTop(nodes, operators);
            operators.pop();
        } else {
            while (!operators.isEmpty() && operators.peek() != 40
                    && precedence(operators.peek()) >= precedence(token)) {
                applyTop(nodes, operators);
            }
            operators.push(token);
        }
    }
    while (!operators.isEmpty()) applyTop(nodes, operators);
    return nodes.pop();
}`, `void applyTop(Stack<Node> nodes, Stack<Character> operators) {
    Node right = nodes.pop();
    Node left = nodes.pop();
    Node operator = new Node(operators.pop());
    operator.left = left;
    operator.right = right;
    nodes.push(operator);
}

int precedence(char operator) {
    if (operator == '+' || operator == '-') return 1;
    if (operator == '*' || operator == '/') return 2;
    return 0;
}`),
  evaluate: animated(`int evaluate(Node node) {
    if (node.isNumber) return node.number;
    int left = evaluate(node.left);
    int right = evaluate(node.right);
    if (node.operator == '+') return left + right;
    if (node.operator == '-') return left - right;
    if (node.operator == '*') return left * right;
    return left / right;
}`),
  preorder: binaryTraversals.preorder,
  postorder: binaryTraversals.postorder,
};

const threadedNodeCode = `static class Node {
    int value;
    Node left;
    Node right;
    boolean leftThread = true;
    boolean rightThread = true;

    Node(int value) {
        this.value = value;
    }
}`;

const threadedHelpers = `Node leftMost(Node node) {
    if (node == null) return null;
    while (!node.leftThread) {
        node = node.left;
    }
    return node;
}

Node inorderPredecessor(Node node) {
    if (node.leftThread) return node.left;
    Node current = node.left;
    while (!current.rightThread) {
        current = current.right;
    }
    return current;
}

Node inorderSuccessor(Node node) {
    if (node.rightThread) return node.right;
    Node current = node.right;
    while (!current.leftThread) {
        current = current.left;
    }
    return current;
}`;

const threadedProgram = (selectedOperation, helpers = '') => `class ThreadedBinaryTree {
    Node root;

    // Start of the selected operation
${selectedOperation.split('\n').map(line => `    ${line}`).join('\n')}
    // End of the selected operation

    ${threadedNodeCode.split('\n').join('\n    ')}
${helpers ? `\n    ${helpers.split('\n').join('\n    ')}` : ''}
}`;

const threadedInsert = threadedProgram(`Node insert(Node root, int value) {
    Node parent = null;
    Node current = root;

    while (current != null) {
        if (value == current.value) return root;
        parent = current;
        if (value < current.value) {
            if (!current.leftThread) current = current.left;
            else break;
        } else {
            if (!current.rightThread) current = current.right;
            else break;
        }
    }

    Node newNode = new Node(value);
    if (parent == null) return newNode;

    if (value < parent.value) {
        newNode.left = parent.left;
        newNode.right = parent;
        parent.leftThread = false;
        parent.left = newNode;
    } else {
        newNode.left = parent;
        newNode.right = parent.right;
        parent.rightThread = false;
        parent.right = newNode;
    }
    return root;
}`);

const threadedFind = threadedProgram(`Node search(Node root, int target) {
    Node current = root;
    while (current != null) {
        if (target == current.value) return current;
        if (target < current.value) {
            if (current.leftThread) return null;
            current = current.left;
        } else {
            if (current.rightThread) return null;
            current = current.right;
        }
    }
    return null;
}`);

const threadedInorder = threadedProgram(`void inorder(Node root) {
    Node current = leftMost(root);
    while (current != null) {
        System.out.println(current.value);
        if (current.rightThread) {
            current = current.right;
        } else {
            current = leftMost(current.right);
        }
    }
}`, `Node leftMost(Node node) {
    if (node == null) return null;
    while (!node.leftThread) {
        node = node.left;
    }
    return node;
}`);

const threadedRemove = threadedProgram(`Node remove(Node root, int target) {
    Node parent = null;
    Node current = root;

    while (current != null && current.value != target) {
        parent = current;
        if (target < current.value) {
            if (current.leftThread) return root;
            current = current.left;
        } else {
            if (current.rightThread) return root;
            current = current.right;
        }
    }
    if (current == null) return root;

    if (!current.leftThread && !current.rightThread) {
        Node successorParent = current;
        Node successor = current.right;
        while (!successor.leftThread) {
            successorParent = successor;
            successor = successor.left;
        }
        current.value = successor.value;
        parent = successorParent;
        current = successor;
    }

    Node child;
    if (!current.leftThread) child = current.left;
    else if (!current.rightThread) child = current.right;
    else child = null;

    Node predecessor = inorderPredecessor(current);
    Node successor = inorderSuccessor(current);

    if (parent == null) {
        root = child;
    } else if (current == parent.left) {
        if (child == null) {
            parent.leftThread = true;
            parent.left = predecessor;
        } else {
            parent.left = child;
        }
    } else {
        if (child == null) {
            parent.rightThread = true;
            parent.right = successor;
        } else {
            parent.right = child;
        }
    }

    if (child != null && !current.leftThread && predecessor != null) {
        predecessor.right = successor;
    } else if (child != null && !current.rightThread && successor != null) {
        successor.left = predecessor;
    }
    return root;
}`, threadedHelpers);

const sources = {
  'arbol-general': generalTree,
  'arbol-nario': naryTree,
  'arbol-binario': {
    'tree-add': completeBinaryInsert,
    'remove-value': completeBinaryRemove,
    find: breadthFirstFind,
    ...binaryTraversals,
  },
  'arbol-enhebrado': {
    'tree-add': threadedInsert,
    'remove-value': threadedRemove,
    find: threadedFind,
    inorder: threadedInorder,
  },
  bst: {
    'tree-add': bstInsert,
    'remove-value': bstRemove,
    find: bstFind,
    ...binaryTraversals,
  },
  avl: {
    'tree-add': avlInsert,
    'remove-value': avlRemove,
    find: bstFind,
    ...binaryTraversals,
  },
  'rojo-negro': {
    'tree-add': redBlackInsert,
    'remove-value': redBlackRemove,
    find: bstFind,
    ...binaryTraversals,
  },
  'splay-tree': {
    'tree-add': splayInsert,
    'remove-value': splayRemove,
    find: splayFind,
    ...binaryTraversals,
  },
  'suffix-tree': suffixTree,
  'segment-tree': segmentTree,
  'fenwick-tree': fenwickTree,
  btree: { ...btreeCommon, 'sorted-add': btreeInsert },
  'bplus-tree': { ...btreeCommon, 'sorted-add': bplusInsert, 'range-view': bplusRange },
  'bstar-tree': { ...btreeCommon, 'sorted-add': bstarInsert },
  'kd-tree': kdTree,
  quadtree: spatialTree(4),
  octree: spatialTree(8),
  'merkle-tree': merkleTree,
  'expression-tree': expressionTree,
};

export function getTreeJava(algorithmId, actionId) {
  return sources[algorithmId]?.[actionId] ?? null;
}
