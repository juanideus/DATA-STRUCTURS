import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';

const get = id => algorithms.find(algorithm => algorithm.id === id);
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
  assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`);
};

test('Segment Tree, BST and Splay begin with their visual examples in both languages', { skip: !process.env.DSA_EXAMPLE_CXX || !process.env.DSA_EXAMPLE_JAVA }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsa-initial-examples-'));
  try {
    for (const [id, action, javaClass, javaCheck, cppCheck] of [
      ['segment-tree', 'prefix-sum', 'SegmentTree', 't.prefixSum(1, 0, 6, 6) == 31', 't.prefixSum(1, 0, 6, 6) == 31'],
      ['bst', 'find', 'BinarySearchTree', 't.root.value == 8 && t.root.left.right.value == 5 && t.search(t.root, 12) != null', 't.root->value == 8 && t.root->left->right->value == 5 && t.search(t.root, 12) != nullptr'],
      ['splay-tree', 'find', 'SplayTree', 't.root.value == 10 && t.root.left.right.value == 7 && t.search(10) != null', 't.root->value == 10 && t.root->left->right->value == 7 && t.search(t.root, 10) != nullptr'],
    ]) {
      const algorithm = get(id);
      const java = getBeginnerJava(algorithm, action);
      const javaFile = join(dir, `${javaClass}.java`);
      writeFileSync(javaFile, `${java.slice(0, java.lastIndexOf('}'))}\npublic static void main(String[] args) { ${javaClass} t = new ${javaClass}(); if (!(${javaCheck})) throw new AssertionError(); }\n}\n`);
      run(process.env.DSA_EXAMPLE_JAVA, [javaFile]);
      const cppFile = join(dir, `${id}.cpp`);
      const binary = join(dir, `${id}.exe`);
      writeFileSync(cppFile, `#include <cassert>\n#include <string>\n${getBeginnerCpp(algorithm, action)}\nint main() { ${javaClass} t; assert(${cppCheck}); }\n`);
      run(process.env.DSA_EXAMPLE_CXX, ['-std=c++17', cppFile, '-o', binary]);
      run(binary, []);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
