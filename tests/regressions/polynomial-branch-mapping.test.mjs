import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../../src/data/algorithms.js';
import { executeOperation } from '../../src/logic/operations.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { cppCodeNeedle } from '../../src/logic/cppCodeNeedles.js';
import { adaptFramesToCode } from '../../src/logic/codeAnimation.js';

const normalize=s=>s.replaceAll('->','.').replaceAll('nullptr','null').replace(/Node\s*\*/g,'Node');
const repeated=new Set(['end = end.next;','p = p.next;','q = q.next;',
  'end.next = new Node(p.coefficient, p.exponent);','end.next = new Node(q.coefficient, q.exponent);']);
const fixtures=[
  [[[2,14]],[[3,8]]], [[[2,8]],[[3,14]]], [[[2,14]],[[3,14]]],
  [[[2,14]],[[-2,14]]], [[[2,14],[4,8]],[[3,14],[-4,8]]],
  [[[2,14],[4,6]],[[3,12],[5,8]]], [[[2,14],[4,8]],[]],
  [[],[[3,14],[5,8]]], [[],[]],
];
test('polynomial helper instructions map to their executed branch in Java and C++',()=>{
  const covered=new Set();
  for(const [A,B]of fixtures) for(const[mode,factory]of[['java',getBeginnerJava],['cpp',getBeginnerCpp]]) {
    const values=[...A.map(([coefficient,exponent])=>({coefficient,exponent,polynomial:'A'})),
      ...B.map(([coefficient,exponent])=>({coefficient,exponent,polynomial:'B'}))];
    const algorithm={...algorithms.find(a=>a.id==='polinomios'),values};
    const result=executeOperation({algorithm,actionId:'poly-add',fields:{},values,edges:[],initialValues:values,initialEdges:[]});
    assert.equal(result.ok,true);
    const code=factory(algorithm,'poly-add'),lines=code.split('\n').map(normalize);
    const helper=lines.findIndex(l=>/Node add\(/.test(l));
    const find=pattern=>lines.findIndex((l,i)=>i>helper&&pattern.test(l));
    const starts={equal:find(/if \(p\.exponent == q\.exponent\)/),
      'p-greater':find(/else if \(p\.exponent > q\.exponent\)/),
      'q-greater':find(/^\s*} else \{/),
      'remaining-p':find(/while \(p != null\)/),'remaining-q':find(/while \(q != null\)/)};
    const boundaries=[...Object.values(starts),find(/return dummy.next;/)].sort((a,b)=>a-b);
    const input=result.frames.map(f=>mode==='cpp'?{...f,codeNeedle:cppCodeNeedle('polinomios','poly-add',f)??f.codeNeedle}:f);
    const frames=adaptFramesToCode(input,code,true);
    let branch='equal';
    for(let i=0;i<frames.length;i++) {
      const original=result.frames[i],mapped=frames[i];
      if(['equal','p-greater','q-greater'].includes(original.polynomialState.phase)) branch=original.polynomialState.phase;
      if(original.codeNeedle==='while (p != null) {') branch='remaining-p';
      if(original.codeNeedle==='while (q != null) {') branch='remaining-q';
      assert.ok(!mapped.codeUnmapped,`${mode}: ${original.codeNeedle}`);
      if(!repeated.has(original.codeNeedle)) continue;
      covered.add(branch);
      const end=boundaries.find(n=>n>starts[branch]);
      assert.ok(mapped.codeLine>starts[branch]&&mapped.codeLine<end,`${mode}/${branch}: ${original.codeNeedle} -> ${mapped.codeLine}`);
      assert.ok(lines[mapped.codeLine].includes(normalize(original.codeNeedle)));
    }
  }
  assert.equal(covered.size,5);
});

test('missing explicit helper scope fails closed rather than matching another method',()=>{
  const [frame]=adaptFramesToCode([{codeMethod:'add',codeOccurrence:0,codeNeedle:'p = p.next;'}],
    'Node other(Node p) {\n p = p.next;\n return p;\n}',true);
  assert.equal(frame.codeLine,null);
  assert.equal(frame.codeUnmapped,true);
});
