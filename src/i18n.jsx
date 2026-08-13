import { createContext, useContext, useMemo, useState } from 'react';

const LanguageContext = createContext(null);
const LANGUAGE_KEY = 'dsa-language';

export const siteMetadata = {
  es: {
    title: 'DSA Lab — Estructuras de datos y algoritmos visuales',
    description: 'Aprende estructuras de datos y algoritmos mediante visualizaciones, animaciones paso a paso, código Java y ejercicios interactivos.',
    imageAlt: 'DSA Lab con representaciones visuales de arrays, árboles y grafos',
    locale: 'es_CL',
  },
  en: {
    title: 'DSA Lab — Visual Data Structures and Algorithms',
    description: 'Learn data structures and algorithms through visualizations, step-by-step animations, Java code, and interactive exercises.',
    imageAlt: 'DSA Lab with visual representations of arrays, trees, and graphs',
    locale: 'en_US',
  },
};

const ui = {
  es: {
    visualAlgorithms: 'Algoritmos visuales', search: 'Buscar algoritmo…', includedTopics: 'temas incluidos', author: 'Autor',
    hideMenu: 'Ocultar menú lateral', showMenu: 'Mostrar menú lateral', openMenu: 'Abrir menú', close: 'Cerrar', closeForm: 'Cerrar formulario',
    welcome: 'Bienvenida', theoryGuide: 'Guía teórica', interactivePractice: 'Práctica interactiva', content: 'Contenido', complexity: 'Complejidad',
    fundamentalsCharts: 'Fundamentos y gráficos', fundamentalConcepts: 'Conceptos fundamentales', asymptoticAnalysis: 'Análisis asintótico',
    checkLearning: 'Comprueba lo aprendido', tenQuestions: 'Prueba conceptual de 10 preguntas', takeTest: 'Realizar prueba', availableIn: 'Disponible en', locked: 'Bloqueada',
    visualization: 'Visualización', challenge: 'Desafío', challengeMode: 'Modo desafío', exit: 'Salir', newExample: 'Nuevo ejemplo', reset: 'Restablecer', generateData: 'Generar datos nuevos',
    originalData: 'Volver a los datos originales', step: 'Paso', iteration: 'Iteración', loopEnd: 'Fin bucle', previous: 'Anterior', next: 'Siguiente',
    pause: 'Pausar', play: 'Reproducir', speed: 'Velocidad', pseudocode: 'Pseudocódigo', copy: 'Copiar', copied: 'Copiado', codeFormat: 'Formato de código',
    howItWorks: '¿Cómo funciona?', guidedTourLabel: 'Abrir recorrido guiado de cómo funciona DSA Lab', reportProblem: 'Informar un problema', emptyStructure: 'Estructura vacía', loadingDescription: 'Cargando descripción',
    operation: 'Operación', result: 'Resultado', review: 'Revisar', completedOperation: 'Operación completada', typeHere: 'Escribe aquí', run: 'Ejecutar',
    realTimeVariables: 'Variables en tiempo real', currentState: 'Estado actual', running: 'Ejecutando', finished: 'Finalizado', error: 'Error',
    panelState: 'El panel refleja el estado visible de la estructura en este paso.',
    loopState: 'Estos valores cambian al mismo tiempo que la línea activa y la animación.',
    loopExit: 'La condición dio false: el ciclo termina y el programa continúa.',
  },
  en: {
    visualAlgorithms: 'Visual algorithms', search: 'Search algorithms…', includedTopics: 'topics included', author: 'Author',
    hideMenu: 'Hide sidebar', showMenu: 'Show sidebar', openMenu: 'Open menu', close: 'Close', closeForm: 'Close form',
    welcome: 'Welcome', theoryGuide: 'Theory guide', interactivePractice: 'Interactive practice', content: 'Content', complexity: 'Complexity',
    fundamentalsCharts: 'Fundamentals and charts', fundamentalConcepts: 'Fundamental concepts', asymptoticAnalysis: 'Asymptotic analysis',
    checkLearning: 'Check what you learned', tenQuestions: '10-question concept test', takeTest: 'Take test', availableIn: 'Available in', locked: 'Locked',
    visualization: 'Visualization', challenge: 'Challenge', challengeMode: 'Challenge mode', exit: 'Exit', newExample: 'New example', reset: 'Reset', generateData: 'Generate new data',
    originalData: 'Return to the original data', step: 'Step', iteration: 'Iteration', loopEnd: 'Loop end', previous: 'Previous', next: 'Next',
    pause: 'Pause', play: 'Play', speed: 'Speed', pseudocode: 'Pseudocode', copy: 'Copy', copied: 'Copied', codeFormat: 'Code format',
    howItWorks: 'How does it work?', guidedTourLabel: 'Open the guided tour of how DSA Lab works', reportProblem: 'Report a problem', emptyStructure: 'Empty structure', loadingDescription: 'Loading description',
    operation: 'Operation', result: 'Result', review: 'Review', completedOperation: 'Operation completed', typeHere: 'Type here', run: 'Run',
    realTimeVariables: 'Real-time variables', currentState: 'Current state', running: 'Running', finished: 'Finished', error: 'Error',
    panelState: 'The panel reflects the structure state visible at this step.',
    loopState: 'These values change together with the active line and the animation.',
    loopExit: 'The condition evaluated to false: the loop ends and the program continues.',
  },
};

