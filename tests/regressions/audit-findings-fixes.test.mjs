import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { executeOperation, DEFAULT_GRAPH_EDGES } from '../../src/logic/operations.js';
import { createMultiwayTree } from '../../src/logic/multiwayTree.js';
import { createOpenAddressingTable } from '../../src/logic/openAddressing.js';
import { adaptFramesToCode, createCodeSynchronizedFrames, createLinkedListSynchronizedFrames } from '../../src/logic/codeAnimation.js';
import { cppCodeNeedle } from '../../src/logic/cppCodeNeedles.js';

const getAlgorithm = id => algorithms.find(item => item.id === id);
const compilerAvailable = command => spawnSync(command, ['--version'], { encoding: 'utf8', timeout: 5000, windowsHide: true }).status === 0;
const run = (id, actionId, fields = {}, values = getAlgorithm(id).values, extra = {}) => executeOperation({
  algorithm: getAlgorithm(id), actionId, fields, values, edges: [],
  initialValues: getAlgorithm(id).values, initialEdges: [], ...extra,
});

test('spatial generated code rejects duplicate points and guards recursive subdivision depth', () => {
  for (const id of ['quadtree', 'octree']) {
    const item = getAlgorithm(id);
    const first = String(item.values[0]).split(',');
    const fields = { value: first[0], second: first[1], ...(id === 'octree' ? { index: first[2] } : {}) };
    assert.equal(run(id, 'tree-add', fields).ok, false, `${id} simulator rejects a duplicate`);
    const java = getBeginnerJava(item, 'tree-add');
    const cpp = getBeginnerCpp(item, 'tree-add');
    assert.match(java, /if \(contains\(node, point\)\) return false;/);
    assert.match(java, /if \(depth >= 8\) return false;/);
    assert.match(cpp, /if \(contains\(root, point\)\) return false;/);
    assert.match(cpp, /if \(depth >= MAX_DEPTH\) return false;/);
  }
});

test('Hanoi refuses a second solve after all disks have moved to tower C', () => {
  const created = run('hanoi', 'hanoi-set', { value: '3' });
  const solved = run('hanoi', 'hanoi-solve', {}, created.values);
  const repeated = run('hanoi', 'hanoi-solve', {}, solved.values);
  assert.equal(solved.ok, true);
  assert.ok(solved.values.every(disk => disk.rod === 2));
  assert.equal(repeated.ok, false);
  assert.match(repeated.message, /ya se ejecutó/);
  const code = getBeginnerCpp(getAlgorithm('hanoi'), 'hanoi-solve');
  assert.match(code, /sourceSize != diskCount \|\| auxiliarySize != 0 \|\| targetSize != 0/);
  const firstCppMove = solved.frames.find(frame => frame.codeLanguage === 'cpp' && frame.hanoiState?.phase === 'move');
  const firstCppVariables = Object.fromEntries(firstCppMove.variables.map(variable => [variable.name, variable.value]));
  assert.equal(firstCppVariables.amount, 1);
  assert.equal(firstCppVariables.from, 'int[] (torre A)');
  assert.equal(firstCppVariables.fromSize, 2);
  assert.equal(firstCppVariables.to, 'int[] (torre C)');
  assert.equal(firstCppVariables.toSize, 1);
  assert.equal(firstCppVariables.helpSize, 0);
  const cppReturn = solved.frames.find(frame => frame.codeLanguage === 'cpp' && frame.codeNeedle === 'return true;');
  assert.deepEqual(Object.fromEntries(cppReturn.variables.map(variable => [variable.name, variable.value])), {
    diskCount: 3, sourceSize: 0, auxiliarySize: 0, targetSize: 3,
  });
  const repeatedGuard = repeated.frames.find(frame => frame.codeLanguage === 'cpp');
  assert.deepEqual(Object.fromEntries(repeatedGuard.variables.map(variable => [variable.name, variable.value])), {
    diskCount: 3, sourceSize: 0, auxiliarySize: 0, targetSize: 3,
  });
  for (const frames of [solved.frames, repeated.frames]) {
    const cppFrames = frames.filter(frame => frame.codeLanguage === 'cpp');
    assert.ok(cppFrames.length > 0);
    assert.ok(adaptFramesToCode(cppFrames, code, true).every(frame => !frame.codeUnmapped));
  }
});

