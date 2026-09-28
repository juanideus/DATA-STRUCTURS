import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Boxes, Brain, ChevronDown, CircleHelp, ClipboardCopy, Gauge,
  Eraser, MapPin, Menu, PanelLeftOpen, Pause, Play, RotateCcw, Shuffle, Sparkles,
} from 'lucide-react';
import { algorithmIndexes, algorithms, algorithmsById, categoryLabels } from './data/algorithms.js';
import { supportsCpp } from './data/cppCatalog.js';
import { getGraphDesign, graphEdgesFor, graphPositionsFor } from './data/graphDesigns.js';
import OperationsPanel from './components/OperationsPanel.jsx';
import VariablesPanel from './components/VariablesPanel.jsx';
import AccessibilityPanel from './components/AccessibilityPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import BugReporter from './components/BugReporter.jsx';
import GuidedTour from './components/GuidedTour.jsx';
import { useDialogFocus } from './accessibility/useDialogFocus.js';
import {
  adaptFramesToCode,
  copyVisualValues,
  createCodeSynchronizedFrames,
  createLinkedListSynchronizedFrames,
  createTreeSynchronizedFrames,
} from './logic/codeAnimation.js';
import { DEFAULT_GRAPH_EDGES, DEFAULT_GRAPH_POSITIONS, executeOperation, getOperationDefinition, getThreadedTreeLinks, operationGroup, SPARSE_MATRIX_COLUMNS, SPARSE_MATRIX_ROWS } from './logic/operations.js';
import { getOperationPseudocode } from './data/operationPseudocode.js';
import { AST_EXAMPLES, astValuesFromSource } from './logic/ast.js';
import { DENSE_MATRIX_SIZE, normalizeDenseMatrixValues } from './logic/denseMatrix.js';
import { GENERALIZED_LIST_EXAMPLES, generalizedListToString, generalizedListValuesFromSource } from './logic/generalizedList.js';
import { createRandomPathMap, DEFAULT_PATH_MAP } from './logic/pathfindingMap.js';
import { formatPolynomial, polynomialTerms } from './logic/polynomial.js';
import { buildRecursionCallTree } from './logic/recursionTrace.js';
import { createRedBlackTree } from './logic/redBlackTree.js';
import { createFibonacciForest } from './logic/fibonacciHeap.js';
import { createMultiwayTree } from './logic/multiwayTree.js';
import { initialNaryParents, naryChildren } from './logic/naryTree.js';
import { formatMerkleHash, merkleLevels } from './logic/merkle.js';
import { getSectionTestLockedUntil } from './logic/sectionTests.js';
import { categoryDescriptions, categoryNames, localizeAlgorithm, translateCodeText, translateLearningText, translateOperationLabel, useLanguage } from './i18n.jsx';
import { algorithmIdFromPath, pageSeo, seoPath, seoUrl, SOCIAL_IMAGE_URL, structuredData } from './seo.js';

const MemoizedVisualizer = lazy(() => import('./components/Visualizer.jsx'));
const EducationalDescription = lazy(() => import('./components/EducationalDescription.jsx'));
const FoundationLesson = lazy(() => import('./components/FoundationLesson.jsx'));
const ChallengePanel = lazy(() => import('./components/ChallengePanel.jsx'));
const EnglishFoundationLesson = lazy(() => import('./components/EnglishFoundationLesson.jsx'));
const ComplexityGrowthChart = lazy(() => import('./components/ComplexityGrowthChart.jsx'));
const SectionTestModal = lazy(() => import('./components/SectionTestModal.jsx'));

const SUDOKU_START = [
  5,3,0,0,7,0,0,0,0, 6,0,0,1,9,5,0,0,0, 0,9,8,0,0,0,0,6,0,
  8,0,0,0,6,0,0,0,3, 4,0,0,8,0,3,0,0,1, 7,0,0,0,2,0,0,0,6,
  0,6,0,0,0,0,2,8,0, 0,0,0,4,1,9,0,0,5, 0,0,0,0,8,0,0,7,9,
];

const NORMAL_FRAME_DELAY = 800;
const redBlackColorsFor = (algorithm, values) => algorithm.id === 'rojo-negro'
  ? createRedBlackTree(values).snapshot().colors
  : null;
const fibonacciForestFor = (algorithm, values) => algorithm.id === 'fibonacci-heap'
  ? createFibonacciForest(values).snapshot()
  : null;
const multiwayTreeFor = (algorithm, values) => algorithm.type === 'btree'
  ? createMultiwayTree(algorithm.id, values).snapshot()
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
  if (algorithm.id === 'expression-tree') return ['+','×','−',...randomUniqueNumbers(4, 1, 9).map(String)];
  if (algorithm.id === 'ast') return astValuesFromSource(AST_EXAMPLES[randomNumber(0, AST_EXAMPLES.length - 1)]);
  if (algorithm.id === 'merkle-tree') return Array.from({ length: amount }, () => `B${randomNumber(10, 99)}`);
  if (algorithm.id === 'kd-tree') return randomKdLevelOrder();
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

