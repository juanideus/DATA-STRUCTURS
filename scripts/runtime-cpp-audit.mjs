import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerCpp } from '../src/data/beginnerCpp.js';

const workspace = path.resolve('.tmp-cpp-runtime');
const failures = [];
const algorithm = id => algorithms.find(item => item.id === id);
const overflowFlags = process.env.CPP_TRAP_OVERFLOW === '1' ? ['-ftrapv'] : [];

const cases = [
  {
    label: 'Array insertion at boundaries and capacity', id: 'array', action: 'add-index',
    main: `
int main() {
    RawArray array;
    assert(!array.addAtIndex(5, -1));
    assert(!array.addAtIndex(5, 1));
    for (int value = 0; value < 100; value++) assert(array.addAtIndex(value, 0));
    assert(array.size == RawArray::CAPACITY);
    for (int index = 0; index < array.size; index++) assert(array.values[index] == 99 - index);
    assert(!array.addAtIndex(100, 0));
}`,
  },
  {
    label: 'Array indexed deletion shifts values', id: 'array', action: 'remove-index',
    main: `
int main() {
    RawArray array;
    assert(!array.removeAtIndex(0));
    array.size = 5;
    for (int index = 0; index < array.size; index++) array.values[index] = index + 1;
    assert(array.removeAtIndex(2));
    assert(array.size == 4 && array.values[2] == 4 && array.values[3] == 5);
    assert(array.removeAtIndex(0));
    assert(array.removeAtIndex(2));
    assert(array.size == 2 && array.values[0] == 2 && array.values[1] == 4);
    assert(!array.removeAtIndex(-1) && !array.removeAtIndex(2));
}`,
  },
  {
    label: 'Queue FIFO insertion and capacity', id: 'cola', action: 'enqueue',
    main: `
int main() {
    LinkedQueue queue;
    for (int value = 0; value < LinkedQueue::CAPACITY; value++) assert(queue.enqueue(value));
    assert(!queue.enqueue(99));
    assert(queue.size == LinkedQueue::CAPACITY && queue.front->value == 0 && queue.rear->value == 14);
    auto* current = queue.front;
    for (int value = 0; value < queue.size; value++) {
        assert(current != nullptr && current->value == value);
        current = current->next;
    }
    assert(current == nullptr);
}`,
  },
  {
    label: 'Queue deletion resets both pointers', id: 'cola', action: 'dequeue',
    main: `
int main() {
    LinkedQueue queue;
    int removed = -1;
    assert(!queue.dequeue(removed));
    queue.front = new LinkedQueue::Node(7);
    queue.front->next = new LinkedQueue::Node(8);
    queue.rear = queue.front->next;
    queue.size = 2;
    assert(queue.dequeue(removed) && removed == 7);
    assert(queue.front == queue.rear && queue.front->value == 8 && queue.size == 1);
    assert(queue.dequeue(removed) && removed == 8);
    assert(queue.front == nullptr && queue.rear == nullptr && queue.size == 0);
    assert(!queue.dequeue(removed));
}`,
  },
  {
    label: 'Circular doubly linked singleton has both links', id: 'lista-circular-doble', action: 'add-end',
    main: `
int main() {
    CircularDoublyLinkedList list;
    list.addAtEnd(42);
    assert(list.size == 1 && list.head->next == list.head && list.head->prev == list.head);
    list.addAtEnd(9);
    assert(list.size == 2 && list.head->next->value == 9);
    assert(list.head->next->next == list.head && list.head->prev == list.head->next);
}`,
  },
  {
    label: 'Circular doubly linked deletion repairs singleton', id: 'lista-circular-doble', action: 'remove-end',
    main: `
int main() {
    CircularDoublyLinkedList list;
    assert(!list.removeFromEnd());
    auto* first = new CircularDoublyLinkedList::Node(4);
    auto* second = new CircularDoublyLinkedList::Node(7);
    first->next = second; first->prev = second;
    second->next = first; second->prev = first;
    list.head = first; list.size = 2;
    assert(list.removeFromEnd());
    assert(list.size == 1 && list.head->value == 4);
    assert(list.head->next == list.head && list.head->prev == list.head);
    assert(list.removeFromEnd());
    assert(list.head == nullptr && list.size == 0);
}`,
  },
  {
    label: 'Max heap insertion preserves complete-tree order', id: 'heap', action: 'heap-add',
    main: `
int main() {
    MaxHeap heap;
    int values[] = {4, 15, 9, 21, -3, 7, 21, 0};
    for (int value : values) assert(heap.insertHeap(value));
    assert(heap.size == 8 && heap.heap[0] == 21);
    for (int index = 1; index < heap.size; index++) assert(heap.heap[(index - 1) / 2] >= heap.heap[index]);
}`,
  },
  {
    label: 'Max heap extraction replaces root and heapifies', id: 'heap', action: 'heap-extract',
    main: `
int main() {
    MaxHeap heap;
    int values[] = {21, 15, 21, 4, -3, 7, 9, 0};
    heap.size = 8;
    for (int index = 0; index < heap.size; index++) heap.heap[index] = values[index];
    int removed = -1;
    assert(heap.removeRoot(removed) && removed == 21);
    assert(heap.size == 7 && heap.heap[0] == 21);
    for (int index = 1; index < heap.size; index++) assert(heap.heap[(index - 1) / 2] >= heap.heap[index]);
    for (int remaining = 7; remaining > 0; remaining--) assert(heap.removeRoot(removed));
    assert(heap.size == 0 && !heap.removeRoot(removed));
}`,
  },
  {
    label: 'red-black insertion invariants', id: 'rojo-negro', action: 'tree-add',
    main: `
int blackHeight(RedBlackTree& tree, RedBlackTree::Node* node) {
    if (node == tree.nil) return 1;
    assert(!node->red || (!node->left->red && !node->right->red));
    int left = blackHeight(tree, node->left);
    int right = blackHeight(tree, node->right);
    assert(left == right);
    return left + (node->red ? 0 : 1);
}
int main() {
    RedBlackTree tree;
    int values[] = {10, 20, 30, 15, 25, 5, 1, 7, 6};
    for (int value : values) assert(tree.insert(value));
    assert(!tree.insert(10));
    assert(!tree.root->red);
    blackHeight(tree, tree.root);
}`,
  },
  {
    label: 'red-black deletion', id: 'rojo-negro', action: 'remove-value',
    main: `
int main() {
    RedBlackTree tree;
    auto* root = new RedBlackTree::Node(10, false);
    auto* left = new RedBlackTree::Node(5, true);
    auto* right = new RedBlackTree::Node(15, true);
    root->left = left; root->right = right; root->parent = nullptr;
    left->left = tree.nil; left->right = tree.nil; left->parent = root;
    right->left = tree.nil; right->right = tree.nil; right->parent = root;
    tree.root = root;
    assert(tree.remove(5));
    assert(tree.findNode(5) == tree.nil);
    assert(!tree.remove(99));
}`,
  },
  {
    label: 'Fibonacci heap insertion', id: 'fibonacci-heap', action: 'heap-add',
    main: `
int main() {
    FibonacciHeap heap;
    int values[] = {7, 3, 18, 1, 12};
    for (int value : values) heap.insert(value);
    assert(heap.nodeCount == 5);
    assert(heap.minimum->value == 1);
}`,
  },
  {
    label: 'Fibonacci heap extract and consolidate', id: 'fibonacci-heap', action: 'heap-extract',
    main: `
int main() {
    FibonacciHeap heap;
    int values[] = {7, 3, 18, 1, 12, 5};
    for (int value : values) {
        auto* node = new FibonacciHeap::Node(value);
        heap.addToRootList(node);
        if (value < heap.minimum->value) heap.minimum = node;
        heap.nodeCount++;
    }
    int removed = 0;
    assert(heap.extractMinimum(removed) && removed == 1);
    assert(heap.minimum->value == 3);
    assert(heap.nodeCount == 5);
}`,
  },
  {
    label: 'B-Tree split and search', id: 'btree', action: 'sorted-add',
    main: `
int main() {
    BTree tree;
    for (int value = 1; value <= 80; value++) assert(tree.insert(value));
    for (int value = 1; value <= 80; value++) assert(tree.contains(tree.root, value));
    assert(!tree.insert(40));
}`,
  },
  {
    label: 'B-Tree deletion, borrow and merge', id: 'btree', action: 'remove-value',
    main: `
void add(BTree& tree, int value) {
    if (tree.root->keyCount == BTree::MAX_KEYS) {
        auto* newRoot = new BTree::Node(false);
        newRoot->children[0] = tree.root;
        tree.splitChild(newRoot, 0);
        tree.root = newRoot;
    }
    tree.insertNonFull(tree.root, value);
}
int main() {
    BTree tree;
    for (int value = 1; value <= 50; value++) add(tree, value);
    for (int value = 1; value <= 49; value += 2) assert(tree.remove(value));
    for (int value = 2; value <= 50; value += 2) assert(tree.contains(tree.root, value));
    for (int value = 1; value <= 49; value += 2) assert(!tree.contains(tree.root, value));
}`,
  },
  {
    label: 'B+ linked leaves and lookup', id: 'bplus-tree', action: 'sorted-add',
    main: `
int main() {
    BPlusTree tree;
    for (int value = 1; value <= 80; value++) assert(tree.insert(value));
    for (int value = 1; value <= 80; value++) assert(tree.containsInLeaf(tree.findLeaf(value), value));
    int expected = 1;
    for (auto* leaf = tree.firstLeaf(); leaf != nullptr; leaf = leaf->next) {
        for (int i = 0; i < leaf->keyCount; i++) assert(leaf->keys[i] == expected++);
    }
    assert(expected == 81);
}`,
  },
  {
    label: 'B+ deletion and underflow repair', id: 'bplus-tree', action: 'remove-value',
    main: `
void add(BPlusTree& tree, int value) {
    auto* leaf = tree.findLeaf(value);
    tree.insertInLeaf(leaf, value);
    if (leaf->keyCount > BPlusTree::MAX_KEYS) tree.splitLeaf(leaf);
}
int main() {
    BPlusTree tree;
    for (int value = 1; value <= 60; value++) add(tree, value);
    for (int value = 1; value <= 59; value += 2) assert(tree.remove(value));
    for (int value = 2; value <= 60; value += 2) assert(tree.containsInLeaf(tree.findLeaf(value), value));
}`,
  },
  {
    label: 'B* redistribution and 2-to-3 split', id: 'bstar-tree', action: 'sorted-add',
    main: `
int main() {
    BStarTree tree;
    for (int value = 1; value <= 100; value++) assert(tree.insert(value));
    for (int value = 1; value <= 100; value++) assert(tree.locate(tree.root, value) != nullptr);
    assert(!tree.insert(40));
}`,
  },
  {
    label: 'B* deletion and 3-to-2 repair', id: 'bstar-tree', action: 'remove-value',
    main: `
void add(BStarTree& tree, int value) {
    auto* leaf = tree.findLeaf(value);
    tree.insertKey(leaf, value);
    if (leaf->keyCount > BStarTree::MAX_KEYS) tree.fixOverflow(leaf);
}
int main() {
    BStarTree tree;
    for (int value = 1; value <= 90; value++) add(tree, value);
    for (int value = 3; value <= 60; value += 3) assert(tree.remove(value));
    for (int value = 3; value <= 60; value += 3) assert(tree.locate(tree.root, value) == nullptr);
    for (int value = 1; value <= 90; value++) if (value % 3 != 0) assert(tree.locate(tree.root, value) != nullptr);
}`,
  },
  {
    label: 'QuadTree subdivision', id: 'quadtree', action: 'tree-add',
    main: `
int main() {
    QuadTree tree;
    QuadTree::Point points[] = {{-5,-5}, {5,5}, {-6,6}, {6,-6}, {7,7}};
    for (const auto& point : points) assert(tree.insert(point));
    for (const auto& point : points) assert(tree.contains(tree.root, point));
}`,
  },
  {
    label: 'Octree subdivision', id: 'octree', action: 'tree-add',
    main: `
int main() {
    Octree tree;
    Octree::Point points[] = {{-5,-5,-5}, {5,5,5}, {-6,6,-6}, {6,-6,6}};
    for (const auto& point : points) assert(tree.insert(point));
    for (const auto& point : points) assert(tree.contains(tree.root, point));
}`,
  },
  {
    label: 'Expression tree fixed-array parser', id: 'expression-tree', action: 'set-expression',
    main: `
int evaluate(ExpressionTree::Node* node) {
    if (node->isNumber) return node->number;
    int left = evaluate(node->left), right = evaluate(node->right);
    if (node->operation == '+') return left + right;
    if (node->operation == '-') return left - right;
    if (node->operation == '*') return left * right;
    return left / right;
}
int main() {
    ExpressionTree tree;
    assert(tree.buildExpressionTree("(8 + 3) * 2") != nullptr);
    assert(evaluate(tree.root) == 22);
}`,
  },
  {
    label: 'AST recursive-descent parser', id: 'ast', action: 'ast-build',
    main: `
int main() {
    AbstractSyntaxTree tree;
    auto* root = tree.buildAst("total = price + quantity * 2;");
    assert(root != nullptr && root->label == "ASSIGN");
    assert(root->left->label == "total");
    assert(root->right->label == "+");
    assert(root->right->right->label == "*");
}`,
  },
  {
    label: 'Generalized-list parser and nesting', id: 'listas-generalizadas', action: 'glist-build',
    main: `
int main() {
    GeneralizedList list;
    assert(list.build("((a,b),((c,d),e))") != nullptr);
    assert(list.depthOf(list.root) == 3);
    int count = 0;
    for (auto* node = list.root->link; node != nullptr; node = node->link) count++;
    assert(count == 2);
}`,
  },
  {
    label: 'Generalized-list reference release', id: 'listas-generalizadas', action: 'glist-release',
    main: `
int main() {
    GeneralizedList list;
    list.root = list.makeReference();
    list.root->ref = 2;
    list.releaseRoot();
    assert(list.root != nullptr && list.root->ref == 1);
    list.releaseRoot();
    assert(list.root == nullptr);
}`,
  },
  {
    label: 'Counting Sort with negative values', id: 'counting-sort', action: 'sort',
    main: `
int main() {
    RawArraySorter sorter;
    int input[] = {4, -2, 7, 4, 1, -2, 5, 1};
    sorter.size = 8;
    for (int i = 0; i < sorter.size; i++) sorter.values[i] = input[i];
    assert(sorter.sort());
    int expected[] = {-2, -2, 1, 1, 4, 4, 5, 7};
    for (int i = 0; i < sorter.size; i++) assert(sorter.values[i] == expected[i]);
}`,
  },
  {
    label: 'Radix Sort with negative values', id: 'radix-sort', action: 'sort',
    main: `
int main() {
    RawArraySorter sorter;
    int input[] = {170, 45, 75, -90, 802, 24, 2, 66};
    sorter.size = 8;
    for (int i = 0; i < sorter.size; i++) sorter.values[i] = input[i];
    assert(sorter.sort());
    int expected[] = {-90, 2, 24, 45, 66, 75, 170, 802};
    for (int i = 0; i < sorter.size; i++) assert(sorter.values[i] == expected[i]);
}`,
  },
  {
    label: 'Radix Sort near minimum integer', id: 'radix-sort', action: 'sort',
    main: `
int main() {
    RawArraySorter sorter;
    sorter.size = 4;
    sorter.values[0] = -2147483647 - 1;
    sorter.values[1] = -2147483646;
    sorter.values[2] = -2147483647;
    sorter.values[3] = -2147483646;
    assert(sorter.sort());
    assert(sorter.values[0] == -2147483647 - 1);
    assert(sorter.values[1] == -2147483647);
    assert(sorter.values[2] == -2147483646);
    assert(sorter.values[3] == -2147483646);
}`,
  },
  {
    label: 'Radix Sort at maximum supported key span', id: 'radix-sort', action: 'sort',
    main: `
int main() {
    RawArraySorter sorter;
    sorter.size = 4;
    sorter.values[0] = -1;
    sorter.values[1] = -2147483647 - 1;
    sorter.values[2] = -2147483647;
    sorter.values[3] = -2;
    assert(sorter.sort());
    assert(sorter.values[0] == -2147483647 - 1);
    assert(sorter.values[1] == -2147483647);
    assert(sorter.values[2] == -2);
    assert(sorter.values[3] == -1);
}`,
  },
  {
    label: 'Radix Sort rejects excessive key span without mutation', id: 'radix-sort', action: 'sort',
    main: `
int main() {
    RawArraySorter sorter;
    sorter.size = 2;
    sorter.values[0] = 2147483647;
    sorter.values[1] = -1;
    assert(!sorter.sort());
    assert(sorter.values[0] == 2147483647);
    assert(sorter.values[1] == -1);
}`,
  },
  {
    label: 'N-Queens dynamic board size', id: 'n-reinas', action: 'solve',
    main: `
int main() {
    NQueens solver;
    assert(solver.solve(4));
    assert(solver.size == 4);
    for (int row = 0; row < solver.size; row++) {
        for (int previous = 0; previous < row; previous++) {
            assert(solver.queens[row] != solver.queens[previous]);
            int difference = solver.queens[row] - solver.queens[previous];
            if (difference < 0) difference = -difference;
            assert(difference != row - previous);
        }
    }
    assert(solver.solve(8));
    assert(solver.size == 8);
}`,
  },
  {
    label: 'Maze dynamic 6 by 6 map', id: 'laberinto', action: 'solve',
    main: `
int main() {
    int cells[] = {
        0,0,1,0,0,0,
        1,0,1,1,1,0,
        0,0,0,0,1,0,
        0,1,0,1,1,0,
        0,1,0,0,0,0,
        1,0,0,1,0,0
    };
    MazeSolver solver(cells, 6, 6);
    assert(solver.height == 6 && solver.width == 6);
    assert(solver.solve(0, 0));
    assert(solver.path[0][0]);
    assert(solver.path[5][5]);
}`,
  },
  {
    label: 'Dijkstra dynamic 12 by 22 grid', id: 'dijkstra', action: 'shortest-path',
    main: `
int main() {
    int* cells = new int[DijkstraGrid::CELL_COUNT];
    for (int cell = 0; cell < DijkstraGrid::CELL_COUNT; cell++) cells[cell] = 1;
    cells[10] = -1;
    DijkstraGrid grid(cells);
    delete[] cells;
    assert(grid.ROWS == 12 && grid.COLUMNS == 22);
    assert(grid.shortestPath(0, 21));
    assert(grid.distance[21] == 23);
    assert(grid.previous[21] != -1);
}`,
  },
  {
    label: 'A-Star dynamic 12 by 22 grid', id: 'a-star', action: 'shortest-path',
    main: `
int main() {
    int* cells = new int[AStarGrid::CELL_COUNT];
    for (int cell = 0; cell < AStarGrid::CELL_COUNT; cell++) cells[cell] = 1;
    for (int column = 5; column < 17; column++) cells[AStarGrid::COLUMNS + column] = -1;
    AStarGrid grid(cells);
    delete[] cells;
    assert(grid.ROWS == 12 && grid.COLUMNS == 22);
    assert(grid.shortestPath(0, AStarGrid::CELL_COUNT - 1));
    assert(grid.distance[AStarGrid::CELL_COUNT - 1] > 0);
}`,
  },
  {
    label: 'Pathfinding reset restores the initial map', id: 'dijkstra', action: 'reset',
    main: `
int main() {
    int* cells = new int[DijkstraGrid::CELL_COUNT];
    for (int cell = 0; cell < DijkstraGrid::CELL_COUNT; cell++) cells[cell] = cell % 7 == 0 ? -1 : 1;
    DijkstraGrid grid(cells);
    delete[] cells;
    grid.map[8] = 99;
    grid.distance[8] = 4;
    grid.previous[8] = 3;
    grid.reset();
    assert(grid.map[8] == 1);
    assert(grid.distance[8] == DijkstraGrid::INF);
    assert(grid.previous[8] == -1);
}`,
  },
  {
    label: 'Sparse matrix dynamic AROW and ACOL', id: 'matriz-dispersa', action: 'matrix-insert',
    main: `
int main() {
    SparseMatrix matrix(3, 4);
    assert(matrix.AROW != nullptr && matrix.ACOL != nullptr);
    assert(matrix.height == 3 && matrix.width == 4);
    assert(matrix.AROW[0]->left == matrix.AROW[0]);
    assert(matrix.ACOL[0]->up == matrix.ACOL[0]);
    assert(matrix.insert(8, 0, 1));
    assert(matrix.insert(5, 2, 1));
    assert(matrix.AROW[0]->left->value == 8);
    assert(matrix.ACOL[1]->up->row == 2);
    assert(matrix.nonZeroCount == 2);
    assert(matrix.remove(0, 1));
    assert(matrix.nonZeroCount == 1);
}`,
  },
];