test('Prim, Kruskal, and dense matrix operation frames all map to executable C++ lines', () => {
  const cases = [
    ['prim', 'prim-run', { value: 'A' }],
    ['kruskal', 'kruskal-run', {}],
  ];
  for (const [id, actionId, fields] of cases) {
    const item = getAlgorithm(id);
    const result = executeOperation({ algorithm: item, actionId, fields, values: item.values, edges: DEFAULT_GRAPH_EDGES, initialValues: item.values, initialEdges: DEFAULT_GRAPH_EDGES });
    const code = getBeginnerCpp(item, actionId);
    const mapped = result.frames.map(frame => ({ ...frame, codeNeedle: cppCodeNeedle(id, actionId, frame) ?? frame.codeNeedle }));
    assert.ok(mapped.length > 0);
    assert.ok(adaptFramesToCode(mapped, code, true).every(frame => !frame.codeUnmapped), id);
  }

  const matrix = getAlgorithm('matriz');
  const operations = [
    ['matrix-set', { second: '0', index: '0', value: '9' }],
    ['matrix-get', { second: '0', index: '0' }],
    ['matrix-row', { second: '1' }],
    ['matrix-column', { index: '2' }],
    ['matrix-transpose', {}],
    ['matrix-fill', { value: '4' }],
    ['matrix-clear', {}],
  ];
  for (const [actionId, fields] of operations) {
    const result = executeOperation({ algorithm: matrix, actionId, fields, values: matrix.values, edges: [], initialValues: matrix.values, initialEdges: [] });
    const code = getBeginnerCpp(matrix, actionId);
    const mapped = result.frames.map(frame => ({ ...frame, codeNeedle: cppCodeNeedle('matriz', actionId, frame) ?? frame.codeNeedle }));
    assert.ok(adaptFramesToCode(mapped, code, true).every(frame => !frame.codeUnmapped), actionId);
  }
  assert.match(getBeginnerCpp(matrix, 'matrix-clear'), /void clear\(\) \{\s*fill\(0\);/);
});

test('linked-list animation resolves equivalent integer spellings to the same node', () => {
  const item = getAlgorithm('lista-simple');
  const beforeValues = [1, 2, 3];
  const afterValues = [1, 3];
  for (const value of ['02', '2.0', '2e0']) {
    const frames = createLinkedListSynchronizedFrames({
      algorithm: item,
      code: getBeginnerJava(item, 'remove-value'),
      codeMode: 'java',
      actionId: 'remove-value',
      beforeValues,
      afterValues,
      beforeEdges: [],
      afterEdges: [],
      finalStep: 1,
      finalMessage: '2 eliminado',
      inputValues: { value },
    });
    assert.ok(frames.some(frame => frame.message.includes('Compara 2 con') && frame.message.endsWith('true.')), value);
    assert.ok(frames.some(frame => frame.values.length === 2), value);
    assert.ok(frames.every(frame => frame.codeLine !== null), value);
  }
});

test('open-addressing hash search highlights probe slots, not compact value indexes', () => {
  const item = getAlgorithm('hash-open');
  const hashTable = createOpenAddressingTable(item.values).snapshot();
  const frames = createCodeSynchronizedFrames({
    algorithm: { ...item, hashTable },
    code: getBeginnerJava(item, 'find'),
    actionId: 'find',
    beforeValues: item.values,
    afterValues: item.values,
    beforeEdges: [],
    afterEdges: [],
    finalStep: 0,
    finalMessage: 'Encontrado',
    succeeded: true,
    inputValues: { value: String(item.values.at(-1)) },
  });
  assert.ok(frames.length > 1);
  assert.ok(frames.every(frame => Number.isInteger(frame.hashProbePosition)));
  assert.ok(frames.every(frame => frame.hashProbePosition >= 0 && frame.hashProbePosition < hashTable.length));
  const visualizer = readFileSync(new URL('../../src/components/Visualizer.jsx', import.meta.url), 'utf8');
  assert.match(visualizer, /index === frame\.hashProbePosition/);
});

test('polynomial no-op edits preserve C; a real removal clears it only in the final frame', () => {
  const sum = run('polinomios', 'poly-add', {});
  const cBefore = sum.values.filter(term => term.polynomial === 'C');
  assert.ok(cBefore.length > 0);

  const zeroInsert = run('polinomios', 'poly-insert-a', { value: '0', index: '50' }, sum.values);
  assert.deepEqual(zeroInsert.values.filter(term => term.polynomial === 'C'), cBefore);
  assert.equal(zeroInsert.frames.at(-1).polynomialState.resultCount, cBefore.length);

  const missingRemove = run('polinomios', 'poly-remove-a', { index: '50' }, sum.values);
  assert.equal(missingRemove.ok, false);
  assert.deepEqual(missingRemove.values, sum.values);
  assert.equal(missingRemove.frames.length, 2);

  const foundExponent = sum.values.find(term => term.polynomial === 'A').exponent;
  const removal = run('polinomios', 'poly-remove-a', { index: String(foundExponent) }, sum.values);
  assert.deepEqual(removal.frames.at(-2).values.filter(term => term.polynomial === 'C'), cBefore);
  assert.deepEqual(removal.frames.at(-1).values.filter(term => term.polynomial === 'C'), []);
  assert.match(getBeginnerJava(getAlgorithm('polinomios'), 'poly-remove-a'), /containsExponent\(A, exponent\)/);
  assert.match(getBeginnerCpp(getAlgorithm('polinomios'), 'poly-remove-a'), /containsExponent\(A, exponent\)/);
});

test('Splay duplicate insert and missing remove both keep the access-induced root change', () => {
  const before = [10, 5, 15];
  const duplicate = run('splay-tree', 'tree-add', { value: '5' }, before);
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.values[0], 5);
  assert.equal(duplicate.values.filter(value => value !== undefined).length, 3);
  assert.match(duplicate.message, /no existe|ya existe/);

  const missing = run('splay-tree', 'remove-value', { value: '7' }, before);
  assert.equal(missing.ok, true);
  assert.equal(missing.values[0], 5);
  assert.match(missing.message, /no existe.*splay/);
});

