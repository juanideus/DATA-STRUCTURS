import { memo, useEffect, useMemo, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { getGraphDesign } from '../data/graphDesigns.js';
import { getThreadedTreeLinks, SPARSE_MATRIX_COLUMNS, SPARSE_MATRIX_ROWS } from '../logic/operations.js';
import { DENSE_MATRIX_SIZE, normalizeDenseMatrixValues } from '../logic/denseMatrix.js';
import { generalizedListToString } from '../logic/generalizedList.js';
import { formatPolynomial, polynomialTerms } from '../logic/polynomial.js';
import { buildRecursionCallTree } from '../logic/recursionTrace.js';
import { createFibonacciForest } from '../logic/fibonacciHeap.js';
import { createMultiwayTree } from '../logic/multiwayTree.js';
import { initialNaryParents, naryChildren } from '../logic/naryTree.js';
import { DEFAULT_PATH_MAP } from '../logic/pathfindingMap.js';
import { formatMerkleHash, merkleLevels } from '../logic/merkle.js';
import { createSpatialPartitionTree } from '../logic/spatialPartitionTree.js';
import { createOpenAddressingTable } from '../logic/openAddressing.js';
import { useLanguage } from '../i18n.jsx';

const SUDOKU_START = [
  5,3,0,0,7,0,0,0,0, 6,0,0,1,9,5,0,0,0, 0,9,8,0,0,0,0,6,0,
  8,0,0,0,6,0,0,0,3, 4,0,0,8,0,3,0,0,1, 7,0,0,0,2,0,0,0,6,
  0,6,0,0,0,0,2,8,0, 0,0,0,4,1,9,0,0,5, 0,0,0,0,8,0,0,7,9,
];

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

  const english = algorithm.language === 'en';
  return <div className="circular-scroll" role="img" aria-label={doubleCircular ? (english ? 'Doubly circular linked list' : 'Lista doble circular') : (english ? 'Singly circular linked list' : 'Lista circular simple')}>
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
    <text className="circle-caption" x={width/2} y="153" textAnchor="middle">{doubleCircular
      ? (english ? 'NEXT: LAST → FIRST  ·  PREV: FIRST → LAST' : 'NEXT: ÚLTIMO → PRIMERO  ·  PREV: PRIMERO → ÚLTIMO')
      : (english ? 'NEXT: LAST NODE → FIRST NODE' : 'NEXT: ÚLTIMO NODO → PRIMER NODO')}</text>
  </svg>
  </div>;
}

