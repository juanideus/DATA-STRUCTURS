import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Boxes, Brain, ChevronDown, CircleHelp, ClipboardCopy, Gauge,
  Eraser, MapPin, Maximize2, Menu, PanelLeftOpen, Pause, Play, RotateCcw, Shuffle, Sparkles, X,
} from 'lucide-react';
import { algorithmIndexes, algorithms, algorithmsById, categoryLabels } from './data/algorithms.js';
import { supportsCpp } from './data/cppCatalog.js';
import { getGraphDesign, graphEdgesFor, graphPositionsFor } from './data/graphDesigns.js';
import OperationsPanel from './components/OperationsPanel.jsx';
import VariablesPanel from './components/VariablesPanel.jsx';
import AccessibilityPanel from './components/AccessibilityPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import BugReporter from './components/BugReporter.jsx';
import { useDialogFocus } from './accessibility/useDialogFocus.js';
import { copyVisualValues } from './logic/visualValues.js';
import { DEFAULT_GRAPH_EDGES, DEFAULT_GRAPH_POSITIONS, getOperationDefinition, getThreadedTreeLinks, initialUnionRanks, operationGroup, SPARSE_MATRIX_COLUMNS, SPARSE_MATRIX_ROWS } from './logic/operationMetadata.js';
import { getOperationPseudocode } from './data/operationPseudocode.js';
import { AST_EXAMPLES, astValuesFromSource } from './logic/ast.js';
import { DENSE_MATRIX_SIZE, normalizeDenseMatrixValues } from './logic/denseMatrix.js';
import { GENERALIZED_LIST_EXAMPLES, generalizedListToString, generalizedListValuesFromSource } from './logic/generalizedList.js';
import { createRandomPathMap, DEFAULT_PATH_MAP } from './logic/pathfindingMap.js';
import { formatPolynomial, polynomialTerms } from './logic/polynomial.js';
import { buildRecursionCallTree } from './logic/recursionTrace.js';
import { cppCodeNeedle } from './logic/cppCodeNeedles.js';
import { createRedBlackTree } from './logic/redBlackTree.js';
import { createFibonacciForest } from './logic/fibonacciHeap.js';
import { createMultiwayTree } from './logic/multiwayTree.js';
import { initialNaryParents, naryChildren } from './logic/naryTree.js';
import { createSpatialPartitionTree } from './logic/spatialPartitionTree.js';
import { createOpenAddressingTable } from './logic/openAddressing.js';
import { formatMerkleHash, merkleLevels } from './logic/merkle.js';
import { getSectionTestLockedUntil } from './logic/sectionTests.js';
import { categoryDescriptions, categoryNames, localizeAlgorithm, translateCodeText, translateLearningText, translateOperationLabel, useLanguage } from './i18n.jsx';
import { algorithmIdFromPath, pageSeo, seoPath, seoUrl, SOCIAL_IMAGE_URL, structuredData } from './seo.js';

const MemoizedVisualizer = lazy(() => import('./components/Visualizer.jsx'));
const EducationalDescription = lazy(() => import('./components/EducationalDescription.jsx'));
const FoundationLesson = lazy(() => import('./components/FoundationLesson.jsx'));
const ChallengePanel = lazy(() => import('./components/ChallengePanel.jsx'));
const EnglishFoundationLesson = lazy(() => import('./components/EnglishFoundationLesson.jsx'));
const SectionTestModal = lazy(() => import('./components/SectionTestModal.jsx'));
const GuidedTour = lazy(() => import('./components/GuidedTour.jsx'));
const loadTheoryLessons = () => import('./components/TheoryLessons.jsx');
const ComplexityLesson = lazy(() => loadTheoryLessons().then(module => ({ default: module.ComplexityLesson })));
const DataStructuresLesson = lazy(() => loadTheoryLessons().then(module => ({ default: module.DataStructuresLesson })));
const OopLesson = lazy(() => loadTheoryLessons().then(module => ({ default: module.OopLesson })));

const SUDOKU_START = [
  5,3,0,0,7,0,0,0,0, 6,0,0,1,9,5,0,0,0, 0,9,8,0,0,0,0,6,0,
  8,0,0,0,6,0,0,0,3, 4,0,0,8,0,3,0,0,1, 7,0,0,0,2,0,0,0,6,
  0,6,0,0,0,0,2,8,0, 0,0,0,4,1,9,0,0,5, 0,0,0,0,8,0,0,7,9,
];

const NORMAL_FRAME_DELAY = 800;

function CodeListing({ lines, activeLine }) {
  return lines.map((line, index) => {
    const isHelperLabel = line.trim().startsWith('// Método auxiliar utilizado arriba:') || line.trim().startsWith('// Helper method used above:');
    return <code className={`${index === activeLine ? 'active' : ''} ${isHelperLabel ? 'helper-method-label' : ''}`.trim()} key={index}><i>{String(index + 1).padStart(2, '0')}</i>{line || ' '}</code>;
  });
}

const redBlackColorsFor = (algorithm, values) => algorithm.id === 'rojo-negro'
  ? createRedBlackTree(values).snapshot().colors
  : null;
const fibonacciForestFor = (algorithm, values) => algorithm.id === 'fibonacci-heap'
  ? createFibonacciForest(values).snapshot()
  : null;
const multiwayTreeFor = (algorithm, values) => algorithm.type === 'btree'
  ? createMultiwayTree(algorithm.id, values).snapshot()
  : null;
const spatialTreeFor = (algorithm, values) => ['quadtree', 'octree'].includes(algorithm.id)
  ? createSpatialPartitionTree(algorithm.id, values).snapshot()
  : null;
const hashTableFor = (algorithm, values) => ['hash-table', 'hash-open'].includes(algorithm.id)
  ? createOpenAddressingTable(values).snapshot()
  : null;
const unionRanksFor = (algorithm, values) => algorithm.id === 'union-find'
  ? initialUnionRanks(values)
  : null;
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

const legacyAlgorithmIds = new Map([
  ['memoria-referencias', 'punteros-referencias'],
  ['punteros-referencias-java', 'punteros-referencias'],
]);

