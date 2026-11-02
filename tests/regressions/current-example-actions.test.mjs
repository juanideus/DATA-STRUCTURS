import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { executeOperation } from '../../src/logic/operations.js';
import { createCityMap } from '../../src/logic/pathfindingMap.js';
import { createOpenAddressingTable } from '../../src/logic/openAddressing.js';

const catalog = id => algorithms.find(a => a.id === id);
const cases = [];
const add = (id, action, java, cpp, extra = {}) => cases.push({ algorithm: { ...catalog(id), ...extra }, action, java, cpp });
for (const id of ['grafo', 'grafo-dirigido', 'bfs', 'dfs', 'prim', 'kruskal']) {
  const weighted = ['prim', 'kruskal'].includes(id);
  add(id, 'vertex-add', `assert t.vertexCount == 3 && t.vertexNames[1].equals("D"); assert !t.addVertex("DD"); assert !t.addVertex("D"); assert t.addVertex("G"); ${id === 'kruskal' ? 'assert t.edgeCount == 1 && t.edges[0].weight == 9;' : `assert t.${weighted ? 'weights[0][2] == 9' : 'adjacency[0][2]'};`}`,
    `assert(t.vertexCount == 3 && t.vertexNames[1] == 'D'); assert(!t.addVertex('D')); assert(t.addVertex('G')); assert(t.${weighted ? 'weights[0][2] == 9' : 'adjacency[0][2]'}); ${id === 'kruskal' ? 'assert(t.edgeCount == 1 && t.edges[0].weight == 9);' : ''}`,
    { values: ['B', 'D', 'F'], edges: [[0, 2, 9]] });
}
for (const id of ['arbol-binario', 'bst', 'avl', 'splay-tree', 'kd-tree']) {
  const arg = id === 'kd-tree' ? ', 0' : '';
  const javaCall = id === 'splay-tree' ? 'search(25)' : id === 'arbol-binario' ? 'find(t.root, 25)' : `search(t.root, 25${arg})`;
  add(id, 'find', `assert t.root.value == 55; assert t.${javaCall} != null;`, `assert(t.root->value == 55); assert(t.${id === 'arbol-binario' ? 'find' : 'search'}(t.root, 25${arg}) != nullptr);`, { values: [55, 25, 75] });
}
add('rojo-negro', 'find', 'assert t.find(25) && !t.find(99);', 'assert(t.search(25) != nullptr && t.search(99) == nullptr);', { values: [55, 25, 75] });
add('arbol-enhebrado', 'find', 'assert t.search(t.root, 25) != t.root;', 'assert(t.search(25) != t.root);', { values: [55, 25, 75] });
for (const id of ['btree', 'bplus-tree', 'bstar-tree']) {
  const arg = id === 'bplus-tree' ? '' : 't.root, ';
  add(id, 'find', `assert t.search(${arg}35) != null; assert t.search(${arg}99) == null;`, `assert(t.search(${arg}35) != nullptr); assert(t.search(${arg}99) == nullptr);`, { values: [5, 10, 15, 20, 25, 30, 35, 40] });
}
add('trie', 'word-find', 'assert t.searchWord("NUEVO") && !t.searchWord("CASA");', 'assert(t.searchWord("NUEVO") && !t.searchWord("CASA"));', { values: ['NUEVO'] });
add('trie', 'clear', 't.clear(); assert t.root != null; for (var child : t.root.children) assert child == null;', 't.clear(); assert(t.root != nullptr); for (int i=0; i<26; i++) assert(t.root->children[i] == nullptr);', { values: ['NUEVO'] });
add('skip-list', 'find', 'assert t.size == 2 && t.contains(27) && !t.contains(7);', 'assert(t.size == 2 && t.contains(27) && !t.contains(7));', { values: [11, 27] });
add('lru-cache', 'cache-get', 'assert t.get("X").equals("9") && t.tail.key.equals("X"); assert t.get("E").equals("");', 'std::string value; assert(t.get("X", value) && value == "9" && t.tail->key == "X"); assert(t.get("E", value) && value.empty());', { values: ['X:9', 'E:'] });
add('union-find', 'find-root', 'assert t.findRoot(3) == 0 && t.parent[3] == 0;', 'assert(t.findRoot(3) == 0 && t.parent[3] == 0);', { values: [0, 0, 0, 2] });
add('fibonacci-heap', 'peek', 'assert t.peekMinimum() == 11 && t.size == 3;', 'int value; assert(t.peekMinimum(value) && value == 11 && t.nodeCount == 3);', { values: [44, 11, 33] });
add('merkle-tree', 'remove-end', 'assert t.removeLastBlock().equals("LAST") && t.size == 1;', 'std::string value; assert(t.removeLastBlock(value) && value == "LAST" && t.size == 1);', { values: ['FIRST', 'LAST'] });
add('expression-tree', 'evaluate', 'assert t.evaluate(t.root) == 29;', 'assert(t.evaluate(t.root) == 29);');
add('ast', 'ast-clear', 'assert t.root.label.equals("ASSIGN"); t.clear(); assert t.root == null;', 'assert(t.root->label == "ASSIGN"); t.clear(); assert(t.root == nullptr);');
add('listas-generalizadas', 'glist-depth', 'assert t.root != null && t.depth() == 3;', 'assert(t.root != nullptr && t.depth() == 3);');
add('laberinto', 'solve', 'assert t.maze.length == 6 && t.maze[0][2] == 1; assert t.solveMaze(0, 0);', 'assert(t.maze[0][2] == 1); assert(t.solve(0, 0));');
add('sudoku', 'solve', 'assert t.board[0][0] == 5 && t.board[0][2] == 0; assert t.solveSudoku(0, 0); assert t.board[0][2] == 4;', 'assert(t.board[0][0] == 5 && t.board[0][2] == 0); assert(t.solve()); assert(t.board[0][2] == 4);');
add('hanoi', 'hanoi-set', 'assert t.diskCount == 3 && t.source[0] == 3; t.createDisks(8); assert t.diskCount == 3;', 'assert(t.diskCount == 3 && t.sourceSize == 3 && t.source[0] == 3); assert(!t.setDisks(8)); assert(t.diskCount == 3);', { values: [3, 2, 1] });
for (const id of ['quadtree', 'octree']) {
  const oct = id === 'octree';
  add(id, 'find', `var point = new ${oct ? 'Octree' : 'QuadTree'}.Point(); point.x = 12; point.y = 12; ${oct ? 'point.z = 12;' : ''} assert t.contains(t.root, point);`, `assert(t.contains({12,12${oct ? ',12' : ''}}));`, { values: oct ? ['12,12,12', '13,13,13', '14,14,14'] : ['12,12', '13,13', '14,14'] });
}
for (const id of ['dijkstra', 'a-star']) {
  const map = createCityMap(1234);
  add(id, 'shortest-path', `assert t.map.length == 264 && t.start == ${map.start} && t.goal == ${map.goal}; assert t.${id === 'dijkstra' ? 'dijkstra' : 'aStar'}(t.map, t.rows, t.columns, t.start, t.goal).length > 0;`, `assert(t.start == ${map.start} && t.goal == ${map.goal}); assert(t.shortestPath(t.start, t.goal));`, { map });
}
for (const id of ['hash-table', 'hash-open']) {
  const model = createOpenAddressingTable(['A:1', 'M:2']);
  const removed = model.remove('A'), remaining = model.find('M');
  add(id, 'find', `assert t.size == 1 && t.states[${removed}] == 2 && t.states[${remaining}] == 1; assert t.get("M").equals("2");`, `std::string value; assert(t.size == 1 && t.states[${removed}] == 2 && t.states[${remaining}] == 1); assert(t.find("M", value) && value == "2");`, { values: ['M:2'], hashTable: model.snapshot() });
}
add('hanoi', 'hanoi-solve', 'assert t.diskCount == 2 && t.target[0] == 2 && t.target[1] == 1;', 'assert(t.diskCount == 2 && t.sourceSize == 0 && t.targetSize == 2); assert(!t.solve());', { values: [{ size: 2, rod: 2 }, { size: 1, rod: 2 }] });
add('hanoi', 'hanoi-set', 't.createDisks(3); assert t.diskCount == 3 && t.source[0] == 3 && t.target[0] == 0 && t.help[0] == 0;', 'assert(t.setDisks(3)); assert(t.diskCount == 3 && t.sourceSize == 3 && t.targetSize == 0 && t.auxiliarySize == 0);', { values: [{ size: 2, rod: 2 }, { size: 1, rod: 2 }] });
for (const id of ['segment-tree', 'fenwick-tree', 'bubble-sort']) {
  const check = id === 'segment-tree' ? 't.tree[1] == 16' : id === 'fenwick-tree' ? 't.bit[2] == 8 && t.bit[3] == 8' : 't.values[0] == 3';
  add(id, 'reset', `t.reset(); assert t.size == 3 && t.values[2] == 8 && ${check};`, `t.reset(); assert(t.size == 3 && t.values[2] == 8 && ${check});`, { values: [99], initialValues: [3, 5, 8] });
}
add('laberinto', 'reset', 'assert t.maze[0][2] == 0; t.resetPath(); assert t.maze[0][2] == 1;', 'assert(t.maze[0][2] == 0); t.reset(); assert(t.maze[0][2] == 1);', { values: Array(36).fill(0), initialValues: catalog('laberinto').values });

