import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';

const samples = [
  ['array', 'add-start', `if (!java.util.Arrays.equals(lab.addAtStart(new int[]{2, 3}, 1), new int[]{1, 2, 3}))
            throw new AssertionError("array");`],
  ['deque', 'add-start', `if (lab.values.length != 100) throw new AssertionError("deque shared capacity");
        lab.size = lab.values.length;
        for (int i = 0; i < lab.size; i++) lab.values[i] = i + 10;
        int[] before = lab.values.clone();
        boolean rejected = false;
        try { lab.addAtStart(-1); }
        catch (IllegalStateException expected) { rejected = true; }
        if (!rejected || lab.size != before.length || !java.util.Arrays.equals(lab.values, before))
            throw new AssertionError("deque front full preserves state");
        lab.size = 0;
        lab.addAtStart(3);
        lab.addAtStart(2);
        lab.addAtStart(1);
        if (lab.size != 3 || lab.values[0] != 1 || lab.values[1] != 2 || lab.values[2] != 3)
            throw new AssertionError("deque front insertion");`],
  ['deque', 'add-end', `if (lab.values.length != 100) throw new AssertionError("deque shared capacity");
        lab.size = lab.values.length;
        for (int i = 0; i < lab.size; i++) lab.values[i] = i + 10;
        int[] before = lab.values.clone();
        boolean rejected = false;
        try { lab.addAtEnd(-1); }
        catch (IllegalStateException expected) { rejected = true; }
        if (!rejected || lab.size != before.length || !java.util.Arrays.equals(lab.values, before))
            throw new AssertionError("deque back full preserves state");
        lab.size = 0;
        lab.addAtEnd(4);
        lab.addAtEnd(7);
        if (lab.size != 2 || lab.values[0] != 4 || lab.values[1] != 7)
            throw new AssertionError("deque back insertion");`],
  ['deque', 'remove-start', `lab.values[0] = 99;
        int[] before = lab.values.clone();
        boolean rejected = false;
        try { lab.removeFromStart(); }
        catch (IllegalStateException expected) { rejected = true; }
        if (!rejected || lab.size != 0 || !java.util.Arrays.equals(lab.values, before))
            throw new AssertionError("deque front empty preserves state");
        lab.size = 3;
        lab.values[0] = 2; lab.values[1] = 3; lab.values[2] = 4;
        int removed = lab.removeFromStart();
        if (removed != 2 || lab.size != 2 || lab.values[0] != 3 || lab.values[1] != 4)
            throw new AssertionError("deque front removal");`],
  ['deque', 'remove-end', `lab.values[0] = 99;
        int[] before = lab.values.clone();
        boolean rejected = false;
        try { lab.removeFromEnd(); }
        catch (IllegalStateException expected) { rejected = true; }
        if (!rejected || lab.size != 0 || !java.util.Arrays.equals(lab.values, before))
            throw new AssertionError("deque back empty preserves state");
        lab.size = 3;
        lab.values[0] = 2; lab.values[1] = 3; lab.values[2] = 4;
        int removed = lab.removeFromEnd();
        if (removed != 4 || lab.size != 2 || lab.values[0] != 2 || lab.values[1] != 3)
            throw new AssertionError("deque back removal");`],
  ['bubble-sort', 'sort', `if (lab.size != 7 || lab.values[0] != 29) throw new AssertionError("initial data");
        lab.bubbleSort();
        for (int i = 1; i < lab.size; i++)
            if (lab.values[i - 1] > lab.values[i]) throw new AssertionError("bubble order");`],
  ['bubble-sort', 'reset', `lab.values[0] = 999;
        lab.reset();
        if (lab.size != 7 || lab.values[0] != 29) throw new AssertionError("reset data");`],
  ['radix-sort', 'sort', `lab.values[0] = Integer.MAX_VALUE;
        lab.values[1] = Integer.MIN_VALUE;
        lab.size = 2;
        lab.radixSort();
        if (lab.values[0] != Integer.MIN_VALUE || lab.values[1] != Integer.MAX_VALUE)
            throw new AssertionError("radix full integer span");`],
  ['avl', 'tree-add', `Node root = null;
        root = lab.insert(root, 10);
        root = lab.insert(root, 20);
        root = lab.insert(root, 30);
        if (root.value != 20 || root.left.value != 10 || root.right.value != 30)
            throw new AssertionError("AVL rotation");`],
  ['heap', 'heap-add', `if (lab.size != 7 || lab.heap[0] != 42) throw new AssertionError("initial heap");
        lab.insertHeap(50);
        if (lab.size != 8 || lab.heap[0] != 50) throw new AssertionError("max heap");`],
  ['trie', 'set-word', `lab.insertWord("CASA");
        if (!lab.root.children[2].children[0].children[18].children[0].isWord)
            throw new AssertionError("trie word");`],
  ['laberinto', 'solve', `if (!lab.solveMaze(0, 0) || !lab.path[5][5])
            throw new AssertionError("maze path");`],
  ['union-find', 'union', `if (lab.parent[1] != 0 || lab.parent[2] != 2) throw new AssertionError("initial sets");
        lab.union(1, 2);
        if (lab.findRoot(1) != lab.findRoot(2)) throw new AssertionError("union");`],
  ['a-star', 'shortest-path', `int[] map = {1, 1, 1, 0, 0, 0};
        int[] route = lab.aStar(map, 2, 3, 0, 2);
        int cost = 0;
        for (int index = 1; index < route.length; index++) cost += map[route[index]];
        if (cost != 1 || route[0] != 0 || route[route.length - 1] != 2)
            throw new AssertionError("A* zero-cost route");`],
];

const directory = await mkdtemp(path.join(tmpdir(), 'dsa-java-standalone-'));
try {
  for (const [id, actionId, main] of samples) {
    const algorithm = algorithms.find(item => item.id === id);
    const displayed = getBeginnerJava(algorithm, actionId);
    const className = displayed.match(/public class ([A-Za-z_]\w*)/)?.[1];
    assert.ok(className, `${id}/${actionId}: falta la clase Java visible`);
    const closing = displayed.lastIndexOf('}');
    assert.ok(closing > 0, `${id}/${actionId}: clase incompleta`);
    const source = `${displayed.slice(0, closing)}
    public static void main(String[] args) {
        ${className} lab = new ${className}();
        ${main}
    }
}`;
    const file = path.join(directory, `${className}.java`);
    await writeFile(file, source);
    const compilation = spawnSync('javac', [file], { encoding: 'utf8' });
    assert.equal(compilation.status, 0, `${id}/${actionId}: ${compilation.stderr}`);
    const execution = spawnSync('java', ['-cp', directory, className], { encoding: 'utf8' });
    assert.equal(execution.status, 0, `${id}/${actionId}: ${execution.stderr || execution.stdout}`);
  }
  console.log(`JAVA AUTÓNOMO OK: ${samples.length} escenarios ejecutados a partir del código visible.`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
