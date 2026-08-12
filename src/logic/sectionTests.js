import { algorithms } from '../data/algorithms.js';
import { getOperationDefinition, operationGroup } from './operations.js';

const TEST_LENGTH = 10;
const THEORY_GROUPS = new Set(['theory', 'complexity', 'oop', 'foundation']);

const PROFILE_DEFAULT = {
  visual: 'concept', visualCaption: 'Conceptos conectados', principle: 'organiza información para resolver un problema',
  invariant: 'cada paso conserva las reglas definidas por el algoritmo',
  useCase: 'explicar y diseñar soluciones antes de programarlas', analogy: 'un plano que guía una construcción',
};

const GROUP_PROFILES = {
  array: { visual: 'array', visualCaption: 'Casillas con índices consecutivos', principle: 'accede directamente mediante un índice', invariant: 'los índices válidos van de 0 a n - 1', useCase: 'guardar una cantidad conocida de datos del mismo tipo', analogy: 'una fila numerada de casilleros' },
  stack: { visual: 'stack', visualCaption: 'El último elemento queda arriba', principle: 'trabaja con la regla LIFO', invariant: 'push y pop actúan únicamente sobre el tope', useCase: 'deshacer acciones o administrar llamadas', analogy: 'una pila de platos' },
  queue: { visual: 'queue', visualCaption: 'Entra por rear y sale por front', principle: 'trabaja con la regla FIFO', invariant: 'el primer elemento en entrar es el primero en salir', useCase: 'atender solicitudes en orden de llegada', analogy: 'una fila de personas' },
  deque: { visual: 'deque', visualCaption: 'Ambos extremos permanecen disponibles', principle: 'inserta y elimina por ambos extremos', invariant: 'front y rear delimitan los dos extremos', useCase: 'mantener una ventana deslizante', analogy: 'un túnel con entrada por ambos lados' },
  list: { visual: 'linked-list', visualCaption: 'Cada nodo enlaza al siguiente', principle: 'conecta nodos mediante referencias', invariant: 'los enlaces mantienen el orden lógico de los nodos', useCase: 'insertar datos sin desplazar un bloque completo', analogy: 'una cadena de vagones' },
  skip: { visual: 'skip-list', visualCaption: 'Niveles rápidos sobre la lista base', principle: 'agrega niveles para saltar grupos de nodos', invariant: 'el nivel inferior conserva todos los elementos ordenados', useCase: 'buscar rápidamente manteniendo inserciones sencillas', analogy: 'una autopista con vías expresas' },
  tree: { visual: 'tree', visualCaption: 'Una raíz conecta niveles de descendientes', principle: 'organiza nodos jerárquicamente', invariant: 'cada nodo, excepto la raíz, tiene un padre', useCase: 'representar jerarquías y búsquedas', analogy: 'un árbol genealógico' },
  threadedTree: { visual: 'threaded-tree', visualCaption: 'Los hilos apuntan al vecino inorden', principle: 'reutiliza enlaces nulos como hilos de recorrido', invariant: 'LT y RT distinguen hijos reales de hilos', useCase: 'recorrer en inorden sin pila auxiliar', analogy: 'un sendero marcado entre los nodos' },
  heap: { visual: 'heap', visualCaption: 'La prioridad máxima ocupa la raíz', principle: 'mantiene el elemento prioritario en la raíz', invariant: 'un max-heap nunca tiene un hijo mayor que su padre', useCase: 'implementar colas de prioridad', analogy: 'un podio que siempre muestra al mayor arriba' },
  range: { visual: 'range-tree', visualCaption: 'Los nodos resumen intervalos', principle: 'guarda información acumulada de rangos', invariant: 'cada nodo resume el intervalo que representa', useCase: 'consultar sumas o mínimos de intervalos', analogy: 'un índice que resume capítulos' },
  btree: { visual: 'btree', visualCaption: 'Un nodo contiene varias claves', principle: 'mantiene varias claves e hijos por nodo', invariant: 'todas las hojas permanecen a la misma profundidad', useCase: 'indexar grandes volúmenes en disco', analogy: 'un archivador con varios separadores' },
  merkle: { visual: 'merkle', visualCaption: 'Cada padre resume criptográficamente sus hijos', principle: 'combina hashes desde las hojas hasta la raíz', invariant: 'cambiar una hoja modifica los hashes de su camino', useCase: 'verificar integridad de conjuntos de datos', analogy: 'un sello que resume todos los documentos' },
  spatial: { visual: 'spatial', visualCaption: 'El espacio se divide en regiones', principle: 'particiona datos según su ubicación espacial', invariant: 'cada elemento pertenece a la región que contiene sus coordenadas', useCase: 'búsquedas geográficas y colisiones', analogy: 'un mapa dividido en sectores' },
  trie: { visual: 'trie', visualCaption: 'Las letras compartidas usan el mismo prefijo', principle: 'guarda palabras carácter por carácter', invariant: 'la marca de fin distingue una palabra completa', useCase: 'autocompletar y buscar prefijos', analogy: 'caminos que comparten sus primeras señales' },
  expression: { visual: 'expression', visualCaption: 'Operadores como padres de operandos', principle: 'representa la precedencia mediante niveles', invariant: 'las hojas son operandos y los nodos internos son operadores', useCase: 'evaluar expresiones respetando precedencia', analogy: 'una receta dividida en operaciones pequeñas' },
  ast: { visual: 'ast', visualCaption: 'La sintaxis se convierte en nodos semánticos', principle: 'representa la estructura de un programa', invariant: 'cada nodo corresponde a una construcción válida del lenguaje', useCase: 'compiladores, analizadores y editores', analogy: 'el esqueleto de una oración de código' },
  hash: { visual: 'hash', visualCaption: 'Una función decide la cubeta', principle: 'transforma una clave en una posición', invariant: 'las colisiones deben resolverse sin perder datos', useCase: 'consultar valores rápidamente por clave', analogy: 'casilleros asignados por un código' },
  graph: { visual: 'graph', visualCaption: 'Vértices conectados mediante aristas', principle: 'modela relaciones entre entidades', invariant: 'cada arista conecta vértices existentes', useCase: 'redes sociales, rutas y dependencias', analogy: 'ciudades unidas por caminos' },
  shortestPath: { visual: 'route', visualCaption: 'La ruta elegida minimiza el costo', principle: 'explora caminos hasta encontrar uno de menor costo', invariant: 'la distancia registrada representa el mejor costo conocido', useCase: 'navegación y planificación de rutas', analogy: 'buscar el trayecto más económico en un mapa' },
  sort: { visual: 'sort', visualCaption: 'Los elementos cambian hasta quedar ordenados', principle: 'reorganiza elementos según un criterio', invariant: 'el resultado contiene exactamente los mismos elementos', useCase: 'preparar datos para búsqueda y presentación', analogy: 'ordenar libros por su número' },
  math: { visual: 'recursion', visualCaption: 'Cada llamada reduce el problema', principle: 'resuelve un caso usando una versión menor', invariant: 'siempre debe existir y alcanzarse un caso base', useCase: 'definir problemas naturalmente recursivos', analogy: 'cajas que contienen cajas más pequeñas' },
  hanoi: { visual: 'hanoi', visualCaption: 'Los discos se mueven entre tres torres', principle: 'divide el traslado en subproblemas recursivos', invariant: 'ningún disco grande puede quedar sobre uno pequeño', useCase: 'comprender recursión y descomposición', analogy: 'mover una torre respetando tamaños' },
  queens: { visual: 'board', visualCaption: 'Las reinas no comparten línea de ataque', principle: 'prueba decisiones y deshace las inválidas', invariant: 'no hay dos reinas en la misma fila, columna o diagonal', useCase: 'enseñar restricciones con backtracking', analogy: 'ubicar piezas sin que se amenacen' },
  maze: { visual: 'maze', visualCaption: 'El camino retrocede ante un callejón', principle: 'explora rutas y vuelve atrás cuando se bloquea', invariant: 'una celda visitada no se procesa como camino nuevo', useCase: 'buscar salidas en espacios con obstáculos', analogy: 'probar pasillos y regresar en un callejón' },
  sudoku: { visual: 'sudoku', visualCaption: 'Filas, columnas y bloques imponen restricciones', principle: 'prueba números válidos y deshace elecciones', invariant: 'no se repite un número en fila, columna ni bloque 3×3', useCase: 'resolver problemas de satisfacción de restricciones', analogy: 'completar un rompecabezas sin repetir símbolos' },
  matrix: { visual: 'matrix', visualCaption: 'Cada celda usa fila y columna', principle: 'organiza valores en dos dimensiones', invariant: 'cada acceso requiere una fila y una columna válidas', useCase: 'tableros, imágenes y cálculos numéricos', analogy: 'una hoja de cálculo' },
  sparseMatrix: { visual: 'sparse-matrix', visualCaption: 'Solo se almacenan las celdas no nulas', principle: 'enlaza únicamente valores distintos de cero', invariant: 'cada nodo pertenece a su fila y a su columna', useCase: 'matrices grandes con pocos datos', analogy: 'anotar solo los asientos ocupados de un estadio' },
  polynomial: { visual: 'polynomial', visualCaption: 'Cada nodo guarda coeficiente y exponente', principle: 'mantiene términos ordenados por exponente', invariant: 'términos del mismo exponente pueden combinarse', useCase: 'sumar y manipular expresiones algebraicas', analogy: 'fichas ordenadas por potencia' },
  generalizedList: { visual: 'generalized-list', visualCaption: 'Un elemento puede contener otra lista', principle: 'combina átomos y sublistas recursivamente', invariant: 'el tag indica si el nodo es átomo o sublista', useCase: 'representar datos anidados', analogy: 'carpetas que contienen archivos y carpetas' },
  union: { visual: 'union', visualCaption: 'Cada conjunto comparte un representante', principle: 'agrupa elementos en componentes disjuntos', invariant: 'cada elemento llega a una única raíz representante', useCase: 'detectar componentes y ciclos', analogy: 'equipos identificados por un capitán' },
  cache: { visual: 'cache', visualCaption: 'El menos usado recientemente sale primero', principle: 'conserva los datos usados más recientemente', invariant: 'al superar la capacidad se elimina el menos reciente', useCase: 'acelerar accesos repetidos', analogy: 'un escritorio pequeño con lo último utilizado' },
  bloom: { visual: 'bloom', visualCaption: 'Varias funciones activan posiciones de bits', principle: 'descarta ausencias con una estructura probabilística', invariant: 'puede haber falsos positivos, pero no falsos negativos', useCase: 'filtrar consultas antes de una búsqueda costosa', analogy: 'un detector rápido que a veces pide confirmar' },
  theory: PROFILE_DEFAULT, complexity: { ...PROFILE_DEFAULT, visual: 'complexity', visualCaption: 'Las curvas comparan crecimiento', principle: 'describe cómo crece el costo con la entrada', invariant: 'ignora constantes y términos de menor crecimiento', useCase: 'comparar escalabilidad de algoritmos', analogy: 'comparar ritmos de crecimiento' },
  oop: { ...PROFILE_DEFAULT, visual: 'oop', visualCaption: 'Una clase define y los objetos concretan', principle: 'combina estado y comportamiento en objetos', invariant: 'cada objeto es una instancia de una clase', useCase: 'modelar entidades con responsabilidades', analogy: 'un plano y las casas construidas con él' },
  foundation: PROFILE_DEFAULT,
};

