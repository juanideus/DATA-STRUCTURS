import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { executeOperation } from '../../src/logic/operations.js';
import { createCodeSynchronizedFrames } from '../../src/logic/codeAnimation.js';
const item=id=>algorithms.find(a=>a.id===id);
const run=(a,actionId,fields)=>executeOperation({algorithm:a,actionId,fields,values:a.values,initialValues:a.values,edges:[],initialEdges:[]});
test('matrix and polynomial standalone code consumes the current input snapshot',()=>{
  const dense={...item('matriz'),values:[99,...item('matriz').values.slice(1)]};
  assert.match(getBeginnerJava(dense,'matrix-get'),/\{99,/);
  assert.match(getBeginnerCpp(dense,'matrix-get'),/values\[0\]\[0\] = 99;/);
  for(const factory of [getBeginnerJava,getBeginnerCpp]) {
    assert.match(factory(item('matriz-dispersa'),'matrix-get'),/new Node\(8, 0, 1\)/);
    const poly={...item('polinomios'),values:item('polinomios').values.map(t=>t.polynomial==='A'&&t.exponent===8?{...t,coefficient:4}:t)};
    assert.match(factory(poly,'poly-add'),/new Node\(4, 8[,)]/);
  }
});
test('canceling the last polynomial node retains its focus until explicit unlink',()=>{
  const r=run(item('polinomios'),'poly-insert-a',{value:'-1',index:'0'});
  assert.equal(r.frames.find(f=>f.codeNeedle==='if (current.coefficient == 0) {').polynomialState.activeIndex,2);
  const unlink=r.frames.find(f=>f.polynomialState.phase==='unlink');
  assert.ok(unlink);
  assert.equal(unlink.codeNeedle,'previous.next = current.next;');
  assert.ok(!unlink.values.some(t=>t.polynomial==='A'&&t.exponent===0));
});
test('ACOL previous pointer retains the node just left',()=>{
  const r=run(item('matriz-dispersa'),'matrix-insert',{value:'9',second:'0',index:'0'});
  const visits=r.frames.filter(f=>f.codeNeedle==='currentColumn = currentColumn.up;');
  assert.match(visits[0].variables.find(v=>v.name==='anteriorCol').value,/2, 0/);
  assert.match(visits[1].variables.find(v=>v.name==='anteriorCol').value,/1, 0/);
});
test('C++ singleton remove-start performs no copy iteration',()=>{
  const a={...item('array'),values:[11]},r=run(a,'remove-start',{}),code=getBeginnerCpp(a,'remove-start');
  const frames=createCodeSynchronizedFrames({algorithm:a,code,codeMode:'cpp',actionId:'remove-start',beforeValues:a.values,afterValues:r.values,beforeEdges:[],afterEdges:[],finalStep:r.step,finalMessage:r.message,succeeded:true,inputValues:{}});
  assert.ok(frames.every(f=>!/values\[i\] = values\[i \+ 1\]/.test(code.split('\n')[f.codeLine]??'')));
});
