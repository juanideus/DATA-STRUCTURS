import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { algorithms } from '../../src/data/algorithms.js';
import { executeOperation } from '../../src/logic/operations.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { cppCodeNeedle } from '../../src/logic/cppCodeNeedles.js';
import { adaptFramesToCode, createTreeSynchronizedFrames } from '../../src/logic/codeAnimation.js';
const item=id=>algorithms.find(a=>a.id===id);
const run=(algorithm,actionId,fields)=>executeOperation({algorithm,actionId,fields,values:algorithm.values,edges:[],initialValues:algorithm.values,initialEdges:[]});
test('challenge commits the complete final frame, including auxiliary tree state',()=>{
  const source=readFileSync(new URL('../../src/App.jsx',import.meta.url),'utf8');
  const handler=source.slice(source.indexOf('const toggleChallengeMode'),source.indexOf('const startSectionTest'));
  assert.match(handler,/applyFrame\(finalFrame, operationFrames.length - 1\)/);
  assert.doesNotMatch(handler,/setDemoValues/);
});
test('AVL LR and RL rotations retain their intermediate snapshots and real returns',()=>{
  for(const values of [[30,10],[10,null,30]]) {
    const a={...item('avl'),values},actionId='tree-add',fields={value:'20'},r=run(a,actionId,fields);
    for(const [codeMode,factory]of[['java',getBeginnerJava],['cpp',getBeginnerCpp]]) {
      const code=factory(a,actionId);
      const frames=createTreeSynchronizedFrames({algorithm:a,code,codeMode,actionId,beforeValues:values,afterValues:r.values,beforeEdges:[],afterEdges:[],finalStep:r.step,finalMessage:r.message,succeeded:r.ok,inputValues:fields});
      const returns=frames.filter(f=>/return newRoot;/.test(code.split('\n')[f.codeLine]??''));
      assert.equal(returns.length,2);
      assert.notDeepEqual(returns[0].values,r.values);
      assert.deepEqual(returns[1].values,r.values);
      assert.match(code.split('\n')[frames.at(-1).codeLine],/return newRoot;/);
    }
  }
});
test('all cancellation positions map to real polynomial code in both languages',()=>{
  for(const [coefficient,exponent]of[[-3,14],[-2,8],[-1,0]]){
    const a=item('polinomios'),actionId='poly-insert-a',r=run(a,actionId,{value:String(coefficient),index:String(exponent)});
    for(const [mode,factory]of[['java',getBeginnerJava],['cpp',getBeginnerCpp]]) {
      const frames=r.frames.map(f=>mode==='cpp'?{...f,codeNeedle:cppCodeNeedle(a.id,actionId,f)??f.codeNeedle}:f);
      assert.ok(adaptFramesToCode(frames,factory(a,actionId),true).every(f=>!f.codeUnmapped));
    }
  }
});
test('sparse C++ operations retain exact source references',()=>{
  const a=item('matriz-dispersa');
  for(const[actionId,fields]of[['matrix-get',{second:'0',index:'1'}],['matrix-row',{second:'0'}],['matrix-column',{index:'0'}],['matrix-insert',{value:'9',second:'0',index:'0'}],['matrix-remove',{second:'0',index:'1'}]]){
    const r=run(a,actionId,fields),code=getBeginnerCpp(a,actionId);
    assert.ok(adaptFramesToCode(r.frames.map(f=>({...f,codeNeedle:cppCodeNeedle(a.id,actionId,f)??f.codeNeedle})),code,true).every(f=>!f.codeUnmapped),actionId);
  }
});