function ComplexityLesson() {
  const orderRows = [
    ['O(1)', 'Constante', 'Acceder a una posición conocida', 'No cambia'],
    ['O(log n)', 'Logarítmica', 'Búsqueda binaria', 'Aumenta muy poco'],
    ['O(n)', 'Lineal', 'Recorrer una lista', 'Se duplica'],
    ['O(n log n)', 'Lineal-logarítmica', 'Merge Sort', 'Algo más del doble'],
    ['O(n²)', 'Cuadrática', 'Dos ciclos completos', 'Se cuadruplica'],
    ['O(2ⁿ)', 'Exponencial', 'Explorar subconjuntos', 'Se eleva drásticamente'],
    ['O(n!)', 'Factorial', 'Probar todas las permutaciones', 'Crece más rápido que 2ⁿ'],
  ];

  return <section className="complexity-lesson" data-complexity-lesson>
    <article className="complexity-intro-card">
      <span className="lesson-kicker">01 · IDEA CENTRAL</span>
      <h2>¿Qué es la complejidad algorítmica?</h2>
      <p>Es una forma de describir cómo aumenta el trabajo de un algoritmo cuando crece su entrada. En vez de medir segundos —que dependen del computador— se cuentan operaciones significativas y se expresa su crecimiento como una función de <b>n</b>.</p>
      <div className="complexity-foundations">
        <div><strong>n</strong><span>Tamaño del problema</span><p>Puede ser la cantidad de datos, vértices, filas o caracteres.</p></div>
        <div><strong>T(n)</strong><span>Tiempo</span><p>Cantidad de operaciones activas realizadas.</p></div>
        <div><strong>S(n)</strong><span>Espacio</span><p>Memoria adicional que necesita la solución.</p></div>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">02 · ANÁLISIS A PRIORI</span>
        <h3>Cómo analizar un algoritmo</h3>
        <ol>
          <li><b>Define n.</b> Explica exactamente qué parte de la entrada crece.</li>
          <li><b>Elige la operación activa.</b> Una comparación, visita, asignación o acceso representativo.</li>
          <li><b>Cuenta repeticiones.</b> Obtén una función T(n), no un tiempo del reloj.</li>
          <li><b>Separa los casos.</b> Mejor, promedio y peor escenario pueden ser distintos.</li>
          <li><b>Conserva el término dominante.</b> Clasifica el orden de crecimiento.</li>
        </ol>
      </article>
      <article>
        <span className="lesson-kicker">03 · CASOS</span>
        <h3>La misma entrada puede exigir trabajos distintos</h3>
        <div className="complexity-case-stack">
          <p><b>Mejor caso</b><span>La entrada más favorable requiere el mínimo trabajo.</span></p>
          <p><b>Caso promedio</b><span>Trabajo esperado bajo una distribución de entradas declarada.</span></p>
          <p><b>Peor caso</b><span>Máximo trabajo posible para cualquier entrada de tamaño n.</span></p>
        </div>
      </article>
    </div>

    <article className="complexity-chart-card">
      <div>
        <span className="lesson-kicker">04 · ÓRDENES DE CRECIMIENTO</span>
        <h3>Qué ocurre cuando n aumenta</h3>
        <p>El gráfico compara siete órdenes de crecimiento. O(log n) aumenta lentamente, mientras que O(n!) termina creciendo más rápido que O(2ⁿ).</p>
      </div>
      <Suspense fallback={null}><ComplexityGrowthChart language="es"/></Suspense>
    </article>

    <article className="complexity-order-table-card">
      <span className="lesson-kicker">05 · TABLA DE REFERENCIA</span>
      <h3>De más escalable a menos escalable</h3>
      <div className="complexity-order-table" role="table" aria-label="Comparación de órdenes de complejidad">
        <div className="table-head" role="row"><b>Orden</b><b>Nombre</b><b>Ejemplo</b><b>Al duplicar n</b></div>
        {orderRows.map(row => <div role="row" key={row[0]}>{row.map((cell, index) => <span role="cell" key={cell}>{index === 0 ? <strong>{cell}</strong> : cell}</span>)}</div>)}
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">06 · REGLAS DE CONTEO</span>
        <h3>Cómo nace T(n)</h3>
        <ul>
          <li>Las instrucciones consecutivas se <b>suman</b>.</li>
          <li>En una decisión se analiza cada rama y suele conservarse la más costosa para el peor caso.</li>
          <li>Un ciclo aporta sus iteraciones multiplicadas por el costo de su cuerpo.</li>
          <li>Los ciclos anidados completos suelen <b>multiplicar</b> sus tamaños.</li>
          <li>La recursividad se describe mediante una recurrencia que incluye sus llamadas y trabajo local.</li>
        </ul>
      </article>
      <article className="complexity-simplify-card">
        <span className="lesson-kicker">07 · SIMPLIFICAR</span>
        <h3>Importa lo que domina al crecer</h3>
        <div><span>T(n)</span><strong>4n² + 3n + 8</strong></div>
        <p>Se ignoran el factor constante, el término lineal y la constante porque <b>n²</b> termina creciendo más que todos ellos.</p>
        <div className="complexity-result"><span>Orden ajustado</span><strong>Θ(n²)</strong></div>
      </article>
    </div>

    <article className="complexity-notation-card">
      <span className="lesson-kicker">08 · NOTACIÓN ASINTÓTICA</span>
      <h3>O, Ω y Θ no significan exactamente lo mismo</h3>
      <div>
        <p><strong>O(g(n))</strong><b>Cota superior</b><span>Desde cierto n, el crecimiento no supera un múltiplo constante de g(n).</span></p>
        <p><strong>Ω(g(n))</strong><b>Cota inferior</b><span>Desde cierto n, el crecimiento es al menos un múltiplo constante de g(n).</span></p>
        <p><strong>Θ(g(n))</strong><b>Cota ajustada</b><span>g(n) limita el crecimiento simultáneamente por arriba y por abajo.</span></p>
      </div>
      <aside><b>Definición formal de O</b><span>Existen constantes positivas c y n₀ tales que 0 ≤ f(n) ≤ c·g(n) para todo n ≥ n₀.</span></aside>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">09 · TIEMPO Y ESPACIO</span>
        <h3>Son análisis separados</h3>
        <p>Una solución puede ahorrar tiempo usando memoria auxiliar o ahorrar memoria repitiendo trabajo. Siempre debe indicarse si la complejidad mencionada es temporal o espacial y si el espacio incluye la propia entrada.</p>
      </article>
      <article>
        <span className="lesson-kicker">10 · ERRORES FRECUENTES</span>
        <h3>Antes de concluir, revisa</h3>
        <ul>
          <li>No confundir Big O con segundos exactos.</li>
          <li>No afirmar que O siempre representa el peor caso.</li>
          <li>No olvidar definir n y la operación contada.</li>
          <li>No sumar complejidades de ciclos que realmente están anidados.</li>
          <li>No comparar algoritmos usando tamaños de entrada distintos.</li>
        </ul>
      </article>
    </div>

    <article className="complexity-summary-card">
      <span className="lesson-kicker">IDEA PARA RECORDAR</span>
      <p>La pregunta no es solamente “¿funciona?”, sino <b>“¿seguirá funcionando bien cuando los datos crezcan?”</b>. La complejidad algorítmica permite responderla antes de ejecutar el programa.</p>
    </article>
  </section>;
}

