const item = (id, name, category, type, complexity, description, code, values) => ({
  id, name, category, type, complexity, description, code, values,
});

export const algorithms = [
  item('array','Array','Estructuras lineales','array','Acceso O(1) · Búsqueda O(n)','Colección contigua indexada. Ofrece acceso directo y es la base de muchas otras estructuras.',`buscar(A, objetivo):\n  para i ← 0 hasta longitud(A)-1\n    si A[i] = objetivo: retornar i\n  retornar -1`,[12,7,19,4,15,9]),
  item('pila','Pila (Stack)','Estructuras lineales','stack','Push / Pop O(1)','Estructura LIFO: el último elemento en entrar es el primero en salir.',`push(x): datos.agregar(x)\npop():\n  si vacía: error\n  retornar datos.eliminarÚltimo()`,[10,25,8,16]),
  item('cola','Cola (Queue)','Estructuras lineales','queue','Enqueue / Dequeue O(1)','Estructura FIFO: atiende los elementos en el mismo orden en que llegaron.',`enqueue(x): cola.agregarFinal(x)\ndequeue():\n  si vacía: error\n  retornar cola.eliminarInicio()`,[14,6,21,3,11]),
  item('deque','Deque','Estructuras lineales','queue','Insertar / eliminar O(1)','Cola de doble extremo que permite operar eficientemente por ambos lados.',`pushFront(x)\npushBack(x)\npopFront()\npopBack()`,[5,12,18,27,31]),
  item('lista-simple','Lista simple','Estructuras lineales','linked','Insertar al inicio O(1) · Buscar O(n)','Nodos enlazados en una dirección; cada nodo apunta al siguiente.',`insertarInicio(x):\n  nuevo.siguiente ← cabeza\n  cabeza ← nuevo`,[8,13,21,34]),
  item('lista-doble','Lista doble','Estructuras lineales','linked','Insertar / eliminar conocido O(1)','Cada nodo enlaza al anterior y al siguiente para recorrer en ambas direcciones.',`insertarDespués(nodo, x):\n  nuevo.prev ← nodo\n  nuevo.next ← nodo.next\n  nodo.next ← nuevo`,[4,9,15,22]),
  item('lista-circular-simple','Lista circular simple','Estructuras lineales','circular','Insertar O(1) · Buscar O(n)','La cola apunta de vuelta a la cabeza, formando un ciclo sin puntero nulo final.',`recorrer(cabeza):\n  actual ← cabeza\n  repetir visitar(actual)\n    actual ← actual.next\n  hasta actual = cabeza`,[3,7,11,18]),
  item('lista-circular-doble','Lista circular doble','Estructuras lineales','circular','Insertar / eliminar O(1)','Lista bidireccional donde cabeza y cola también están conectadas.',`nuevo.prev ← cola\nnuevo.next ← cabeza\ncola.next ← nuevo\ncabeza.prev ← nuevo`,[2,6,10,14]),
  item('skip-list','Skip List','Estructuras lineales','skip','Promedio O(log n) · Peor O(n)','Capas de listas enlazadas que permiten saltar sobre grupos de elementos.',`buscar(x):\n  para nivel desde máximo hasta 0\n    mientras next.valor < x: avanzar\n  retornar next.valor = x`,[2,7,12,19,26,33]),

  item('arbol-general','Árbol general','Árboles','tree','Recorridos O(n)','Jerarquía flexible donde cada nodo puede almacenar cualquier cantidad de hijos.',`DFS(nodo):\n  visitar(nodo)\n  para cada hijo de nodo\n    DFS(hijo)`,[8,3,12,1,5,10,15]),
  item('arbol-nario','Árbol N-ario','Árboles','tree','Recorridos O(n)','Árbol donde cada nodo admite como máximo N hijos.',`recorrer(nodo):\n  si nodo = null: retornar\n  visitar(nodo)\n  para i ← 0 hasta N-1\n    recorrer(nodo.hijo[i])`,[1,2,3,4,5,6,7]),
  item('arbol-binario','Árbol binario','Árboles','tree','Recorridos O(n)','Cada nodo tiene como máximo un hijo izquierdo y uno derecho.',`inorden(nodo):\n  si nodo = null: retornar\n  inorden(nodo.izq)\n  visitar(nodo)\n  inorden(nodo.der)`,[8,3,12,1,5,10,15]),
  item('bst','Binary Search Tree','Árboles','tree','Promedio O(log n) · Peor O(n)','Mantiene menores a la izquierda y mayores a la derecha.',`buscar(nodo, x):\n  si nodo = null o nodo.valor = x: retornar nodo\n  si x < nodo.valor: buscar(nodo.izq, x)\n  si no: buscar(nodo.der, x)`,[8,3,12,1,5,10,15]),
  item('avl','Árbol AVL','Árboles','tree','Buscar / insertar / eliminar O(log n)','BST auto-balanceado cuya diferencia de alturas nunca supera uno.',`insertar(nodo, x)\nactualizarAltura(nodo)\nbalance ← altura(izq)-altura(der)\nsi |balance| > 1: rotar`,[30,20,40,10,25,35,50]),
  item('rojo-negro','Árbol Rojo-Negro','Árboles','tree','Operaciones O(log n)','BST balanceado mediante reglas de color y rotaciones.',`insertar(x) como ROJO\nmientras padre es ROJO\n  recolorear o rotar\nraíz.color ← NEGRO`,[11,5,18,3,8,15,22]),
  item('splay-tree','Splay Tree','Árboles','tree','Amortizado O(log n)','Mueve el nodo accedido a la raíz mediante rotaciones.',`splay(x):\n  mientras x no sea raíz\n    aplicar zig, zig-zig o zig-zag\n  retornar x`,[10,5,16,3,7,13,19]),
  item('heap','Heap binario','Árboles','heap','Insertar / extraer O(log n) · Máximo O(1)','Árbol completo que mantiene el mayor elemento en la raíz.',`extraerMax():\n  max ← A[0]\n  A[0] ← A.último\n  heapify(0)\n  retornar max`,[42,29,31,14,18,7,11]),
  item('fibonacci-heap','Fibonacci Heap','Árboles','heap','Insertar O(1) · Extraer mín. O(log n) amort.','Colección de árboles con consolidación diferida, útil en algoritmos de grafos.',`insertar(x): agregar x a lista de raíces\nextraerMin():\n  promover sus hijos\n  consolidar raíces del mismo grado`,[3,7,18,24,31,39]),
  item('trie','Prefix Tree','Árboles','trie','Operaciones O(L)','Árbol de prefijos: cada ruta representa una palabra.',`buscar(palabra):\n  nodo ← raíz\n  para cada carácter c\n    si no existe hijo[c]: falso\n    nodo ← hijo[c]\n  retornar nodo.esFinal`,['CASA','CASAR','CARO','CAROL']),
  item('suffix-tree','Suffix Tree','Árboles','trie','Buscar patrón O(m)','Trie comprimido que contiene todos los sufijos de un texto.',`construir(texto):\n  para i ← 0 hasta n-1\n    insertar(texto[i..n])`,['B','A','N','A','N','A']),
  item('segment-tree','Segment Tree','Árboles','tree','Consulta / actualización O(log n)','Árbol para consultas de rango asociativas como suma, mínimo o máximo.',`consulta(nodo, l, r):\n  si cubierto: retornar nodo.suma\n  si disjunto: retornar 0\n  retornar consulta(izq)+consulta(der)`,[2,5,1,7,3,9,4]),
  item('fenwick-tree','Fenwick Tree','Árboles','array','Consulta / actualización O(log n)','Árbol binario indexado compacto para sumas de prefijos.',`suma(i):\n  total ← 0\n  mientras i > 0\n    total += BIT[i]\n    i -= i & -i`,[3,2,5,1,7,4,6,2]),
  item('btree','B-Tree','Árboles','btree','Operaciones O(log n)','Árbol de búsqueda multi-camino optimizado para almacenamiento en bloques.',`insertar(clave):\n  descender a hoja\n  insertar ordenada\n  si nodo lleno: dividir y promover mediana`,[4,9,13,18,24,30]),
  item('bplus-tree','B+ Tree','Árboles','btree','Operaciones O(log n)','Índice multi-camino cuyos datos viven en hojas enlazadas.',`buscar(clave):\n  descender por separadores\n  localizar en hoja\nrecorrerRango(): seguir hojas`,[3,8,12,17,21,27,32]),
  item('bstar-tree','B* Tree','Árboles','btree','Operaciones O(log n)','Variante de B-Tree con mayor ocupación gracias a redistribución entre hermanos.',`si nodo lleno:\n  redistribuir con hermano\n  si ambos llenos:\n    dividir 2 nodos en 3`,[5,10,15,20,25,30]),
  item('merkle-tree','Merkle Tree','Árboles','tree','Construcción O(n) · Prueba O(log n)','Árbol de hashes que permite verificar integridad eficientemente.',`nivel ← hash(datos)\nmientras tamaño(nivel) > 1\n  combinar pares y aplicar hash\nretornar nivel[0]`,['A1','B7','C3','D9','E4','F2','G8']),
  item('kd-tree','KD-Tree','Árboles','tree','Promedio O(log n)','Particiona puntos alternando ejes para búsquedas espaciales.',`insertar(punto, profundidad):\n  eje ← profundidad mod k\n  comparar por eje\n  descender izquierda o derecha`,[8,3,12,2,6,10,14]),
  item('quadtree','QuadTree','Árboles','tree','Depende de distribución','Divide recursivamente un plano en cuatro cuadrantes.',`insertar(punto):\n  si capacidad disponible: guardar\n  si no: subdividir en 4\n  insertar en cuadrante correspondiente`,[1,2,3,4,5,6,7]),
  item('octree','Octree','Árboles','tree','Depende de distribución','Extiende el QuadTree a 3D dividiendo el espacio en ocho octantes.',`subdividir(cubo):\n  crear 8 octantes\n  distribuir puntos\n  repetir si se supera capacidad`,[8,1,2,3,4,5,6,7]),
  item('expression-tree','Árbol de expresión','Árboles','tree','Construcción / evaluación O(n)','Representa operadores como nodos internos y operandos como hojas.',`evaluar(nodo):\n  si operando: retornar valor\n  a ← evaluar(izq)\n  b ← evaluar(der)\n  retornar aplicar(nodo.op, a, b)`,['+','×','−','8','3','7','2']),

  item('hash-table','Hash Table','Hashing','hash','Promedio O(1) · Peor O(n)','Mapea claves a posiciones de un arreglo mediante una función hash.',`insertar(clave, valor):\n  i ← hash(clave) mod capacidad\n  tabla[i] ← (clave, valor)`,['ana','sol','luz','mar','leo']),
  item('hash-open','Open Addressing','Hashing','hash','Promedio O(1) · Peor O(n)','Resuelve colisiones buscando otra celda dentro de la misma tabla.',`i ← hash(clave)\nmientras tabla[i] ocupada\n  i ← (i + 1) mod capacidad\ntabla[i] ← clave`,[18,29,40,13,24]),
  item('hash-chaining','Separate Chaining','Hashing','hash','Promedio O(1) · Peor O(n)','Cada posición mantiene una lista de claves que colisionaron.',`i ← hash(clave) mod capacidad\ntabla[i].agregar((clave, valor))`,[12,22,32,15,25,8]),

  item('grafo','Grafo','Grafos','graph','Recorrido O(V + E)','Conjunto de vértices conectados por aristas no dirigidas.',`agregarArista(u, v):\n  ady[u].agregar(v)\n  ady[v].agregar(u)`,['A','B','C','D','E','F']),
  item('grafo-dirigido','Grafo dirigido','Grafos','digraph','Recorrido O(V + E)','Las aristas tienen orientación: de un origen hacia un destino.',`agregarArista(u, v):\n  ady[u].agregar(v)`,['A','B','C','D','E','F']),
  item('dfs','DFS','Grafos','graph','O(V + E)','Explora tan profundo como sea posible antes de retroceder.',`DFS(v):\n  marcar v\n  para cada vecino u de v\n    si no visitado: DFS(u)`,['A','B','C','D','E','F']),
  item('bfs','BFS','Grafos','graph','O(V + E)','Explora el grafo por niveles utilizando una cola.',`encolar(origen)\nmientras cola no vacía\n  v ← desencolar()\n  para cada vecino no visitado\n    marcar y encolar`,['A','B','C','D','E','F']),
  item('dijkstra','Dijkstra','Grafos','weighted','O((R · C)²)','Encuentra el camino más corto entre dos puntos de un mapa con obstáculos.',`distancia[inicio] ← 0\nmientras queden casillas por revisar\n  actual ← casilla con menor distancia\n  para cada vecina de actual\n    si es transitable: intentar mejorar distancia\nreconstruir ruta desde la meta`,['A','B','C','D','E','F']),
  item('a-star','A* (A-Star)','Grafos','weighted','O((R · C)²)','Busca una ruta en un mapa usando el costo recorrido g y la cercanía estimada h.',`abiertas ← {inicio}\ng[inicio] ← 0\nmientras abiertas no esté vacío\n  actual ← casilla con menor f = g + h\n  si actual = meta: reconstruir ruta\n  revisar las cuatro casillas vecinas`,['A','B','C','D','E','F']),
  item('prim','Prim','Grafos','weighted','O(E log V)','Construye un árbol de expansión mínima creciendo desde un vértice.',`iniciar en origen\nmientras falten vértices\n  elegir arista mínima que cruce el corte\n  agregar vértice y arista`,['A','B','C','D','E','F']),
  item('kruskal','Kruskal','Grafos','weighted','O(E log E)','Construye un árbol de expansión mínima eligiendo aristas sin formar ciclos.',`ordenar aristas por peso\npara cada arista (u,v)\n  si find(u) ≠ find(v)\n    agregar y unir(u,v)`,['A','B','C','D','E','F']),

  item('fibonacci','Fibonacci','Recursión','recursion','O(2ⁿ) recursivo · O(n) memoizado','Cada término es la suma de los dos anteriores.',`fib(n):\n  si n ≤ 1: retornar n\n  retornar fib(n-1) + fib(n-2)`,[0,1,1,2,3,5,8,13]),
  item('factorial','Factorial','Recursión','recursion','Tiempo O(n) · Espacio O(n)','Multiplica todos los enteros positivos hasta n.',`factorial(n):\n  si n ≤ 1: retornar 1\n  retornar n × factorial(n-1)`,[1,2,6,24,120,720]),
  item('hanoi','Torres de Hanoi','Recursión','hanoi','O(2ⁿ)','Mueve discos entre tres torres respetando el orden de tamaños.',`hanoi(n, origen, destino, auxiliar):\n  hanoi(n-1, origen, auxiliar, destino)\n  mover n a destino\n  hanoi(n-1, auxiliar, destino, origen)`,[5,4,3,2,1]),
  item('merge-sort','Merge Sort','Recursión','sort','Tiempo O(n log n) · Espacio O(n)','Divide el arreglo, ordena cada mitad y las combina.',`mergeSort(A):\n  dividir A en izquierda y derecha\n  mergeSort(izquierda)\n  mergeSort(derecha)\n  mezclar ambas`,[38,12,27,5,19,44,8]),
  item('quick-sort','Quick Sort','Recursión','sort','Promedio O(n log n) · Peor O(n²)','Particiona alrededor de un pivote y ordena cada lado.',`quickSort(A):\n  pivote ← elegir(A)\n  menores, iguales, mayores ← particionar\n  retornar quickSort(menores)+iguales+quickSort(mayores)`,[33,10,55,21,4,47,18]),

  item('n-reinas','N-Reinas','Backtracking','queens','O(n!)','Ubica N reinas sin que compartan fila, columna o diagonal, retirando cada reina que conduce a un conflicto.',`resolver(fila):\n  si fila = N: éxito\n  para cada columna\n    si la posición es segura:\n      colocar reina\n      si resolver(fila + 1): éxito\n      retirar reina  // backtracking\n  retornar falso`,[-1,-1,-1,-1]),
  item('laberinto','Laberinto','Backtracking','maze','O(4^(n·m))','Explora caminos recursivamente; cuando encuentra un muro o callejón sin salida, deshace la ruta y prueba otra dirección.',`resolver(fila, columna):\n  si es la salida: éxito\n  si es muro o ya fue visitada: falso\n  marcar celda como parte del camino\n  si resolver(derecha): éxito\n  si resolver(abajo): éxito\n  si resolver(izquierda): éxito\n  si resolver(arriba): éxito\n  desmarcar celda  // backtracking\n  retornar falso`,[
    0,0,1,0,0,0,
    1,0,1,1,1,0,
    0,0,0,0,1,0,
    0,1,0,1,1,0,
    0,1,0,0,0,0,
    1,0,0,1,0,0,
  ]),
  item('sudoku','Sudoku Solver 9×9','Backtracking','sudoku','Exponencial O(9^m)','Completa un tablero 9×9 probando números válidos y deshaciendo cada decisión que bloquea la solución.',`resolver(fila, columna):\n  si fila = 9: éxito\n  si la celda tiene pista: resolver(siguiente)\n  para número desde 1 hasta 9\n    si es válido:\n      colocar número\n      si resolver(siguiente): éxito\n      borrar número  // backtracking\n  retornar falso`,[
    5,3,0,0,7,0,0,0,0,
    6,0,0,1,9,5,0,0,0,
    0,9,8,0,0,0,0,6,0,
    8,0,0,0,6,0,0,0,3,
    4,0,0,8,0,3,0,0,1,
    7,0,0,0,2,0,0,0,6,
    0,6,0,0,0,0,2,8,0,
    0,0,0,4,1,9,0,0,5,
    0,0,0,0,8,0,0,7,9,
  ]),

  item('union-find','Union-Find','Otros','union','Casi O(1) amortizado','Mantiene componentes disjuntos con compresión de caminos y unión por rango.',`find(x):\n  si padre[x] ≠ x: padre[x] ← find(padre[x])\n  retornar padre[x]\nunion(a,b): enlazar raíces`,[0,0,2,2,4,4,6,6]),
  item('lru-cache','LRU Cache','Otros','cache','Get / Put O(1)','Descarta el elemento menos usado recientemente combinando hash y lista doble.',`get(clave):\n  si existe: mover al frente\nput(clave, valor):\n  insertar al frente\n  si excede capacidad: quitar cola`,['A','D','B','F','C']),
  item('bloom-filter','Bloom Filter','Otros','bloom','Insertar / consultar O(k)','Filtro probabilístico compacto: puede dar falsos positivos, nunca falsos negativos.',`insertar(x):\n  para cada hash hᵢ\n    bits[hᵢ(x)] ← 1\ncontiene(x): comprobar todos esos bits`,[1,0,1,1,0,1,0,0,1,1,0,1]),
];

export const categories = [...new Set(algorithms.map((algorithm) => algorithm.category))];

export const categoryLabels = {
  'Estructuras lineales': 'Fundamentos secuenciales',
  'Árboles': 'Jerarquías y búsqueda',
  Hashing: 'Acceso por clave',
  Grafos: 'Redes y caminos',
  Recursión: 'Divide y conquista',
  Backtracking: 'Exploración de soluciones',
  Otros: 'Estructuras especializadas',
};