const algorithmIdFromLocation = () => {
  if (typeof window === 'undefined') return null;
  try {
    const pathCandidate = algorithmIdFromPath(window.location.pathname);
    const resolvedPath = legacyAlgorithmIds.get(pathCandidate) ?? pathCandidate;
    if (algorithmsById.has(resolvedPath)) return resolvedPath;

    // Compatibilidad temporal con enlaces antiguos como /#/avl.
    const candidate = decodeURIComponent(window.location.hash.replace(/^#\/?/, '').trim());
    const resolvedHash = legacyAlgorithmIds.get(candidate) ?? candidate;
    return algorithmsById.has(resolvedHash) ? resolvedHash : null;
  } catch {
    return null;
  }
};

const initialAlgorithmId = () => {
  const routed = algorithmIdFromLocation();
  const stored = readPreference(STORAGE_KEYS.selectedAlgorithm, 'array');
  const resolvedStored = legacyAlgorithmIds.get(stored) ?? stored;
  return routed ?? (algorithmsById.has(resolvedStored) ? resolvedStored : 'array');
};

const randomNumber = (minimum, maximum) => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
const usesNodeGraph = algorithm => algorithm.category === 'Grafos' && !['dijkstra', 'a-star'].includes(algorithm.id);
const pathfindingCodeNeedle = (algorithmId, codeMode, frame) => {
  const astar = algorithmId === 'a-star';
  const cpp = codeMode === 'cpp';
  const found = frame.mapState?.path?.length > 0;
  const needles = {
    initialize: astar ? (cpp ? 'distance[start] = 0;' : 'g[start] = 0;') : 'distance[start] = 0;',
    select: astar
      ? (cpp ? 'int current = minimumScore(score, closed);' : 'int current = smallestF(f, open);')
      : (cpp ? 'int current = minimumDistance(settled);' : 'int current = smallestDistance(distance, visited);'),
    goal: cpp ? 'if (current == goal) {' : astar ? 'if (current == goal) {' : 'if (current == goal) break;',
    close: astar ? 'closed[current] = true;'
      : cpp ? 'settled[current] = true;' : 'visited[current] = true;',
    neighbors: cpp ? 'for (int i = 0; i < count; i++) {' : 'for (int i = 0; i < 4; i++) {',
    relax: astar ? (cpp ? 'distance[neighbor] = candidate;' : 'g[next] = newG;')
      : cpp ? 'distance[neighbor] = candidate;' : 'distance[next] = newDistance;',
    finish: cpp ? (found ? 'return true;' : astar ? 'return false;' : 'return reached;')
      : astar ? (found ? 'return reconstructPath(previous, start, goal);' : 'return new int[0];')
        : 'return reconstructPath(previous, start, goal);',
  };
  return needles[frame.codePhase];
};
const positionsForAlgorithm = (algorithm, jitter = false) => (
  usesNodeGraph(algorithm) ? graphPositionsFor(algorithm.id, jitter) : DEFAULT_GRAPH_POSITIONS.map(position => [...position])
);
const edgesForAlgorithm = (algorithm, randomizeWeights = false) => (
  usesNodeGraph(algorithm)
    ? graphEdgesFor(algorithm.id, randomizeWeights && algorithm.type === 'weighted')
    : DEFAULT_GRAPH_EDGES.map(edge => [...edge])
);

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

function randomKdLevelOrder() {
  const point = (x, y) => x * 10 + y;
  const rootX = randomNumber(4, 5);
  const rootY = randomNumber(4, 5);
  const leftX = randomNumber(1, 3);
  const leftY = randomNumber(4, 6);
  const rightX = randomNumber(7, 9);
  const rightY = randomNumber(4, 6);
  return [
    point(rootX, rootY),
    point(leftX, leftY),
    point(rightX, rightY),
    point(randomNumber(0, 4), randomNumber(0, leftY - 1)),
    point(randomNumber(0, 4), randomNumber(leftY + 1, 9)),
    point(randomNumber(5, 9), randomNumber(0, rightY - 1)),
    point(randomNumber(5, 9), randomNumber(rightY + 1, 9)),
  ];
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
    const length = randomNumber(6, 8), values = [0, 1];
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
  if (algorithm.id === 'expression-tree') return ['+','*','-',...randomUniqueNumbers(4, 1, 9).map(String)];
  if (algorithm.id === 'ast') return astValuesFromSource(AST_EXAMPLES[randomNumber(0, AST_EXAMPLES.length - 1)]);
  if (algorithm.id === 'merkle-tree') return Array.from({ length: amount }, () => `B${randomNumber(10, 99)}`);
  if (algorithm.id === 'kd-tree') return randomKdLevelOrder();
  if (['quadtree', 'octree'].includes(algorithm.id)) {
    const points = new Set();
    while (points.size < Math.min(amount, 12)) {
      const coordinates = Array.from({ length: algorithm.id === 'octree' ? 3 : 2 }, () => randomNumber(-90, 90));
      points.add(coordinates.join(','));
    }
    return [...points];
  }
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
  if (['arbol-enhebrado','bst','avl','rojo-negro','splay-tree'].includes(algorithm.id)) return balancedLevelOrder(values.sort((a, b) => a - b));
  if (algorithm.type === 'heap') return values.sort((a, b) => b - a);
  if (['skip-list','btree','bplus-tree','bstar-tree'].includes(algorithm.id)) return values.sort((a, b) => a - b);
  return values;
}

function createEmptyValues(algorithm) {
  if (algorithm.id === 'matriz') return new Array(DENSE_MATRIX_SIZE ** 2).fill(0);
  if (algorithm.id === 'sudoku') return new Array(81).fill(0);
  if (algorithm.id === 'laberinto') return new Array(36).fill(0);
  if (algorithm.id === 'n-reinas') return new Array(Math.max(4, algorithm.values.length)).fill(-1);
  if (algorithm.id === 'union-find') return algorithm.values.map((_, index) => index);
  if (['segment-tree', 'fenwick-tree', 'bloom-filter'].includes(algorithm.id)) {
    return algorithm.values.map(() => 0);
  }
  if (['dijkstra', 'a-star'].includes(algorithm.id)) return [...algorithm.values];
  return [];
}


function DescriptionFallback() {
  const { t } = useLanguage();
  return <section className="description-loading" aria-label={t('loadingDescription')}>
    <span/><div><i/><i/><i/></div>
  </section>;
}

function OpeningIntro({ onDone }) {
  const { language } = useLanguage();
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  const exitTimer = useRef(null);
  const finishTimer = useRef(null);

  const enterNow = useCallback(() => {
    window.clearTimeout(exitTimer.current);
    window.clearTimeout(finishTimer.current);
    setLeaving(true);
    finishTimer.current = window.setTimeout(() => onDoneRef.current(), 620);
  }, []);
  const dialogRef = useDialogFocus({ onClose: enterNow });

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  useEffect(() => {
    exitTimer.current = window.setTimeout(() => setLeaving(true), 7200);
    finishTimer.current = window.setTimeout(() => onDoneRef.current(), 7850);
    return () => {
      window.clearTimeout(exitTimer.current);
      window.clearTimeout(finishTimer.current);
    };
  }, []);

  const copy = language === 'en' ? {
    visual:'Visual algorithms', enter:'Enter now', kicker:'Inspired by better learning', titleA:'Understanding is easier', titleB:'when you can see it.',
    description:'This page was created to improve student learning: visualize every step, experiment with structures, and build your own algorithms more easily.',
    see:'Visualize', seeText:'Observe what happens at every step.', understand:'Understand', understandText:'Connect the animation with Java and C++.', create:'Create', createText:'Build your own algorithms.',
    preparing:'Preparing your learning space', motto:'Your imagination is the limit',
  } : {
    visual:'Algoritmos visuales', enter:'Entrar ahora', kicker:'Inspirada en aprender mejor', titleA:'Comprender es más fácil', titleB:'cuando puedes verlo.',
    description:'Esta página fue creada para mejorar el aprendizaje de los estudiantes: permite visualizar cada paso, experimentar con las estructuras y realizar sus propios algoritmos de una manera más sencilla.',
    see:'Visualiza', seeText:'Observa qué ocurre en cada paso.', understand:'Comprende', understandText:'Relaciona la animación con Java y C++.', create:'Crea', createText:'Construye tus propios algoritmos.',
    preparing:'Preparando tu espacio de aprendizaje', motto:'El límite es tu imaginación',
  };
  return <section ref={dialogRef} tabIndex="-1" className={`opening-intro ${leaving ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="opening-title">
    <div className="opening-surface">
      <header className="opening-header">
        <div><span className="opening-logo"><Boxes size={22}/></span><p><strong>DSA Lab</strong><small>{copy.visual}</small></p></div>
        <button type="button" onClick={enterNow}>{copy.enter} <ArrowRight size={15}/></button>
      </header>

      <div className="opening-content">
        <div className="opening-message">
          <span className="opening-kicker"><Sparkles size={14}/> {copy.kicker}</span>
          <h1 id="opening-title"><span>{copy.titleA}</span><span>{copy.titleB}</span></h1>
          <p>{copy.description}</p>
        </div>

        <div className="opening-journey" aria-hidden="true">
          <div><span><Play size={17}/></span><p><small>01</small><strong>{copy.see}</strong><em>{copy.seeText}</em></p></div>
          <div><span><BookOpen size={17}/></span><p><small>02</small><strong>{copy.understand}</strong><em>{copy.understandText}</em></p></div>
          <div><span><Boxes size={17}/></span><p><small>03</small><strong>{copy.create}</strong><em>{copy.createText}</em></p></div>
        </div>
      </div>

      <footer className="opening-footer"><span>{copy.preparing}</span><div><i/></div><small>{copy.motto}</small></footer>
    </div>
  </section>;
}

function Welcome({ onStart, startName }) {
  const { language } = useLanguage();
  const c = language === 'en' ? {
    hello:'DSA Lab',learn:'Made for learning by doing',title:'Data structures make more sense when you can see them change.',
    lead:'Choose a topic, change the data, and follow each operation step by step. The visualization and the Java or C++ code move together, so you can see why each result happens.',
    continue:'Explore',motto:'A study companion for Data Structures students.',about:'Inside the lab',aboutTitle:'Try it, make a mistake, and try again',
    aboutText:'This is a place to explore how an algorithm works, not just memorize its answer. Start with a ready-made example or clear it and build your own.',
    topics:'topics to explore',topicsText:'Start with arrays and lists, then move on to trees, graphs, sorting, and more.',practice:'Change the data',practiceText:'Add, remove, or search for a value. Watch the structure respond to what you do.',
    java:'Follow the code',javaText:'Switch between Java and C++. The highlighted line follows the animation.',miniLabel:'Adding at the beginning',miniCaption:'The new value takes index 0; the others move one place.',
  } : {
    hello:'DSA Lab',learn:'Para aprender haciendo',title:'Las estructuras de datos se entienden mejor cuando las ves cambiar.',
    lead:'Elige un tema, cambia los datos y sigue cada operación paso a paso. La visualización avanza junto al código Java o C++, para que veas por qué ocurre cada resultado.',
    continue:'Explorar',motto:'Un apoyo para estudiantes de Estructuras de Datos.',about:'Dentro del laboratorio',aboutTitle:'Prueba, equivócate y vuelve a intentar',
    aboutText:'Este es un espacio para explorar cómo funciona un algoritmo, no solo memorizar su respuesta. Puedes partir de un ejemplo listo o vaciarlo y construir el tuyo.',
    topics:'temas para explorar',topicsText:'Empieza con arreglos y listas; después sigue con árboles, grafos, ordenamientos y más.',practice:'Cambia los datos',practiceText:'Agrega, elimina o busca un valor. Observa cómo responde la estructura a lo que haces.',
    java:'Sigue el código',javaText:'Alterna entre Java y C++. La línea destacada acompaña a la animación.',miniLabel:'Agregar al inicio',miniCaption:'El valor nuevo ocupa el índice 0; los demás avanzan un lugar.',
  };
  return <div className="welcome-page">
    <section className="welcome-hero">
      <div className="welcome-copy">
        <div className="eyebrow"><span>{c.hello}</span><i>{c.learn}</i></div>
        <h1>{c.title}</h1><p>{c.lead}</p>
        <button className="welcome-start" onClick={onStart}><Play size={17}/> {c.continue} {startName} <ArrowRight size={16}/></button>
        <p className="welcome-motto">{c.motto}</p>
      </div>
      <div className="welcome-demo" aria-hidden="true">
        <span className="welcome-demo-label">{c.miniLabel}</span>
        <div className="welcome-demo-row"><span className="new-value">12<small>0</small></span><i>→</i><span>7<small>1</small></span><i>→</i><span>19<small>2</small></span></div>
        <p>{c.miniCaption}</p>
        <code>result[0] = value;</code>
      </div>
    </section>

    <section className="welcome-about" aria-labelledby="welcome-about-title">
      <div className="welcome-section-heading">
        <span>{c.about}</span><h2 id="welcome-about-title">{c.aboutTitle}</h2><p>{c.aboutText}</p>
      </div>
      <div className="welcome-features">
        <article><Boxes size={21}/><h3>{algorithms.length} {c.topics}</h3><p>{c.topicsText}</p></article>
        <article><Play size={21}/><h3>{c.practice}</h3><p>{c.practiceText}</p></article>
        <article><BookOpen size={21}/><h3>{c.java}</h3><p>{c.javaText}</p></article>
      </div>
    </section>

  </div>;
}

function App() {
  const { language, setLanguage, t } = useLanguage();
  const [startingId] = useState(initialAlgorithmId);
  const startingAlgorithm = algorithmsById.get(startingId) ?? algorithms[0];
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
  const [codeMode, setCodeMode] = useState(() => {
    const stored = readPreference(STORAGE_KEYS.codeMode, 'java');
    return ['java', 'cpp', 'pseudo'].includes(stored) ? stored : 'java';
  });
  const [copied, setCopied] = useState(false);
  const [fullCodeOpen, setFullCodeOpen] = useState(false);
  const codePanelRef = useRef(null);
  const fullCodePreRef = useRef(null);
  const fullCodeDialogRef = useDialogFocus({ open: fullCodeOpen, onClose: () => setFullCodeOpen(false) });
  const sourceAlgorithm = algorithmsById.get(selectedId) ?? algorithms[0];
  const baseAlgorithm = useMemo(() => localizeAlgorithm(sourceAlgorithm, language), [sourceAlgorithm, language]);
  const [activeOperation, setActiveOperation] = useState(() => getOperationDefinition(startingAlgorithm).actions[0]?.id ?? null);
  const [operationFrames, setOperationFrames] = useState([]);
  const [activeCodeLine, setActiveCodeLine] = useState(null);
  const [demoValues, setDemoValues] = useState(() => [...startingAlgorithm.values]);
  const [demoTreeColors, setDemoTreeColors] = useState(() => redBlackColorsFor(startingAlgorithm, startingAlgorithm.values));
  const [demoFibonacciForest, setDemoFibonacciForest] = useState(() => fibonacciForestFor(startingAlgorithm, startingAlgorithm.values));
  const [demoMultiwayTree, setDemoMultiwayTree] = useState(() => multiwayTreeFor(startingAlgorithm, startingAlgorithm.values));
  const [demoTreeParents, setDemoTreeParents] = useState(() => initialNaryParents(startingAlgorithm.id, startingAlgorithm.values));
  const [demoSpatialTree, setDemoSpatialTree] = useState(() => spatialTreeFor(startingAlgorithm, startingAlgorithm.values));
  const [demoHashTable, setDemoHashTable] = useState(() => hashTableFor(startingAlgorithm, startingAlgorithm.values));
  const [demoUnionRanks, setDemoUnionRanks] = useState(() => unionRanksFor(startingAlgorithm, startingAlgorithm.values));
  const [demoEdges, setDemoEdges] = useState(() => edgesForAlgorithm(startingAlgorithm));
  const [demoPositions, setDemoPositions] = useState(() => positionsForAlgorithm(startingAlgorithm));
  const [demoMap, setDemoMap] = useState(DEFAULT_PATH_MAP);
  const [operationMessage, setOperationMessage] = useState('Usa los controles para modificar la estructura y observar el resultado.');
  const [operationStatus, setOperationStatus] = useState('idle');
  const [challengeMode, setChallengeMode] = useState(false);
  const [challengeScenarioKey, setChallengeScenarioKey] = useState(0);
  const [javaCodeFactory, setJavaCodeFactory] = useState(null);
  const [cppCodeFactory, setCppCodeFactory] = useState(null);
  const [sectionTest, setSectionTest] = useState(null);
  const [sectionTestActive, setSectionTestActive] = useState(false);
  const [sectionTestViolation, setSectionTestViolation] = useState(null);
  const [sectionTestClock, setSectionTestClock] = useState(Date.now());
  const [tourOpen, setTourOpen] = useState(false);
  const algorithm = useMemo(
    () => ({ ...baseAlgorithm, values: demoValues, treeColors: demoTreeColors, fibonacciForest: demoFibonacciForest, multiwayTree: demoMultiwayTree, treeParents: demoTreeParents, spatialTree: demoSpatialTree, hashTable: demoHashTable, unionRanks: demoUnionRanks, edges: demoEdges, positions: demoPositions, map: demoMap }),
    [baseAlgorithm, demoValues, demoTreeColors, demoFibonacciForest, demoMultiwayTree, demoTreeParents, demoSpatialTree, demoHashTable, demoUnionRanks, demoEdges, demoPositions, demoMap],
  );
  const isTheoryPage = ['theory', 'complexity', 'oop', 'foundation'].includes(baseAlgorithm.type);
  const selectedIndex = algorithmIndexes.get(baseAlgorithm.id) ?? 0;
  const operationDefinition = useMemo(() => getOperationDefinition(baseAlgorithm), [baseAlgorithm]);
  const activeOperationLabel = useMemo(
    () => translateOperationLabel(operationDefinition.actions.find(item => item.id === activeOperation)?.label ?? t('operation'), language),
    [activeOperation, language, operationDefinition, t],
  );
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
      : ['fibonacci', 'factorial'].includes(baseAlgorithm.id)
        ? 'Cada nodo representa una llamada real del método recursivo. Naranja indica la llamada activa, azul una llamada que espera el retorno de su hija y verde un resultado ya calculado. La línea Java y las variables avanzan junto al nodo enfocado.'
      : baseAlgorithm.id === 'ast'
        ? 'El analizador lee una asignación Java con descenso recursivo. parseExpression procesa + y -, parseTerm respeta la prioridad de * y /, y parseFactor reconoce paréntesis, identificadores y números. Cada nodo que aparece corresponde a la línea iluminada.'
      : 'El código usa variables, arreglos, ciclos, condiciones y métodos pequeños. Cada línea iluminada corresponde al cambio mostrado en la estructura.';
  const sourceCode = useMemo(() => (
    isTheoryPage
      ? ''
      : codeMode === 'java'
        ? javaCodeFactory?.(baseAlgorithm, activeOperation) ?? '// Cargando código Java…'
        : codeMode === 'cpp'
          ? cppCodeFactory?.(baseAlgorithm, activeOperation) ?? '// Cargando código C++…'
        : getOperationPseudocode(baseAlgorithm, activeOperation)
  ), [activeOperation, baseAlgorithm, codeMode, isTheoryPage, javaCodeFactory, cppCodeFactory]);
  const displayedCode = useMemo(() => translateCodeText(sourceCode, language), [language, sourceCode]);
  const codeLines = useMemo(() => displayedCode.split('\n'), [displayedCode]);
  const highlightedCodeLine = activeCodeLine ?? step % codeLines.length;
  const totalSteps = operationFrames.length || Math.max(algorithm.values.length, codeLines.length);
  const currentAnimationFrame = operationFrames[step] ?? null;
  const sectionTestLockedUntil = getSectionTestLockedUntil(baseAlgorithm.id, sectionTestClock);
  const sectionTestRemainingMs = Math.max(0, sectionTestLockedUntil - sectionTestClock);
  const sectionTestRemainingMinutes = Math.ceil(sectionTestRemainingMs / 60000);
  const visualAlgorithm = useMemo(
    () => ({ ...algorithm, language, activeOperation, animationFrame: currentAnimationFrame }),
    [algorithm, language, activeOperation, currentAnimationFrame],
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
    const parameters = new URLSearchParams(window.location.search);
    const hadLanguageParameter = parameters.has('lang');
    parameters.delete('lang');
    const search = parameters.toString();
    const expectedPath = seoPath(showWelcome ? null : selectedId, language);
    if (window.location.pathname === expectedPath && !hadLanguageParameter) return;
    window.history.replaceState(
      { dsaLab: showWelcome ? 'welcome' : selectedId },
      '',
      `${expectedPath}${search ? `?${search}` : ''}`,
    );
  }, [language, selectedId, showWelcome]);
  useEffect(() => {
    document.documentElement.lang = language;
    const seo = pageSeo(showWelcome ? null : sourceAlgorithm, language);
    const currentId = showWelcome ? null : sourceAlgorithm.id;
    const setMeta = (selector, value) => document.head.querySelector(selector)?.setAttribute('content', value);
    document.title = seo.title;
    setMeta('meta[name="description"]', seo.description);
    setMeta('meta[itemprop="name"]', seo.title);
    setMeta('meta[itemprop="description"]', seo.description);
    setMeta('meta[itemprop="image"]', SOCIAL_IMAGE_URL);
    setMeta('meta[property="og:locale"]', language === 'en' ? 'en_US' : 'es_CL');
    setMeta('meta[property="og:locale:alternate"]', language === 'en' ? 'es_CL' : 'en_US');
    setMeta('meta[property="og:title"]', seo.title);
    setMeta('meta[property="og:description"]', seo.description);
    setMeta('meta[property="og:url"]', seo.url);
    setMeta('meta[property="og:image"]', SOCIAL_IMAGE_URL);
    setMeta('meta[property="og:image:url"]', SOCIAL_IMAGE_URL);
    setMeta('meta[property="og:image:secure_url"]', SOCIAL_IMAGE_URL);
    setMeta('meta[property="og:image:alt"]', seo.imageAlt);
    setMeta('meta[name="twitter:title"]', seo.title);
    setMeta('meta[name="twitter:description"]', seo.description);
    setMeta('meta[name="twitter:url"]', seo.url);
    setMeta('meta[name="twitter:image"]', SOCIAL_IMAGE_URL);
    setMeta('meta[name="twitter:image:alt"]', seo.imageAlt);
    document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', seo.url);
    document.head.querySelector('link[hreflang="es"]')?.setAttribute('href', seoUrl(currentId, 'es'));
    document.head.querySelector('link[hreflang="en"]')?.setAttribute('href', seoUrl(currentId, 'en'));
    document.head.querySelector('link[hreflang="x-default"]')?.setAttribute('href', seoUrl(currentId, 'es'));
    let schema = document.head.querySelector('#dsa-structured-data');
    if (!schema) {
      schema = document.createElement('script');
      schema.id = 'dsa-structured-data';
      schema.type = 'application/ld+json';
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify(structuredData(showWelcome ? null : sourceAlgorithm, language));
  }, [language, showWelcome, sourceAlgorithm]);
  useEffect(() => {
    if (isTheoryPage || javaCodeFactory) return;
    let active = true;
    import('./data/beginnerJava.js').then(module => {
      if (active) setJavaCodeFactory(() => module.getBeginnerJava);
    }).catch(() => {
      if (!active) return;
      setOperationStatus('error');
      setOperationMessage(language === 'en'
        ? 'The operation code could not be loaded. Reload the page and try again.'
        : 'No se pudo cargar el código de la operación. Recarga la página e inténtalo de nuevo.');
    });
    return () => { active = false; };
  }, [isTheoryPage, javaCodeFactory, language]);
  useEffect(() => {
    if (isTheoryPage || codeMode !== 'cpp' || cppCodeFactory || !supportsCpp(baseAlgorithm.id)) return;
    let active = true;
    import('./data/beginnerCpp.js').then(module => {
      if (active) setCppCodeFactory(() => module.getBeginnerCpp);
    }).catch(() => {
      if (!active) return;
      setOperationStatus('error');
      setOperationMessage(language === 'en'
        ? 'The operation code could not be loaded. Reload the page and try again.'
        : 'No se pudo cargar el código de la operación. Recarga la página e inténtalo de nuevo.');
    });
    return () => { active = false; };
  }, [baseAlgorithm.id, codeMode, cppCodeFactory, isTheoryPage, language]);
  useEffect(() => {
    if (codeMode === 'cpp' && !supportsCpp(baseAlgorithm.id)) setCodeMode('java');
  }, [baseAlgorithm.id, codeMode]);
  useEffect(() => {
    if (!sectionTestLockedUntil) return undefined;
    const timer = window.setInterval(() => setSectionTestClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sectionTestLockedUntil]);

  const applyFrame = (frame, frameIndex) => {
    if (!frame) return;
    setDemoValues(copyVisualValues(frame.values));
    if (frame.treeColors) setDemoTreeColors(frame.treeColors);
    if (frame.fibonacciForest) setDemoFibonacciForest(frame.fibonacciForest);
    if (frame.multiwayTree) setDemoMultiwayTree(frame.multiwayTree);
    if (frame.treeParents) setDemoTreeParents(frame.treeParents);
    if (frame.spatialTree) setDemoSpatialTree(frame.spatialTree);
    if (frame.hashTable) setDemoHashTable(frame.hashTable);
    if (frame.unionRanks) setDemoUnionRanks(frame.unionRanks);
    if (frame.edges) setDemoEdges(frame.edges.map(edge => [...edge]));
    setStep(frameIndex);
    setActiveCodeLine(frame.codeLine ?? null);
    setOperationMessage(frame.message);
  };

  useEffect(()=>{ window.scrollTo({ top: 0, behavior: 'auto' }); },[showWelcome, selectedId]);
  useEffect(()=>{ setFullCodeOpen(false); }, [selectedId, showWelcome]);
  useEffect(()=>{
    const finalFrame = operationFrames.at(-1);
    if (finalFrame) applyFrame(finalFrame, operationFrames.length - 1);
    setStep(0);
    setPlaying(false);
    setCopied(false);
    setOperationFrames([]);
    setActiveCodeLine(null);
  },[codeMode]);
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
    const isPathfindingTrace = ['dijkstra','a-star'].includes(baseAlgorithm.id);
    for (const panel of [codePanelRef.current, fullCodePreRef.current]) {
      const activeLine = panel?.querySelector('code.active');
      if (!panel || !activeLine) continue;
      const margin = isPathfindingTrace ? 4 : 28;
      const panelBounds = panel.getBoundingClientRect();
      const lineBounds = activeLine.getBoundingClientRect();
      const visibleTop = panelBounds.top + margin;
      const visibleBottom = panelBounds.bottom - margin;
      let target = null;
      if (lineBounds.top < visibleTop) target = panel.scrollTop + lineBounds.top - visibleTop;
      else if (lineBounds.bottom > visibleBottom) target = panel.scrollTop + lineBounds.bottom - visibleBottom;
      if (target !== null) panel.scrollTo({ top: Math.max(0, target), behavior: isPathfindingTrace ? 'auto' : 'smooth' });
    }
  },[activeCodeLine,step,displayedCode,playing,baseAlgorithm.id,fullCodeOpen]);
  const loadAlgorithm = useCallback(id => {
    const nextAlgorithm = algorithmsById.get(id) ?? algorithms[0];
    setSelectedId(nextAlgorithm.id);
    setDemoValues([...nextAlgorithm.values]);
    setDemoTreeColors(redBlackColorsFor(nextAlgorithm, nextAlgorithm.values));
    setDemoFibonacciForest(fibonacciForestFor(nextAlgorithm, nextAlgorithm.values));
    setDemoMultiwayTree(multiwayTreeFor(nextAlgorithm, nextAlgorithm.values));
    setDemoTreeParents(initialNaryParents(nextAlgorithm.id, nextAlgorithm.values));
    setDemoSpatialTree(spatialTreeFor(nextAlgorithm, nextAlgorithm.values));
    setDemoHashTable(hashTableFor(nextAlgorithm, nextAlgorithm.values));
    setDemoUnionRanks(unionRanksFor(nextAlgorithm, nextAlgorithm.values));
    setDemoEdges(edgesForAlgorithm(nextAlgorithm));
    setDemoPositions(positionsForAlgorithm(nextAlgorithm));
    setDemoMap(DEFAULT_PATH_MAP);
    setActiveOperation(getOperationDefinition(nextAlgorithm).actions[0]?.id ?? null);
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage('Usa los controles para modificar la estructura y observar el resultado.');
    setOperationStatus('idle');
    setChallengeMode(false);
    setStep(0);
    setPlaying(false);
    setCopied(false);
  }, []);
  const selectRelative = (delta) => {
    const index = algorithmIndexes.get(algorithm.id) ?? 0;
    openAlgorithm(algorithms[(index+delta+algorithms.length)%algorithms.length].id);
  };
  const updateRoute = useCallback(id => {
    const parameters = new URLSearchParams(window.location.search);
    parameters.delete('lang');
    const search = parameters.toString();
    const nextUrl = `${seoPath(id, language)}${search ? `?${search}` : ''}`;
    window.history.pushState({ dsaLab: id ?? 'welcome' }, '', nextUrl);
  }, [language]);
  const registerTestViolation = useCallback(reason => {
    if (!sectionTestActive) return;
    setSectionTestViolation({ reason, time: Date.now() });
  }, [sectionTestActive]);
  const openAlgorithm = useCallback((id, updateHistory = true) => {
    registerTestViolation('navigation');
    loadAlgorithm(id);
    setShowWelcome(false);
    if (updateHistory && algorithmIdFromLocation() !== id) updateRoute(id);
  }, [loadAlgorithm, registerTestViolation, updateRoute]);
  const openWelcome = useCallback((updateHistory = true) => {
    registerTestViolation('navigation');
    setShowWelcome(true);
    setPlaying(false);
    if (updateHistory && (algorithmIdFromLocation() !== null || window.location.hash)) updateRoute(null);
  }, [registerTestViolation, updateRoute]);
  const toggleSidebar = useCallback(() => setSidebarCollapsed(value => !value), []);
  const startGuidedTour = useCallback(() => {
    setPlaying(false);
    setShowOpeningIntro(false);
    setSidebarCollapsed(false);
    setMobileOpen(window.innerWidth <= 780);
    const needsCompleteLab = isTheoryPage;
    if (showWelcome || needsCompleteLab) openAlgorithm(needsCompleteLab ? 'array' : selectedId);
    setTourOpen(true);
  }, [isTheoryPage, openAlgorithm, selectedId, showWelcome]);
  const closeGuidedTour = useCallback(() => {
    setTourOpen(false);
    if (window.innerWidth <= 780) setMobileOpen(false);
  }, []);
  const handleTourStepChange = useCallback(index => {
    if (window.innerWidth <= 780) setMobileOpen(index === 0);
  }, []);
  useEffect(() => {
    const syncRoute = () => {
      registerTestViolation('history');
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
  }, [openAlgorithm, openWelcome, registerTestViolation]);
  const resetDemo = () => {
    setDemoValues([...baseAlgorithm.values]);
    setDemoTreeColors(redBlackColorsFor(baseAlgorithm, baseAlgorithm.values));
    setDemoFibonacciForest(fibonacciForestFor(baseAlgorithm, baseAlgorithm.values));
    setDemoMultiwayTree(multiwayTreeFor(baseAlgorithm, baseAlgorithm.values));
    setDemoTreeParents(initialNaryParents(baseAlgorithm.id, baseAlgorithm.values));
    setDemoSpatialTree(spatialTreeFor(baseAlgorithm, baseAlgorithm.values));
    setDemoHashTable(hashTableFor(baseAlgorithm, baseAlgorithm.values));
    setDemoUnionRanks(unionRanksFor(baseAlgorithm, baseAlgorithm.values));
    setDemoEdges(edgesForAlgorithm(baseAlgorithm));
    setDemoPositions(positionsForAlgorithm(baseAlgorithm));
    setDemoMap(DEFAULT_PATH_MAP);
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage('Estructura restablecida a su estado inicial.');
    setOperationStatus('idle');
    setChallengeScenarioKey(current => current + 1);
    setStep(0);
    setPlaying(false);
  };
  const clearDemo = () => {
    setDemoValues(createEmptyValues(baseAlgorithm));
    setDemoTreeColors(redBlackColorsFor(baseAlgorithm, []));
    setDemoFibonacciForest(fibonacciForestFor(baseAlgorithm, []));
    setDemoMultiwayTree(multiwayTreeFor(baseAlgorithm, []));
    setDemoTreeParents(initialNaryParents(baseAlgorithm.id, []));
    setDemoSpatialTree(spatialTreeFor(baseAlgorithm, []));
    setDemoHashTable(hashTableFor(baseAlgorithm, []));
    setDemoUnionRanks(unionRanksFor(baseAlgorithm, createEmptyValues(baseAlgorithm)));
    setDemoEdges([]);
    setDemoPositions(positionsForAlgorithm(baseAlgorithm));
    setOperationFrames([]);
    setActiveCodeLine(null);
    setOperationMessage(t('dataClearedMessage'));
    setOperationStatus('idle');
    setChallengeScenarioKey(current => current + 1);
    setStep(0);
    setPlaying(false);
  };
  const createNewExample = () => {
    const nextValues = createRandomValues(baseAlgorithm);
    setDemoValues(nextValues);
    setDemoTreeColors(redBlackColorsFor(baseAlgorithm, nextValues));
    setDemoFibonacciForest(fibonacciForestFor(baseAlgorithm, nextValues));
    setDemoMultiwayTree(multiwayTreeFor(baseAlgorithm, nextValues));
    setDemoTreeParents(initialNaryParents(baseAlgorithm.id, nextValues));
    setDemoSpatialTree(spatialTreeFor(baseAlgorithm, nextValues));
    setDemoHashTable(hashTableFor(baseAlgorithm, nextValues));
    setDemoUnionRanks(unionRanksFor(baseAlgorithm, nextValues));
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
    setChallengeScenarioKey(current => current + 1);
    setStep(0);
    setPlaying(false);
  };
  const loadJavaCodeFactory = async () => {
    if (javaCodeFactory) return javaCodeFactory;
    const module = await import('./data/beginnerJava.js');
    setJavaCodeFactory(() => module.getBeginnerJava);
    return module.getBeginnerJava;
  };
  const loadCppCodeFactory = async () => {
    if (cppCodeFactory) return cppCodeFactory;
    const module = await import('./data/beginnerCpp.js');
    setCppCodeFactory(() => module.getBeginnerCpp);
    return module.getBeginnerCpp;
  };
  const copyCode = async () => {
    const code = codeMode === 'java'
      ? (await loadJavaCodeFactory())(baseAlgorithm, activeOperation)
      : codeMode === 'cpp'
        ? (await loadCppCodeFactory())(baseAlgorithm, activeOperation)
      : displayedCode;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  const handleOperation = async (actionId, fields) => {
    setActiveOperation(actionId);
    if (actionId === 'reset' && ['dijkstra','a-star'].includes(baseAlgorithm.id)) {
      setDemoPositions(DEFAULT_GRAPH_POSITIONS.map(position=>[...position]));
      setDemoMap(DEFAULT_PATH_MAP);
    } else if (actionId === 'reset' && usesNodeGraph(baseAlgorithm)) {
      setDemoPositions(positionsForAlgorithm(baseAlgorithm));
    }
    let codeForAnimation;
    let executeOperation;
    let adaptFramesToCode;
    let createCodeSynchronizedFrames;
    let createLinkedListSynchronizedFrames;
    let createTreeSynchronizedFrames;
    try {
      const codePromise = codeMode === 'java'
        ? loadJavaCodeFactory().then(factory => factory(baseAlgorithm, actionId))
        : codeMode === 'cpp'
          ? loadCppCodeFactory().then(factory => factory(baseAlgorithm, actionId))
          : Promise.resolve(getOperationPseudocode(baseAlgorithm, actionId));
      const [code, operationModule, animationModule] = await Promise.all([
        codePromise,
        import('./logic/operations.js'),
        import('./logic/codeAnimation.js'),
      ]);
      codeForAnimation = code;
      ({ executeOperation } = operationModule);
      ({ adaptFramesToCode, createCodeSynchronizedFrames, createLinkedListSynchronizedFrames, createTreeSynchronizedFrames } = animationModule);
    } catch {
      setPlaying(false);
      setOperationFrames([]);
      setActiveCodeLine(null);
      setOperationStatus('error');
      setOperationMessage(language === 'en'
        ? 'The operation could not be loaded. Reload the page and try again.'
        : 'No se pudo cargar la operación. Recarga la página e inténtalo de nuevo.');
      return;
    }
    const pendingFinalFrame = operationStatus === 'success' ? operationFrames.at(-1) : null;
    const previousValues = copyVisualValues(pendingFinalFrame?.values ?? demoValues);
    const previousTreeColors = pendingFinalFrame?.treeColors ?? demoTreeColors;
    const previousFibonacciForest = pendingFinalFrame?.fibonacciForest ?? demoFibonacciForest;
    const previousMultiwayTree = pendingFinalFrame?.multiwayTree ?? demoMultiwayTree;
    const previousTreeParents = pendingFinalFrame?.treeParents ?? demoTreeParents;
    const previousSpatialTree = pendingFinalFrame?.spatialTree ?? demoSpatialTree;
    const previousHashTable = pendingFinalFrame?.hashTable ?? demoHashTable;
    const previousUnionRanks = pendingFinalFrame?.unionRanks ?? demoUnionRanks;
    const previousEdges = (pendingFinalFrame?.edges ?? demoEdges).map(edge => [...edge]);
    const result = executeOperation({
      algorithm: { ...baseAlgorithm, positions: demoPositions, map: actionId === 'reset' ? DEFAULT_PATH_MAP : demoMap },
      actionId,
      fields,
      values: previousValues,
      edges: previousEdges,
      initialValues: baseAlgorithm.values,
      initialEdges: edgesForAlgorithm(baseAlgorithm),
      treeColors: previousTreeColors,
      fibonacciForest: previousFibonacciForest,
      multiwayTree: previousMultiwayTree,
      treeParents: previousTreeParents,
      spatialTree: previousSpatialTree,
      hashTable: previousHashTable,
      unionRanks: previousUnionRanks,
    });
    const synchronizedFrameFactory = operationGroup(baseAlgorithm) === 'list'
      ? createLinkedListSynchronizedFrames
      : baseAlgorithm.category === 'Árboles'
        ? createTreeSynchronizedFrames
        : createCodeSynchronizedFrames;
    const cppNeedle = codeMode === 'cpp' ? cppCodeNeedle : null;
    const isCppGraphTraversal = codeMode === 'cpp'
      && ['grafo', 'grafo-dirigido', 'dfs', 'bfs'].includes(baseAlgorithm.id)
      && ['bfs-run', 'dfs-run'].includes(actionId);
    const cppQueueCapacity = codeForAnimation.match(/\bMAX_VERTICES\s*=\s*(\d+)/)?.[1] ?? String(previousValues.length);
    const sourceFrames = result.frames?.filter(frame => {
      if (!isCppGraphTraversal) return true;
      if (frame.codeNeedle === 'boolean hasEdge = adjacency[vertex][next];') return false;
      return actionId !== 'bfs-run' || !['front++;', 'end++;'].includes(frame.codeNeedle);
    });
    const traceFrames = sourceFrames?.map(frame => {
      if (frame.codePhase && codeMode !== 'pseudo') {
        return { ...frame, codeNeedle: pathfindingCodeNeedle(baseAlgorithm.id, codeMode, frame) };
      }
      if (cppNeedle) {
        const codeNeedle = cppNeedle(baseAlgorithm.id, actionId, frame) ?? frame.codeNeedle;
        if (isCppGraphTraversal) {
          const isBfsAllocation = actionId === 'bfs-run'
            && ['int[] queue = new int[vertexCount];', 'boolean[] visited = new boolean[vertexCount];']
              .includes(frame.codeNeedle);
          const isBfsEnqueue = actionId === 'bfs-run'
            && ['queue[end] = start;', 'queue[end] = next;'].includes(frame.codeNeedle);
          const isBfsDequeue = actionId === 'bfs-run' && frame.codeNeedle === 'int vertex = queue[front];';
          const frontAfterDequeue = isBfsDequeue
            ? Number(frame.variables.find(variable => variable.name === 'front')?.value) + 1
            : null;
          const message = frame.message.startsWith('Se crea una cola con capacidad para')
            ? 'Se reserva una cola dinámica con capacidad para hasta ' + cppQueueCapacity + ' vértices.'
            : frame.message.replace(/\bend\b/g, 'rear');
          return {
            ...frame,
            codeNeedle,
            graphState: isBfsAllocation
              ? { ...frame.graphState, frontier: [] }
              : isBfsDequeue
                ? { ...frame.graphState, frontier: frame.graphState.frontier.slice(1) }
                : frame.graphState,
            message: frame.completed && actionId === 'bfs-run'
              ? 'front alcanzó a rear; la cola quedó vacía y BFS sale del ciclo.'
              : frame.completed && actionId === 'dfs-run'
                ? 'Todas las llamadas recursivas regresaron; DFS puede liberar visited.'
                : isBfsDequeue
                  ? `${frame.values[frame.graphState.current]} sale del frente de la cola; front avanza a ${frontAfterDequeue}.`
                  : message,
            completed: frame.completed ? false : frame.completed,
            variables: frame.variables
              ?.filter(variable => variable.name !== 'hasEdge'
                && !(isBfsAllocation && ['front', 'end'].includes(variable.name)))
              .map(variable => {
                if (variable.name === 'next') return { ...variable, name: 'neighbor' };
                if (isBfsDequeue && variable.name === 'front') {
                  return { ...variable, value: frontAfterDequeue };
                }
                if (variable.name === 'end') {
                  return { ...variable, name: 'rear', value: isBfsEnqueue ? Number(variable.value) + 1 : variable.value };
                }
                return variable;
              }),
          };
        }
        return { ...frame, codeNeedle };
      }
      return frame;
    });
    if (codeMode === 'cpp' && result.ok && traceFrames?.length && actionId === 'bfs-run') {
      const visitedAllocationIndex = traceFrames.findIndex(frame => (
        frame.codeNeedle === 'bool* visited = new bool[MAX_VERTICES]{};'
      ));
      if (visitedAllocationIndex >= 0) {
        const allocationFrame = traceFrames[visitedAllocationIndex];
        const frontFrame = {
          ...allocationFrame,
          codeNeedle: 'int front = 0;',
          message: 'front se inicializa en 0.',
          variables: [...allocationFrame.variables, { name: 'front', value: 0, role: 'index' }],
        };
        const rearFrame = {
          ...frontFrame,
          codeNeedle: 'int rear = 0;',
          message: 'rear se inicializa en 0.',
          variables: [...frontFrame.variables, { name: 'rear', value: 0, role: 'size' }],
        };
        traceFrames.splice(visitedAllocationIndex + 1, 0, frontFrame, rearFrame);
      }
    }
    if (codeMode === 'cpp' && result.ok && traceFrames?.length && ['bfs-run', 'dfs-run'].includes(actionId)) {
      const lastFrame = traceFrames.at(-1);
      const cleanupFrames = [{
        ...lastFrame,
        codeNeedle: 'delete[] visited;',
        message: 'Se libera el arreglo dinámico visited.',
        completed: false,
      }];
      if (actionId === 'bfs-run') {
        cleanupFrames.push({
          ...lastFrame,
          codeNeedle: 'delete[] queue;',
          message: 'Se libera la cola dinámica.',
          completed: false,
        });
      }
      cleanupFrames.push({
        ...lastFrame,
        codeNeedle: 'return true;',
        message: actionId === 'bfs-run'
          ? 'BFS termina después de liberar toda la memoria dinámica.'
          : 'DFS termina después de liberar la memoria dinámica.',
        completed: true,
      });
      traceFrames.push(...cleanupFrames);
    }
    let synchronizedFrames = traceFrames?.length
      ? adaptFramesToCode(traceFrames, codeForAnimation, codeMode !== 'pseudo')
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
          beforeTreeParents: previousTreeParents,
        });
    if (baseAlgorithm.id === 'fibonacci-heap' && result.ok && codeMode !== 'pseudo'
        && ['heap-add', 'heap-extract'].includes(actionId)) {
      const sourceLines = codeForAnimation.split('\n');
      const lineOf = pattern => Math.max(0, sourceLines.findIndex(line => pattern.test(line)));
      const initialLine = lineOf(actionId === 'heap-add' ? /\binsert(?:Minimum)?\s*\(/ : /\bextractMinimum\s*\(/);
      const makeFrame = (forest, values, codeLine, message, completed = false) => ({
        fibonacciForest: forest, values: copyVisualValues(values), edges: previousEdges,
        codeLine, position: 0, message, completed, delayMs: 620,
      });
      if (actionId === 'heap-add') {
        synchronizedFrames = [
          makeFrame(previousFibonacciForest, previousValues, initialLine, `Se prepara el nodo ${fields.value}.`),
          makeFrame(result.fibonacciForest, result.values, lineOf(/add(?:Root|ToRootList)\(/), result.message, true),
        ];
      } else {
        synchronizedFrames = [makeFrame(previousFibonacciForest, previousValues, initialLine, 'Se identifica la raíz mínima.')];
        for (const stage of result.fibonacciStages ?? []) {
          const codeLine = stage.phase === 'promote' ? lineOf(/add(?:Root|ToRootList)\(/)
            : stage.phase === 'link' ? lineOf(/link(?:Child|AsChild)\(second, first\)/)
              : lineOf(/consolidate\(\)/);
          const message = stage.phase === 'promote'
            ? 'Los hijos del mínimo pasan a la lista de raíces.'
            : stage.phase === 'link'
              ? `Se enlaza ${stage.child} como hijo de ${stage.parent} porque ambas raíces tenían el mismo grado.`
              : result.message;
          synchronizedFrames.push(makeFrame(stage.forest, result.values, codeLine, message, stage.phase === 'settled'));
        }
      }
    }
    const attachTreeColors = baseAlgorithm.id === 'rojo-negro' && result.treeColors;
    const attachFibonacciForest = baseAlgorithm.id === 'fibonacci-heap' && result.fibonacciForest;
    const attachMultiwayTree = baseAlgorithm.type === 'btree' && result.multiwayTree;
    const attachTreeParents = ['arbol-general', 'arbol-nario'].includes(baseAlgorithm.id) && result.treeParents;
    const attachSpatialTree = ['quadtree', 'octree'].includes(baseAlgorithm.id) && result.spatialTree;
    const attachHashTable = ['hash-table', 'hash-open'].includes(baseAlgorithm.id) && result.hashTable;
    const attachUnionRanks = baseAlgorithm.id === 'union-find' && result.unionRanks;
    const needsVisualState = attachTreeColors || attachFibonacciForest || attachMultiwayTree || attachTreeParents || attachSpatialTree || attachHashTable || attachUnionRanks;
    const previousValuesSignature = needsVisualState ? JSON.stringify(previousValues) : null;
    const frames = needsVisualState
      ? synchronizedFrames.map(frame => {
          const unchangedValues = JSON.stringify(frame.values) === previousValuesSignature;
          return {
            ...frame,
            ...(attachTreeColors && {
              treeColors: unchangedValues ? previousTreeColors : result.treeColors,
            }),
            ...(attachFibonacciForest && {
              fibonacciForest: frame.fibonacciForest ?? (unchangedValues ? previousFibonacciForest : result.fibonacciForest),
            }),
            ...(attachMultiwayTree && {
              multiwayTree: unchangedValues ? previousMultiwayTree : result.multiwayTree,
            }),
            ...(attachTreeParents && {
              treeParents: unchangedValues ? previousTreeParents : result.treeParents,
            }),
            ...(attachSpatialTree && {
              spatialTree: unchangedValues ? previousSpatialTree : result.spatialTree,
            }),
            ...(attachHashTable && {
              hashTable: unchangedValues ? previousHashTable : result.hashTable,
            }),
            ...(attachUnionRanks && {
              unionRanks: unchangedValues ? previousUnionRanks : result.unionRanks,
            }),
          };
        })
      : synchronizedFrames;
    const firstFrame = frames[0];
    setOperationFrames(frames);
    setDemoValues(copyVisualValues(firstFrame.values));
    if (firstFrame.treeColors) setDemoTreeColors(firstFrame.treeColors);
    if (firstFrame.fibonacciForest) setDemoFibonacciForest(firstFrame.fibonacciForest);
    if (firstFrame.multiwayTree) setDemoMultiwayTree(firstFrame.multiwayTree);
    if (firstFrame.treeParents) setDemoTreeParents(firstFrame.treeParents);
    if (firstFrame.spatialTree) setDemoSpatialTree(firstFrame.spatialTree);
    if (firstFrame.hashTable) setDemoHashTable(firstFrame.hashTable);
    if (firstFrame.unionRanks) setDemoUnionRanks(firstFrame.unionRanks);
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
  const toggleChallengeMode = () => {
    const willOpen = !challengeMode;
    setPlaying(false);
    if (willOpen && operationFrames.length) {
      const finalFrame = operationFrames.at(-1);
      setDemoValues(copyVisualValues(finalFrame.values));
      if (finalFrame.edges) setDemoEdges(finalFrame.edges.map(edge => [...edge]));
      setOperationFrames([]);
      setActiveCodeLine(null);
      setStep(0);
    }
    if (willOpen) {
      setChallengeScenarioKey(current => current + 1);
      setOperationMessage('Predice el resultado antes de comprobarlo con la animación.');
      setOperationStatus('idle');
    }
    setChallengeMode(willOpen);
  };
  const startSectionTest = () => {
    if (getSectionTestLockedUntil(baseAlgorithm.id) > Date.now()) return;
    setPlaying(false);
    setSectionTestViolation(null);
    setSectionTest({ algorithm: baseAlgorithm });
  };
  const closeSectionTest = () => {
    setSectionTest(null);
    setSectionTestActive(false);
    setSectionTestViolation(null);
  };

  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <a className="skip-link" href="#main-content">{language === 'en' ? 'Skip to main content' : 'Saltar al contenido principal'}</a>
    {showOpeningIntro && <OpeningIntro onDone={finishOpeningIntro}/>}
    <Sidebar selected={showWelcome ? null : selectedId} onSelect={openAlgorithm} onHome={openWelcome} query={query} setQuery={setQuery} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={sidebarCollapsed} onToggle={toggleSidebar}/>
    {sidebarCollapsed && <div className="collapsed-tools"><button className="sidebar-reveal-button" onClick={()=>setSidebarCollapsed(false)} aria-label={t('showMenu')} title={t('showMenu')}><PanelLeftOpen size={20}/><span>{t('showMenu')}</span></button><button className="collapsed-language" onClick={()=>setLanguage(language === 'es' ? 'en' : 'es')} aria-label="Language / Idioma">{language === 'es' ? 'EN' : 'ES'}</button></div>}
    <main id="main-content" className="workspace" tabIndex="-1">
      <button className="menu-button mobile-menu-button" onClick={()=>setMobileOpen(true)} aria-label={t('openMenu')}><Menu/></button>

      {showWelcome ? <Welcome onStart={()=>openAlgorithm(selectedId)} startName={baseAlgorithm.name}/> : <>

      {!sidebarCollapsed && <section className="hero">
        <div><div className="eyebrow"><span>{language === 'en' ? categoryNames[algorithm.category] ?? algorithm.category : algorithm.category}</span><i>{isTheoryPage ? t('theoryGuide') : t('interactivePractice')}</i></div><h1>{algorithm.name}</h1><p>{algorithm.description}</p></div>
        <div className="complexity-card"><small>{isTheoryPage ? t('content') : t('complexity')}</small><strong>{algorithm.complexity}</strong><div><Gauge size={16}/><span>{isTheoryPage ? algorithm.type === 'complexity' ? t('fundamentalsCharts') : t('fundamentalConcepts') : t('asymptoticAnalysis')}</span></div></div>
      </section>}

      <div className="section-test-entry" data-tour="test">
        <div><ClipboardCopy size={18}/><span><strong>{t('checkLearning')}</strong><small>{t('tenQuestions')}</small></span></div>
        <button onClick={startSectionTest} disabled={sectionTestRemainingMs > 0} title={sectionTestRemainingMs > 0 ? `${t('availableIn')} ${sectionTestRemainingMinutes} min` : t('takeTest')}>
          {sectionTestRemainingMs > 0 ? `${t('locked')} · ${sectionTestRemainingMinutes} min` : t('takeTest')}
        </button>
      </div>

      {isTheoryPage ? language === 'en'
        ? <Suspense fallback={<DescriptionFallback/>}><EnglishFoundationLesson algorithm={algorithm}/></Suspense>
        : algorithm.type === 'complexity' ? <Suspense fallback={<DescriptionFallback/>}><ComplexityLesson/></Suspense> : algorithm.type === 'oop' ? <Suspense fallback={<DescriptionFallback/>}><OopLesson/></Suspense> : algorithm.type === 'foundation' ? <Suspense fallback={<DescriptionFallback/>}><FoundationLesson algorithm={algorithm}/></Suspense> : <Suspense fallback={<DescriptionFallback/>}><DataStructuresLesson/></Suspense>
      : <>
      <section className={`lab-grid ${['dijkstra', 'a-star'].includes(baseAlgorithm.id) ? 'pathfinding-grid' : ''}`}>
        <article className="panel visual-panel" data-tour="visualizer">
          <div className="panel-head"><div><span className="panel-index">01</span><h2>{t('visualization')}</h2></div><div className="panel-head-actions">{operationDefinition.actions.length > 0 && <button className={`challenge-toggle ${challengeMode ? 'active' : ''}`} onClick={toggleChallengeMode} title={challengeMode ? t('exit') : t('challengeMode')} aria-label={challengeMode ? t('exit') : t('challengeMode')} aria-pressed={challengeMode}><Brain size={15}/>{challengeMode ? t('exit') : t('challenge')}</button>}<button onClick={createNewExample} title={t('generateData')}><Shuffle size={15}/> {t('newExample')}</button><button className="clear-demo-button" onClick={clearDemo} title={t('clearCurrentData')}><Eraser size={15}/> {t('clearData')}</button><button onClick={resetDemo} title={t('originalData')}><RotateCcw size={15}/> {t('reset')}</button></div></div>
          <div className="canvas-grid" data-visualizer={algorithm.id}><Suspense fallback={<div className="description-loading" aria-label={t('loadingDescription')}><span/></div>}><MemoizedVisualizer algorithm={visualAlgorithm} step={operationFrames.length ? currentAnimationFrame?.position ?? step : step}/></Suspense><div className={`step-badge ${currentAnimationFrame?.iteration != null ? 'loop-step' : ''}`}>{currentAnimationFrame?.loopExit ? <>{t('loopEnd')}</> : currentAnimationFrame?.iteration != null ? <>{t('iteration')} <b>{Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)}/{currentAnimationFrame.totalIterations}</b></> : <>{t('step')} <b>{String(step+1).padStart(2,'0')}</b></>}</div></div>
          {challengeMode
            ? <Suspense fallback={<section className="challenge-panel" aria-label="Cargando desafío"/>}><ChallengePanel algorithm={algorithm} values={demoValues} playing={playing} scenarioKey={challengeScenarioKey} onVerify={handleOperation}/></Suspense>
            : <OperationsPanel algorithm={baseAlgorithm} message={operationMessage} status={operationStatus} activeOperation={activeOperation} onAction={handleOperation}/>}
          <div className="player"><button onClick={()=>goToStep(step-1)} aria-label={t('previous')}><ArrowLeft size={17}/></button><button className="play" onClick={togglePlayback}>{playing?<Pause size={18}/>:<Play size={18}/>}<span>{playing?t('pause'):t('play')}</span></button><button onClick={()=>goToStep(step+1)} aria-label={t('next')}><ArrowRight size={17}/></button><div className="timeline"><span style={{width:`${((step+1)/totalSteps)*100}%`}}/></div><label><span>{t('speed')}</span><select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><ChevronDown size={13}/></label></div>
        </article>

        <article className="panel code-panel" data-tour="code">
          <div className="panel-head code-head">
            <div><span className="panel-index">02</span><h2>{codeMode === 'pseudo' ? t('pseudocode') : activeOperationLabel}</h2></div>
            <div className="code-actions">
              <div className="code-tabs" aria-label={t('codeFormat')}>
                <button className={codeMode === 'java' ? 'active' : ''} onClick={()=>setCodeMode('java')}>Java</button>
                {supportsCpp(baseAlgorithm.id) && <button className={codeMode === 'cpp' ? 'active' : ''} onClick={()=>setCodeMode('cpp')}>C++</button>}
                <button className={codeMode === 'pseudo' ? 'active' : ''} onClick={()=>setCodeMode('pseudo')}>{t('pseudocode')}</button>
              </div>
              <button className="copy-button" onClick={copyCode}>{copied ? t('copied') : t('copy')}</button>
            </div>
          </div>
          <pre ref={codePanelRef}><CodeListing lines={codeLines} activeLine={highlightedCodeLine}/></pre>
          <div className="full-code-trigger"><button type="button" onClick={() => setFullCodeOpen(true)} aria-haspopup="dialog"><Maximize2 size={15}/>{language === 'en' ? 'View full code' : 'Ver código completo'}</button></div>
          <VariablesPanel frame={currentAnimationFrame} algorithm={algorithm} step={step} playing={playing}/>
          <div className="note"><CircleHelp size={17}/><p><strong>{codeMode === 'java' ? `${language === 'en' ? 'Basic Java' : 'Java básico'} · ${activeOperationLabel}` : codeMode === 'cpp' ? `C++ · ${activeOperationLabel}` : language === 'en' ? 'What happens here?' : '¿Qué ocurre aquí?'}</strong><span>{codeMode !== 'pseudo' ? currentAnimationFrame?.iteration != null ? language === 'en' ? `The loop is at iteration ${Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)} of ${currentAnimationFrame.totalIterations}. The highlighted line and active element advance together.` : `El ciclo está en la iteración ${Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)} de ${currentAnimationFrame.totalIterations}. La línea iluminada y el elemento activo avanzan juntos.` : codeMode === 'cpp' ? language === 'en' ? 'The panel shows the C++ implementation of this operation, including its helper methods.' : 'El panel muestra la implementación en C++ de esta operación, incluidos sus métodos auxiliares.' : language === 'en' ? 'The code uses small variables, arrays, loops, conditions, and methods. Each highlighted line matches the visible change in the structure.' : javaOverview : step === 0 ? translateLearningText('Se prepara el estado inicial y la estructura auxiliar.', language) : step >= totalSteps-1 ? translateLearningText('El algoritmo completa la operación y devuelve el resultado.', language) : language === 'en' ? `The active element at step ${step+1} is processed and the state is updated.` : `Se procesa el elemento activo del paso ${step+1} y se actualiza el estado.`}</span></p></div>
        </article>
      </section>

      <Suspense fallback={<DescriptionFallback/>}><EducationalDescription algorithm={algorithm}/></Suspense>
      </>}

      <section className="learning-strip"><div><BookOpen size={18}/><span><b>{language === 'en' ? categoryDescriptions[algorithm.category] ?? categoryLabels[algorithm.category] : categoryLabels[algorithm.category]}</b> · {algorithm.name}</span></div></section>
      <footer className="algorithm-nav"><a href={seoPath(algorithms[(selectedIndex-1+algorithms.length)%algorithms.length].id, language)} onClick={event=>{event.preventDefault();selectRelative(-1)}}><ArrowLeft size={16}/><span><small>{t('previous')}</small>{localizeAlgorithm(algorithms[(selectedIndex-1+algorithms.length)%algorithms.length], language).name}</span></a><a href={seoPath(algorithms[(selectedIndex+1)%algorithms.length].id, language)} onClick={event=>{event.preventDefault();selectRelative(1)}}><span><small>{t('next')}</small>{localizeAlgorithm(algorithms[(selectedIndex+1)%algorithms.length], language).name}</span><ArrowRight size={16}/></a></footer>
      </>}
    </main>
    <button className="guided-tour-launch" type="button" onClick={startGuidedTour} aria-label={t('guidedTourLabel')} title={t('howItWorks')}><CircleHelp size={19}/><span>{t('howItWorks')}</span></button>
    <BugReporter section={showWelcome ? t('welcome') : algorithm.name}/>
    <AccessibilityPanel/>
    {tourOpen && <Suspense fallback={null}><GuidedTour onClose={closeGuidedTour} onStepChange={handleTourStepChange}/></Suspense>}
    {sectionTest && <Suspense fallback={null}><SectionTestModal
      algorithm={sectionTest.algorithm}
      externalViolation={sectionTestViolation?.reason ?? null}
      onClose={closeSectionTest}
      onActiveChange={setSectionTestActive}
      onLockout={() => setSectionTestClock(Date.now())}
    /></Suspense>}
    {fullCodeOpen && <div className="full-code-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setFullCodeOpen(false); }}>
      <section ref={fullCodeDialogRef} tabIndex="-1" className="full-code-dialog code-panel" role="dialog" aria-modal="true" aria-labelledby="full-code-kicker full-code-title">
        <header className="full-code-header"><div><small id="full-code-kicker">{language === 'en' ? 'Full code' : 'Código completo'} · {codeMode === 'pseudo' ? t('pseudocode') : codeMode === 'cpp' ? 'C++' : 'Java'}</small><h2 id="full-code-title">{algorithm.name} · {activeOperationLabel}</h2></div><div className="full-code-actions"><button type="button" onClick={copyCode}><ClipboardCopy size={15}/>{copied ? t('copied') : t('copy')}</button><button type="button" onClick={() => setFullCodeOpen(false)} aria-label={language === 'en' ? 'Close full code' : 'Cerrar código completo'}><X size={18}/></button></div></header>
        <pre ref={fullCodePreRef} tabIndex="0" aria-label={language === 'en' ? 'Full code listing' : 'Listado de código completo'}><CodeListing lines={codeLines} activeLine={highlightedCodeLine}/></pre>
        <footer className="full-code-footer">{codeLines.length} {language === 'en' ? 'lines · Press Esc to close' : 'líneas · Presiona Esc para cerrar'}</footer>
      </section>
    </div>}
    {mobileOpen && <button className="scrim" onClick={()=>setMobileOpen(false)} aria-label={t('close')}/>}
  </div>;
}

export default App;
