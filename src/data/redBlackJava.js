const operations = {
  'tree-add': `boolean insert(int value) {
    Node parent = null;
    Node current = root;
    while (current != nil) {
        parent = current;
        if (value == current.value) return false;
        current = value < current.value ? current.left : current.right;
    }
    Node added = new Node(value, true);
    added.left = nil;
    added.right = nil;
    added.parent = parent;
    if (parent == null) root = added;
    else if (value < parent.value) parent.left = added;
    else parent.right = added;
    fixAfterInsert(added);
    return true;
}`,
  'remove-value': `boolean remove(int target) {
    Node node = findNode(target);
    if (node == nil) return false;

    Node removed = node;
    boolean removedWasRed = removed.red;
    Node moved = nil;
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
    nil.red = false;
    return true;
}`,
  find: `boolean find(int target) {
    return findNode(target) != nil;
}`,
  preorder: `java.util.List<Integer> preorder() {
    java.util.List<Integer> result = new java.util.ArrayList<>();
    preorder(root, result);
    return result;
}

void preorder(Node node, java.util.List<Integer> result) {
    if (node == nil) return;
    result.add(node.value);
    preorder(node.left, result);
    preorder(node.right, result);
}`,
  inorder: `java.util.List<Integer> inorder() {
    java.util.List<Integer> result = new java.util.ArrayList<>();
    inorder(root, result);
    return result;
}

void inorder(Node node, java.util.List<Integer> result) {
    if (node == nil) return;
    inorder(node.left, result);
    result.add(node.value);
    inorder(node.right, result);
}`,
  postorder: `java.util.List<Integer> postorder() {
    java.util.List<Integer> result = new java.util.ArrayList<>();
    postorder(root, result);
    return result;
}

void postorder(Node node, java.util.List<Integer> result) {
    if (node == nil) return;
    postorder(node.left, result);
    postorder(node.right, result);
    result.add(node.value);
}`,
};

const helpers = `Node findNode(int target) {
    Node current = root;
    while (current != nil && current.value != target) {
        current = target < current.value ? current.left : current.right;
    }
    return current;
}

Node smallest(Node node) {
    while (node.left != nil) node = node.left;
    return node;
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
}

void fixAfterInsert(Node node) {
    while (node.parent != null && node.parent.red) {
        Node parent = node.parent;
        Node grandparent = parent.parent;
        if (parent == grandparent.left) {
            Node uncle = grandparent.right;
            if (uncle.red) {
                parent.red = false;
                uncle.red = false;
                grandparent.red = true;
                node = grandparent;
            } else {
                if (node == parent.right) {
                    node = parent;
                    rotateLeft(node);
                    parent = node.parent;
                    grandparent = parent.parent;
                }
                parent.red = false;
                grandparent.red = true;
                rotateRight(grandparent);
            }
        } else {
            Node uncle = grandparent.left;
            if (uncle.red) {
                parent.red = false;
                uncle.red = false;
                grandparent.red = true;
                node = grandparent;
            } else {
                if (node == parent.left) {
                    node = parent;
                    rotateRight(node);
                    parent = node.parent;
                    grandparent = parent.parent;
                }
                parent.red = false;
                grandparent.red = true;
                rotateLeft(grandparent);
            }
        }
    }
    root.red = false;
}

void transplant(Node oldNode, Node replacement) {
    if (oldNode.parent == null) root = replacement;
    else if (oldNode == oldNode.parent.left) oldNode.parent.left = replacement;
    else oldNode.parent.right = replacement;
    replacement.parent = oldNode.parent;
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
    nil.red = false;
}`;

export function getRedBlackJava(actionId, includeBothMutations = false) {
  const selected = operations[actionId];
  if (!selected) return null;
  const additional = includeBothMutations && actionId === 'tree-add' ? `\n\n${operations['remove-value']}` : '';
  return `public class RedBlackTreeExample {
    static class Node {
        int value;
        boolean red;
        Node left, right, parent;
        Node(int value, boolean red) { this.value = value; this.red = red; }
    }

    final Node nil = new Node(0, false);
    Node root;

    public RedBlackTreeExample() {
        nil.left = nil;
        nil.right = nil;
        root = nil;
    }

    // Start of the selected operation
${selected}
    // End of the selected operation${additional}

${helpers}
}`;
}