test('B+ split frame shows the leaf split before separator promotion', () => {
  const item = getAlgorithm('bplus-tree');
  const values = [1, 2, 3];
  const multiwayTree = createMultiwayTree(item.id, values).snapshot();
  const result = executeOperation({ algorithm: item, actionId: 'sorted-add', fields: { value: '4' }, values, edges: [], initialValues: values, initialEdges: [], multiwayTree });
  const split = result.frames.find(frame => frame.treePhase === 'split');
  const promote = result.frames.find(frame => frame.treePhase === 'promote');
  const settled = result.frames.find(frame => frame.treePhase === 'settled');
  assert.deepEqual(split.multiwayTree.root.keys, []);
  assert.equal(split.multiwayTree.root.children.length, 2);
  assert.deepEqual(promote.multiwayTree.root.keys, [3]);
  assert.deepEqual(settled.multiwayTree, result.multiwayTree);

  const largerValues = Array.from({ length: 15 }, (_, index) => index + 1);
  const largerTree = createMultiwayTree(item.id, largerValues).snapshot();
  const cascading = executeOperation({
    algorithm: item,
    actionId: 'sorted-add',
    fields: { value: '25' },
    values: largerValues,
    edges: [],
    initialValues: largerValues,
    initialEdges: [],
    multiwayTree: largerTree,
  });
  const cascadingSplit = cascading.frames.find(frame => frame.treePhase === 'split');
  assert.notDeepEqual(cascadingSplit.multiwayTree.root, cascading.multiwayTree.root);
  assert.deepEqual(cascading.frames.find(frame => frame.treePhase === 'settled').multiwayTree, cascading.multiwayTree);
});