function DenseMatrixVisual({ algorithm, step }) {
  const values = normalizeDenseMatrixValues(algorithm.values);
  const english = algorithm.language === 'en';
  return <div className="dense-matrix-scene" role="img" aria-label={english ? 'Dense matrix with four rows and four columns' : 'Matriz densa de cuatro filas y cuatro columnas'}>
    <div className="dense-matrix-heading">
      <strong>int[4][4]</strong>
      <span>{english ? 'linear index = row × 4 + column' : 'índice lineal = fila × 4 + columna'}</span>
    </div>
    <div className="dense-matrix-grid">
      <span className="matrix-corner">{english ? 'r\\c' : 'f\\c'}</span>
      {Array.from({ length: DENSE_MATRIX_SIZE }, (_, column) => (
        <span className="matrix-axis column-axis" key={`column-${column}`}>c{column}</span>
      ))}
      {Array.from({ length: DENSE_MATRIX_SIZE }, (_, row) => <div className="matrix-row" key={`row-${row}`}>
        <span className="matrix-axis row-axis">{english ? 'r' : 'f'}{row}</span>
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
    <div className="dense-matrix-legend"><i/> {english ? 'main diagonal' : 'diagonal principal'}</div>
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
  const en = algorithm.language === 'en';
  const root = algorithm.values[0];
  if (!root) return <div className="empty-visual"><strong>()</strong><span>{en ? 'Generalized list with no references' : 'Lista generalizada sin referencias'}</span></div>;
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
    <div className="generalized-legend"><span><i className="tag0"/>0 {en ? 'atom' : 'átomo'}</span><span><i className="tag1"/>1 {en ? 'sublist' : 'sublista'} · dlink ↓</span><span><i className="tag2"/>2 {en ? 'header' : 'encabezamiento'} · ref</span></div>
  </div>;
}

function SparseMatrixVisual({ algorithm }) {
  const en = algorithm.language === 'en';
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

  return <div className="sparse-matrix-visual" role="img" aria-label={en ? 'Sparse matrix with AROW and ACOL headers' : 'Matriz poco poblada con cabeceras AROW y ACOL'}>
    <svg viewBox="0 0 735 330" aria-hidden="true">
      <defs>
        <marker id="sparse-row-arrow" viewBox="0 0 8 8" markerWidth="7" markerHeight="7" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker>
        <marker id="sparse-column-arrow" viewBox="0 0 8 8" markerWidth="7" markerHeight="7" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker>
      </defs>

      <text className="sparse-axis-title row-title" x="24" y="23">{en ? 'ROW HEADERS' : 'CABECERAS DE FILA'}</text>
      <text className="sparse-axis-title column-title" x="172" y="12">{en ? 'COLUMN HEADERS' : 'CABECERAS DE COLUMNA'}</text>
      <text className="sparse-axis-title dimension-title" x="710" y="12" textAnchor="end">
        {en ? `HEIGHT ${SPARSE_MATRIX_ROWS} · WIDTH ${SPARSE_MATRIX_COLUMNS}` : `ALTO ${SPARSE_MATRIX_ROWS} · LARGO ${SPARSE_MATRIX_COLUMNS}`}
      </text>

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

function SkipListVisual({ algorithm, step }) {
  const values = [...algorithm.values].sort((first, second) => Number(first) - Number(second));
  const levelFor = value => {
    let hash = Math.imul(Number(value) | 0, 0x45d9f3b) >>> 0;
    let level = 0;
    while (level < 3 && (hash & 1) === 0) {
      level++;
      hash >>>= 1;
    }
    return level;
  };
  return <div className="skip-list-scene" role="img" aria-label={algorithm.language === 'en' ? 'Skip List with four linked levels' : 'Skip List con cuatro niveles enlazados'}>
    {[3, 2, 1, 0].map(level => <div className="skip-list-level" key={level}>
      <strong>L{level}</strong><span className="skip-list-head">HEAD</span>
      {values.map((value, index) => levelFor(value) >= level
        ? <span className={`skip-list-node ${index === step % values.length ? 'active' : ''}`} key={`${value}-${index}`}>{value}</span>
        : <span className="skip-list-gap" aria-hidden="true" key={`${value}-${index}`}>────</span>)}
    </div>)}
    <small>{algorithm.language === 'en' ? 'Illustrative levels; random heights may differ in Java and C++.' : 'Niveles ilustrativos: las alturas aleatorias pueden variar en Java y C++.'}</small>
  </div>;
}

function LinearVisual({ algorithm, step }) {
  const { values, type } = algorithm;
  if (!values.length) return <div className="empty-visual"><strong>∅</strong><span>{algorithm.language === 'en' ? 'Empty structure' : 'Estructura vacía'}</span></div>;
  if (type === 'skip') return <SkipListVisual algorithm={algorithm} step={step}/>;
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
    if (type === 'union') return `i${index} · r${algorithm.unionRanks?.[index] ?? 0}`;
    return index;
  };
  return <div className={`linear-visual ${type}`} role="img" aria-label={`${algorithm.language === 'en' ? 'Visualization of' : 'Visualización de'} ${algorithm.name}`}>
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

const SORT_PHASE_LABELS = {
    'quick-start': ['Preparar Quick Sort', 'Prepare Quick Sort'], 'quick-call': ['Llamada inicial', 'Initial call'],
    'quick-recursion': ['Llamada recursiva', 'Recursive call'], 'quick-base': ['Evaluar caso base', 'Check base case'],
    'partition-call': ['Particionar rango', 'Partition range'], 'partition-start': ['Comenzar partición', 'Start partition'],
    'pivot-selected': ['Elegir pivote', 'Choose pivot'], 'partition-boundary': ['Mover frontera de menores', 'Move smaller boundary'],
    'partition-loop': ['Recorrer la partición', 'Scan partition'], 'partition-loop-end': ['Finalizar recorrido', 'Finish scan'],
    'partition-compare': ['Comparar con pivote', 'Compare with pivot'], 'quick-swap-call': ['Intercambiar', 'Swap'],
    'quick-swap-save': ['Guardar temporal', 'Save temporary'], 'quick-swap-first': ['Mover primer valor', 'Move first value'],
    'quick-swap-complete': ['Intercambio completo', 'Swap complete'], 'pivot-fixed': ['Pivote en posición definitiva', 'Pivot fixed in place'],
    'quick-left-call': ['Ordenar lado izquierdo', 'Sort left side'], 'quick-right-call': ['Ordenar lado derecho', 'Sort right side'],
    'quick-return': ['Regresar de la llamada', 'Return from call'], 'quick-complete': ['Quick Sort terminado', 'Quick Sort complete'],
    'merge-start': ['Preparar Merge Sort', 'Prepare Merge Sort'], 'merge-help': ['Crear arreglo auxiliar', 'Create helper array'],
    'merge-call': ['Llamada inicial', 'Initial call'], 'merge-recursion': ['Llamada recursiva', 'Recursive call'],
    'merge-base': ['Evaluar caso base', 'Check base case'], 'merge-return': ['Regresar de la llamada', 'Return from call'],
    'merge-divide': ['Dividir en mitades', 'Split into halves'], 'merge-left-call': ['Ordenar mitad izquierda', 'Sort left half'],
    'merge-right-call': ['Ordenar mitad derecha', 'Sort right half'], 'merge-call-halves': ['Mezclar mitades', 'Merge halves'],
    'merge-halves': ['Comenzar mezcla', 'Start merge'], 'merge-pointers': ['Preparar punteros', 'Prepare pointers'],
    'merge-loop': ['Recorrer ambas mitades', 'Scan both halves'], 'merge-loop-end': ['Una mitad se agotó', 'One half is exhausted'],
    'merge-compare': ['Comparar mitades', 'Compare halves'], 'merge-copy-left': ['Copiar desde izquierda', 'Copy from left'],
    'merge-copy-right': ['Copiar desde derecha', 'Copy from right'], 'merge-pointer-move': ['Avanzar puntero', 'Move pointer'],
    'merge-left-rest': ['Copiar resto izquierdo', 'Copy left remainder'], 'merge-left-rest-end': ['Finalizar mitad izquierda', 'Finish left half'],
    'merge-right-rest': ['Copiar resto derecho', 'Copy right remainder'], 'merge-right-rest-end': ['Finalizar mitad derecha', 'Finish right half'],
    'merge-write-loop': ['Recorrer arreglo auxiliar', 'Scan helper array'], 'merge-write': ['Escribir resultado', 'Write result'],
    'merge-range-complete': ['Mezcla completa', 'Merge complete'], 'merge-complete': ['Merge Sort terminado', 'Merge Sort complete'],
    'bubble-start': ['Preparar Bubble Sort', 'Prepare Bubble Sort'], 'bubble-pass': ['Nueva pasada', 'New pass'], 'bubble-loop': ['Recorrer pares vecinos', 'Scan adjacent pairs'],
    'bubble-compare': ['Comparar vecinos', 'Compare neighbors'], 'bubble-changed': ['Registrar intercambio', 'Record swap'],
    'bubble-swap-save': ['Guardar temporal', 'Save temporary'], 'bubble-swap-first': ['Mover valor derecho', 'Move right value'],
    'bubble-swap-complete': ['Completar intercambio', 'Complete swap'],
    'bubble-early-stop': ['Comprobar parada anticipada', 'Check early stop'], 'bubble-complete': ['Bubble Sort terminado', 'Bubble Sort complete'],
    'selection-start': ['Preparar Selection Sort', 'Prepare Selection Sort'], 'selection-outer-loop': ['Elegir posición', 'Choose position'],
    'selection-inner-loop': ['Recorrer zona pendiente', 'Scan unsorted region'], 'selection-minimum': ['Elegir mínimo provisional', 'Choose current minimum'],
    'selection-compare': ['Buscar un valor menor', 'Look for a smaller value'], 'selection-new-minimum': ['Actualizar mínimo', 'Update minimum'],
    'selection-place': ['Colocar el mínimo', 'Place minimum'], 'selection-complete': ['Selection Sort terminado', 'Selection Sort complete'],
    'insertion-start': ['Preparar Insertion Sort', 'Prepare Insertion Sort'], 'insertion-loop': ['Ampliar zona ordenada', 'Grow sorted region'], 'insertion-key': ['Guardar clave', 'Save key'],
    'insertion-compare': ['Buscar posición', 'Find position'], 'insertion-shift': ['Desplazar valor', 'Shift value'],
    'insertion-move': ['Retroceder índice', 'Move index left'], 'insertion-write': ['Insertar clave', 'Insert key'],
    'insertion-complete': ['Insertion Sort terminado', 'Insertion Sort complete'],
    'shell-start': ['Preparar Shell Sort', 'Prepare Shell Sort'], 'shell-gap': ['Cambiar salto', 'Change gap'], 'shell-loop': ['Recorrer grupo', 'Scan gap group'],
    'shell-key': ['Guardar valor', 'Save value'], 'shell-compare': ['Comparar con salto', 'Compare across gap'],
    'shell-shift': ['Desplazar por salto', 'Shift by gap'], 'shell-move': ['Retroceder por salto', 'Move back by gap'],
    'shell-write': ['Insertar valor', 'Insert value'], 'shell-complete': ['Shell Sort terminado', 'Shell Sort complete'],
    'heap-sort-start': ['Construir max-heap', 'Build max-heap'], 'heap-sort-build-loop': ['Recorrer nodos internos', 'Scan internal nodes'], 'heap-sort-build': ['Heapificar nodo interno', 'Heapify internal node'],
    'heap-sort-heapify': ['Revisar subárbol', 'Check subtree'], 'heap-sort-left': ['Comparar hijo izquierdo', 'Compare left child'],
    'heap-sort-right': ['Comparar hijo derecho', 'Compare right child'], 'heap-sort-check': ['Comprobar raíz máxima', 'Check maximum root'],
    'heap-sort-descend': ['Descender en el heap', 'Move down the heap'], 'heap-sort-extract-loop': ['Recorrer extracciones', 'Scan extractions'],
    'heap-sort-extract': ['Extraer máximo', 'Extract maximum'], 'heap-sort-restore': ['Restaurar max-heap', 'Restore max-heap'],
    'heap-sort-complete': ['Heap Sort terminado', 'Heap Sort complete'],
    'counting-start': ['Preparar Counting Sort', 'Prepare Counting Sort'], 'counting-size-check': ['Comprobar tamaño', 'Check size'],
    'counting-min': ['Encontrar mínimo', 'Find minimum'], 'counting-max': ['Encontrar máximo', 'Find maximum'], 'counting-array': ['Crear contadores', 'Create counters'],
    'counting-count-loop': ['Recorrer entrada', 'Scan input'], 'counting-count': ['Contar aparición', 'Count occurrence'],
    'counting-rebuild-loop': ['Recorrer conteos', 'Scan counts'], 'counting-frequency-check': ['Comprobar frecuencia', 'Check frequency'],
    'counting-write': ['Reconstruir arreglo', 'Rebuild array'], 'counting-position': ['Avanzar escritura', 'Advance write position'],
    'counting-decrement': ['Consumir frecuencia', 'Consume frequency'],
    'counting-complete': ['Counting Sort terminado', 'Counting Sort complete'],
    'radix-start': ['Preparar Radix Sort', 'Prepare Radix Sort'], 'radix-size-check': ['Comprobar tamaño', 'Check size'],
    'radix-offset': ['Preparar claves', 'Prepare keys'], 'radix-maximum': ['Encontrar clave máxima', 'Find maximum key'], 'radix-output-array': ['Crear arreglo de salida', 'Create output array'],
    'radix-exp-loop': ['Cambiar posición decimal', 'Change decimal place'], 'radix-pass': ['Nueva pasada de dígito', 'New digit pass'],
    'radix-digit': ['Leer dígito', 'Read digit'], 'radix-count': ['Contar dígito', 'Count digit'], 'radix-prefix': ['Acumular conteos', 'Accumulate counts'],
    'radix-output': ['Distribuir establemente', 'Distribute stably'], 'radix-decrement': ['Actualizar posición', 'Update position'], 'radix-write': ['Copiar resultado', 'Copy result'],
    'radix-complete': ['Radix Sort terminado', 'Radix Sort complete'],
    'bogo-start': ['Preparar Bogo Sort', 'Prepare Bogo Sort'], 'bogo-check-loop': ['Recorrer pares', 'Scan pairs'],
    'bogo-compare': ['Buscar inversión', 'Look for inversion'], 'bogo-not-sorted': ['Devolver false', 'Return false'], 'bogo-sorted': ['Devolver true', 'Return true'],
    'bogo-check': ['Comprobar orden', 'Check order'], 'bogo-shuffle': ['Mezclar al azar', 'Shuffle randomly'],
    'bogo-shuffle-loop': ['Recorrer Fisher–Yates', 'Run Fisher–Yates'], 'bogo-random-index': ['Elegir índice aleatorio', 'Choose random index'],
    'bogo-swap-save': ['Guardar temporal', 'Save temporary'], 'bogo-swap-first': ['Mover valor aleatorio', 'Move random value'],
    'bogo-swap-complete': ['Completar intercambio', 'Complete swap'],
    'bogo-complete': ['Bogo Sort terminado', 'Bogo Sort complete'],
};

function SortVisual({ algorithm, step }) {
  const frame = algorithm.animationFrame;
  const values = algorithm.values;
  const en = algorithm.language === 'en';
  const isQuick = algorithm.id === 'quick-sort';
  const isMerge = algorithm.id === 'merge-sort';
  const phaseLabel = SORT_PHASE_LABELS[frame?.sortPhase]?.[en ? 1 : 0]
    ?? (en ? 'Sorting step' : 'Paso de ordenamiento');

  const cellLabel = index => {
    if (index === frame?.sortPivotIndex) return en ? 'PIVOT' : 'PIVOTE';
    if (index === frame?.sortCompareIndex) return 'current';
    if (frame?.sortSwapPositions?.includes(index)) return 'SWAP';
    if (index === frame?.sortWriteIndex) return 'write';
    if (frame?.sortComparePositions?.[0] === index) return 'a';
    if (frame?.sortComparePositions?.[1] === index) return 'b';
    if (indexInsideRange(index, frame?.sortLeftRange)) return en ? 'LEFT' : 'IZQ.';
    if (indexInsideRange(index, frame?.sortRightRange)) return en ? 'RIGHT' : 'DER.';
    if (frame?.sortFixedPositions?.includes(index)) return en ? 'FIXED' : 'FIJO';
    return `i=${index}`;
  };

  const auxiliary = frame?.sortAuxValues;
  return <div className={`sort-visual sort-${algorithm.id}-visual`} role="img" aria-label={`${en ? 'Real visualization of' : 'Visualización real de'} ${algorithm.name}`}>
    <div className="sort-phase-label">
      <span>{algorithm.name.toUpperCase()}</span>
      <strong>{phaseLabel}</strong>
      {frame?.sortRange && <small>{en ? 'Range' : 'Rango'} [{frame.sortRange[0]}..{frame.sortRange[1]}]</small>}
      {frame?.sortGap != null && <small>gap = {frame.sortGap}</small>}
      {frame?.sortAttempt != null && <small>{en ? 'attempt' : 'intento'} = {frame.sortAttempt}</small>}
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
    {Array.isArray(auxiliary) && <div className="sort-array-row auxiliary-row">
      <em>{frame?.sortAuxLabel ?? 'help'}</em>
      <div className="sort-cells">
        {auxiliary.map((auxValue, index) => <div
          className={`sort-cell auxiliary ${index === frame?.sortWriteIndex ? 'writing' : ''}`}
          data-aux-index={index}
          key={`aux-${index}`}
        >
          <span>{auxValue ?? '·'}</span>
          <small>{index}</small>
        </div>)}
      </div>
    </div>}
    <div className="sort-legend">
      {isQuick
        ? <><span><i className="pivot-sample"/> {en ? 'pivot' : 'pivote'}</span><span><i className="compare-sample"/> {en ? 'comparison' : 'comparación'}</span><span><i className="fixed-sample"/> {en ? 'final position' : 'posición final'}</span></>
        : isMerge
          ? <><span><i className="left-sample"/> {en ? 'left half' : 'mitad izquierda'}</span><span><i className="right-sample"/> {en ? 'right half' : 'mitad derecha'}</span><span><i className="write-sample"/> {en ? 'write' : 'escritura'}</span></>
          : <><span><i className="compare-sample"/> {en ? 'comparison' : 'comparación'}</span><span><i className="pivot-sample"/> {en ? 'movement' : 'movimiento'}</span><span><i className="fixed-sample"/> {en ? 'ordered position' : 'posición ordenada'}</span></>}
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
      const redBlackClass = algorithm.id === 'rojo-negro'
        ? algorithm.treeColors?.[index] === 'red' ? 'red-node' : 'black-node'
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
      <span className="tree-value">{algorithm.id === 'expression-tree' && values[index] === '*' ? '×'
        : algorithm.id === 'expression-tree' && values[index] === '-' ? '−' : values[index]}</span>
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
  const values = algorithm.values.slice(0, 10);
  const parents = algorithm.treeParents ?? initialNaryParents(algorithm.id, values);
  const positions = Array(values.length);
  let leafIndex = 0;
  const measure = (index, depth) => {
    const children = naryChildren(parents, index);
    const childX = children.map(child => measure(child, depth + 1));
    const rawX = childX.length ? childX.reduce((sum, x) => sum + x, 0) / childX.length : leafIndex++;
    positions[index] = { rawX, depth };
    return rawX;
  };
  if (values.length) measure(0, 0);
  const maxDepth = Math.max(1, ...positions.filter(Boolean).map(position => position.depth));
  const count = Math.max(1, leafIndex);
  const placed = positions.map(position => [count === 1 ? 50 : 10 + position.rawX / (count - 1) * 80, 13 + position.depth / maxDepth * 67]);
  const edges = parents.flatMap((parent, index) => parent >= 0 ? [[parent, index]] : []);
  return <div className="tree-canvas nary-tree-canvas">
    <span className="tree-kind-label">{algorithm.id==='arbol-nario'?'MÁXIMO 4 HIJOS POR NODO':'CANTIDAD LIBRE DE HIJOS'}</span>
    <svg className="edge-layer" aria-hidden="true">{edges.map(([from,to])=><TreeEdge key={`${from}-${to}`} from={placed[from]} to={placed[to]}/>)}</svg>
    {placed.map(([x,y],index)=><div className={`tree-node nary-node ${index===step%values.length?'active':''}`} data-parent-index={parents[index]} style={{left:`${x}%`,top:`${y}%`}} key={index}><span className="tree-value">{values[index]}</span><small className="tree-node-badge">{index===0?'ROOT':`HIJO DE ${values[parents[index]]}`}</small></div>)}
  </div>;
}

function MultiwayTreeDiagram({ algorithm, step }) {
  const values = algorithm.values.slice(0, 24);
  const structure = algorithm.multiwayTree ?? createMultiwayTree(algorithm.id, values).snapshot();
  const leaves = [];
  const levels = [];
  const collect = (source, depth, path) => {
    const current = {
      id: path, keys: source.keys, children: [], leaf: source.children.length === 0,
    };
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(current);
    current.children = source.children.map((child, index) => collect(child, depth + 1, `${path}-${index}`));
    if (current.leaf) leaves.push(current);
    return current;
  };
  const root = collect(structure.root, 0, 'root');
  leaves.forEach((leaf, index) => {
    leaf.x = leaves.length === 1 ? 50 : 8 + (index / (leaves.length - 1)) * 84;
  });
  for (let depth = levels.length - 2; depth >= 0; depth--) {
    levels[depth].forEach(current => {
      current.x = current.children.reduce((sum, child) => sum + child.x, 0) / current.children.length;
    });
  }
  levels.forEach((level, levelIndex) => {
    const y = levels.length === 1 ? 50 : 16 + (levelIndex / (levels.length - 1)) * 62;
    level.forEach(node => { node.y = y; });
  });
  const allNodes = levels.flat();
  const frame = algorithm.animationFrame;
  const promotedKey = frame?.promotedKey;
  const activeKey = values[step % values.length];
  const activeLeaf = leaves.find(leaf => leaf.keys.includes(activeKey)) ?? root;
  const promotedLeaf = leaves.find(leaf => leaf.keys.some(key => String(key) === String(promotedKey))) ?? activeLeaf;
  const activeMultiwayNode = ['search','promote','settled'].includes(frame?.treePhase) ? root : activeLeaf;
  const nodeWidth = Math.max(7, Math.min(20, 84 / Math.max(1, leaves.length)));
  return <div className={`btree-visual ${algorithm.id} ${leaves.length > 5 ? 'many-leaves' : ''}`}>
    <span className="tree-kind-label">{algorithm.id==='bplus-tree'?'DATOS SOLO EN HOJAS':algorithm.id==='bstar-tree'?'MÁX. 5 CLAVES · REDISTRIBUCIÓN':'MÁX. 3 CLAVES · MEDIANA PROMOVIDA'}</span>
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
    <div className="leaf-link">{algorithm.id==='bplus-tree'?'MÁX. 3 CLAVES POR HOJA · HOJAS ENLAZADAS →':algorithm.id==='bstar-tree'?'MÁX. 5 CLAVES · REDISTRIBUYE ANTES DE DIVIDIR':'MÁX. 3 CLAVES POR NODO · LA MEDIANA SALE DE LA HOJA'}</div>
  </div>;
}

function SegmentTreeDiagram({ algorithm, step }) {
  const values = algorithm.values.map(value => Number(value) || 0);
  const minimumMode = algorithm.activeOperation === 'range-min';
  const nodes = [];
  const edges = [];
  const depth = Math.ceil(Math.log2(Math.max(1, values.length)));
  const visit = (left, right, level, parent = null) => {
    const index = nodes.length;
    const node = {
      index, left, right, level,
      x: ((left + right + 1) / (2 * values.length)) * 100,
      y: depth === 0 ? 50 : 13 + (level / depth) * 70,
      sum: values.slice(left, right + 1).reduce((total, value) => total + value, 0),
      minimum: Math.min(...values.slice(left, right + 1)),
    };
    nodes.push(node);
    if (parent !== null) edges.push([parent, index]);
    if (left < right) {
      const middle = Math.floor((left + right) / 2);
      visit(left, middle, level + 1, index);
      visit(middle + 1, right, level + 1, index);
    }
  };
  if (values.length) visit(0, values.length - 1, 0);
  return <div className="tree-canvas tree-segment-tree segment-tree-full" role="img" aria-label={`Segment Tree con ${minimumMode ? 'mínimos' : 'sumas'} por rango`}>
    <span className="tree-kind-label">{minimumMode ? 'MÍNIMOS' : 'SUMAS'} POR RANGO · {values.length} ELEMENTOS</span>
    <svg className="edge-layer" aria-hidden="true">{edges.map(([from, to]) => <TreeEdge key={`${from}-${to}`} from={[nodes[from].x, nodes[from].y]} to={[nodes[to].x, nodes[to].y]} startPadding={16} endPadding={16}/>)}</svg>
    {nodes.map(node => <div
      className={`tree-node ${node.level === depth ? 'deep-node' : ''} ${node.left === step && node.right === step ? 'active' : ''}`}
      data-segment-range={`${node.left}-${node.right}`}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      key={node.index}
    ><span className="tree-value">{minimumMode ? node.minimum : node.sum}</span><small className="tree-node-badge">[{node.left}..{node.right}]</small></div>)}
  </div>;
}

function MerkleTreeDiagram({ algorithm, step }) {
  const levels = merkleLevels(algorithm.values);
  if (!levels.length) return <div className="empty-visual"><strong>∅</strong><span>Árbol Merkle sin bloques</span></div>;
  const leafCount = algorithm.values.length;
  const position = (node, level) => ({
    x: ((node.start + node.end + 1) / (2 * leafCount)) * 100,
    y: levels.length === 1 ? 50 : 14 + ((levels.length - 1 - level) / (levels.length - 1)) * 71,
  });
  const edges = [];
  for (let level = levels.length - 1; level > 0; level--) {
    levels[level].forEach((parent, index) => {
      for (const childIndex of [index * 2, index * 2 + 1]) {
        const child = levels[level - 1][childIndex];
        if (child) edges.push([position(parent, level), position(child, level - 1), `${level}-${index}-${childIndex}`]);
      }
    });
  }
  return <div className="tree-canvas tree-merkle-tree merkle-tree-full" role="img" aria-label={`Árbol Merkle, raíz ${formatMerkleHash(levels.at(-1)[0].hash)}`}>
    <span className="tree-kind-label">RAÍZ REAL · {formatMerkleHash(levels.at(-1)[0].hash)}</span>
    <svg className="edge-layer" aria-hidden="true">{edges.map(([from, to, key]) => <TreeEdge key={key} from={[from.x, from.y]} to={[to.x, to.y]} startPadding={16} endPadding={16}/>)}</svg>
    {levels.flatMap((nodes, level) => nodes.map((node, index) => {
      const { x, y } = position(node, level);
      const fullHash = formatMerkleHash(node.hash);
      return <div
        className={`tree-node ${level === 0 && index === step ? 'active' : ''}`}
        data-merkle-hash={fullHash}
        title={fullHash}
        style={{ left: `${x}%`, top: `${y}%` }}
        key={`${level}-${index}`}
      ><span className="tree-value">{fullHash.slice(-4)}</span><small className="tree-node-badge">{level === 0 ? node.label : level === levels.length - 1 ? 'ROOT' : 'HASH'}</small></div>;
    }))}
  </div>;
}

function FibonacciHeapDiagram({ algorithm, step }) {
  const forest = algorithm.fibonacciForest ?? createFibonacciForest(algorithm.values).snapshot();
  const roots = forest.roots;
  const nodes = [];
  const edges = [];
  const rootWidth = 88 / Math.max(1, roots.length);
  const visit = (node, x, depth, parent = null, width = rootWidth) => {
    const position = [x, 18 + depth * 29];
    nodes.push({ node, position, depth });
    if (parent) edges.push([parent, position, node.id]);
    const childWidth = width / Math.max(1, node.children.length);
    node.children.forEach((child, index) => visit(child, x + (index - (node.children.length - 1) / 2) * childWidth, depth + 1, position, childWidth));
  };
  roots.forEach((root, index) => visit(root, 6 + rootWidth * (index + .5), 0));
  const minimum = roots.length ? Math.min(...roots.map(root => root.value)) : null;
  return <div className="tree-canvas fibonacci-forest" role="img" aria-label={`Bosque Fibonacci; ${roots.length} raíces; mínimo ${minimum}`}>
    <span className="tree-kind-label">RAÍCES CIRCULARES: {roots.length} · MIN: {minimum}</span>
    <svg className="edge-layer" aria-hidden="true">{edges.map(([from, to, id]) => <TreeEdge key={id} from={from} to={to}/>)}</svg>
    {nodes.map(({ node, position, depth }, index) => <div
      className={`tree-node fib-node ${index === step % nodes.length ? 'active' : ''}`}
      data-fibonacci-role={depth === 0 ? 'root' : 'child'}
      data-fibonacci-degree={node.children.length}
      style={{ left: `${position[0]}%`, top: `${position[1]}%` }}
      key={node.id}
    ><span className="tree-value">{node.value}</span><small className="tree-node-badge">{depth === 0 ? 'ROOT' : 'CHILD'}</small></div>)}
  </div>;
}

function SpatialTreeDiagram({ algorithm, step }) {
  const root = algorithm.spatialTree ?? createSpatialPartitionTree(algorithm.id, algorithm.values).snapshot();
  const leaves = [];
  const divisions = [];
  const visit = (node, path = []) => {
    if (node.children) {
      divisions.push(node);
      node.children.forEach((child, index) => visit(child, [...path, index]));
    } else if (node.points.length) {
      leaves.push({ node, path });
    }
  };
  visit(root);
  const activePoint = algorithm.values[step % algorithm.values.length];
  if (algorithm.id === 'octree') {
    return <div className="spatial-tree-shell" role="img" aria-label="Octree con subdivisiones recursivas en ocho octantes">
      <strong>Octree · {divisions.length} subdivisiones · {leaves.length} hojas ocupadas</strong>
      <div className="spatial-leaf-list">{leaves.map(({ node, path }) => <div className="spatial-leaf" key={path.join('-')}>
        <small>RAÍZ {path.map(index => `→ octante ${index}`).join(' ')} · nivel {node.depth}</small>
        <span>{node.points.map(point => point.join(',')).join(' · ')}</span>
      </div>)}</div>
    </div>;
  }
  const scale = coordinate => (coordinate + 100) / 2;
  return <div className="spatial-tree-shell" role="img" aria-label="QuadTree con subdivisiones recursivas y puntos por hoja">
    <strong>QuadTree · {divisions.length} subdivisiones · {leaves.length} hojas ocupadas</strong>
    <div className="spatial-quad-plane">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {divisions.flatMap((node, index) => {
          const [[minX, maxX], [minY, maxY]] = node.bounds;
          const middleX = scale((minX + maxX) / 2);
          const middleY = 100 - scale((minY + maxY) / 2);
          return [
            <line key={`vertical-${index}`} x1={middleX} y1={100 - scale(maxY)} x2={middleX} y2={100 - scale(minY)}/>,
            <line key={`horizontal-${index}`} x1={scale(minX)} y1={middleY} x2={scale(maxX)} y2={middleY}/>,
          ];
        })}
      </svg>
      {algorithm.values.map((value, index) => {
        const [x, y] = String(value).split(',').map(Number);
        return <span className={`spatial-quad-point ${value === activePoint ? 'active' : ''}`}
          style={{ left: `${scale(x)}%`, top: `${100 - scale(y)}%` }} key={`${value}-${index}`}>{value}</span>;
      })}
    </div>
  </div>;
}

function TreeVisual({ algorithm, step }) {
  const values = algorithm.values.slice(0,15);
  const english = algorithm.language === 'en';
  if (!values.length) return <div className="empty-visual"><strong>∅</strong><span>{algorithm.language === 'en' ? 'Empty tree' : 'Árbol vacío'}</span></div>;
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
      if (index === frame?.heapSourcePosition && frame.heapPhase === 'move-last') return english ? 'LAST' : 'ÚLTIMO';
      if (index === frame?.heapTargetPosition && ['move-last','root-replaced'].includes(frame.heapPhase)) return english ? 'ROOT' : 'RAÍZ';
      if (index === frame?.heapParentPosition) return english ? 'PARENT' : 'PADRE';
      if (frame?.heapCandidatePositions?.includes(index)) return index === frame.heapParentPosition * 2 + 1 ? (english ? 'LEFT CHILD' : 'HIJO IZQ.') : (english ? 'RIGHT CHILD' : 'HIJO DER.');
      return index===0?'MAX':`i=${index}`;
    }
    if (algorithm.id==='kd-tree') return index===0||index===3||index===4||index===5||index===6?(english ? 'X axis' : 'eje X'):(english ? 'Y axis' : 'eje Y');
    if (algorithm.id==='splay-tree') return index===0?(english ? 'LAST ACCESS' : 'ÚLTIMO ACCESO'):'BST';
    if (algorithm.id==='expression-tree') return ['+','-','−','*','×','/'].includes(String(values[index]))?(english ? 'OPERATOR' : 'OPERADOR'):(english ? 'OPERAND' : 'OPERANDO');
    if (algorithm.id==='ast') {
      if (values[index] === 'ASSIGN') return english ? 'STATEMENT' : 'SENTENCIA';
      if (['+','-','*','/'].includes(String(values[index]))) return english ? 'OPERATOR' : 'OPERADOR';
      return /^\d+$/.test(String(values[index])) ? 'LITERAL' : (english ? 'IDENTIFIER' : 'IDENTIFICADOR');
    }
    return null;
  });
  const heapPhaseLabel = (english ? {
    'capture-root': 'EXTRACTING MAXIMUM',
    'move-last': 'LAST NODE → ROOT',
    'root-replaced': 'ROOT REPLACED',
    'remove-last': 'COMPLETE TREE · LAST LEAF REMOVED',
    'complete': 'MAX-HEAP RESTORED',
  } : {
    'capture-root': 'EXTRAYENDO EL MÁXIMO',
    'move-last': 'ÚLTIMO NODO → RAÍZ',
    'root-replaced': 'RAÍZ REEMPLAZADA',
    'remove-last': 'ÁRBOL COMPLETO · ÚLTIMA HOJA ELIMINADA',
    'complete': 'MAX-HEAP RESTAURADO',
  })[algorithm.animationFrame?.heapPhase] ?? (algorithm.animationFrame?.heapPhase ? (english ? 'HEAPIFY DOWN · RESTORING MAX-HEAP' : 'HEAPIFY DOWN · RESTAURANDO MAX-HEAP') : (english ? 'COMPLETE MAX-HEAP' : 'MAX-HEAP COMPLETO'));
  const labels = english
    ? { avl:'BALANCED HEIGHT', bst:'LEFT < ROOT < RIGHT', 'rojo-negro':'COLOR RULES', 'splay-tree':'ACCESS MOVED TO ROOT', heap:heapPhaseLabel, 'kd-tree':'AXIS PARTITIONING', 'expression-tree':'OPERATORS AND OPERANDS', ast:'STATEMENT · OPERATORS · DATA' }
    : { avl:'ALTURA BALANCEADA', bst:'IZQUIERDA < RAÍZ < DERECHA', 'rojo-negro':'REGLAS DE COLOR', 'splay-tree':'ACCESO MOVIDO A LA RAÍZ', heap:heapPhaseLabel, 'kd-tree':'PARTICIÓN POR EJES', 'expression-tree':'OPERADORES Y OPERANDOS', ast:'SENTENCIA · OPERADORES · DATOS' };
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
  const en = algorithm.language === 'en';

  return <div className={`path-map-visual ${algorithm.id === 'a-star' ? 'is-astar' : ''}`} role="img" aria-label={en ? `City map showing route search with ${modeName}` : `Mapa urbano para visualizar la búsqueda de rutas con ${modeName}`}>
    <div className="path-map-heading">
      <div>
        <span className="path-map-kicker"><i/> {en ? 'Live simulation' : 'Simulación en vivo'}</span>
        <strong><MapPin size={15}/> {en ? 'City network' : 'Red urbana'}</strong>
      </div>
      <em>{algorithm.id === 'a-star' ? (en ? 'priority: f = g + h' : 'prioridad: f = g + h') : (en ? 'priority: shortest distance' : 'prioridad: menor distancia')}</em>
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
        <circle r="10"/><circle r="3"/><text x="15" y="4">{en ? 'START' : 'INICIO'}</text>
      </g>
      <g className="path-map-marker goal-marker" transform={`translate(${goalPoint.x} ${goalPoint.y})`}>
        <circle r="10"/><path d="M-3 -5 L5 -2 L-3 1 Z M-3 -5 V6"/><text x={goalPoint.x > 820 ? -15 : 15} y="4" textAnchor={goalPoint.x > 820 ? 'end' : 'start'}>{en ? 'GOAL' : 'META'}</text>
      </g>
    </svg>

    <div className="path-map-legend">
      <span><i className="legend-start"/>{en ? 'Start' : 'Inicio'}</span>
      <span><i className="legend-goal"/>{en ? 'Goal' : 'Meta'}</span>
      <span><i className="legend-frontier"/>{en ? 'Frontier' : 'Frontera'}</span>
      <span><i className="legend-explored"/>{en ? 'Explored' : 'Explorado'}</span>
      <span><i className="legend-route"/>{en ? 'Optimal route' : 'Ruta óptima'}</span>
    </div>
    <div className="path-map-summary">
      {state ? <>
        <span><small>{en ? 'Explored' : 'Exploradas'}</small><b>{closed.size}</b></span>
        <span><small>{en ? 'Frontier' : 'Frontera'}</small><b>{open.size}</b></span>
        <span><small>{route.length > 0 ? (en ? 'Final cost' : 'Costo final') : (en ? 'Status' : 'Estado')}</small><b>{route.length > 0 ? state.cost : (en ? 'Searching' : 'Buscando')}</b></span>
      </> : <span className="path-map-empty"><small>{en ? 'Ready to begin' : 'Listo para comenzar'}</small><b>{en ? `Run ${modeName} to see the search` : `Ejecuta ${modeName} para iluminar la búsqueda`}</b></span>}
    </div>
  </div>;
}

