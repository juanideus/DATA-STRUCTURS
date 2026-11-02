const structureClassNames = {
  array: 'Array', deque: 'Deque',
  'arbol-general': 'GeneralTree', 'arbol-nario': 'NaryTree',
  'arbol-binario': 'BinaryTree', bst: 'BinarySearchTree', avl: 'AVLTree',
  'splay-tree': 'SplayTree', heap: 'BinaryHeap', trie: 'Trie',
  'suffix-tree': 'SuffixTrie', 'segment-tree': 'SegmentTree',
  'fenwick-tree': 'FenwickTree', btree: 'BTree',
  'bplus-tree': 'BPlusTree', 'bstar-tree': 'BStarTree',
  'merkle-tree': 'MerkleTree', 'kd-tree': 'KDTree',
  quadtree: 'QuadTree', octree: 'Octree', 'expression-tree': 'ExpressionTree',
  dijkstra: 'Dijkstra', 'a-star': 'AStar', fibonacci: 'Fibonacci',
  factorial: 'Factorial', hanoi: 'Hanoi',
  'bubble-sort': 'BubbleSort', 'selection-sort': 'SelectionSort',
  'insertion-sort': 'InsertionSort', 'merge-sort': 'MergeSort',
  'quick-sort': 'QuickSort', 'shell-sort': 'ShellSort',
  'heap-sort': 'HeapSort', 'counting-sort': 'CountingSort',
  'radix-sort': 'RadixSort', 'bogo-sort': 'BogoSort',
  'n-reinas': 'NQueens', laberinto: 'Maze', sudoku: 'Sudoku',
  'union-find': 'UnionFind',
};

const nodeDefinition = (contextId, source) => {
  if (contextId === 'suffix-tree') return `static class Node {
        Node[] children = new Node[26];
        boolean isSuffixEnd;
    }`;
  if (contextId === 'expression-tree') return `static class Node {
        final boolean isNumber;
        final int number;
        final char operator;
        Node left;
        Node right;
        Node(int number) {
            this.isNumber = true; this.number = number; this.operator = 0;
        }
        Node(char operator, Node left, Node right) {
            this.isNumber = false; this.number = 0; this.operator = operator;
            this.left = left; this.right = right;
        }
    }`;
  if (contextId === 'arbol-general') return `static class Node {
        int value;
        List<Node> children = new ArrayList<>();
        Node() {}
        Node(int value) { this.value = value; }
    }`;
  if (contextId === 'arbol-nario') return `static class Node {
        int value;
        int childCount;
        Node[] children = new Node[N];
        Node() {}
        Node(int value) { this.value = value; }
    }`;
  if (['btree', 'bplus-tree', 'bstar-tree'].includes(contextId)) return `static class Node {
        int value;
        int keyCount;
        int[] keys = new int[MAX_KEYS + 2];
        boolean isLeaf = true;
        Node parent;
        Node next;
        Node[] children = new Node[MAX_KEYS + 3];
        Node() {}
        Node(int value) { this.value = value; }
        Node(boolean isLeaf) { this.isLeaf = isLeaf; }
    }${/\bLeaf\b/.test(source) ? `
    static class Leaf extends Node {
        Leaf next;
        Leaf() { super(true); }
    }` : ''}`;
  if (['quadtree', 'octree'].includes(contextId)) return `static class Point {
        int x, y, z;
    }
    static class Node {
        double minX, maxX, minY, maxY, minZ, maxZ;
        int pointCount;
        boolean isDivided;
        Point[] points = new Point[CAPACITY];
        Node[] children = new Node[8];
        Node() {}
        Node(double minX, double maxX, double minY, double maxY) {
            this.minX = minX; this.maxX = maxX;
            this.minY = minY; this.maxY = maxY;
        }
        Node(double minX, double maxX, double minY, double maxY, double minZ, double maxZ) {
            this(minX, maxX, minY, maxY);
            this.minZ = minZ; this.maxZ = maxZ;
        }
    }`;
  return null;
};

