import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getGuideJavaExample } from '../../src/data/guideJavaExamples.js';
import { executeOperation } from '../../src/logic/operations.js';

const algorithm = id => algorithms.find(item => item.id === id);
const execute = (id, actionId, fields, values = algorithm(id).values) => executeOperation({
  algorithm: algorithm(id), actionId, fields, values, edges: [], initialValues: algorithm(id).values,
});
const selected = source => source.split('// Start of the selected operation')[1]
  .split('// End of the selected operation')[0].trim();
const javaSource = (id, action) => getBeginnerJava(algorithm(id), action);
const cppSource = (id, action) => getBeginnerCpp(algorithm(id), action);

test('Range-query guide examples preserve the same wide-sum contract', () => {
  const segment = getGuideJavaExample('segment-tree');
  const fenwick = getGuideJavaExample('fenwick-tree');
  assert.match(segment.code, /long query\(Node node, int left, int right\)/);
  assert.match(segment.explanation, /node\.sum también es long/);
  assert.match(fenwick.code, /long prefixSum\(int index\)/);
  assert.match(fenwick.code, /long sum = 0/);
  assert.match(fenwick.explanation, /bit y sum usan long/);
});

test('Segment Tree keeps a high minimum and sums beyond int32 exactly', () => {
  const high = execute('segment-tree', 'range-update', { index: '0', value: '2000000000' });
  assert.equal(execute('segment-tree', 'range-min', { index: '0' }, high.values).message, 'Mínimo en [0, 0] = 2000000000.');
  const maximum = execute('segment-tree', 'range-update', { index: '0', value: '2147483647' });
  assert.equal(execute('segment-tree', 'prefix-sum', { index: '1' }, maximum.values).message, 'Suma en [0, 1] = 2147483652.');
});

test('Fenwick rejects overflowing cells atomically, but allows wide aggregate sums', () => {
  const before = [...algorithm('fenwick-tree').values];
  const rejected = execute('fenwick-tree', 'range-update', { index: '0', value: '2147483647' }, before);
  assert.equal(rejected.ok, false);
  assert.deepEqual(rejected.values, before);
  assert.deepEqual(before, algorithm('fenwick-tree').values);
  const accepted = execute('fenwick-tree', 'range-update', { index: '0', value: '2147483644' }, before);
  assert.equal(accepted.values[0], 2147483647);
  assert.equal(execute('fenwick-tree', 'prefix-sum', { index: '7' }, accepted.values).message, 'Suma en [0, 7] = 2147483674.');
});

test('Expression Tree uses checked int32 arithmetic and truncating integer division', () => {
  for (const [input, expected] of [['8', 8], ['8+3*2', 14], ['7/2', 3], ['(0-7)/2', -3], ['0-2147483647-1', -2147483648]]) {
    const result = execute('expression-tree', 'evaluate', { value: input });
    assert.equal(result.ok, true, input);
    assert.equal(result.message, `Resultado del árbol de expresión: ${expected}.`, input);
  }
  const before = [...algorithm('expression-tree').values];
  for (const input of ['1.5+2', '2147483648', '2147483647+1', '2147483647*2147483647', '8/0', '(0-2147483647-1)/(0-1)', '8a+3', '8(3)+', '8 3 +']) {
    const result = execute('expression-tree', 'evaluate', { value: input }, before);
    assert.equal(result.ok, false, input);
    assert.deepEqual(result.values, before, input);
  }
  for (const input of ['1.5+2', '2147483648', '8a+3', '8(3)+']) {
    assert.equal(execute('expression-tree', 'set-expression', { value: input }, before).ok, false, input);
  }
});

const expressionJavaMain = `
static void check(boolean condition) { if (!condition) throw new AssertionError(); }
public static void main(String[] args) {
    ExpressionTree t = new ExpressionTree();
    check(t.evaluate(t.buildExpressionTree("8")) == 8);
    check(t.evaluate(t.buildExpressionTree("8+3*2")) == 14);
    check(t.evaluate(t.buildExpressionTree("7/2")) == 3);
    check(t.evaluate(t.buildExpressionTree("(0-7)/2")) == -3);
    for (String source : new String[]{"1.5+2", "2147483648", "8a+3", "8(3)+", "8 3 +"}) {
        boolean rejected = false;
        try { t.buildExpressionTree(source); } catch (RuntimeException expected) { rejected = true; }
        check(rejected);
    }
    for (String source : new String[]{"2147483647+1", "2147483647*2147483647", "8/0", "(0-2147483647-1)/(0-1)"}) {
        boolean rejected = false;
        try { t.evaluate(t.buildExpressionTree(source)); } catch (ArithmeticException expected) { rejected = true; }
        check(rejected);
    }
    java.io.PrintStream original = System.out;
    java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
    System.setOut(new java.io.PrintStream(output));
    t.preorder(t.buildExpressionTree("8+3"));
    t.postorder(t.buildExpressionTree("8+3"));
    System.setOut(original);
    check(output.toString().lines().collect(java.util.stream.Collectors.joining(" ")).equals("+ 8 3 8 3 +"));
    System.out.println("tree-contract-ok");
}`;

const segmentJavaMain = `
public static void main(String[] args) {
    SegmentTree t = new SegmentTree();
    int[] input = {2,5,1,7,3,9,4};
    for (int i = 0; i < input.length; i++) t.update(1, 0, 6, i, input[i]);
    t.update(1, 0, 6, 0, 2000000000);
    if (t.prefixMinimum(1,0,6,0) != 2000000000) throw new AssertionError();
    t.update(1, 0, 6, 0, Integer.MAX_VALUE);
    if (t.prefixSum(1,0,6,1) != 2147483652L) throw new AssertionError();
    System.out.println("tree-contract-ok");
}`;