const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 60_000, windowsHide: true });
  assert.equal(result.status, 0, `${result.error?.message ?? ''}\n${result.stderr}\n${result.stdout}`);
};

test('hash buttons preserve an explicitly empty value in all representations', () => {
  for (const id of ['hash-table', 'hash-open', 'hash-chaining']) {
    const a = catalog(id);
    const result = executeOperation({ algorithm: a, actionId: 'hash-put', fields: { value: 'X', second: '' }, values: [], edges: [], initialValues: a.values });
    assert.equal(result.ok, true);
    assert.deepEqual(result.values, ['X:']);
    assert.equal(result.values[0].slice(result.values[0].indexOf(':') + 1), '');
  }
});

test('displayed Java executes actions against the current input snapshot', { skip: !process.env.DSA_EXAMPLE_JAVA }, () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'dsa-current-java-'));
  const files = [];
  cases.forEach(({ algorithm, action, java }, i) => {
    const source = getBeginnerJava(algorithm, action);
    const name = source.match(/(?:public )?class (\w+)/)[1];
    const directory = path.join(folder, `p${i}`);
    mkdirSync(directory);
    const file = path.join(directory, `${name}.java`);
    writeFileSync(file, `package p${i};\n${source}\nclass Harness { public static void main(String[] args) { ${name} t = new ${name}(); ${java} } }`);
    files.push(file);
  });
  run(process.env.DSA_EXAMPLE_JAVA, ['-encoding', 'UTF-8', '-d', folder, ...files]);
  cases.forEach(({ algorithm, action }, i) => {
    try { run('java', ['-ea', '-cp', folder, `p${i}.Harness`]); }
    catch (error) { throw new Error(`${algorithm.id}/${action}: ${error.message}`); }
  });
});

test('displayed C++ executes actions against the current input snapshot', { skip: !process.env.DSA_EXAMPLE_CXX }, () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'dsa-current-cpp-'));
  const includes = new Set(['#include <cassert>', '#include <string>']);
  const sources = cases.map(({ algorithm, action, cpp }, i) => {
    const source = getBeginnerCpp(algorithm, action).replace(/^#include[^\n]+/gm, line => { includes.add(line); return ''; });
    const name = source.match(/class (\w+)/)[1];
    return `namespace p${i} {\n${source}\nvoid run() { ${name} t; ${cpp} }\n}`;
  });
  const file = path.join(folder, 'examples.cpp');
  const binary = path.join(folder, process.platform === 'win32' ? 'examples.exe' : 'examples');
  writeFileSync(file, `${[...includes].join('\n')}\n${sources.join('\n')}\nint main() { ${cases.map((_, i) => `p${i}::run();`).join(' ')} }`);
  run(process.env.DSA_EXAMPLE_CXX, ['-std=c++17', '-Wall', '-Wextra', file, '-o', binary]);
  run(binary, []);
});