for (const id of [
  'bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort',
  'quick-sort', 'shell-sort', 'heap-sort',
]) {
  cases.push({
    label: `${id} matches independently sorted raw arrays`, id, action: 'sort',
    main: `
void referenceSort(int* values, int size) {
    for (int index = 1; index < size; index++) {
        int current = values[index];
        int previous = index - 1;
        while (previous >= 0 && values[previous] > current) {
            values[previous + 1] = values[previous];
            previous--;
        }
        values[previous + 1] = current;
    }
}
int main() {
    RawArraySorter sorter;
    unsigned int seed = 42;
    for (int size : {0, 1, 2, 15, 99}) {
        int expected[100]{};
        sorter.size = size;
        for (int index = 0; index < size; index++) {
            seed = seed * 1664525u + 1013904223u;
            sorter.values[index] = static_cast<int>(seed % 41u) - 20;
            expected[index] = sorter.values[index];
        }
        referenceSort(expected, size);
        sorter.sort();
        for (int index = 0; index < size; index++) assert(sorter.values[index] == expected[index]);
    }
}`,
  });
}

await rm(workspace, { recursive: true, force: true });
await mkdir(workspace, { recursive: true });

try {
  for (let index = 0; index < cases.length; index++) {
    const testCase = cases[index];
    const source = getBeginnerCpp(algorithm(testCase.id), testCase.action);
    const sourcePath = path.join(workspace, `case-${index}.cpp`);
    const executablePath = path.join(workspace, `case-${index}.exe`);
    await writeFile(sourcePath, `#include <cassert>\n#include <cstddef>\n#include <string>\n\n${source}\n\n${testCase.main}\n`, 'utf8');
    const compilation = spawnSync('g++', ['-std=c++17', '-Wall', '-Wextra', '-pedantic', ...overflowFlags, sourcePath, '-o', executablePath], {
      encoding: 'utf8', timeout: 30_000, windowsHide: true,
    });
    if (compilation.status !== 0) {
      failures.push(`${testCase.label}: no compiló: ${(compilation.stderr || compilation.stdout).trim()}`);
      continue;
    }
    const execution = spawnSync(executablePath, [], { encoding: 'utf8', timeout: 10_000, windowsHide: true });
    if (execution.status !== 0) {
      failures.push(`${testCase.label}: terminó con código ${execution.status}: ${(execution.stderr || execution.stdout).trim()}`);
    }
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`EJECUCIÓN C++: ${failures.length} de ${cases.length} pruebas fallaron.`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`EJECUCIÓN C++ OK: ${cases.length} escenarios de punteros e invariantes superados.`);
}
