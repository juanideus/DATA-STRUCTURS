import test from 'node:test';
import assert from 'node:assert/strict';
import {algorithms} from '../../src/data/algorithms.js';
import {executeOperation} from '../../src/logic/operations.js';
import {getOperationPseudocode} from '../../src/data/operationPseudocode.js';
import {getBeginnerCpp} from '../../src/data/beginnerCpp.js';
import {getBeginnerJava} from '../../src/data/beginnerJava.js';
import {cppCodeNeedle} from '../../src/logic/cppCodeNeedles.js';
import {createTreeSynchronizedFrames,createLinkedListSynchronizedFrames,adaptFramesToCode} from '../../src/logic/codeAnimation.js';
const item=id=>algorithms.find(a=>a.id===id);
const run=(a,actionId,fields={})=>executeOperation({algorithm:a,actionId,fields,values:a.values,edges:[],initialValues:a.values,initialEdges:[]});
test('unordered tree pseudocode searches use summaries without parsing absent methods',()=>{
 for(const id of ['arbol-general','arbol-nario','arbol-binario']) {
  const a=item(id),fields={value:String(a.values[0])},r=run(a,'find',fields);
  const frames=createTreeSynchronizedFrames({algorithm:a,actionId:'find',codeMode:'pseudo',code:getOperationPseudocode(a,'find','es'),inputValues:fields,beforeValues:a.values,afterValues:r.values,beforeEdges:[],afterEdges:[],finalStep:r.step,finalMessage:r.message,succeeded:r.ok});
  assert.ok(frames.every(f=>f.traceMode==='summary'&&f.codeLine===null));
 }
});
test('circular C++ removal preserves current identity and commits delegated size',()=>{
 for(const values of [[10],[10,20,30]]) for(const value of values){
  const a={...item('lista-circular-simple'),values},fields={value:String(value)},r=run(a,'remove-value',fields),code=getBeginnerCpp(a,'remove-value');
  const frames=createLinkedListSynchronizedFrames({algorithm:a,actionId:'remove-value',codeMode:'cpp',code,inputValues:fields,beforeValues:values,afterValues:r.values,beforeEdges:[],afterEdges:[],finalStep:r.step,finalMessage:r.message,succeeded:r.ok});
  assert.equal(Number(frames.at(-1).variables.find(v=>v.name==='size').value),r.values.length);
  const unlink=frames.find(f=>(code.split('\n')[f.codeLine]??'').includes('previous->next = current->next'));
  if(unlink)assert.equal(Number(unlink.variables.find(v=>v.name==='current').value),value);
  const freed=frames.findIndex(f=>(code.split('\n')[f.codeLine]??'').includes('delete current;'));
  if(freed>=0)for(const f of frames.slice(freed))assert.equal(f.variables.find(v=>v.name==='current').value,'liberado');
 }
});
test('sparse links retain traversal pointers; zero insertion never traverses insert branch',()=>{
 const a=item('matriz-dispersa');
 for(const value of ['0','9']) for(const index of ['0','1']) {
  const fields={value,index,second:'0'},r=run(a,'matrix-insert',fields);
  if(value==='0') {
   assert.ok(!r.frames.some(f=>f.codeNeedle==='currentRow = currentRow.left;'));
   assert.ok(r.frames.some(f=>f.codeNeedle==='remove(row, column);'));
  } else if(index==='0') {
   for(const f of r.frames.filter(f=>['link-row','link-column','completed'].includes(f.sparseState?.phase))) {
    assert.equal(f.variables.find(v=>v.name==='actualFila').value,'AROW[0]');
    assert.equal(f.variables.find(v=>v.name==='actualCol').value,'ACOL[0]');
   }
  }
  for(const[mode,factory]of[['java',getBeginnerJava],['cpp',getBeginnerCpp]]) {
   const mapped=adaptFramesToCode(r.frames.map(f=>mode==='cpp'?{...f,codeNeedle:cppCodeNeedle(a.id,'matrix-insert',f)??f.codeNeedle}:f),factory(a,'matrix-insert'),true);
   assert.ok(mapped.every(f=>!f.codeUnmapped));
  }
 }
});
test('maze availability follows original walls and current path, including revisits',()=>{
 const values=[0,1,0,1,1,0,0,1,1,1,0,1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,1,1,0,0,0];
 const path=new Set(),expected=[];
 const visit=(row,column)=>{
  const index=row*6+column,free=row>=0&&row<6&&column>=0&&column<6&&values[index]===0&&!path.has(index);
  expected.push([row,column,free]); if(!free)return false;
  path.add(index); if(row===5&&column===5)return true;
  for(const[dr,dc]of[[0,1],[1,0],[0,-1],[-1,0]])if(visit(row+dr,column+dc))return true;
  path.delete(index);return false;
 };
 visit(0,0);
 const r=run({...item('laberinto'),values},'solve');
 const actual=r.frames.filter(f=>f.codeNeedle==='if (!isFree(row, column)) return false;').map(f=>['row','column','resultado'].map(n=>f.variables.find(v=>v.name===n).value));
 assert.deepEqual(actual,expected);
});

test('cyclic maze trace is bounded without claiming that a stopped search is unsolvable',()=>{
 const values=Array(36).fill(0);values[29]=1;values[34]=1;
 for(const action of ['solve','step-solution']) {
  const r=run({...item('laberinto'),values},action);
  assert.equal(r.ok,false);
  assert.match(r.message,/no se determinó/);
  assert.deepEqual(r.values,values);
 }
});