const ordinaryNodeDefinition = source => {
  const member = name => new RegExp(`\\.${name}\\b`).test(source);
  const lines = ['int value;'];
  for (const name of ['key', 'row', 'column', 'number']) if (member(name)) lines.push(`int ${name};`);
  if (member('height')) lines.push('int height = 1;');
  if (member('point')) lines.push('int[] point = new int[3];');
  if (member('operator')) lines.push('char operator;');
  for (const name of ['red', 'isWord', 'isSuffixEnd', 'isNumber']) if (member(name)) lines.push(`boolean ${name};`);
  for (const name of ['left', 'right', 'next', 'prev', 'parent', 'up']) if (member(name)) lines.push(`Node ${name};`);
  if (member('children')) lines.push('Node[] children = new Node[26];');
  lines.push('Node() {}', member('key')
    ? 'Node(int value) { this.value = value; this.key = value; }'
    : 'Node(int value) { this.value = value; }');
  if (/new Node\([^,()]+,[^,()]+,[^,()]+\)/.test(source)) {
    if (!member('row')) lines.push('int row;');
    if (!member('column')) lines.push('int column;');
    lines.push('Node(int value, int row, int column) { this(value); this.row = row; this.column = column; }');
  }
  return `static class Node {\n        ${lines.join('\n        ')}\n    }`;
};

const fields = [
  ['N', 'static final int N = 4;'],
  ['T', 'static final int T = 2;'],
  ['MAX_KEYS', 'static final int MAX_KEYS = 3;'],
  ['MIN_KEYS', 'static final int MIN_KEYS = 1;'],
  ['DIMENSIONS', 'static final int DIMENSIONS = 2;'],
  ['CAPACITY', 'static final int CAPACITY = 4;'],
  ['values', 'int[] values = new int[128];'],
  ['initialValues', 'int[] initialValues = new int[128];'],
  ['stack', 'int[] stack = new int[128];'],
  ['queue', 'int[] queue = new int[128];'],
  ['heap', 'int[] heap = new int[128];'],
  ['tree', 'int[] tree = new int[512];'],
  ['minimumTree', 'int[] minimumTree = new int[512];'],
  ['bit', 'int[] bit = new int[128];'],
  ['parent', 'int[] parent = new int[128];'],
  ['rank', 'int[] rank = new int[128];'],
  ['table', 'int[] table = new int[128];'],
  ['keys', 'int[] keys = new int[128];'],
  ['source', 'int[] source = new int[8];'],
  ['target', 'int[] target = new int[8];'],
  ['help', 'int[] help = new int[8];'],
  ['bits', 'boolean[] bits = new boolean[128];'],
  ['used', 'boolean[] used = new boolean[128];'],
  ['board', 'int[][] board = new int[9][9];'],
  ['edges', 'int[][] edges = new int[128][128];'],
  ['maze', 'int[][] maze = new int[9][9];'],
  ['path', 'boolean[][] path = new boolean[9][9];'],
  ['queens', 'int[] queens = new int[8];'],
  ['blocks', 'String[] blocks = new String[128];'],
  ['vertexNames', 'char[] vertexNames = new char[128];'],
  ['text', 'String text = "";'],
  ['size', 'int size;'],
  ['initialSize', 'int initialSize;'],
  ['top', 'int top = -1;'],
  ['rows', 'int rows = 9;'],
  ['columns', 'int columns = 9;'],
  ['vertexCount', 'int vertexCount;'],
  ['diskCount', 'int diskCount;'],
  ['capacity', 'int capacity = 5;'],
  ['nil', 'Node nil = new Node();'],
  ['head', 'Node head;'],
  ['tail', 'Node tail;'],
];

const wordUsed = (source, word) => new RegExp(`\\b${word}\\b`).test(source);
const bareWordUsed = (source, word) => new RegExp(`(?<![.\\w])${word}\\b`).test(source);
const declaresField = (source, declaration) => new RegExp(`^\\s*${declaration}\\s*;\\s*$`, 'm').test(source);

