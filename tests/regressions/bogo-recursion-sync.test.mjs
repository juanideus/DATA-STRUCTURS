import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { executeEducationalSort } from '../../src/logic/sortingAlgorithms.js';
import { cppCodeNeedle } from '../../src/logic/cppCodeNeedles.js';
import { createRecursionCallTrace } from '../../src/logic/recursionTrace.js';
import { adaptFramesToCode } from '../../src/logic/codeAnimation.js';

const bogo = algorithms.find(item => item.id === 'bogo-sort');
const factorial = algorithms.find(item => item.id === 'factorial');

test('Bogo displayed Java and C++ match all displayed random trace lines', () => {
  const result = executeEducationalSort('bogo-sort', [3, 1, 4, 2], []);
  assert.equal(result.ok, true);
  const java = getBeginnerJava(bogo, 'sort');
  const cpp = getBeginnerCpp(bogo, 'sort');
  for (const frame of result.frames.filter(frame => frame.sortPhase?.startsWith('bogo-'))) {
    assert.ok(java.includes(frame.codeNeedle), `Java lacks ${frame.codeNeedle}`);
    const needle = cppCodeNeedle(bogo.id, 'sort', frame) ?? frame.codeNeedle;
    assert.ok(cpp.includes(needle), `C++ lacks ${needle}`);
  }
  const notSorted = result.frames.find(frame => frame.sortPhase === 'bogo-not-sorted');
  const mapped = { ...notSorted, codeNeedle: cppCodeNeedle(bogo.id, 'sort', notSorted) };
  const [resolved] = adaptFramesToCode([mapped], cpp, true);
  assert.match(cpp.split('\n')[resolved.codeLine], /if \(values\[i - 1\] > values\[i\]\) return false;/);
});

test('Factorial traces its validation in each recursive call', () => {
  const trace = createRecursionCallTrace({ kind: 'factorial', number: 2, beforeValues: [], edges: [] });
  const checks = trace.frames.filter(frame => frame.recursionTree.phase === 'check-range');
  assert.equal(checks.length, 2);
  for (const source of [getBeginnerJava(factorial, 'calculate'), getBeginnerCpp(factorial, 'calculate')]) {
    assert.ok(checks.every(frame => source.includes(frame.codeNeedle)));
  }
});

test('Bogo native Java and C++ first shuffle equals the simulated trace', { skip: !process.env.DSA_EXAMPLE_CXX || !process.env.DSA_EXAMPLE_JAVA }, () => {
  const values = [3, 1, 4, 2];
  const trace = executeEducationalSort('bogo-sort', values, []);
  const firstShuffle = trace.frames.filter(frame => frame.sortPhase === 'bogo-swap-complete' && frame.sortAttempt === 1).at(-1).values;
  const expected = firstShuffle.join(',');
  const dir = mkdtempSync(join(tmpdir(), 'dsa-bogo-sync-'));
  const run = (command, args) => {
    const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`);
    return result.stdout.trim();
  };
  try {
    const cppFile = join(dir, 'bogo.cpp');
    const binary = join(dir, 'bogo.exe');
    const cpp = getBeginnerCpp(bogo, 'sort');
    writeFileSync(cppFile, `#include <iostream>\n${cpp}\nint main() { RawArraySorter s; unsigned int state = 2166136261u; for (int i = 0; i < s.size; ++i) state += static_cast<unsigned int>(s.values[i]) * static_cast<unsigned int>(i + 3); s.shuffle(state); for (int i = 0; i < s.size; ++i) { if (i) std::cout << ','; std::cout << s.values[i]; } }`);
    run(process.env.DSA_EXAMPLE_CXX, ['-std=c++17', cppFile, '-o', binary]);
    assert.equal(run(binary, []), expected);

    const java = getBeginnerJava(bogo, 'sort');
    const javaFile = join(dir, 'BogoSort.java');
    const main = `public static void main(String[] args) { BogoSort s = new BogoSort(); long[] state = {2166136261L}; for (int i = 0; i < s.size; ++i) state[0] = (state[0] + (long) s.values[i] * (i + 3)) & 0xffffffffL; s.shuffle(state); for (int i = 0; i < s.size; ++i) { if (i > 0) System.out.print(","); System.out.print(s.values[i]); } }`;
    writeFileSync(javaFile, `${java.slice(0, java.lastIndexOf('}'))}\n${main}\n}\n`);
    run(process.env.DSA_EXAMPLE_JAVA, [javaFile]);
    assert.equal(run('java', ['-cp', dir, 'BogoSort']), expected);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
