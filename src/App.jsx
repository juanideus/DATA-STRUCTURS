import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Boxes, Bug, ChevronDown, CircleHelp, ClipboardCopy, ExternalLink, Gauge,
  MapPin, Menu, PanelLeftClose, PanelLeftOpen, Pause, Play, RotateCcw, Search, Shuffle, Sparkles, X,
} from 'lucide-react';
import { algorithms, categories, categoryLabels } from './data/algorithms.js';
import { getBeginnerJava } from './data/beginnerJava.js';
import { getGraphDesign, graphEdgesFor, graphPositionsFor } from './data/graphDesigns.js';
import OperationsPanel from './components/OperationsPanel.jsx';
import VariablesPanel from './components/VariablesPanel.jsx';
import { adaptFramesToCode, copyVisualValues, createCodeSynchronizedFrames } from './logic/codeAnimation.js';
import { DEFAULT_GRAPH_EDGES, DEFAULT_GRAPH_POSITIONS, executeOperation, getOperationDefinition, operationGroup } from './logic/operations.js';
import { createRandomPathMap, DEFAULT_PATH_MAP } from './logic/pathfindingMap.js';

const EducationalDescription = lazy(() => import('./components/EducationalDescription.jsx'));

const SUDOKU_START = [
  5,3,0,0,7,0,0,0,0, 6,0,0,1,9,5,0,0,0, 0,9,8,0,0,0,0,6,0,
  8,0,0,0,6,0,0,0,3, 4,0,0,8,0,3,0,0,1, 7,0,0,0,2,0,0,0,6,
  0,6,0,0,0,0,2,8,0, 0,0,0,4,1,9,0,0,5, 0,0,0,0,8,0,0,7,9,
];

const NORMAL_FRAME_DELAY = 800;
const STORAGE_KEYS = {
  introSeen: 'dsa-intro-seen',
  selectedAlgorithm: 'dsa-selected-algorithm',
  speed: 'dsa-playback-speed',
  codeMode: 'dsa-code-mode',
};

const readPreference = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const writePreference = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // La aplicación continúa sin persistencia si el navegador bloquea el almacenamiento.
  }
};

