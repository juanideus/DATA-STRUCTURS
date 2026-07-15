const split = value => value.split('|');

const guide = (definition, how, operations, strengths, limits, uses, example, tip) => ({
  definition,
  how,
  operations: split(operations),
  strengths: split(strengths),
  limits: split(limits),
  uses: split(uses),
  example,
  tip,
});

export const educationalDescriptions = {
  array: guide(
    'Un Array es una colección de elementos del mismo tipo almacenados en posiciones consecutivas. Cada posición tiene un índice y, en Java, el primer índice siempre es 0.',
    'Java reserva un bloque continuo de memoria y calcula la dirección de cada elemento usando su índice. Por eso leer o actualizar una posición conocida es inmediato. Su tamaño se fija al crearlo; insertar en medio exige desplazar los elementos siguientes.',
    'Acceder o actualizar mediante array[indice]|Recorrer desde el índice 0 hasta length - 1|Buscar un valor comparando cada elemento|Insertar o eliminar desplazando posiciones',
    'Acceso directo muy rápido|Orden claro y predecible|Bajo consumo adicional de memoria|Base de matrices, listas y muchas otras estructuras',
    'Tamaño fijo en los Arrays tradicionales de Java|Insertar al inicio o en medio puede ser lento|No verifica automáticamente si un índice es válido|Buscar sin conocer la posición requiere recorrerlo',
    'Notas de un curso|Temperaturas de una semana|Tableros y matrices|Implementación de pilas, colas y tablas hash',
    'Imagina una fila de casilleros numerados: para abrir uno sólo necesitas conocer su número.',
    'Si el tamaño es n, los índices válidos van de 0 a n - 1. Un Array de tamaño 5 termina en el índice 4.'
  ),
  pila: guide(
    'Una Pila o Stack almacena elementos siguiendo la regla LIFO: el último elemento que entra es el primero que sale.',
    'Todas las operaciones principales ocurren en un único extremo llamado tope. Push coloca un elemento sobre el tope y pop retira precisamente ese elemento, sin acceder primero a los que están debajo.',
    'push agrega un elemento al tope|pop retira y devuelve el elemento superior|peek consulta el tope sin eliminarlo|isEmpty comprueba si quedan elementos',
    'Push y pop son muy rápidos|Modelo sencillo de comprender|Ideal para deshacer pasos|Encaja naturalmente con la recursividad',
    'Sólo permite trabajar directamente con el tope|Buscar un elemento requiere revisar la pila|Un pop sobre una pila vacía produce underflow|Puede crecer demasiado si no se controla',
    'Historial de deshacer|Pila de llamadas de Java|Evaluación de expresiones|Navegación atrás en aplicaciones',
    'Una pila de platos: se agrega y se quita siempre el plato que está arriba.',
    'Antes de ejecutar pop o peek, verifica que la pila no esté vacía.'
  ),
  cola: guide(
    'Una Cola o Queue procesa elementos con la regla FIFO: el primero en entrar es el primero en salir.',
    'Los nuevos elementos se agregan al final y se atienden desde el frente. Una implementación eficiente conserva referencias o índices para ambos extremos y evita desplazar todos los datos.',
    'enqueue agrega al final|dequeue retira desde el frente|front o peek consulta el primero|isEmpty comprueba si la cola está vacía',
    'Respeta el orden de llegada|Inserción y extracción rápidas|Útil para procesar tareas justamente|Es la base del recorrido BFS',
    'No ofrece acceso directo a elementos intermedios|Una implementación con Array puede necesitar una cola circular|Puede llenarse si llegan tareas más rápido de lo que salen|Hay que controlar el dequeue de una cola vacía',
    'Filas de impresión|Sistemas de turnos|Mensajes pendientes|Recorrido de grafos por niveles',
    'Como una fila en una caja: quien llega primero es atendido primero.',
    'No elimines desplazando todo el Array; usa índices de frente y final o una lista enlazada.'
  ),
  deque: guide(
    'Un Deque es una cola de doble extremo. Permite insertar y eliminar tanto por el frente como por el final.',
    'Combina comportamientos de pila y cola. Si se implementa con un buffer circular o una lista doble, las cuatro operaciones de los extremos pueden realizarse en tiempo constante.',
    'addFirst agrega al frente|addLast agrega al final|removeFirst retira el primero|removeLast retira el último',
    'Muy flexible|Puede funcionar como pila o cola|Operaciones rápidas en ambos extremos|Útil para ventanas deslizantes',
    'No da acceso rápido al centro|Su implementación circular requiere controlar bien los índices|Hay que distinguir claramente frente y final|Consume referencias extra si usa lista doble',
    'Planificación de tareas|Algoritmos de ventana deslizante|Comprobación de palíndromos|Búsquedas bidireccionales',
    'Imagina un vagón con puertas en ambos extremos: puedes subir o bajar por cualquiera de ellas.',
    'En Java, ArrayDeque suele ser preferible a Stack para implementar pilas y colas sin valores null.'
  ),
  'lista-simple': guide(
    'Una Lista Simple está formada por nodos. Cada nodo guarda un valor y una referencia al nodo siguiente.',
    'La lista comienza en cabeza y termina cuando next es null. Los nodos no necesitan ocupar posiciones contiguas; para llegar a una posición hay que avanzar enlace por enlace desde la cabeza.',
    'Insertar al inicio cambiando la cabeza|Insertar al final recorriendo o conservando una cola|Buscar avanzando por next|Eliminar reconectando el nodo anterior con el siguiente',
    'Tamaño dinámico|Insertar al inicio es inmediato|No exige memoria contigua|Sólo reserva memoria para los nodos existentes',
    'Acceso por índice lento|Cada nodo consume memoria para next|No puede recorrerse hacia atrás|Perder una referencia puede desconectar parte de la lista',
    'Listas de reproducción|Cadenas de tareas|Implementación de colas|Representación de colisiones en hashing',
    'Es como una búsqueda del tesoro: cada pista indica dónde está la siguiente.',
    'Al eliminar un nodo, actualiza el enlace anterior antes de perder la referencia al siguiente.'
  ),
  'lista-doble': guide(
    'Una Lista Doble usa nodos con dos referencias: next apunta al siguiente y prev al anterior.',
    'La doble conexión permite recorrer en ambas direcciones. Insertar o eliminar un nodo conocido requiere actualizar hasta cuatro enlaces para que sus vecinos sigan correctamente conectados.',
    'Recorrer hacia adelante con next|Recorrer hacia atrás con prev|Insertar entre dos nodos|Eliminar reconectando anterior y siguiente',
    'Recorrido bidireccional|Eliminación eficiente de un nodo conocido|Acceso sencillo a cabeza y cola|Adecuada para historiales',
    'Usa más memoria que una lista simple|Hay más referencias que mantener|Un enlace mal actualizado rompe la consistencia|Buscar por valor continúa siendo lineal',
    'Botones anterior y siguiente|LRU Cache|Editores y listas de reproducción|Implementación de Deque',
    'Como vagones unidos por delante y por detrás: puedes recorrer el tren en ambos sentidos.',
    'Después de una modificación debe cumplirse que nodo.next.prev y nodo.prev.next regresen al nodo correcto.'
  ),
  'lista-circular-simple': guide(
    'Una Lista Circular Simple es una lista enlazada cuyo último nodo apunta nuevamente a la cabeza en lugar de apuntar a null.',
    'El recorrido forma un ciclo. Para evitar un bucle infinito se conserva el nodo inicial y se detiene cuando el recorrido vuelve a él. Con una referencia a la cola, insertar al inicio o al final es muy eficiente.',
    'Insertar manteniendo cola.next igual a cabeza|Recorrer hasta volver al nodo inicial|Eliminar la cabeza reparando el cierre|Rotar el punto de inicio',
    'No existe un final desconectado|Permite ciclos repetitivos naturales|Inserciones rápidas con referencia a la cola|Todos los nodos pueden alcanzarse desde cualquier punto',
    'Un recorrido sin condición correcta nunca termina|No permite retroceder|La lista vacía y la de un nodo necesitan cuidado especial|Depurar ciclos puede ser más difícil',
    'Turnos rotativos|Planificación Round Robin|Carruseles|Juegos por turnos',
    'Como personas sentadas en círculo: después de la última vuelve a tocar la primera.',
    'Nunca recorras buscando null; termina cuando actual vuelva a ser igual a cabeza.'
  ),
  'lista-circular-doble': guide(
    'Una Lista Circular Doble conecta cada nodo con el anterior y el siguiente, y además une la cabeza con la cola en ambos sentidos.',
    'La cabeza tiene como prev a la cola y la cola tiene como next a la cabeza. Esto permite avanzar, retroceder y rotar indefinidamente sin encontrar null.',
    'Insertar antes o después de cualquier nodo|Eliminar un nodo actualizando cuatro enlaces|Recorrer con next o prev|Mover la cabeza para rotar la lista',
    'Navegación en dos sentidos|Operaciones constantes sobre nodos conocidos|Rotación eficiente|No necesita casos de final durante el recorrido',
    'Mayor consumo de memoria|Más enlaces susceptibles a errores|La condición de término debe estar bien definida|Los casos vacío y de un solo nodo son delicados',
    'Carruseles bidireccionales|Listas multimedia repetitivas|Planificadores circulares|Juegos de mesa digitales',
    'Es una rotonda de doble sentido: puedes seguir girando hacia adelante o hacia atrás.',
    'Comprueba siempre las cuatro relaciones del cierre: cabeza.prev, cola.next y sus enlaces inversos.'
  ),
  'skip-list': guide(
    'Una Skip List mantiene varias capas de listas ordenadas. Las capas superiores contienen atajos que permiten saltar sobre muchos nodos.',
    'La búsqueda empieza en el nivel más alto, avanza mientras no sobrepase la clave y baja cuando ya no puede continuar. La altura de cada nodo suele decidirse aleatoriamente.',
    'Buscar descendiendo por niveles|Insertar en orden y lanzar niveles aleatorios|Eliminar el nodo de todas sus capas|Recorrer la capa inferior completa',
    'Promedio logarítmico sin rotaciones|Implementación más simple que muchos árboles balanceados|Inserciones dinámicas|Buen comportamiento en datos ordenados',
    'El peor caso es lineal|Usa referencias adicionales|Su rendimiento depende de una buena aleatoriedad|No garantiza balance estricto',
    'Índices en memoria|Conjuntos ordenados|Bases de datos y sistemas concurrentes|Alternativa educativa a árboles balanceados',
    'Como una autopista con vías rápidas y salidas hacia calles locales.',
    'La capa 0 siempre contiene todos los elementos y debe permanecer ordenada.'
  ),

  'arbol-general': guide(
    'Un Árbol General representa una jerarquía en la que cada nodo puede tener cualquier cantidad de hijos.',
    'Existe una raíz sin padre. Cada nodo, excepto la raíz, tiene un único padre y puede guardar una colección de hijos. Los recorridos suelen implementarse recursivamente.',
    'Agregar o quitar hijos|Buscar con DFS o BFS|Recorrer en preorden|Calcular altura, profundidad y cantidad de descendientes',
    'Modela jerarquías de forma natural|Tamaño y ramificación flexibles|Permite procesamiento recursivo|Cada subárbol es otro árbol válido',
    'No ofrece búsqueda ordenada por sí mismo|Puede crecer de forma muy desigual|Cada nodo necesita una colección de hijos|Hay que evitar ciclos accidentales',
    'Carpetas y archivos|Organigramas|Árbol DOM de una página|Categorías y menús',
    'Como un árbol genealógico: una persona puede tener varios descendientes organizados por niveles.',
    'Un árbol no debe contener ciclos y todo nodo, salvo la raíz, debe tener un solo padre.'
  ),
  'arbol-nario': guide(
    'Un Árbol N-ario limita a N la cantidad máxima de hijos que puede tener cada nodo.',
    'Cada nodo reserva o administra hasta N posiciones para hijos. Su forma depende del orden de inserción y no implica que los valores estén ordenados.',
    'Insertar en una posición de hijo disponible|Recorrer todos los hijos de cada nodo|Buscar con DFS o BFS|Calcular altura y niveles',
    'Ramificación controlada|Representa decisiones con opciones limitadas|Recorridos fáciles de generalizar|Puede ser más compacto que un árbol binario',
    'Buscar continúa siendo lineal si no existe un orden|Puede desperdiciar posiciones de hijos|La anchura crece rápidamente|N debe elegirse según el problema',
    'Árboles de decisiones|Estados de videojuegos|Sistemas de archivos limitados|Motores de búsqueda por movimientos',
    'Un menú donde cada pantalla puede abrir como máximo N submenús.',
    'N indica el máximo de hijos, no la cantidad de niveles ni el total de nodos.'
  ),
  'arbol-binario': guide(
    'Un Árbol Binario permite como máximo dos hijos por nodo, llamados izquierdo y derecho.',
    'La posición izquierda y derecha tiene significado propio. Puede recorrerse en preorden, inorden, postorden o por niveles; no necesariamente mantiene los valores ordenados.',
    'Insertar según la regla de la aplicación|Recorrer en profundidad|Recorrer por niveles con una cola|Calcular altura, hojas y tamaño',
    'Estructura recursiva sencilla|Base de BST, AVL y heaps|Múltiples recorridos útiles|Representa decisiones de dos opciones',
    'Puede degenerar en una cadena|Sin regla de orden, buscar cuesta O(n)|Las referencias null ocupan espacio conceptual|Su forma depende de cómo se construye',
    'Árboles de expresión|Decisiones sí o no|Codificación Huffman|Base de estructuras ordenadas',
    'Cada pregunta de un juego de adivinanzas conduce a una rama izquierda o derecha.',
    'Binario significa hasta dos hijos; no significa automáticamente que sea un Binary Search Tree.'
  ),
  bst: guide(
    'Un Binary Search Tree o BST es un árbol binario ordenado: los valores menores quedan a la izquierda y los mayores a la derecha.',
    'Cada comparación descarta un subárbol completo. El recorrido inorden produce los valores ordenados. El rendimiento depende de la altura, por lo que un árbol desbalanceado puede comportarse como una lista.',
    'Buscar comparando y descendiendo|Insertar en una hoja según el orden|Eliminar hojas, nodos con un hijo o nodos con dos hijos|Recorrer inorden para ordenar',
    'Búsqueda eficiente cuando está balanceado|Mantiene datos ordenados|Permite mínimo, máximo y rangos|Inserción dinámica',
    'No se balancea automáticamente|Datos ya ordenados pueden formar una cadena|Eliminar un nodo con dos hijos requiere reemplazo|Los duplicados necesitan una política',
    'Diccionarios ordenados|Índices en memoria|Conjuntos dinámicos|Enseñanza de búsqueda jerárquica',
    'Como un juego de “mayor o menor”: cada respuesta decide qué mitad explorar.',
    'La eficiencia real es O(h), donde h es la altura. Sólo es O(log n) cuando la altura permanece pequeña.'
  ),
  avl: guide(
    'Un Árbol AVL es un BST auto-balanceado. En cada nodo, la diferencia entre la altura izquierda y derecha debe ser -1, 0 o 1.',
    'Después de insertar o eliminar se actualizan alturas desde el nodo modificado hasta la raíz. Si el factor de balance sale del rango permitido se aplica una rotación simple o doble.',
    'Buscar como en un BST|Insertar y recalcular alturas|Eliminar y volver a balancear|Aplicar rotaciones LL, RR, LR y RL',
    'Altura garantizada O(log n)|Búsquedas muy predecibles|Conserva el orden de BST|Adecuado cuando se consulta con frecuencia',
    'Inserciones y eliminaciones hacen más trabajo|Cada nodo suele guardar su altura|Las rotaciones requieren actualizar enlaces correctamente|Es más complejo que un BST básico',
    'Índices en memoria|Diccionarios con muchas consultas|Sistemas de tiempo real|Conjuntos ordenados',
    'Es un BST que se endereza cada vez que una rama pesa demasiado.',
    'Factor de balance = altura(izquierda) - altura(derecha). Su valor absoluto nunca debe superar 1.'
  ),
  'rojo-negro': guide(
    'Un Árbol Rojo-Negro es un BST balanceado mediante un color adicional en cada nodo y un conjunto de reglas estructurales.',
    'La raíz es negra, ningún nodo rojo puede tener un hijo rojo y todos los caminos hacia hojas nulas contienen la misma cantidad de nodos negros. Inserciones y eliminaciones reparan las reglas con recoloreos y rotaciones.',
    'Buscar como en un BST|Insertar inicialmente como rojo|Recolorear cuando el tío es rojo|Rotar para reparar conflictos de color',
    'Altura logarítmica garantizada|Menos rotaciones de inserción que AVL en muchos casos|Buen equilibrio entre consultas y modificaciones|Usado en bibliotecas reales',
    'Reglas más difíciles de implementar|La eliminación tiene varios casos|Requiere almacenar el color|Está un poco menos ajustado que AVL para búsqueda pura',
    'TreeMap y TreeSet de Java|Planificadores del sistema|Índices ordenados|Estructuras con muchas inserciones',
    'Los colores son reglas lógicas; no describen el contenido del nodo.',
    'La ruta más larga nunca supera el doble de la ruta más corta, lo que mantiene la altura en O(log n).'
  ),
  'splay-tree': guide(
    'Un Splay Tree es un BST que mueve a la raíz cada nodo buscado, insertado o modificado.',
    'La operación splay aplica rotaciones zig, zig-zig o zig-zag. No conserva un balance estricto, pero los elementos usados frecuentemente quedan cerca de la raíz.',
    'Buscar y llevar el resultado a la raíz|Insertar como BST y aplicar splay|Eliminar separando y uniendo subárboles|Rotar con patrones zig y zig-zag',
    'No necesita altura ni color|Se adapta a patrones de acceso|Operaciones amortizadas O(log n)|Elementos recientes quedan accesibles',
    'Una operación individual puede costar O(n)|La forma cambia después de cada acceso|No es ideal para tiempos individuales estrictos|Las rotaciones pueden complicar concurrencia',
    'Cachés adaptativas|Compresión y codificación|Tablas de símbolos|Datos con localidad temporal',
    'Como mover al frente el libro que acabas de consultar.',
    'La garantía es amortizada: una operación cara se compensa con operaciones posteriores más baratas.'
  ),
  heap: guide(
    'Un Heap Binario es un árbol completo que mantiene una prioridad: en un max-heap cada padre es mayor o igual que sus hijos; en un min-heap ocurre lo contrario.',
    'Se almacena normalmente en un Array. Para el índice i, los hijos están en 2i + 1 y 2i + 2. Insertar hace subir el nuevo valor y extraer la raíz hace bajar el reemplazo.',
    'Consultar la raíz|Insertar y hacer sift-up|Extraer la raíz y hacer sift-down|Construir un heap con heapify',
    'Máximo o mínimo disponible en O(1)|Inserción y extracción O(log n)|Representación compacta en Array|Excelente para colas de prioridad',
    'No mantiene todos los valores ordenados|Buscar un valor cualquiera cuesta O(n)|Eliminar un elemento intermedio es menos directo|No sirve para recorrer en orden',
    'Colas de prioridad|Planificación de procesos|Heap Sort|Algoritmos Dijkstra y Prim',
    'Como una competencia donde el participante de mayor prioridad siempre está arriba.',
    'Un heap sólo garantiza la relación entre padre e hijos; los hermanos no tienen que estar ordenados.'
  ),
  'fibonacci-heap': guide(
    'Un Fibonacci Heap es una colección de árboles min-heap que posterga parte del trabajo de organización.',
    'Las raíces se mantienen en una lista circular y se conserva un puntero al mínimo. Insertar y unir son muy baratos; al extraer el mínimo se consolidan árboles con el mismo grado.',
    'Insertar una nueva raíz|Consultar el mínimo|Unir dos heaps|Disminuir clave cortando nodos|Extraer mínimo y consolidar',
    'Inserción amortizada O(1)|Decrease-key amortizado O(1)|Unión muy eficiente|Ventaja teórica en algunos algoritmos de grafos',
    'Implementación compleja|Muchas referencias por nodo|Constantes altas en la práctica|Extraer el mínimo realiza bastante trabajo',
    'Dijkstra teórico|Prim en grafos densos|Investigación algorítmica|Colas de prioridad fusionables',
    'Es un bosque que ordena sus árboles principalmente cuando se retira el mínimo.',
    '“Amortizado” significa que el costo se analiza sobre una secuencia completa de operaciones.'
  ),
  trie: guide(
    'Un Prefix Tree o Trie almacena cadenas compartiendo sus prefijos. Cada arista representa un carácter y una ruta desde la raíz forma una palabra.',
    'Los nodos pueden tener varios hijos y una marca esFinal indica que la ruta completa corresponde a una palabra, aunque también sea prefijo de otra. El costo depende de la longitud de la cadena, no del número total de palabras.',
    'Insertar carácter por carácter|Buscar una palabra completa|Comprobar si existe un prefijo|Eliminar limpiando sólo nodos que ya no se comparten',
    'Búsqueda por longitud O(L)|Comparte prefijos y evita repetirlos|Autocompletado eficiente|Permite listar palabras con un prefijo',
    'Puede consumir mucha memoria|Cada nodo necesita administrar hijos|No es ideal para alfabetos enormes sin compresión|Eliminar requiere respetar prefijos compartidos',
    'Autocompletado|Correctores ortográficos|Diccionarios|Enrutamiento por prefijos',
    'CASA y CASAR comparten C-A-S-A, pero CASA necesita su propia marca de fin.',
    'Llegar al último carácter no basta: esFinal debe ser verdadero para confirmar una palabra completa.'
  ),
  'suffix-tree': guide(
    'Un Suffix Tree es un trie comprimido que representa todos los sufijos de un texto.',
    'Las cadenas de nodos con un solo hijo se comprimen en una arista etiquetada con varios caracteres. Una vez construido permite localizar patrones recorriendo sólo los caracteres del patrón.',
    'Construir los sufijos del texto|Buscar un patrón|Encontrar subcadenas repetidas|Calcular el prefijo común más largo entre sufijos',
    'Consultas de patrón muy rápidas|Resuelve numerosos problemas de texto|Representa todas las subcadenas implícitamente|Permite análisis de repeticiones',
    'Construcción avanzada|Uso considerable de memoria|Los algoritmos lineales son difíciles de implementar|Para casos simples puede ser excesivo',
    'Búsqueda en textos largos|Bioinformática|Detección de repeticiones|Análisis de similitud',
    'Para BANANA se incluyen BANANA, ANANA, NANA, ANA, NA y A.',
    'No confundas Suffix Tree con Suffix Array: almacenan información parecida con estructuras diferentes.'
  ),
  'segment-tree': guide(
    'Un Segment Tree organiza intervalos de un Array para responder consultas de rango y actualizaciones.',
    'La raíz representa el intervalo completo; cada hijo representa una mitad. Los nodos guardan un valor combinado, como suma, mínimo o máximo. Una consulta visita sólo los segmentos que cubren el rango solicitado.',
    'Construir desde un Array|Consultar suma, mínimo o máximo de un rango|Actualizar una posición y sus antecesores|Aplicar lazy propagation para rangos',
    'Consultas de rango O(log n)|Actualizaciones O(log n)|Admite distintas operaciones asociativas|Rendimiento predecible',
    'Usa varias veces el espacio del Array|Implementación más compleja|Los límites inclusivos producen errores frecuentes|Lazy propagation añade dificultad',
    'Estadísticas por intervalos|Juegos competitivos|Series temporales|Consultas dinámicas de máximos y sumas',
    'Como un resumen por capítulos: puedes combinar pocos resúmenes en vez de releer todo el libro.',
    'La operación combinada debe ser asociativa para unir segmentos en distinto orden.'
  ),
  'fenwick-tree': guide(
    'Un Fenwick Tree o Binary Indexed Tree mantiene sumas de prefijos usando un solo Array auxiliar.',
    'Cada posición almacena la suma de un bloque cuyo tamaño depende del bit menos significativo del índice. Para consultar o actualizar se avanza usando i & -i.',
    'Construir las sumas parciales|Consultar la suma desde 1 hasta i|Actualizar una posición con un delta|Obtener un rango restando dos prefijos',
    'Muy compacto|Consultas y actualizaciones O(log n)|Código corto comparado con Segment Tree|Excelente para sumas acumuladas',
    'Normalmente usa índices desde 1|Menos flexible que Segment Tree|No todas las operaciones funcionan con resta de prefijos|Los movimientos de bits pueden resultar poco intuitivos',
    'Conteo de frecuencias|Rankings dinámicos|Inversiones en un Array|Sumas acumuladas modificables',
    'Cada celda resume un bloque anterior cuyo tamaño es una potencia de dos.',
    'En una implementación clásica, reserva n + 1 posiciones y deja libre el índice 0.'
  ),
  btree: guide(
    'Un B-Tree es un árbol de búsqueda balanceado cuyos nodos contienen varias claves y varios hijos.',
    'Todas las hojas permanecen a la misma profundidad. Cada nodo funciona como un pequeño índice ordenado; cuando se llena se divide y promueve una clave al padre.',
    'Buscar dentro del nodo y descender|Insertar en una hoja ordenada|Dividir un nodo lleno|Eliminar prestando o fusionando nodos',
    'Poca altura incluso con millones de claves|Reduce accesos a disco|Siempre permanece balanceado|Permite búsquedas y rangos ordenados',
    'Implementación compleja|La eliminación tiene muchos casos|Hay que elegir el grado adecuado|Dentro de cada nodo también se busca una posición',
    'Índices de bases de datos|Sistemas de archivos|Almacenamiento por páginas|Grandes conjuntos ordenados',
    'Como un índice de libro donde cada página contiene varias palabras guía.',
    'La principal meta no es ahorrar comparaciones, sino reducir la cantidad de accesos a bloques de almacenamiento.'
  ),
  'bplus-tree': guide(
    'Un B+ Tree es una variante de B-Tree donde los datos completos se almacenan en las hojas y los nodos internos contienen separadores.',
    'Las hojas están enlazadas en orden, por lo que una búsqueda llega a una hoja y un recorrido de rango continúa por sus enlaces sin volver a subir al árbol.',
    'Buscar descendiendo por separadores|Insertar y dividir hojas|Recorrer rangos siguiendo hojas enlazadas|Eliminar redistribuyendo o fusionando',
    'Rangos secuenciales muy eficientes|Mayor cantidad de claves por nodo interno|Altura pequeña y balanceada|Estándar común en bases de datos',
    'Puede duplicar claves separadoras|Implementación compleja|Una búsqueda siempre llega a las hojas|Mantener enlaces de hojas agrega trabajo',
    'Índices SQL|Sistemas de archivos|Consultas BETWEEN|Almacenamiento ordenado en disco',
    'Es un índice más una lista ordenada de hojas.',
    'Los nodos internos orientan la búsqueda; las hojas contienen los registros o referencias reales.'
  ),
  'bstar-tree': guide(
    'Un B* Tree aumenta la ocupación mínima de los nodos mediante redistribución con hermanos antes de dividir.',
    'Cuando un nodo se llena intenta compartir claves con un hermano. Si ambos están llenos, dos nodos se reorganizan normalmente en tres, aprovechando mejor cada bloque.',
    'Buscar como en un B-Tree|Redistribuir con un hermano|Dividir dos nodos en tres|Eliminar conservando la ocupación mínima',
    'Mejor aprovechamiento de almacenamiento|Menor altura potencial|Mantiene balance estricto|Reduce bloques parcialmente vacíos',
    'Inserción y eliminación más complejas|Necesita coordinación entre hermanos|Más movimientos durante redistribución|Menos común y menos sencillo de estudiar',
    'Índices de almacenamiento|Sistemas con bloques costosos|Bases de datos especializadas|Archivos con alta ocupación',
    'Antes de comprar otro estante, redistribuye los libros entre estantes vecinos.',
    'Su ocupación mínima típica es cercana a dos tercios, mayor que la de un B-Tree tradicional.'
  ),
  'merkle-tree': guide(
    'Un Merkle Tree resume bloques de datos mediante hashes organizados en un árbol para comprobar su integridad.',
    'Las hojas contienen hashes de los bloques y cada padre calcula el hash de sus hijos. Cambiar un solo dato modifica todos los hashes desde su hoja hasta la raíz.',
    'Calcular hashes de hojas|Combinar pares hasta obtener la raíz|Crear una prueba de pertenencia|Verificar integridad recalculando una ruta',
    'Detecta cambios eficientemente|Pruebas pequeñas de pertenencia|Compara grandes conjuntos con una sola raíz|Permite verificación distribuida',
    'No almacena ni cifra los datos por sí mismo|Depende de una función hash segura|Actualizar cambia toda la ruta superior|Hay que definir cómo tratar un número impar de hojas',
    'Blockchain|Git y control de versiones|Sistemas distribuidos|Verificación de archivos',
    'La raíz funciona como una huella digital de todos los bloques inferiores.',
    'Un Merkle Tree demuestra integridad, pero no reemplaza el cifrado ni el control de acceso.'
  ),
  'kd-tree': guide(
    'Un KD-Tree organiza puntos de k dimensiones alternando el eje usado para dividir el espacio.',
    'En profundidad 0 compara por X, en la siguiente por Y y continúa alternando. Las consultas descartan regiones que no pueden contener una mejor respuesta.',
    'Insertar comparando el eje actual|Buscar un punto|Consultar un rango espacial|Encontrar vecinos cercanos con poda',
    'Búsqueda espacial eficiente en pocas dimensiones|Divide el espacio de forma jerárquica|Útil para vecinos cercanos|Generaliza BST a puntos',
    'Pierde eficiencia con muchas dimensiones|Puede desbalancearse|Eliminar es complejo|La poda depende de una buena distribución',
    'Mapas 2D y 3D|Detección de vecinos|Gráficos y colisiones|Clasificación de puntos',
    'Como dividir un mapa alternando cortes verticales y horizontales.',
    'k es la cantidad de dimensiones; no es la cantidad de hijos, que normalmente sigue siendo dos.'
  ),
  quadtree: guide(
    'Un QuadTree divide recursivamente un espacio bidimensional en cuatro cuadrantes organizados de forma jerárquica.',
    'Cada región se subdivide en noroeste, noreste, suroeste y sureste cuando supera una capacidad o necesita más detalle. Las zonas vacías permanecen compactas.',
    'Insertar un punto en su cuadrante|Subdividir regiones llenas|Consultar una ventana rectangular|Buscar vecinos o detectar colisiones',
    'Adapta el detalle a la densidad|Descarta regiones completas|Representa espacios dispersos|Facilita consultas geográficas',
    'Datos concentrados pueden crear mucha profundidad|Los puntos en límites necesitan una regla|Actualizar objetos móviles puede ser costoso|No siempre queda balanceado',
    'Mapas|Motores 2D|Compresión de imágenes|Índices geoespaciales',
    'Una imagen puede dividirse en cuatro y subdividir sólo las zonas con más detalle.',
    'Define claramente si los bordes pertenecen al cuadrante superior, inferior, izquierdo o derecho.'
  ),
  octree: guide(
    'Un Octree extiende la idea del QuadTree al espacio tridimensional dividiendo cada cubo en ocho octantes.',
    'Cada nivel parte X, Y y Z por la mitad. Los objetos se guardan en el octante que los contiene y sólo las regiones con información necesitan subdividirse.',
    'Insertar puntos u objetos 3D|Subdividir un cubo|Consultar una región espacial|Detectar vecinos, visibilidad o colisiones',
    'Representa espacios 3D dispersos|Permite descartar grandes volúmenes|Nivel de detalle adaptativo|Útil para aceleración gráfica',
    'Puede consumir muchas referencias|Objetos que cruzan límites requieren una política|La profundidad puede crecer mucho|Actualizar escenas dinámicas cuesta trabajo',
    'Videojuegos 3D|Vóxeles|Robótica|Trazado de rayos y colisiones',
    'Es como dividir una habitación en ocho cajas y repetir sólo dentro de las cajas ocupadas.',
    'Un Octree divide volumen; un QuadTree divide superficie.'
  ),
  'expression-tree': guide(
    'Un Árbol de Expresión representa operadores en nodos internos y operandos en las hojas.',
    'Para evaluar se resuelven recursivamente los subárboles izquierdo y derecho y luego se aplica el operador del nodo. El recorrido determina la notación obtenida.',
    'Construir desde una expresión|Evaluar en postorden|Generar notación prefija con preorden|Generar notación infija o postfija',
    'Hace visible la precedencia|Evaluación recursiva natural|Permite transformar expresiones|Base de compiladores',
    'Debe manejar operadores unarios y errores|La división por cero requiere control|Construir desde texto necesita análisis léxico|Los paréntesis deben interpretarse correctamente',
    'Calculadoras|Compiladores|Álgebra simbólica|Optimización de consultas',
    'En (8 + 3) × 2, la suma forma un subárbol que se evalúa antes de multiplicar.',
    'Preorden produce notación prefija; inorden con paréntesis produce infija; postorden produce postfija.'
  ),

  'hash-table': guide(
    'Una Hash Table guarda pares clave-valor y usa una función hash para convertir cada clave en un índice.',
    'La función hash distribuye las claves entre casillas. Como dos claves pueden producir la misma posición, toda tabla necesita una estrategia para resolver colisiones.',
    'put inserta o actualiza una clave|Get busca su valor|remove elimina la entrada|Rehash aumenta la capacidad y redistribuye',
    'Acceso promedio O(1)|Muy eficiente para búsquedas exactas|Claves de distintos tipos|Base de mapas y conjuntos',
    'No mantiene orden natural|El peor caso puede ser O(n)|Depende de una función hash adecuada|Cambiar capacidad exige rehash',
    'Diccionarios|Contadores de frecuencia|Cachés|Índices y tablas de símbolos',
    'Como casilleros asignados calculando un número a partir del nombre de cada persona.',
    'equals y hashCode deben ser coherentes: objetos iguales tienen que producir el mismo hash.'
  ),
  'hash-open': guide(
    'Open Addressing resuelve colisiones buscando otra posición libre dentro del mismo Array de la tabla hash.',
    'Si la posición original está ocupada se sigue una secuencia de sondeo: lineal, cuadrático o doble hash. La búsqueda debe repetir exactamente esa misma secuencia.',
    'Insertar siguiendo el sondeo|Buscar hasta encontrar la clave o una casilla nunca usada|Eliminar usando una marca especial|Redimensionar al superar el factor de carga',
    'Todos los datos quedan en un solo Array|Buena localidad de caché|Sin nodos adicionales|Implementación compacta',
    'El rendimiento cae cuando la tabla se llena|El sondeo lineal forma agrupamientos|Eliminar no puede simplemente dejar una casilla vacía|Requiere controlar el factor de carga',
    'Mapas compactos|Sistemas embebidos|Tablas de símbolos|Cachés pequeñas',
    'Si tu casillero está ocupado, pruebas los siguientes según una regla conocida.',
    'Usa una marca BORRADO; una casilla vacía podría cortar incorrectamente la búsqueda de una clave desplazada.'
  ),
  'hash-chaining': guide(
    'Separate Chaining resuelve cada colisión guardando varias entradas en una colección asociada a la misma casilla.',
    'La tabla contiene buckets y cada bucket suele ser una lista. La función hash elige el bucket; después se busca la clave sólo dentro de esa pequeña colección.',
    'Insertar en el bucket calculado|Buscar recorriendo la cadena|Eliminar de la colección del bucket|Redimensionar para acortar cadenas',
    'Eliminación sencilla|Tolera factores de carga mayores|No necesita marcas de borrado|Cada bucket crece dinámicamente',
    'Usa memoria para nodos o colecciones|Mala distribución crea cadenas largas|Menor localidad de memoria|El peor caso sigue siendo O(n)',
    'HashMap conceptuales|Tablas con cantidad variable de datos|Índices en memoria|Agrupación por claves',
    'Un casillero puede contener una pequeña lista de personas con el mismo número asignado.',
    'Una buena tabla mantiene cadenas cortas distribuyendo las claves de forma uniforme.'
  ),

  grafo: guide(
    'Un Grafo modela elementos llamados vértices y relaciones llamadas aristas. En un grafo no dirigido, una arista conecta en ambos sentidos.',
    'Puede representarse con una matriz de adyacencia o con listas de vecinos. A diferencia de un árbol, puede tener ciclos, múltiples caminos y componentes separados.',
    'Agregar o eliminar vértices|Agregar o eliminar aristas|Recorrer con BFS o DFS|Comprobar conectividad y componentes',
    'Representa relaciones generales|Admite rutas y ciclos|Se adapta a redes dispersas o densas|Base de muchos problemas reales',
    'Los algoritmos pueden ser más complejos que en árboles|Hay que marcar visitados para evitar ciclos infinitos|La representación afecta memoria y velocidad|Puede estar desconectado',
    'Redes sociales|Mapas de carreteras|Redes de computadores|Dependencias entre elementos',
    'Ciudades son vértices y carreteras son aristas.',
    'En un grafo no dirigido, agregar A-B implica registrar B como vecino de A y A como vecino de B.'
  ),
  'grafo-dirigido': guide(
    'Un Grafo Dirigido usa aristas con orientación: una conexión A → B no implica que exista B → A.',
    'Cada vértice tiene aristas entrantes y salientes. La dirección permite representar dependencia, precedencia o flujo; también puede contener ciclos dirigidos.',
    'Agregar un arco origen-destino|Calcular grados de entrada y salida|Recorrer respetando direcciones|Ordenar topológicamente si no hay ciclos',
    'Representa dependencias con precisión|Modela flujo y permisos|Permite análisis de precedencia|Distingue claramente origen y destino',
    'La conectividad no es simétrica|Los ciclos bloquean un orden topológico|Hay distintas nociones de componente|Es fácil agregar por error la arista inversa',
    'Enlaces web|Seguidores en redes sociales|Dependencias de paquetes|Flujos de trabajo',
    'Que Ana siga a Luis no significa que Luis siga a Ana.',
    'Antes de aplicar un algoritmo confirma si necesita grafo dirigido, no dirigido y si acepta ciclos.'
  ),
  dfs: guide(
    'Depth-First Search explora un camino tan profundamente como puede antes de retroceder.',
    'Usa recursividad o una pila. Marca cada vértice al visitarlo, avanza a un vecino no visitado y vuelve atrás cuando no quedan opciones.',
    'Elegir un origen|Marcar el vértice actual|Explorar recursivamente cada vecino|Retroceder al terminar una rama',
    'Código recursivo claro|Detecta ciclos y componentes|Útil para backtracking|Usa poca memoria en grafos poco profundos',
    'No garantiza el camino con menos aristas|Una recursión profunda puede desbordar la pila|El resultado depende del orden de vecinos|Sin visitados puede quedar en un ciclo',
    'Detección de ciclos|Orden topológico|Laberintos|Componentes conectados',
    'Exploras un pasillo hasta el fondo y vuelves al último cruce cuando no puedes continuar.',
    'Marca el nodo antes de explorar sus vecinos, no después, para evitar visitas repetidas.'
  ),
  bfs: guide(
    'Breadth-First Search explora un grafo por niveles: primero vecinos directos, luego vecinos a distancia dos y así sucesivamente.',
    'Usa una cola FIFO. Cada vértice se marca al encolarlo para que no se agregue varias veces. En grafos sin peso encuentra caminos con la menor cantidad de aristas.',
    'Encolar el origen|Desencolar y procesar|Encolar vecinos no visitados|Guardar padre o distancia si se necesita una ruta',
    'Encuentra caminos mínimos sin peso|Exploración ordenada por distancia|Evita recursión profunda|Calcula niveles fácilmente',
    'Puede almacenar muchos vértices a la vez|No sirve directamente para pesos distintos|El orden entre vecinos del mismo nivel puede variar|Necesita memoria de visitados',
    'Rutas mínimas sin peso|Grados de separación|Difusión en redes|Recorrido de árboles por niveles',
    'Una onda que se expande un paso a la vez desde el punto inicial.',
    'Marca un vértice cuando lo encolas; marcarlo al sacarlo puede introducir duplicados.'
  ),
  dijkstra: guide(
    'Dijkstra calcula las distancias mínimas desde un origen en un grafo con pesos no negativos.',
    'Mantiene una distancia tentativa para cada vértice y extrae siempre el no procesado con menor distancia. Relajar una arista significa comprobar si pasar por el vértice actual mejora la ruta conocida.',
    'Inicializar distancias en infinito|Extraer el mínimo de una cola de prioridad|Relajar las aristas salientes|Guardar predecesores para reconstruir rutas',
    'Encuentra rutas óptimas con pesos no negativos|Produce distancias a todos los vértices|Combina bien con un heap|Es ampliamente aplicable',
    'No acepta pesos negativos|Requiere una cola de prioridad para ser eficiente|Puede procesar gran parte del grafo|Hay que evitar trabajar con entradas obsoletas del heap',
    'GPS y mapas|Enrutamiento de redes|Costos mínimos|Planificación de movimientos',
    'Elige siempre la ciudad alcanzable con menor costo conocido y desde ella intenta mejorar las demás.',
    'Con una arista negativa, una distancia considerada definitiva podría mejorar después; usa Bellman-Ford en ese caso.'
  ),
  prim: guide(
    'Prim construye un Minimum Spanning Tree conectando todos los vértices de un grafo no dirigido con el menor peso total.',
    'Comienza en un vértice y mantiene una frontera de aristas. En cada paso elige la arista más barata que conecta el árbol actual con un vértice todavía externo.',
    'Elegir un vértice inicial|Agregar aristas candidatas a una cola|Extraer la conexión más barata|Ignorar aristas que llevan a vértices ya incluidos',
    'Produce un árbol de expansión mínimo|Funciona bien con grafos densos|Crece de forma intuitiva|Se implementa eficientemente con heap',
    'Requiere grafo conectado para obtener un solo árbol|Sólo se aplica a grafos no dirigidos|No calcula rutas mínimas desde un origen|Hay que controlar aristas repetidas',
    'Cableado de redes|Conexión de instalaciones|Diseño de tuberías|Clustering aproximado',
    'Expandes una red eligiendo siempre el cable más barato que alcanza un lugar nuevo.',
    'Árbol de expansión mínimo y árbol de caminos mínimos son problemas diferentes.'
  ),
  kruskal: guide(
    'Kruskal construye un Minimum Spanning Tree seleccionando aristas globalmente de menor a mayor peso sin formar ciclos.',
    'Ordena todas las aristas y usa Union-Find para saber si los extremos ya pertenecen al mismo componente. Si están separados, incorpora la arista y une los componentes.',
    'Ordenar aristas por peso|Consultar los representantes con find|Agregar sólo si no crea ciclo|Unir componentes con union',
    'Conceptualmente sencillo|Excelente para grafos dispersos|Puede producir un bosque si el grafo está desconectado|Aprovecha Union-Find eficientemente',
    'Ordenar aristas cuesta O(E log E)|Necesita almacenar las aristas|No parte de un vértice particular|No se aplica como tal a grafos dirigidos',
    'Diseño de redes|Agrupamiento|Conexiones de costo mínimo|Generación de laberintos',
    'Revisas todas las ofertas de cable de menor a mayor y rechazas las que cierran un ciclo innecesario.',
    'El algoritmo termina al aceptar V - 1 aristas si el grafo es conectado.'
  ),

  fibonacci: guide(
    'La sucesión de Fibonacci comienza normalmente con 0 y 1; cada término siguiente es la suma de los dos anteriores.',
    'La definición recursiva llama a fib(n - 1) y fib(n - 2). La versión directa repite muchos cálculos; memoización o un ciclo evita ese trabajo duplicado.',
    'Definir los casos base 0 y 1|Calcular recursivamente|Guardar resultados con memoización|Construir iterativamente desde los dos valores anteriores',
    'Excelente para aprender recursividad|Muestra subproblemas superpuestos|Tiene una versión iterativa simple|Introduce programación dinámica',
    'La recursión ingenua es exponencial|Puede desbordar enteros rápidamente|Usa pila de llamadas|La convención inicial puede variar',
    'Enseñanza de recursión|Programación dinámica|Modelos matemáticos simples|Análisis de crecimiento',
    'Para obtener 8 se suman los dos términos anteriores: 3 + 5.',
    'La versión recursiva ingenua sirve para aprender, pero para valores grandes usa memoización o iteración.'
  ),
  factorial: guide(
    'El factorial de n, escrito n!, multiplica todos los enteros positivos desde 1 hasta n. Por definición, 0! = 1.',
    'La relación recursiva es n! = n × (n - 1)!. Cada llamada reduce n hasta alcanzar el caso base y después las multiplicaciones se resuelven al regresar.',
    'Validar que n no sea negativo|Detenerse en 0 o 1|Multiplicar por el resultado de n - 1|Usar un acumulador en la versión iterativa',
    'Definición recursiva directa|Buen ejemplo de caso base|Versión iterativa eficiente|Conecta algoritmos con combinatoria',
    'Crece extremadamente rápido|int y long se desbordan pronto|Valores negativos no están definidos en este contexto|La recursión consume pila',
    'Permutaciones|Combinaciones|Probabilidad|Enseñanza de recursividad',
    '4! significa 4 × 3 × 2 × 1 = 24.',
    'En Java, long sólo alcanza hasta 20!; para valores mayores se necesita BigInteger.'
  ),
  hanoi: guide(
    'Torres de Hanoi es un problema recursivo que mueve discos entre tres torres sin colocar uno grande sobre uno pequeño.',
    'Para mover n discos se trasladan n - 1 al auxiliar, se mueve el disco mayor al destino y se trasladan los n - 1 restantes sobre él.',
    'Resolver el caso base de un disco|Mover n - 1 al auxiliar|Mover el disco mayor|Mover n - 1 desde auxiliar al destino',
    'Visualiza claramente la recursividad|Divide el problema en copias menores|Demuestra crecimiento exponencial|Permite seguir la pila de llamadas',
    'Necesita 2^n - 1 movimientos|Crece demasiado rápido|Un parámetro de torre incorrecto rompe la solución|No es práctico para n grande',
    'Enseñanza de recursión|Análisis de recurrencias|Rompecabezas|Planificación jerárquica',
    'Para mover tres discos primero debes liberar el disco mayor moviendo los dos pequeños.',
    'El número mínimo de movimientos es exactamente 2^n - 1.'
  ),
  'merge-sort': guide(
    'Merge Sort ordena dividiendo el Array en mitades, ordenando cada mitad y mezclándolas.',
    'La división continúa hasta tener partes de un elemento. Merge compara los primeros elementos disponibles de ambas mitades y copia siempre el menor al resultado.',
    'Dividir por la mitad|Ordenar recursivamente cada parte|Mezclar dos secuencias ordenadas|Copiar los elementos restantes',
    'Tiempo O(n log n) garantizado|Algoritmo estable|Excelente para listas enlazadas y archivos|Rendimiento predecible',
    'Necesita memoria auxiliar O(n) en Arrays|Realiza copias adicionales|La recursión agrega llamadas|Para arreglos pequeños puede ser más lento que algoritmos simples',
    'Ordenamiento general estable|Archivos grandes|Ordenamiento externo|Procesamiento paralelo',
    'Como ordenar dos montones ya ordenados tomando cada vez la tarjeta menor de sus frentes.',
    'La fase merge supone que ambas mitades ya están ordenadas.'
  ),
  'quick-sort': guide(
    'Quick Sort elige un pivote, separa valores menores y mayores, y ordena recursivamente cada lado.',
    'La partición coloca el pivote en su posición definitiva. Si las particiones quedan equilibradas el algoritmo es muy rápido; pivotes malos repetidos producen profundidad lineal.',
    'Elegir un pivote|Particionar el rango|Ordenar la parte menor|Ordenar la parte mayor',
    'Promedio O(n log n)|Muy rápido en memoria|Puede ordenar in-place|Buena localidad de caché',
    'Peor caso O(n²)|Normalmente no es estable|La elección de pivote importa|La recursión profunda puede desbordar la pila',
    'Ordenamiento general|Bibliotecas optimizadas combinadas|Procesamiento en memoria|Selección y partición de datos',
    'El pivote funciona como una persona que separa números pequeños a un lado y grandes al otro.',
    'Un pivote aleatorio o mediana de tres reduce la posibilidad de particiones extremadamente desbalanceadas.'
  ),

  'n-reinas': guide(
    'N-Reinas busca colocar N reinas en un tablero N × N sin compartir fila, columna ni diagonal.',
    'Se intenta una columna para cada fila. isSafe revisa reinas anteriores; si una elección impide completar las filas siguientes, se retira la reina y se prueba otra columna.',
    'Elegir una fila|Probar cada columna|Validar columna y diagonales con isSafe|Colocar, llamar recursivamente y deshacer',
    'Ejemplo completo de backtracking|Hace visible la poda|Se representa con un Array de columnas|Permite enumerar una o todas las soluciones',
    'El espacio de búsqueda crece muy rápido|El orden de prueba afecta el recorrido|Copiar tableros completos es costoso|No todos los tamaños pequeños tienen solución',
    'Enseñanza de restricciones|Planificación sin conflictos|Problemas de asignación|Introducción a satisfacción de restricciones',
    'Cada fila guarda sólo la columna de su reina; no es necesario almacenar todo el tablero.',
    'Dos reinas están en la misma diagonal cuando abs(columna1 - columna2) = abs(fila1 - fila2).'
  ),
  laberinto: guide(
    'El solucionador de Laberinto usa recursividad y backtracking para encontrar una ruta desde la entrada hasta la salida.',
    'Marca la celda actual, prueba direcciones y evita muros, límites y celdas ya visitadas. Si ninguna dirección funciona, desmarca o registra el callejón y vuelve a la decisión anterior.',
    'Validar límites y muros|Marcar la celda visitada|Probar derecha, abajo, izquierda y arriba|Deshacer al encontrar un callejón',
    'Muestra claramente avanzar y retroceder|Encuentra una ruta si existe|La misma idea sirve en muchos tableros|Permite añadir reglas de movimiento',
    'Puede explorar muchas celdas|No garantiza la ruta más corta|Sin visitados entra en ciclos|El orden de direcciones cambia la solución encontrada',
    'Rompecabezas|Navegación en cuadrículas|Videojuegos|Enseñanza de búsqueda recursiva',
    'Dejas migas al avanzar y las retiras cuando el camino termina en una pared.',
    'Backtracking encuentra una solución; para garantizar la ruta más corta en una cuadrícula sin peso utiliza BFS.'
  ),
  sudoku: guide(
    'Sudoku 9 × 9 completa las celdas vacías usando números del 1 al 9 sin repetirlos en fila, columna ni subcuadro 3 × 3.',
    'Busca una celda vacía, prueba cada número seguro y continúa recursivamente. Cuando una elección bloquea el tablero, borra el número y prueba el siguiente.',
    'Encontrar la siguiente celda vacía|Comprobar fila, columna y caja|Colocar un candidato válido|Resolver el resto o deshacer',
    'Ejemplo rico de backtracking|Las restricciones podan muchas opciones|Permite visualizar decisiones y retrocesos|Puede mejorarse con heurísticas',
    'El peor caso es exponencial|Una validación incompleta acepta tableros inválidos|Copiar el tablero en cada llamada consume memoria|Algunos tableros pueden tener varias soluciones',
    'Resolución de rompecabezas|Satisfacción de restricciones|Enseñanza de recursividad|Práctica de matrices',
    'Cada intento es provisional hasta que todas las celdas siguientes también pueden completarse.',
    'La caja de una celda comienza en fila - fila % 3 y columna - columna % 3.'
  ),

  'union-find': guide(
    'Union-Find o Disjoint Set Union mantiene varios conjuntos separados y responde rápidamente si dos elementos pertenecen al mismo grupo.',
    'Cada elemento apunta a un padre y cada conjunto tiene una raíz representante. Path compression acorta caminos durante find y union by rank enlaza el árbol más pequeño bajo el mayor.',
    'makeSet crea conjuntos individuales|find obtiene la raíz|union conecta dos raíces|Comprobar conectividad comparando representantes',
    'Operaciones casi constantes amortizadas|Implementación compacta|Excelente para conectividad incremental|Evita recorrer grafos completos repetidamente',
    'No permite separar conjuntos fácilmente|No entrega por sí solo el camino entre elementos|Los índices deben ser válidos|Sin optimizaciones puede formar árboles altos',
    'Kruskal|Detección de ciclos|Conectividad de redes|Agrupación dinámica',
    'Cada grupo elige un representante; dos personas están juntas si terminan llegando al mismo representante.',
    'Compara find(a) con find(b), no solamente parent[a] con parent[b].'
  ),
  'lru-cache': guide(
    'Una LRU Cache conserva una cantidad limitada de datos y elimina el que lleva más tiempo sin utilizarse.',
    'Combina una Hash Table para localizar claves en O(1) y una Lista Doblemente Enlazada para mantener el orden de uso. Cada get o put mueve la entrada al frente.',
    'get busca y mueve al frente|put inserta o actualiza|Eliminar la cola al superar capacidad|Mantener sincronizados mapa y lista',
    'Get y put O(1)|Aprovecha la localidad temporal|Política de reemplazo intuitiva|Combina dos estructuras clásicas',
    'Necesita más memoria|Cada acceso modifica el orden|Mapa y lista pueden desincronizarse|LRU no siempre predice el dato más útil',
    'Caché de páginas|Imágenes y respuestas HTTP|Bloques de disco|Resultados de cálculos costosos',
    'Como dejar a mano los libros usados recientemente y devolver el más olvidado cuando falta espacio.',
    'La cabeza representa lo más reciente y la cola lo menos reciente; actualiza ambos extremos en cada operación.'
  ),
  'bloom-filter': guide(
    'Un Bloom Filter es una estructura probabilística que indica si un elemento definitivamente no está o posiblemente sí está.',
    'Varias funciones hash convierten el elemento en posiciones de un vector de bits. Insertar enciende esos bits; consultar comprueba que todos estén encendidos.',
    'Insertar aplicando k hashes|Consultar las mismas k posiciones|Configurar tamaño y cantidad de hashes|Recrear el filtro si se necesita eliminar de forma clásica',
    'Muy poco uso de memoria|Inserción y consulta rápidas|Nunca produce falsos negativos si se usa correctamente|Reduce consultas costosas',
    'Puede producir falsos positivos|El Bloom Filter clásico no elimina|No almacena los elementos|La tasa de error crece al llenarse',
    'Evitar búsquedas innecesarias en bases de datos|Filtros de URL|Cachés distribuidas|Comprobación previa de pertenencia',
    'Si falta uno de los bits, el elemento no existe; si están todos, todavía podría ser coincidencia.',
    '“Posiblemente presente” no es una confirmación: verifica en la fuente real cuando necesites certeza.'
  ),
};

export function getEducationalDescription(id) {
  return educationalDescriptions[id] ?? null;
}
