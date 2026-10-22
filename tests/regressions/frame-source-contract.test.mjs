import assert from 'node:assert/strict';
import test from 'node:test';
import { hasValidFrameSourceReference } from '../../scripts/frame-source-contract.mjs';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { adaptFramesToCode } from '../../src/logic/codeAnimation.js';
import { executeOperation } from '../../src/logic/operations.js';

test('Source-reference validation accepts exact lines and existing needles', () => {
  const source = 'void run() {\n    size++;\n}';
  assert.equal(hasValidFrameSourceReference({ codeLine: 1 }, source), true);
  assert.equal(hasValidFrameSourceReference({ codeNeedle: 'size++;' }, source), true);
  for (const frame of [{}, { codeLine: null }, { codeLine: -1 }, { codeLine: 3 }, { codeLine: 1.5 }, { codeNeedle: '' }, { codeNeedle: 'notInTheSource();' }, { codeUnmapped: true, codeLine: null }]) {
    assert.equal(hasValidFrameSourceReference(frame, source), false, JSON.stringify(frame));
  }
});

test('A summary must explicitly omit both its highlighted line and executable needle', () => {
  const source = 'void run() {}';
  assert.equal(hasValidFrameSourceReference({ traceMode: 'summary', codeLine: null }, source), true);
  for (const frame of [
    { traceMode: 'summary' },
    { traceMode: 'summary', codeLine: 0 },
    { traceMode: 'summary', codeLine: null, codeNeedle: 'void run() {}' },
    { traceMode: 'summary', codeLine: null, codeNeedle: 'missing();' },
  ]) assert.equal(hasValidFrameSourceReference(frame, source), false, JSON.stringify(frame));
});

test('Real generalized-list build summaries pass validation without inventing Java/C++ lines', () => {
  const algorithm = algorithms.find(item => item.id === 'listas-generalizadas');
  const beforeValues = structuredClone(algorithm.values);
  const result = executeOperation({ algorithm, actionId: 'glist-build', fields: { value: '(a,(b,c))' }, values: beforeValues, edges: [], initialValues: algorithm.values });
  assert.equal(result.ok, true);
  assert.equal(result.frames.length, 2);
  assert.deepEqual(result.frames[0].values, beforeValues);
  assert.deepEqual(result.frames.at(-1).values, result.values);
  const java = getBeginnerJava(algorithm, 'glist-build');
  for (const [tag, value] of [['ATOM', 0], ['SUBLIST', 1], ['REFERENCE', 2]]) {
    assert.match(java, new RegExp(`static final int ${tag} = ${value};`));
    assert.match(java, new RegExp(`node\\.tag = ${tag};`));
  }
  for (const source of [java, getBeginnerCpp(algorithm, 'glist-build')]) {
    assert.ok(result.frames.every(frame => hasValidFrameSourceReference(frame, source)));
    const frames = adaptFramesToCode(result.frames, source, true);
    assert.ok(frames.every(frame => frame.traceMode === 'summary' && frame.codeLine === null));
  }
});