export const categoryNames = {
  Fundamentos: 'Fundamentals', 'Estructuras lineales': 'Linear structures', 'Árboles': 'Trees', Hashing: 'Hashing',
  Grafos: 'Graphs', 'Recursión': 'Recursion', Backtracking: 'Backtracking', Otros: 'Other topics',
};

export const categoryDescriptions = {
  Fundamentos: 'Foundations for organizing and analyzing data', 'Estructuras lineales': 'Sequential foundations',
  'Árboles': 'Hierarchies and search', Hashing: 'Key-based access', Grafos: 'Networks and paths',
  'Recursión': 'Divide and conquer', Backtracking: 'Exploring solutions', Otros: 'Specialized structures',
};

const names = {
  'estructuras-de-datos':'What are data structures?','complejidad-algoritmica':'Algorithmic complexity','programacion-orientada-objetos':'Object-Oriented Programming',
  'variables-tipos-operadores':'Variables, types and operators','condiciones-ciclos':'Conditions and loops','metodos-parametros':'Methods and parameters',
  'punteros-referencias':'Pointers and references','manejo-memoria-java':'Memory management in Java','recursividad-fundamentos':'Recursion fundamentals',
  'tipos-datos-abstractos':'Abstract Data Types (ADT)','genericos-java':'Generics in Java','errores-excepciones':'Errors and exceptions',
  'comparacion-ordenamiento-objetos':'Comparing and sorting objects','diseno-representacion-algoritmos':'Algorithm design and representation',
  'correctitud-algoritmos':'Algorithm correctness','pruebas-depuracion':'Testing and debugging','fundamentos-backtracking':'Backtracking fundamentals',
  'fundamentos-busqueda-binaria':'Binary search fundamentals','fundamentos-divide-venceras':'Divide and Conquer fundamentals','programacion-dinamica':'Dynamic Programming fundamentals',
  array:'Array',pila:'Stack',cola:'Queue',deque:'Deque','lista-simple':'Singly linked list','lista-doble':'Doubly linked list',
  'lista-circular-simple':'Singly circular linked list','lista-circular-doble':'Doubly circular linked list','skip-list':'Skip List',
  'arbol-general':'General tree','arbol-nario':'N-ary tree','arbol-binario':'Binary tree','arbol-enhebrado':'Threaded binary tree',bst:'Binary Search Tree',
  avl:'AVL Tree','rojo-negro':'Red-Black Tree','splay-tree':'Splay Tree',heap:'Binary Heap','fibonacci-heap':'Fibonacci Heap',trie:'Prefix Tree',
  'suffix-tree':'Suffix Tree','segment-tree':'Segment Tree','fenwick-tree':'Fenwick Tree',btree:'B-Tree','bplus-tree':'B+ Tree','bstar-tree':'B* Tree',
  'merkle-tree':'Merkle Tree','kd-tree':'KD-Tree',quadtree:'QuadTree',octree:'Octree','expression-tree':'Expression Tree',ast:'AST (Abstract Syntax Tree)',
  'hash-table':'Hash Table','hash-open':'Open Addressing','hash-chaining':'Separate Chaining',grafo:'Graph','grafo-dirigido':'Directed graph',
  dfs:'DFS',bfs:'BFS',dijkstra:'Dijkstra','a-star':'A* (A-Star)',prim:'Prim',kruskal:'Kruskal',fibonacci:'Fibonacci',factorial:'Factorial',
  hanoi:'Towers of Hanoi','merge-sort':'Merge Sort','quick-sort':'Quick Sort','n-reinas':'N-Queens',laberinto:'Maze',sudoku:'9×9 Sudoku Solver',
  matriz:'Matrix',polinomios:'Polynomials with linked lists','listas-generalizadas':'Generalized lists','matriz-dispersa':'Sparse matrix',
  'union-find':'Union-Find','lru-cache':'LRU Cache','bloom-filter':'Bloom Filter',
};