const ID_PROFILES = {
  'arbol-general': { visual: 'general-tree', visualCaption: 'Un nodo puede tener cualquier cantidad de hijos' },
  'arbol-nario': { visual: 'nary-tree', visualCaption: 'Cada nodo admite como máximo n hijos' },
  'arbol-binario': { visual: 'binary-tree', visualCaption: 'Cada nodo tiene como máximo dos hijos' },
  avl: { visual: 'avl', visualCaption: 'El factor de balance controla las alturas', principle: 'se rebalancea mediante rotaciones', invariant: 'el factor de balance de cada nodo está entre -1 y 1', useCase: 'búsquedas ordenadas con altura controlada', analogy: 'una balanza que se corrige al inclinarse' },
  'red-black': { visual: 'red-black', visualCaption: 'Los colores imponen reglas de balance', principle: 'usa colores y rotaciones para limitar la altura', invariant: 'ningún nodo rojo tiene un hijo rojo', useCase: 'mapas y conjuntos ordenados', analogy: 'reglas de color que mantienen el camino equilibrado' },
  'splay-tree': { visual: 'splay', visualCaption: 'El nodo accedido sube hasta la raíz', principle: 'mueve a la raíz el nodo usado recientemente', invariant: 'cada acceso termina con una operación de splay', useCase: 'datos con accesos repetidos', analogy: 'dejar al frente lo que acabas de utilizar' },
  bst: { visual: 'bst', visualCaption: 'Menores a la izquierda y mayores a la derecha', principle: 'compara para avanzar a izquierda o derecha', invariant: 'menores a la izquierda y mayores a la derecha', useCase: 'mantener valores ordenados y buscables', analogy: 'un juego de adivinar menor o mayor' },
  'prefix-tree': { principle: 'comparte caminos entre palabras con igual prefijo', invariant: 'la marca final identifica la palabra completa', useCase: 'autocompletado', analogy: 'rutas que comparten el comienzo' },
  'suffix-tree': { principle: 'organiza sufijos de un texto', invariant: 'cada sufijo puede seguirse desde la raíz', useCase: 'buscar patrones dentro de textos', analogy: 'un índice de todas las terminaciones' },
  dijkstra: { principle: 'confirma primero el vértice de menor distancia', invariant: 'requiere pesos no negativos', useCase: 'rutas mínimas con costos conocidos', analogy: 'expandir primero el trayecto acumulado más barato' },
  'a-star': { principle: 'combina costo recorrido y estimación heurística', invariant: 'f(n) = g(n) + h(n)', useCase: 'encontrar rutas orientándose hacia una meta', analogy: 'caminar considerando distancia recorrida y cercanía estimada' },
  'merge-sort': { principle: 'divide, ordena mitades y luego las mezcla', invariant: 'la mezcla compara los primeros pendientes de ambas mitades', useCase: 'ordenamiento estable y predecible', analogy: 'unir dos filas ya ordenadas' },
  'quick-sort': { principle: 'particiona los datos alrededor de un pivote', invariant: 'la partición separa menores y mayores respecto al pivote', useCase: 'ordenamiento rápido en memoria', analogy: 'separar elementos usando uno como referencia' },
  fibonacci: { principle: 'combina los dos resultados anteriores', invariant: 'los casos base detienen la recursión', useCase: 'introducir recurrencias', analogy: 'cada término nace de los dos anteriores' },
  factorial: { principle: 'multiplica n por el factorial de n - 1', invariant: '0! y 1! valen 1', useCase: 'contar permutaciones', analogy: 'una multiplicación que disminuye hasta uno' },
};