export function makeJavaStandalone(source, contextId, initialValues = []) {
  if (contextId === 'hash-table') source = source.replace(/\bOpenAddressingTable\b/g, 'HashTable');
  if (/\bclass\s+[A-Za-z_]\w*/.test(source)) return source;

  const className = structureClassNames[contextId]
    ?? contextId.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const declarations = [];
  const hasNode = wordUsed(source, 'Node') || wordUsed(source, 'Leaf') || wordUsed(source, 'Point');
  if (hasNode) {
    declarations.push(nodeDefinition(contextId, source) ?? ordinaryNodeDefinition(source));
  }
  if (wordUsed(source, 'TrieNode')) {
    declarations.push(`static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord;
    }`);
  }
  for (const [name, declaration] of fields) {
    if (contextId === 'array') continue;
    if (name === 'parent' && !/\bparent\s*\[/.test(source)) continue;
    if (!bareWordUsed(source, name)
        && !(contextId === 'suffix-tree' && name === 'text')
        && !(contextId === 'segment-tree' && ['values', 'initialValues', 'size', 'initialSize', 'tree', 'minimumTree'].includes(name))
        && !(contextId === 'fenwick-tree' && ['values', 'bit', 'size'].includes(name))
        && !(contextId === 'heap' && ['heap', 'size'].includes(name))
        && !(name === 'N' && contextId === 'arbol-nario' && hasNode)
        && !(name === 'MAX_KEYS' && ['btree', 'bplus-tree', 'bstar-tree'].includes(contextId) && hasNode)
        && !(name === 'CAPACITY' && ['quadtree', 'octree'].includes(contextId) && hasNode)) continue;
    if (name === 'size' && declaresField(source, 'int\\s+size')) continue;
    if (name === 'queens' && declaresField(source, 'int\\[\\]\\s+queens')) continue;
    declarations.push(['values', 'initialValues'].includes(name) && contextId.endsWith('-sort')
      ? `int[] ${name} = new int[100];`
      : name === 'tree' && contextId === 'segment-tree'
        ? 'long[] tree = new long[512];'
      : name === 'bit' && contextId === 'fenwick-tree'
        ? 'long[] bit = new long[128];'
      : name === 'values' && contextId === 'deque'
      ? 'int[] values = new int[100];'
      : name === 'MAX_KEYS' && contextId === 'bstar-tree'
      ? 'static final int MAX_KEYS = 5;'
      : name === 'CAPACITY' && ['quadtree', 'octree'].includes(contextId)
        ? 'static final int CAPACITY = 2;'
        : declaration);
  }
  if ((bareWordUsed(source, 'root') || ['bst', 'splay-tree', 'avl', 'arbol-binario', 'arbol-general', 'arbol-nario', 'btree', 'bstar-tree'].includes(contextId)) && (hasNode || wordUsed(source, 'TrieNode'))) {
    const initialRoot = contextId === 'trie' ? 'TrieNode root = new TrieNode();'
      : contextId === 'suffix-tree' ? 'Node root = new Node();'
        : ['btree', 'bplus-tree', 'bstar-tree'].includes(contextId) ? 'Node root = new Node(true);'
          : 'Node root;';
    declarations.push(initialRoot);
  }
  if (['bst', 'splay-tree', 'avl', 'arbol-binario'].includes(contextId) && Array.isArray(initialValues)) {
    const height = index => Number.isInteger(initialValues[index]) ? 1 + Math.max(height(index * 2 + 1), height(index * 2 + 2)) : 0;
    const assignments = initialValues.flatMap((value, index) => {
      if (!Number.isInteger(value)) return [];
      const sides = [];
      for (let position = index; position > 0; position = Math.floor((position - 1) / 2)) sides.unshift(position % 2 ? 'left' : 'right');
      const target = `root${sides.map(side => `.${side}`).join('')}`;
      return [`        ${target} = new Node(${value});`, ...(contextId === 'avl' && /\.height\b/.test(source) ? [`        ${target}.height = ${height(index)};`] : [])];
    }).join('\n');
    declarations.push(`${className}() {\n${assignments}\n    }`);
  }
  if (contextId === 'suffix-tree' && Array.isArray(initialValues) && initialValues.every(value => typeof value === 'string' && /^[A-Z]$/.test(value))) {
    const startingText = JSON.stringify(initialValues.join(''));
    declarations.push(`${className}() {
        text = ${startingText};
        for (int start = 0; start < text.length(); start++) {
            Node current = root;
            for (int i = start; i < text.length(); i++) {
                int letter = text.charAt(i) - 'A';
                if (current.children[letter] == null) current.children[letter] = new Node();
                current = current.children[letter];
            }
            current.isSuffixEnd = true;
        }
    }`);
  }
  if (contextId === 'segment-tree' && Array.isArray(initialValues) && initialValues.every(Number.isInteger)) {
    declarations.push(`${className}() {
        int[] startingValues = new int[]{${initialValues.join(', ')}};
        size = initialSize = startingValues.length;
        System.arraycopy(startingValues, 0, values, 0, size);
        System.arraycopy(startingValues, 0, initialValues, 0, size);
        if (size > 0) buildInitialSegmentTree(1, 0, size - 1);
    }
    void buildInitialSegmentTree(int node, int left, int right) {
        if (left == right) { tree[node] = values[left]; minimumTree[node] = values[left]; return; }
        int middle = left + (right - left) / 2;
        buildInitialSegmentTree(node * 2, left, middle);
        buildInitialSegmentTree(node * 2 + 1, middle + 1, right);
        tree[node] = tree[node * 2] + tree[node * 2 + 1];
        minimumTree[node] = Math.min(minimumTree[node * 2], minimumTree[node * 2 + 1]);
    }`);
  }
  if (contextId === 'fenwick-tree' && Array.isArray(initialValues) && initialValues.every(Number.isInteger)) {
    declarations.push(`${className}() {
        values = new int[]{${initialValues.join(', ')}};
        size = values.length;
        bit = new long[size + 1];
        for (int i = 0; i < size; i++) {
            int index = i + 1;
            while (index <= size) {
                bit[index] += values[i];
                index += index & -index;
            }
        }
    }`);
  }
  if (contextId.endsWith('-sort') && Array.isArray(initialValues) && initialValues.every(Number.isInteger)) {
    const startingValues = `new int[]{${initialValues.join(', ')}}`;
    declarations.push(`${className}() {
        int[] startingValues = ${startingValues};
        System.arraycopy(startingValues, 0, values, 0, startingValues.length);
${bareWordUsed(source, 'initialValues') ? '        System.arraycopy(startingValues, 0, initialValues, 0, startingValues.length);\n' : ''}${bareWordUsed(source, 'initialSize') ? '        initialSize = startingValues.length;\n' : ''}        size = startingValues.length;
    }`);
  }
  if (contextId === 'heap' && Array.isArray(initialValues) && initialValues.every(Number.isInteger)) {
    declarations.push(`${className}() {
        int[] startingValues = {${initialValues.join(', ')}};
        System.arraycopy(startingValues, 0, heap, 0, startingValues.length);
        size = startingValues.length;
    }`);
  }
  if (contextId === 'union-find' && Array.isArray(initialValues) && initialValues.every(Number.isInteger)) {
    declarations.push(`${className}() {
        int[] startingParents = {${initialValues.join(', ')}};
        System.arraycopy(startingParents, 0, parent, 0, startingParents.length);
${bareWordUsed(source, 'rank') ? `        for (int i = 0; i < startingParents.length; i++) {
            int current = i;
            int depth = 0;
            while (parent[current] != current) {
                current = parent[current];
                depth++;
            }
            rank[current] = Math.max(rank[current], depth);
        }
` : ''}${bareWordUsed(source, 'size') ? '        size = startingParents.length;\n' : ''}    }`);
  }
  const operation = source.includes('// Start of the selected operation')
    ? source
    : `// Start of the selected operation\n${source}\n// End of the selected operation`;
  const context = declarations.map(line => `    ${line}`).join('\n\n');
  const indented = operation.split('\n').map(line => line ? `    ${line}` : '').join('\n');
  return `import java.util.*;

public class ${className} {
${indented}${context ? `\n\n${context}` : ''}
}`;
}