const descriptions = {
  array: 'A contiguous, indexed collection with direct access. It is the foundation of many other data structures.',
  pila: 'A LIFO structure: the last element inserted is the first one removed.', cola: 'A FIFO structure: elements are served in the same order in which they arrived.',
  deque: 'A double-ended queue that supports efficient operations at both ends.', 'lista-simple': 'Nodes linked in one direction; each node points to the next one.',
  'lista-doble': 'Each node links to both the previous and next nodes, allowing traversal in either direction.',
  'lista-circular-simple': 'The last node points back to the head, forming a cycle with no final null reference.',
  'lista-circular-doble': 'A bidirectional list where the head and the last node are connected as well.',
  'arbol-binario': 'Each node has at most one left child and one right child.', bst: 'Keeps smaller values on the left and larger values on the right.',
  avl: 'A self-balancing BST whose subtree heights never differ by more than one.', heap: 'A complete tree that keeps its greatest element at the root.',
  trie: 'A prefix tree in which every path represents a word.', grafo: 'A set of vertices connected by undirected edges.',
  'grafo-dirigido': 'Its edges have a direction, from a source toward a destination.', dfs: 'Explores as deeply as possible before backtracking.',
  bfs: 'Explores a graph level by level using a queue.', dijkstra: 'Finds the shortest path between two points on a map with obstacles.',
  'a-star': 'Searches a map using the travelled cost g and the estimated remaining distance h.', fibonacci: 'Each term is the sum of the two previous terms.',
  factorial: 'Multiplies all positive integers up to n.', hanoi: 'Moves disks among three towers while preserving their size order.',
  'merge-sort': 'Divides the array, sorts each half, and merges them.', 'quick-sort': 'Partitions around a pivot and sorts each side.',
  'n-reinas': 'Places N queens so that none share a row, column, or diagonal, undoing choices that cause conflicts.',
  laberinto: 'Recursively explores paths and backtracks when it reaches a wall or dead end.', sudoku: 'Completes a 9×9 board by trying valid numbers and undoing choices that block the solution.',
  matriz: 'Organizes values in a dense grid of rows and columns. Each cell is identified by two indices.',
  'matriz-dispersa': 'Stores only non-zero cells using inverted circular lists: AROW moves right-to-left and ACOL bottom-to-top.',
};

const complexityReplacements = [
  ['Acceso','Access'],['Búsqueda','Search'],['Buscar','Search'],['Insertar','Insert'],['Eliminar','Delete'],['Recorridos','Traversals'],
  ['Recorrido','Traversal'],['Tiempo','Time'],['Espacio','Space'],['Promedio','Average'],['Peor','Worst'],['Máximo','Maximum'],
  ['Mínimo','Minimum'],['Construcción','Build'],['Consulta','Query'],['actualización','update'],['Casi','Nearly'],['Depende de distribución','Depends on distribution'],
  ['Exponencial','Exponential'],['recursivo','recursive'],['memoizado','memoized'],['amortizado','amortized'],['Operaciones','Operations'],['Insertar / eliminar','Insert / delete'],
];