const hash = value => [...String(value)].reduce((total, character) => ((total * 31 + character.charCodeAt(0)) >>> 0), 17);
const rotate = (values, seed) => { const offset = values.length ? hash(seed) % values.length : 0; return [...values.slice(offset), ...values.slice(0, offset)]; };
const unique = values => [...new Set(values.filter(value => value !== undefined && value !== null && String(value).trim()))];

function choices(correct, distractors, seed) {
  const values = unique([correct, ...distractors]).slice(0, 4);
  let fallback = 1;
  while (values.length < 3) { values.push(`Alternativa ${fallback}`); fallback += 1; }
  return rotate(values, seed).map((label, index) => ({ id: `choice-${index}`, label: String(label), correct: String(label) === String(correct) }));
}

const profileFor = algorithm => ({ ...PROFILE_DEFAULT, ...(GROUP_PROFILES[operationGroup(algorithm)] ?? {}), ...(ID_PROFILES[algorithm.id] ?? {}) });
const firstCodeLine = algorithm => algorithm.code.split('\n').map(line => line.trim()).find(Boolean) ?? algorithm.name;

function questionPool(algorithm) {
  const group = operationGroup(algorithm);
  const profile = profileFor(algorithm);
  const others = algorithms.filter(item => item.id !== algorithm.id);
  const peers = others.filter(item => item.category === algorithm.category);
  const outsiders = others.filter(item => item.category !== algorithm.category);
  const otherProfiles = others.map(profileFor);
  const actions = THEORY_GROUPS.has(group) ? [] : getOperationDefinition(algorithm).actions;
  const ownActionLabels = actions.map(action => action.label);
  const foreignActions = unique(outsiders.flatMap(item => getOperationDefinition(item).actions.map(action => action.label))).filter(label => !ownActionLabels.includes(label));
  const conceptParts = unique(algorithm.complexity.split(/·|\||,/).map(value => value.trim()));
  const foreignConcepts = unique(others.flatMap(item => item.complexity.split(/·|\||,/).map(value => value.trim()))).filter(value => !conceptParts.includes(value));
  const visualDistractors = peers.filter(item => profileFor(item).visual !== profile.visual).map(item => item.name);
  const pool = [
    { id: 'visual-recognition', visual: { type: profile.visual, caption: profile.visualCaption }, prompt: 'Observa el diagrama. ¿Qué tema representa mejor esta organización?', explanation: `El diagrama representa ${algorithm.name}: ${profile.visualCaption.toLowerCase()}.`, choices: choices(algorithm.name, [...visualDistractors, ...outsiders.map(item => item.name)], `${algorithm.id}-visual`) },
    { id: 'principle', prompt: `¿Cuál es la idea central de «${algorithm.name}»?`, explanation: `${algorithm.name} ${profile.principle}.`, choices: choices(profile.principle, otherProfiles.map(item => item.principle), `${algorithm.id}-principle`) },
    { id: 'invariant', prompt: `Mientras funciona «${algorithm.name}», ¿qué regla debe mantenerse?`, explanation: `La regla esencial es que ${profile.invariant}.`, choices: choices(profile.invariant, otherProfiles.map(item => item.invariant), `${algorithm.id}-invariant`) },
    { id: 'scenario', prompt: `Necesitas ${profile.useCase}. ¿Qué tema elegirías?`, explanation: `${algorithm.name} es apropiado para ${profile.useCase}.`, choices: choices(algorithm.name, rotate(outsiders, algorithm.id).map(item => item.name), `${algorithm.id}-scenario`) },
    { id: 'analogy', prompt: `¿Qué analogía ayuda a comprender «${algorithm.name}»?`, explanation: `Puede imaginarse como ${profile.analogy}.`, choices: choices(profile.analogy, otherProfiles.map(item => item.analogy), `${algorithm.id}-analogy`) },
    { id: 'definition', prompt: `Un estudiante afirma: «${algorithm.description}». ¿De qué tema habla?`, explanation: `La definición corresponde a ${algorithm.name}.`, choices: choices(algorithm.name, rotate(others, `${algorithm.id}-definition`).map(item => item.name), `${algorithm.id}-definition`) },
    { id: 'complexity', prompt: `¿Qué información de complejidad o contenido corresponde a «${algorithm.name}»?`, explanation: `La ficha de la sección indica ${algorithm.complexity}.`, choices: choices(algorithm.complexity, others.map(item => item.complexity), `${algorithm.id}-complexity`) },
    { id: 'code', prompt: `¿Qué paso de pseudocódigo pertenece a «${algorithm.name}»?`, explanation: `Su representación incluye «${firstCodeLine(algorithm)}».`, choices: choices(firstCodeLine(algorithm), others.map(firstCodeLine), `${algorithm.id}-code`) },
    { id: 'category', prompt: `¿En qué familia de DSA Lab se estudia «${algorithm.name}»?`, explanation: `${algorithm.name} pertenece a ${algorithm.category}.`, choices: choices(algorithm.category, outsiders.map(item => item.category), `${algorithm.id}-category`) },
    { id: 'peer', prompt: `¿Qué tema comparte familia con «${algorithm.name}»?`, explanation: `${peers[0].name} también pertenece a ${algorithm.category}.`, choices: choices(peers[0].name, outsiders.map(item => item.name), `${algorithm.id}-peer`) },
    { id: 'outsider', prompt: `¿Cuál tema NO pertenece a la familia ${algorithm.category}?`, explanation: `${outsiders[0].name} pertenece a ${outsiders[0].category}.`, choices: choices(outsiders[0].name, peers.map(item => item.name), `${algorithm.id}-outsider`) },
    { id: 'concept', prompt: `¿Qué concepto aparece directamente en la ficha de «${algorithm.name}»?`, explanation: `La ficha incluye «${conceptParts[0]}».`, choices: choices(conceptParts[0], foreignConcepts, `${algorithm.id}-concept`) },
    { id: 'misconception', prompt: `¿Cuál afirmación describe una regla de otro tema y NO la principal de «${algorithm.name}»?`, explanation: `«${otherProfiles[0].invariant}» no es la regla principal de ${algorithm.name}.`, choices: choices(otherProfiles[0].invariant, [profile.invariant, profile.principle], `${algorithm.id}-misconception`) },
  ];
  if (actions.length) {
    pool.push({ id: 'operation', prompt: `¿Qué acción está disponible específicamente en el laboratorio de «${algorithm.name}»?`, explanation: `El panel permite ejecutar «${actions[0].label}».`, choices: choices(actions[0].label, foreignActions, `${algorithm.id}-operation`) });
    pool.push({ id: 'operation-pair', prompt: `¿Qué segunda operación puedes practicar en «${algorithm.name}»?`, explanation: `También puedes usar «${actions[1].label}».`, choices: choices(actions[1].label, foreignActions, `${algorithm.id}-operation-pair`) });
    pool.push({ id: 'invalid-operation', prompt: `¿Qué operación NO aparece en el panel de «${algorithm.name}»?`, explanation: `«${foreignActions[0]}» corresponde a otra estructura.`, choices: choices(foreignActions[0], ownActionLabels, `${algorithm.id}-invalid-operation`) });
  }
  return pool;
}