function GraphVisual({ algorithm, step }) {
  const design = getGraphDesign(algorithm.id);
  const english = algorithm.language === 'en';
  const englishDesignCopy = {
    grafo: ['Undirected network', 'Every connection can be traversed in both directions'],
    'grafo-dirigido': ['Directed flow', 'Arrows show exactly which direction can be followed'],
    dfs: ['Depth-first exploration', 'The search follows one branch before backtracking'],
    bfs: ['Level-by-level expansion', 'The queue discovers all nearby neighbors first'],
    prim: ['Growing tree', 'The cheapest edge connected to the current tree is added'],
    kruskal: ['Edges by cost', 'Weights are ordered and components are joined without creating cycles'],
  };
  const [designLabel, designCaption] = english
    ? (englishDesignCopy[algorithm.id] ?? [design.label, design.caption])
    : [design.label, design.caption];
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
  const nodeMeta = value => {
    if (!english || !value) return value;
    return value
      .replace('nivel ', 'level ')
      .replace('prof. ', 'depth ')
      .replace('grado ', 'degree ')
      .replace('inicio', 'start')
      .replace('candidato', 'candidate')
      .replace('frontera', 'frontier')
      .replace('fuera', 'outside')
      .replace('entrada', 'input')
      .replace('salida', 'output')
      .replace('etapa ', 'stage ')
      .replace('nuevo', 'new');
  };
  if (!algorithm.values.length) return <div className="empty-visual"><strong>∅</strong><span>{algorithm.language === 'en' ? 'Empty graph' : 'Grafo vacío'}</span></div>;
  return <div className={`graph-canvas graph-design-${algorithm.id} ${graphState ? 'pathfinding-canvas' : ''}`} role="img" aria-label={`${english ? 'Graph for' : 'Grafo de'} ${algorithm.name}: ${designCaption}`}>
  <div className="graph-design-title"><span>{designLabel}</span><small>{designCaption}</small></div>
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
    return <div className={`graph-node node-${i} ${i === 0 ? 'origin-node' : ''} ${isCurrent ? 'active' : ''} ${stateClass}`} style={{left:`${x}%`,top:`${y}%`}} key={i}><span>{algorithm.values[i]}</span><small>{metric ?? nodeMeta(design.nodeMeta?.[i]) ?? `v${i}`}</small></div>;
  })}
  {isPathfindingState && <div className="pathfinding-status">
    <span><i className="open-dot"/>{english ? 'Open' : 'Abiertos'}: <b>{labelsFor(graphState.open)}</b></span>
    <span><i className="closed-dot"/>{english ? 'Closed' : 'Cerrados'}: <b>{labelsFor(graphState.closed)}</b></span>
    {graphState.mode === 'astar' && <em>f = g + h</em>}
  </div>}
  {isTraversalState && <div className="pathfinding-status graph-operation-status">
    <span><i className="closed-dot"/>{english ? 'Visited' : 'Visitados'}: <b>{labelsFor(graphState.order)}</b></span>
    <span><i className="open-dot"/>{english ? 'Pending' : 'Pendientes'}: <b>{labelsFor(graphState.frontier)}</b></span>
    <em>{graphState.mode.toUpperCase()}</em>
  </div>}
  {isSpanningTreeState && <div className="pathfinding-status graph-operation-status">
    <span><i className="closed-dot"/>{english ? 'Selected edges' : 'Aristas elegidas'}: <b>{graphState.visitedEdges?.length ?? 0}</b></span>
    <span><i className="open-dot"/>{english ? 'Cost' : 'Costo'}: <b>{graphState.totalCost ?? 0}</b></span>
    <em>{graphState.mode.toUpperCase()}</em>
  </div>}
  </div>;
}

