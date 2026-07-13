import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Boxes, ChevronDown, CircleHelp, Gauge,
  Menu, Pause, Play, RotateCcw, Search, Shuffle, Sparkles, X,
} from 'lucide-react';
import { algorithms, categories, categoryLabels } from './data/algorithms.js';
import { getBeginnerJava } from './data/beginnerJava.js';
import OperationsPanel from './components/OperationsPanel.jsx';
import { DEFAULT_GRAPH_EDGES, executeOperation, getOperationDefinition } from './logic/operations.js';
import ucnLogo from './assets/LogoUCN.png';

const SUDOKU_START = [
  5,3,0,0,7,0,0,0,0, 6,0,0,1,9,5,0,0,0, 0,9,8,0,0,0,0,6,0,
  8,0,0,0,6,0,0,0,3, 4,0,0,8,0,3,0,0,1, 7,0,0,0,2,0,0,0,6,
  0,6,0,0,0,0,2,8,0, 0,0,0,4,1,9,0,0,5, 0,0,0,0,8,0,0,7,9,
];

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
  return <div className={`linear-visual ${type}`}>
    {values.map((value, index) => <div className="linear-unit" key={`${value}-${index}`}>
      <div className={`data-cell ${index === step % values.length ? 'active' : ''}`}>
        <span>{value}</span><small>{linked ? 'next' : index}</small>
      </div>
      {index < values.length - 1 && <span className="connector">{type === 'linked' ? '→' : type === 'queue' ? '›' : '—'}</span>}
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
  const values = algorithm.values.slice(0,9);
  const childX = [16,50,84];
  const perGroup = Math.max(1,Math.ceil(values.length/3));
  const groups = [values.slice(0,perGroup),values.slice(perGroup,perGroup*2),values.slice(perGroup*2)];
  const rootKeys = [groups[1][0],groups[2][0]].filter(value=>value!==undefined);
  const activeGroup = Math.min(2,Math.floor((step%values.length)/perGroup));
  return <div className={`btree-visual ${algorithm.id}`}>
    <span className="tree-kind-label">{algorithm.id==='bplus-tree'?'DATOS SOLO EN HOJAS':algorithm.id==='bstar-tree'?'OCUPACIÓN MÍNIMA 2/3':'NODOS MULTICLAVE'}</span>
    <svg className="btree-edges">{childX.map((x,index)=><line key={index} x1="50%" y1="22%" x2={`${x}%`} y2="70%"/>)}</svg>
    <div className="bnode root-bnode"><small>ROOT</small>{rootKeys.join(' | ')}</div>
    {groups.map((group,index)=><div className={`bnode child-bnode ${index===activeGroup?'active':''}`} style={{left:`${childX[index]}%`}} key={index}><small>{algorithm.id==='bplus-tree'?'LEAF':'NODE'}</small>{group.join(' | ')||'·'}</div>)}
    {algorithm.id==='bplus-tree' && <svg className="bplus-leaf-chain"><line x1="22%" y1="50%" x2="43%" y2="50%"/><line x1="57%" y1="50%" x2="78%" y2="50%"/></svg>}
    <div className="leaf-link">{algorithm.id==='bplus-tree'?'HOJAS ENLAZADAS →':algorithm.id==='bstar-tree'?'REDISTRIBUYE ANTES DE DIVIDIR':'CLAVES Y DATOS EN CADA NIVEL'}</div>
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
  if (algorithm.id === 'trie') return <div className="trie-visual"><span className="tree-kind-label">PREFIJOS COMPARTIDOS</span><div className="root-dot">∅</div><div className="word-path">{algorithm.values.map((v,i)=><span className={i===step%algorithm.values.length?'active':''} key={i}>{v}</span>)}</div><small>cada arista representa una letra</small></div>;
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

function Sidebar({ selected, onSelect, onHome, query, setQuery, mobileOpen, setMobileOpen }) {
  const filtered = useMemo(() => algorithms.filter(a => `${a.name} ${a.category}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
    <div className="brand">
      <button className="brand-home" onClick={()=>{onHome();setMobileOpen(false)}} aria-label="Ir a la bienvenida">
        <span className="brand-mark"><Boxes size={21}/></span>
        <span className="brand-copy"><strong>DSA Lab</strong><span>Algoritmos visuales</span></span>
      </button>
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

function Welcome({ onStart }) {
  return <div className="welcome-page">
    <section className="welcome-hero">
      <div className="welcome-copy">
        <div className="eyebrow"><span>BIENVENIDO A DSA LAB</span><i>APRENDE HACIENDO</i></div>
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
        <span>¿DE QUÉ TRATA ESTA PÁGINA?</span>
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
      <div><small>PASO 01</small><strong>Elige un tema</strong><p>Usa el menú lateral para entrar a cualquier estructura o algoritmo.</p></div>
      <ArrowRight size={18}/>
      <div><small>PASO 02</small><strong>Ejecuta una función</strong><p>Completa los campos y pulsa una operación para modificar el ejemplo.</p></div>
      <ArrowRight size={18}/>
      <div><small>PASO 03</small><strong>Observa y aprende</strong><p>Compara la animación con las líneas destacadas del código Java.</p></div>
    </section>
  </div>;
}

function App() {
  const [selectedId, setSelectedId] = useState('array');
  const [showWelcome, setShowWelcome] = useState(true);
  const [query, setQuery] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const algorithm = { ...baseAlgorithm, values: demoValues, edges: demoEdges };
  const selectedIndex = algorithms.findIndex(item => item.id === baseAlgorithm.id);
  const operationDefinition = getOperationDefinition(baseAlgorithm);
  const activeOperationLabel = operationDefinition.actions.find(item=>item.id===activeOperation)?.label ?? 'Operación';
  const displayedCode = codeMode === 'java' ? getBeginnerJava(baseAlgorithm, activeOperation) : baseAlgorithm.code;
  const codeLines = displayedCode.split('\n');
  const totalSteps = operationFrames.length || Math.max(algorithm.values.length, codeLines.length);

  const applyFrame = (frame, frameIndex) => {
    if (!frame) return;
    setDemoValues([...frame.values]);
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
  },[selectedId]);
  useEffect(()=>{ setStep(0); setPlaying(false); setCopied(false); setOperationFrames([]); setActiveCodeLine(null); },[selectedId, codeMode]);
  useEffect(()=>{
    if (!playing) return;
    if (step >= totalSteps - 1) { setPlaying(false); return; }
    const delay = operationFrames.length ? Math.max(90, speed / 4) : speed;
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
    const result = executeOperation({ algorithm: baseAlgorithm, actionId, fields, values: demoValues, edges: demoEdges, initialValues: baseAlgorithm.values });
    if (result.frames?.length) {
      setOperationFrames(result.frames);
      setDemoEdges(result.edges);
      setStep(0);
      setDemoValues([...result.frames[0].values]);
      setActiveCodeLine(result.frames[0].codeLine);
      setOperationMessage(result.frames[0].message);
      setPlaying(true);
      return;
    }
    setOperationFrames([]);
    setActiveCodeLine(null);
    setDemoValues(result.values);
    setDemoEdges(result.edges);
    setOperationMessage(result.message);
    setStep(result.step ?? 0);
    setPlaying(false);
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

  return <div className="app-shell">
    <Sidebar selected={showWelcome ? null : selectedId} onSelect={openAlgorithm} onHome={()=>{setShowWelcome(true);setPlaying(false)}} query={query} setQuery={setQuery} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
    <main className="workspace">
      <button className="menu-button mobile-menu-button" onClick={()=>setMobileOpen(true)} aria-label="Abrir menú"><Menu/></button>

      {showWelcome ? <Welcome onStart={()=>openAlgorithm('array')}/> : <>

      <section className="hero">
        <div><div className="eyebrow"><span>{algorithm.category}</span><i>INTERACTIVO</i></div><h1>{algorithm.name}</h1><p>{algorithm.description}</p></div>
        <div className="complexity-card"><small>Complejidad</small><strong>{algorithm.complexity}</strong><div><Gauge size={16}/><span>Análisis asintótico</span></div></div>
      </section>

      <section className="lab-grid">
        <article className="panel visual-panel">
          <div className="panel-head"><div><span className="panel-index">01</span><h2>Visualización</h2></div><button onClick={()=>goToStep(Math.floor(Math.random()*totalSteps))}><Shuffle size={15}/> Nuevo ejemplo</button></div>
          <div className="canvas-grid"><Visualizer algorithm={algorithm} step={operationFrames.length ? operationFrames[step]?.position ?? step : step}/><div className="step-badge">PASO <b>{String(step+1).padStart(2,'0')}</b></div></div>
          <OperationsPanel algorithm={baseAlgorithm} message={operationMessage} activeOperation={activeOperation} onAction={handleOperation}/>
          <div className="player"><button onClick={()=>goToStep(step-1)} aria-label="Anterior"><ArrowLeft size={17}/></button><button className="play" onClick={togglePlayback}>{playing?<Pause size={18}/>:<Play size={18}/>}<span>{playing?'Pausar':'Reproducir'}</span></button><button onClick={()=>goToStep(step+1)} aria-label="Siguiente"><ArrowRight size={17}/></button><div className="timeline"><span style={{width:`${((step+1)/totalSteps)*100}%`}}/></div><label><span>Velocidad</span><select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="1400">0.5×</option><option value="900">1×</option><option value="450">2×</option></select><ChevronDown size={13}/></label></div>
        </article>

        <article className="panel code-panel">
          <div className="panel-head code-head">
            <div><span className="panel-index">02</span><h2>{codeMode === 'java' ? activeOperationLabel : 'Pseudocódigo'}</h2></div>
            <div className="code-actions">
              <div className="code-tabs" aria-label="Formato de código">
                <button className={codeMode === 'java' ? 'active' : ''} onClick={()=>setCodeMode('java')}>JAVA · EN</button>
                <button className={codeMode === 'pseudo' ? 'active' : ''} onClick={()=>setCodeMode('pseudo')}>PSEUDO</button>
              </div>
              <button className="copy-button" onClick={copyCode}>{copied ? 'COPIADO' : 'COPIAR'}</button>
            </div>
          </div>
          <pre ref={codePanelRef}>{codeLines.map((line,i)=><code className={i===(activeCodeLine ?? step%codeLines.length)?'active':''} key={i}><i>{String(i+1).padStart(2,'0')}</i>{line || ' '}</code>)}</pre>
          <div className="note"><CircleHelp size={17}/><p><strong>{codeMode === 'java' ? `Java básico · ${activeOperationLabel}` : '¿Qué ocurre aquí?'}</strong><span>{codeMode === 'java' ? 'Código pensado para comenzar: variables, arreglos, ciclos, condiciones y métodos pequeños. Pulsa otra operación para cambiar el código.' : step === 0 ? 'Se prepara el estado inicial y la estructura auxiliar.' : step >= totalSteps-1 ? 'El algoritmo completa la operación y devuelve el resultado.' : `Se procesa el elemento activo del paso ${step+1} y se actualiza el estado.`}</span></p></div>
        </article>
      </section>

      <section className="future-description" aria-labelledby="future-description-title">
        <div className="future-description-icon"><BookOpen size={20}/></div>
        <div>
          <span>PRÓXIMAMENTE</span>
          <h2 id="future-description-title">Descripción de {algorithm.name}</h2>
          <p>Este espacio incluirá una explicación sencilla, características principales, casos de uso y ejemplos cotidianos de esta estructura.</p>
        </div>
      </section>

      <section className="learning-strip"><div><BookOpen size={18}/><span><b>{categoryLabels[algorithm.category]}</b> · {algorithm.name}</span></div><button onClick={resetDemo}><RotateCcw size={15}/> Reiniciar</button></section>
      <footer className="algorithm-nav"><button onClick={()=>selectRelative(-1)}><ArrowLeft size={16}/><span><small>Anterior</small>{algorithms[(selectedIndex-1+algorithms.length)%algorithms.length].name}</span></button><button onClick={()=>selectRelative(1)}><span><small>Siguiente</small>{algorithms[(selectedIndex+1)%algorithms.length].name}</span><ArrowRight size={16}/></button></footer>
      </>}
    </main>
    {mobileOpen && <button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Cerrar menú"/>}
  </div>;
}

export default App;
