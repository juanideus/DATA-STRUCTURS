import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../../src/data/algorithms.js';
import { executeOperation } from '../../src/logic/operations.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { createLinkedListSynchronizedFrames } from '../../src/logic/codeAnimation.js';

function trace(id, values, actionId, fields, mode='cpp') {
  const algorithm={...algorithms.find(a=>a.id===id),values};
  const result=executeOperation({algorithm,actionId,fields,values,edges:[],initialValues:values,initialEdges:[]});
  assert.equal(result.ok,true);
  const code=(mode==='cpp'?getBeginnerCpp:getBeginnerJava)(algorithm,actionId);
  const frames=createLinkedListSynchronizedFrames({algorithm,code,codeMode:mode,actionId,inputValues:fields,
    beforeValues:values,afterValues:result.values,beforeEdges:[],afterEdges:[],finalStep:result.step,finalMessage:result.message,succeeded:true});
  return {result,frames,lines:code.split('\n')};
}

test('C++ delegated index operations return without executing caller traversal or size mutation',()=>{
  for(const values of [[10],[10,20,30]]) {
    for(const id of ['lista-simple','lista-circular-simple','lista-circular-doble']) {
      const {result,frames,lines}=trace(id,values,'remove-index',{index:'0'});
      const executed=frames.filter(f=>f.codeLine!==null).map(f=>lines[f.codeLine].trim());
      assert.ok(!executed.some(l=>/size--|\bfor\b|previous->next =/.test(l)),id);
      assert.match(executed.at(-1),/return removeFromStart\(\)/);
      assert.deepEqual(frames.at(-1).values,result.values);
      assert.equal(Number(frames.at(-1).variables.find(v=>v.name==='size').value),result.values.length);
    }
  }
  for(const id of ['lista-circular-simple','lista-circular-doble']) for(const values of [[],[10],[10,20,30]]) {
    const indices=id==='lista-circular-doble'?[0,values.length]:[0];
    for(const index of indices){
      const {frames,lines,result}=trace(id,values,'add-index',{value:'99',index:String(index)});
      const executed=frames.filter(f=>f.codeLine!==null).map(f=>lines[f.codeLine].trim());
      assert.ok(!executed.some(l=>/size\+\+|\bfor\b|Node\* newNode/.test(l)),`${id}/${index}`);
      assert.equal(executed.at(-1),'return true;');
      assert.deepEqual(frames.at(-1).values,result.values);
    }
  }
});

test('doubly-list conditions never restore a removed head',()=>{
  for(const mode of ['java','cpp']) for(const values of [[10],[10,20,30]]) for(const action of ['remove-start','remove-index']) {
    const {frames,result}=trace('lista-doble',values,action,{index:'0'},mode);
    let changed=false;
    for(const frame of frames){
      if(JSON.stringify(frame.values)===JSON.stringify(result.values)) changed=true;
      if(changed) assert.deepEqual(frame.values,result.values,`${mode}/${action}: ${frame.message}`);
    }
  }
});

test('circular C++ insertion returns from the branch actually taken',()=>{
  for(const id of ['lista-circular-simple','lista-circular-doble']) {
    for(const values of [[],[10],[10,20,30]]) for(let index=0;index<=values.length;index++) {
      const {frames,lines,result}=trace(id,values,'add-index',{value:'99',index:String(index)});
      const final=frames.at(-1);
      const start=lines.findIndex(l=>l.includes('// Start of the selected operation'));
      const end=lines.findIndex(l=>l.includes('// End of the selected operation'));
      const returns=lines.flatMap((l,i)=>i>start&&i<end&&l.trim()==='return true;'?[i]:[]);
      const delegatedStart=index===0;
      const delegatedEnd=id==='lista-circular-doble' && index===values.length && index!==0;
      const expected=delegatedStart?returns[0]:delegatedEnd?returns[1]:returns.at(-1);
      assert.equal(final.codeLine,expected,`${id}/${values.length}/${index}`);
      assert.equal(final.codeUnmapped,false);
      assert.deepEqual(final.values,result.values);
      assert.equal(Number(final.variables.find(v=>v.name==='size').value),result.values.length);
      assert.equal(final.completed,true);
    }
  }
});
