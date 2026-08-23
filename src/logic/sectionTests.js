import { algorithms } from '../data/algorithms.js';
import { getOperationDefinition, operationGroup } from './operations.js';

const TEST_LENGTH = 10;
const THEORY_GROUPS = new Set(['theory', 'complexity', 'oop', 'foundation']);
const NON_MATERIAL_ACTIONS = new Set(['reset', 'shuffle']);

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
  polynomial: { visual: 'polynomial', visualCaption: 'Cada nodo guarda coeficiente y exponente', principle: 'mantiene términos ordenados por exponente', invariant: 'términos del mismo exponente pueden combinarse', useCase: 'sumar y manipular expresiones algebraicas', analogy: 'tarjetas ordenadas por potencia' },
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
  'bubble-sort': { principle: 'compara vecinos y empuja el mayor pendiente al final de cada pasada', invariant: 'la zona final ya no necesita nuevas comparaciones', useCase: 'enseñar intercambios y ciclos anidados con entradas pequeñas', analogy: 'hacer subir la burbuja mayor hasta la superficie' },
  'selection-sort': { principle: 'selecciona el mínimo pendiente y lo coloca al inicio de su zona', invariant: 'el prefijo terminado contiene los menores en orden', useCase: 'reducir la cantidad de intercambios en un ejemplo pequeño', analogy: 'elegir la carta menor restante para la siguiente posición' },
  'insertion-sort': { principle: 'inserta cada clave dentro del prefijo que ya está ordenado', invariant: 'antes de cada iteración values[0..i-1] está ordenado', useCase: 'ordenar pocos datos que ya están casi ordenados', analogy: 'acomodar una nueva carta dentro de una mano ordenada' },
  'shell-sort': { principle: 'aplica inserciones con saltos decrecientes hasta usar gap uno', invariant: 'cada pasada deja ordenados los grupos separados por el gap actual', useCase: 'ordenar en memoria sin arreglo auxiliar con mejor comportamiento práctico que inserción simple', analogy: 'acercar primero objetos lejanos y luego ajustar vecinos' },
  'heap-sort': { principle: 'construye un max-heap y extrae repetidamente su raíz', invariant: 'la raíz del heap activo contiene su máximo y el sufijo ya está fijo', useCase: 'garantizar O(n log n) usando memoria adicional constante', analogy: 'sacar siempre al competidor de mayor prioridad' },
  'counting-sort': { principle: 'cuenta frecuencias y reconstruye valores sin compararlos', invariant: 'count[x-min] representa las apariciones pendientes de x', useCase: 'ordenar enteros cuando el rango entre mínimo y máximo es pequeño', analogy: 'clasificar números en recipientes numerados y vaciarlos en orden' },
  'radix-sort': { principle: 'ordena establemente por cada dígito desde unidades hacia la izquierda', invariant: 'cada pasada conserva el orden logrado por los dígitos anteriores', useCase: 'ordenar muchos identificadores enteros de cantidad acotada de dígitos', analogy: 'clasificar tarjetas primero por unidades, luego decenas y centenas' },
  'bogo-sort': { principle: 'mezcla al azar hasta encontrar por casualidad el orden correcto', invariant: 'sólo termina cuando todos los pares vecinos están ordenados', useCase: 'demostrar por qué corrección no significa eficiencia', analogy: 'lanzar todas las cartas al aire hasta que caigan ordenadas' },
  fibonacci: { principle: 'combina los dos resultados anteriores', invariant: 'los casos base detienen la recursión', useCase: 'introducir recurrencias', analogy: 'cada término nace de los dos anteriores' },
  factorial: { principle: 'multiplica n por el factorial de n - 1', invariant: '0! y 1! valen 1', useCase: 'contar permutaciones', analogy: 'una multiplicación que disminuye hasta uno' },
};

const hash = value => [...String(value)].reduce((total, character) => ((total * 31 + character.charCodeAt(0)) >>> 0), 17);
const rotate = (values, seed) => { const offset = values.length ? hash(seed) % values.length : 0; return [...values.slice(offset), ...values.slice(0, offset)]; };
const unique = values => [...new Set(values.filter(value => value !== undefined && value !== null && String(value).trim()))];

function materialActionsFor(algorithm) {
  const group = operationGroup(algorithm);
  const actions = getOperationDefinition(algorithm).actions.filter(action => !NON_MATERIAL_ACTIONS.has(action.id));
  if (group === 'sort') return actions.filter(action => action.id === 'sort');
  if (group === 'shortestPath') return actions.filter(action => action.id === 'shortest-path');
  return actions;
}

