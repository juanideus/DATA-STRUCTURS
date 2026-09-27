const operations = {
  'heap-add': `void insertMinimum(int value) {
    Node node = new Node(value);
    addRoot(node);
    if (minimum == null || value < minimum.value) minimum = node;
    size++;
}`,
  'heap-extract': `int extractMinimum() {
    if (minimum == null) throw new IllegalStateException("Heap vacío");
    Node removed = minimum;
    int result = removed.value;
    ArrayList<Node> children = circularNodes(removed.child);
    for (Node child : children) {
        detach(child);
        child.parent = null;
        addRoot(child);
    }
    Node nextRoot = removed.right == removed ? null : removed.right;
    detach(removed);
    minimum = nextRoot;
    if (minimum != null) consolidate();
    size--;
    return result;
}`,
  peek: `int peekMinimum() {
    if (minimum == null) throw new IllegalStateException("Heap vacío");
    return minimum.value;
}`,
  clear: `void clear() {
    minimum = null;
    size = 0;
}`,
};

const helpers = `static class Node {
    int value, degree;
    Node left, right, child, parent;
    Node(int value) { this.value = value; left = right = this; }
}
Node minimum;
int size;

void addRoot(Node node) {
    if (minimum == null) {
        node.left = node.right = node;
        minimum = node;
        return;
    }
    node.right = minimum.right;
    node.left = minimum;
    minimum.right.left = node;
    minimum.right = node;
}

void detach(Node node) {
    node.left.right = node.right;
    node.right.left = node.left;
    node.left = node.right = node;
}

ArrayList<Node> circularNodes(Node start) {
    ArrayList<Node> result = new ArrayList<>();
    if (start == null) return result;
    Node current = start;
    do {
        result.add(current);
        current = current.right;
    } while (current != start);
    return result;
}

void linkChild(Node child, Node parent) {
    detach(child);
    child.parent = parent;
    if (parent.child == null) parent.child = child;
    else {
        child.right = parent.child.right;
        child.left = parent.child;
        parent.child.right.left = child;
        parent.child.right = child;
    }
    parent.degree++;
}

void consolidate() {
    HashMap<Integer, Node> byDegree = new HashMap<>();
    ArrayList<Node> roots = circularNodes(minimum);
    for (Node root : roots) {
        Node first = root;
        int degree = first.degree;
        while (byDegree.containsKey(degree)) {
            Node second = byDegree.remove(degree);
            if (second.value < first.value) {
                Node temporary = first;
                first = second;
                second = temporary;
            }
            linkChild(second, first);
            degree = first.degree;
        }
        byDegree.put(degree, first);
    }
    minimum = null;
    for (Node root : byDegree.values()) {
        root.left = root.right = root;
        addRoot(root);
        if (root.value < minimum.value) minimum = root;
    }
}`;

export function getFibonacciHeapJava(actionId) {
  const operation = operations[actionId];
  return operation ? `import java.util.ArrayList;\nimport java.util.HashMap;\n\npublic class FibonacciHeapExample {\n${operation}\n\n// Estructura y métodos auxiliares usados arriba\n${helpers}\n}` : null;
}