export function translateComplexity(value, language) {
  if (language !== 'en') return value;
  return complexityReplacements.reduce((text, [from, to]) => text.replaceAll(from, to), value);
}

const operationLabels = {
  Valor:'Value','Índice':'Index','Prioridad':'Priority',Palabra:'Word','Clave':'Key',Bloque:'Block','Expresión':'Expression',
  'Origen / vértice':'Source / vertex',Destino:'Destination',Peso:'Weight','Número n':'Number n','Cantidad de discos':'Number of disks',Tamaño:'Size',
  'Elemento A':'Element A','Elemento B':'Element B',Elemento:'Element',Fila:'Row',Columna:'Column',Coeficiente:'Coefficient',Exponente:'Exponent',
  'Punto / valor':'Point / value','Valor / delta':'Value / delta','Índice / límite':'Index / limit','Código Java simple':'Simple Java code',
  'Lista generalizada':'Generalized list','Agregar inicio':'Add at start','Agregar final':'Add at end','Agregar en índice':'Add at index',
  'Actualizar índice':'Update index','Eliminar inicio':'Remove start','Eliminar final':'Remove end','Eliminar índice':'Remove at index',
  Vaciar:'Clear','Ver frente':'View front','Agregar frente':'Add front','Quitar frente':'Remove front','Quitar final':'Remove end',
  'Insertar inicio':'Insert at start','Insertar final':'Insert at end','Insertar en índice':'Insert at index','Eliminar valor':'Remove value',Buscar:'Search',
  Insertar:'Insert',Eliminar:'Delete','Insertar nodo':'Insert node','Eliminar nodo':'Delete node',Preorden:'Preorder',Inorden:'Inorder',Postorden:'Postorder',
  'Inorden sin pila':'Inorder without stack','Insertar punto':'Insert point',Recorrer:'Traverse','Extraer raíz':'Extract root','Ver raíz':'View root',
  'Insertar palabra':'Insert word','Buscar palabra':'Search word','Eliminar palabra':'Delete word','Actualizar índice':'Update index','Suma prefijo':'Prefix sum',
  'Mínimo prefijo':'Prefix minimum',Restablecer:'Reset','Insertar clave':'Insert key','Eliminar clave':'Delete key','Recorrer hojas':'Traverse leaves',
  'Agregar bloque':'Add block','Quitar bloque':'Remove block','Calcular raíz':'Calculate root',Construir:'Build',Evaluar:'Evaluate',Prefija:'Prefix',Postfija:'Postfix',
  'Construir AST':'Build AST','Recorrer preorden':'Preorder traversal',Guardar:'Save','Buscar clave':'Search key','Agregar vértice':'Add vertex',
  'Eliminar vértice':'Remove vertex','Agregar arista':'Add edge','Eliminar arista':'Remove edge','Recorrer BFS':'Run BFS','Recorrer DFS':'Run DFS',
  'Buscar ruta':'Find path',Agregar:'Add',Mezclar:'Shuffle',Ordenar:'Sort',Calcular:'Calculate','Crear torres':'Create towers',Resolver:'Solve',
  'Ejecutar paso a paso':'Run step by step','Resolver recursivamente':'Solve recursively','Siguiente paso':'Next step','Resolver 9×9':'Solve 9×9',
  Unir:'Union','Encontrar raíz':'Find root',Comprobar:'Check','Limpiar bits':'Clear bits','Insertar / actualizar':'Insert / update',
  'Buscar posición':'Find position','Eliminar posición':'Delete position','Recorrer fila':'Traverse row','Recorrer columna':'Traverse column',
  'Vaciar matriz':'Clear matrix','Guardar valor':'Save value','Consultar celda':'Read cell',Transponer:'Transpose',Rellenar:'Fill',Limpiar:'Clear',
  'Insertar / agrupar en A':'Insert / combine in A','Insertar / agrupar en B':'Insert / combine in B','Eliminar de A':'Delete from A','Eliminar de B':'Delete from B',
  'Sumar A + B':'Add A + B','Limpiar C':'Clear C','Construir lista':'Build list','Obtener Head':'Get Head','Obtener Tail':'Get Tail',
  'Calcular longitud':'Calculate length','Calcular profundidad':'Calculate depth','Compartir raíz':'Share root','Liberar referencia':'Release reference',
  'Ejecutar DFS':'Run DFS','Ejecutar BFS':'Run BFS','Ejecutar Prim':'Run Prim','Ejecutar Kruskal':'Run Kruskal','Ejecutar Dijkstra':'Run Dijkstra','Ejecutar A*':'Run A*',
};