function DataStructuresLesson() {
  const operations = [
    ['Acceso', 'Llegar a un dato conocido', 'Array mediante índice'],
    ['Búsqueda', 'Encontrar un dato que cumple una condición', 'Hash por clave o recorrido'],
    ['Inserción', 'Agregar información sin romper las reglas', 'Nuevo nodo en una lista'],
    ['Actualización', 'Modificar un dato existente', 'Cambiar el valor de una posición'],
    ['Eliminación', 'Retirar un dato y reorganizar lo necesario', 'Desenlazar un nodo'],
    ['Recorrido', 'Visitar sistemáticamente los elementos', 'Inorden en un árbol'],
  ];
  const families = [
    { name: 'Lineales', examples: 'Array · Lista · Stack · Queue', text: 'Los elementos siguen una secuencia. Cada dato, salvo los extremos, tiene un anterior y un siguiente lógico.' },
    { name: 'Jerárquicas', examples: 'Árbol · Heap · Trie', text: 'Organizan relaciones de padre e hijos. Son útiles para niveles, prioridades, búsqueda y prefijos.' },
    { name: 'Redes', examples: 'Grafos', text: 'Representan entidades conectadas sin exigir una única jerarquía: rutas, dependencias, amistades o enlaces.' },
    { name: 'Por clave', examples: 'Hash · Map · Set', text: 'Transforman una clave para ubicar datos rápidamente y comprobar pertenencia.' },
  ];

  return <section className="complexity-lesson data-structures-lesson" data-data-structures-lesson>
    <article className="complexity-intro-card">
      <span className="lesson-kicker">01 · IDEA CENTRAL</span>
      <h2>¿Qué es una estructura de datos?</h2>
      <p>Es una forma de <b>guardar, organizar y relacionar datos</b> para poder trabajar con ellos de manera clara y eficiente. No cambia lo que significan los datos: define dónde se encuentran, cómo se conectan y qué reglas deben respetarse al modificarlos.</p>
      <div className="complexity-foundations data-foundations">
        <div><strong>Datos</strong><span>Qué almacenamos</span><p>Números, textos, objetos, registros o relaciones.</p></div>
        <div><strong>Organización</strong><span>Cómo los ubicamos</span><p>Posiciones, índices, enlaces, claves o niveles.</p></div>
        <div><strong>Operaciones</strong><span>Qué necesitamos hacer</span><p>Buscar, insertar, eliminar, actualizar y recorrer.</p></div>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">02 · POR QUÉ EXISTEN</span>
        <h3>Organizar bien evita trabajo innecesario</h3>
        <p>Imagina miles de fichas sin ordenar dentro de una caja. La información existe, pero encontrar una ficha puede exigir revisarlas todas. Una estructura agrega un orden o una forma de acceso que facilita las operaciones importantes.</p>
        <p>Por eso un mismo conjunto de datos puede comportarse de manera muy distinta en un Array, una lista, un árbol o una tabla hash.</p>
      </article>
      <article>
        <span className="lesson-kicker">03 · TDA Y ESTRUCTURA</span>
        <h3>Qué debe hacer frente a cómo se construye</h3>
        <div className="data-concept-pair">
          <p><b>Tipo de Dato Abstracto (TDA)</b><span>Describe el comportamiento y las operaciones disponibles. Una pila promete push, pop y peek siguiendo LIFO.</span></p>
          <p><b>Estructura de datos</b><span>Es la organización concreta que hace posible ese comportamiento. La pila puede implementarse con un Array o con nodos enlazados.</span></p>
        </div>
      </article>
    </div>

    <article className="data-families-card">
      <span className="lesson-kicker">04 · FAMILIAS PRINCIPALES</span>
      <h3>No todos los datos se relacionan de la misma forma</h3>
      <div className="data-family-grid">
        {families.map((family, index) => <div key={family.name}>
          <i>{String(index + 1).padStart(2, '0')}</i>
          <strong>{family.name}</strong>
          <small>{family.examples}</small>
          <p>{family.text}</p>
        </div>)}
      </div>
    </article>

    <article className="complexity-order-table-card">
      <span className="lesson-kicker">05 · OPERACIONES BÁSICAS</span>
      <h3>Las preguntas que debe responder una estructura</h3>
      <div className="complexity-order-table data-operation-table" role="table" aria-label="Operaciones básicas de las estructuras de datos">
        <div className="table-head" role="row"><b>Operación</b><b>Pregunta</b><b>Ejemplo</b></div>
        {operations.map(row => <div role="row" key={row[0]}>{row.map((cell, index) => <span role="cell" key={cell}>{index === 0 ? <strong>{cell}</strong> : cell}</span>)}</div>)}
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">06 · CÓMO ELEGIR</span>
        <h3>Primero comprende el problema</h3>
        <ol>
          <li><b>Define los datos.</b> Qué representan y cuánto pueden crecer.</li>
          <li><b>Prioriza operaciones.</b> No es igual buscar mucho que insertar mucho.</li>
          <li><b>Decide si importa el orden.</b> Natural, ordenado, por prioridad o sin orden.</li>
          <li><b>Estudia sus costos.</b> Tiempo de las operaciones y memoria adicional.</li>
          <li><b>Considera los límites.</b> Tamaño fijo, duplicados, concurrencia o persistencia.</li>
        </ol>
      </article>
      <article>
        <span className="lesson-kicker">07 · INTERCAMBIOS</span>
        <h3>Ganar en una operación puede costar en otra</h3>
        <ul>
          <li>Un Array permite acceso directo, pero insertar al inicio desplaza elementos.</li>
          <li>Una lista enlazada inserta sin desplazar, pero no ofrece acceso directo por índice.</li>
          <li>Hashing busca muy rápido, pero no mantiene naturalmente los datos ordenados.</li>
          <li>Un árbol balanceado conserva orden, aunque debe mantener enlaces y balance.</li>
          <li>Un grafo representa conexiones generales, pero sus recorridos necesitan memoria auxiliar.</li>
        </ul>
      </article>
    </div>

    <article className="data-map-card">
      <span className="lesson-kicker">08 · MAPA DE DSA LAB</span>
      <h3>Una estructura para cada necesidad</h3>
      <div className="data-map-grid">
        <p><b>Posiciones conocidas</b><span>Array y matriz</span></p>
        <p><b>Secuencias flexibles</b><span>Listas con nexo</span></p>
        <p><b>Orden de atención</b><span>Stack, Queue y Deque</span></p>
        <p><b>Jerarquía y búsqueda</b><span>Árboles y heaps</span></p>
        <p><b>Acceso mediante clave</b><span>Hashing</span></p>
        <p><b>Relaciones y rutas</b><span>Grafos</span></p>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">09 · EJEMPLO COTIDIANO</span>
        <h3>Una biblioteca usa varias estructuras</h3>
        <p>Los libros pueden ordenarse en estantes, localizarse mediante una ficha por código y los préstamos pendientes atenderse en una cola. Los datos siguen siendo libros y personas, pero cada tarea necesita una organización diferente.</p>
      </article>
      <article>
        <span className="lesson-kicker">10 · ERROR FRECUENTE</span>
        <h3>No existe una estructura universalmente mejor</h3>
        <p>La estructura correcta no es la más compleja ni la más rápida en una única prueba. Es la que ofrece el mejor equilibrio para las operaciones, el tamaño y las reglas del problema real.</p>
      </article>
    </div>

    <article className="complexity-summary-card">
      <span className="lesson-kicker">IDEA PARA RECORDAR</span>
      <p>Los algoritmos indican <b>qué pasos realizar</b>; las estructuras de datos determinan <b>cómo se organiza la información</b> sobre la que trabajan. Ambas decisiones se necesitan para construir una solución correcta y eficiente.</p>
    </article>
  </section>;
}

