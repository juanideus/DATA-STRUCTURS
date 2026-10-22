import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getPolynomialJava } from '../src/data/polynomialJava.js';
import { getPolynomialCpp } from '../src/data/polynomialCpp.js';
import { getGeneralizedListJava } from '../src/data/generalizedListJava.js';
import { getGeneralizedListCpp } from '../src/data/generalizedListCpp.js';
import { getHanoiCpp } from '../src/data/hanoiCpp.js';
import { getBacktrackingCpp } from '../src/data/backtrackingCpp.js';

const directory = await mkdtemp(path.join(tmpdir(), 'dsa-state-coherence-'));
const command = (name, args) => {
  const result = spawnSync(name, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
  assert.equal(result.status, 0, `${name}: ${result.error?.message ?? ''}\n${result.stderr}\n${result.stdout}`);
};
const cpp = async (name, source, body) => {
  const sourcePath = path.join(directory, `${name}.cpp`);
  const executable = path.join(directory, `${name}.exe`);
  await writeFile(sourcePath, `#include <cassert>\n#include <string>\n${source}\nint main() { ${body} }\n`);
  command('g++', ['-std=c++17', '-Wall', '-Wextra', '-pedantic', sourcePath, '-o', executable]);
  command(executable, []);
};
const java = async (name, source, body) => {
  const folder = path.join(directory, name);
  await mkdir(folder);
  const sourcePath = path.join(folder, `${name}.java`);
  await writeFile(sourcePath, `${source}\npublic class ${name} { public static void main(String[] args) { ${body} } }\n`);
  command('javac', ['-encoding', 'UTF-8', '-d', folder, sourcePath]);
  command('java', ['-ea', '-cp', folder, name]);
};

await java('PolynomialInsert', getPolynomialJava('poly-insert-a'), `
  LinkedPolynomial p = new LinkedPolynomial();
  p.C = new LinkedPolynomial.Node(7, 0);
  LinkedPolynomial.Node prior = p.C;
  try { p.insertInA(Integer.MAX_VALUE, 14); throw new AssertionError("overflow accepted"); }
  catch (IllegalArgumentException expected) { }
  assert p.A.coefficient == 3 && p.C == prior;
  p.A.coefficient = Integer.MIN_VALUE;
  try { p.insertInA(-1, 14); throw new AssertionError("underflow accepted"); }
  catch (IllegalArgumentException expected) { }
  assert p.A.coefficient == Integer.MIN_VALUE && p.C == prior;
  p.insertInA(Integer.MIN_VALUE, 2);
  assert p.C == null;
`);
await java('PolynomialSum', getPolynomialJava('poly-add'), `
  LinkedPolynomial p = new LinkedPolynomial();
  p.A.coefficient = Integer.MAX_VALUE;
  p.C = new LinkedPolynomial.Node(7, 0);
  LinkedPolynomial.Node prior = p.C;
  try { p.sumPolynomials(); throw new AssertionError("overflow accepted"); }
  catch (IllegalArgumentException expected) { }
  assert p.A.coefficient == Integer.MAX_VALUE && p.C == prior;
  p.A.coefficient = Integer.MIN_VALUE;
  p.B.coefficient = -1;
  try { p.sumPolynomials(); throw new AssertionError("underflow accepted"); }
  catch (IllegalArgumentException expected) { }
  assert p.A.coefficient == Integer.MIN_VALUE && p.C == prior;
`);
await cpp('polynomial-insert', getPolynomialCpp('poly-insert-a'), `
  LinkedPolynomial p;
  p.C = new LinkedPolynomial::Node(7, 0);
  auto prior = p.C;
  try { p.insertA(2147483647, 14); assert(false); }
  catch (const std::overflow_error&) { }
  assert(p.A->coefficient == 3 && p.C == prior);
  p.A->coefficient = -2147483647 - 1;
  try { p.insertA(-1, 14); assert(false); }
  catch (const std::overflow_error&) { }
  assert(p.A->coefficient == -2147483647 - 1 && p.C == prior);
  p.insertA(-2147483647 - 1, 2);
  assert(p.C == nullptr);
`);
await cpp('polynomial-sum', getPolynomialCpp('poly-add'), `
  LinkedPolynomial p;
  p.A->coefficient = 2147483647;
  p.C = new LinkedPolynomial::Node(7, 0);
  auto prior = p.C;
  try { p.sumPolynomials(); assert(false); }
  catch (const std::overflow_error&) { }
  assert(p.A->coefficient == 2147483647 && p.C == prior);
  p.A->coefficient = -2147483647 - 1;
  p.B->coefficient = -1;
  try { p.sumPolynomials(); assert(false); }
  catch (const std::overflow_error&) { }
  assert(p.A->coefficient == -2147483647 - 1 && p.C == prior);
`);
await java('GeneralizedBuild', getGeneralizedListJava('glist-build'), `
  GeneralizedList list = new GeneralizedList();
  list.build("(a,(b,c))");
  GeneralizedList.Node prior = list.root;
  for (String invalid : new String[]{"(a)x", "(a,"}) {
    try { list.build(invalid); throw new AssertionError("invalid accepted"); }
    catch (IllegalArgumentException expected) { }
    assert list.root == prior;
  }
  list.build("()");
  assert list.root != prior && list.root.link == null;
`);
await cpp('generalized-build', getGeneralizedListCpp('glist-build'), `
  GeneralizedList list;
  assert(list.build("(a,(b,c))") != nullptr);
  auto prior = list.root;
  assert(list.build("(a)x") == nullptr && list.root == prior);
  assert(list.build("(a,") == nullptr && list.root == prior);
  assert(list.build("()") != nullptr && list.root->link == nullptr);
`);
await cpp('hanoi-reset', getHanoiCpp('reset'), `
  TowersOfHanoi towers(3);
  towers.reset();
  assert(towers.diskCount == 5 && towers.sourceSize == 5);
  assert(towers.source[0] == 5 && towers.source[4] == 1);
`);
await cpp('queens-reset', getBacktrackingCpp('n-reinas', 'reset'), `
  NQueens queens(5);
  queens.reset();
  assert(queens.size == 4);
  for (int row = 0; row < queens.size; row++) assert(queens.queens[row] == -1);
`);

console.log(`Native state-coherence probes: 3 Java and 5 C++ examples compiled and passed. Artifacts: ${directory}`);
