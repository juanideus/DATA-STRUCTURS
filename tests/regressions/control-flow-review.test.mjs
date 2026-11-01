import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../../src/data/algorithms.js';
import { executeOperation } from '../../src/logic/operations.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { createTreeSynchronizedFrames, createLinkedListSynchronizedFrames, createCodeSynchronizedFrames } from '../../src/logic/codeAnimation.js';
const item = id => algorithms.find(a => a.id === id);
const run = (a, actionId, fields = {}) => executeOperation({ algorithm:a, actionId, fields, values:a.values, edges:[], initialValues:a.values, initialEdges:[] });
const modes = [['java',getBeginnerJava],['cpp',getBeginnerCpp]];
const args = (a, actionId, fields, r, code, codeMode) => ({algorithm:a,actionId,inputValues:fields,succeeded:r.ok,code,codeMode,beforeValues:a.values,afterValues:r.values,beforeEdges:[],afterEdges:[],finalStep:r.step,finalMessage:r.message});
test('root matches return before any child loop', () => {
  for (const id of ['arbol-general','arbol-nario']) for (const [mode,factory] of modes) {
    const a=item(id), fields={value:String(a.values[0])}, r=run(a,'find',fields), code=factory(a,'find');
    const frames=createTreeSynchronizedFrames(args(a,'find',fields,r,code,mode));
    assert.ok(frames.every(f=>! /\bfor\s*\(/.test(code.split('\n')[f.codeLine]??'')));
  }
});
test('singleton circular deletion executes do body and terminal false return', () => {
  for (const [mode,factory] of modes) {
    const a={...item('lista-circular-simple'),values:[10]}, fields={value:'99'}, r=run(a,'remove-value',fields), code=factory(a,'remove-value');
    const frames=createLinkedListSynchronizedFrames(args(a,'remove-value',fields,r,code,mode));
    assert.equal(frames.filter(f=> /do \{/.test(code.split('\n')[f.codeLine]??'')).length,1);
    assert.equal(code.split('\n')[frames.at(-1).codeLine].trim(),'return false;');
    const exit=frames.find(f=>/while \(current != (?:head)\)/.test(code.split('\n')[f.codeLine]??''));
    assert.equal(exit.variables.find(v=>v.name==='condición').value,'false');
  }
});
test('hash traversal keeps its bucket and evaluates while independently of key equality',()=>{
  for(const [mode,factory]of modes){
    const a={...item('hash-chaining'),values:['a:1','i:2','q:3']}, fields={value:'a'}, r=run(a,'find',fields), code=factory(a,'find');
    const frames=createCodeSynchronizedFrames(args(a,'find',fields,r,code,mode));
    assert.ok(frames.every(f=>f.variables.find(v=>v.name==='casilla').value===1));
    for(const f of frames.filter(f=>/while/.test(code.split('\n')[f.codeLine]??''))) assert.equal(f.variables.find(v=>v.name==='condición').value,'true');
  }
});
test('heap duplicate focus identifies the newly inserted index and seeds C++ data',()=>{
  const a=item('heap'),r=run(a,'heap-add',{value:'29'});
  assert.equal(r.step,3);
  assert.match(getBeginnerCpp(a,'heap-add'),/heap\[0\] = 42;/);
});
test('AVL helper focus follows the rotated child and final root',()=>{
  for(const [mode,factory]of modes){
    const a={...item('avl'),values:[30,10]},fields={value:'20'},r=run(a,'tree-add',fields),code=factory(a,'tree-add');
    const frames=createTreeSynchronizedFrames(args(a,'tree-add',fields,r,code,mode));
    const returns=frames.filter(f=>/return newRoot;/.test(code.split('\n')[f.codeLine]??''));
    assert.equal(returns[0].position,1);
    assert.equal(returns[0].values[1],20);
    assert.equal(returns[1].position,0);
  }
});
