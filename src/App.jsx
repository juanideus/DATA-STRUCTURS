import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Boxes, Bug, ChevronDown, CircleHelp, ExternalLink, Gauge,
  Menu, PanelLeftClose, PanelLeftOpen, Pause, Play, RotateCcw, Search, Shuffle, Sparkles, X,
} from 'lucide-react';
import { algorithms, categories, categoryLabels } from './data/algorithms.js';
import { getBeginnerJava } from './data/beginnerJava.js';
import EducationalDescription from './components/EducationalDescription.jsx';
import OperationsPanel from './components/OperationsPanel.jsx';
import VariablesPanel from './components/VariablesPanel.jsx';
import { adaptFramesToCode, copyVisualValues, createCodeSynchronizedFrames } from './logic/codeAnimation.js';
import { DEFAULT_GRAPH_EDGES, executeOperation, getOperationDefinition } from './logic/operations.js';
import ucnLogo from './assets/LogoUCN.png';

const SUDOKU_START = [
  5,3,0,0,7,0,0,0,0, 6,0,0,1,9,5,0,0,0, 0,9,8,0,0,0,0,6,0,
  8,0,0,0,6,0,0,0,3, 4,0,0,8,0,3,0,0,1, 7,0,0,0,2,0,0,0,6,
  0,6,0,0,0,0,2,8,0, 0,0,0,4,1,9,0,0,5, 0,0,0,0,8,0,0,7,9,
];

const NORMAL_FRAME_DELAY = 800;

const randomNumber = (minimum, maximum) => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

function randomUniqueNumbers(amount, minimum = 1, maximum = 60) {
  const numbers = new Set();
  while (numbers.size < amount) numbers.add(randomNumber(minimum, maximum));
  return [...numbers];
}

function balancedLevelOrder(sortedValues) {
  const result = [];
  const ranges = [[0, sortedValues.length - 1]];
  while (ranges.length) {
    const [start, end] = ranges.shift();
    if (start > end) continue;
    const middle = Math.floor((start + end) / 2);
    result.push(sortedValues[middle]);
    ranges.push([start, middle - 1], [middle + 1, end]);
  }
  return result;
}

function createRandomValues(algorithm) {
  const amount = algorithm.values.length;

  if (algorithm.id === 'sudoku') {
    const digits = randomUniqueNumbers(9, 1, 9);
    return SUDOKU_START.map(value => value === 0 ? 0 : digits[value - 1]);
  }
  if (algorithm.id === 'laberinto') {
    const maze = new Array(36).fill(1);
    let row = 0, column = 0;
    maze[0] = 0;
    while (row < 5 || column < 5) {
      if (row === 5) column++;
      else if (column === 5) row++;
      else if (Math.random() < .5) row++;
      else column++;
      maze[row * 6 + column] = 0;
    }
    for (let index = 1; index < 35; index++) if (Math.random() < .28) maze[index] = 0;
    return maze;
  }
  if (algorithm.id === 'n-reinas') return new Array(randomNumber(4, 8)).fill(-1);
  if (algorithm.id === 'hanoi') {
    const disks = randomNumber(3, 6);
    return Array.from({ length: disks }, (_, index) => disks - index);
  }
  if (algorithm.id === 'fibonacci') {
    const length = randomNumber(6, 9), values = [0, 1];
    while (values.length < length) values.push(values.at(-1) + values.at(-2));
    return values;
  }
  if (algorithm.id === 'factorial') {
    const length = randomNumber(4, 7);
    return Array.from({ length }, (_, index) => Array.from({ length: index + 1 }, (__, item) => item + 1).reduce((total, value) => total * value, 1));
  }
  if (algorithm.id === 'trie') {
    const examples = [['SOL','SOLA','SOLO','SOLAR'],['PAN','PANA','PANEL','PANERA'],['MAR','MAREA','MARINO','MARTA']];
    return examples[randomNumber(0, examples.length - 1)];
  }
  if (algorithm.id === 'suffix-tree') return [...['ALGORITMO','BANANA','DATOS','CASACA'][randomNumber(0, 3)]];
  if (algorithm.id === 'expression-tree') return ['+','×','−',...randomUniqueNumbers(4, 1, 9).map(String)];
  if (algorithm.id === 'merkle-tree') return Array.from({ length: amount }, () => `B${randomNumber(10, 99)}`);
  if (algorithm.category === 'Grafos') {
    const offset = randomNumber(0, 19);
    return Array.from({ length: amount }, (_, index) => String.fromCharCode(65 + (offset + index) % 26));
  }
  if (algorithm.id === 'hash-table') {
    const keys = ['nube','luna','rio','cobre','norte','aula','dato','java'];
    return keys.sort(() => Math.random() - .5).slice(0, amount);
  }
  if (algorithm.id === 'lru-cache') {
    const offset = randomNumber(0, 18);
    return Array.from({ length: amount }, (_, index) => String.fromCharCode(65 + offset + index)).sort(() => Math.random() - .5);
  }
  if (algorithm.id === 'union-find') {
    const parents = Array.from({ length: amount }, (_, index) => index);
    for (let index = 1; index < amount; index++) if (Math.random() < .55) parents[index] = parents[index - 1];
    return parents;
  }
  if (algorithm.id === 'bloom-filter') return Array.from({ length: amount }, () => randomNumber(0, 1));

  const values = randomUniqueNumbers(amount);
  if (['bst','avl','rojo-negro','splay-tree','kd-tree'].includes(algorithm.id)) return balancedLevelOrder(values.sort((a, b) => a - b));
  if (algorithm.type === 'heap') return values.sort((a, b) => b - a);
  if (['skip-list','btree','bplus-tree','bstar-tree'].includes(algorithm.id)) return values.sort((a, b) => a - b);
  return values;
}

