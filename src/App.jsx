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
import {
  adaptFramesToCode,
  copyVisualValues,
  createCodeSynchronizedFrames,
  createLinkedListSynchronizedFrames,
  createTreeSynchronizedFrames,
} from './logic/codeAnimation.js';
import { DEFAULT_GRAPH_EDGES, DEFAULT_GRAPH_POSITIONS, executeOperation, getOperationDefinition, getThreadedTreeLinks, operationGroup, SPARSE_MATRIX_COLUMNS, SPARSE_MATRIX_ROWS } from './logic/operations.js';
import { AST_EXAMPLES, astValuesFromSource } from './logic/ast.js';
import { DENSE_MATRIX_SIZE, normalizeDenseMatrixValues } from './logic/denseMatrix.js';
import { GENERALIZED_LIST_EXAMPLES, generalizedListToString, generalizedListValuesFromSource } from './logic/generalizedList.js';
import { createRandomPathMap, DEFAULT_PATH_MAP } from './logic/pathfindingMap.js';
import { formatPolynomial, polynomialTerms } from './logic/polynomial.js';

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

const algorithmIdFromLocation = () => {
  if (typeof window === 'undefined') return null;
  try {
    const pathCandidate = decodeURIComponent(window.location.pathname.replace(/^\/+|\/+$/g, '').trim());
    if (algorithms.some(item => item.id === pathCandidate)) return pathCandidate;

    // Compatibilidad temporal con enlaces antiguos como /#/avl.
    const candidate = decodeURIComponent(window.location.hash.replace(/^#\/?/, '').trim());
    return algorithms.some(item => item.id === candidate) ? candidate : null;
  } catch {
    return null;
  }
};

const initialAlgorithmId = () => {
  const routed = algorithmIdFromLocation();
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

  if (algorithm.id === 'matriz') {
    return Array.from({ length: DENSE_MATRIX_SIZE ** 2 }, () => (
      Math.random() < .22 ? 0 : randomNumber(1, 20)
    ));
  }
  if (algorithm.id === 'polinomios') {
    const createTerms = polynomial => {
      const exponents = randomUniqueNumbers(randomNumber(3, 5), 0, 15).sort((a, b) => b - a);
      return exponents.map(exponent => ({
        polynomial,
        coefficient: randomNumber(1, 9) * (Math.random() < .3 ? -1 : 1),
        exponent,
      }));
    };
    return [...createTerms('A'), ...createTerms('B')];
  }
  if (algorithm.id === 'listas-generalizadas') {
    return generalizedListValuesFromSource(GENERALIZED_LIST_EXAMPLES[randomNumber(0, GENERALIZED_LIST_EXAMPLES.length - 1)]);
  }
  if (algorithm.id === 'matriz-dispersa') {
    const coordinates = [];
    const target = randomNumber(8, 12);
    while (coordinates.length < target) {
      const row = randomNumber(0, SPARSE_MATRIX_ROWS - 1);
      const column = randomNumber(0, SPARSE_MATRIX_COLUMNS - 1);
      if (coordinates.some(cell => cell.row === row && cell.column === column)) continue;
      coordinates.push({ value: randomNumber(1, 20), row, column });
    }
    return coordinates.sort((first, second) => first.row - second.row || first.column - second.column);
  }
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
  if (algorithm.id === 'ast') return astValuesFromSource(AST_EXAMPLES[randomNumber(0, AST_EXAMPLES.length - 1)]);
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
  if (['arbol-enhebrado','bst','avl','rojo-negro','splay-tree','kd-tree'].includes(algorithm.id)) return balancedLevelOrder(values.sort((a, b) => a - b));
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
      ? <path className="circle-return forward singleton-loop" data-link-direction="next" d={`M ${firstCenter+nodeSize/2} 55 C ${firstCenter+62} 55, ${firstCenter+62} 118, ${firstCenter} 118 C ${firstCenter-35} 118, ${firstCenter-35} 93, ${firstCenter} 85`} markerEnd={`url(#${forwardMarker})`} />
      : <path className="circle-return forward" data-link-direction="next" d={`M ${lastCenter} 85 C ${lastCenter} 132, ${firstCenter} 132, ${firstCenter} 85`} markerEnd={`url(#${forwardMarker})`} />}
    {doubleCircular && (values.length === 1
      ? <path className="circle-return reverse singleton-loop" data-link-direction="prev" d={`M ${firstCenter-nodeSize/2} 57 C ${firstCenter-62} 57, ${firstCenter-62} 5, ${firstCenter} 5 C ${firstCenter+35} 5, ${firstCenter+35} 17, ${firstCenter} 27`} markerEnd={`url(#${reverseMarker})`} />
      : <path className="circle-return reverse" data-link-direction="prev" d={`M ${firstCenter} 26 C ${firstCenter} 5, ${lastCenter} 5, ${lastCenter} 26`} markerEnd={`url(#${reverseMarker})`} />)}

    {values.map((value,index) => <g className={`circle-node ${index===step%values.length?'active':''}`} key={`${value}-${index}`}>
      <rect x={center(index)-nodeSize/2} y="27" width={nodeSize} height={nodeSize} rx="7" />
      <text className="circle-value" x={center(index)} y="51" textAnchor="middle" dominantBaseline="middle">{value}</text>
      <text className="circle-pointer" x={center(index)} y="70" textAnchor="middle">{doubleCircular ? 'prev · next' : 'next'}</text>
    </g>)}
    <text className="circle-caption" x={width/2} y="153" textAnchor="middle">{doubleCircular ? 'NEXT: ÚLTIMO → PRIMERO  ·  PREV: PRIMERO → ÚLTIMO' : 'NEXT: ÚLTIMO NODO → PRIMER NODO'}</text>
  </svg>
  </div>;
}

function DenseMatrixVisual({ algorithm, step }) {
  const values = normalizeDenseMatrixValues(algorithm.values);
  return <div className="dense-matrix-scene" role="img" aria-label="Matriz densa de cuatro filas y cuatro columnas">
    <div className="dense-matrix-heading">
      <strong>int[4][4]</strong>
      <span>índice lineal = fila × 4 + columna</span>
    </div>
    <div className="dense-matrix-grid">
      <span className="matrix-corner">f\c</span>
      {Array.from({ length: DENSE_MATRIX_SIZE }, (_, column) => (
        <span className="matrix-axis column-axis" key={`column-${column}`}>c{column}</span>
      ))}
      {Array.from({ length: DENSE_MATRIX_SIZE }, (_, row) => <div className="matrix-row" key={`row-${row}`}>
        <span className="matrix-axis row-axis">f{row}</span>
        {Array.from({ length: DENSE_MATRIX_SIZE }, (_, column) => {
          const index = row * DENSE_MATRIX_SIZE + column;
          return <div
            className={`dense-matrix-cell ${row === column ? 'diagonal' : ''} ${index === step ? 'active' : ''}`}
            data-matrix-row={row}
            data-matrix-column={column}
            data-matrix-index={index}
            key={`${row}-${column}`}
          >
            <strong>{values[index]}</strong>
            <small>[{row}][{column}]</small>
          </div>;
        })}
      </div>)}
    </div>
    <div className="dense-matrix-legend"><i/> diagonal principal</div>
  </div>;
}

function PolynomialVisual({ algorithm }) {
  const state = algorithm.animationFrame?.polynomialState ?? {};
  const rows = ['A', 'B', 'C'];
  return <div className="polynomial-visual" role="img" aria-label="Polinomios A, B y C representados mediante listas enlazadas">
    <div className="polynomial-node-schema"><span>COEF</span><span>EXP</span><span>LINK</span></div>
    {rows.map(polynomial => {
      const terms = polynomialTerms(algorithm.values, polynomial);
      return <div className={`polynomial-row polynomial-${polynomial.toLowerCase()}`} key={polynomial}>
        <div className="polynomial-name">
          <strong>{polynomial}</strong>
          <small>{polynomial === 'C' ? 'RESULTADO' : 'OPERANDO'}</small>
        </div>
        <div className="polynomial-expression">{polynomial} = {formatPolynomial(terms)}</div>
        <div className="polynomial-chain">
          {terms.length === 0 && <span className="polynomial-null">NULL</span>}
          {terms.map((term, index) => {
            const pointerActive = (polynomial === 'A' && state.pIndex === index)
              || (polynomial === 'B' && state.qIndex === index);
            const operationActive = state.activePolynomial === polynomial
              && (state.activeIndex === null || state.activeIndex === undefined || state.activeIndex === index);
            return <div className="polynomial-term-wrap" key={`${polynomial}-${term.exponent}`}>
              <div
                className={`polynomial-node ${pointerActive ? 'pointer-active' : ''} ${operationActive ? 'operation-active' : ''}`}
                data-polynomial={polynomial}
                data-exponent={term.exponent}
              >
                <span>{term.coefficient}</span>
                <span>{term.exponent}</span>
                <span className="polynomial-link-dot">●</span>
              </div>
              {polynomial === 'A' && state.pIndex === index && <i className="polynomial-pointer">p</i>}
              {polynomial === 'B' && state.qIndex === index && <i className="polynomial-pointer">q</i>}
            </div>;
          })}
          {terms.length > 0 && <span className="polynomial-null">NULL</span>}
        </div>
      </div>;
    })}
    <div className="polynomial-rule">Exponentes descendentes · sin coeficientes 0 · exponentes iguales se agrupan</div>
  </div>;
}

function generalizedListLayout(root) {
  const nodes = [];
  const edges = [];
  const visit = (list, path, startX, y) => {
    const headerPath = `${path}.header`;
    nodes.push({ path: headerPath, tag: 2, value: list.refs, x: startX, y, header: true });
    const gap = Math.min(13, 68 / Math.max(1, list.items.length));
    let previousPath = headerPath;
    let previousX = startX;
    list.items.forEach((item, index) => {
      const itemPath = `${path}.${index}`;
      const x = startX + 13 + index * gap;
      nodes.push({
        path: itemPath,
        tag: item.kind === 'atom' ? 0 : 1,
        value: item.kind === 'atom' ? item.value : '↓',
        x,
        y,
      });
      edges.push({ from: previousPath, to: itemPath, fromX: previousX, fromY: y, toX: x, toY: y, kind: 'link' });
      previousPath = itemPath;
      previousX = x;
      if (item.kind === 'sublist') {
        const childStart = Math.max(5, Math.min(82, x - 6));
        const childHeader = `${itemPath}.list.header`;
        edges.push({ from: itemPath, to: childHeader, fromX: x, fromY: y, toX: childStart, toY: y + 24, kind: 'dlink' });
        visit(item.list, `${itemPath}.list`, childStart, y + 24);
      }
    });
    if (list.items.length) {
      edges.push({ from: previousPath, to: `${path}.null`, fromX: previousX, fromY: y, toX: Math.min(97, previousX + 9), toY: y, kind: 'null' });
    }
  };
  visit(root, 'root', 7, 12);
  return { nodes, edges };
}

function GeneralizedListVisual({ algorithm }) {
  const root = algorithm.values[0];
  if (!root) return <div className="empty-visual"><strong>()</strong><span>Lista generalizada sin referencias</span></div>;
  const { nodes, edges } = generalizedListLayout(root);
  const activePaths = new Set(algorithm.animationFrame?.generalizedListState?.activePaths ?? []);
  return <div className="generalized-list-visual" role="img" aria-label={`Lista generalizada A igual a ${generalizedListToString(root)}`}>
    <div className="generalized-caption">
      <strong>A = {generalizedListToString(root)}</strong>
      <span>Longitud {root.items.length} · referencias {root.refs}</span>
    </div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="glist-link-arrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z"/></marker>
        <marker id="glist-dlink-arrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z"/></marker>
      </defs>
      {edges.map(edge => <line
        key={`${edge.from}-${edge.to}`}
        className={`generalized-edge ${edge.kind} ${activePaths.has(edge.from) || activePaths.has(edge.to) ? 'active' : ''}`}
        x1={edge.fromX + 3.7}
        y1={edge.fromY}
        x2={edge.toX - (edge.kind === 'dlink' ? 0 : 3.7)}
        y2={edge.toY}
        markerEnd={edge.kind === 'null' ? undefined : edge.kind === 'dlink' ? 'url(#glist-dlink-arrow)' : 'url(#glist-link-arrow)'}
      />)}
    </svg>
    <div className="generalized-aliases" style={{ left: '0.5%', top: '12%' }}>
      {(root.aliases?.length ? root.aliases : ['A']).map(alias => <span key={alias}>{alias} →</span>)}
    </div>
    {nodes.map(node => <div
      className={`generalized-node tag-${node.tag} ${activePaths.has(node.path) ? 'active' : ''}`}
      data-generalized-path={node.path}
      data-tag={node.tag}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      key={node.path}
    >
      <span>{node.tag}</span>
      <span>{node.value}</span>
      <span>●</span>
      {node.header && <small>REF</small>}
    </div>)}
    {edges.filter(edge => edge.kind === 'null').map(edge => <span className="generalized-null" style={{ left: `${edge.toX}%`, top: `${edge.toY}%` }} key={edge.to}>⌟</span>)}
    <div className="generalized-legend"><span><i className="tag0"/>0 átomo</span><span><i className="tag1"/>1 sublista · dlink ↓</span><span><i className="tag2"/>2 encabezamiento · ref</span></div>
  </div>;
}

function SparseMatrixVisual({ algorithm }) {
  const frameState = algorithm.animationFrame?.sparseState ?? {};
  const cellKey = cell => `${cell.row}:${cell.column}`;
  const baseCells = algorithm.values
    .map(cell => ({ value: Number(cell.value), row: Number(cell.row), column: Number(cell.column) }))
    .filter(cell => Number.isInteger(cell.row) && Number.isInteger(cell.column));
  const pendingNode = frameState.pendingNode;
  const cells = pendingNode && !baseCells.some(cell => cellKey(cell) === cellKey(pendingNode))
    ? [...baseCells, pendingNode]
    : baseCells;
  const rowStartX = 26;
  const rowHeaderWidth = 72;
  const firstColumnX = 174;
  const columnGap = 88;
  const firstRowY = 82;
  const rowGap = 46;
  const columnX = column => firstColumnX + column * columnGap;
  const rowY = row => firstRowY + row * rowGap;
  const activeRow = frameState.activeRow;
  const activeColumn = frameState.activeColumn;
  const activeKey = frameState.activeCellKey;
  const visitedRowKeys = new Set(frameState.visitedRowKeys ?? []);
  const visitedColumnKeys = new Set(frameState.visitedColumnKeys ?? []);
  const rowCells = row => {
    if (frameState.clearedRows) return [];
    return cells
      .filter(cell => (
        cell.row === row
        && cellKey(cell) !== frameState.detachedRowKey
        && !(frameState.phase === 'create' && pendingNode && cellKey(cell) === cellKey(pendingNode))
      ))
      .sort((first, second) => second.column - first.column);
  };
  const columnCells = column => {
    if (frameState.clearedColumns) return [];
    return cells
      .filter(cell => (
        cell.column === column
        && cellKey(cell) !== frameState.pendingColumnKey
        && !(frameState.phase === 'create' && pendingNode && cellKey(cell) === cellKey(pendingNode))
      ))
      .sort((first, second) => second.row - first.row);
  };

  const rowPath = row => {
    const nodes = rowCells(row);
    const y = rowY(row);
    if (!nodes.length) {
      return <path
        key={`row-empty-${row}`}
        className={`sparse-return row-return ${activeRow === row ? 'active-link' : ''}`}
        d={`M ${rowStartX + rowHeaderWidth} ${y} C ${rowStartX + 105} ${y + 16}, ${rowStartX + 18} ${y + 25}, ${rowStartX + 12} ${y + 8}`}
        markerEnd="url(#sparse-row-arrow)"
      />;
    }
    const segments = [];
    const firstX = columnX(nodes[0].column);
    segments.push(<path
      key={`row-launch-${row}`}
      className={`sparse-return row-return ${activeRow === row ? 'active-link' : ''}`}
      d={`M ${rowStartX + rowHeaderWidth / 2} ${y - 15} V ${y - 23} H ${firstX} V ${y - 18}`}
      markerEnd="url(#sparse-row-arrow)"
    />);
    nodes.slice(0, -1).forEach((cell, index) => {
      const next = nodes[index + 1];
      segments.push(<line
        key={`row-${row}-${cellKey(cell)}`}
        className={`sparse-link row-link ${activeRow === row || visitedRowKeys.has(cellKey(cell)) ? 'active-link' : ''}`}
        x1={columnX(cell.column) - 29}
        y1={y}
        x2={columnX(next.column) + 29}
        y2={y}
        markerEnd="url(#sparse-row-arrow)"
      />);
    });
    const lastX = columnX(nodes.at(-1).column);
    segments.push(<line
      key={`row-close-${row}`}
      className={`sparse-link row-link ${activeRow === row ? 'active-link' : ''}`}
      x1={lastX - 29}
      y1={y}
      x2={rowStartX + rowHeaderWidth}
      y2={y}
      markerEnd="url(#sparse-row-arrow)"
    />);
    return segments;
  };

  const columnPath = column => {
    const nodes = columnCells(column);
    const x = columnX(column);
    if (!nodes.length) {
      return <path
        key={`column-empty-${column}`}
        className={`sparse-return column-return ${activeColumn === column ? 'active-link' : ''}`}
        d={`M ${x + 17} 49 C ${x + 43} 58, ${x + 38} 22, ${x + 22} 25`}
        markerEnd="url(#sparse-column-arrow)"
      />;
    }
    const segments = [];
    const firstY = rowY(nodes[0].row);
    segments.push(<path
      key={`column-launch-${column}`}
      className={`sparse-return column-return ${activeColumn === column ? 'active-link' : ''}`}
      d={`M ${x + 18} 50 H ${x + 35} V ${firstY + 27} H ${x} V ${firstY + 18}`}
      markerEnd="url(#sparse-column-arrow)"
    />);
    nodes.slice(0, -1).forEach((cell, index) => {
      const next = nodes[index + 1];
      segments.push(<line
        key={`column-${column}-${cellKey(cell)}`}
        className={`sparse-link column-link ${activeColumn === column || visitedColumnKeys.has(cellKey(cell)) ? 'active-link' : ''}`}
        x1={x}
        y1={rowY(cell.row) - 18}
        x2={x}
        y2={rowY(next.row) + 18}
        markerEnd="url(#sparse-column-arrow)"
      />);
    });
    const lastY = rowY(nodes.at(-1).row);
    segments.push(<line
      key={`column-close-${column}`}
      className={`sparse-link column-link ${activeColumn === column ? 'active-link' : ''}`}
      x1={x}
      y1={lastY - 18}
      x2={x}
      y2="50"
      markerEnd="url(#sparse-column-arrow)"
    />);
    return segments;
  };

  return <div className="sparse-matrix-visual" role="img" aria-label="Matriz poco poblada con cabeceras AROW y ACOL">
    <svg viewBox="0 0 735 330" aria-hidden="true">
      <defs>
        <marker id="sparse-row-arrow" viewBox="0 0 8 8" markerWidth="7" markerHeight="7" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker>
        <marker id="sparse-column-arrow" viewBox="0 0 8 8" markerWidth="7" markerHeight="7" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker>
      </defs>

      <text className="sparse-axis-title row-title" x="24" y="23">CABECERAS DE FILA</text>
      <text className="sparse-axis-title column-title" x="172" y="12">CABECERAS DE COLUMNA</text>

      {Array.from({ length: SPARSE_MATRIX_COLUMNS }, (_, column) => <g
        className={`sparse-header column-header ${activeColumn === column ? 'active' : ''}`}
        key={`column-header-${column}`}
        transform={`translate(${columnX(column) - 25} 20)`}
        data-column-header={column}
      >
        <rect width="50" height="30" rx="6"/>
        <text x="25" y="13" textAnchor="middle">ACOL[{column}]</text>
        <text className="pointer-label" x="25" y="24" textAnchor="middle">up ↻</text>
      </g>)}

      {Array.from({ length: SPARSE_MATRIX_ROWS }, (_, row) => <g
        className={`sparse-header row-header ${activeRow === row ? 'active' : ''}`}
        key={`row-header-${row}`}
        transform={`translate(${rowStartX} ${rowY(row) - 15})`}
        data-row-header={row}
      >
        <rect width={rowHeaderWidth} height="30" rx="6"/>
        <text x={rowHeaderWidth / 2} y="13" textAnchor="middle">AROW[{row}]</text>
        <text className="pointer-label" x={rowHeaderWidth / 2} y="24" textAnchor="middle">left ↻</text>
      </g>)}

      <g className="sparse-column-links">{Array.from({ length: SPARSE_MATRIX_COLUMNS }, (_, column) => columnPath(column))}</g>
      <g className="sparse-row-links">{Array.from({ length: SPARSE_MATRIX_ROWS }, (_, row) => rowPath(row))}</g>

      {cells.map(cell => {
        const key = cellKey(cell);
        const isPending = pendingNode && key === cellKey(pendingNode) && !baseCells.some(item => cellKey(item) === key);
        const classes = [
          'sparse-node',
          key === activeKey ? 'active' : '',
          isPending ? 'pending' : '',
          visitedRowKeys.has(key) ? 'visited-row' : '',
          visitedColumnKeys.has(key) ? 'visited-column' : '',
          frameState.detachedRowKey === key ? 'detached-row' : '',
        ].filter(Boolean).join(' ');
        return <g
          className={classes}
          key={key}
          transform={`translate(${columnX(cell.column) - 28} ${rowY(cell.row) - 16})`}
          data-cell-key={key}
          data-row={cell.row}
          data-column={cell.column}
          data-value={cell.value}
        >
          <rect width="56" height="32" rx="6"/>
          <line x1="27" y1="0" x2="27" y2="32"/>
          <line x1="41" y1="0" x2="41" y2="32"/>
          <text className="node-value" x="13.5" y="20" textAnchor="middle">{cell.value}</text>
          <text x="34" y="20" textAnchor="middle">{cell.row}</text>
          <text x="48.5" y="20" textAnchor="middle">{cell.column}</text>
        </g>;
      })}

      <g className="sparse-node-legend" transform="translate(24 312)">
        <text x="0" y="0">NODO:</text>
        <text x="47" y="0">valor</text>
        <text x="91" y="0">fila</text>
        <text x="120" y="0">columna</text>
        <text className="right-legend" x="195" y="0">left ← AROW</text>
        <text className="down-legend" x="315" y="0">up ↑ ACOL</text>
        <text x="455" y="0">↻ regreso circular a la cabecera</text>
      </g>
    </svg>
  </div>;
}

function LinearVisual({ algorithm, step }) {
  const { values, type } = algorithm;
  if (!values.length) return <div className="empty-visual"><strong>∅</strong><span>Estructura vacía</span></div>;
  if (type === 'stack') {
    const activeIndex = step % values.length;
    return <div className="stack-visual">{[...values].reverse().map((v, reversedIndex) => {
      const logicalIndex = values.length - 1 - reversedIndex;
      return <div className={`data-cell wide ${logicalIndex === activeIndex ? 'active' : ''}`} key={`${v}-${logicalIndex}`}>
        <span>{v}</span>{reversedIndex === 0 && <small>TOPE</small>}
      </div>;
    })}<div className="stack-base" /></div>;
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

const indexInsideRange = (index, range) => (
  Array.isArray(range) && index >= range[0] && index <= range[1]
);

function SortVisual({ algorithm, step }) {
  const frame = algorithm.animationFrame;
  const values = algorithm.values;
  const isQuick = algorithm.id === 'quick-sort';
  const phaseLabel = isQuick
    ? {
        'quick-start': 'Preparar Quick Sort',
        'quick-call': 'Llamada inicial',
        'quick-recursion': 'Llamada recursiva',
        'quick-base': 'Evaluar caso base',
        'partition-call': 'Particionar rango',
        'partition-start': 'Comenzar partición',
        'pivot-selected': 'Elegir pivote',
        'partition-boundary': 'Mover frontera de menores',
        'partition-loop': 'Recorrer la partición',
        'partition-loop-end': 'Finalizar recorrido',
        'partition-compare': 'Comparar con pivote',
        'quick-swap-call': 'Intercambiar',
        'quick-swap-save': 'Guardar valor temporal',
        'quick-swap-first': 'Mover primer valor',
        'quick-swap-complete': 'Intercambio completo',
        'pivot-fixed': 'Pivote en posición definitiva',
        'quick-left-call': 'Ordenar lado izquierdo',
        'quick-right-call': 'Ordenar lado derecho',
        'quick-return': 'Regresar de la llamada',
        'quick-complete': 'Quick Sort terminado',
      }[frame?.sortPhase] ?? 'PARTICIÓN POR PIVOTE'
    : {
        'merge-start': 'Preparar Merge Sort',
        'merge-help': 'Crear arreglo auxiliar',
        'merge-call': 'Llamada inicial',
        'merge-recursion': 'Llamada recursiva',
        'merge-base': 'Evaluar caso base',
        'merge-return': 'Regresar de la llamada',
        'merge-divide': 'Dividir en mitades',
        'merge-left-call': 'Ordenar mitad izquierda',
        'merge-right-call': 'Ordenar mitad derecha',
        'merge-call-halves': 'Mezclar mitades',
        'merge-halves': 'Comenzar mezcla',
        'merge-pointers': 'Preparar punteros',
        'merge-loop': 'Recorrer ambas mitades',
        'merge-loop-end': 'Una mitad se agotó',
        'merge-compare': 'Comparar mitades',
        'merge-copy-left': 'Copiar desde izquierda',
        'merge-copy-right': 'Copiar desde derecha',
        'merge-pointer-move': 'Avanzar puntero',
        'merge-left-rest': 'Copiar resto izquierdo',
        'merge-left-rest-end': 'Finalizar mitad izquierda',
        'merge-right-rest': 'Copiar resto derecho',
        'merge-right-rest-end': 'Finalizar mitad derecha',
        'merge-write-loop': 'Recorrer arreglo auxiliar',
        'merge-write': 'Escribir resultado',
        'merge-range-complete': 'Mezcla completa',
        'merge-complete': 'Merge Sort terminado',
      }[frame?.sortPhase] ?? 'DIVIDIR Y MEZCLAR';

  const cellLabel = index => {
    if (isQuick) {
      if (index === frame?.sortPivotIndex) return 'PIVOTE';
      if (index === frame?.sortCompareIndex) return 'current';
      if (frame?.sortSwapPositions?.includes(index)) return 'SWAP';
      if (frame?.sortFixedPositions?.includes(index)) return 'FIJO';
    } else {
      if (index === frame?.sortWriteIndex) return 'k';
      if (frame?.sortComparePositions?.[0] === index) return 'i';
      if (frame?.sortComparePositions?.[1] === index) return 'j';
      if (indexInsideRange(index, frame?.sortLeftRange)) return 'IZQ.';
      if (indexInsideRange(index, frame?.sortRightRange)) return 'DER.';
    }
    return `i=${index}`;
  };

  return <div className={`sort-visual ${isQuick ? 'quick-sort-visual' : 'merge-sort-visual'}`} role="img" aria-label={`Visualización real de ${algorithm.name}`}>
    <div className="sort-phase-label">
      <span>{isQuick ? 'QUICK SORT' : 'MERGE SORT'}</span>
      <strong>{phaseLabel}</strong>
      {frame?.sortRange && <small>Rango [{frame.sortRange[0]}..{frame.sortRange[1]}]</small>}
    </div>
    <div className="sort-array-row">
      <em>values</em>
      <div className="sort-cells">
        {values.map((value, index) => {
          const classes = [
            'sort-cell',
            indexInsideRange(index, frame?.sortRange) ? 'in-range' : '',
            indexInsideRange(index, frame?.sortLeftRange) ? 'left-half' : '',
            indexInsideRange(index, frame?.sortRightRange) ? 'right-half' : '',
            index === frame?.sortPivotIndex ? 'pivot' : '',
            index === frame?.sortCompareIndex || frame?.sortComparePositions?.includes(index) ? 'comparing' : '',
            frame?.sortSwapPositions?.includes(index) ? 'swapping' : '',
            frame?.sortFixedPositions?.includes(index) ? 'fixed' : '',
            index === frame?.sortWriteIndex ? 'writing' : '',
            index === step ? 'active' : '',
          ].filter(Boolean).join(' ');
          return <div className={classes} data-sort-index={index} key={`${index}-${value}`}>
            <span>{value}</span>
            <small>{cellLabel(index)}</small>
          </div>;
        })}
      </div>
    </div>
    {!isQuick && <div className="sort-array-row auxiliary-row">
      <em>help</em>
      <div className="sort-cells">
        {values.map((_, index) => <div
          className={`sort-cell auxiliary ${index === frame?.sortWriteIndex ? 'writing' : ''}`}
          data-aux-index={index}
          key={`aux-${index}`}
        >
          <span>{frame?.sortAuxValues?.[index] ?? '·'}</span>
          <small>{index}</small>
        </div>)}
      </div>
    </div>}
    <div className="sort-legend">
      {isQuick
        ? <><span><i className="pivot-sample"/> pivote</span><span><i className="compare-sample"/> comparación</span><span><i className="fixed-sample"/> posición final</span></>
        : <><span><i className="left-sample"/> mitad izquierda</span><span><i className="right-sample"/> mitad derecha</span><span><i className="write-sample"/> escritura</span></>}
    </div>
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
  const frame = algorithm.animationFrame;
  const orderedTree = ['bst','avl','rojo-negro','splay-tree'].includes(algorithm.id);
  const heapCandidates = new Set(frame?.heapCandidatePositions ?? []);
  const movingHeapNode = algorithm.id === 'heap'
    && frame?.heapPhase === 'move-last'
    && Number.isInteger(frame.heapSourcePosition)
    && Number.isInteger(frame.heapTargetPosition)
    && BINARY_POSITIONS[frame.heapSourcePosition]
    && BINARY_POSITIONS[frame.heapTargetPosition];
  const redBlackMaximumDepth = algorithm.id === 'rojo-negro'
    ? Math.max(0, ...values.map((value,index) => value === undefined ? 0 : Math.floor(Math.log2(index + 1))))
    : 0;
  return <div className={`tree-canvas tree-${algorithm.id}`}>
    {kindLabel && <span className="tree-kind-label">{kindLabel}</span>}
    <svg className="edge-layer" aria-hidden="true">
      {BINARY_EDGES.filter(([from,to])=>to<values.length && values[from] !== undefined && values[to] !== undefined).map(([from,to]) =>
        <TreeEdge key={`${from}-${to}`} from={BINARY_POSITIONS[from]} to={BINARY_POSITIONS[to]} label={orderedTree ? to===from*2+1?'L':'R' : null}/>
      )}
    </svg>
    {movingHeapNode && <div
      className="heap-moving-node"
      style={{
        '--heap-from-x': `${BINARY_POSITIONS[frame.heapSourcePosition][0]}%`,
        '--heap-from-y': `${BINARY_POSITIONS[frame.heapSourcePosition][1]}%`,
        '--heap-to-x': `${BINARY_POSITIONS[frame.heapTargetPosition][0]}%`,
        '--heap-to-y': `${BINARY_POSITIONS[frame.heapTargetPosition][1]}%`,
      }}
      aria-hidden="true"
    >
      {values[frame.heapSourcePosition]}
      <small>ÚLTIMO</small>
    </div>}
    {BINARY_POSITIONS.map(([x,y],index) => {
      if (values[index] === undefined) return null;
      const redBlackDepth = Math.floor(Math.log2(index + 1));
      const redBlackClass = algorithm.id === 'rojo-negro'
        ? index !== 0 && redBlackDepth === redBlackMaximumDepth ? 'red-node' : 'black-node'
        : '';
      const heapSource = algorithm.id === 'heap' && index === frame?.heapSourcePosition;
      const heapTarget = algorithm.id === 'heap' && index === frame?.heapTargetPosition;
      const heapParent = algorithm.id === 'heap' && index === frame?.heapParentPosition;
      const heapCandidate = algorithm.id === 'heap' && heapCandidates.has(index);
      const astNodeClass = algorithm.id !== 'ast'
        ? ''
        : values[index] === 'ASSIGN'
          ? 'ast-statement-node'
          : ['+','-','*','/'].includes(String(values[index]))
            ? 'ast-operator-node'
            : /^\d+$/.test(String(values[index]))
              ? 'ast-literal-node'
              : 'ast-identifier-node';
      return <div key={index} data-tree-index={index} data-node-color={redBlackClass || undefined} className={`tree-node ${index>=7?'deep-node':''} ${index===step%values.length?'active':''} ${redBlackClass} ${heapSource?'heap-source':''} ${heapTarget?'heap-target':''} ${heapParent?'heap-parent':''} ${heapCandidate?'heap-candidate':''} ${algorithm.id==='expression-tree'&&['+','-','−','*','×','/'].includes(String(values[index]))?'operator-node':''} ${astNodeClass}`} style={{left:`${x}%`,top:`${y}%`}}>
      <span className="tree-value">{values[index]}</span>
      {badges?.[index] && <small className="tree-node-badge">{badges[index]}</small>}
      </div>;
    })}
  </div>;
}

function ThreadedTreeDiagram({ algorithm, step }) {
  const values = algorithm.values.slice(0, 15);
  const { inorder, links } = getThreadedTreeLinks(values);
  const frame = algorithm.animationFrame;
  const activeThread = frame?.activeThread;
  const threadEdges = [];

  links.forEach(meta => {
    if (meta.leftThread) {
      threadEdges.push({ from: meta.index, to: meta.predecessor, side: 'left' });
    }
    if (meta.rightThread) {
      threadEdges.push({ from: meta.index, to: meta.successor, side: 'right' });
    }
  });

  const threadTarget = edge => {
    if (edge.to !== null) return BINARY_POSITIONS[edge.to];
    return edge.side === 'left' ? [3, 85] : [97, 85];
  };
  const threadPath = edge => {
    const [fromX, fromY] = BINARY_POSITIONS[edge.from];
    const [toX, toY] = threadTarget(edge);
    const direction = edge.side === 'left' ? -1 : 1;
    const controlX = (fromX + toX) / 2 + direction * 7;
    const controlY = Math.min(90, Math.max(fromY, toY) + (edge.to === null ? 3 : 12));
    return `M ${fromX} ${fromY + 5} Q ${controlX} ${controlY} ${toX} ${toY + (edge.to === null ? 0 : 5)}`;
  };
  const isActiveThread = edge => (
    activeThread
    && edge.from === activeThread.from
    && edge.to === activeThread.to
    && edge.side === activeThread.side
  );

  return <div className="tree-canvas threaded-tree-canvas tree-arbol-enhebrado" role="img" aria-label="Árbol binario enhebrado: líneas sólidas para hijos y líneas discontinuas para hilos inorden">
    <span className="tree-kind-label">BST DOBLEMENTE ENHEBRADO</span>
    <svg className="edge-layer threaded-child-layer" aria-hidden="true">
      {BINARY_EDGES.filter(([from,to]) => to < values.length && values[from] !== undefined && values[to] !== undefined).map(([from,to]) =>
        <TreeEdge key={`${from}-${to}`} from={BINARY_POSITIONS[from]} to={BINARY_POSITIONS[to]} label={to === from * 2 + 1 ? 'L' : 'R'}/>
      )}
    </svg>
    <svg className="thread-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="thread-arrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z"/>
        </marker>
        <marker id="thread-arrow-active" markerWidth="6" markerHeight="6" refX="5.4" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z"/>
        </marker>
      </defs>
      {threadEdges.map(edge => <path
        key={`${edge.from}-${edge.side}`}
        className={`thread-edge ${edge.side}-thread ${isActiveThread(edge) ? 'active' : ''}`}
        data-thread-from={edge.from}
        data-thread-to={edge.to ?? 'null'}
        data-thread-side={edge.side}
        d={threadPath(edge)}
        markerEnd={isActiveThread(edge) ? 'url(#thread-arrow-active)' : 'url(#thread-arrow)'}
      />)}
    </svg>
    <span className="thread-null-anchor left-null">NULL</span>
    <span className="thread-null-anchor right-null">NULL</span>
    {BINARY_POSITIONS.map(([x,y], index) => {
      if (values[index] === undefined) return null;
      const meta = links.get(index);
      const badge = `${meta.leftThread ? 'LT' : 'L hijo'} · ${meta.rightThread ? 'RT' : 'R hijo'}`;
      return <div
        key={index}
        data-tree-index={index}
        data-inorder-position={meta.order}
        className={`tree-node threaded-node ${index >= 7 ? 'deep-node' : ''} ${index === step ? 'active' : ''}`}
        style={{left:`${x}%`,top:`${y}%`}}
      >
        <span className="tree-value">{values[index]}</span>
        <small className="tree-node-badge">{badge}</small>
      </div>;
    })}
    <div className="threaded-tree-legend">
      <span><i className="real-child-sample"/> hijo real</span>
      <span><i className="thread-sample"/> hilo inorden</span>
      <span>Orden: {inorder.map(index => values[index]).join(' → ')}</span>
    </div>
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
  const leaves = [];
  for (let start = 0; start < values.length; start += 3) {
    leaves.push({
      id: `leaf-${leaves.length}`,
      keys: values.slice(start, start + 3),
      start,
      leaf: true,
      children: [],
    });
  }
  leaves.forEach((leaf, index) => {
    leaf.x = ((index + .5) / leaves.length) * 100;
  });

  const levelsFromBottom = [leaves];
  let children = leaves;
  let levelNumber = 1;
  while (children.length > 1) {
    const parents = [];
    for (let start = 0; start < children.length; start += 4) {
      const childGroup = children.slice(start, start + 4);
      const parent = {
        id: `level-${levelNumber}-${parents.length}`,
        keys: childGroup.slice(1).map(child => child.keys[0]),
        leaf: false,
        children: childGroup,
        start: childGroup[0].start,
        x: childGroup.reduce((sum, child) => sum + child.x, 0) / childGroup.length,
      };
      childGroup.forEach(child => { child.parent = parent; });
      parents.push(parent);
    }
    levelsFromBottom.push(parents);
    children = parents;
    levelNumber++;
  }
  const levels = [...levelsFromBottom].reverse();
  levels.forEach((level, levelIndex) => {
    const y = levels.length === 1 ? 50 : 16 + (levelIndex / (levels.length - 1)) * 62;
    level.forEach(node => { node.y = y; });
  });
  const allNodes = levels.flat();
  const root = levels[0][0];
  const frame = algorithm.animationFrame;
  const promotedKey = frame?.promotedKey;
  const activePosition = step % values.length;
  const activeLeaf = leaves.find(leaf => activePosition >= leaf.start && activePosition < leaf.start + leaf.keys.length) ?? leaves[0];
  const promotedLeaf = leaves.find(leaf => leaf.keys.some(key => String(key) === String(promotedKey))) ?? activeLeaf;
  const activeMultiwayNode = ['search','promote','settled'].includes(frame?.treePhase) ? root : activeLeaf;
  const nodeWidth = Math.max(7, Math.min(17, 84 / Math.max(1, leaves.length)));
  return <div className={`btree-visual ${algorithm.id} ${leaves.length > 5 ? 'many-leaves' : ''}`}>
    <span className="tree-kind-label">{algorithm.id==='bplus-tree'?'DATOS SOLO EN HOJAS':algorithm.id==='bstar-tree'?'OCUPACIÓN MÍNIMA 2/3':'NODOS MULTICLAVE'}</span>
    <svg className="btree-edges" aria-hidden="true">
      {allNodes.flatMap(parent => parent.children.map(child =>
        <TreeEdge key={`${parent.id}-${child.id}`} from={[parent.x,parent.y]} to={[child.x,child.y]} startPadding={34} endPadding={24} width={860}/>
      ))}
    </svg>
    {allNodes.map(node => <div
      className={`bnode multiway-node ${node===root?'root-bnode':''} ${node.leaf?'child-bnode leaf-bnode':'internal-bnode'} ${node===activeMultiwayNode?'active':''} ${frame?.treePhase==='split'&&node===promotedLeaf?'splitting':''} ${node===root&&frame?.treePhase==='settled'?'promoting':''}`}
      style={{left:`${node.x}%`,top:`${node.y}%`,width:`${nodeWidth}%`}}
      key={node.id}
    ><small>{node===root?'ROOT':node.leaf?(algorithm.id==='bplus-tree'?'HOJA':'NODO HOJA'):'ÍNDICE'}</small>{node.keys.join(' | ')||'·'}</div>)}
    {algorithm.id==='bplus-tree' && leaves.length > 1 && <svg className="bplus-leaf-chain" style={{top:`${leaves[0].y}%`}}><defs><marker id="bplus-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z"/></marker></defs>{leaves.slice(0,-1).map((leaf,index)=><line key={leaf.id} x1={`${leaf.x + nodeWidth / 2}%`} y1="50%" x2={`${leaves[index+1].x - nodeWidth / 2}%`} y2="50%" markerEnd="url(#bplus-arrow)"/>)}</svg>}
    {frame?.treePhase==='promote' && promotedKey !== null && promotedKey !== undefined && <span className="promoted-key" style={{left:`${promotedLeaf.x}%`,top:`${promotedLeaf.y}%`}}><small>SUBE</small>{promotedKey}</span>}
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
  if (algorithm.id === 'arbol-enhebrado') return <ThreadedTreeDiagram algorithm={algorithm} step={step}/>;
  if (algorithm.type==='btree') return <MultiwayTreeDiagram algorithm={algorithm} step={step}/>;
  if (algorithm.id==='segment-tree') return <SegmentTreeDiagram algorithm={algorithm} step={step}/>;
  if (algorithm.id==='merkle-tree') return <MerkleTreeDiagram algorithm={algorithm} step={step}/>;
  if (algorithm.id==='fibonacci-heap') return <FibonacciHeapDiagram algorithm={algorithm} step={step}/>;
  if (['quadtree','octree'].includes(algorithm.id)) return <SpatialTreeDiagram algorithm={algorithm} step={step}/>;

  const badges = values.map((_,index) => {
    if (algorithm.id==='avl') return `BF ${treeHeight(values,index*2+1)-treeHeight(values,index*2+2)}`;
    if (algorithm.id==='heap') {
      const frame = algorithm.animationFrame;
      if (index === frame?.heapSourcePosition && frame.heapPhase === 'move-last') return 'ÚLTIMO';
      if (index === frame?.heapTargetPosition && ['move-last','root-replaced'].includes(frame.heapPhase)) return 'RAÍZ';
      if (index === frame?.heapParentPosition) return 'PADRE';
      if (frame?.heapCandidatePositions?.includes(index)) return index === frame.heapParentPosition * 2 + 1 ? 'HIJO IZQ.' : 'HIJO DER.';
      return index===0?'MAX':`i=${index}`;
    }
    if (algorithm.id==='kd-tree') return index===0||index===3||index===4||index===5||index===6?'eje X':'eje Y';
    if (algorithm.id==='splay-tree') return index===0?'ÚLTIMO ACCESO':'BST';
    if (algorithm.id==='expression-tree') return ['+','-','−','*','×','/'].includes(String(values[index]))?'OPERADOR':'OPERANDO';
    if (algorithm.id==='ast') {
      if (values[index] === 'ASSIGN') return 'SENTENCIA';
      if (['+','-','*','/'].includes(String(values[index]))) return 'OPERADOR';
      return /^\d+$/.test(String(values[index])) ? 'LITERAL' : 'IDENTIFICADOR';
    }
    return null;
  });
  const heapPhaseLabel = {
    'capture-root': 'EXTRAYENDO EL MÁXIMO',
    'move-last': 'ÚLTIMO NODO → RAÍZ',
    'root-replaced': 'RAÍZ REEMPLAZADA',
    'remove-last': 'ÁRBOL COMPLETO · ÚLTIMA HOJA ELIMINADA',
    'complete': 'MAX-HEAP RESTAURADO',
  }[algorithm.animationFrame?.heapPhase] ?? (algorithm.animationFrame?.heapPhase ? 'HEAPIFY DOWN · RESTAURANDO MAX-HEAP' : 'MAX-HEAP COMPLETO');
  const labels = { avl:'ALTURA BALANCEADA', bst:'IZQUIERDA < RAÍZ < DERECHA', 'rojo-negro':'REGLAS DE COLOR', 'splay-tree':'ACCESO MOVIDO A LA RAÍZ', heap:heapPhaseLabel, 'kd-tree':'PARTICIÓN POR EJES', 'expression-tree':'OPERADORES Y OPERANDOS', ast:'SENTENCIA · OPERADORES · DATOS' };
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
  const isPathfindingState = ['dijkstra', 'astar'].includes(graphState?.mode);
  const isTraversalState = ['bfs', 'dfs'].includes(graphState?.mode);
  const isSpanningTreeState = ['prim', 'kruskal'].includes(graphState?.mode);
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
    const wasVisited = graphState?.order?.includes(i) || graphState?.treeVertices?.includes(i);
    const stateClass = isPath ? 'path-node'
      : isPathfindingState && graphState?.closed?.includes(i) ? 'closed-node'
        : isPathfindingState && graphState?.open?.includes(i) ? 'open-node'
          : wasVisited ? 'closed-node' : '';
    const metric = isPathfindingState
      ? graphState.mode === 'astar'
        ? `f=${graphState.scores[i]}`
        : `d=${graphState.distances[i]}`
      : null;
    return <div className={`graph-node node-${i} ${i === 0 ? 'origin-node' : ''} ${isCurrent ? 'active' : ''} ${stateClass}`} style={{left:`${x}%`,top:`${y}%`}} key={i}><span>{algorithm.values[i]}</span><small>{metric ?? design.nodeMeta?.[i] ?? `v${i}`}</small></div>;
  })}
  {isPathfindingState && <div className="pathfinding-status">
    <span><i className="open-dot"/>Abiertos: <b>{labelsFor(graphState.open)}</b></span>
    <span><i className="closed-dot"/>Cerrados: <b>{labelsFor(graphState.closed)}</b></span>
    {graphState.mode === 'astar' && <em>f = g + h</em>}
  </div>}
  {isTraversalState && <div className="pathfinding-status graph-operation-status">
    <span><i className="closed-dot"/>Visitados: <b>{labelsFor(graphState.order)}</b></span>
    <span><i className="open-dot"/>Pendientes: <b>{labelsFor(graphState.frontier)}</b></span>
    <em>{graphState.mode.toUpperCase()}</em>
  </div>}
  {isSpanningTreeState && <div className="pathfinding-status graph-operation-status">
    <span><i className="closed-dot"/>Aristas elegidas: <b>{graphState.visitedEdges?.length ?? 0}</b></span>
    <span><i className="open-dot"/>Costo: <b>{graphState.totalCost ?? 0}</b></span>
    <em>{graphState.mode.toUpperCase()}</em>
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
  if (algorithm.type === 'polynomial') return <PolynomialVisual algorithm={algorithm}/>;
  if (algorithm.type === 'generalized-list') return <GeneralizedListVisual algorithm={algorithm}/>;
  if (algorithm.type === 'matrix') return <DenseMatrixVisual algorithm={algorithm} step={step}/>;
  if (algorithm.type === 'sparse-matrix') return <SparseMatrixVisual algorithm={algorithm}/>;
  if (!algorithm.values.length) return <div className="empty-visual"><strong>∅</strong><span>Estructura vacía</span></div>;
  if (['dijkstra','a-star'].includes(algorithm.id)) return <PathMapVisual algorithm={algorithm}/>;
  if (algorithm.type === 'sort') return <SortVisual algorithm={algorithm} step={step}/>;
  if (algorithm.id==='fenwick-tree') return <FenwickVisual algorithm={algorithm} step={step}/>;
  if (['tree','threaded-tree','heap','btree'].includes(algorithm.type)) return <TreeVisual algorithm={algorithm} step={step}/>;
  if (['graph','digraph','weighted'].includes(algorithm.type)) return <GraphVisual algorithm={algorithm} step={step}/>;
  if (['array','stack','queue','linked','circular','skip','union','cache'].includes(algorithm.type)) return <LinearVisual algorithm={algorithm} step={step}/>;
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
  const [showWelcome, setShowWelcome] = useState(() => algorithmIdFromLocation() === null);
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
    ? `El código muestra la clase Node, head, size y los enlaces next${baseAlgorithm.id.includes('doble') ? ' y prev' : ''}. No existe una variable de cola: cada recorrido parte en head y avanza del índice 0 hacia adelante. Cada if se evalúa antes de entrar únicamente al bloque que corresponde.`
    : baseAlgorithm.id === 'pila'
      ? 'La pila usa un arreglo y la variable top. Push aumenta top antes de guardar; Pop limpia el elemento actual y después disminuye top. La animación muestra cada cambio por separado.'
      : baseAlgorithm.id === 'cola'
        ? 'La cola usa nodos y dos referencias: front indica quién sale primero y rear dónde se agrega. Enqueue enlaza al final y Dequeue avanza front en O(1), sin desplazar todos los elementos.'
    : baseAlgorithm.id === 'matriz-dispersa'
      ? 'El código muestra AROW, ACOL y un único Node con left y up. AROW recorre de derecha a izquierda y ACOL de abajo hacia arriba hasta volver a sus cabeceras.'
    : baseAlgorithm.id === 'matriz'
      ? 'La matriz usa un arreglo bidimensional int[4][4]. Cada acceso comprueba fila y columna antes de usar values[fila][columna]. Los recorridos muestran los ciclos completos y la transposición intercambia únicamente las celdas situadas sobre la diagonal.'
    : baseAlgorithm.id === 'polinomios'
      ? 'Cada término es un Node con coefficient, exponent y next. A, B y C permanecen ordenados de mayor a menor exponente. Durante la suma, p y q comparan exponentes: avanza uno o ambos exactamente como muestra la lista.'
    : baseAlgorithm.id === 'listas-generalizadas'
      ? 'El código usa un único Node con tag 0 para átomos, tag 1 para sublistas y tag 2 para encabezamientos. link avanza en el mismo nivel, dlink baja a una sublista y ref protege las listas compartidas.'
      : baseAlgorithm.id === 'arbol-enhebrado'
        ? 'Las líneas sólidas son hijos reales. Las flechas discontinuas son hilos: LT lleva al predecesor y RT al sucesor inorden. El código comprueba los indicadores antes de seguir cada referencia.'
      : baseAlgorithm.id === 'ast'
        ? 'El analizador lee una asignación Java con descenso recursivo. parseExpression procesa + y -, parseTerm respeta la prioridad de * y /, y parseFactor reconoce paréntesis, identificadores y números. Cada nodo que aparece corresponde a la línea iluminada.'
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
      ? `/${encodeURIComponent(id)}${window.location.search}`
      : `/${window.location.search}`;
    window.history.pushState({ dsaLab: id ?? 'welcome' }, '', nextUrl);
  };
  const openAlgorithm = (id, updateHistory = true) => {
    loadAlgorithm(id);
    setShowWelcome(false);
    if (updateHistory && algorithmIdFromLocation() !== id) updateRoute(id);
  };
  const openWelcome = (updateHistory = true) => {
    setShowWelcome(true);
    setPlaying(false);
    if (updateHistory && (algorithmIdFromLocation() !== null || window.location.hash)) updateRoute(null);
  };
  useEffect(() => {
    const syncRoute = () => {
      const routedId = algorithmIdFromLocation();
      if (routedId) openAlgorithm(routedId, false);
      else openWelcome(false);
    };
    const initialRoute = algorithmIdFromLocation();
    if (window.location.hash) {
      const cleanUrl = initialRoute
        ? `/${encodeURIComponent(initialRoute)}${window.location.search}`
        : `/${window.location.search}`;
      window.history.replaceState({ dsaLab: initialRoute ?? 'welcome' }, '', cleanUrl);
    }
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
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
    const pendingFinalFrame = operationStatus === 'success' ? operationFrames.at(-1) : null;
    const previousValues = copyVisualValues(pendingFinalFrame?.values ?? demoValues);
    const previousEdges = (pendingFinalFrame?.edges ?? demoEdges).map(edge => [...edge]);
    const result = executeOperation({
      algorithm: { ...baseAlgorithm, positions: demoPositions, map: actionId === 'reset' ? DEFAULT_PATH_MAP : demoMap },
      actionId,
      fields,
      values: previousValues,
      edges: previousEdges,
      initialValues: baseAlgorithm.values,
      initialEdges: edgesForAlgorithm(baseAlgorithm),
    });
    const synchronizedFrameFactory = operationGroup(baseAlgorithm) === 'list'
      ? createLinkedListSynchronizedFrames
      : baseAlgorithm.category === 'Árboles'
        ? createTreeSynchronizedFrames
        : createCodeSynchronizedFrames;
    const frames = result.frames?.length
      ? adaptFramesToCode(result.frames, codeForAnimation, codeMode === 'java')
      : synchronizedFrameFactory({
          algorithm: baseAlgorithm,
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

      {!sidebarCollapsed && <section className="hero">
        <div><div className="eyebrow"><span>{algorithm.category}</span><i>Práctica interactiva</i></div><h1>{algorithm.name}</h1><p>{algorithm.description}</p></div>
        <div className="complexity-card"><small>Complejidad</small><strong>{algorithm.complexity}</strong><div><Gauge size={16}/><span>Análisis asintótico</span></div></div>
      </section>}

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