export function translateOperationLabel(value, language) {
  return language === 'en' ? (operationLabels[value] ?? value) : value;
}

const exactLearningText = {
  'Estructura vacía': 'Empty structure',
  'Árbol vacío': 'Empty tree',
  'Grafo vacío': 'Empty graph',
  'Lista generalizada sin referencias': 'Generalized list with no references',
  'Usa los controles para modificar la estructura y observar el resultado.': 'Use the controls to modify the structure and observe the result.',
  'Estructura restablecida a su estado inicial.': 'The structure was reset to its initial state.',
  'Predice el resultado antes de comprobarlo con la animación.': 'Predict the result before checking it with the animation.',
  'Se prepara el estado inicial y la estructura auxiliar.': 'The initial state and the auxiliary structure are prepared.',
  'El algoritmo completa la operación y devuelve el resultado.': 'The algorithm completes the operation and returns the result.',
  'Listo para comenzar': 'Ready to begin',
  'Simulación en vivo': 'Live simulation',
  'Ruta óptima': 'Optimal route',
  'FIN indica el último nodo de una palabra': 'END marks the last node of a word',
  'PREFIJOS COMPARTIDOS': 'SHARED PREFIXES',
  'DATOS SOLO EN HOJAS': 'DATA ONLY IN LEAVES',
  'OCUPACIÓN MÍNIMA 2/3': 'MINIMUM OCCUPANCY 2/3',
  'NODOS MULTICLAVE': 'MULTI-KEY NODES',
  'BST DOBLEMENTE ENHEBRADO': 'DOUBLE-THREADED BST',
  'MÁXIMO N HIJOS': 'AT MOST N CHILDREN',
  'CANTIDAD LIBRE DE HIJOS': 'UNRESTRICTED NUMBER OF CHILDREN',
  'BOSQUE DE ÁRBOLES': 'FOREST OF TREES',
  '8 OCTANTES · ESPACIO 3D': '8 OCTANTS · 3D SPACE',
  '4 CUADRANTES · ESPACIO 2D': '4 QUADRANTS · 2D SPACE',
  'BIT · CADA ÍNDICE GUARDA UN RANGO': 'BIT · EACH INDEX STORES A RANGE',
};