test('Trie search frames preserve existing terminal markers and insert frames reveal only allocated prefixes', () => {
  const item = getAlgorithm('trie');
  const inserted = run('trie', 'set-word', { value: 'CAR' });
  assert.equal(inserted.ok, true);
  assert.ok(inserted.frames.every(frame => frame.trieState?.mode === 'insert'));
  assert.ok(inserted.frames.filter(frame => frame.codeNeedle === 'if (current.children[letter] == null) {')
    .every(frame => frame.trieState.createdThrough < frame.trieState.revealed));

  const searched = run('trie', 'word-find', { value: 'CASA' }, item.values);
  assert.ok(searched.frames.every(frame => frame.trieState?.mode === 'search'));
  assert.equal(searched.frames.at(-1).trieState.marked, true);
  const visualizer = readFileSync(new URL('../../src/components/Visualizer.jsx', import.meta.url), 'utf8');
  assert.match(visualizer, /if \(words\.includes\(word\) \|\| \(trieState\?\.mode === 'insert'.*trieState\.marked\)\)/);
});

test('operation code uses a stable live snapshot and ignores stale async imports', () => {
  const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /codeContextAlgorithm \?\? baseAlgorithm/);
  assert.match(app, /setCodeContextAlgorithm\(codeAlgorithm\)/);
  assert.match(app, /const requestId = \+\+operationRequestRef\.current/);
  assert.match(app, /if \(requestId !== operationRequestRef\.current\) return;/);
  assert.match(app, /operationRequestRef\.current \+= 1;[\s\S]{0,160}setSelectedId\(nextAlgorithm\.id\)/);
});

test('generated Hanoi, spatial, and dense-clear snippets compile and enforce their guards', {
  skip: !compilerAvailable('g++') || !compilerAvailable('javac'),
}, () => {
  const directory = mkdtempSync(join(tmpdir(), 'dsa-audit-fixes-'));
  const compileAndRun = (name, source) => {
    const file = join(directory, `${name}.cpp`);
    const binary = join(directory, `${name}.exe`);
    writeFileSync(file, source);
    const compiled = spawnSync('g++', ['-std=c++17', file, '-o', binary], { encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.equal(compiled.status, 0, compiled.error?.message ?? compiled.stderr);
    const executed = spawnSync(binary, [], { encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.equal(executed.status, 0, executed.error?.message ?? executed.stderr);
  };
  const compileJava = (name, source) => {
    const file = join(directory, `${name}.java`);
    writeFileSync(file, source);
    const compiled = spawnSync('javac', ['-d', directory, file], { encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.equal(compiled.status, 0, compiled.error?.message ?? compiled.stderr);
  };
  try {
    compileAndRun('hanoi', `#include <cassert>\n${getBeginnerCpp(getAlgorithm('hanoi'), 'hanoi-solve')}\nint main() { TowersOfHanoi towers(3); assert(towers.solve()); assert(!towers.solve()); }`);
    compileAndRun('quadtree', `#include <cassert>\n${getBeginnerCpp(getAlgorithm('quadtree'), 'tree-add')}\nint main() { QuadTree tree; QuadTree::Point existing{-55, -45}; assert(!tree.insert(existing)); QuadTree::Point point{-54, -44}; assert(tree.insert(point)); assert(!tree.insert(point)); }`);
    compileAndRun('matrix-clear', `#include <cassert>\n${getBeginnerCpp(getAlgorithm('matriz'), 'matrix-clear')}\nint main() { DenseMatrix matrix(2); matrix.values[1][1] = 9; matrix.clear(); assert(matrix.values[1][1] == 0); }`);
    compileJava('QuadTree', getBeginnerJava(getAlgorithm('quadtree'), 'tree-add'));
    compileJava('Octree', getBeginnerJava(getAlgorithm('octree'), 'tree-add'));
    compileJava('LinkedPolynomial', getBeginnerJava(getAlgorithm('polinomios'), 'poly-remove-a'));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