const algorithmIdFromHash = () => {
  if (typeof window === 'undefined') return null;
  try {
    const candidate = decodeURIComponent(window.location.hash.replace(/^#\/?/, '').trim());
    return algorithms.some(item => item.id === candidate) ? candidate : null;
  } catch {
    return null;
  }
};

const initialAlgorithmId = () => {
  const routed = algorithmIdFromHash();
  const stored = readPreference(STORAGE_KEYS.selectedAlgorithm, 'array');
  return routed ?? (algorithms.some(item => item.id === stored) ? stored : 'array');
};

const randomNumber = (minimum, maximum) => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
const usesNodeGraph = algorithm => algorithm.category === 'Grafos' && !['dijkstra', 'a-star'].includes(algorithm.id);
const positionsForAlgorithm = (algorithm, jitter = false) => (
  usesNodeGraph(algorithm) ? graphPositionsFor(algorithm.id, jitter) : DEFAULT_GRAPH_POSITIONS.map(position => [...position])
);
const edgesForAlgorithm = (algorithm, randomizeWeights = false) => (
  usesNodeGraph(algorithm)
    ? graphEdgesFor(algorithm.id, randomizeWeights && algorithm.type === 'weighted')
    : DEFAULT_GRAPH_EDGES.map(edge => [...edge])
);

function shortenEdge(from, to, startPadding = 22, endPadding = 22, width = 620, height = 300) {
  const deltaX = (to[0] - from[0]) * width / 100;
  const deltaY = (to[1] - from[1]) * height / 100;
  const distance = Math.hypot(deltaX, deltaY) || 1;
  const unitX = deltaX / distance;
  const unitY = deltaY / distance;
  return {
    x1: from[0] + unitX * startPadding / width * 100,
    y1: from[1] + unitY * startPadding / height * 100,
    x2: to[0] - unitX * endPadding / width * 100,
    y2: to[1] - unitY * endPadding / height * 100,
  };
}

function TreeEdge({ from, to, label = null, startPadding = 21, endPadding = 21, width = 620 }) {
  const edge = shortenEdge(from, to, startPadding, endPadding, width, 300);
  const middleX = (edge.x1 + edge.x2) / 2;
  const middleY = (edge.y1 + edge.y2) / 2;
  return <g>
    <line x1={`${edge.x1}%`} y1={`${edge.y1}%`} x2={`${edge.x2}%`} y2={`${edge.y2}%`} />
    {label && <text className="tree-edge-label" x={`${middleX}%`} y={`${middleY}%`}>{label}</text>}
  </g>;
}

function LinearConnector({ variant }) {
  const isDouble = variant === 'double';
  const isBidirectional = variant === 'bidirectional';
  return <svg className={`linear-connector ${variant}`} viewBox="0 0 56 34" aria-hidden="true" focusable="false">
    {isDouble ? <>
      <path className="connector-line forward" d="M3 10 H49"/>
      <path className="connector-head forward" d="M43 5 L51 10 L43 15"/>
      <path className="connector-line reverse" d="M53 24 H7"/>
      <path className="connector-head reverse" d="M13 19 L5 24 L13 29"/>
    </> : isBidirectional ? <>
      <path className="connector-line forward" d="M6 17 H50"/>
      <path className="connector-head forward" d="M43 11 L51 17 L43 23"/>
      <path className="connector-head reverse" d="M13 11 L5 17 L13 23"/>
    </> : <>
      <path className="connector-line forward" d="M5 17 H50"/>
      {variant === 'forward' && <path className="connector-head forward" d="M43 11 L51 17 L43 23"/>}
      {variant === 'rail' && <><circle cx="5" cy="17" r="2.2"/><circle cx="51" cy="17" r="2.2"/></>}
    </>}
  </svg>;
}

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

  return <div className="circular-scroll" role="img" aria-label={doubleCircular ? 'Lista doble circular' : 'Lista circular simple'}>
  <svg className="circular-list-visual" viewBox={`0 0 ${width} 160`} style={{ width: `${width}px` }} aria-hidden="true">
    <defs>
      <marker id={forwardMarker} viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" /></marker>
      <marker id={reverseMarker} viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" /></marker>
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
    <text className="circle-caption" x={width/2} y="153" textAnchor="middle">{doubleCircular ? 'NEXT: ÚLTIMO → PRIMERO  ·  PREV: PRIMERO → ÚLTIMO' : 'NEXT: ÚLTIMO NODO → PRIMER NODO'}</text>
  </svg>
  </div>;
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
  const connectorVariant = doubleLinked ? 'double'
    : algorithm.id === 'deque' ? 'bidirectional'
      : ['linked','queue','skip'].includes(type) ? 'forward' : 'rail';
  const cellHint = index => {
    if (doubleLinked) return 'prev · next';
    if (linked) return index === values.length - 1 ? 'next: null' : 'next';
    if (algorithm.id === 'cola') return index === 0 ? 'FRENTE' : index === values.length - 1 ? 'FINAL' : index;
    if (algorithm.id === 'deque') return index === 0 ? 'INICIO' : index === values.length - 1 ? 'FINAL' : index;
    return index;
  };
  return <div className={`linear-visual ${type}`} role="img" aria-label={`Visualización de ${algorithm.name}`}>
    {values.map((value, index) => <div className="linear-unit" key={`${value}-${index}`}>
      <div className={`data-cell ${index === 0 ? 'first-cell' : ''} ${index === values.length - 1 ? 'last-cell' : ''} ${index === step % values.length ? 'active' : ''}`}>
        <span>{value}</span><small>{cellHint(index)}</small>
      </div>
      {index < values.length - 1 && <LinearConnector variant={connectorVariant}/>}
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
      {BINARY_EDGES.filter(([,to])=>to<values.length).map(([from,to]) =>
        <TreeEdge key={`${from}-${to}`} from={BINARY_POSITIONS[from]} to={BINARY_POSITIONS[to]} label={orderedTree ? to===from*2+1?'L':'R' : null}/>
      )}
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
    <svg className="edge-layer" aria-hidden="true">{edges.filter(([,to])=>to<values.length).map(([from,to])=><TreeEdge key={`${from}-${to}`} from={positions[from]} to={positions[to]}/>)}</svg>
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
    <svg className="btree-edges" aria-hidden="true">{childX.map((x,index)=><TreeEdge key={index} from={[50,22]} to={[x,70]} startPadding={42} endPadding={27} width={720}/>)}</svg>
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
  return <div className="tree-canvas fibonacci-forest"><span className="tree-kind-label">BOSQUE DE ÁRBOLES · MIN: {Math.min(...values.map(Number))}</span><svg className="edge-layer" aria-hidden="true">{edges.filter(([,to])=>to<values.length).map(([from,to])=><TreeEdge key={`${from}-${to}`} from={positions[from]} to={positions[to]}/>)}</svg>{positions.map(([x,y],index)=>values[index]!==undefined&&<div className={`tree-node fib-node ${index===step%values.length?'active':''}`} style={{left:`${x}%`,top:`${y}%`}} key={index}><span className="tree-value">{values[index]}</span><small className="tree-node-badge">{index<3?'ROOT':'CHILD'}</small></div>)}</div>;
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

const CITY_MAP_WIDTH = 1000;
const CITY_MAP_HEIGHT = 510;

function mapNoise(seed, salt) {
  const value = Math.sin((seed % 100000 + salt * 91.73) * 0.0174533) * 43758.5453;
  return value - Math.floor(value);
}

function buildCityGeometry(map) {
  const horizontalSpace = (CITY_MAP_WIDTH - 70) / Math.max(1, map.columns - 1);
  const verticalSpace = (CITY_MAP_HEIGHT - 70) / Math.max(1, map.rows - 1);
  const points = map.cells.map((cell, index) => {
    const row = Math.floor(index / map.columns);
    const column = index % map.columns;
    const seed = map.seed ?? 1;
    return {
      index,
      row,
      column,
      cell,
      x: 35 + column * horizontalSpace + (mapNoise(seed, index * 2 + 1) - 0.5) * horizontalSpace * 0.44,
      y: 35 + row * verticalSpace + (mapNoise(seed, index * 2 + 2) - 0.5) * verticalSpace * 0.48,
    };
  });
  const streets = [];

  points.forEach((point) => {
    if (!Number.isFinite(point.cell.cost)) return;
    [[0, 1], [1, 0]].forEach(([rowDelta, columnDelta]) => {
      const nextRow = point.row + rowDelta;
      const nextColumn = point.column + columnDelta;
      if (nextRow >= map.rows || nextColumn >= map.columns) return;
      const nextIndex = nextRow * map.columns + nextColumn;
      if (!Number.isFinite(map.cells[nextIndex].cost)) return;
      const next = points[nextIndex];
      const bend = (mapNoise(map.seed ?? 1, point.index * 7 + nextIndex) - 0.5) * 12;
      streets.push({
        from: point.index,
        to: nextIndex,
        key: `${point.index}-${nextIndex}`,
        path: `M ${point.x.toFixed(1)} ${point.y.toFixed(1)} Q ${((point.x + next.x) / 2 + (rowDelta ? bend : 0)).toFixed(1)} ${((point.y + next.y) / 2 + (columnDelta ? bend : 0)).toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`,
        avenue: (point.row * 3 + point.column * 5) % 11 === 0,
      });
    });
  });

  const blocks = points.filter((point) => !Number.isFinite(point.cell.cost)).map((point) => ({
    ...point,
    width: 13 + mapNoise(map.seed ?? 1, point.index * 11) * 18,
    height: 9 + mapNoise(map.seed ?? 1, point.index * 13) * 15,
    rotation: (mapNoise(map.seed ?? 1, point.index * 17) - 0.5) * 24,
  }));

  return { points, streets, blocks };
}

function PathMapVisual({ algorithm }) {
  const map = algorithm.map ?? DEFAULT_PATH_MAP;
  const state = algorithm.animationFrame?.mapState;
  const geometry = useMemo(() => buildCityGeometry(map), [map]);
  const open = new Set(state?.open ?? []);
  const closed = new Set(state?.closed ?? []);
  const route = state?.path ?? [];
  const routeNodes = new Set(route);
  const routeEdges = new Set(route.slice(1).map((node, index) => {
    const previous = route[index];
    return previous < node ? `${previous}-${node}` : `${node}-${previous}`;
  }));
  const current = state?.current ?? null;
  const currentPoint = current == null ? null : geometry.points[current];
  const startPoint = geometry.points[map.start];
  const goalPoint = geometry.points[map.goal];
  const modeName = algorithm.id === 'a-star' ? 'A*' : 'Dijkstra';
  const mapId = `city-map-${algorithm.id}`;

  return <div className={`path-map-visual ${algorithm.id === 'a-star' ? 'is-astar' : ''}`} role="img" aria-label={`Mapa urbano para visualizar la búsqueda de rutas con ${modeName}`}>
    <div className="path-map-heading">
      <div>
        <span className="path-map-kicker"><i/> Simulación en vivo</span>
        <strong><MapPin size={15}/> Red urbana</strong>
      </div>
      <em>{algorithm.id === 'a-star' ? 'prioridad: f = g + h' : 'prioridad: menor distancia'}</em>
    </div>

    <svg className="path-map-city" viewBox={`0 0 ${CITY_MAP_WIDTH} ${CITY_MAP_HEIGHT}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <filter id={`${mapId}-soft-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="12" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`${mapId}-route-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id={`${mapId}-search-area`}>
          <stop offset="0%" stopColor="var(--map-search)" stopOpacity=".28"/>
          <stop offset="48%" stopColor="var(--map-search)" stopOpacity=".11"/>
          <stop offset="100%" stopColor="var(--map-search)" stopOpacity="0"/>
        </radialGradient>
      </defs>

      <g className="city-blocks">
        {geometry.blocks.map((block) => <rect
          className={block.cell.kind === 'water' ? 'water-block' : ''}
          key={`block-${block.index}`}
          x={block.x - block.width / 2}
          y={block.y - block.height / 2}
          width={block.width}
          height={block.height}
          rx="2"
          transform={`rotate(${block.rotation.toFixed(1)} ${block.x.toFixed(1)} ${block.y.toFixed(1)})`}
        />)}
      </g>

      <g className="city-road-shadow">
        {geometry.streets.map((street) => <path key={`shadow-${street.key}`} className={street.avenue ? 'avenue' : ''} d={street.path}/>)}
      </g>
      <g className="city-road-base">
        {geometry.streets.map((street) => <path key={`base-${street.key}`} className={street.avenue ? 'avenue' : ''} d={street.path}/>)}
      </g>

      {currentPoint && <circle className="path-search-area" cx={currentPoint.x} cy={currentPoint.y} r="122" fill={`url(#${mapId}-search-area)`}/>}

      <g className="city-road-explored">
        {geometry.streets.filter((street) => closed.has(street.from) && closed.has(street.to)).map((street) =>
          <path key={`explored-${street.key}`} d={street.path}/>)}
      </g>
      <g className="city-road-frontier">
        {geometry.streets.filter((street) => (
          (open.has(street.from) && closed.has(street.to))
          || (open.has(street.to) && closed.has(street.from))
        )).map((street) => <path key={`frontier-${street.key}`} d={street.path}/>)}
      </g>
      <g className="city-road-route" filter={`url(#${mapId}-route-glow)`}>
        {geometry.streets.filter((street) => routeEdges.has(street.key)).map((street) =>
          <path key={`route-${street.key}`} d={street.path}/>)}
      </g>

      <g className="city-intersections">
        {geometry.points.filter((point) => Number.isFinite(point.cell.cost) && point.index % 3 === 0).map((point) =>
          <circle key={`intersection-${point.index}`} cx={point.x} cy={point.y} r="1.35"/>)}
      </g>
      <g className="city-visited-points">
        {[...closed].filter((index) => index % 2 === 0).map((index) =>
          <circle key={`closed-${index}`} cx={geometry.points[index].x} cy={geometry.points[index].y} r="2.15"/>)}
      </g>
      <g className="city-frontier-points">
        {[...open].map((index) =>
          <circle key={`open-${index}`} cx={geometry.points[index].x} cy={geometry.points[index].y} r="3.1"/>)}
      </g>
      <g className="city-route-points">
        {[...routeNodes].map((index) =>
          <circle key={`route-node-${index}`} cx={geometry.points[index].x} cy={geometry.points[index].y} r="2.8"/>)}
      </g>

      {currentPoint && <g className="path-map-searcher" transform={`translate(${currentPoint.x} ${currentPoint.y})`} filter={`url(#${mapId}-soft-glow)`}>
        <path d="M -5 -8 L 9 0 L -5 8 L -1 0 Z"/>
      </g>}

      <g className="path-map-marker start-marker" transform={`translate(${startPoint.x} ${startPoint.y})`}>
        <circle r="10"/><circle r="3"/><text x="15" y="4">INICIO</text>
      </g>
      <g className="path-map-marker goal-marker" transform={`translate(${goalPoint.x} ${goalPoint.y})`}>
        <circle r="10"/><path d="M-3 -5 L5 -2 L-3 1 Z M-3 -5 V6"/><text x={goalPoint.x > 820 ? -15 : 15} y="4" textAnchor={goalPoint.x > 820 ? 'end' : 'start'}>META</text>
      </g>
    </svg>

    <div className="path-map-legend">
      <span><i className="legend-start"/>Inicio</span>
      <span><i className="legend-goal"/>Meta</span>
      <span><i className="legend-frontier"/>Frontera</span>
      <span><i className="legend-explored"/>Explorado</span>
      <span><i className="legend-route"/>Ruta óptima</span>
    </div>
    <div className="path-map-summary">
      {state ? <>
        <span><small>Exploradas</small><b>{closed.size}</b></span>
        <span><small>Frontera</small><b>{open.size}</b></span>
        <span><small>{route.length > 0 ? 'Costo final' : 'Estado'}</small><b>{route.length > 0 ? state.cost : 'Buscando'}</b></span>
      </> : <span className="path-map-empty"><small>Listo para comenzar</small><b>Ejecuta {modeName} para iluminar la búsqueda</b></span>}
    </div>
  </div>;
}

function GraphVisual({ algorithm, step }) {
  const design = getGraphDesign(algorithm.id);
  const nodes = (algorithm.positions ?? design.positions).slice(0,algorithm.values.length);
  const edges = (algorithm.edges ?? design.edges).filter(([from,to])=>from<algorithm.values.length&&to<algorithm.values.length);
  const directed = algorithm.type === 'digraph';
  const arrowMarker = `graph-arrow-${algorithm.id}`;
  const graphState = algorithm.animationFrame?.graphState;
  const edgeMatches = (edge, candidate) => candidate && (
    (edge[0] === candidate[0] && edge[1] === candidate[1]) ||
    (!directed && edge[0] === candidate[1] && edge[1] === candidate[0])
  );
  const labelsFor = indexes => indexes?.length ? indexes.map(index=>algorithm.values[index]).join(', ') : '∅';
  if (!algorithm.values.length) return <div className="empty-visual"><strong>∅</strong><span>Grafo vacío</span></div>;
  return <div className={`graph-canvas graph-design-${algorithm.id} ${graphState ? 'pathfinding-canvas' : ''}`} role="img" aria-label={`Grafo de ${algorithm.name}: ${design.caption}`}>
  <div className="graph-design-title"><span>{design.label}</span><small>{design.caption}</small></div>
  <div className="graph-design-motif" aria-hidden="true"><i/><i/><i/></div>
  <svg className="edge-layer" aria-hidden="true">
    <defs>
      {['default','visited','relaxed','path'].map(tone => <marker key={tone} id={`${arrowMarker}-${tone}`} viewBox="0 0 10 10" markerWidth="8" markerHeight="8" refX="9" refY="5" orient="auto" markerUnits="strokeWidth"><path className={`arrow-${tone}`} d="M0,0 L10,5 L0,10 z" /></marker>)}
    </defs>
    {edges.map(([a,b,w],i) => {
      const edge = [a,b];
      const className = graphState?.pathEdges?.some(candidate=>edgeMatches(edge,candidate)) ? 'path-edge'
        : edgeMatches(edge,graphState?.relaxedEdge) ? 'relaxed-edge'
          : graphState?.visitedEdges?.some(candidate=>edgeMatches(edge,candidate)) || (!graphState && i <= step % edges.length) ? 'visited-edge' : '';
      const points = shortenEdge(nodes[a], nodes[b], 23, directed ? 31 : 23);
      const markerTone = className === 'visited-edge' ? 'visited' : className === 'relaxed-edge' ? 'relaxed' : className === 'path-edge' ? 'path' : 'default';
      return <g key={i}><line className={`${className} edge-${i}`.trim()} x1={`${points.x1}%`} y1={`${points.y1}%`} x2={`${points.x2}%`} y2={`${points.y2}%`} markerEnd={directed ? `url(#${arrowMarker}-${markerTone})` : undefined}/>{algorithm.type === 'weighted' && <text className="graph-weight" x={`${(nodes[a][0]+nodes[b][0])/2}%`} y={`${(nodes[a][1]+nodes[b][1])/2}%`}>{w}</text>}</g>;
    })}
  </svg>{nodes.slice(0,algorithm.values.length).map(([x,y],i) => {
    const isCurrent = graphState ? i === graphState.current : i === step % algorithm.values.length;
    const isPath = graphState?.path?.includes(i);
    const stateClass = isPath ? 'path-node' : graphState?.closed?.includes(i) ? 'closed-node' : graphState?.open?.includes(i) ? 'open-node' : '';
    const metric = graphState ? (graphState.mode === 'astar' ? `f=${graphState.scores[i]}` : `d=${graphState.distances[i]}`) : null;
    return <div className={`graph-node node-${i} ${i === 0 ? 'origin-node' : ''} ${isCurrent ? 'active' : ''} ${stateClass}`} style={{left:`${x}%`,top:`${y}%`}} key={i}><span>{algorithm.values[i]}</span><small>{metric ?? design.nodeMeta?.[i] ?? `v${i}`}</small></div>;
  })}
  {graphState && <div className="pathfinding-status">
    <span><i className="open-dot"/>Abiertos: <b>{labelsFor(graphState.open)}</b></span>
    <span><i className="closed-dot"/>Cerrados: <b>{labelsFor(graphState.closed)}</b></span>
    {graphState.mode === 'astar' && <em>f = g + h</em>}
  </div>}
  </div>;
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
    const state = algorithm.animationFrame?.hanoiState;
    const phaseLabels = {
      call: 'Entrando al método',
      base: 'Caso base · regresar',
      'first-call': 'Primera llamada recursiva',
      move: 'Mover el disco',
      'second-call': 'Segunda llamada recursiva',
    };
    return <div className="hanoi-scene">
      <div className={`hanoi-call-state phase-${state?.phase ?? 'idle'}`}>
        <span>{state ? phaseLabels[state.phase] : 'Torres preparadas'}</span>
        <strong>{state ? `hanoi(${state.activeDisk}, ${String.fromCharCode(65 + state.from)}, ${String.fromCharCode(65 + state.to)}, ${String.fromCharCode(65 + state.help)})` : 'Presiona Resolver para comenzar'}</strong>
        {state && <small>Profundidad {state.depth} · Movimiento {state.moveCount}/{state.totalMoves}</small>}
      </div>
      <div className="hanoi">{[0,1,2].map(rod => <div className={`tower ${state?.to === rod && state.phase === 'move' ? 'receiving' : ''}`} key={rod} data-name={String.fromCharCode(65+rod)}>
        {disks.filter(disk=>disk.rod===rod).sort((a,b)=>b.size-a.size).map(disk=><i
          key={disk.size}
          style={{width:`${35+disk.size*9}px`}}
          className={disk.size===step ? state?.phase === 'move' ? 'active moving' : 'active tracing' : ''}
          aria-label={`Disco ${disk.size} en torre ${String.fromCharCode(65 + rod)}`}
        />)}
      </div>)}</div>
    </div>;
  }
  if (algorithm.id === 'trie') return <TrieTreeVisual algorithm={algorithm} step={step}/>;
  if (algorithm.id === 'suffix-tree') { const text=algorithm.values.join(''); return <div className="suffix-visual"><span className="tree-kind-label">TODOS LOS SUFIJOS DE “{text}”</span><div className="suffix-root">ROOT</div><div className="suffix-branches">{Array.from({length:Math.min(5,text.length)},(_,index)=><div className={index===step%Math.min(5,text.length)?'active':''} key={index}><i/>{text.slice(index)}</div>)}</div></div>; }
  if (algorithm.type === 'hash' || algorithm.type === 'bloom') return <div className="hash-visual">{algorithm.values.map((v,i)=><div className={`hash-slot ${i===step%algorithm.values.length?'active':''}`} key={i}><small>{i.toString().padStart(2,'0')}</small><strong>{v}</strong></div>)}</div>;
  if (algorithm.type === 'recursion') return <div className="recursion-visual">{algorithm.values.slice(0,6).map((v,i)=><div className={i===step%6?'active':''} style={{transform:`translateX(${i*16}px)`}} key={i}><span>llamada {i}</span><strong>{v}</strong></div>)}</div>;
  return <LinearVisual algorithm={algorithm} step={step}/>;
}

function Visualizer({ algorithm, step }) {
  if (!algorithm.values.length) return <div className="empty-visual"><strong>∅</strong><span>Estructura vacía</span></div>;
  if (['dijkstra','a-star'].includes(algorithm.id)) return <PathMapVisual algorithm={algorithm}/>;
  if (algorithm.id==='fenwick-tree') return <FenwickVisual algorithm={algorithm} step={step}/>;
  if (['tree','heap','btree'].includes(algorithm.type)) return <TreeVisual algorithm={algorithm} step={step}/>;
  if (['graph','digraph','weighted'].includes(algorithm.type)) return <GraphVisual algorithm={algorithm} step={step}/>;
  if (['array','stack','queue','linked','circular','sort','skip','union','cache'].includes(algorithm.type)) return <LinearVisual algorithm={algorithm} step={step}/>;
  return <SpecialVisual algorithm={algorithm} step={step}/>;
}

const MemoizedVisualizer = memo(Visualizer);

function DescriptionFallback() {
  return <section className="description-loading" aria-label="Cargando descripción">
    <span/><div><i/><i/><i/></div>
  </section>;
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
        {list.map((a) => <button data-algorithm-id={a.id} className={selected===a.id?'selected':''} onClick={()=>{onSelect(a.id);setMobileOpen(false)}} key={a.id}><span>{String(algorithms.indexOf(a)+1).padStart(2,'0')}</span>{a.name}</button>)}
      </div>})}
    </nav>
    <div className="sidebar-foot">
      <span><Sparkles size={14}/> {algorithms.length} temas incluidos</span>
      <div className="author-credit"><small>Autor</small><strong>Juan Zúñiga Maluenda</strong></div>
      <p className="project-disclaimer">Proyecto académico independiente. No corresponde a un sitio oficial de la Universidad Católica del Norte.</p>
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

function Welcome({ onStart, startName }) {
  return <div className="welcome-page">
    <section className="welcome-hero">
      <div className="welcome-copy">
        <div className="eyebrow"><span>Bienvenido a DSA Lab</span><i>Aprende practicando</i></div>
        <h1>Algoritmos que puedes ver, tocar y entender.</h1>
        <p>Esta página es un laboratorio educativo creado para visualizar estructuras de datos y algoritmos de una manera más sencilla. Los alumnos pueden modificar ejemplos, reproducir cada ejecución paso a paso y usar el código Java como punto de apoyo para comprender, practicar y desarrollar sus propios algoritmos.</p>
        <button className="welcome-start" onClick={onStart}><Play size={17}/> Continuar con {startName} <ArrowRight size={16}/></button>
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
        <article><span>01</span><Sparkles size={21}/><h3>{algorithms.length} temas visuales</h3><p>Desde arrays y listas hasta árboles, grafos, recursividad y backtracking.</p></article>
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
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    const closeWithEscape = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeWithEscape);
    return () => window.removeEventListener('keydown', closeWithEscape);
  }, [open]);

  const update = (field, value) => setReport(current=>({...current,[field]:value}));
  const reportBody = () => `# [Bug] ${report.title.trim()}\n\n## Sección afectada\n${section}\n\n## Tipo de problema\n${report.type}\n\n## Descripción\n${report.description.trim()}\n\n## Pasos para reproducirlo\n${report.steps.trim() || 'No especificados.'}\n\n---\nReporte generado desde DSA Lab.`;
  const resetReport = () => {
    setOpen(false);
    setCopyStatus('');
    setReport({ title:'', type:'Algo no funciona', description:'', steps:'' });
  };
  const copyReport = async () => {
    if (!report.title.trim() || !report.description.trim()) {
      setCopyStatus('Completa el resumen y la descripción antes de copiar.');
      return;
    }
    try {
      await navigator.clipboard.writeText(reportBody());
      setCopyStatus('Reporte copiado. Puedes enviarlo por correo, chat o el medio que prefieras.');
    } catch {
      setCopyStatus('El navegador no permitió copiar. Selecciona el texto e inténtalo nuevamente.');
    }
  };
  const submit = event => {
    event.preventDefault();
    const body = reportBody().replace(/^# \[Bug\].*\n\n/, '');
    const issueUrl = `https://github.com/juanideus/DATA-STRUCTURS/issues/new?title=${encodeURIComponent(`[Bug] ${report.title.trim()}`)}&body=${encodeURIComponent(body)}`;
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
    resetReport();
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
          {copyStatus && <p className="bug-copy-status" role="status">{copyStatus}</p>}
          <div className="bug-form-actions"><p><ExternalLink size={13}/> Usa GitHub o copia el reporte para compartirlo sin una cuenta.</p><button type="button" onClick={()=>setOpen(false)}>Ahora no</button><button className="copy-report" type="button" onClick={copyReport}><ClipboardCopy size={15}/> Copiar reporte</button><button type="submit">Revisar en GitHub <ExternalLink size={15}/></button></div>
        </form>
      </section>
    </div>}
  </>;
}

function App() {
  const [startingId] = useState(initialAlgorithmId);
  const startingAlgorithm = algorithms.find(item => item.id === startingId) ?? algorithms[0];
  const [showOpeningIntro, setShowOpeningIntro] = useState(() => readPreference(STORAGE_KEYS.introSeen, 'false') !== 'true');
  const [selectedId, setSelectedId] = useState(startingAlgorithm.id);
  const [showWelcome, setShowWelcome] = useState(() => algorithmIdFromHash() === null);
  const [query, setQuery] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(() => {
    const stored = Number(readPreference(STORAGE_KEYS.speed, '1'));
    return [0.5, 1, 2].includes(stored) ? stored : 1;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readPreference('dsa-sidebar-collapsed', 'false') === 'true');
  const [codeMode, setCodeMode] = useState(() => readPreference(STORAGE_KEYS.codeMode, 'java') === 'pseudo' ? 'pseudo' : 'java');
  const [copied, setCopied] = useState(false);
  const codePanelRef = useRef(null);
  const baseAlgorithm = algorithms.find(a=>a.id===selectedId) || algorithms[0];
  const [activeOperation, setActiveOperation] = useState(() => getOperationDefinition(startingAlgorithm).actions[0].id);
  const [operationFrames, setOperationFrames] = useState([]);
  const [activeCodeLine, setActiveCodeLine] = useState(null);
  const [demoValues, setDemoValues] = useState(() => [...startingAlgorithm.values]);
  const [demoEdges, setDemoEdges] = useState(() => edgesForAlgorithm(startingAlgorithm));
  const [demoPositions, setDemoPositions] = useState(() => positionsForAlgorithm(startingAlgorithm));
  const [demoMap, setDemoMap] = useState(DEFAULT_PATH_MAP);
  const [operationMessage, setOperationMessage] = useState('Usa los controles para modificar la estructura y observar el resultado.');
  const [operationStatus, setOperationStatus] = useState('idle');
  const algorithm = useMemo(
    () => ({ ...baseAlgorithm, values: demoValues, edges: demoEdges, positions: demoPositions, map: demoMap }),
    [baseAlgorithm, demoValues, demoEdges, demoPositions, demoMap],
  );
  const hideCodePanel = ['dijkstra','a-star'].includes(baseAlgorithm.id);
  const selectedIndex = algorithms.findIndex(item => item.id === baseAlgorithm.id);
  const operationDefinition = getOperationDefinition(baseAlgorithm);
  const activeOperationLabel = operationDefinition.actions.find(item=>item.id===activeOperation)?.label ?? 'Operación';
  const javaOverview = operationGroup(baseAlgorithm) === 'list'
    ? `El código muestra la clase Node, head, tail, size y los enlaces next${baseAlgorithm.id.includes('doble') ? ' y prev' : ''}. La línea iluminada corresponde al cambio que se observa en la lista.`
    : 'El código usa variables, arreglos, ciclos, condiciones y métodos pequeños. Cada línea iluminada corresponde al cambio mostrado en la estructura.';
  const displayedCode = codeMode === 'java' ? getBeginnerJava(baseAlgorithm, activeOperation) : baseAlgorithm.code;
  const codeLines = displayedCode.split('\n');
  const totalSteps = operationFrames.length || Math.max(algorithm.values.length, codeLines.length);
  const currentAnimationFrame = operationFrames[step] ?? null;
  const visualAlgorithm = useMemo(
    () => ({ ...algorithm, animationFrame: currentAnimationFrame }),
    [algorithm, currentAnimationFrame],
  );

  useEffect(() => {
    writePreference('dsa-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  useEffect(() => {
    writePreference(STORAGE_KEYS.selectedAlgorithm, selectedId);
  }, [selectedId]);
  useEffect(() => {
    writePreference(STORAGE_KEYS.speed, String(speed));
  }, [speed]);
  useEffect(() => {
    writePreference(STORAGE_KEYS.codeMode, codeMode);
  }, [codeMode]);
  useEffect(() => {
    document.title = showWelcome ? 'DSA Lab — Algoritmos visuales' : `${baseAlgorithm.name} — DSA Lab`;
  }, [baseAlgorithm.name, showWelcome]);

  const applyFrame = (frame, frameIndex) => {
    if (!frame) return;
    setDemoValues(copyVisualValues(frame.values));
    if (frame.edges) setDemoEdges(frame.edges.map(edge => [...edge]));
    setStep(frameIndex);
    setActiveCodeLine(frame.codeLine ?? null);
    setOperationMessage(frame.message);
  };

  useEffect(()=>{ window.scrollTo({ top: 0, behavior: 'auto' }); },[showWelcome, selectedId]);
  useEffect(()=>{ setStep(0); setPlaying(false); setCopied(false); setOperationFrames([]); setActiveCodeLine(null); },[codeMode]);
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
    const isFastPathfindingTrace = playing && ['dijkstra','a-star'].includes(baseAlgorithm.id);
    const margin = isFastPathfindingTrace ? 4 : 28;
    const visibleTop = panel.scrollTop + margin;
    const visibleBottom = panel.scrollTop + panel.clientHeight - margin;
    const lineTop = activeLine.offsetTop;
    const lineBottom = lineTop + activeLine.offsetHeight;
    let target = null;
    if (lineTop < visibleTop) target = Math.max(0, lineTop - margin);
    else if (lineBottom > visibleBottom) target = Math.max(0, lineBottom - panel.clientHeight + margin);
    if (target === null) return;
    panel.scrollTo({ top: target, behavior: isFastPathfindingTrace ? 'auto' : 'smooth' });
  },[activeCodeLine,step,displayedCode,playing,baseAlgorithm.id]);
  const loadAlgorithm = id => {
    const nextAlgorithm = algorithms.find(item => item.id === id) ?? algorithms[0];
    setSelectedId(nextAlgorithm.id);
    setDemoValues([...nextAlgorithm.values]);
    setDemoEdges(edgesForAlgorithm(nextAlgorithm));
    setDemoPositions(positionsForAlgorithm(nextAlgorithm));
    setDemoMap(DEFAULT_PATH_MAP);
    setActiveOperation(getOperationDefinition(nextAlgorithm).actions[0].id);
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage('Usa los controles para modificar la estructura y observar el resultado.');
    setOperationStatus('idle');
    setStep(0);
    setPlaying(false);
    setCopied(false);
  };
  const selectRelative = (delta) => {
    const index = algorithms.findIndex(item=>item.id===algorithm.id);
    openAlgorithm(algorithms[(index+delta+algorithms.length)%algorithms.length].id);
  };
  const updateRoute = id => {
    const nextUrl = id
      ? `${window.location.pathname}${window.location.search}#/${encodeURIComponent(id)}`
      : `${window.location.pathname}${window.location.search}`;
    window.history.pushState({ dsaLab: id ?? 'welcome' }, '', nextUrl);
  };
  const openAlgorithm = (id, updateHistory = true) => {
    loadAlgorithm(id);
    setShowWelcome(false);
    if (updateHistory && algorithmIdFromHash() !== id) updateRoute(id);
  };
  const openWelcome = (updateHistory = true) => {
    setShowWelcome(true);
    setPlaying(false);
    if (updateHistory && window.location.hash) updateRoute(null);
  };
  useEffect(() => {
    const syncRoute = () => {
      const routedId = algorithmIdFromHash();
      if (routedId) openAlgorithm(routedId, false);
      else openWelcome(false);
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);
  const resetDemo = () => {
    setDemoValues([...baseAlgorithm.values]);
    setDemoEdges(edgesForAlgorithm(baseAlgorithm));
    setDemoPositions(positionsForAlgorithm(baseAlgorithm));
    setDemoMap(DEFAULT_PATH_MAP);
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage('Estructura restablecida a su estado inicial.');
    setOperationStatus('idle');
    setStep(0);
    setPlaying(false);
  };
  const createNewExample = () => {
    const nextValues = createRandomValues(baseAlgorithm);
    setDemoValues(nextValues);
    setDemoEdges(edgesForAlgorithm(baseAlgorithm, baseAlgorithm.category === 'Grafos'));
    setDemoPositions(positionsForAlgorithm(baseAlgorithm, usesNodeGraph(baseAlgorithm)));
    setDemoMap(['dijkstra','a-star'].includes(baseAlgorithm.id)
      ? createRandomPathMap(demoMap)
      : DEFAULT_PATH_MAP);
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage(['dijkstra','a-star'].includes(baseAlgorithm.id)
      ? `Se generó un mapa nuevo para ${baseAlgorithm.name}. Los puntos cambiaron de ubicación.`
      : `Se generó un nuevo ejemplo para ${baseAlgorithm.name}.`);
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
    if (actionId === 'reset' && ['dijkstra','a-star'].includes(baseAlgorithm.id)) {
      setDemoPositions(DEFAULT_GRAPH_POSITIONS.map(position=>[...position]));
      setDemoMap(DEFAULT_PATH_MAP);
    } else if (actionId === 'reset' && usesNodeGraph(baseAlgorithm)) {
      setDemoPositions(positionsForAlgorithm(baseAlgorithm));
    }
    const codeForAnimation = codeMode === 'java' ? getBeginnerJava(baseAlgorithm, actionId) : baseAlgorithm.code;
    const previousValues = copyVisualValues(demoValues);
    const previousEdges = demoEdges.map(edge => [...edge]);
    const result = executeOperation({
      algorithm: { ...baseAlgorithm, positions: demoPositions, map: actionId === 'reset' ? DEFAULT_PATH_MAP : demoMap },
      actionId,
      fields,
      values: demoValues,
      edges: demoEdges,
      initialValues: baseAlgorithm.values,
      initialEdges: edgesForAlgorithm(baseAlgorithm),
    });
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
  const finishOpeningIntro = () => {
    writePreference(STORAGE_KEYS.introSeen, 'true');
    setShowOpeningIntro(false);
  };

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    {showOpeningIntro && <OpeningIntro onDone={finishOpeningIntro}/>}
    <Sidebar selected={showWelcome ? null : selectedId} onSelect={openAlgorithm} onHome={openWelcome} query={query} setQuery={setQuery} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(value=>!value)}/>
    {sidebarCollapsed && <button className="sidebar-reveal-button" onClick={()=>setSidebarCollapsed(false)} aria-label="Mostrar menú lateral" title="Mostrar menú lateral"><PanelLeftOpen size={20}/><span>Mostrar menú</span></button>}
    <main className="workspace">
      <button className="menu-button mobile-menu-button" onClick={()=>setMobileOpen(true)} aria-label="Abrir menú"><Menu/></button>

      {showWelcome ? <Welcome onStart={()=>openAlgorithm(selectedId)} startName={baseAlgorithm.name}/> : <>

      <section className="hero">
        <div><div className="eyebrow"><span>{algorithm.category}</span><i>Práctica interactiva</i></div><h1>{algorithm.name}</h1><p>{algorithm.description}</p></div>
        <div className="complexity-card"><small>Complejidad</small><strong>{algorithm.complexity}</strong><div><Gauge size={16}/><span>Análisis asintótico</span></div></div>
      </section>

      <section className={`lab-grid ${hideCodePanel ? 'visual-only' : ''}`}>
        <article className="panel visual-panel">
          <div className="panel-head"><div><span className="panel-index">01</span><h2>Visualización</h2></div><div className="panel-head-actions"><button onClick={createNewExample} title="Generar datos nuevos"><Shuffle size={15}/> Nuevo ejemplo</button><button onClick={resetDemo} title="Volver a los datos originales"><RotateCcw size={15}/> Restablecer</button></div></div>
          <div className="canvas-grid" data-visualizer={algorithm.id}><MemoizedVisualizer algorithm={visualAlgorithm} step={operationFrames.length ? currentAnimationFrame?.position ?? step : step}/><div className={`step-badge ${currentAnimationFrame?.iteration != null ? 'loop-step' : ''}`}>{currentAnimationFrame?.loopExit ? <>Fin <b>bucle</b></> : currentAnimationFrame?.iteration != null ? <>Iteración <b>{Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)}/{currentAnimationFrame.totalIterations}</b></> : <>Paso <b>{String(step+1).padStart(2,'0')}</b></>}</div></div>
          <OperationsPanel algorithm={baseAlgorithm} message={operationMessage} status={operationStatus} activeOperation={activeOperation} onAction={handleOperation}/>
          {hideCodePanel && <VariablesPanel frame={currentAnimationFrame} algorithm={algorithm} step={step} playing={playing}/>}
          <div className="player"><button onClick={()=>goToStep(step-1)} aria-label="Anterior"><ArrowLeft size={17}/></button><button className="play" onClick={togglePlayback}>{playing?<Pause size={18}/>:<Play size={18}/>}<span>{playing?'Pausar':'Reproducir'}</span></button><button onClick={()=>goToStep(step+1)} aria-label="Siguiente"><ArrowRight size={17}/></button><div className="timeline"><span style={{width:`${((step+1)/totalSteps)*100}%`}}/></div><label><span>Velocidad</span><select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><ChevronDown size={13}/></label></div>
        </article>

        {!hideCodePanel && <article className="panel code-panel">
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
          <pre ref={codePanelRef}>{codeLines.map((line,i)=>{
            const isActive = i === (activeCodeLine ?? step%codeLines.length);
            const isHelperLabel = line.trim().startsWith('// Método auxiliar utilizado arriba:');
            return <code className={`${isActive?'active':''} ${isHelperLabel?'helper-method-label':''}`.trim()} key={i}><i>{String(i+1).padStart(2,'0')}</i>{line || ' '}</code>;
          })}</pre>
          <VariablesPanel frame={currentAnimationFrame} algorithm={algorithm} step={step} playing={playing}/>
          <div className="note"><CircleHelp size={17}/><p><strong>{codeMode === 'java' ? `Java básico · ${activeOperationLabel}` : '¿Qué ocurre aquí?'}</strong><span>{codeMode === 'java' ? currentAnimationFrame?.iteration != null ? `El ciclo está en la iteración ${Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)} de ${currentAnimationFrame.totalIterations}. La línea iluminada y el elemento activo avanzan juntos.` : javaOverview : step === 0 ? 'Se prepara el estado inicial y la estructura auxiliar.' : step >= totalSteps-1 ? 'El algoritmo completa la operación y devuelve el resultado.' : `Se procesa el elemento activo del paso ${step+1} y se actualiza el estado.`}</span></p></div>
        </article>}
      </section>

      <Suspense fallback={<DescriptionFallback/>}><EducationalDescription algorithm={algorithm}/></Suspense>

      <section className="learning-strip"><div><BookOpen size={18}/><span><b>{categoryLabels[algorithm.category]}</b> · {algorithm.name}</span></div></section>
      <footer className="algorithm-nav"><button onClick={()=>selectRelative(-1)}><ArrowLeft size={16}/><span><small>Anterior</small>{algorithms[(selectedIndex-1+algorithms.length)%algorithms.length].name}</span></button><button onClick={()=>selectRelative(1)}><span><small>Siguiente</small>{algorithms[(selectedIndex+1)%algorithms.length].name}</span><ArrowRight size={16}/></button></footer>
      </>}
    </main>
    <BugReporter section={showWelcome ? 'Bienvenida' : algorithm.name}/>
    {mobileOpen && <button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Cerrar menú"/>}
  </div>;
}

export default App;