const learningReplacements = [
  ['Observa el diagrama. ¿Qué tema representa mejor esta organización?', 'Look at the diagram. Which topic best represents this organization?'],
  ['¿Cuál es la idea central de', 'What is the central idea of'], ['Durante cualquier operación válida de', 'During any valid operation of'],
  ['¿qué propiedad debe conservarse?', 'which property must be preserved?'], ['¿Qué estructura o algoritmo elegirías para', 'Which data structure or algorithm would you choose to'],
  ['¿Qué analogía ayuda a comprender', 'Which analogy helps explain'], ['¿Qué estructura o algoritmo coincide con esta definición?', 'Which data structure or algorithm matches this definition?'],
  ['¿Qué complejidad o conjunto de conceptos corresponde a', 'Which complexity or set of concepts belongs to'], ['¿Qué paso de pseudocódigo es coherente con', 'Which pseudocode step is consistent with'],
  ['¿Qué concepto es necesario para comprender', 'Which concept is necessary to understand'], ['¿Cuál afirmación NO describe correctamente a', 'Which statement does NOT correctly describe'],
  ['¿Qué propiedad diferencia a', 'Which property distinguishes'], ['¿Qué consecuencia tiene romper la propiedad', 'What happens if the property is broken'],
  ['¿Qué operación es válida para', 'Which operation is valid for'], ['¿Cuál es otra operación propia de', 'Which is another operation provided by'],
  ['¿Qué operación NO es característica de', 'Which operation is NOT characteristic of'], ['La propiedad esencial es que', 'The essential property is that'],
  ['está diseñado para', 'is designed to'], ['Puede imaginarse como', 'It can be imagined as'], ['La definición corresponde a', 'The definition belongs to'],
  ['la respuesta correcta es', 'the correct answer is'], ['Un paso propio del procedimiento es', 'A step in this procedure is'],
  ['Uno de sus conceptos fundamentales es', 'One of its fundamental concepts is'], ['corresponde a', 'belongs to'], ['no a', 'not to'],
  ['se distingue porque', 'is distinguished because'], ['dejaría de garantizar su comportamiento correcto hasta restaurar esa propiedad', 'would stop guaranteeing correct behavior until that property is restored'],
  ['La estructura o el algoritmo deja de garantizar su comportamiento correcto', 'The data structure or algorithm no longer guarantees correct behavior'],
  ['La complejidad se vuelve siempre O(1)', 'The complexity always becomes O(1)'], ['Los datos se ordenan automáticamente', 'The data is sorted automatically'], ['No ocurre ningún cambio lógico', 'No logical change occurs'],
  ['forma parte de las operaciones definidas para', 'is one of the operations defined for'], ['también corresponde a', 'also belongs to'], ['pertenece a otra estructura o algoritmo', 'belongs to another data structure or algorithm'],
  ['Se cambió de pestaña o se ocultó DSA Lab.', 'The tab changed or DSA Lab was hidden.'], ['La ventana de DSA Lab perdió el foco.', 'The DSA Lab window lost focus.'],
  ['Se intentó cambiar de sección durante la prueba.', 'A section change was attempted during the test.'], ['Se utilizó la navegación del navegador durante la prueba.', 'Browser navigation was used during the test.'],
  ['Se cerró o recargó la página durante la prueba.', 'The page was closed or reloaded during the test.'],
  ['Si eliminamos el elemento del inicio', 'If we remove the first element'], ['¿qué valor quedará en el índice 0?', 'which value will remain at index 0?'],
  ['El arreglo tiene', 'The array has'], ['elementos. Si agregamos', 'elements. If we add'], ['al final, ¿en qué índice quedará?', 'at the end, at which index will it be placed?'],
  ['Los índices empiezan en 0.', 'Indices start at 0.'], ['Si ejecutamos Pop', 'If we run Pop'], ['¿cuál será el nuevo tope después de retirar', 'what will the new top be after removing'],
  ['Una pila sigue la regla LIFO', 'A stack follows the LIFO rule'], ['Si hacemos Push', 'If we run Push'], ['¿qué valor quedará en el tope de la pila?', 'which value will be at the top of the stack?'],
  ['Si ejecutamos Dequeue y sale', 'If we run Dequeue and remove'], ['¿qué valor se convertirá en el nuevo front?', 'which value will become the new front?'],
  ['Una cola sigue la regla FIFO', 'A queue follows the FIFO rule'], ['Si hacemos Enqueue', 'If we run Enqueue'], ['¿qué valor quedará señalado por rear?', 'which value will rear point to?'],
  ['¿cuántos nodos se compararán antes de encontrarlo?', 'how many nodes will be compared before finding it?'], ['¿Dónde se insertará', 'Where will'],
  ['al seguir las comparaciones del Binary Search Tree?', 'be inserted after following the Binary Search Tree comparisons?'], ['¿Cuál será la nueva raíz?', 'What will the new root be?'],
  ['Después de insertar', 'After inserting'], ['¿qué factor de balance tendrá la raíz', 'what balance factor will root'], ['más alto a la izquierda', 'higher on the left'],
  ['más alto a la derecha', 'higher on the right'], ['alturas iguales', 'equal heights'],
  ['¿Qué ocurre aquí?', 'What happens here?'], ['Java básico', 'Basic Java'],
  ['El ciclo está en la iteración', 'The loop is at iteration'], ['La línea iluminada y el elemento activo avanzan juntos.', 'The highlighted line and the active element advance together.'],
  ['Se procesa el elemento activo del paso', 'The active element at step'], ['y se actualiza el estado.', 'is processed and the state is updated.'],
  ['Se generó un mapa nuevo para', 'A new map was generated for'], ['Los puntos cambiaron de ubicación.', 'The points changed location.'],
  ['Se generó un nuevo ejemplo para', 'A new example was generated for'],
  ['Operación completada', 'Operation completed'], ['Resultado', 'Result'], ['Error:', 'Error:'],
  ['índice', 'index'], ['Índice', 'Index'], ['fila', 'row'], ['Fila', 'Row'], ['columna', 'column'], ['Columna', 'Column'],
  ['posición', 'position'], ['Posición', 'Position'], ['elemento', 'element'], ['Elemento', 'Element'], ['tamaño', 'size'], ['Tamaño', 'Size'],
  ['raíz', 'root'], ['Raíz', 'Root'], ['nodo', 'node'], ['Nodo', 'Node'], ['árbol', 'tree'], ['Árbol', 'Tree'],
  ['izquierda', 'left'], ['derecha', 'right'], ['vacío', 'empty'], ['vacía', 'empty'], ['verdadero', 'true'], ['falso', 'false'],
  ['agrega', 'adds'], ['Agregar', 'Add'], ['insertar', 'insert'], ['Insertar', 'Insert'], ['eliminar', 'delete'], ['Eliminar', 'Delete'],
  ['buscar', 'search'], ['Buscar', 'Search'], ['recorrer', 'traverse'], ['Recorrer', 'Traverse'], ['comienza', 'starts'], ['termina', 'ends'],
  ['visitado', 'visited'], ['visitada', 'visited'], ['valor', 'value'], ['Valor', 'Value'], ['datos', 'data'], ['estructura', 'structure'],
  ['operación', 'operation'], ['Operación', 'Operation'], ['propiedad', 'property'], ['concepto', 'concept'], ['comportamiento', 'behavior'],
  ['algoritmo', 'algorithm'], ['pregunta', 'question'], ['respuesta', 'answer'], ['comparaciones', 'comparisons'], ['subárbol', 'subtree'],
  ['alturas', 'heights'], ['altura', 'height'], ['equilibrado', 'balanced'], ['balanceado', 'balanced'], ['primero', 'first'], ['último', 'last'],
  ['estaba', 'was'], ['antes', 'before'], ['después', 'after'], ['queda', 'becomes'], ['salida', 'output'], ['entrada', 'input'],
  ['siguiente', 'next'], ['anterior', 'previous'], ['nuevo', 'new'], ['nueva', 'new'], ['actual', 'current'],
  ['Se crea', 'Creates'], ['Se guarda', 'Stores'], ['Se revisa', 'Checks'], ['Se marca', 'Marks'], ['Se compara', 'Compares'],
  ['retornar', 'return'], ['mientras', 'while'], ['para cada', 'for each'], ['si no', 'if not'], ['si ', 'if '],
];