function FenwickVisual({ algorithm, step }) {
  const values = algorithm.values.slice(0,8).map(Number);
  const minimumMode = algorithm.activeOperation === 'range-min';
  const aggregates = values.map((_, index) => {
    const bitIndex = index + 1;
    const start = bitIndex - (bitIndex & -bitIndex);
    return values.slice(start, bitIndex).reduce((sum, value) => sum + value, 0);
  });
  const displayed = minimumMode ? values : aggregates;
  const maximum = Math.max(...displayed.map(Math.abs),1);
  return <div className="fenwick-visual"><span className="tree-kind-label">{minimumMode ? 'MÍNIMO · ESCANEO DE A' : 'BIT · CADA ÍNDICE GUARDA UN RANGO'}</span><div className="fenwick-bars">{values.map((value,index)=>{
    const bitIndex=index+1, start=bitIndex-(bitIndex&-bitIndex)+1;
    return <div className={`fenwick-column ${index===step%values.length?'active':''}`} data-bit-index={bitIndex} key={index}><div className="fenwick-bar" style={{height:`${38+Math.abs(displayed[index])/maximum*80}px`}}><strong>{displayed[index]}</strong><small>{minimumMode ? `A[${index}]` : `[${start}..${bitIndex}]`}</small></div><span>i={bitIndex} · {minimumMode ? `BIT=${aggregates[index]}` : `A=${value}`}</span></div>;
  })}</div></div>;
}