function materialActionLabel(action, algorithm) {
  if (action.id === 'sort') return `Ordenar los elementos mediante ${algorithm.name}`;
  if (action.id === 'shortest-path') return `Calcular una ruta de costo mínimo mediante ${algorithm.name}`;
  if (action.id === 'solve') return `Resolver el problema respetando sus restricciones`;
  if (action.id === 'step-solution') return `Explorar la solución paso a paso`;
  return action.label;
}

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
  const groupPeers = others.filter(item => operationGroup(item) === group);
  const outsiders = others.filter(item => item.category !== algorithm.category);
  const otherProfiles = others.map(profileFor);
  const actions = THEORY_GROUPS.has(group) ? [] : materialActionsFor(algorithm);
  const ownActionLabels = actions.map(action => materialActionLabel(action, algorithm));
  const foreignActions = unique(outsiders.flatMap(item => materialActionsFor(item)
    .map(action => materialActionLabel(action, item)))).filter(label => !ownActionLabels.includes(label));
  const conceptParts = unique(algorithm.complexity.split(/·|\||,/).map(value => value.trim()));
  const foreignConcepts = unique(others.flatMap(item => item.complexity.split(/·|\||,/).map(value => value.trim()))).filter(value => !conceptParts.includes(value));
  const visualDistractors = peers.filter(item => profileFor(item).visual !== profile.visual).map(item => item.name);
  const comparisonTarget = groupPeers.find(item => profileFor(item).principle !== profile.principle)
    ?? peers.find(item => profileFor(item).principle !== profile.principle)
    ?? others[0];
  const comparisonProfile = profileFor(comparisonTarget);
  const pool = [
    { id: 'visual-recognition', visual: { type: profile.visual, caption: profile.visualCaption }, prompt: 'Observa el diagrama. ¿Qué tema representa mejor esta organización?', explanation: `El diagrama representa ${algorithm.name}: ${profile.visualCaption.toLowerCase()}.`, choices: choices(algorithm.name, [...visualDistractors, ...outsiders.map(item => item.name)], `${algorithm.id}-visual`) },
    { id: 'principle', prompt: `¿Cuál es la idea central de «${algorithm.name}»?`, explanation: `${algorithm.name} ${profile.principle}.`, choices: choices(profile.principle, otherProfiles.map(item => item.principle), `${algorithm.id}-principle`) },
    { id: 'invariant', prompt: `Durante cualquier operación válida de «${algorithm.name}», ¿qué propiedad debe conservarse?`, explanation: `La propiedad esencial es que ${profile.invariant}.`, choices: choices(profile.invariant, otherProfiles.map(item => item.invariant), `${algorithm.id}-invariant`) },
    { id: 'scenario', prompt: `¿Qué estructura o algoritmo elegirías para ${profile.useCase}?`, explanation: `${algorithm.name} está diseñado para ${profile.useCase}.`, choices: choices(algorithm.name, rotate(outsiders, algorithm.id).map(item => item.name), `${algorithm.id}-scenario`) },
    { id: 'analogy', prompt: `¿Qué analogía ayuda a comprender «${algorithm.name}»?`, explanation: `Puede imaginarse como ${profile.analogy}.`, choices: choices(profile.analogy, otherProfiles.map(item => item.analogy), `${algorithm.id}-analogy`) },
    { id: 'definition', prompt: `¿Qué estructura o algoritmo coincide con esta definición? «${algorithm.description}»`, explanation: `La definición corresponde a ${algorithm.name}.`, choices: choices(algorithm.name, rotate(others, `${algorithm.id}-definition`).map(item => item.name), `${algorithm.id}-definition`) },
    { id: 'complexity', prompt: `¿Qué complejidad o conjunto de conceptos corresponde a «${algorithm.name}»?`, explanation: `Para ${algorithm.name}, la respuesta correcta es ${algorithm.complexity}.`, choices: choices(algorithm.complexity, others.map(item => item.complexity), `${algorithm.id}-complexity`) },
    { id: 'code', prompt: `¿Qué paso de pseudocódigo es coherente con «${algorithm.name}»?`, explanation: `Un paso propio del procedimiento es «${firstCodeLine(algorithm)}».`, choices: choices(firstCodeLine(algorithm), others.map(firstCodeLine), `${algorithm.id}-code`) },
    { id: 'concept', prompt: `¿Qué concepto es necesario para comprender «${algorithm.name}»?`, explanation: `Uno de sus conceptos fundamentales es «${conceptParts[0]}».`, choices: choices(conceptParts[0], foreignConcepts, `${algorithm.id}-concept`) },
    { id: 'misconception', prompt: `¿Cuál afirmación NO describe correctamente a «${algorithm.name}»?`, explanation: `«${comparisonProfile.invariant}» corresponde a ${comparisonTarget.name}, no a ${algorithm.name}.`, choices: choices(comparisonProfile.invariant, [profile.invariant, profile.principle], `${algorithm.id}-misconception`) },
    { id: 'comparison', prompt: `¿Qué propiedad diferencia a «${algorithm.name}» de «${comparisonTarget.name}»?`, explanation: `${algorithm.name} se distingue porque ${profile.invariant}.`, choices: choices(profile.invariant, [comparisonProfile.invariant, comparisonProfile.principle, profile.analogy], `${algorithm.id}-comparison`) },
    { id: 'broken-invariant', prompt: `¿Qué consecuencia tiene romper la propiedad «${profile.invariant}»?`, explanation: `${algorithm.name} dejaría de garantizar su comportamiento correcto hasta restaurar esa propiedad.`, choices: choices('La estructura o el algoritmo deja de garantizar su comportamiento correcto', ['La complejidad se vuelve siempre O(1)', 'Los datos se ordenan automáticamente', 'No ocurre ningún cambio lógico'], `${algorithm.id}-broken-invariant`) },
  ];
  if (actions.length) {
    const firstAction = materialActionLabel(actions[0], algorithm);
    const secondAction = actions[1] ? materialActionLabel(actions[1], algorithm) : null;
    pool.push({ id: 'operation', prompt: `¿Qué operación es válida para «${algorithm.name}»?`, explanation: `«${firstAction}» forma parte de las operaciones definidas para ${algorithm.name}.`, choices: choices(firstAction, foreignActions, `${algorithm.id}-operation`) });
    if (secondAction) pool.push({ id: 'operation-pair', prompt: `¿Cuál es otra operación propia de «${algorithm.name}»?`, explanation: `«${secondAction}» también corresponde a ${algorithm.name}.`, choices: choices(secondAction, foreignActions, `${algorithm.id}-operation-pair`) });
    pool.push({ id: 'invalid-operation', prompt: `¿Qué operación NO es característica de «${algorithm.name}»?`, explanation: `«${foreignActions[0]}» pertenece a otra estructura o algoritmo.`, choices: choices(foreignActions[0], ownActionLabels, `${algorithm.id}-invalid-operation`) });
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
