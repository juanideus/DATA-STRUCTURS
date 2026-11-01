import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../../src/data/algorithms.js';
import { createChallenge, challengeOutcomeMatches } from '../../src/logic/challenges.js';
import { executeOperation } from '../../src/logic/operations.js';

const minimum=-2147483648, maximum=2147483647;
const scenarios=[[],[minimum],[maximum],[minimum,maximum],
  [minimum,minimum+1,maximum-1,maximum],
  Array.from({length:15},(_,i)=>maximum-i),
  Array.from({length:15},(_,i)=>minimum+i)];

test('linear challenges at int32 boundaries propose executable actions with matching answers',()=>{
  for(const id of ['array','pila','cola']) for(const values of scenarios) for(let attempt=0;attempt<12;attempt++) {
    const algorithm={...algorithms.find(a=>a.id===id),values};
    const challenge=createChallenge(algorithm,values,attempt);
    assert.ok(challenge,`${id}/${attempt}`);
    if(['add-end','push','enqueue'].includes(challenge.action.id)) {
      const value=Number(challenge.action.fields.value);
      assert.ok(Number.isInteger(value)&&value>=minimum&&value<=maximum);
      assert.ok(!values.includes(value));
    }
    const result=executeOperation({algorithm,actionId:challenge.action.id,fields:challenge.action.fields,
      values,edges:[],initialValues:values,initialEdges:[]});
    assert.equal(result.ok,true,`${id}/${attempt}: ${result.message}`);
    assert.equal(challengeOutcomeMatches(challenge,result.values),true,`${id}/${attempt}: outcome`);
    assert.equal(new Set(challenge.options.map(o=>o.label)).size,challenge.options.length);
  }
});

test('tree challenge candidates wrap safely in both directions at int32 boundaries',()=>{
  for(const id of ['bst','avl']) for(const values of [[minimum],[maximum],[0,minimum,maximum]]) for(let attempt=0;attempt<4;attempt++) {
    const algorithm={...algorithms.find(a=>a.id===id),values};
    const c=createChallenge(algorithm,values,attempt);
    assert.ok(c);
    const value=Number(c.action.fields.value);
    assert.ok(Number.isInteger(value)&&value>=minimum&&value<=maximum);
    const r=executeOperation({algorithm,actionId:c.action.id,fields:c.action.fields,values,edges:[],initialValues:values,initialEdges:[]});
    assert.equal(r.ok,true,r.message);
    assert.equal(challengeOutcomeMatches(c,r.values),true);
  }
});