/** Translates runtime teaching text (operation traces, questions and diagram captions). */
export function translateLearningText(value, language) {
  if (language !== 'en' || typeof value !== 'string') return value;
  if (exactLearningText[value]) return exactLearningText[value];
  return learningReplacements.reduce((text, [from, to]) => text.replaceAll(from, to), value)
    .replaceAll('¿', '').replaceAll('¡', '');
}

const codeReplacements = [
  ['Método auxiliar utilizado arriba', 'Helper method used above'], ['método auxiliar', 'helper method'], ['Clase ', 'Class '],
  ['insertar', 'insert'], ['eliminar', 'delete'], ['buscar', 'search'], ['agregar', 'add'], ['quitar', 'remove'], ['actualizar', 'update'],
  ['recorrer', 'traverse'], ['calcular', 'calculate'], ['resolver', 'solve'], ['evaluar', 'evaluate'], ['construir', 'build'], ['mezclar', 'merge'],
  ['izquierda', 'left'], ['derecha', 'right'], ['siguiente', 'next'], ['anterior', 'previous'], ['cabeza', 'head'], ['raiz', 'root'], ['raíz', 'root'],
  ['valor', 'value'], ['indice', 'index'], ['índice', 'index'], ['fila', 'row'], ['columna', 'column'], ['tamaño', 'size'], ['cantidad', 'count'],
  ['inicio', 'start'], ['final', 'end'], ['objetivo', 'target'], ['resultado', 'result'], ['temporal', 'temporary'], ['actual', 'current'],
  ['nodo', 'node'], ['arreglo', 'array'], ['lista', 'list'], ['palabra', 'word'], ['clave', 'key'], ['altura', 'height'], ['balance', 'balance'],
  ['padre', 'parent'], ['hijo', 'child'], ['hermano', 'sibling'], ['visitado', 'visited'], ['distancia', 'distance'], ['camino', 'path'], ['cola', 'queue'],
  ['verdadero', 'true'], ['falso', 'false'], ['vacío', 'empty'], ['vacía', 'empty'], ['encontrado', 'found'], ['seguro', 'safe'],
  ['retornar', 'return'], ['mientras', 'while'], ['para cada', 'for each'], ['desde', 'from'], ['hasta', 'to'], ['si no', 'else'], ['si ', 'if '],
  ['nuevo', 'new'], ['nueva', 'new'], ['crear', 'create'], ['marcar', 'mark'], ['desmarcar', 'unmark'], ['intercambiar', 'swap'],
];

