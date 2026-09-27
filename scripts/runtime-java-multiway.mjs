import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { createMultiwayTree } from '../src/logic/multiwayTree.js';

const directory = await mkdtemp(path.join(tmpdir(), 'dsa-multiway-java-'));
const sequences = [
  [4, 9, 13, 18, 24, 30, 1, 15, 20, 32, 8, 10, 11, 12, 14, 16, 17, 19, 21],
  [12, 4, 20, 2, 6, 16, 24, 1, 3, 5, 7, 14, 18, 22, 26, 9, 11, 13, 15],
];
const removalOrders = [
  [15, 4, 32, 10, 1, 24, 9, 18, 30, 13, 12, 11, 14, 16, 17, 19, 20, 21, 8],
  [12, 2, 24, 4, 20, 7, 1, 26, 16, 3, 5, 6, 9, 11, 13, 14, 15, 18, 22],
];
const javaNode = current => `make(new int[]{${current.keys.join(',')} }${current.children.map(child => `, ${javaNode(child)}`).join('')})`;

try {
  let scenarios = 0;
  for (const id of ['btree', 'bplus-tree', 'bstar-tree']) for (const operation of ['sorted-add', 'remove-value']) {
    const algorithm = algorithms.find(item => item.id === id);
    const snippet = getBeginnerJava(algorithm, operation);
    const cases = sequences.map((sequence, index) => {
      const isInsert = operation === 'sorted-add';
      const model = createMultiwayTree(id, isInsert ? [] : sequence);
      let survivors = isInsert ? [] : [...sequence];
      const checks = (isInsert ? sequence : removalOrders[index]).map(value => {
        if (isInsert) survivors.push(value);
        else survivors = survivors.filter(item => item !== value);
        return `lab.${isInsert ? 'insert' : 'remove'}(${value}); lab.verify("${survivors.toSorted((a, b) => a - b).join(',')}");`;
      });
      scenarios += checks.length;
      return `lab.root = ${isInsert ? 'new Node(true)' : javaNode(model.snapshot().root)};\n${checks.join('\n')}`;
    });
    const displayedClass = snippet.replace('public class AlgorithmExample', 'public class AuditMultiway');
    const source = `${displayedClass.slice(0, displayedClass.lastIndexOf('}'))}
    static Node make(int[] keys, Node... children) {
        Node node = new Node(children.length == 0);
        node.keyCount = keys.length;
        for (int i = 0; i < keys.length; i++) node.keys[i] = keys[i];
        for (int i = 0; i < children.length; i++) {
            node.children[i] = children[i];
            children[i].parent = node;
        }
        return node;
    }
    void collect(Node node, List<Integer> output) {
        if (node.isLeaf) {
            for (int i = 0; i < node.keyCount; i++) output.add(node.keys[i]);
            return;
        }
        for (int i = 0; i < node.keyCount; i++) {
            collect(node.children[i], output);
            if (!"bplus-tree".equals("${id}")) output.add(node.keys[i]);
        }
        collect(node.children[node.keyCount], output);
    }
    void validate(Node node, int depth) {
        if (node.keyCount > MAX_KEYS) throw new AssertionError("overflow");
        int minimum = "bstar-tree".equals("${id}") ? (depth == 1 ? 2 : 3)
            : "bplus-tree".equals("${id}") ? (node.isLeaf ? 2 : 1) : 1;
        if (depth > 0 && node.keyCount < minimum) throw new AssertionError("underflow");
        if (!node.isLeaf) for (int i = 0; i <= node.keyCount; i++) {
            if (node.children[i] == null || node.children[i].parent != node) throw new AssertionError("child link");
            validate(node.children[i], depth + 1);
        }
    }
    void verify(String expected) {
        List<Integer> values = new ArrayList<>();
        collect(root, values);
        String actual = values.toString().replace("[", "").replace("]", "").replace(" ", "");
        if (!actual.equals(expected)) throw new AssertionError("expected " + expected + ", got " + actual);
        validate(root, 0);
    }
    public static void main(String[] args) {
        AuditMultiway lab = new AuditMultiway();
${cases.join('\n')}
    }
}`;
    const file = path.join(directory, 'AuditMultiway.java');
    await writeFile(file, source);
    const compile = spawnSync('javac', [file], { encoding: 'utf8' });
    assert.equal(compile.status, 0, `${id}/${operation} no compila:\n${compile.stderr}`);
    const run = spawnSync('java', ['-cp', directory, 'AuditMultiway'], { encoding: 'utf8' });
    assert.equal(run.status, 0, `${id}/${operation} falló: ${run.stderr || run.stdout}`);
  }
  console.log(`JAVA MULTICAMINO OK: ${scenarios} inserciones/eliminaciones B/B+/B* con orden y ocupación.`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
