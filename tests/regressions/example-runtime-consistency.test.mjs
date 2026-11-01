import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { executeEducationalSort } from '../../src/logic/sortingAlgorithms.js';
import { cppCodeNeedle } from '../../src/logic/cppCodeNeedles.js';

const algorithm = id => algorithms.find(item => item.id === id);

test('C++ sorting and Fenwick examples initialize the visual example dynamically', () => {
  for (const id of ['bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort', 'shell-sort', 'heap-sort', 'counting-sort', 'radix-sort', 'bogo-sort', 'fenwick-tree']) {
    const item = algorithm(id);
    const source = getBeginnerCpp(item, id === 'fenwick-tree' ? 'prefix-sum' : 'sort');
    item.values.forEach((value, index) => assert.ok(source.includes(`values[${index}] = initialValues[${index}] = ${value};`), `${id}: missing initial value ${index}`));
    assert.ok(source.includes(`size = initialSize = ${item.values.length};`), id);
    if (id === 'fenwick-tree') assert.match(source, /bit\[index\] \+= values\[i\]/);
  }
});

test('Bogo Sort examples and trace share size and attempt limits', () => {
  const item = algorithm('bogo-sort');
  const java = getBeginnerJava(item, 'sort');
  const cpp = getBeginnerCpp(item, 'sort');
  assert.match(java, /size > 7/);
  assert.match(java, /attempts < 250000/);
  assert.match(cpp, /size > 7/);
  assert.match(cpp, /MAX_ATTEMPTS = 250000/);
  const run = executeEducationalSort('bogo-sort', [3, 1, 2], []);
  assert.equal(run.ok, true);
  for (const frame of run.frames.filter(frame => ['bogo-start', 'bogo-check', 'bogo-attempt'].includes(frame.sortPhase))) {
    assert.ok(java.includes(frame.codeNeedle), `Java: ${frame.codeNeedle}`);
    const needle = cppCodeNeedle('bogo-sort', 'sort', frame) ?? frame.codeNeedle;
    assert.ok(cpp.includes(needle), `C++: ${needle}`);
  }
  assert.equal(executeEducationalSort('bogo-sort', [8,7,6,5,4,3,2,1], []).ok, false);
});

test('factorial examples reject values outside the simulator range', () => {
  const item = algorithm('factorial');
  const java = getBeginnerJava(item, 'calculate');
  const cpp = getBeginnerCpp(item, 'calculate');
  assert.match(java, /if \(number < 0 \|\| number > 10\) throw new IllegalArgumentException/);
  assert.match(cpp, /if \(number < 0 \|\| number > 10\) throw std::invalid_argument/);
  assert.match(java, /int factorial\(int number\)/);
  assert.match(cpp, /int factorial\(int number\)/);
});

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
  assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`);
}

test('generated C++ examples compile and enforce their contracts', { skip: !process.env.DSA_EXAMPLE_CXX }, () => {
  const directory = mkdtempSync(join(tmpdir(), 'dsa-example-cpp-'));
  try {
    for (const [id, action, main] of [
      ['factorial', 'calculate', `int main() { RecursiveCalculation r; assert(r.factorial(10) == 3628800); bool failed = false; try { r.factorial(-1); } catch (const std::invalid_argument&) { failed = true; } assert(failed); failed = false; try { r.factorial(13); } catch (const std::invalid_argument&) { failed = true; } assert(failed); }`],
      ['bogo-sort', 'sort', `int main() { RawArraySorter s; assert(s.size == 4 && s.values[0] == 3); s.size = 8; assert(!s.sort()); s.size = 4; for (int i = 0; i < 4; i++) s.values[i] = i; assert(s.sort()); }`],
      ['fenwick-tree', 'prefix-sum', `int main() { FenwickTree t; assert(t.size == 8 && t.prefixSum(7) == 30); }`],
    ]) {
      const file = join(directory, `${id}.cpp`);
      const binary = join(directory, `${id}.exe`);
      writeFileSync(file, `#include <cassert>\n${getBeginnerCpp(algorithm(id), action)}\n${main}\n`);
      run(process.env.DSA_EXAMPLE_CXX, ['-std=c++17', file, '-o', binary]);
      run(binary, []);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('generated Java examples compile and enforce their contracts', { skip: !process.env.DSA_EXAMPLE_JAVA }, () => {
  const directory = mkdtempSync(join(tmpdir(), 'dsa-example-java-'));
  try {
    for (const [id, name, action, main] of [
      ['factorial', 'Factorial', 'calculate', `public static void main(String[] args) { Factorial f = new Factorial(); if (f.factorial(10) != 3628800) throw new AssertionError(); for (int n : new int[]{-1, 13}) { try { f.factorial(n); throw new AssertionError(); } catch (IllegalArgumentException expected) {} } }`],
      ['bogo-sort', 'BogoSort', 'sort', `public static void main(String[] args) { BogoSort s = new BogoSort(); if (s.size != 4 || s.values[0] != 3) throw new AssertionError(); s.size = 8; if (s.bogoSort()) throw new AssertionError(); s.size = 4; for (int i = 0; i < 4; i++) s.values[i] = i; if (!s.bogoSort()) throw new AssertionError(); }`],
      ['union-find', 'UnionFind', 'reset', `public static void main(String[] args) { UnionFind u = new UnionFind(); u.parent[1] = 1; u.rank[0] = 0; u.resetSets(); int[] expected = {0, 0, 2, 2, 4, 4, 6, 6}; for (int i = 0; i < expected.length; i++) { if (u.parent[i] != expected[i] || u.rank[i] != (i % 2 == 0 ? 1 : 0)) throw new AssertionError(); } }`],
    ]) {
      const source = getBeginnerJava(algorithm(id), action);
      const file = join(directory, `${name}.java`);
      writeFileSync(file, `${source.slice(0, source.lastIndexOf('}'))}\n${main}\n}\n`);
      run(process.env.DSA_EXAMPLE_JAVA, [file]);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
