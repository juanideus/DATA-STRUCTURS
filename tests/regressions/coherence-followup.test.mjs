import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../../src/data/algorithms.js';
import { executeOperation } from '../../src/logic/operations.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';

const algorithm = id => algorithms.find(item => item.id === id);
const run = (id, actionId, fields, values = algorithm(id).values) => executeOperation({
  algorithm: algorithm(id), actionId, fields, values, edges: [], initialValues: algorithm(id).values, initialEdges: [],
});

test('suffix trie removes only the first occurrence and retains the rest', () => {
  const result = run('suffix-tree', 'remove-word', { value: 'NA' });
  assert.equal(result.ok, true);
  assert.equal(result.values.join(''), 'BANA');
  assert.match(getBeginnerJava(algorithm('suffix-tree'), 'remove-word'), /boolean removeWord\(String word\)/);
  assert.match(getBeginnerCpp(algorithm('suffix-tree'), 'remove-word'), /bool removeWord\(const std::string& word\)/);
});

test('zero polynomial coefficient stops before scanning', () => {
  const result = run('polinomios', 'poly-insert-a', { value: '0', index: '5' });
  assert.equal(result.ok, true);
  assert.ok(result.frames.some(frame => frame.message.includes('sin recorrer')));
  assert.ok(!result.frames.some(frame => frame.message.includes('se creará un nodo')));
});

test('KD tree restricts encoded coordinates to 00 through 99', () => {
  assert.equal(run('kd-tree', 'tree-add', { value: '123' }).ok, false);
  assert.equal(run('kd-tree', 'find', { value: '-1' }).ok, false);
});

test('unsuccessful splay search retains splay adjustment', () => {
  const result = run('splay-tree', 'find', { value: '7' }, [10, 5, 15]);
  assert.equal(result.ok, true);
  assert.match(result.message, /no fue encontrado/);
  assert.equal(result.values[0], 5);
});

test('suffix removal works in generated Java and C++', { skip: !process.env.DSA_EXAMPLE_CXX || !process.env.DSA_EXAMPLE_JAVA }, () => {
  const directory = mkdtempSync(join(tmpdir(), 'dsa-suffix-'));
  const runCommand = (command, args) => {
    const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`);
  };
  try {
    const item = algorithm('suffix-tree');
    const cppFile = join(directory, 'suffix.cpp');
    const binary = join(directory, 'suffix.exe');
    writeFileSync(cppFile, `#include <string>\n#include <cassert>\n${getBeginnerCpp(item, 'remove-word')}\nint main() { SuffixTrie t; t.text = "BANANA"; assert(t.removeWord("NA")); assert(t.text == "BANA"); assert(!t.removeWord("XYZ")); }`);
    runCommand(process.env.DSA_EXAMPLE_CXX, ['-std=c++17', cppFile, '-o', binary]);
    runCommand(binary, []);
    const java = getBeginnerJava(item, 'remove-word');
    const javaFile = join(directory, 'SuffixTrie.java');
    writeFileSync(javaFile, `${java.slice(0, java.lastIndexOf('}'))}\npublic static void main(String[] args) { SuffixTrie t = new SuffixTrie(); t.text = "BANANA"; if (!t.removeWord("NA") || !t.text.equals("BANA") || t.removeWord("XYZ")) throw new AssertionError(); }\n}\n`);
    runCommand(process.env.DSA_EXAMPLE_JAVA, [javaFile]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
