import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getGraphCpp } from '../../src/data/graphCpp.js';
import { getGraphJava } from '../../src/data/graphJava.js';

const available = command => spawnSync(command, ['--version'], { encoding: 'utf8' }).status === 0;
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `${command} failed: ${result.stderr || result.stdout || result.error}`);
};

test('C++ unweighted graphs reject duplicate edges while respecting direction', { skip: !available('g++') }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'dsa-graph-cpp-'));
  try {
    const undirected = getGraphCpp('grafo', 'edge-add');
    const directed = getGraphCpp('grafo-dirigido', 'edge-add');
    writeFileSync(path.join(directory, 'graph.cpp'), `#include <cassert>\n${undirected}\n${directed}\nint main() {
      Graph g; g.vertexNames[0] = 'A'; g.vertexNames[1] = 'B'; g.vertexCount = 2;
      assert(g.addEdge('A', 'B')); assert(!g.addEdge('A', 'B')); assert(!g.addEdge('B', 'A'));
      DirectedGraph d; d.vertexNames[0] = 'A'; d.vertexNames[1] = 'B'; d.vertexCount = 2;
      assert(d.addEdge('A', 'B')); assert(!d.addEdge('A', 'B')); assert(d.addEdge('B', 'A'));
    }`);
    run('g++', ['-std=c++17', 'graph.cpp', '-o', 'graph-test'], directory);
    run(path.join(directory, process.platform === 'win32' ? 'graph-test.exe' : 'graph-test'), [], directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('Java Prim reserves both sentinel boundaries and preserves existing edges', { skip: !available('javac') || !available('java') }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'dsa-graph-java-'));
  try {
    writeFileSync(path.join(directory, 'Main.java'), `${getGraphJava('prim', 'edge-add')}\nclass Main {
      public static void main(String[] args) {
        PrimGraph g = new PrimGraph(); g.vertexNames[0] = "A"; g.vertexNames[1] = "B"; g.vertexCount = 2;
        if (g.addEdge("A", "B", 1000000000) || g.addEdge("A", "B", -1000000000)) throw new AssertionError();
        if (g.weights[0][1] != PrimGraph.NO_EDGE) throw new AssertionError();
        if (!g.addEdge("A", "B", 999999999) || g.addEdge("A", "B", 1)) throw new AssertionError();
        if (g.weights[0][1] != 999999999 || g.weights[1][0] != 999999999) throw new AssertionError();
        PrimGraph h = new PrimGraph(); h.vertexNames[0] = "A"; h.vertexNames[1] = "B"; h.vertexCount = 2;
        if (!h.addEdge("A", "B", -999999999)) throw new AssertionError();
      }
    }`);
    run('javac', ['Main.java'], directory);
    run('java', ['-cp', directory, 'Main'], directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