const fenwickJavaMain = `
public static void main(String[] args) {
    FenwickTree t = new FenwickTree();
    t.add(0,2147483644);
    if (t.prefixSum(7) != 2147483674L) throw new AssertionError();
    int[] values = t.values.clone(); long[] bit = t.bit.clone();
    boolean rejected = false;
    try { t.add(0,1); } catch (ArithmeticException expected) { rejected = true; }
    if (!rejected || !Arrays.equals(values,t.values) || !Arrays.equals(bit,t.bit)) throw new AssertionError();
    System.out.println("tree-contract-ok");
}`;

const expressionCppMain = `
int main() {
    ExpressionTree t;
    assert(t.evaluate(t.buildExpressionTree("8")) == 8);
    assert(t.evaluate(t.buildExpressionTree("8+3*2")) == 14);
    assert(t.evaluate(t.buildExpressionTree("7/2")) == 3);
    assert(t.evaluate(t.buildExpressionTree("(0-7)/2")) == -3);
    auto* previous = t.root;
    for (const char* source : {"1.5+2", "2147483648", "8a+3", "8(3)+", "8 3 +"}) {
        assert(t.buildExpressionTree(source) == nullptr);
        assert(t.root == previous);
    }
    for (const char* source : {"2147483647+1", "2147483647*2147483647", "8/0", "(0-2147483647-1)/(0-1)"}) {
        bool rejected = false;
        try { t.evaluate(t.buildExpressionTree(source)); } catch (const std::exception&) { rejected = true; }
        assert(rejected);
    }
    t.preorder(t.buildExpressionTree("8+3")); assert(t.lastVisited == "3");
    t.postorder(t.root); assert(t.lastVisited == "+");
    std::cout << "tree-contract-ok\\n";
}`;

const segmentCppMain = `
int main() {
    SegmentTree t; t.size = 7;
    int input[] = {2,5,1,7,3,9,4};
    for (int i = 0; i < 7; i++) t.update(1,0,6,i,input[i]);
    t.update(1,0,6,0,2000000000);
    assert(t.prefixMinimum(1,0,6,0) == 2000000000);
    t.update(1,0,6,0,INT_MAX);
    assert(t.prefixSum(1,0,6,1) == 2147483652LL);
    std::cout << "tree-contract-ok\\n";
}`;

const fenwickCppMain = `
int main() {
    FenwickTree t; t.size = 8;
    int input[] = {3,2,5,1,7,4,6,2};
    for (int i = 0; i < 8; i++) t.add(i,input[i]);
    t.add(0,2147483644);
    assert(t.prefixSum(7) == 2147483674LL);
    long long before = t.prefixSum(7);
    bool rejected = false;
    try { t.add(0,1); } catch (const std::overflow_error&) { rejected = true; }
    assert(rejected && t.values[0] == INT_MAX && t.prefixSum(7) == before);
    std::cout << "tree-contract-ok\\n";
}`;

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, windowsHide: true });
  assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

test('Generated Java: one expression node model, high minima, long sums and atomic guards', { skip: !process.env.DSA_TREE_JAVA }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'dsa-tree-java-'));
  for (const [id, name, firstAction, extraActions, main] of [
    ['expression-tree', 'ExpressionTree', 'set-expression', ['evaluate', 'preorder', 'postorder'], expressionJavaMain],
    ['segment-tree', 'SegmentTree', 'range-update', ['prefix-sum', 'range-min'], segmentJavaMain],
    ['fenwick-tree', 'FenwickTree', 'range-update', ['prefix-sum'], fenwickJavaMain],
  ]) {
    const base = javaSource(id, firstAction);
    const extra = extraActions.map(action => selected(javaSource(id, action))).join('\n');
    const source = `${base.slice(0, base.lastIndexOf('}'))}\n${extra}\n${main}\n}`;
    const file = path.join(directory, `${name}.java`);
    writeFileSync(file, source);
    assert.match(run(process.env.DSA_TREE_JAVA, [file]), /tree-contract-ok/);
  }
});

test('Generated C++: checked expressions and dynamic wide range aggregates', { skip: !process.env.DSA_TREE_CXX }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'dsa-tree-cpp-'));
  for (const [id, firstAction, extraActions, main] of [
    ['expression-tree', 'set-expression', ['evaluate', 'preorder', 'postorder'], expressionCppMain],
    ['segment-tree', 'range-update', ['prefix-sum', 'range-min'], segmentCppMain],
    ['fenwick-tree', 'range-update', ['prefix-sum'], fenwickCppMain],
  ]) {
    const base = cppSource(id, firstAction);
    const extra = extraActions.map(action => selected(cppSource(id, action))).join('\n');
    const insertion = base.includes('\nprivate:') ? base.indexOf('\nprivate:') : base.lastIndexOf('};');
    const source = `#include <cassert>\n#include <iostream>\n${base.slice(0, insertion)}\n${extra}\n${base.slice(insertion)}\n${main}`;
    const file = path.join(directory, `${id}.cpp`);
    const executable = path.join(directory, `${id}${process.platform === 'win32' ? '.exe' : ''}`);
    writeFileSync(file, source);
    run(process.env.DSA_TREE_CXX, ['-std=c++17', '-Wall', '-Wextra', file, '-o', executable]);
    assert.match(run(executable, []), /tree-contract-ok/);
  }
});
