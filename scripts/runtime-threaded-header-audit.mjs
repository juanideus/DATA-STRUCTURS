import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../src/data/algorithms.js';
import { executeOperation } from '../src/logic/operations.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../src/data/beginnerCpp.js';

// Independent ordinary BST oracle; it never uses the lesson's thread builder.
const algorithm = algorithms.find(item => item.id === 'arbol-enhebrado');
const occupied = (values, index) => values[index] !== undefined && values[index] !== null;
const fromSlots = (values, index = 0) => occupied(values, index)
  ? { value: values[index], left: fromSlots(values, index * 2 + 1), right: fromSlots(values, index * 2 + 2) } : null;
const slots = root => {
  const values = [];
  const visit = (node, index) => { if (!node) return; values[index] = node.value; visit(node.left, index * 2 + 1); visit(node.right, index * 2 + 2); };
  visit(root, 0);
  return Array.from(values);
};
const insert = (node, value) => {
  if (!node) return { value, left: null, right: null };
  if (value < node.value) node.left = insert(node.left, value);
  else if (value > node.value) node.right = insert(node.right, value);
  return node;
};
const remove = (node, value) => {
  if (!node) return null;
  if (value < node.value) node.left = remove(node.left, value);
  else if (value > node.value) node.right = remove(node.right, value);
  else {
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    let successor = node.right;
    while (successor.left) successor = successor.left;
    node.value = successor.value;
    node.right = remove(node.right, successor.value);
  }
  return node;
};
const run = (values, actionId, value = '') => executeOperation({ algorithm, actionId,
  values, edges: [], initialValues: algorithm.values, fields: { value: String(value) } });
let simulationChecks = 0;
const verifyState = result => {
  if (!result.ok) return;
  const values = result.values;
  const state = result.frames.at(-1).threadedState;
  const order = [];
  const visit = index => { if (!occupied(values, index)) return; visit(index * 2 + 1); order.push(index); visit(index * 2 + 2); };
  visit(0);
  assert.equal(state.nodes.length, order.length + 1);
  assert.equal(state.root, 'header');
  const header = state.nodes.find(node => node.header);
  assert.equal(header.left, order.length ? 0 : 'header');
  assert.equal(header.right, 'header');
  assert.equal(header.leftThread, order.length === 0);
  assert.equal(header.rightThread, false);
  for (const [rank, id] of order.entries()) {
    const node = state.nodes.find(item => item.id === id);
    const leftChild = occupied(values, id * 2 + 1);
    const rightChild = occupied(values, id * 2 + 2);
    assert.equal(node.leftThread, !leftChild);
    assert.equal(node.rightThread, !rightChild);
    assert.equal(node.left, leftChild ? id * 2 + 1 : order[rank - 1] ?? 'header');
    assert.equal(node.right, rightChild ? id * 2 + 2 : order[rank + 1] ?? 'header');
    assert.ok(state.nodes.some(item => item.id === node.left));
    assert.ok(state.nodes.some(item => item.id === node.right));
  }
};
for (let mask = 0; mask < 1 << 15; mask++) {
  if (mask && !(mask & 1)) continue;
  if (Array.from({ length: 14 }, (_, index) => index + 1).some(index => (mask & (1 << index)) && !(mask & (1 << Math.floor((index - 1) / 2))))) continue;
  const values = [];
  let rank = 0;
  const assign = index => { if (!(mask & (1 << index)) || index >= 15) return; assign(index * 2 + 1); values[index] = ++rank * 2; assign(index * 2 + 2); };
  assign(0);
  const before = Array.from(values);
  const ordered = before.filter(value => value !== undefined).sort((a, b) => a - b);
  const traversal = run(before, 'inorder');
  assert.equal(traversal.ok, true);
  if (traversal.ok) {
    assert.deepEqual(traversal.frames.filter(frame => frame.codeNeedle === 'System.out.println(current.value);').map(frame => frame.variables.find(item => item.name === 'current').value), ordered);
    assert.equal(traversal.frames.at(-1).variables.find(item => item.name === 'current').value, 'root');
    verifyState(traversal);
  }
  simulationChecks++;
  for (const value of ordered) {
    const found = run(before, 'find', value);
    assert.equal(found.ok, true);
    assert.equal(found.frames.at(-1).variables.find(item => item.name === 'current').value, value);
    verifyState(found);
    const duplicate = run(before, 'tree-add', value);
    assert.equal(duplicate.ok, false);
    assert.deepEqual(duplicate.values, before);
    assert.equal(duplicate.frames.at(-1).codeNeedle, 'if (value == current.value) return root;');
    simulationChecks += 2;
    const result = run(before, 'remove-value', value);
    assert.equal(result.ok, true);
    assert.deepEqual(result.values, slots(remove(fromSlots(before), value)));
    verifyState(result);
    simulationChecks++;
  }
  for (const actionId of ['find', 'remove-value']) {
    const absent = run(before, actionId, 999);
    assert.equal(absent.ok, false);
    assert.deepEqual(absent.values, before);
    assert.ok(absent.frames.length > 0);
    simulationChecks++;
  }
  for (const value of Array.from({ length: rank + 1 }, (_, index) => index * 2 + 1)) {
    const expected = slots(insert(fromSlots(before), value));
    const result = run(before, 'tree-add', value);
    const fits = expected.length <= 15 && ordered.length < 15;
    assert.equal(result.ok, fits);
    assert.deepEqual(result.values, fits ? expected : before);
    verifyState(result);
    simulationChecks++;
  }
  assert.deepEqual(before, Array.from(values));
}
console.log(`SIMULATION_OK checks=${simulationChecks}`);