function OopLesson() {
  const pillars = [
    ['Encapsulación', 'Protege el estado interno y permite modificarlo solamente mediante operaciones válidas.'],
    ['Abstracción', 'Muestra lo necesario para usar un objeto y oculta los detalles que no necesita conocer quien lo utiliza.'],
    ['Herencia', 'Permite que una clase especializada reutilice y amplíe el comportamiento de una clase más general.'],
    ['Polimorfismo', 'Permite tratar objetos diferentes mediante un mismo contrato y obtener el comportamiento propio de cada uno.'],
  ];
  const modifiers = [
    ['public', 'Desde cualquier clase', 'Operaciones que forman parte del contrato público.'],
    ['private', 'Solo dentro de la misma clase', 'Atributos y detalles internos que deben estar protegidos.'],
    ['protected', 'Misma clase, paquete y subclases', 'Extensión controlada mediante herencia.'],
    ['sin modificador', 'Clases del mismo paquete', 'Colaboración interna dentro de un paquete Java.'],
  ];

  return <section className="complexity-lesson oop-lesson" data-oop-lesson>
    <article className="complexity-intro-card oop-intro-card">
      <span className="lesson-kicker">01 · IDEA CENTRAL</span>
      <h2>¿Qué es la Programación Orientada a Objetos?</h2>
      <p>La <b>POO</b> es una manera de diseñar programas agrupando la información y las operaciones que trabajan con ella dentro de <b>objetos</b>. Cada objeto tiene un estado, puede realizar acciones y se comunica con otros objetos mediante métodos.</p>
      <p>No consiste solamente en escribir clases. Su propósito es repartir responsabilidades para que el programa sea más fácil de comprender, comprobar, cambiar y reutilizar.</p>
      <div className="complexity-foundations oop-foundations">
        <div><strong>Estado</strong><span>Lo que el objeto sabe</span><p>Se representa mediante atributos: nombre, saldo, tamaño o prioridad.</p></div>
        <div><strong>Comportamiento</strong><span>Lo que el objeto hace</span><p>Se expresa con métodos: depositar, insertar, buscar o calcular.</p></div>
        <div><strong>Identidad</strong><span>Qué objeto es</span><p>Dos objetos pueden tener datos iguales y seguir siendo instancias distintas.</p></div>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">02 · CLASE Y OBJETO</span>
        <h3>El plano y las instancias</h3>
        <p>Una <b>clase</b> es la definición o molde escrito por el programador. Indica qué atributos existirán y qué métodos podrán ejecutar sus objetos, pero la clase por sí sola no representa a un estudiante, una cuenta o una casa concreta.</p>
        <p>Un <b>objeto</b> es una instancia real creada a partir de esa clase mediante <code>new</code>. Ocupa un espacio en memoria, posee su propia identidad y conserva sus propios valores en los atributos. Una variable de tipo objeto no contiene todo el objeto: guarda una <b>referencia</b> que permite encontrarlo y utilizar sus métodos.</p>
        <div className="oop-object-example">
          <pre className="oop-code"><code>{`Estudiante ana = new Estudiante();
Estudiante luis = new Estudiante();

ana.nombre = "Ana";
luis.nombre = "Luis";`}</code></pre>
          <p><code>ana</code> y <code>luis</code> fueron creados desde la misma clase <code>Estudiante</code>, pero son <b>dos objetos diferentes</b>. Cada uno tiene su propia identidad y puede guardar un nombre distinto sin modificar al otro.</p>
        </div>
        <div className="oop-analogy"><b>Clase: el plano de una casa</b><span>Objeto: cada casa que se construye utilizando ese plano. Todas comparten la estructura definida por el plano, pero cada casa existe por separado y puede tener un color, una dirección y habitantes diferentes.</span></div>
      </article>
      <article>
        <span className="lesson-kicker">03 · PRIMER OBJETO</span>
        <h3>Una clase pequeña en Java</h3>
        <pre className="oop-code"><code>{`class Estudiante {
    String nombre;
    int puntaje;

    void estudiar() {
        puntaje = puntaje + 1;
    }
}

Estudiante ana = new Estudiante();
ana.nombre = "Ana";
ana.estudiar();`}</code></pre>
        <p><code>ana</code> guarda una referencia al objeto; <code>new</code> crea la instancia; el punto permite acceder a sus miembros.</p>
      </article>
    </div>

    <article className="oop-process-card">
      <span className="lesson-kicker">04 · DE UN PROBLEMA A UNA CLASE</span>
      <h3>Modelar significa decidir responsabilidades</h3>
      <div className="oop-process">
        <div><i>1</i><b>Identifica entidades</b><span>¿Qué elementos tienen información y comportamiento propio?</span></div>
        <div><i>2</i><b>Asigna estado</b><span>¿Qué datos necesita conservar cada objeto?</span></div>
        <div><i>3</i><b>Asigna acciones</b><span>¿Qué operaciones debe realizar y qué reglas debe proteger?</span></div>
        <div><i>4</i><b>Conecta objetos</b><span>¿Quién usa a quién y qué información debe intercambiar?</span></div>
      </div>
    </article>

    <article className="oop-pillars-card">
      <span className="lesson-kicker">05 · LOS CUATRO PILARES</span>
      <h3>Principios que guían el diseño orientado a objetos</h3>
      <div className="oop-pillar-grid">
        {pillars.map((pillar, index) => <div key={pillar[0]}><i>{String(index + 1).padStart(2, '0')}</i><strong>{pillar[0]}</strong><p>{pillar[1]}</p></div>)}
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">06 · CONSTRUCTOR Y THIS</span>
        <h3>Crear objetos válidos desde el comienzo</h3>
        <pre className="oop-code"><code>{`class Cuenta {
    private String titular;
    private int saldo;

    Cuenta(String titular, int saldoInicial) {
        this.titular = titular;
        this.saldo = saldoInicial;
    }
}`}</code></pre>
        <p>El constructor tiene el mismo nombre de la clase y no declara retorno. <code>this</code> representa al objeto actual y permite distinguir el atributo del parámetro.</p>
      </article>
      <article>
        <span className="lesson-kicker">07 · ENCAPSULACIÓN</span>
        <h3>No expongas datos que cualquiera pueda romper</h3>
        <pre className="oop-code"><code>{`public void retirar(int cantidad) {
    if (cantidad > 0 && cantidad <= saldo) {
        saldo = saldo - cantidad;
    }
}

public int getSaldo() {
    return saldo;
}`}</code></pre>
        <p>Al mantener <code>saldo</code> privado, toda modificación pasa por un método que comprueba las reglas. Un setter no es obligatorio: solo debe existir si modificar directamente ese dato tiene sentido.</p>
      </article>
    </div>

    <article className="complexity-order-table-card oop-access-card">
      <span className="lesson-kicker">08 · MODIFICADORES DE ACCESO</span>
      <h3>Controlan quién puede utilizar cada miembro</h3>
      <div className="complexity-order-table oop-access-table" role="table" aria-label="Modificadores de acceso de Java">
        <div className="table-head" role="row"><b>Modificador</b><b>Acceso</b><b>Uso habitual</b></div>
        {modifiers.map(row => <div role="row" key={row[0]}>{row.map((cell, index) => <span role="cell" key={cell}>{index === 0 ? <strong>{cell}</strong> : cell}</span>)}</div>)}
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">09 · HERENCIA</span>
        <h3>Una relación «es un»</h3>
        <pre className="oop-code"><code>{`class Animal {
    public void hacerSonido() {
        System.out.println("Sonido");
    }
}

class Perro extends Animal {
    @Override
    public void hacerSonido() {
        System.out.println("Guau");
    }
}`}</code></pre>
        <p><code>Perro</code> es un <code>Animal</code>. Hereda su contrato y reemplaza un comportamiento. La herencia debe representar una relación real, no utilizarse solamente para ahorrar líneas.</p>
      </article>
      <article>
        <span className="lesson-kicker">10 · POLIMORFISMO</span>
        <h3>Un contrato, varios comportamientos</h3>
        <pre className="oop-code"><code>{`Animal mascota = new Perro();
mascota.hacerSonido(); // imprime "Guau"`}</code></pre>
        <p>La variable tiene tipo <code>Animal</code>, pero el objeto real es un <code>Perro</code>. Java elige en ejecución el método sobrescrito del objeto real. Así podemos agregar nuevas clases sin reescribir el código que usa el contrato general.</p>
      </article>
    </div>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">11 · INTERFACES</span>
        <h3>Definen una capacidad</h3>
        <pre className="oop-code"><code>{`interface Dibujable {
    void dibujar();
}

class Circulo implements Dibujable {
    public void dibujar() {
        System.out.println("Dibujo un círculo");
    }
}`}</code></pre>
        <p>Una interfaz declara qué se puede hacer sin imponer una única implementación. Una clase puede implementar varias interfaces.</p>
      </article>
      <article>
        <span className="lesson-kicker">12 · COMPOSICIÓN</span>
        <h3>Una relación «tiene un»</h3>
        <pre className="oop-code"><code>{`class Motor {
    void encender() { }
}

class Auto {
    private Motor motor = new Motor();

    void arrancar() {
        motor.encender();
    }
}`}</code></pre>
        <p>Un <code>Auto</code> tiene un <code>Motor</code>. La composición permite cambiar piezas con menos acoplamiento y suele ser más flexible que crear cadenas largas de herencia.</p>
      </article>
    </div>

    <article className="oop-comparison-card">
      <span className="lesson-kicker">13 · CONCEPTOS QUE SE CONFUNDEN</span>
      <h3>Sobrecarga no es sobrescritura</h3>
      <div className="data-concept-pair">
        <p><b>Sobrecarga (overload)</b><span>En la misma clase hay métodos con igual nombre y distintos parámetros. El compilador decide cuál usar.</span><code>sumar(int a, int b)</code><code>sumar(double a, double b)</code></p>
        <p><b>Sobrescritura (override)</b><span>Una subclase redefine un método heredado conservando su firma. El objeto real decide cuál se ejecuta.</span><code>@Override hacerSonido()</code></p>
      </div>
    </article>

    <article className="oop-complete-example">
      <span className="lesson-kicker">14 · EJEMPLO COMPLETO</span>
      <h3>Una pila encapsulada con objetos</h3>
      <p>La clase mantiene privado el arreglo y controla su regla LIFO. Quien usa la pila no necesita conocer cómo se guarda internamente.</p>
      <pre className="oop-code"><code>{`class Pila {
    private int[] datos;
    private int size;

    Pila(int capacidad) {
        datos = new int[capacidad];
        size = 0;
    }

    public boolean estaVacia() {
        return size == 0;
    }

    public void push(int valor) {
        if (size < datos.length) {
            datos[size] = valor;
            size = size + 1;
        }
    }

    public int pop() {
        if (estaVacia()) {
            throw new IllegalStateException("Pila vacía");
        }
        size = size - 1;
        return datos[size];
    }
}

Pila numeros = new Pila(5);
numeros.push(10);
numeros.push(20);
int ultimo = numeros.pop(); // 20`}</code></pre>
      <div className="oop-example-notes">
        <p><b>Abstracción</b><span>El usuario piensa en push y pop, no en índices.</span></p>
        <p><b>Encapsulación</b><span>datos y size son privados.</span></p>
        <p><b>Invariante</b><span>size siempre permanece entre 0 y la capacidad.</span></p>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">15 · STATIC E INSTANCIA</span>
        <h3>¿Pertenece a la clase o a cada objeto?</h3>
        <ul>
          <li>Un miembro de <b>instancia</b> existe por separado en cada objeto y se usa mediante una referencia.</li>
          <li>Un miembro <b>static</b> pertenece a la clase y se comparte entre todas sus instancias.</li>
          <li>Usa <code>static</code> para constantes o funciones que no dependen del estado de un objeto; no para convertir todo en variables globales.</li>
        </ul>
      </article>
      <article>
        <span className="lesson-kicker">16 · REFERENCIAS Y NULL</span>
        <h3>La variable no contiene el objeto completo</h3>
        <p>Una variable de tipo objeto guarda una <b>referencia</b>. Dos variables pueden apuntar a la misma instancia; modificarla mediante una referencia también se observa desde la otra.</p>
        <p><code>null</code> significa que no hay un objeto referenciado. Invocar un método mediante <code>null</code> produce <code>NullPointerException</code>.</p>
      </article>
    </div>

    <article className="oop-mistakes-card">
      <span className="lesson-kicker">17 · ERRORES FRECUENTES</span>
      <h3>Señales para revisar el diseño</h3>
      <div className="oop-mistake-grid">
        <p><b>Todo es public</b><span>Cualquier parte del programa puede dejar al objeto en un estado inválido.</span></p>
        <p><b>Clase gigante</b><span>Una sola clase concentra responsabilidades que deberían separarse.</span></p>
        <p><b>Herencia forzada</b><span>Se usa <code>extends</code> aunque no exista una relación real «es un».</span></p>
        <p><b>Solo getters y setters</b><span>El objeto expone datos, pero no protege reglas ni expresa comportamiento.</span></p>
        <p><b>Comparar objetos con ==</b><span><code>==</code> compara referencias; para contenido normalmente se define y usa <code>equals</code>.</span></p>
        <p><b>Ignorar null</b><span>Se usa una referencia sin comprobar que realmente apunta a un objeto.</span></p>
      </div>
    </article>

    <article className="oop-checklist-card">
      <span className="lesson-kicker">18 · GUÍA PARA DISEÑAR</span>
      <h3>Preguntas antes de terminar una clase</h3>
      <ol>
        <li>¿La clase tiene una responsabilidad clara que puedo explicar en una frase?</li>
        <li>¿Sus atributos están protegidos y el constructor crea un estado válido?</li>
        <li>¿Cada método expresa una acción del objeto y valida sus entradas?</li>
        <li>¿La relación es realmente herencia o sería más clara mediante composición?</li>
        <li>¿El código que usa la clase depende de un contrato pequeño y comprensible?</li>
      </ol>
    </article>

    <article className="complexity-summary-card">
      <span className="lesson-kicker">IDEA PARA RECORDAR</span>
      <p>Un buen objeto <b>conoce su propio estado, protege sus reglas y ofrece operaciones claras</b>. La POO no busca crear la mayor cantidad de clases: busca que cada parte del programa tenga una responsabilidad entendible.</p>
    </article>
  </section>;
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
    hello:'Welcome to DSA Lab',learn:'Learn by practicing',title:'Algorithms you can see, touch, and understand.',
    lead:'This is an educational laboratory for visualizing data structures and algorithms more simply. Students can modify examples, play every execution step by step, and use Java and C++ code as a guide to understand, practice, and develop their own algorithms.',
    continue:'Continue with',motto:'Your imagination is the limit.',you:'You can do it.',about:'About this project',aboutTitle:'A space to experiment without being afraid of mistakes',
    aboutText:'Every topic combines a visual representation, interactive controls, and simple code. The goal is to help students understand what happens internally and give them a clear foundation for building their own algorithms.',
    topics:'visual topics',topicsText:'From arrays and linked lists to trees, graphs, recursion, and backtracking.',practice:'Interactive practice',practiceText:'Add, remove, search, and traverse elements while watching every change.',
    java:'Java and C++',javaText:'Readable Java plus native C++ arrays and pointers, designed for students who are getting started.',s1:'Step 1',s1t:'Choose a topic',s1p:'Use the sidebar to open any structure or algorithm.',
    s2:'Step 2',s2t:'Run an operation',s2p:'Fill in the fields and select an operation to modify the example.',s3:'Step 3',s3t:'Observe and learn',s3p:'Compare the animation with the highlighted Java or C++ code lines.',
  } : {
    hello:'Bienvenido a DSA Lab',learn:'Aprende practicando',title:'Algoritmos que puedes ver, tocar y entender.',
    lead:'Esta página es un laboratorio educativo creado para visualizar estructuras de datos y algoritmos de una manera más sencilla. Los alumnos pueden modificar ejemplos, reproducir cada ejecución paso a paso y usar código Java y C++ como punto de apoyo para comprender, practicar y desarrollar sus propios algoritmos.',
    continue:'Continuar con',motto:'El límite es tu imaginación.',you:'Tú puedes.',about:'Sobre este proyecto',aboutTitle:'Un espacio para experimentar sin miedo a equivocarse',
    aboutText:'Cada tema combina una representación visual, controles interactivos y código sencillo. El objetivo es que los alumnos entiendan qué ocurre internamente y dispongan de una base clara desde la cual puedan construir sus propios algoritmos.',
    topics:'temas visuales',topicsText:'Desde arrays y listas hasta árboles, grafos, recursividad y backtracking.',practice:'Práctica interactiva',practiceText:'Agrega, elimina, busca y recorre elementos mientras observas cada cambio.',
    java:'Java y C++',javaText:'Java legible y C++ con arreglos nativos y punteros, pensados para estudiantes que están comenzando.',s1:'Paso 1',s1t:'Elige un tema',s1p:'Usa el menú lateral para entrar a cualquier estructura o algoritmo.',
    s2:'Paso 2',s2t:'Ejecuta una función',s2p:'Completa los campos y pulsa una operación para modificar el ejemplo.',s3:'Paso 3',s3t:'Observa y aprende',s3p:'Compara la animación con las líneas destacadas del código Java o C++.',
  };
  return <div className="welcome-page">
    <section className="welcome-hero">
      <div className="welcome-copy">
        <div className="eyebrow"><span>{c.hello}</span><i>{c.learn}</i></div>
        <h1>{c.title}</h1><p>{c.lead}</p>
        <button className="welcome-start" onClick={onStart}><Play size={17}/> {c.continue} {startName} <ArrowRight size={16}/></button>
        <p className="welcome-motto"><Sparkles size={15}/><strong>{c.motto}</strong> {c.you}</p>
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
        <span>{c.about}</span><h2 id="welcome-about-title">{c.aboutTitle}</h2><p>{c.aboutText}</p>
      </div>
      <div className="welcome-features">
        <article><span>01</span><Sparkles size={21}/><h3>{algorithms.length} {c.topics}</h3><p>{c.topicsText}</p></article>
        <article><span>02</span><Play size={21}/><h3>{c.practice}</h3><p>{c.practiceText}</p></article>
        <article><span>03</span><BookOpen size={21}/><h3>{c.java}</h3><p>{c.javaText}</p></article>
      </div>
    </section>

    <section className="welcome-path">
      <div><small>{c.s1}</small><strong>{c.s1t}</strong><p>{c.s1p}</p></div>
      <ArrowRight size={18}/>
      <div><small>{c.s2}</small><strong>{c.s2t}</strong><p>{c.s2p}</p></div>
      <ArrowRight size={18}/>
      <div><small>{c.s3}</small><strong>{c.s3t}</strong><p>{c.s3p}</p></div>
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
  const codePanelRef = useRef(null);
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
    () => ({ ...baseAlgorithm, values: demoValues, treeColors: demoTreeColors, fibonacciForest: demoFibonacciForest, multiwayTree: demoMultiwayTree, treeParents: demoTreeParents, edges: demoEdges, positions: demoPositions, map: demoMap }),
    [baseAlgorithm, demoValues, demoTreeColors, demoFibonacciForest, demoMultiwayTree, demoTreeParents, demoEdges, demoPositions, demoMap],
  );
  const isTheoryPage = ['theory', 'complexity', 'oop', 'foundation'].includes(baseAlgorithm.type);
  const hideCodePanel = ['dijkstra','a-star'].includes(baseAlgorithm.id);
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
    });
    return () => { active = false; };
  }, [isTheoryPage, javaCodeFactory]);
  useEffect(() => {
    if (isTheoryPage || codeMode !== 'cpp' || cppCodeFactory || !supportsCpp(baseAlgorithm.id)) return;
    let active = true;
    import('./data/beginnerCpp.js').then(module => {
      if (active) setCppCodeFactory(() => module.getBeginnerCpp);
    });
    return () => { active = false; };
  }, [baseAlgorithm.id, codeMode, cppCodeFactory, isTheoryPage]);
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
  const loadAlgorithm = useCallback(id => {
    const nextAlgorithm = algorithmsById.get(id) ?? algorithms[0];
    setSelectedId(nextAlgorithm.id);
    setDemoValues([...nextAlgorithm.values]);
    setDemoTreeColors(redBlackColorsFor(nextAlgorithm, nextAlgorithm.values));
    setDemoFibonacciForest(fibonacciForestFor(nextAlgorithm, nextAlgorithm.values));
    setDemoMultiwayTree(multiwayTreeFor(nextAlgorithm, nextAlgorithm.values));
    setDemoTreeParents(initialNaryParents(nextAlgorithm.id, nextAlgorithm.values));
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
    const needsCompleteLab = isTheoryPage || hideCodePanel;
    if (showWelcome || needsCompleteLab) openAlgorithm(needsCompleteLab ? 'array' : selectedId);
    setTourOpen(true);
  }, [hideCodePanel, isTheoryPage, openAlgorithm, selectedId, showWelcome]);
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
    const codeForAnimation = codeMode === 'java'
      ? (await loadJavaCodeFactory())(baseAlgorithm, actionId)
      : codeMode === 'cpp'
        ? (await loadCppCodeFactory())(baseAlgorithm, actionId)
      : getOperationPseudocode(baseAlgorithm, actionId);
    const pendingFinalFrame = operationStatus === 'success' ? operationFrames.at(-1) : null;
    const previousValues = copyVisualValues(pendingFinalFrame?.values ?? demoValues);
    const previousTreeColors = pendingFinalFrame?.treeColors ?? demoTreeColors;
    const previousFibonacciForest = pendingFinalFrame?.fibonacciForest ?? demoFibonacciForest;
    const previousMultiwayTree = pendingFinalFrame?.multiwayTree ?? demoMultiwayTree;
    const previousTreeParents = pendingFinalFrame?.treeParents ?? demoTreeParents;
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
    });
    const synchronizedFrameFactory = operationGroup(baseAlgorithm) === 'list'
      ? createLinkedListSynchronizedFrames
      : baseAlgorithm.category === 'Árboles'
        ? createTreeSynchronizedFrames
        : createCodeSynchronizedFrames;
    let synchronizedFrames = result.frames?.length
      ? adaptFramesToCode(result.frames, codeForAnimation, codeMode !== 'pseudo')
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
    const needsVisualState = attachTreeColors || attachFibonacciForest || attachMultiwayTree || attachTreeParents;
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
        : algorithm.type === 'complexity' ? <ComplexityLesson/> : algorithm.type === 'oop' ? <OopLesson/> : algorithm.type === 'foundation' ? <Suspense fallback={<DescriptionFallback/>}><FoundationLesson algorithm={algorithm}/></Suspense> : <DataStructuresLesson/>
      : <>
      <section className={`lab-grid ${hideCodePanel ? 'visual-only' : ''}`}>
        <article className="panel visual-panel" data-tour="visualizer">
          <div className="panel-head"><div><span className="panel-index">01</span><h2>{t('visualization')}</h2></div><div className="panel-head-actions">{operationDefinition.actions.length > 0 && <button className={`challenge-toggle ${challengeMode ? 'active' : ''}`} onClick={toggleChallengeMode} title={challengeMode ? t('exit') : t('challengeMode')} aria-label={challengeMode ? t('exit') : t('challengeMode')} aria-pressed={challengeMode}><Brain size={15}/>{challengeMode ? t('exit') : t('challenge')}</button>}<button onClick={createNewExample} title={t('generateData')}><Shuffle size={15}/> {t('newExample')}</button><button className="clear-demo-button" onClick={clearDemo} title={t('clearCurrentData')}><Eraser size={15}/> {t('clearData')}</button><button onClick={resetDemo} title={t('originalData')}><RotateCcw size={15}/> {t('reset')}</button></div></div>
          <div className="canvas-grid" data-visualizer={algorithm.id}><Suspense fallback={<div className="description-loading" aria-label={t('loadingDescription')}><span/></div>}><MemoizedVisualizer algorithm={visualAlgorithm} step={operationFrames.length ? currentAnimationFrame?.position ?? step : step}/></Suspense><div className={`step-badge ${currentAnimationFrame?.iteration != null ? 'loop-step' : ''}`}>{currentAnimationFrame?.loopExit ? <>{t('loopEnd')}</> : currentAnimationFrame?.iteration != null ? <>{t('iteration')} <b>{Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)}/{currentAnimationFrame.totalIterations}</b></> : <>{t('step')} <b>{String(step+1).padStart(2,'0')}</b></>}</div></div>
          {challengeMode
            ? <Suspense fallback={<section className="challenge-panel" aria-label="Cargando desafío"/>}><ChallengePanel algorithm={algorithm} values={demoValues} playing={playing} scenarioKey={challengeScenarioKey} onVerify={handleOperation}/></Suspense>
            : <OperationsPanel algorithm={baseAlgorithm} message={operationMessage} status={operationStatus} activeOperation={activeOperation} onAction={handleOperation}/>}
          {hideCodePanel && <VariablesPanel frame={currentAnimationFrame} algorithm={algorithm} step={step} playing={playing}/>}
          <div className="player"><button onClick={()=>goToStep(step-1)} aria-label={t('previous')}><ArrowLeft size={17}/></button><button className="play" onClick={togglePlayback}>{playing?<Pause size={18}/>:<Play size={18}/>}<span>{playing?t('pause'):t('play')}</span></button><button onClick={()=>goToStep(step+1)} aria-label={t('next')}><ArrowRight size={17}/></button><div className="timeline"><span style={{width:`${((step+1)/totalSteps)*100}%`}}/></div><label><span>{t('speed')}</span><select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><ChevronDown size={13}/></label></div>
        </article>

        {!hideCodePanel && <article className="panel code-panel" data-tour="code">
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
          <pre ref={codePanelRef}>{codeLines.map((line,i)=>{
            const isActive = i === (activeCodeLine ?? step%codeLines.length);
            const isHelperLabel = line.trim().startsWith('// Método auxiliar utilizado arriba:') || line.trim().startsWith('// Helper method used above:');
            return <code className={`${isActive?'active':''} ${isHelperLabel?'helper-method-label':''}`.trim()} key={i}><i>{String(i+1).padStart(2,'0')}</i>{line || ' '}</code>;
          })}</pre>
          <VariablesPanel frame={currentAnimationFrame} algorithm={algorithm} step={step} playing={playing}/>
          <div className="note"><CircleHelp size={17}/><p><strong>{codeMode === 'java' ? `${language === 'en' ? 'Basic Java' : 'Java básico'} · ${activeOperationLabel}` : codeMode === 'cpp' ? `C++ · ${activeOperationLabel}` : language === 'en' ? 'What happens here?' : '¿Qué ocurre aquí?'}</strong><span>{codeMode !== 'pseudo' ? currentAnimationFrame?.iteration != null ? language === 'en' ? `The loop is at iteration ${Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)} of ${currentAnimationFrame.totalIterations}. The highlighted line and active element advance together.` : `El ciclo está en la iteración ${Math.min(currentAnimationFrame.iteration + 1, currentAnimationFrame.totalIterations)} de ${currentAnimationFrame.totalIterations}. La línea iluminada y el elemento activo avanzan juntos.` : codeMode === 'cpp' ? language === 'en' ? 'This implementation uses native arrays, raw pointers, nullptr, new and delete so every visible link corresponds to a real memory reference.' : 'Esta implementación usa arreglos nativos, punteros crudos, nullptr, new y delete para que cada enlace visible corresponda a una referencia real de memoria.' : language === 'en' ? 'The code uses small variables, arrays, loops, conditions, and methods. Each highlighted line matches the visible change in the structure.' : javaOverview : step === 0 ? translateLearningText('Se prepara el estado inicial y la estructura auxiliar.', language) : step >= totalSteps-1 ? translateLearningText('El algoritmo completa la operación y devuelve el resultado.', language) : language === 'en' ? `The active element at step ${step+1} is processed and the state is updated.` : `Se procesa el elemento activo del paso ${step+1} y se actualiza el estado.`}</span></p></div>
        </article>}
      </section>

      <Suspense fallback={<DescriptionFallback/>}><EducationalDescription algorithm={algorithm}/></Suspense>
      </>}

      <section className="learning-strip"><div><BookOpen size={18}/><span><b>{language === 'en' ? categoryDescriptions[algorithm.category] ?? categoryLabels[algorithm.category] : categoryLabels[algorithm.category]}</b> · {algorithm.name}</span></div></section>
      <footer className="algorithm-nav"><a href={seoPath(algorithms[(selectedIndex-1+algorithms.length)%algorithms.length].id, language)} onClick={event=>{event.preventDefault();selectRelative(-1)}}><ArrowLeft size={16}/><span><small>{t('previous')}</small>{localizeAlgorithm(algorithms[(selectedIndex-1+algorithms.length)%algorithms.length], language).name}</span></a><a href={seoPath(algorithms[(selectedIndex+1)%algorithms.length].id, language)} onClick={event=>{event.preventDefault();selectRelative(1)}}><span><small>{t('next')}</small>{localizeAlgorithm(algorithms[(selectedIndex+1)%algorithms.length], language).name}</span><ArrowRight size={16}/></a></footer>
      </>}
    </main>
    <button className="guided-tour-launch" type="button" onClick={startGuidedTour} aria-label={t('guidedTourLabel')}><CircleHelp size={19}/><span>{t('howItWorks')}</span></button>
    <BugReporter section={showWelcome ? t('welcome') : algorithm.name}/>
    <AccessibilityPanel/>
    {tourOpen && <GuidedTour onClose={closeGuidedTour} onStepChange={handleTourStepChange}/>}
    {sectionTest && <Suspense fallback={null}><SectionTestModal
      algorithm={sectionTest.algorithm}
      externalViolation={sectionTestViolation?.reason ?? null}
      onClose={closeSectionTest}
      onActiveChange={setSectionTestActive}
      onLockout={() => setSectionTestClock(Date.now())}
    /></Suspense>}
    {mobileOpen && <button className="scrim" onClick={()=>setMobileOpen(false)} aria-label={t('close')}/>}
  </div>;
}

export default App;
