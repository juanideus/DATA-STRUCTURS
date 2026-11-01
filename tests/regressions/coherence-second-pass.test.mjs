import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../../src/data/algorithms.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { executeOperation } from '../../src/logic/operations.js';
import { createCodeSynchronizedFrames, adaptFramesToCode } from '../../src/logic/codeAnimation.js';
import { cppCodeNeedle } from '../../src/logic/cppCodeNeedles.js';
import { createMultiwayTree } from '../../src/logic/multiwayTree.js';
import { runGridPathfinding } from '../../src/logic/pathfindingMap.js';
import { polynomialTerms } from '../../src/logic/polynomial.js';
const item = id => algorithms.find(a => a.id === id);
const run = (a, actionId, fields = {}, extra = {}) => executeOperation({algorithm:a, actionId, fields, values:a.values, initialValues:a.values, edges:[], initialEdges:[], ...extra});

test('RawArray constructor capacity covers examples larger than 100',()=>{
  const code=getBeginnerCpp({...item('array'),values:Array.from({length:101},(_,i)=>i)},'add-end');
  assert.match(code,/values\(new int\[101\]/);
  assert.match(code,/capacity = 101;/);
});
test('zero polynomial nodes survive grouping and column pointers identify their destination',()=>{
  const result=run(item('polinomios'),'poly-insert-a',{value:'-2',index:'8'});
  const grouped=result.frames.find(f=>f.codeNeedle==='current.coefficient += coefficient;');
  assert.equal(grouped.polynomialState.phase,'group');
  assert.ok(polynomialTerms(grouped.values,'A',true).some(t=>t.exponent===8&&t.coefficient===0));
  const sparse=run(item('matriz-dispersa'),'matrix-insert',{value:'9',second:'0',index:'0'});
  assert.equal(sparse.frames.find(f=>f.codeNeedle==='currentColumn = currentColumn.up;').sparseState.activeCellKey,'1:0');
});
test('singleton Array removals do not animate nonexistent copy iterations',()=>{
  for(const actionId of ['remove-start','remove-end']) {
    const a={...item('array'),values:[11]},result=run(a,actionId),code=getBeginnerJava(a,actionId);
    const frames=createCodeSynchronizedFrames({algorithm:a,code,codeMode:'java',actionId,beforeValues:a.values,afterValues:result.values,beforeEdges:[],afterEdges:[],finalStep:result.step,finalMessage:result.message,succeeded:true,inputValues:{}});
    assert.ok(frames.every(f=>!/result\[i\] =/.test(code.split('\n')[f.codeLine]??'')));
  }
});

test('polynomial assignment and sparse pointer advance update their visible state immediately',()=>{
  const poly=run(item('polinomios'),'poly-insert-a',{value:'2',index:'8'});
  for(const needle of ['current.coefficient += coefficient;','if (current.coefficient == 0) {']) {
    const frame=poly.frames.find(f=>f.codeNeedle===needle);
    assert.equal(frame.values.find(v=>v.polynomial==='A'&&v.exponent===8).coefficient,4);
  }
  const sparse=run(item('matriz-dispersa'),'matrix-get',{second:'0',index:'1'});
  assert.equal(sparse.frames.find(f=>f.codeNeedle==='current = current.left;').sparseState.activeCellKey,'0:1');
});
test('pathfinding resolves equal priorities by ascending cell index',()=>{
  assert.deepEqual(runGridPathfinding({mode:'dijkstra'}).frames.filter(f=>f.codePhase==='select').slice(0,4).map(f=>f.position),[177,155,176,178]);
  assert.deepEqual(runGridPathfinding({mode:'astar'}).frames.filter(f=>f.codePhase==='select').slice(0,4).map(f=>f.position),[177,155,156,157]);
});

test('valid Array mutations never execute rejection returns; Deque size persists', () => {
  for (const [id, actionId, fields] of [['array','set-index',{index:'1',value:'9'}],['array','remove-start',{}],['array','remove-end',{}],['deque','remove-start',{}]]) {
    const a={...item(id),values:[11,22,33]}, result=run(a,actionId,fields), code=getBeginnerJava(a,actionId);
    const frames=createCodeSynchronizedFrames({algorithm:a,code,codeMode:'java',actionId,beforeValues:a.values,afterValues:result.values,beforeEdges:[],afterEdges:[],finalStep:result.step,finalMessage:result.message,succeeded:true,inputValues:fields});
    if(id==='array') assert.ok(frames.every(f=>!/^return (?:false|values);$/.test(code.split('\n')[f.codeLine]?.trim())));
    else {
      const shrink=frames.findIndex(f=>code.split('\n')[f.codeLine]?.includes('size--;'));
      assert.ok(shrink>=0);
      for(const frame of frames.slice(shrink)) {
        assert.equal(Number(frame.variables.find(v=>v.name==='size')?.value),2);
        assert.deepEqual(frame.values,[22,33]);
      }
    }
  }
});
test('standalone linear examples seed all visible values in both languages', () => {
  for(const id of ['pila','cola','deque','lista-simple','lista-doble','lista-circular-simple','lista-circular-doble']) {
    const a=item(id);
    for(const factory of [getBeginnerJava,getBeginnerCpp]) {
      const code=factory(a,id==='pila'?'peek':id==='cola'?'front':'remove-start');
      assert.match(code,new RegExp(`(?:size = ${a.values.length};|top = ${a.values.length-1};)`),id);
      for(const value of a.values) assert.ok(code.includes(`= ${value};`)||code.includes(`Node(${value})`),id);
    }
  }
});
test('all Counting Sort C++ events have exact source lines',()=>{
  const a=item('counting-sort'),r=run(a,'sort'),code=getBeginnerCpp(a,'sort');
  const frames=adaptFramesToCode(r.frames.map(f=>({...f,codeNeedle:cppCodeNeedle(a.id,'sort',f)??f.codeNeedle})),code,true);
  assert.ok(frames.every(f=>!f.codeUnmapped));
});
test('multiway events retain chronological snapshots and every cascading separator',()=>{
  for(const [id,count,value] of [['btree',3,4],['bstar-tree',5,6],['bplus-tree',15,25]]){
    const a={...item(id),values:Array.from({length:count},(_,i)=>i+1)}, before=createMultiwayTree(id,a.values).snapshot();
    const modeled=createMultiwayTree(id,a.values,before).insert(value),r=run(a,'sorted-add',{value:String(value)},{multiwayTree:before});
    assert.deepEqual(r.frames.slice(1,-1).map(f=>[f.treePhase,f.promotedKey,f.multiwayTree]),modeled.events.map(e=>[e.type,e.promotedKey,e.tree]));
    assert.ok(r.frames.every(f=>f.traceMode==='summary'));
  }
});