function TrieTreeVisual({ algorithm, step }) {
  const words = algorithm.values.map(value=>String(value).trim().toUpperCase()).filter(Boolean);
  const trieState = algorithm.animationFrame?.trieState;
  const partialWord = trieState && !trieState.marked ? trieState.word.slice(0, trieState.revealed) : '';
  const treeWords = partialWord && !words.includes(partialWord) ? [...words, partialWord] : words;
  const nodes = [{ id:0, letter:'∅', prefix:'', depth:0, parent:null, children:new Map(), endings:[] }];

  treeWords.forEach(word => {
    let current = 0;
    let prefix = '';
    [...word].forEach(letter => {
      prefix += letter;
      if (!nodes[current].children.has(letter)) {
        const id = nodes.length;
        nodes[current].children.set(letter, id);
        nodes.push({ id, letter, prefix, depth:nodes[current].depth + 1, parent:current, children:new Map(), endings:[] });
      }
      current = nodes[current].children.get(letter);
    });
    if (word !== partialWord || trieState?.marked) nodes[current].endings.push(word);
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
    {nodes.map(node => <div className={`trie-tree-node ${node.id===0?'root':''} ${node.endings.length?'terminal':''} ${node.endings.includes(activeWord) || (partialWord && partialWord.startsWith(node.prefix))?'active':''}`} style={{left:`${node.x}%`,top:`${node.y}%`}} key={node.id}>
      <strong>{node.letter}</strong>
      {node.endings.length > 0 && <small>FIN · {node.endings.join(', ')}</small>}
    </div>)}
    <div className="trie-legend"><i/> FIN indica el último nodo de una palabra</div>
  </div>;
}

function javaStringHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
  return hash;
}

function hashKey(value) {
  return String(value ?? '').split(':')[0];
}

function HashTableVisual({ algorithm, step }) {
  const english = algorithm.language === 'en';
  const entries = algorithm.values.filter(value => value !== undefined && value !== null && String(value) !== '');
  const activeEntry = entries[Math.max(0, Math.min(entries.length - 1, step))];

  if (algorithm.id === 'hash-chaining') {
    const buckets = Array.from({ length: 8 }, () => []);
    entries.forEach(entry => {
      const index = ((javaStringHash(hashKey(entry)) % buckets.length) + buckets.length) % buckets.length;
      buckets[index].unshift(entry);
    });
    return <div className="chaining-visual" aria-label={english ? 'Hash table with separate chaining' : 'Tabla hash con encadenamiento separado'}>
      {buckets.map((bucket, index) => <div className="chain-row" key={index}>
        <span className="chain-index">{index.toString().padStart(2, '0')}</span>
        <span className="chain-head">bucket[{index}]</span>
        {bucket.length === 0 ? <span className="chain-null">null</span> : bucket.map((entry, entryIndex) => <span className={`chain-node ${entry === activeEntry ? 'active' : ''}`} key={`${entry}-${entryIndex}`}>
          {entryIndex > 0 && <i aria-hidden="true">→</i>}<strong>{String(entry)}</strong>
        </span>)}
        {bucket.length > 0 && <span className="chain-null">→ null</span>}
      </div>)}
    </div>;
  }

  const slots = algorithm.hashTable ?? createOpenAddressingTable(entries).snapshot();
  return <div className="hash-visual" aria-label={english ? 'Hash table with open addressing' : 'Tabla hash con direccionamiento abierto'}>
    {slots.map((slot, index) => <div className={`hash-slot ${slot.entry === activeEntry && slot.state === 'occupied' ? 'active' : ''} ${slot.state === 'deleted' ? 'deleted' : ''}`} key={index}>
      <small>{index.toString().padStart(2, '0')}</small><strong>{slot.state === 'deleted' ? (english ? 'DELETED' : 'BORRADA') : slot.entry ?? '∅'}</strong>
    </div>)}
  </div>;
}

function RecursionVisual({ algorithm, step }) {
  const english = algorithm.language === 'en';
  const inferredInput = algorithm.id === 'fibonacci'
    ? Math.max(0, Math.min(7, algorithm.values.length - 1))
    : Math.max(0, Math.min(10, algorithm.values.length));
  const tree = algorithm.animationFrame?.recursionTree ?? buildRecursionCallTree(algorithm.id, inferredInput, true);
  const nodesById = new Map(tree.nodes.map(node => [node.id, node]));
  const width = Math.max(680, tree.leafCount * 68);
  const height = Math.max(340, (tree.maxDepth + 1) * 76);
  const methodLabel = algorithm.id === 'fibonacci' ? 'fib' : 'factorial';
  const scrollRef = useRef(null);
  useEffect(() => {
    const container = scrollRef.current;
    const focusNode = nodesById.get(tree.activeId) ?? nodesById.get(tree.rootId);
    if (!container || !focusNode) return;
    const left = (focusNode.x / 100) * width - container.clientWidth / 2;
    const top = (focusNode.y / 100) * height - container.clientHeight / 2;
    container.scrollTo({ left: Math.max(0, left), top: Math.max(0, top), behavior: 'smooth' });
  }, [height, step, tree.activeId, tree.rootId, width]);
  return <div className="recursion-tree-shell" aria-label={`${english ? 'Call tree for' : 'Árbol de llamadas de'} ${algorithm.name}`}>
    <div className="recursion-tree-legend">
      <span><i className="call-active"/>{english ? 'Active call' : 'Llamada activa'}</span>
      <span><i className="call-waiting"/>{english ? 'Waiting for return' : 'Esperando retorno'}</span>
      <span><i className="call-returned"/>{english ? 'Computed result' : 'Resultado calculado'}</span>
    </div>
    <div className="recursion-tree-scroll" ref={scrollRef}>
      <div className={`recursion-call-tree ${algorithm.id}`} style={{ width, height }}>
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
          {tree.nodes.map(node => {
            const parent = nodesById.get(node.parentId);
            if (!parent) return null;
            return <line className={node.id === tree.activeId ? 'active' : node.status === 'returned' ? 'returned' : ''} key={`${parent.id}-${node.id}`} x1={parent.x} y1={parent.y} x2={node.x} y2={node.y}/>;
          })}
        </svg>
        {tree.nodes.map(node => <div
          className={`recursion-call-node ${node.status} ${node.id === tree.activeId ? 'current' : ''}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          key={node.id}
          aria-label={english
            ? `${methodLabel} of ${node.number}${node.result !== null ? ` returns ${node.result}` : ''}`
            : `${methodLabel} de ${node.number}${node.result !== null ? ` retorna ${node.result}` : ''}`}
        >
          <small>{methodLabel}</small><strong>({node.number})</strong>
          <em>{node.result !== null ? `= ${node.result}` : node.status === 'waiting' ? 'espera' : '…'}</em>
        </div>)}
      </div>
    </div>
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
  if (algorithm.id === 'suffix-tree') {
    const text = algorithm.values.join('');
    const suffixes = Array.from({ length: text.length }, (_, index) => text.slice(index));
    return <TrieTreeVisual algorithm={{ ...algorithm, values: suffixes }} step={step}/>;
  }
  if (algorithm.type === 'hash') return <HashTableVisual algorithm={algorithm} step={step}/>;
  if (algorithm.type === 'bloom') return <div className="hash-visual">{algorithm.values.map((v,i)=><div className={`hash-slot ${i===step%algorithm.values.length?'active':''}`} key={i}><small>{i.toString().padStart(2,'0')}</small><strong>{v}</strong></div>)}</div>;
  if (algorithm.type === 'recursion') return <RecursionVisual algorithm={algorithm} step={step}/>;
  return <LinearVisual algorithm={algorithm} step={step}/>;
}

function Visualizer({ algorithm, step }) {
  if (algorithm.type === 'polynomial') return <PolynomialVisual algorithm={algorithm}/>;
  if (algorithm.type === 'generalized-list') return <GeneralizedListVisual algorithm={algorithm}/>;
  if (algorithm.type === 'matrix') return <DenseMatrixVisual algorithm={algorithm} step={step}/>;
  if (algorithm.type === 'sparse-matrix') return <SparseMatrixVisual algorithm={algorithm}/>;
  if (!algorithm.values.length) return <EmptyVisual/>;
  if (['dijkstra','a-star'].includes(algorithm.id)) return <PathMapVisual algorithm={algorithm}/>;
  if (algorithm.type === 'sort') return <SortVisual algorithm={algorithm} step={step}/>;
  if (algorithm.id==='fenwick-tree') return <FenwickVisual algorithm={algorithm} step={step}/>;
  if (['tree','threaded-tree','heap','btree'].includes(algorithm.type)) return <TreeVisual algorithm={algorithm} step={step}/>;
  if (['graph','digraph','weighted'].includes(algorithm.type)) return <GraphVisual algorithm={algorithm} step={step}/>;
  if (['array','stack','queue','linked','circular','skip','union','cache'].includes(algorithm.type)) return <LinearVisual algorithm={algorithm} step={step}/>;
  return <SpecialVisual algorithm={algorithm} step={step}/>;
}

function EmptyVisual() {
  const { t } = useLanguage();
  return <div className="empty-visual"><strong>∅</strong><span>{t('emptyStructure')}</span></div>;
}

const MemoizedVisualizer = memo(Visualizer);

export default MemoizedVisualizer;