function CircularListVisual({ algorithm, step }) {
  const values = algorithm.values;
  const doubleCircular = algorithm.id === 'lista-circular-doble';
  const nodeSize = 58;
  const gap = 58;
  const padding = values.length === 1 ? 61 : 28;
  const width = values.length === 1 ? 180 : padding * 2 + values.length * nodeSize + (values.length - 1) * gap;
  const center = index => padding + nodeSize / 2 + index * (nodeSize + gap);
  const firstCenter = center(0);
  const lastCenter = center(values.length - 1);
  const forwardMarker = `circle-forward-${algorithm.id}`;
  const reverseMarker = `circle-reverse-${algorithm.id}`;

  return <svg className="circular-list-visual" viewBox={`0 0 ${width} 160`} aria-label={doubleCircular ? 'Lista doble circular' : 'Lista circular simple'}>
    <defs>
      <marker id={forwardMarker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7 z" /></marker>
      <marker id={reverseMarker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L7,3.5 L0,7 z" /></marker>
    </defs>

    {values.slice(0,-1).map((_,index) => doubleCircular
      ? <g key={`edge-${index}`}>
          <line className="circle-edge forward" x1={center(index)+nodeSize/2} y1="48" x2={center(index+1)-nodeSize/2-4} y2="48" markerEnd={`url(#${forwardMarker})`} />
          <line className="circle-edge reverse" x1={center(index+1)-nodeSize/2} y1="64" x2={center(index)+nodeSize/2+4} y2="64" markerEnd={`url(#${reverseMarker})`} />
        </g>
      : <line className="circle-edge forward" key={`edge-${index}`} x1={center(index)+nodeSize/2} y1="56" x2={center(index+1)-nodeSize/2-4} y2="56" markerEnd={`url(#${forwardMarker})`} />
    )}

    {values.length === 1
      ? <path className="circle-return forward" d={`M ${firstCenter+nodeSize/2} 55 C ${firstCenter+62} 55, ${firstCenter+62} 118, ${firstCenter} 118 C ${firstCenter-35} 118, ${firstCenter-35} 93, ${firstCenter} 85`} markerEnd={`url(#${forwardMarker})`} />
      : <path className="circle-return forward" d={`M ${lastCenter} 85 C ${lastCenter} 132, ${firstCenter} 132, ${firstCenter} 85`} markerEnd={`url(#${forwardMarker})`} />}
    {doubleCircular && values.length > 1 && <path className="circle-return reverse" d={`M ${firstCenter} 26 C ${firstCenter} 5, ${lastCenter} 5, ${lastCenter} 26`} markerEnd={`url(#${reverseMarker})`} />}

    {values.map((value,index) => <g className={`circle-node ${index===step%values.length?'active':''}`} key={`${value}-${index}`}>
      <rect x={center(index)-nodeSize/2} y="27" width={nodeSize} height={nodeSize} rx="7" />
      <text className="circle-value" x={center(index)} y="51" textAnchor="middle" dominantBaseline="middle">{value}</text>
      <text className="circle-pointer" x={center(index)} y="70" textAnchor="middle">{doubleCircular ? 'prev · next' : 'next'}</text>
    </g>)}
    <text className="circle-caption" x={width/2} y="153" textAnchor="middle">ÚLTIMO NODO → PRIMER NODO</text>
  </svg>;
}

function LinearVisual({ algorithm, step }) {
  const { values, type } = algorithm;
  if (!values.length) return <div className="empty-visual"><strong>∅</strong><span>Estructura vacía</span></div>;
  if (type === 'stack') {
    return <div className="stack-visual">{[...values].reverse().map((v, i) => (
      <div className={`data-cell wide ${i === step % values.length ? 'active' : ''}`} key={`${v}-${i}`}>
        <span>{v}</span>{i === 0 && <small>TOPE</small>}
      </div>
    ))}<div className="stack-base" /></div>;
  }
  if (type === 'circular') return <CircularListVisual algorithm={algorithm} step={step}/>;
  const linked = type === 'linked';
  const doubleLinked = algorithm.id === 'lista-doble';
  return <div className={`linear-visual ${type}`}>
    {values.map((value, index) => <div className="linear-unit" key={`${value}-${index}`}>
      <div className={`data-cell ${index === step % values.length ? 'active' : ''}`}>
        <span>{value}</span><small>{doubleLinked ? 'prev · next' : linked ? 'next' : index}</small>
      </div>
      {index < values.length - 1 && (doubleLinked
        ? <svg className="double-connector" viewBox="0 0 54 32" role="img" aria-label="Enlace hacia adelante y hacia atrás">
            <line className="forward" x1="2" y1="9" x2="47" y2="9"/>
            <path className="forward" d="M46 5 L52 9 L46 13"/>
            <line className="reverse" x1="52" y1="23" x2="7" y2="23"/>
            <path className="reverse" d="M8 19 L2 23 L8 27"/>
          </svg>
        : <span className="connector">{type === 'linked' ? '→' : type === 'queue' ? '›' : '—'}</span>)}
    </div>)}
  </div>;
}

const BINARY_POSITIONS = [
  [50,8],[28,30],[72,30],[16,54],[40,54],[60,54],[84,54],
  [7,81],[19,81],[32,81],[44,81],[56,81],[68,81],[81,81],[93,81],
];
const BINARY_EDGES = BINARY_POSITIONS.slice(1).map((_,index)=>[Math.floor((index+1-1)/2),index+1]);

function treeHeight(values, index) {
  if (index >= values.length || values[index] === undefined) return 0;
  return 1 + Math.max(treeHeight(values,index*2+1),treeHeight(values,index*2+2));
}

function BinaryTreeDiagram({ algorithm, step, displayValues = algorithm.values.slice(0,15), badges = null, kindLabel = null }) {
  const values = displayValues;
  const orderedTree = ['bst','avl','rojo-negro','splay-tree'].includes(algorithm.id);
  return <div className={`tree-canvas tree-${algorithm.id}`}>
    {kindLabel && <span className="tree-kind-label">{kindLabel}</span>}
    <svg className="edge-layer" aria-hidden="true">
      {BINARY_EDGES.filter(([,to])=>to<values.length).map(([from,to]) => <g key={`${from}-${to}`}>
        <line x1={`${BINARY_POSITIONS[from][0]}%`} y1={`${BINARY_POSITIONS[from][1]}%`} x2={`${BINARY_POSITIONS[to][0]}%`} y2={`${BINARY_POSITIONS[to][1]}%`} />
        {orderedTree && <text className="tree-edge-label" x={`${(BINARY_POSITIONS[from][0]+BINARY_POSITIONS[to][0])/2}%`} y={`${(BINARY_POSITIONS[from][1]+BINARY_POSITIONS[to][1])/2}%`}>{to===from*2+1?'L':'R'}</text>}
      </g>)}
    </svg>
    {BINARY_POSITIONS.map(([x,y],index) => values[index] !== undefined && <div key={index} className={`tree-node ${index>=7?'deep-node':''} ${index===step%values.length?'active':''} ${algorithm.id==='rojo-negro'?(index===0||index>=3?'black-node':'red-node'):''} ${algorithm.id==='expression-tree'&&index<3?'operator-node':''}`} style={{left:`${x}%`,top:`${y}%`}}>
      <span className="tree-value">{values[index]}</span>
      {badges?.[index] && <small className="tree-node-badge">{badges[index]}</small>}
    </div>)}
  </div>;
}

function NaryTreeDiagram({ algorithm, step }) {
  const values = algorithm.values.slice(0,10);
  const positions = [[50,8],[18,40],[50,40],[82,40],[7,80],[18,80],[29,80],[43,80],[57,80],[82,80]];
  const edges = [[0,1],[0,2],[0,3],[1,4],[1,5],[1,6],[2,7],[2,8],[3,9]];
  return <div className="tree-canvas nary-tree-canvas">
    <span className="tree-kind-label">{algorithm.id==='arbol-nario'?'MÁXIMO N HIJOS':'CANTIDAD LIBRE DE HIJOS'}</span>
    <svg className="edge-layer">{edges.filter(([,to])=>to<values.length).map(([from,to])=><line key={`${from}-${to}`} x1={`${positions[from][0]}%`} y1={`${positions[from][1]}%`} x2={`${positions[to][0]}%`} y2={`${positions[to][1]}%`}/>)}</svg>
    {positions.map(([x,y],index)=>values[index]!==undefined&&<div className={`tree-node nary-node ${index===step%values.length?'active':''}`} style={{left:`${x}%`,top:`${y}%`}} key={index}><span className="tree-value">{values[index]}</span><small className="tree-node-badge">{index===0?'ROOT':`CHILD ${index}`}</small></div>)}
  </div>;
}

function MultiwayTreeDiagram({ algorithm, step }) {
  const values = algorithm.values.slice(0,24);
  const groupCount = Math.ceil(values.length / 3);
  const groupBaseSize = Math.floor(values.length / groupCount);
  const largerGroups = values.length % groupCount;
  let groupCursor = 0;
  const groups = Array.from({ length: groupCount }, (_, index) => {
    const groupSize = groupBaseSize + (index < largerGroups ? 1 : 0);
    const group = values.slice(groupCursor, groupCursor + groupSize);
    groupCursor += groupSize;
    return group;
  });
  let startCursor = 0;
  const groupStarts = groups.map(group => {
    const start = startCursor;
    startCursor += group.length;
    return start;
  });
  const childX = groups.map((_, index) => ((index + .5) / groups.length) * 100);
  const rootKeys = groups.slice(1).map(group => group[0]);
  const frame = algorithm.animationFrame;
  const promotedKey = frame?.promotedKey;
  const promotionPending = ['insert','split','promote'].includes(frame?.treePhase) && promotedKey !== null && promotedKey !== undefined;
  const visibleRootKeys = promotionPending ? rootKeys.filter(key => String(key) !== String(promotedKey)) : rootKeys;
  const promotedLeaf = Math.max(0, groups.findIndex(group => String(group[0]) === String(promotedKey)));
  const activePosition = step % values.length;
  const activeGroup = Math.max(0, groupStarts.findIndex((start,index) => activePosition >= start && activePosition < start + groups[index].length));
  const nodeWidth = Math.min(17, 84 / groups.length);
  return <div className={`btree-visual ${algorithm.id} ${groups.length > 5 ? 'many-leaves' : ''}`}>
    <span className="tree-kind-label">{algorithm.id==='bplus-tree'?'DATOS SOLO EN HOJAS':algorithm.id==='bstar-tree'?'OCUPACIÓN MÍNIMA 2/3':'NODOS MULTICLAVE'}</span>
    <svg className="btree-edges">{childX.map((x,index)=><line key={index} x1="50%" y1="22%" x2={`${x}%`} y2="70%"/>)}</svg>
    <div className={`bnode root-bnode ${frame?.treePhase==='settled'?'promoting':''}`}><small>ROOT · SEPARADORES</small>{visibleRootKeys.join(' | ') || '·'}</div>
    {groups.map((group,index)=><div className={`bnode child-bnode ${index===activeGroup?'active':''} ${frame?.treePhase==='split'&&index===promotedLeaf?'splitting':''}`} style={{left:`${childX[index]}%`,width:`${nodeWidth}%`}} key={index}><small>{algorithm.id==='bplus-tree'?'HOJA':'NODO'}</small>{group.join(' | ')||'·'}</div>)}
    {algorithm.id==='bplus-tree' && groups.length > 1 && <svg className="bplus-leaf-chain"><defs><marker id="bplus-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z"/></marker></defs>{childX.slice(0,-1).map((x,index)=><line key={index} x1={`${x + nodeWidth / 2}%`} y1="50%" x2={`${childX[index+1] - nodeWidth / 2}%`} y2="50%" markerEnd="url(#bplus-arrow)"/>)}</svg>}
    {frame?.treePhase==='promote' && promotedKey !== null && promotedKey !== undefined && <span className="promoted-key" style={{left:`${childX[promotedLeaf]}%`}}><small>SUBE</small>{promotedKey}</span>}
    <div className="leaf-link">{algorithm.id==='bplus-tree'?'MÁX. 3 CLAVES POR HOJA · HOJAS ENLAZADAS →':algorithm.id==='bstar-tree'?'MÁX. 3 CLAVES · REDISTRIBUYE ANTES DE DIVIDIR':'MÁX. 3 CLAVES POR NODO · LOS SEPARADORES SUBEN'}</div>
  </div>;
}

function SegmentTreeDiagram({ algorithm, step }) {
  const leaves = algorithm.values.slice(0,4).map(Number);
  while (leaves.length<4) leaves.push(0);
  const values = [leaves.reduce((a,b)=>a+b,0),leaves[0]+leaves[1],leaves[2]+leaves[3],...leaves];
  const ranges = ['[0..3]','[0..1]','[2..3]','[0]','[1]','[2]','[3]'];
  return <BinaryTreeDiagram algorithm={algorithm} step={step} displayValues={values} badges={ranges} kindLabel="SUMAS POR RANGO"/>;
}

function MerkleTreeDiagram({ algorithm, step }) {
  const leaves = algorithm.values.slice(0,8).map(String);
  while (leaves.length<8) leaves.push('∅');
  const values = ['H(ROOT)','H(A)','H(B)','H(0+1)','H(2+3)','H(4+5)','H(6+7)',...leaves.map(value=>`H(${value})`)];
  const badges = ['MERKLE ROOT','HASH','HASH','HASH','HASH','HASH','HASH',...leaves];
  return <BinaryTreeDiagram algorithm={algorithm} step={7+(step%leaves.length)} displayValues={values} badges={badges} kindLabel="INTEGRIDAD POR HASHES"/>;
}

function FibonacciHeapDiagram({ algorithm, step }) {
  const values = algorithm.values.slice(0,9);
  const positions = [[12,22],[38,22],[64,22],[88,22],[12,68],[31,68],[45,68],[64,68],[88,68]];
  const edges = [[0,4],[1,5],[1,6],[2,7],[3,8]];
  return <div className="tree-canvas fibonacci-forest"><span className="tree-kind-label">BOSQUE DE ÁRBOLES · MIN: {Math.min(...values.map(Number))}</span><svg className="edge-layer">{edges.filter(([,to])=>to<values.length).map(([from,to])=><line key={`${from}-${to}`} x1={`${positions[from][0]}%`} y1={`${positions[from][1]}%`} x2={`${positions[to][0]}%`} y2={`${positions[to][1]}%`}/>)}</svg>{positions.map(([x,y],index)=>values[index]!==undefined&&<div className={`tree-node fib-node ${index===step%values.length?'active':''}`} style={{left:`${x}%`,top:`${y}%`}} key={index}><span className="tree-value">{values[index]}</span><small className="tree-node-badge">{index<3?'ROOT':'CHILD'}</small></div>)}</div>;
}

function SpatialTreeDiagram({ algorithm, step }) {
  const pointPositions = [[18,28],[66,18],[35,67],[78,72],[47,38],[12,82],[87,42],[58,88],[28,12],[72,54],[42,84],[91,16]];
  if (algorithm.id==='octree') return <div className="octree-visual"><span className="tree-kind-label">8 OCTANTES · ESPACIO 3D</span>{Array.from({length:8},(_,index)=><div className={`octant octant-${index}`} key={index}>{index+1}</div>)}{algorithm.values.slice(0,12).map((value,index)=><span className={`spatial-point ${index===step%algorithm.values.length?'active':''}`} style={{left:`${pointPositions[index][0]}%`,top:`${pointPositions[index][1]}%`}} key={`point-${index}`}>{value}</span>)}</div>;
  return <div className="quadtree-visual"><span className="tree-kind-label">4 CUADRANTES · ESPACIO 2D</span><div>NW</div><div>NE</div><div>SW</div><div>SE</div>{algorithm.values.slice(0,12).map((value,index)=><span className={`spatial-point ${index===step%algorithm.values.length?'active':''}`} style={{left:`${pointPositions[index][0]}%`,top:`${pointPositions[index][1]}%`}} key={`point-${index}`}>{value}</span>)}</div>;
}

function TreeVisual({ algorithm, step }) {
  const values = algorithm.values.slice(0,15);
  if (!values.length) return <div className="empty-visual"><strong>∅</strong><span>Árbol vacío</span></div>;
  if (['arbol-general','arbol-nario'].includes(algorithm.id)) return <NaryTreeDiagram algorithm={algorithm} step={step}/>;
  if (algorithm.type==='btree') return <MultiwayTreeDiagram algorithm={algorithm} step={step}/>;
  if (algorithm.id==='segment-tree') return <SegmentTreeDiagram algorithm={algorithm} step={step}/>;
  if (algorithm.id==='merkle-tree') return <MerkleTreeDiagram algorithm={algorithm} step={step}/>;
  if (algorithm.id==='fibonacci-heap') return <FibonacciHeapDiagram algorithm={algorithm} step={step}/>;
  if (['quadtree','octree'].includes(algorithm.id)) return <SpatialTreeDiagram algorithm={algorithm} step={step}/>;

  const badges = values.map((_,index) => {
    if (algorithm.id==='avl') return `BF ${treeHeight(values,index*2+1)-treeHeight(values,index*2+2)}`;
    if (algorithm.id==='heap') return index===0?'MAX':`i=${index}`;
    if (algorithm.id==='kd-tree') return index===0||index===3||index===4||index===5||index===6?'eje X':'eje Y';
    if (algorithm.id==='splay-tree') return index===0?'ÚLTIMO ACCESO':'BST';
    if (algorithm.id==='expression-tree') return index<3?'OPERADOR':'OPERANDO';
    return null;
  });
  const labels = { avl:'ALTURA BALANCEADA', bst:'IZQUIERDA < RAÍZ < DERECHA', 'rojo-negro':'REGLAS DE COLOR', 'splay-tree':'ACCESO MOVIDO A LA RAÍZ', heap:'MAX-HEAP COMPLETO', 'kd-tree':'PARTICIÓN POR EJES', 'expression-tree':'OPERADORES Y OPERANDOS' };
  return <BinaryTreeDiagram algorithm={algorithm} step={step} badges={badges} kindLabel={labels[algorithm.id]}/>;
}

function GraphVisual({ algorithm, step }) {
  const nodes = [[14,24],[42,12],[72,20],[90,48],[72,76],[42,68],[14,76],[7,48]];
  const edges = (algorithm.edges ?? DEFAULT_GRAPH_EDGES).filter(([from,to])=>from<algorithm.values.length&&to<algorithm.values.length);
  const directed = algorithm.type === 'digraph';
  if (!algorithm.values.length) return <div className="empty-visual"><strong>∅</strong><span>Grafo vacío</span></div>;
  return <div className="graph-canvas"><svg className="edge-layer">
    <defs><marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" /></marker></defs>
    {edges.map(([a,b,w],i) => <g key={i}><line className={i <= step % edges.length ? 'visited-edge' : ''} x1={`${nodes[a][0]}%`} y1={`${nodes[a][1]}%`} x2={`${nodes[b][0]}%`} y2={`${nodes[b][1]}%`} markerEnd={directed ? 'url(#arrow)' : undefined}/>{algorithm.type === 'weighted' && <text x={`${(nodes[a][0]+nodes[b][0])/2}%`} y={`${(nodes[a][1]+nodes[b][1])/2}%`}>{w}</text>}</g>)}
  </svg>{nodes.slice(0,algorithm.values.length).map(([x,y],i) => <div className={`graph-node ${i === step % algorithm.values.length ? 'active' : ''}`} style={{left:`${x}%`,top:`${y}%`}} key={i}>{algorithm.values[i]}</div>)}</div>;
}

function FenwickVisual({ algorithm, step }) {
  const values = algorithm.values.slice(0,8).map(Number);
  const maximum = Math.max(...values,1);
  return <div className="fenwick-visual"><span className="tree-kind-label">BIT · CADA ÍNDICE GUARDA UN RANGO</span><div className="fenwick-bars">{values.map((value,index)=>{
    const bitIndex=index+1, start=bitIndex-(bitIndex&-bitIndex)+1;
    return <div className={`fenwick-column ${index===step%values.length?'active':''}`} key={index}><div className="fenwick-bar" style={{height:`${38+value/maximum*80}px`}}><strong>{value}</strong><small>[{start}..{bitIndex}]</small></div><span>i={bitIndex}</span></div>;
  })}</div></div>;
}

function TrieTreeVisual({ algorithm, step }) {
  const words = algorithm.values.map(value=>String(value).trim().toUpperCase()).filter(Boolean);
  const nodes = [{ id:0, letter:'∅', depth:0, parent:null, children:new Map(), endings:[] }];

  words.forEach(word => {
    let current = 0;
    [...word].forEach(letter => {
      if (!nodes[current].children.has(letter)) {
        const id = nodes.length;
        nodes[current].children.set(letter, id);
        nodes.push({ id, letter, depth:nodes[current].depth + 1, parent:current, children:new Map(), endings:[] });
      }
      current = nodes[current].children.get(letter);
    });
    nodes[current].endings.push(word);
  });

  let leafPosition = 0;
  const placeNode = id => {
    const children = [...nodes[id].children.values()];
    if (!children.length) {
      nodes[id].rawX = leafPosition++;
      return nodes[id].rawX;
    }
    const childPositions = children.map(placeNode);
    nodes[id].rawX = childPositions.reduce((sum,value)=>sum+value,0) / childPositions.length;
    return nodes[id].rawX;
  };
  placeNode(0);
  const leafCount = Math.max(1, leafPosition);
  const maximumDepth = Math.max(1, ...nodes.map(node=>node.depth));
  nodes.forEach(node => {
    node.x = leafCount === 1 ? 50 : 12 + (node.rawX / (leafCount - 1)) * 76;
    node.y = 9 + (node.depth / maximumDepth) * 76;
  });
  const activeWord = words.length ? words[step % words.length] : '';

  return <div className="trie-tree-canvas">
    <span className="tree-kind-label">PREFIJOS COMPARTIDOS</span>
    <svg className="trie-edge-layer" aria-hidden="true">
      {nodes.slice(1).map(node => {
        const parent = nodes[node.parent];
        return <line key={`edge-${node.id}`} x1={`${parent.x}%`} y1={`${parent.y}%`} x2={`${node.x}%`} y2={`${node.y}%`}/>;
      })}
    </svg>
    {nodes.map(node => <div className={`trie-tree-node ${node.id===0?'root':''} ${node.endings.length?'terminal':''} ${node.endings.includes(activeWord)?'active':''}`} style={{left:`${node.x}%`,top:`${node.y}%`}} key={node.id}>
      <strong>{node.letter}</strong>
      {node.endings.length > 0 && <small>FIN · {node.endings.join(', ')}</small>}
    </div>)}
    <div className="trie-legend"><i/> FIN indica el último nodo de una palabra</div>
  </div>;
}

function SpecialVisual({ algorithm, step }) {
  if (algorithm.type === 'queens') {
    const size = algorithm.values.length;
    const cellSize = size > 6 ? 34 : size > 4 ? 42 : 58;
    return <div className="chess-board" style={{gridTemplateColumns:`repeat(${size}, ${cellSize}px)`}}>{Array.from({length:size*size},(_,index) => {
      const row = Math.floor(index/size), column = index%size, hasQueen = algorithm.values[row]===column;
      return <div style={{width:cellSize,height:cellSize}} className={`${(row+column)%2?'dark':''} ${hasQueen?'queen':''} ${index===step?'current':''}`} key={index}>{hasQueen?'♛':''}</div>;
    })}</div>;
  }
  if (algorithm.type === 'maze') return <div className="maze-grid">{algorithm.values.slice(0,36).map((cell,index) => <div className={`${cell===1?'wall':''} ${cell===2?'path':''} ${cell===3?'backtracked':''} ${index===step?'current':''}`} key={index}>{index===0?'●':index===35?'◆':''}</div>)}</div>;
  if (algorithm.type === 'sudoku') return <div className="sudoku-grid">{algorithm.values.slice(0,81).map((number,index)=><div className={`${SUDOKU_START[index] ? 'given' : 'calculated'} ${index===step%81?'active':''}`} key={index}>{number || ''}</div>)}</div>;
  if (algorithm.type === 'hanoi') {
    const disks = algorithm.values.map(item => typeof item === 'object' ? item : { size:Number(item), rod:0 });
    return <div className="hanoi">{[0,1,2].map(rod => <div className="tower" key={rod} data-name={String.fromCharCode(65+rod)}>
      {disks.filter(disk=>disk.rod===rod).sort((a,b)=>b.size-a.size).map(disk=><i key={disk.size} style={{width:`${35+disk.size*9}px`}} className={disk.size===step?'active':''}/>) }
    </div>)}</div>;
  }
  if (algorithm.id === 'trie') return <TrieTreeVisual algorithm={algorithm} step={step}/>;
  if (algorithm.id === 'suffix-tree') { const text=algorithm.values.join(''); return <div className="suffix-visual"><span className="tree-kind-label">TODOS LOS SUFIJOS DE “{text}”</span><div className="suffix-root">ROOT</div><div className="suffix-branches">{Array.from({length:Math.min(5,text.length)},(_,index)=><div className={index===step%Math.min(5,text.length)?'active':''} key={index}><i/>{text.slice(index)}</div>)}</div></div>; }
  if (algorithm.type === 'hash' || algorithm.type === 'bloom') return <div className="hash-visual">{algorithm.values.map((v,i)=><div className={`hash-slot ${i===step%algorithm.values.length?'active':''}`} key={i}><small>{i.toString().padStart(2,'0')}</small><strong>{v}</strong></div>)}</div>;
  if (algorithm.type === 'recursion') return <div className="recursion-visual">{algorithm.values.slice(0,6).map((v,i)=><div className={i===step%6?'active':''} style={{transform:`translateX(${i*16}px)`}} key={i}><span>llamada {i}</span><strong>{v}</strong></div>)}</div>;
  return <LinearVisual algorithm={algorithm} step={step}/>;
}

function Visualizer({ algorithm, step }) {
  if (!algorithm.values.length) return <div className="empty-visual"><strong>∅</strong><span>Estructura vacía</span></div>;
  if (algorithm.id==='fenwick-tree') return <FenwickVisual algorithm={algorithm} step={step}/>;
  if (['tree','heap','btree'].includes(algorithm.type)) return <TreeVisual algorithm={algorithm} step={step}/>;
  if (['graph','digraph','weighted'].includes(algorithm.type)) return <GraphVisual algorithm={algorithm} step={step}/>;
  if (['array','stack','queue','linked','circular','sort','skip','union','cache'].includes(algorithm.type)) return <LinearVisual algorithm={algorithm} step={step}/>;
  return <SpecialVisual algorithm={algorithm} step={step}/>;
}

function Sidebar({ selected, onSelect, onHome, query, setQuery, mobileOpen, setMobileOpen, collapsed, onToggle }) {
  const filtered = useMemo(() => algorithms.filter(a => `${a.name} ${a.category}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
    <div className="brand">
      <button className="brand-home" onClick={()=>{onHome();setMobileOpen(false)}} aria-label="Ir a la bienvenida">
        <span className="brand-mark"><Boxes size={21}/></span>
        <span className="brand-copy"><strong>DSA Lab</strong><span>Algoritmos visuales</span></span>
      </button>
      <button className="sidebar-collapse-button" onClick={onToggle} aria-label="Ocultar menú lateral" title="Ocultar menú lateral"><PanelLeftClose size={18}/></button>
      <button className="close-mobile" onClick={()=>setMobileOpen(false)} aria-label="Cerrar"><X/></button>
    </div>
    <div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar algoritmo…"/></div>
    <nav>
      {categories.map(category => { const list = filtered.filter(a=>a.category===category); if (!list.length) return null; return <div className="nav-group" key={category}>
        <div className="nav-heading"><span>{category}</span><em>{String(list.length).padStart(2,'0')}</em></div>
        {list.map((a) => <button className={selected===a.id?'selected':''} onClick={()=>{onSelect(a.id);setMobileOpen(false)}} key={a.id}><span>{String(algorithms.indexOf(a)+1).padStart(2,'0')}</span>{a.name}</button>)}
      </div>})}
    </nav>
    <div className="sidebar-foot">
      <span><Sparkles size={14}/> 51 temas incluidos</span>
      <div className="author-credit"><small>Autor</small><strong>Juan Zúñiga Maluenda</strong></div>
      <div className="ucn-credit">
        <img src={ucnLogo} alt="Logo de la Universidad Católica del Norte"/>
        <div><strong>Universidad Católica del Norte</strong><small>Antofagasta · Chile</small></div>
      </div>
    </div>
  </aside>;
}

function OpeningIntro({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  const exitTimer = useRef(null);
  const finishTimer = useRef(null);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    exitTimer.current = window.setTimeout(() => setLeaving(true), 7200);
    finishTimer.current = window.setTimeout(() => onDoneRef.current(), 7850);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(exitTimer.current);
      window.clearTimeout(finishTimer.current);
    };
  }, []);

  const enterNow = () => {
    window.clearTimeout(exitTimer.current);
    window.clearTimeout(finishTimer.current);
    setLeaving(true);
    finishTimer.current = window.setTimeout(() => onDoneRef.current(), 620);
  };

  return <section className={`opening-intro ${leaving ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="opening-title">
    <div className="opening-surface">
      <header className="opening-header">
        <div><span className="opening-logo"><Boxes size={22}/></span><p><strong>DSA Lab</strong><small>Algoritmos visuales</small></p></div>
        <button type="button" onClick={enterNow}>Entrar ahora <ArrowRight size={15}/></button>
      </header>

      <div className="opening-content">
        <div className="opening-message">
          <span className="opening-kicker"><Sparkles size={14}/> Inspirada en aprender mejor</span>
          <h1 id="opening-title"><span>Comprender es más fácil</span><span>cuando puedes verlo.</span></h1>
          <p>Esta página fue creada para mejorar el aprendizaje de los estudiantes: permite visualizar cada paso, experimentar con las estructuras y realizar sus propios algoritmos de una manera más sencilla.</p>
        </div>

        <div className="opening-journey" aria-hidden="true">
          <div><span><Play size={17}/></span><p><small>01</small><strong>Visualiza</strong><em>Observa qué ocurre en cada paso.</em></p></div>
          <div><span><BookOpen size={17}/></span><p><small>02</small><strong>Comprende</strong><em>Relaciona la animación con Java.</em></p></div>
          <div><span><Boxes size={17}/></span><p><small>03</small><strong>Crea</strong><em>Construye tus propios algoritmos.</em></p></div>
        </div>
      </div>

      <footer className="opening-footer"><span>Preparando tu espacio de aprendizaje</span><div><i/></div><small>El límite es tu imaginación</small></footer>
    </div>
  </section>;
}

function Welcome({ onStart }) {
  return <div className="welcome-page">
    <section className="welcome-hero">
      <div className="welcome-copy">
        <div className="eyebrow"><span>Bienvenido a DSA Lab</span><i>Aprende practicando</i></div>
        <h1>Algoritmos que puedes ver, tocar y entender.</h1>
        <p>Esta página es un laboratorio educativo creado para visualizar estructuras de datos y algoritmos de una manera más sencilla. Los alumnos pueden modificar ejemplos, reproducir cada ejecución paso a paso y usar el código Java como punto de apoyo para comprender, practicar y desarrollar sus propios algoritmos.</p>
        <button className="welcome-start" onClick={onStart}><Play size={17}/> Comenzar con Array <ArrowRight size={16}/></button>
        <p className="welcome-motto"><Sparkles size={15}/><strong>El límite es tu imaginación.</strong> Tú puedes.</p>
      </div>
      <div className="welcome-demo" aria-hidden="true">
        <span className="welcome-orbit orbit-one"/>
        <span className="welcome-orbit orbit-two"/>
        <div className="welcome-root"><Boxes size={30}/><small>DSA</small></div>
        <div className="welcome-node node-array">ARRAY</div>
        <div className="welcome-node node-tree">TREE</div>
        <div className="welcome-node node-graph">GRAPH</div>
        <div className="welcome-node node-code">JAVA</div>
      </div>
    </section>

    <section className="welcome-about" aria-labelledby="welcome-about-title">
      <div className="welcome-section-heading">
        <span>Sobre este proyecto</span>
        <h2 id="welcome-about-title">Un espacio para experimentar sin miedo a equivocarse</h2>
        <p>Cada tema combina una representación visual, controles interactivos y código sencillo. El objetivo es que los alumnos entiendan qué ocurre internamente y dispongan de una base clara desde la cual puedan construir sus propios algoritmos.</p>
      </div>
      <div className="welcome-features">
        <article><span>01</span><Sparkles size={21}/><h3>51 temas visuales</h3><p>Desde arrays y listas hasta árboles, grafos, recursividad y backtracking.</p></article>
        <article><span>02</span><Play size={21}/><h3>Práctica interactiva</h3><p>Agrega, elimina, busca y recorre elementos mientras observas cada cambio.</p></article>
        <article><span>03</span><BookOpen size={21}/><h3>Java para principiantes</h3><p>Código directo y legible, pensado para estudiantes que están comenzando.</p></article>
      </div>
    </section>

    <section className="welcome-path">
      <div><small>Paso 1</small><strong>Elige un tema</strong><p>Usa el menú lateral para entrar a cualquier estructura o algoritmo.</p></div>
      <ArrowRight size={18}/>
      <div><small>Paso 2</small><strong>Ejecuta una función</strong><p>Completa los campos y pulsa una operación para modificar el ejemplo.</p></div>
      <ArrowRight size={18}/>
      <div><small>Paso 3</small><strong>Observa y aprende</strong><p>Compara la animación con las líneas destacadas del código Java.</p></div>
    </section>
  </div>;
}

function BugReporter({ section }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState({ title:'', type:'Algo no funciona', description:'', steps:'' });

  useEffect(() => {
    if (!open) return undefined;
    const closeWithEscape = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeWithEscape);
    return () => window.removeEventListener('keydown', closeWithEscape);
  }, [open]);

  const update = (field, value) => setReport(current=>({...current,[field]:value}));
  const submit = event => {
    event.preventDefault();
    const body = `## Sección afectada\n${section}\n\n## Tipo de problema\n${report.type}\n\n## Descripción\n${report.description.trim()}\n\n## Pasos para reproducirlo\n${report.steps.trim() || 'No especificados.'}\n\n---\nReporte generado desde DSA Lab.`;
    const issueUrl = `https://github.com/juanideus/DATA-STRUCTURS/issues/new?title=${encodeURIComponent(`[Bug] ${report.title.trim()}`)}&body=${encodeURIComponent(body)}`;
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
    setOpen(false);
    setReport({ title:'', type:'Algo no funciona', description:'', steps:'' });
  };

  return <>
    <button className="bug-fab" onClick={()=>setOpen(true)} aria-label="Informar un problema"><Bug size={20}/><span>Informar problema</span></button>
    {open && <div className="bug-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
      <section className="bug-modal" role="dialog" aria-modal="true" aria-labelledby="bug-dialog-title">
        <header><div className="bug-modal-icon"><Bug size={20}/></div><div><span>Ayúdanos a mejorar</span><h2 id="bug-dialog-title">¿Encontraste algo extraño?</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Cerrar reporte"><X size={18}/></button></header>
        <p className="bug-intro">Cuéntanos qué pasó y cómo podemos repetirlo. Con esos datos será mucho más fácil encontrar y corregir el problema.</p>
        <div className="bug-section-label"><small>Estabas viendo</small><strong>{section}</strong></div>
        <form onSubmit={submit}>
          <label><span>Resumen corto</span><input required maxLength="90" value={report.title} onChange={event=>update('title',event.target.value)} placeholder="Ej.: El botón eliminar no responde"/></label>
          <label><span>¿Qué tipo de problema es?</span><select value={report.type} onChange={event=>update('type',event.target.value)}><option>Algo no funciona</option><option>Se ve incorrecto</option><option>Problema en el código Java</option><option>Contenido difícil de entender</option><option>Otro problema</option></select></label>
          <label><span>Cuéntanos qué ocurrió</span><textarea required rows="4" value={report.description} onChange={event=>update('description',event.target.value)} placeholder="¿Qué hiciste, qué apareció y qué esperabas que ocurriera?"/></label>
          <label><span>¿Cómo podemos repetirlo?</span><textarea rows="3" value={report.steps} onChange={event=>update('steps',event.target.value)} placeholder={'1. Entré a la estructura...\n2. Presioné el botón...\n3. Entonces ocurrió...'}/></label>
          <div className="bug-form-actions"><p><ExternalLink size={13}/> Podrás revisar el reporte antes de publicarlo en GitHub.</p><button type="button" onClick={()=>setOpen(false)}>Ahora no</button><button type="submit">Revisar reporte <ExternalLink size={15}/></button></div>
        </form>
      </section>
    </div>}
  </>;
}

function App() {
  const [showOpeningIntro, setShowOpeningIntro] = useState(true);
  const [selectedId, setSelectedId] = useState('array');
  const [showWelcome, setShowWelcome] = useState(true);
  const [query, setQuery] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('dsa-sidebar-collapsed') === 'true');
  const [codeMode, setCodeMode] = useState('java');
  const [copied, setCopied] = useState(false);
  const codePanelRef = useRef(null);
  const baseAlgorithm = algorithms.find(a=>a.id===selectedId) || algorithms[0];
  const [activeOperation, setActiveOperation] = useState('add-start');
  const [operationFrames, setOperationFrames] = useState([]);
  const [activeCodeLine, setActiveCodeLine] = useState(null);
  const [demoValues, setDemoValues] = useState([...algorithms[0].values]);
  const [demoEdges, setDemoEdges] = useState(DEFAULT_GRAPH_EDGES.map(edge=>[...edge]));
  const [operationMessage, setOperationMessage] = useState('Usa los controles para modificar la estructura y observar el resultado.');
  const [operationStatus, setOperationStatus] = useState('idle');
  const algorithm = { ...baseAlgorithm, values: demoValues, edges: demoEdges };
  const selectedIndex = algorithms.findIndex(item => item.id === baseAlgorithm.id);
  const operationDefinition = getOperationDefinition(baseAlgorithm);
  const activeOperationLabel = operationDefinition.actions.find(item=>item.id===activeOperation)?.label ?? 'Operación';
  const displayedCode = codeMode === 'java' ? getBeginnerJava(baseAlgorithm, activeOperation) : baseAlgorithm.code;
  const codeLines = displayedCode.split('\n');
  const totalSteps = operationFrames.length || Math.max(algorithm.values.length, codeLines.length);
  const currentAnimationFrame = operationFrames[step] ?? null;

  useEffect(() => {
    window.localStorage.setItem('dsa-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const applyFrame = (frame, frameIndex) => {
    if (!frame) return;
    setDemoValues(copyVisualValues(frame.values));
    if (frame.edges) setDemoEdges(frame.edges.map(edge => [...edge]));
    setStep(frameIndex);
    setActiveCodeLine(frame.codeLine ?? null);
    setOperationMessage(frame.message);
  };

  useEffect(()=>{
    setDemoValues([...baseAlgorithm.values]);
    setDemoEdges(DEFAULT_GRAPH_EDGES.map(edge=>[...edge]));
    setActiveOperation(getOperationDefinition(baseAlgorithm).actions[0].id);
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage('Usa los controles para modificar la estructura y observar el resultado.');
    setOperationStatus('idle');
  },[selectedId]);
  useEffect(()=>{ window.scrollTo({ top: 0, behavior: 'auto' }); },[showWelcome, selectedId]);
  useEffect(()=>{ setStep(0); setPlaying(false); setCopied(false); setOperationFrames([]); setActiveCodeLine(null); },[selectedId, codeMode]);
  useEffect(()=>{
    if (!playing) return;
    if (step >= totalSteps - 1) { setPlaying(false); return; }
    const delay = (operationFrames[step]?.delayMs ?? NORMAL_FRAME_DELAY) / speed;
    const timer = window.setTimeout(() => {
      const nextStep = step + 1;
      if (operationFrames.length) applyFrame(operationFrames[nextStep], nextStep);
      else setStep(nextStep);
      if (nextStep >= totalSteps - 1) setPlaying(false);
    }, delay);
    return () => window.clearTimeout(timer);
  },[playing,step,speed,totalSteps,operationFrames]);
  useEffect(()=>{
    const panel = codePanelRef.current;
    const activeLine = panel?.querySelector('code.active');
    if (!panel || !activeLine) return;
    panel.scrollTo({ top: Math.max(0, activeLine.offsetTop - panel.clientHeight / 2), behavior: 'smooth' });
  },[activeCodeLine,step,displayedCode]);
  const selectRelative = (delta) => { const i=algorithms.findIndex(a=>a.id===algorithm.id); setSelectedId(algorithms[(i+delta+algorithms.length)%algorithms.length].id); setShowWelcome(false); };
  const openAlgorithm = id => { setSelectedId(id); setShowWelcome(false); };
  const resetDemo = () => {
    setDemoValues([...baseAlgorithm.values]);
    setDemoEdges(DEFAULT_GRAPH_EDGES.map(edge => [...edge]));
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage('Estructura restablecida a su estado inicial.');
    setOperationStatus('idle');
    setStep(0);
    setPlaying(false);
  };
  const createNewExample = () => {
    setDemoValues(createRandomValues(baseAlgorithm));
    setDemoEdges(baseAlgorithm.category === 'Grafos'
      ? DEFAULT_GRAPH_EDGES.map(([from, to]) => [from, to, randomNumber(1, 9)])
      : DEFAULT_GRAPH_EDGES.map(edge => [...edge]));
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage(`Se generó un nuevo ejemplo para ${baseAlgorithm.name}.`);
    setOperationStatus('idle');
    setStep(0);
    setPlaying(false);
  };
  const copyCode = async () => {
    await navigator.clipboard.writeText(displayedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  const handleOperation = (actionId, fields) => {
    setActiveOperation(actionId);
    const codeForAnimation = codeMode === 'java' ? getBeginnerJava(baseAlgorithm, actionId) : baseAlgorithm.code;
    const previousValues = copyVisualValues(demoValues);
    const previousEdges = demoEdges.map(edge => [...edge]);
    const result = executeOperation({ algorithm: baseAlgorithm, actionId, fields, values: demoValues, edges: demoEdges, initialValues: baseAlgorithm.values });
    const frames = result.frames?.length
      ? adaptFramesToCode(result.frames, codeForAnimation, codeMode === 'java')
      : createCodeSynchronizedFrames({
          code: codeForAnimation,
          actionId,
          beforeValues: previousValues,
          afterValues: result.values,
          beforeEdges: previousEdges,
          afterEdges: result.edges,
          finalStep: result.step,
          finalMessage: result.message,
          succeeded: result.ok !== false,
          inputValues: fields,
        });
    const firstFrame = frames[0];
    setOperationFrames(frames);
    setDemoValues(copyVisualValues(firstFrame.values));
    setDemoEdges((firstFrame.edges ?? result.edges).map(edge => [...edge]));
    setOperationMessage(firstFrame.message);
    setOperationStatus(result.ok === false ? 'error' : 'success');
    setActiveCodeLine(firstFrame.codeLine ?? 0);
    setStep(0);
    setPlaying(frames.length > 1);
  };
  const goToStep = requestedStep => {
    const nextStep = Math.max(0, Math.min(totalSteps - 1, requestedStep));
    if (operationFrames.length) applyFrame(operationFrames[nextStep], nextStep);
    else setStep(nextStep);
    setPlaying(false);
  };
  const togglePlayback = () => {
    if (playing) { setPlaying(false); return; }
    if (['sudoku','laberinto','n-reinas'].includes(baseAlgorithm.id) && operationFrames.length === 0) {
      handleOperation('solve', {});
      return;
    }
    if (step >= totalSteps - 1) goToStep(0);
    setPlaying(true);
  };

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    {showOpeningIntro && <OpeningIntro onDone={()=>setShowOpeningIntro(false)}/>}
    <Sidebar selected={showWelcome ? null : selectedId} onSelect={openAlgorithm} onHome={()=>{setShowWelcome(true);setPlaying(false)}} query={query} setQuery={setQuery} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(value=>!value)}/>
    {sidebarCollapsed && <button className="sidebar-reveal-button" onClick={()=>setSidebarCollapsed(false)} aria-label="Mostrar menú lateral" title="Mostrar menú lateral"><PanelLeftOpen size={20}/><span>Mostrar menú</span></button>}
    <main className="workspace">
      <button className="menu-button mobile-menu-button" onClick={()=>setMobileOpen(true)} aria-label="Abrir menú"><Menu/></button>

      {showWelcome ? <Welcome onStart={()=>openAlgorithm('array')}/> : <>

      <section className="hero">
        <div><div className="eyebrow"><span>{algorithm.category}</span><i>Práctica interactiva</i></div><h1>{algorithm.name}</h1><p>{algorithm.description}</p></div>
        <div className="complexity-card"><small>Complejidad</small><strong>{algorithm.complexity}</strong><div><Gauge size={16}/><span>Análisis asintótico</span></div></div>
      </section>

      <section className="lab-grid">
        <article className="panel visual-panel">
          <div className="panel-head"><div><span className="panel-index">01</span><h2>Visualización</h2></div><div className="panel-head-actions"><button onClick={createNewExample} title="Generar datos nuevos"><Shuffle size={15}/> Nuevo ejemplo</button><button onClick={resetDemo} title="Volver a los datos originales"><RotateCcw size={15}/> Restablecer</button></div></div>
          <div className="canvas-grid"><Visualizer algorithm={{...algorithm, animationFrame: currentAnimationFrame}} step={operationFrames.length ? currentAnimationFrame?.position ?? step : step}/><div className={`step-badge ${currentAnimationFrame?.iteration != null ? 'loop-step' : ''}`}>{currentAnimationFrame?.loopExit ? <>Fin <b>bucle</b></> : currentAnimationFrame?.iteration != null ? <>Iteración <b>{Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)}/{currentAnimationFrame.totalIterations}</b></> : <>Paso <b>{String(step+1).padStart(2,'0')}</b></>}</div></div>
          <OperationsPanel algorithm={baseAlgorithm} message={operationMessage} status={operationStatus} activeOperation={activeOperation} onAction={handleOperation}/>
          <div className="player"><button onClick={()=>goToStep(step-1)} aria-label="Anterior"><ArrowLeft size={17}/></button><button className="play" onClick={togglePlayback}>{playing?<Pause size={18}/>:<Play size={18}/>}<span>{playing?'Pausar':'Reproducir'}</span></button><button onClick={()=>goToStep(step+1)} aria-label="Siguiente"><ArrowRight size={17}/></button><div className="timeline"><span style={{width:`${((step+1)/totalSteps)*100}%`}}/></div><label><span>Velocidad</span><select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><ChevronDown size={13}/></label></div>
        </article>

        <article className="panel code-panel">
          <div className="panel-head code-head">
            <div><span className="panel-index">02</span><h2>{codeMode === 'java' ? activeOperationLabel : 'Pseudocódigo'}</h2></div>
            <div className="code-actions">
              <div className="code-tabs" aria-label="Formato de código">
                <button className={codeMode === 'java' ? 'active' : ''} onClick={()=>setCodeMode('java')}>Java</button>
                <button className={codeMode === 'pseudo' ? 'active' : ''} onClick={()=>setCodeMode('pseudo')}>Pseudocódigo</button>
              </div>
              <button className="copy-button" onClick={copyCode}>{copied ? 'Copiado' : 'Copiar'}</button>
            </div>
          </div>
          <pre ref={codePanelRef}>{codeLines.map((line,i)=><code className={i===(activeCodeLine ?? step%codeLines.length)?'active':''} key={i}><i>{String(i+1).padStart(2,'0')}</i>{line || ' '}</code>)}</pre>
          <VariablesPanel frame={currentAnimationFrame} algorithm={algorithm} step={step} playing={playing}/>
          <div className="note"><CircleHelp size={17}/><p><strong>{codeMode === 'java' ? `Java básico · ${activeOperationLabel}` : '¿Qué ocurre aquí?'}</strong><span>{codeMode === 'java' ? currentAnimationFrame?.iteration != null ? `El ciclo está en la iteración ${Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)} de ${currentAnimationFrame.totalIterations}. La línea iluminada y el elemento activo avanzan juntos.` : 'El código usa variables, arreglos, ciclos, condiciones y métodos pequeños. Cada línea iluminada corresponde al cambio mostrado en la estructura.' : step === 0 ? 'Se prepara el estado inicial y la estructura auxiliar.' : step >= totalSteps-1 ? 'El algoritmo completa la operación y devuelve el resultado.' : `Se procesa el elemento activo del paso ${step+1} y se actualiza el estado.`}</span></p></div>
        </article>
      </section>

      <EducationalDescription algorithm={algorithm}/>

      <section className="learning-strip"><div><BookOpen size={18}/><span><b>{categoryLabels[algorithm.category]}</b> · {algorithm.name}</span></div></section>
      <footer className="algorithm-nav"><button onClick={()=>selectRelative(-1)}><ArrowLeft size={16}/><span><small>Anterior</small>{algorithms[(selectedIndex-1+algorithms.length)%algorithms.length].name}</span></button><button onClick={()=>selectRelative(1)}><span><small>Siguiente</small>{algorithms[(selectedIndex+1)%algorithms.length].name}</span><ArrowRight size={16}/></button></footer>
      </>}
    </main>
    <BugReporter section={showWelcome ? 'Bienvenida' : algorithm.name}/>
    {mobileOpen && <button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Cerrar menú"/>}
  </div>;
}

export default App;
