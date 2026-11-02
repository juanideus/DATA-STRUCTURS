import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { executeOperation } from '../../src/logic/operations.js';

const tree = id => algorithms.find(algorithm => algorithm.id === id);
const runAction = (id, actionId, fields, values) => executeOperation({
  algorithm: tree(id), actionId, fields, values, edges: [], initialValues: tree(id).values,
});

for (const id of ['arbol-general', 'arbol-nario']) {
  test(`${id}: inserting after emptying creates the root and removing the root is rejected`, () => {
    const inserted = runAction(id, 'tree-add', { value: '77', second: '' }, []);
    assert.equal(inserted.ok, true);
    assert.deepEqual(inserted.values, [77]);
    assert.deepEqual(inserted.treeParents, [-1]);
    const rejected = runAction(id, 'remove-value', { value: '77' }, inserted.values);
    assert.equal(rejected.ok, false);
    assert.deepEqual(rejected.values, [77]);
    assert.match(rejected.message, /raíz/);
  });
}

function execute(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30_000, windowsHide: true });
  assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`);
}

for (const id of ['arbol-general', 'arbol-nario']) {
  const name = id === 'arbol-general' ? 'GeneralTree' : 'NaryTree';
  test(`${id}: displayed Java supports empty insertion, rejects a missing parent and preserves the root`, { skip: !process.env.DSA_EXAMPLE_JAVA }, () => {
    for (const action of ['tree-add', 'remove-value']) {
      const directory = mkdtempSync(path.join(tmpdir(), 'dsa-nary-java-'));
      const algorithm = { ...tree(id), values: action === 'tree-add' ? [] : [10, 20, 30] };
      const source = getBeginnerJava(algorithm, action);
      const count = id === 'arbol-general' ? 't.root.children.size()' : 't.root.childCount';
      const body = action === 'tree-add' ? `
        t.addChild(null, 77);
        if (t.root == null || t.root.value != 77) throw new AssertionError("root was not created");
        t.addChild(t.root, 88);
        if (${count} != 1) throw new AssertionError("child was not inserted");
        t.addChild(null, 99);
        if (${count} != 1) throw new AssertionError("missing parent was accepted");
      ` : `
        if (t.root == null || t.root.value != 10 || ${count} != 2) throw new AssertionError("snapshot was not loaded");
        ${name}.Node original = t.root;
        if (t.remove(t.root, 10) || t.root != original || ${count} != 2) throw new AssertionError("root was removed");
        if (t.remove(null, 10)) throw new AssertionError("null parent was accepted");
        if (!t.remove(t.root, 20) || ${count} != 1) throw new AssertionError("ordinary removal failed");
      `;
      writeFileSync(path.join(directory, `${name}.java`), `${source}\nclass Harness { public static void main(String[] args) { ${name} t = new ${name}(); ${body} } }\n`);
      execute(process.env.DSA_EXAMPLE_JAVA, ['-encoding', 'UTF-8', '-d', directory, path.join(directory, `${name}.java`)]);
      execute('java', ['-cp', directory, 'Harness']);
    }
  });

  test(`${id}: displayed C++ supports empty insertion, rejects a missing parent and preserves the root`, { skip: !process.env.DSA_EXAMPLE_CXX }, () => {
    for (const action of ['tree-add', 'remove-value']) {
      const directory = mkdtempSync(path.join(tmpdir(), 'dsa-nary-cpp-'));
      const algorithm = { ...tree(id), values: action === 'tree-add' ? [] : [10, 20, 30] };
      const source = getBeginnerCpp(algorithm, action);
      const body = action === 'tree-add' ? `
        assert(t.addChild(nullptr, 77));
        assert(t.root != nullptr && t.root->value == 77);
        assert(t.addChild(t.root, 88) && t.root->childCount == 1);
        assert(!t.addChild(nullptr, 99) && t.root->childCount == 1);
      ` : `
        assert(t.root != nullptr && t.root->value == 10 && t.root->childCount == 2);
        auto* original = t.root;
        t.root = t.remove(t.root, 10);
        assert(t.root == original && t.root->childCount == 2);
        assert(t.remove(nullptr, 10) == nullptr);
        t.root = t.remove(t.root, 20);
        assert(t.root == original && t.root->childCount == 1);
      `;
      const file = path.join(directory, `${name}.cpp`);
      const executable = path.join(directory, `${name}${process.platform === 'win32' ? '.exe' : ''}`);
      writeFileSync(file, `#include <cassert>\n${source}\nint main() { ${name} t; ${body} }\n`);
      execute(process.env.DSA_EXAMPLE_CXX, ['-std=c++17', '-Wall', '-Wextra', file, '-o', executable]);
      execute(executable, []);
    }
  });
}
