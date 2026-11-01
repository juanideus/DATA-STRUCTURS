import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';

const algorithm = algorithms.find(item => item.id === 'suffix-tree');

test('suffix examples use the visual initial text for every operation', () => {
  for (const action of ['set-word', 'word-find', 'remove-word', 'clear']) {
    assert.match(getBeginnerJava(algorithm, action), /text = "BANANA";/, `Java ${action}`);
    assert.match(getBeginnerCpp(algorithm, action), /SuffixTrie\(\) : text\("BANANA"\)/, `C++ ${action}`);
  }
});

test('suffix examples build and modify the actual initial trie', { skip: !process.env.DSA_EXAMPLE_CXX || !process.env.DSA_EXAMPLE_JAVA }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsa-suffix-init-'));
  const run = (command, args) => {
    const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`);
  };
  try {
    for (const [action, cppMain, javaMain] of [
      ['set-word', 'auto* originalRoot = t.root; t.buildSuffixTrie("banana"); assert(t.text == "BANANA" && t.root == originalRoot); t.buildSuffixTrie("ORANGE"); assert(t.text == "ORANGE" && t.root != nullptr);', 'Node originalRoot = t.root; t.buildSuffixTrie("banana"); if (!t.text.equals("BANANA") || t.root != originalRoot) throw new AssertionError(); t.buildSuffixTrie("ORANGE"); if (!t.text.equals("ORANGE") || t.root == null) throw new AssertionError();'],
      ['word-find', 'assert(!t.contains("") && !t.contains("ana") && !t.contains("A1"));', 'if (t.contains("") || t.contains("ana") || t.contains("A1")) throw new AssertionError();'],
      ['word-find', 'assert(t.contains("ANA")); assert(!t.contains("XYZ"));', 'if (!t.contains("ANA") || t.contains("XYZ")) throw new AssertionError();'],
      ['remove-word', 'assert(t.removeWord("NA")); assert(t.text == "BANA");', 'if (!t.removeWord("NA") || !t.text.equals("BANA")) throw new AssertionError();'],
    ]) {
      const cpp = join(dir, `${action}.cpp`);
      const executable = join(dir, `${action}.exe`);
      writeFileSync(cpp, `#include <cassert>\n${getBeginnerCpp(algorithm, action)}\nint main() { SuffixTrie t; ${cppMain} }\n`);
      run(process.env.DSA_EXAMPLE_CXX, ['-std=c++17', cpp, '-o', executable]);
      run(executable, []);
      const java = getBeginnerJava(algorithm, action);
      const file = join(dir, 'SuffixTrie.java');
      writeFileSync(file, `${java.slice(0, java.lastIndexOf('}'))}\npublic static void main(String[] args) { SuffixTrie t = new SuffixTrie(); ${javaMain} }\n}\n`);
      run(process.env.DSA_EXAMPLE_JAVA, [file]);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
