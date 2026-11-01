import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { hashExampleBuckets, hashExampleSlots } from '../../src/data/hashExamples.js';

const getAlgorithm = id => algorithms.find(item => item.id === id);
const available = command => spawnSync(command, ['--version'], { encoding: 'utf8', windowsHide: true }).status === 0;
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  assert.equal(result.status, 0, `${command}: ${result.error?.message ?? result.stderr ?? result.stdout}`);
};

test('hash generators preload exactly the visual slots and bucket chains', () => {
  for (const id of ['hash-table', 'hash-open']) {
    const item = getAlgorithm(id);
    const slots = hashExampleSlots(item.values);
    const java = getBeginnerJava(item, 'find');
    const cpp = getBeginnerCpp(item, 'find');
    slots.forEach((slot, index) => {
      if (slot.state !== 'occupied') return;
      const value = JSON.stringify(String(slot.entry));
      assert.ok(java.includes(`keys[${index}] = ${value};`), `${id} Java slot ${index}`);
      assert.ok(cpp.includes(`keys[${index}] = ${value};`), `${id} C++ slot ${index}`);
    });
  }
  const item = getAlgorithm('hash-chaining');
  const buckets = hashExampleBuckets(item.values);
  const java = getBeginnerJava(item, 'find');
  const cpp = getBeginnerCpp(item, 'find');
  for (const [index, bucket] of buckets.entries()) for (const node of bucket) {
    const prefix = `buckets[${index}] = new Node(${JSON.stringify(node.key)}, ${JSON.stringify(node.value)}, buckets[${index}])`;
    assert.ok(java.includes(prefix));
    assert.ok(cpp.includes(prefix));
  }
});

test('Bloom initializes the visual bits and rejects non-ASCII in generated Java and C++', { skip: !available('g++') || !available('javac') || !available('java') }, () => {
  const directory = mkdtempSync(join(tmpdir(), 'dsa-bloom-alignment-'));
  try {
    const item = getAlgorithm('bloom-filter');
    const cpp = getBeginnerCpp(item, 'bloom-check');
    writeFileSync(join(directory, 'main.cpp'), `#include <cassert>\n${cpp}\nint main() { BloomFilter b; assert(b.possiblyContains("AAA")); std::string word; word.push_back(char(0xc3)); word.push_back(char(0xa9)); bool rejected=false; try { b.possiblyContains(word); } catch (const std::invalid_argument&) { rejected=true; } assert(rejected); }`);
    run('g++', ['-std=c++17', 'main.cpp', '-o', 'example'], directory);
    run(join(directory, process.platform === 'win32' ? 'example.exe' : 'example'), [], directory);
    const java = getBeginnerJava(item, 'bloom-check');
    writeFileSync(join(directory, 'Main.java'), `${java}\nclass Main { public static void main(String[] args) { BloomFilter b = new BloomFilter(); if (!b.mightContain("AAA")) throw new AssertionError(); try { b.mightContain(String.valueOf((char)233)); throw new AssertionError(); } catch (IllegalArgumentException expected) {} } }`);
    run('javac', ['-encoding', 'UTF-8', 'Main.java'], directory);
    run('java', ['-cp', directory, 'Main'], directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('generated hash examples find the same initially displayed keys in Java and C++', { skip: !available('g++') || !available('javac') || !available('java') }, () => {
  const directory = mkdtempSync(join(tmpdir(), 'dsa-hash-alignment-'));
  try {
    for (const id of ['hash-table', 'hash-open', 'hash-chaining']) {
      const item = getAlgorithm(id);
      const expected = String(item.values[0]);
      const cpp = getBeginnerCpp(item, 'find');
      const cppClass = id === 'hash-chaining' ? 'SeparateChainingTable' : 'OpenAddressingTable';
      writeFileSync(join(directory, 'main.cpp'), `#include <string>\n#include <cassert>\n${cpp}\nint main() { ${cppClass} table; std::string value; assert(table.size == ${item.values.length}); assert(table.find(${JSON.stringify(expected)}, value)); assert(value == ${JSON.stringify(expected)}); assert(!table.find("missing", value)); }`);
      run('g++', ['-std=c++17', 'main.cpp', '-o', 'example'], directory);
      run(join(directory, process.platform === 'win32' ? 'example.exe' : 'example'), [], directory);
      const java = getBeginnerJava(item, 'find');
      const javaClass = id === 'hash-table' ? 'HashTable' : cppClass;
      writeFileSync(join(directory, 'Main.java'), `${java}\nclass Main { public static void main(String[] args) { ${javaClass} table = new ${javaClass}(); if (table.size != ${item.values.length} || !${JSON.stringify(expected)}.equals(table.get(${JSON.stringify(expected)})) || table.get("missing") != null) throw new AssertionError(); } }`);
      run('javac', ['-encoding', 'UTF-8', 'Main.java'], directory);
      run('java', ['-cp', directory, 'Main'], directory);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