const selected = source => source.split('// Start of the selected operation')[1].split('// End of the selected operation')[0].trim();
const javaBase = getBeginnerJava(algorithm, 'remove-value');
const cppBase = getBeginnerCpp(algorithm, 'remove-value');
const javaExtra = ['tree-add', 'find', 'inorder'].map(action => selected(getBeginnerJava(algorithm, action))).join('\n');
const cppExtra = ['tree-add', 'find', 'inorder'].map(action => selected(getBeginnerCpp(algorithm, action))).join('\n');
const javaHarness = `
static long checks;
static void collect(Node n, java.util.List<Node> nodes, java.util.Set<Node> seen, long low, long high) {
    if (n == null) return;
    if (!seen.add(n) || n.value <= low || n.value >= high || n.left == null || n.right == null) throw new AssertionError("node invariant");
    if (!n.leftThread) collect(n.left, nodes, seen, low, n.value);
    nodes.add(n);
    if (!n.rightThread) collect(n.right, nodes, seen, n.value, high);
}
static void verify(ThreadedBinaryTree t, java.util.TreeSet<Integer> expected) {
    java.util.List<Node> nodes = new java.util.ArrayList<>();
    if (t.root == null || t.root.right != t.root || t.root.rightThread || t.root.leftThread != expected.isEmpty()) throw new AssertionError("header invariant");
    if (expected.isEmpty() && t.root.left != t.root) throw new AssertionError("empty header");
    if (!t.root.leftThread) collect(t.root.left, nodes, java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>()), Long.MIN_VALUE, Long.MAX_VALUE);
    if (nodes.size() != expected.size()) throw new AssertionError("size");
    int i = 0; for (int value : expected) if (nodes.get(i++).value != value) throw new AssertionError("order");
    for (i = 0; i < nodes.size(); i++) {
        Node n = nodes.get(i), p = i == 0 ? t.root : nodes.get(i - 1), s = i + 1 == nodes.size() ? t.root : nodes.get(i + 1);
        if (n.leftThread && n.left != p || n.rightThread && n.right != s || t.search(t.root, n.value) != n) throw new AssertionError("thread target/search");
    }
    java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
    java.io.PrintStream original = System.out;
    try { System.setOut(new java.io.PrintStream(bytes)); t.inorder(t.root); } finally { System.setOut(original); }
    StringBuilder output = new StringBuilder(); for (int value : expected) output.append(value).append(System.lineSeparator());
    if (!bytes.toString().equals(output.toString())) throw new AssertionError("actual inorder output");
    if (t.search(t.root, 123456) != t.root) throw new AssertionError("absent returns header");
    checks++;
}
static void permutations(int[] values, int at) {
    if (at == values.length) {
        ThreadedBinaryTree t = new ThreadedBinaryTree(); java.util.TreeSet<Integer> expected = new java.util.TreeSet<>();
        for (int v : values) { t.root = t.insert(t.root, v); expected.add(v); verify(t, expected); }
        for (int i = 0; i < values.length; i++) { int v = values[(i + 3) % values.length]; t.root = t.remove(t.root, v); expected.remove(v); verify(t, expected); }
        return;
    }
    for (int i = at; i < values.length; i++) { int v = values[at]; values[at] = values[i]; values[i] = v; permutations(values, at + 1); v = values[at]; values[at] = values[i]; values[i] = v; }
}
public static void main(String[] args) {
    permutations(new int[]{1,2,3,4,5,6,7}, 0);
    for (int seed = 0; seed < 30; seed++) {
        ThreadedBinaryTree t = new ThreadedBinaryTree(); java.util.TreeSet<Integer> expected = new java.util.TreeSet<>(); java.util.Random random = new java.util.Random(seed);
        for (int step = 0; step < 100; step++) { int v = step % 19 == 0 ? Integer.MIN_VALUE : step % 23 == 0 ? Integer.MAX_VALUE : random.nextInt(31) - 15;
            if (random.nextBoolean()) { t.root = t.insert(t.root, v); expected.add(v); } else { t.root = t.remove(t.root, v); expected.remove(v); } verify(t, expected);
        }
    }
    System.out.println("JAVA_OK checks=" + checks);
}
`;
// STL belongs only to this independent test harness, never to the displayed C++.
const cppHarness = `
using Node = ThreadedBinaryTree::Node;
long long checks;
void collect(Node* n, std::vector<Node*>& nodes, std::set<Node*>& seen, long long low, long long high) {
    if (!n) return;
    assert(seen.insert(n).second && n->value > low && n->value < high && n->left && n->right);
    if (!n->leftThread) collect(n->left, nodes, seen, low, n->value);
    nodes.push_back(n);
    if (!n->rightThread) collect(n->right, nodes, seen, n->value, high);
}
void verify(ThreadedBinaryTree& t, const std::set<int>& expected) {
    assert(t.root && t.root->right == t.root && !t.root->rightThread && t.root->leftThread == expected.empty());
    if (expected.empty()) assert(t.root->left == t.root);
    std::vector<Node*> nodes; std::set<Node*> seen;
    if (!t.root->leftThread) collect(t.root->left, nodes, seen, LLONG_MIN, LLONG_MAX);
    assert(nodes.size() == expected.size()); int i = 0;
    for (int v : expected) assert(nodes[i++]->value == v);
    for (i = 0; i < (int)nodes.size(); i++) { Node* n = nodes[i]; Node* p = i == 0 ? t.root : nodes[i - 1]; Node* s = i + 1 == (int)nodes.size() ? t.root : nodes[i + 1];
        assert(!n->leftThread || n->left == p); assert(!n->rightThread || n->right == s); assert(t.search(n->value) == n);
    }
    t.trace.clear(); t.inorder(); assert(t.trace == std::vector<int>(expected.begin(), expected.end()));
    assert(t.search(123456) == t.root);
    assert(allocated - released == (long long)nodes.size() + 1); checks++;
}
int main() {
    int input[] = {1,2,3,4,5,6,7};
    do { { ThreadedBinaryTree t; std::set<int> expected;
        for (int v : input) { assert(t.insert(v)); expected.insert(v); verify(t, expected); assert(!t.insert(v)); }
        for (int i = 0; i < 7; i++) { int v = input[(i + 3) % 7]; assert(t.remove(v)); expected.erase(v); verify(t, expected); }
        assert(!t.remove(100));
    } assert(allocated == released); } while (std::next_permutation(input, input + 7));
    for (int seed = 0; seed < 30; seed++) { { ThreadedBinaryTree t; std::set<int> expected; std::mt19937 random(seed);
        for (int step = 0; step < 100; step++) { int v = step % 19 == 0 ? INT_MIN : step % 23 == 0 ? INT_MAX : (int)(random() % 31) - 15;
            if (random() % 2) { bool inserted = expected.insert(v).second; assert(t.insert(v) == inserted); } else { bool removed = expected.erase(v); assert(t.remove(v) == removed); } verify(t, expected);
        }
    } assert(allocated == released); }
    std::cout << "CPP_OK checks=" << checks << " allocations=" << allocated << " releases=" << released << '\\n';
}
`;
const folder = await mkdtemp(path.join(tmpdir(), 'dsa-threaded-header-'));
const command = (name, args) => {
  const result = spawnSync(name, args, { encoding: 'utf8', timeout: 60_000, cwd: folder });
  assert.equal(result.status, 0, `${name}: ${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
  if (result.stdout) process.stdout.write(result.stdout);
};
try {
  const java = javaBase.slice(0, javaBase.lastIndexOf('}')) + javaExtra + '\n' + javaHarness + '\n}';
  await writeFile(path.join(folder, 'ThreadedBinaryTree.java'), java);
  command('javac', ['-encoding', 'UTF-8', 'ThreadedBinaryTree.java']);
  command('java', ['-ea', '-cp', folder, 'ThreadedBinaryTree']);
  const cpp = cppBase.replace('int lastVisited = 0;', 'int lastVisited = 0; std::vector<int> trace;')
    .replace('lastVisited = value;', 'lastVisited = value; trace.push_back(value);')
    .replace('rightThread(true) {}', 'rightThread(true) { ++allocated; }\n        ~Node() { ++released; }')
    .replace('// End of the selected operation', cppExtra + '\n// End of the selected operation');
  await writeFile(path.join(folder, 'audit.cpp'), '#include <algorithm>\n#include <cassert>\n#include <climits>\n#include <iostream>\n#include <random>\n#include <set>\n#include <vector>\nlong long allocated = 0, released = 0;\n' + cpp + cppHarness);
  command('g++', ['-std=c++17', '-O1', '-Wall', '-Wextra', '-Werror', 'audit.cpp', '-o', 'audit.exe']);
  command(path.join(folder, 'audit.exe'), []);
} finally {
  assert.equal(path.dirname(path.resolve(folder)), path.resolve(tmpdir()));
  assert.ok(path.basename(folder).startsWith('dsa-threaded-header-'));
  await rm(folder, { recursive: true, force: true });
}
