import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { getOperationDefinition } from '../src/logic/operations.js';

const workspace = path.resolve('.tmp-java-audit');
const failures = [];
let compilationCount = 0;

function nodeDefinition(contextId) {
  if (contextId === 'arbol-general') {
    return `static class Node {
        int value;
        List<Node> children = new ArrayList<>();
        Node() {}
        Node(int value) { this.value = value; }
    }`;
  }
  if (contextId === 'arbol-nario') {
    return `static class Node {
        int value;
        int childCount;
        Node[] children = new Node[N];
        Node() {}
        Node(int value) { this.value = value; }
    }`;
  }
  if (['btree', 'bplus-tree', 'bstar-tree'].includes(contextId)) {
    return `static class Node {
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
    }
    static class Leaf extends Node {
        Leaf next;
        Leaf() { super(true); }
    }`;
  }
  if (['quadtree', 'octree'].includes(contextId)) {
    return `static class Point {
        int x;
        int y;
        int z;
    }
    static class Node {
        int minX;
        int maxX;
        int minY;
        int maxY;
        int minZ;
        int maxZ;
        int pointCount;
        boolean isDivided;
        Point[] points = new Point[CAPACITY];
        Node[] children = new Node[8];
        Node() {}
        Node(int minX, int maxX, int minY, int maxY) {
            this.minX = minX; this.maxX = maxX;
            this.minY = minY; this.maxY = maxY;
        }
        Node(int minX, int maxX, int minY, int maxY, int minZ, int maxZ) {
            this(minX, maxX, minY, maxY);
            this.minZ = minZ; this.maxZ = maxZ;
        }
    }`;
  }
  return `static class Node {
        int value;
        int key;
        int height = 1;
        int row;
        int column;
        int[] point = new int[3];
        int number;
        char operator;
        boolean red;
        boolean isWord;
        boolean isSuffixEnd;
        boolean isNumber;
        Node left;
        Node right;
        Node next;
        Node prev;
        Node parent;
        Node up;
        Node[] children = new Node[26];
        Node() {}
        Node(int value) { this.value = value; this.key = value; }
        Node(int value, int row, int column) {
            this(value);
            this.row = row;
            this.column = column;
        }
    }`;
}

function harnessFields(contextId, source) {
  const declaresSize = /^\s*int\s+size\s*;\s*$/m.test(source);
  const declaresQueens = /^\s*int\[\]\s+queens\s*;\s*$/m.test(source);
  const rootDeclaration = contextId === 'trie'
    ? 'TrieNode root = new TrieNode();'
    : 'Node root = new Node();';
  return `
    ${nodeDefinition(contextId)}
    static class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord;
    }
    static final int N = 4;
    static final int T = 2;
    static final int MAX_KEYS = 3;
    static final int MIN_KEYS = 1;
    static final int DIMENSIONS = 2;
    static final int CAPACITY = 4;
    int[] values = new int[128];
    int[] initialValues = new int[128];
    int[] stack = new int[128];
    int[] queue = new int[128];
    int[] heap = new int[128];
    int[] tree = new int[512];
    int[] minimumTree = new int[512];
    int[] bit = new int[128];
    int[] parent = new int[128];
    int[] rank = new int[128];
    int[] table = new int[128];
    int[] keys = new int[128];
    int[] source = new int[8];
    int[] target = new int[8];
    int[] help = new int[8];
    boolean[] bits = new boolean[128];
    boolean[] used = new boolean[128];
    int[][] board = new int[9][9];
    int[][] edges = new int[128][128];
    int[][] maze = new int[9][9];
    boolean[][] path = new boolean[9][9];
    ${declaresQueens ? '' : 'int[] queens = new int[8];'}
    String[] blocks = new String[128];
    char[] vertexNames = new char[128];
    String text = "";
    ${declaresSize ? '' : 'int size;'}
    int initialSize;
    int top = -1;
    int rows = 9;
    int columns = 9;
    int vertexCount;
    int diskCount;
    int capacity = 5;
    ${rootDeclaration}
    Node nil = new Node();
    Node head;
    Node tail;
`;
}

function classNameOf(source) {
  return source.match(/\bpublic\s+class\s+([A-Za-z_]\w*)/)?.[1]
    ?? source.match(/\bclass\s+([A-Za-z_]\w*)/)?.[1]
    ?? null;
}

function compilableSource(source, contextId) {
  const className = classNameOf(source);
  if (className) return { className, source };
  return {
    className: 'AlgorithmExample',
    source: `import java.util.*;\n\nclass AlgorithmExample {\n${harnessFields(contextId, source)}\n${source}\n}\n`,
  };
}

await rm(workspace, { recursive: true, force: true });
await mkdir(workspace, { recursive: true });

try {
  for (const algorithm of algorithms) {
    for (const action of getOperationDefinition(algorithm).actions) {
      compilationCount++;
      const label = `${algorithm.id}/${action.id}`;
      const displayedSource = getBeginnerJava(algorithm, action.id);
      const { className, source } = compilableSource(displayedSource, algorithm.id);

      const folder = path.join(workspace, String(compilationCount).padStart(3, '0'));
      const output = path.join(folder, 'classes');
      await mkdir(output, { recursive: true });
      const sourcePath = path.join(folder, `${className}.java`);
      await writeFile(sourcePath, source, 'utf8');

      const compilation = spawnSync(
        'javac',
        ['-encoding', 'UTF-8', '-d', output, sourcePath],
        { encoding: 'utf8', timeout: 15_000, windowsHide: true },
      );
      if (compilation.error) {
        failures.push(`${label}: ${compilation.error.message}`);
        continue;
      }
      if (compilation.status !== 0) {
        const diagnostic = `${compilation.stderr || compilation.stdout}`
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(0, 8)
          .join(' | ');
        failures.push(`${label}: ${diagnostic}`);
      }
    }
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`COMPILACIÓN JAVA: ${failures.length} de ${compilationCount} ejemplos fallaron.`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`COMPILACIÓN JAVA OK: ${compilationCount} códigos compilados con javac.`);
}
