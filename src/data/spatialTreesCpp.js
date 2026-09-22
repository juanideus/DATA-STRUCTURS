const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'tree-add': `bool insert(const Point& point) {
    return insert(root, point);
}`,
  'remove-value': `bool remove(const Point& point) {
    return remove(root, point);
}`,
  find: `bool contains(const Point& point) const {
    return contains(root, point);
}`,
  preorder: `void preorder() {
    visitedNodes = 0;
    preorder(root);
}`,
};

function spatialCpp(actionId, dimensions) {
  const operation = operations[actionId];
  if (!operation) return null;
  const childCount = dimensions === 3 ? 8 : 4;
  const className = dimensions === 3 ? 'Octree' : 'QuadTree';
  const pointFields = dimensions === 3 ? 'double x;\n        double y;\n        double z;' : 'double x;\n        double y;';
  const nodeBounds = dimensions === 3
    ? 'double minX, maxX, minY, maxY, minZ, maxZ;'
    : 'double minX, maxX, minY, maxY;';
  const nodeConstructor = dimensions === 3
    ? `Node(double minX, double maxX, double minY, double maxY, double minZ, double maxZ)
            : minX(minX), maxX(maxX), minY(minY), maxY(maxY),
              minZ(minZ), maxZ(maxZ), points(new Point[CAPACITY]{}), pointCount(0),
              divided(false), children(new Node*[CHILDREN]{}) {}
        ~Node() { delete[] points; delete[] children; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;`
    : `Node(double minX, double maxX, double minY, double maxY)
            : minX(minX), maxX(maxX), minY(minY), maxY(maxY),
              points(new Point[CAPACITY]{}), pointCount(0), divided(false),
              children(new Node*[CHILDREN]{}) {}
        ~Node() { delete[] points; delete[] children; }
        Node(const Node&) = delete;
        Node& operator=(const Node&) = delete;`;
  const root = dimensions === 3
    ? 'Node* root = new Node(-100, 100, -100, 100, -100, 100);'
    : 'Node* root = new Node(-100, 100, -100, 100);';
  const inside = dimensions === 3
    ? `return point.x >= node->minX && point.x < node->maxX
        && point.y >= node->minY && point.y < node->maxY
        && point.z >= node->minZ && point.z < node->maxZ;`
    : `return point.x >= node->minX && point.x < node->maxX
        && point.y >= node->minY && point.y < node->maxY;`;
  const childIndex = dimensions === 3
    ? `double middleX = (node->minX + node->maxX) / 2.0;
    double middleY = (node->minY + node->maxY) / 2.0;
    double middleZ = (node->minZ + node->maxZ) / 2.0;
    int index = point.x >= middleX ? 1 : 0;
    if (point.y >= middleY) index |= 2;
    if (point.z >= middleZ) index |= 4;
    return index;`
    : `double middleX = (node->minX + node->maxX) / 2.0;
    double middleY = (node->minY + node->maxY) / 2.0;
    int index = point.x >= middleX ? 1 : 0;
    if (point.y >= middleY) index |= 2;
    return index;`;
  const subdivide = dimensions === 3
    ? `double middleX = (node->minX + node->maxX) / 2.0;
    double middleY = (node->minY + node->maxY) / 2.0;
    double middleZ = (node->minZ + node->maxZ) / 2.0;
    for (int index = 0; index < CHILDREN; index++) {
        bool highX = (index & 1) != 0;
        bool highY = (index & 2) != 0;
        bool highZ = (index & 4) != 0;
        node->children[index] = new Node(
            highX ? middleX : node->minX, highX ? node->maxX : middleX,
            highY ? middleY : node->minY, highY ? node->maxY : middleY,
            highZ ? middleZ : node->minZ, highZ ? node->maxZ : middleZ);
    }
    node->divided = true;`
    : `double middleX = (node->minX + node->maxX) / 2.0;
    double middleY = (node->minY + node->maxY) / 2.0;
    node->children[0] = new Node(node->minX, middleX, node->minY, middleY);
    node->children[1] = new Node(middleX, node->maxX, node->minY, middleY);
    node->children[2] = new Node(node->minX, middleX, middleY, node->maxY);
    node->children[3] = new Node(middleX, node->maxX, middleY, node->maxY);
    node->divided = true;`;
  const samePoint = dimensions === 3
    ? 'return first.x == second.x && first.y == second.y && first.z == second.z;'
    : 'return first.x == second.x && first.y == second.y;';

  return `class ${className} {
public:
    static const int CAPACITY = 2;
    static const int CHILDREN = ${childCount};
    struct Point {
        ${pointFields}
    };
    struct Node {
        ${nodeBounds}
        Point* points;
        int pointCount;
        bool divided;
        Node** children;
        ${nodeConstructor}
    };
    ${root}
    int visitedNodes = 0;

    ~${className}() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Spatial helpers used by the operation
    bool isInside(const Node* node, const Point& point) const {
        ${inside}
    }

    bool samePoint(const Point& first, const Point& second) const {
        ${samePoint}
    }

    int childIndex(const Node* node, const Point& point) const {
${indent(indent(childIndex))}
    }

    void subdivide(Node* node) {
${indent(indent(subdivide))}
    }

    bool insert(Node* node, const Point& point) {
        if (!isInside(node, point)) return false;
        if (!node->divided && node->pointCount < CAPACITY) {
            node->points[node->pointCount++] = point;
            return true;
        }
        if (!node->divided) {
            Point* previous = new Point[CAPACITY];
            for (int i = 0; i < node->pointCount; i++) previous[i] = node->points[i];
            int previousCount = node->pointCount;
            node->pointCount = 0;
            subdivide(node);
            for (int i = 0; i < previousCount; i++) {
                insert(node->children[childIndex(node, previous[i])], previous[i]);
            }
            delete[] previous;
        }
        return insert(node->children[childIndex(node, point)], point);
    }

    bool contains(const Node* node, const Point& point) const {
        if (node == nullptr || !isInside(node, point)) return false;
        for (int i = 0; i < node->pointCount; i++) {
            if (samePoint(node->points[i], point)) return true;
        }
        if (!node->divided) return false;
        return contains(node->children[childIndex(node, point)], point);
    }

    bool remove(Node* node, const Point& point) {
        if (node == nullptr || !isInside(node, point)) return false;
        for (int i = 0; i < node->pointCount; i++) {
            if (!samePoint(node->points[i], point)) continue;
            for (int j = i; j < node->pointCount - 1; j++) node->points[j] = node->points[j + 1];
            node->pointCount--;
            return true;
        }
        if (!node->divided) return false;
        return remove(node->children[childIndex(node, point)], point);
    }

    void preorder(Node* node) {
        if (node == nullptr) return;
        visitedNodes++;
        if (!node->divided) return;
        for (int i = 0; i < CHILDREN; i++) preorder(node->children[i]);
    }

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        for (int i = 0; i < CHILDREN; i++) destroy(node->children[i]);
        delete node;
    }
};`;
}

export function getSpatialTreesCpp(algorithmId, actionId) {
  if (algorithmId === 'quadtree') return spatialCpp(actionId, 2);
  if (algorithmId === 'octree') return spatialCpp(actionId, 3);
  return null;
}
