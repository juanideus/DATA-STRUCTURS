import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { initialUnionRanks } from '../../src/logic/operationMetadata.js';
import { getOtherCpp } from '../../src/data/otherCpp.js';
import { getSpecializedJava } from '../../src/data/specializedJava.js';

const available = command => spawnSync(command, ['--version'], { encoding: 'utf8' }).status === 0;
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `${command} failed: ${result.stderr || result.stdout || result.error}`);
};

test('LRU examples start from the same keys as the catalog', () => {
  assert.deepEqual(algorithms.find(item => item.id === 'lru-cache').values, ['A', 'D', 'B', 'F', 'C']);
});

test('C++ Union-Find constructor and reset restore the visual example', { skip: !available('g++') }, () => {
  const initial = algorithms.find(item => item.id === 'union-find').values;
  assert.deepEqual(initial, [0, 0, 2, 2, 4, 4, 6, 6]);
  assert.deepEqual(initialUnionRanks(initial), [1, 0, 1, 0, 1, 0, 1, 0]);
  const directory = mkdtempSync(path.join(tmpdir(), 'dsa-union-cpp-'));
  try {
    writeFileSync(path.join(directory, 'main.cpp'), `#include <cassert>\n${getOtherCpp('union-find', 'reset')}\nint main() {
      UnionFind sets; assert(sets.size == 8);
      for (int i = 0; i < sets.size; i++) {
        assert(sets.parent[i] == i - i % 2); assert(sets.rank[i] == (i % 2 == 0 ? 1 : 0));
      }
      sets.parent[1] = 7; sets.rank[0] = 5; sets.size = 2; sets.reset();
      assert(sets.size == 8);
      for (int i = 0; i < sets.size; i++) {
        assert(sets.parent[i] == i - i % 2); assert(sets.rank[i] == (i % 2 == 0 ? 1 : 0));
      }
    }`);
    run('g++', ['-std=c++17', 'main.cpp', '-o', 'example-test'], directory);
    run(path.join(directory, process.platform === 'win32' ? 'example-test.exe' : 'example-test'), [], directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('C++ examples reject empty Bloom keys and initialize LRU like the visual example', { skip: !available('g++') }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'dsa-cache-cpp-'));
  try {
    writeFileSync(path.join(directory, 'main.cpp'), `#include <cassert>\n${getOtherCpp('bloom-filter', 'bloom-add')}\n${getOtherCpp('lru-cache', 'cache-get')}\nint main() {
      BloomFilter filter; bool rejected = false;
      try { filter.add(""); } catch (const std::invalid_argument&) { rejected = true; }
      assert(rejected); filter.add("abc"); assert(filter.bits[(3 * 3 + 'a') % 12]);
      LRUCache cache; std::string value; assert(cache.size == 5);
      assert(cache.head->key == "A" && cache.tail->key == "C");
      assert(cache.get("A", value) && value == "A");
      assert(cache.head->key == "D" && cache.tail->key == "A");
    }`);
    run('g++', ['-std=c++17', 'main.cpp', '-o', 'example-test'], directory);
    run(path.join(directory, process.platform === 'win32' ? 'example-test.exe' : 'example-test'), [], directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('Java examples reject empty Bloom keys and initialize LRU like the visual example', { skip: !available('javac') || !available('java') }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'dsa-cache-java-'));
  try {
    writeFileSync(path.join(directory, 'Main.java'), `${getSpecializedJava('bloom-filter', 'bloom-add')}\n${getSpecializedJava('lru-cache', 'cache-get')}\nclass Main {
      public static void main(String[] args) {
        BloomFilter filter = new BloomFilter(); boolean rejected = false;
        try { filter.add(""); } catch (IllegalArgumentException expected) { rejected = true; }
        if (!rejected) throw new AssertionError(); filter.add("abc");
        if (!filter.bits[(3 * 3 + 'a') % 12]) throw new AssertionError();
        LRUCache cache = new LRUCache();
        if (cache.cache.size() != 5 || !cache.head.key.equals("A") || !cache.tail.key.equals("C")) throw new AssertionError();
        if (!"A".equals(cache.get("A")) || !cache.head.key.equals("D") || !cache.tail.key.equals("A")) throw new AssertionError();
      }
    }`);
    run('javac', ['Main.java'], directory);
    run('java', ['-cp', directory, 'Main'], directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
