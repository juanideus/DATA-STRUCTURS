import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getRedBlackJava } from '../src/data/redBlackJava.js';
import { createRedBlackTree } from '../src/logic/redBlackTree.js';

const directory = await mkdtemp(path.join(tmpdir(), 'dsa-red-black-java-'));
const sequences = [
  [10, 5, 7], [10, 15, 13], [10, 5, 3], [10, 15, 20],
  [11, 6, 18, 3, 8, 15, 21, 1],
  Array.from({ length: 15 }, (_, index) => index + 1),
  ...Array.from({ length: 20 }, (_, shift) =>
    Array.from({ length: 8 }, (_, index) => (index * 7 + shift) % 29)),
];

try {
  let operations = 0;
  const scenarios = sequences.map(sequence => {
    const model = createRedBlackTree([]);
    const survivors = new Set();
    const lines = ['RedBlackTree tree = new RedBlackTree();'];
    const verify = () => {
      const snapshot = model.snapshot();
      const slots = Array.from({ length: 15 }, (_, index) => snapshot.values[index] ?? '_').join(',');
      const colors = Array.from({ length: 15 }, (_, index) => snapshot.colors[index] ?? '_').join(',');
      const sorted = [...survivors].toSorted((a, b) => a - b).join(',');
      lines.push(`verify(tree, "${snapshot.hiddenNode ? '' : slots}", "${snapshot.hiddenNode ? '' : colors}", "${sorted}");`);
    };
    for (const value of sequence) {
      assert.equal(model.insert(value), true);
      survivors.add(value);
      lines.push(`if (!tree.insert(${value})) throw new AssertionError("insert ${value}");`);
      verify();
      operations++;
    }
    const duplicate = sequence[0];
    lines.push(`if (tree.insert(${duplicate})) throw new AssertionError("duplicate ${duplicate}");`);
    verify();
    for (const value of [...sequence].reverse()) {
      assert.equal(model.remove(value), true);
      survivors.delete(value);
      lines.push(`if (!tree.remove(${value})) throw new AssertionError("remove ${value}");`);
      verify();
      operations++;
    }
    lines.push('if (tree.remove(999)) throw new AssertionError("missing value");');
    verify();
    return `{\n${lines.join('\n')}\n}`;
  });
  const source = `${getRedBlackJava('tree-add', true)}

class AuditRedBlack {
    static String slots(RedBlackTree.Node root, RedBlackTree.Node nil, boolean colors) {
        String[] result = new String[15];
        java.util.Arrays.fill(result, "_");
        fill(root, nil, 0, result, colors);
        return String.join(",", result);
    }
    static void fill(RedBlackTree.Node node, RedBlackTree.Node nil,
                     int index, String[] result, boolean colors) {
        if (node == nil || index >= result.length) return;
        result[index] = colors ? (node.red ? "red" : "black") : String.valueOf(node.value);
        fill(node.left, nil, index * 2 + 1, result, colors);
        fill(node.right, nil, index * 2 + 2, result, colors);
    }
    static int validate(RedBlackTree.Node node, RedBlackTree.Node nil,
                        long minimum, long maximum) {
        if (node == nil) return 1;
        if (node.value <= minimum || node.value >= maximum) throw new AssertionError("BST order");
        if (node.left == null || node.right == null) throw new AssertionError("null child instead of nil");
        if (node.red && (node.left.red || node.right.red)) throw new AssertionError("red parent and child");
        if (node.left != nil && node.left.parent != node) throw new AssertionError("left parent");
        if (node.right != nil && node.right.parent != node) throw new AssertionError("right parent");
        int left = validate(node.left, nil, minimum, node.value);
        int right = validate(node.right, nil, node.value, maximum);
        if (left != right) throw new AssertionError("black height");
        return left + (node.red ? 0 : 1);
    }
    static void inorder(RedBlackTree.Node node, RedBlackTree.Node nil,
                        java.util.List<Integer> output) {
        if (node == nil) return;
        inorder(node.left, nil, output);
        output.add(node.value);
        inorder(node.right, nil, output);
    }
    static void verify(RedBlackTree tree, String expectedSlots,
                       String expectedColors, String expectedSorted) {
        if (tree.nil.red || tree.nil.left != tree.nil || tree.nil.right != tree.nil)
            throw new AssertionError("nil invariant");
        if (tree.root != tree.nil && (tree.root.red || tree.root.parent != null))
            throw new AssertionError("root invariant");
        validate(tree.root, tree.nil, Long.MIN_VALUE, Long.MAX_VALUE);
        java.util.List<Integer> values = new java.util.ArrayList<>();
        inorder(tree.root, tree.nil, values);
        String actualSorted = values.toString().replace("[", "").replace("]", "").replace(" ", "");
        if (!actualSorted.equals(expectedSorted))
            throw new AssertionError("expected " + expectedSorted + ", got " + actualSorted);
        if (!expectedSlots.isEmpty() && !slots(tree.root, tree.nil, false).equals(expectedSlots))
            throw new AssertionError("shape differs from visualization: " + slots(tree.root, tree.nil, false));
        if (!expectedColors.isEmpty() && !slots(tree.root, tree.nil, true).equals(expectedColors))
            throw new AssertionError("colors differ from visualization: " + slots(tree.root, tree.nil, true));
    }
    public static void main(String[] args) {
${scenarios.join('\n')}
    }
}`;
  const file = path.join(directory, 'RedBlackTree.java');
  await writeFile(file, source);
  const compilation = spawnSync('javac', [file], { encoding: 'utf8' });
  assert.equal(compilation.status, 0, `El Java rojo-negro no compila:\n${compilation.stderr}`);
  const execution = spawnSync('java', ['-cp', directory, 'AuditRedBlack'], { encoding: 'utf8' });
  assert.equal(execution.status, 0, `El Java rojo-negro falló:\n${execution.stderr || execution.stdout}`);
  console.log(`JAVA ROJO-NEGRO OK: ${operations} inserciones/eliminaciones y estados cotejados con la visualización.`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