export function createSectionTest(algorithm) {
  const pool = questionPool(algorithm);
  const visual = pool.find(question => question.visual);
  const remaining = pool.filter(question => !question.visual).sort((first, second) => hash(`${algorithm.id}-${first.id}`) - hash(`${algorithm.id}-${second.id}`));
  return { id: `${algorithm.id}-${Date.now()}`, algorithmId: algorithm.id, algorithmName: algorithm.name, questions: [visual, ...remaining.slice(0, TEST_LENGTH - 1)] };
}

export function gradeSectionTest(test, answers) {
  const correct = test.questions.reduce((total, question) => total + (question.choices.find(choice => choice.id === answers[question.id])?.correct ? 1 : 0), 0);
  const total = test.questions.length;
  return { correct, total, percentage: total ? Math.round(correct / total * 100) : 0, passed: total > 0 && correct / total >= 0.6 };
}

export const SECTION_TEST_STORAGE_KEY = 'dsa-section-test-results-v1';
export const SECTION_TEST_LOCK_STORAGE_KEY = 'dsa-section-test-locks-v1';
export const SECTION_TEST_LOCK_DURATION_MS = 45 * 60 * 1000;

function readSectionTestLocks() {
  try { const value = JSON.parse(window.localStorage.getItem(SECTION_TEST_LOCK_STORAGE_KEY) ?? '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
}

export function lockSectionTest(algorithmId, now = Date.now()) {
  const lockedUntil = now + SECTION_TEST_LOCK_DURATION_MS;
  try { const locks = readSectionTestLocks(); window.localStorage.setItem(SECTION_TEST_LOCK_STORAGE_KEY, JSON.stringify({ ...locks, [algorithmId]: lockedUntil })); } catch { /* La cancelación continúa sin almacenamiento. */ }
  return lockedUntil;
}

export function getSectionTestLockedUntil(algorithmId, now = Date.now()) {
  const locks = readSectionTestLocks();
  const lockedUntil = Number(locks[algorithmId]) || 0;
  if (lockedUntil <= now && lockedUntil !== 0) {
    try { delete locks[algorithmId]; window.localStorage.setItem(SECTION_TEST_LOCK_STORAGE_KEY, JSON.stringify(locks)); } catch { /* Se ignora un bloqueo vencido. */ }
    return 0;
  }
  return lockedUntil;
}

export function saveSectionTestResult(result) {
  try { const previous = JSON.parse(window.localStorage.getItem(SECTION_TEST_STORAGE_KEY) ?? '[]'); const history = Array.isArray(previous) ? previous : []; window.localStorage.setItem(SECTION_TEST_STORAGE_KEY, JSON.stringify([...history.slice(-99), result])); } catch { /* La evaluación continúa sin almacenamiento. */ }
}
