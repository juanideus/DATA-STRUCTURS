import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';

const samples = [
  ['array', 'add-start', `AlgorithmExample lab = new AlgorithmExample();
        if (!java.util.Arrays.equals(lab.addAtStart(new int[]{2, 3}, 1), new int[]{1, 2, 3}))
            throw new AssertionError("array");`],
  ['bubble-sort', 'sort', `AlgorithmExample lab = new AlgorithmExample();
        if (lab.size != 7 || lab.values[0] != 29) throw new AssertionError("initial data");
        lab.bubbleSort();
        for (int i = 1; i < lab.size; i++)
            if (lab.values[i - 1] > lab.values[i]) throw new AssertionError("bubble order");`],
  ['bubble-sort', 'reset', `AlgorithmExample lab = new AlgorithmExample();
        lab.values[0] = 999;
        lab.reset();
        if (lab.size != 7 || lab.values[0] != 29) throw new AssertionError("reset data");`],
  ['avl', 'tree-add', `AlgorithmExample lab = new AlgorithmExample();
        Node root = null;
        root = lab.insert(root, 10);
        root = lab.insert(root, 20);
        root = lab.insert(root, 30);
        if (root.value != 20 || root.left.value != 10 || root.right.value != 30)
            throw new AssertionError("AVL rotation");`],
  ['heap', 'heap-add', `AlgorithmExample lab = new AlgorithmExample();
        if (lab.size != 7 || lab.heap[0] != 42) throw new AssertionError("initial heap");
        lab.insertHeap(50);
        if (lab.size != 8 || lab.heap[0] != 50) throw new AssertionError("max heap");`],
  ['trie', 'set-word', `AlgorithmExample lab = new AlgorithmExample();
        lab.insertWord("CASA");
        if (!lab.root.children[2].children[0].children[18].children[0].isWord)
            throw new AssertionError("trie word");`],
  ['laberinto', 'solve', `AlgorithmExample lab = new AlgorithmExample();
        if (!lab.solveMaze(0, 0) || !lab.path[5][5])
            throw new AssertionError("maze path");`],
  ['union-find', 'union', `AlgorithmExample lab = new AlgorithmExample();
        if (lab.parent[1] != 0 || lab.parent[2] != 2) throw new AssertionError("initial sets");
        lab.union(1, 2);
        if (lab.findRoot(1) != lab.findRoot(2)) throw new AssertionError("union");`],
  ['a-star', 'shortest-path', `AlgorithmExample lab = new AlgorithmExample();
        int[] map = {1, 1, 1, 0, 0, 0};
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
    const closing = displayed.lastIndexOf('}');
    assert.ok(closing > 0, `${id}/${actionId}: clase incompleta`);
    const source = `${displayed.slice(0, closing)}
    public static void main(String[] args) {
        ${main}
    }
}`;
    const file = path.join(directory, 'AlgorithmExample.java');
    await writeFile(file, source);
    const compilation = spawnSync('javac', [file], { encoding: 'utf8' });
    assert.equal(compilation.status, 0, `${id}/${actionId}: ${compilation.stderr}`);
    const execution = spawnSync('java', ['-cp', directory, 'AlgorithmExample'], { encoding: 'utf8' });
    assert.equal(execution.status, 0, `${id}/${actionId}: ${execution.stderr || execution.stdout}`);
  }
  console.log(`JAVA AUTÓNOMO OK: ${samples.length} escenarios ejecutados a partir del código visible.`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