/** Produces an English teaching-code view without changing line count or execution mapping. */
export function translateCodeText(value, language) {
  if (language !== 'en' || typeof value !== 'string') return value;
  return codeReplacements.reduce((text, [from, to]) => {
    const capitalized = `${from.charAt(0).toUpperCase()}${from.slice(1)}`;
    const translatedCapitalized = `${to.charAt(0).toUpperCase()}${to.slice(1)}`;
    return text.replaceAll(capitalized, translatedCapitalized).replaceAll(from, to);
  }, value);
}

export function localizeAlgorithm(algorithm, language) {
  if (language !== 'en') return algorithm;
  const name = names[algorithm.id] ?? algorithm.name;
  return {
    ...algorithm,
    name,
    navName: names[algorithm.id] ?? algorithm.navName ?? name,
    description: descriptions[algorithm.id] ?? `Learn the ideas, operations, and behavior of ${name} through an interactive step-by-step lesson.`,
    complexity: translateComplexity(algorithm.complexity, language),
  };
}

export function detectInitialLanguage({ storedLanguage, requestedLanguage, browserLanguages = [] } = {}) {
  if (requestedLanguage === 'es' || requestedLanguage === 'en') return requestedLanguage;
  if (storedLanguage === 'es' || storedLanguage === 'en') return storedLanguage;
  const preferredLanguage = browserLanguages.find(Boolean)?.toLowerCase() ?? '';
  return preferredLanguage === 'en' || preferredLanguage.startsWith('en-') ? 'en' : 'es';
}

function initialLanguage() {
  if (typeof window === 'undefined') return 'es';
  let storedLanguage = null;
  try { storedLanguage = window.localStorage.getItem(LANGUAGE_KEY); } catch { /* Use browser language. */ }
  const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
  const language = detectInitialLanguage({
    storedLanguage,
    requestedLanguage,
    browserLanguages: navigator.languages?.length ? navigator.languages : [navigator.language],
  });
  document.documentElement.lang = language;
  return language;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(initialLanguage);
  const setLanguage = next => {
    const safe = next === 'en' ? 'en' : 'es';
    setLanguageState(safe);
    try { window.localStorage.setItem(LANGUAGE_KEY, safe); } catch { /* Continue without persistence. */ }
  };
  const value = useMemo(() => ({ language, setLanguage, t: key => ui[language][key] ?? ui.es[key] ?? key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
