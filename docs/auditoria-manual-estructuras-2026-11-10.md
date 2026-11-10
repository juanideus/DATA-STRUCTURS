# Auditoría manual de estructuras — 10 de noviembre de 2026

## Corrección implementada — 10 de noviembre de 2026

Los 16 hallazgos de la revisión original tienen una corrección en el código local. La tabla siguiente registra qué se cambió y qué se verificó; la revisión original permanece debajo como historial de reproducción. La matriz exhaustiva de 86 temas, todas sus combinaciones de entradas e idiomas y una comparación con el despliegue publicado siguen pendientes.

| ID | Estado local | Evidencia de corrección |
| --- | --- | --- |
| AUD-001 | Corregido | El ejemplo introductorio muestra sondeo lineal y actualización de clave; regresión de contenido. |
| AUD-002 | Corregido | El adaptador usa `pseudoStep` y deja sin línea activa los pasos sin correspondencia; regresión de ambos casos. BFS, Hanoi y Prim emiten claves explícitas desde la operación. |
| AUD-003 | Corregido | La ficha define `F` y `C` y expresa recorrido y transposición como O(F·C); regresión de contenido. |
| AUD-004 | Corregido | La ficha y las plantillas LRU sitúan lo reciente en `tail` y expulsan `head`; regresión de contenido. |
| AUD-005 | Corregido | El pseudocódigo BFS marca cada vecino antes de encolarlo; regresión con grafo diamante. |
| AUD-006 | Corregido | El pseudocódigo Hanoi incluye caso base y parámetros de ambas llamadas; regresión de contenido. |
| AUD-007 | Corregido | El pseudocódigo Prim termina al no hallar candidato alcanzable; regresión con vértice aislado. |
| AUD-008 | Corregido | Heap separa comparación y asignación de `largest`; regresión con el arreglo de la reproducción original. |
| AUD-009 | Corregido | Dijkstra y A* emiten comprobaciones y actualizaciones por vecino, con `next` y coste candidato; regresión de secuencia y avance en navegador. |
| AUD-010 | Corregido | Los fotogramas indican destino e índice de escritura; Merge y Radix distinguen lectura y escritura y el contador usa `digit`; regresión de destinos. |
| AUD-011 | Corregido | Radix C++ muestra decremento antes de escritura, reserva y libera auxiliares por pasada; prueba de secuencia en navegador. |
| AUD-012 | Corregido | La eliminación no inicial de lista simple selecciona las ocurrencias de `size--` y `return true` de su rama; regresión de líneas. |
| AUD-013 | Corregido | Fibonacci sin hijos emite desconexión y ninguna promoción; regresión de etapas y auditoría de estructuras. |
| AUD-014 | Corregido | Trie y Merkle C++ incluyen `<string>`; auditoría de compilación C++ de 310 ejemplos. |
| AUD-015 | Corregido | La guía y la visualización advierten de colisiones y del límite de seguridad del hash; regresión `Aa`/`BB` y comprobación en navegador. |
| AUD-016 | Corregido | La eliminación C++ separa desconexión, liberación, decremento y retorno; regresión del contador 10→10→9. |

Verificaciones ejecutadas: `node --test tests/regressions/*.test.mjs` (155 aprobadas, 14 omitidas), la nueva regresión dirigida (11 aprobadas tras su ampliación), `npm run audit` (3100 pruebas funcionales), `npm run audit:structures`, `npm run audit:cpp` y `npm run audit:java` (310 ejemplos compilados en cada lenguaje), `npm run build`, y `npm run test:e2e -- manual-structure-audit.spec.js --project=desktop-chromium` (3 aprobadas). La prueba de navegador recorre los primeros ocho fotogramas de las ocho escenas afectadas y examina Radix C++ hasta la liberación de auxiliares; no sustituye un recorrido visual exhaustivo de cada traza.

Alcance de la revisión original: implementación, código mostrado, fotogramas, resaltado y coherencia didáctica. En esa revisión no se ejecutó npm ni se modificó la lógica de producción. No constituía una certificación de todas las estructuras.

## Hallazgos

| ID | Estado | Alcance | Discrepancia |
| --- | --- | --- | --- |
| AUD-001 | Confirmado, sin corregir | Hash Table | El ejemplo introductorio escribe directamente en `tabla[i]`, mientras la operación real resuelve colisiones mediante direccionamiento abierto y sondeo. |
| AUD-002 | Confirmado, sin corregir | Resaltado en pseudocódigo | `adaptFramesToCode` asigna la línea por progreso proporcional de fotogramas, no por el paso semántico ejecutado. Puede resaltar una rama o condición ajena al estado mostrado. |
| AUD-003 | Ambigüedad confirmada, sin corregir | Matriz | La complejidad dice recorrido O(n) y transposición O(n²) sin definir si `n` es el total de celdas o el lado de la matriz. |
| AUD-004 | Confirmado, sin corregir | LRU Cache | El pseudocódigo introductorio mueve la clave al frente y expulsa la cola; Java, C++ y la simulación hacen lo contrario: lo más reciente queda al final (`tail`) y se expulsa `head`. |
| AUD-005 | Confirmado, sin corregir | BFS, pseudocódigo de operación | Marca el origen, pero omite marcar los vecinos al encolarlos. La implementación y sus fotogramas sí los marcan antes de encolar. |
| AUD-006 | Confirmado, sin corregir | Hanoi, pseudocódigo de operación | Omite el caso base de cero discos que sí ejecutan el código Java y la traza. |
| AUD-007 | Confirmado, sin corregir | Prim, pseudocódigo de operación | Indica repetir hasta conectar todos los vértices, pero omite la salida por grafo desconectado implementada en Java y en la simulación. |
| AUD-008 | Confirmado en navegador y código, sin corregir | Heap binario, extracción Java | La condición compara usando `largest`, pero el panel ya muestra el índice modificado por la asignación posterior. |
| AUD-009 | Confirmado en navegador para Dijkstra y en código compartido, sin corregir | Dijkstra / A*, recorrido de vecinos | Un fotograma agrupa varias iteraciones y escrituras mientras resalta una sola asignación; no permite seguir cada vecino ni sus condiciones. |
| AUD-010 | Confirmado por lectura, sin corregir | Merge / Radix, indicadores de escritura | El mismo índice marca como escrito tanto el arreglo principal como el auxiliar, aunque la instrucción solo modifica uno. |
| AUD-011 | Confirmado por lectura, sin corregir | Radix C++, traza | Reutiliza el orden de instrucciones Java aunque C++ combina predecremento y escritura, y reserva el auxiliar dentro de cada pasada. |
| AUD-012 | Confirmado en navegador y código, sin corregir | Lista simple Java, eliminar por índice | Al eliminar fuera de la cabeza, el resaltado final selecciona `size--` y `return true` de la rama `index == 0`, que no se ejecutó. |
| AUD-013 | Confirmado en navegador y código, sin corregir | Fibonacci Heap, extracción del mínimo | Se anima una promoción de hijos incluso cuando el mínimo no tiene hijos; se resalta el cuerpo de un bucle que no se ejecuta. |
| AUD-014 | Confirmado en código mostrado y fuente, sin corregir | Trie y Merkle, ejemplos C++ | Los ejemplos utilizan `std::string` sin incluir `<string>` y no son autosuficientes al copiarlos en una unidad de compilación nueva. |
| AUD-015 | Confirmado en navegador y código, sin corregir | Merkle, explicación de integridad | La guía afirma que cambiar un dato modifica los hashes, pero la demostración usa un hash no criptográfico con colisiones triviales y no lo advierte en esa explicación. |
| AUD-016 | Confirmado en navegador C++ y código, sin corregir | Matriz poco poblada, eliminación | `noCeros` disminuye al desconectar ACOL, antes de `nonZeroCount--`; se omiten los pasos de liberación y decremento antes del retorno. |

### AUD-001

- Código: `src/data/algorithms.js`, ficha `hash-table`; `src/logic/operations.js`, rama `hash-table`/`hash-open`.
- Impacto: una colisión parecería sobrescribir una entrada según el ejemplo inicial, pero la simulación la coloca en otra casilla.
- Corrección propuesta: representar el sondeo y la actualización de una clave existente en el ejemplo introductorio. La ficha de la operación específica debe revisarse por separado.

### AUD-002

- Código: `src/logic/codeAnimation.js`, final de `adaptFramesToCode`; llamada en `src/App.jsx` con `keepOriginalLines=false` para pseudocódigo.
- Impacto: el resaltado puede sugerir causalidad incorrecta. La correspondencia en Java/C++ se resuelve por otros mecanismos y este hallazgo no afirma que ambos modos fallen igual.
- Corrección propuesta: emitir una clave de paso semántico y mapearla a cada plantilla de pseudocódigo; mientras no exista mapeo, dejar la línea sin resaltar en vez de inventarla.

### AUD-003

- Código: `src/data/algorithms.js`, ficha `matriz`.
- Corrección propuesta: usar `F` filas y `C` columnas: recorrido/transposición O(F·C), o definir expresamente `n` como lado de una matriz cuadrada.

### AUD-004

- Código: `src/data/algorithms.js`, ficha `lru-cache`; `src/data/specializedJava.js`, `addLast`/`markRecent`; `src/data/otherCpp.js`, `addLast`/`markRecent`; `src/logic/operations.js`, `cache-put`/`cache-get`.
- Impacto: el orden del ejemplo introductorio es inverso al de la visualización y los dos lenguajes. La política LRU sí parece coherente entre las tres implementaciones inspeccionadas; la discrepancia está en la explicación inicial.
- Corrección propuesta: describir que lo más reciente se mueve a `tail` y que la expulsión elimina `head`.

### AUD-005

- Código: `src/data/operationPseudocode.js:47`; marcado real en `src/logic/operations.js`, rama BFS, `visited.add(next)` y fotograma `visited[next] = true;`.
- Comprobación manual de escritorio: en el diamante dirigido A→B, A→C, B→D, C→D, si solo se marca al visitar/desencolar, D puede encolarse desde B y nuevamente desde C. La implementación evita esto marcándolo al descubrirlo; la plantilla no explica ese paso.
- Impacto: discrepancia didáctica del pseudocódigo; no se afirma que el BFS real duplique vértices.
- Corrección propuesta: añadir explícitamente `marcar vecino como visitado` antes de `encolar vecino` dentro del bucle.

### AUD-006

- Código: `src/data/operationPseudocode.js:56`; `src/data/beginnerJava.js:342`; `src/logic/operations.js`, `solveHanoiWithTrace`, rama `amount === 0`.
- Comprobación manual de escritorio: con un disco, la traza entra en la llamada de cero discos y retorna antes de mover el disco. La plantilla solo contiene las dos llamadas recursivas y el movimiento, sin la condición que detiene la recursión.
- Impacto: el fotograma del caso base no tiene una instrucción equivalente en esta plantilla. Si se implementa literalmente como recursión, no define cómo terminar.
- Corrección propuesta: comenzar por `si n = 0: retornar` y expresar las dos llamadas con sus parámetros de origen, destino y auxiliar.

### AUD-007

- Código: `src/data/operationPseudocode.js:49`; `src/data/graphJava.js:123`; `src/logic/operations.js`, rama Prim, condición `current === -1 || !Number.isFinite(bestWeight[current])`.
- Comprobación manual de escritorio: con A—B y C aislado, Prim selecciona A y B, pero ningún coste finito permite incorporar C. La implementación emite el mensaje de grafo no conexo y termina; la plantilla exige seguir hasta conectar todos.
- Impacto: falta una condición de terminación y una explicación del resultado sin árbol de expansión global. No es un fallo confirmado del cálculo de Prim.
- Corrección propuesta: antes de añadir el siguiente vértice/arista, comprobar que existe candidato alcanzable; si no, terminar e informar que no existe un árbol de expansión que abarque todos los vértices.

### AUD-008

- Código: `src/logic/operations.js:4278–4317`; comparación con `src/data/beginnerJava.js`, método `heapifyDown`.
- Reproducción en navegador: abrir `https://www.dsalab.dev/heap`, datos iniciales `[42,29,31,14,18,7,11]`, Java, extraer raíz, pausar y avanzar al paso 12. La raíz temporal es 11; el panel muestra `left = 1`, `largest = 1`, `condición = true`, pero resalta `if (left < size && heap[left] > heap[largest])` (línea 24 del código mostrado). Con esas variables, la comparación sería 29 > 29, falsa.
- Causa: la traza asigna `largest = left` antes de emitir el fotograma del `if`. Ocurre lo mismo con el hijo derecho.
- Impacto: contradicción entre condición, variables y línea activa; no demuestra un error del heap final.
- Corrección propuesta: conservar el candidato anterior en el fotograma de comparación y emitir otro fotograma para la asignación `largest = left/right` cuando la condición sea verdadera.

### AUD-009

- Código: `src/logic/pathfindingMap.js:252–280` ejecuta todo el bucle de vecinos antes de emitir el único fotograma de relajación; `src/App.jsx:84–104` lo vincula a una asignación individual mediante `pathfindingCodeNeedle`.
- Reproducción en navegador: `https://www.dsalab.dev/dijkstra`, mapa inicial de 12×22, inicio `(8,1)`, meta `(7,21)`, Java. En el paso 136 aparece «Actualizamos 3 casillas vecinas con una ruta más corta» y se resalta únicamente `distance[next] = newDistance;` (línea 36). No hay pasos intermedios para esas tres iteraciones ni variables `next`/`newDistance` en el panel de ese paso.
- Impacto: no corresponde a una ejecución instrucción por instrucción, aunque la interfaz promete esa correspondencia. El resultado de ruta no se declara incorrecto. A* comparte este generador, pero no se reprodujo su pantalla en esta pasada.
- Corrección propuesta: emitir fotogramas por vecino, comprobación de límites/obstáculo/visitado, comparación de distancia y cada actualización; o identificar explícitamente la vista como resumen y no resaltar una instrucción individual como si representara todo el paso.

### AUD-010

- Código: `src/components/Visualizer.jsx:713,749,763` usa `sortWriteIndex` en ambas filas; `src/logic/sortingAlgorithms.js:358–364` lo asigna al distribuir Radix; `src/logic/operations.js:3625,3830–3838` hace lo mismo para el auxiliar de Merge.
- Caso de escritorio `[2,1]`: al copiar 1 a `help[0]` o `output[0]`, `values[0]` aún contiene 2, pero recibe la clase `writing` y etiqueta `write`. Al copiar de vuelta, también se ilumina el auxiliar como destino de escritura aunque se está leyendo.
- Variante en Radix: el fotograma de decremento usa `position` para iluminar la fila `count`, cuando se modifica `count[digit]`. Con `[1,1]` no hay pasada; con `[1,1,2]`, la primera distribución de 2 tiene `digit = 1` y `position = 2`: son casillas diferentes.
- Corrección propuesta: separar índice y destino (`values`, `help`, `output`, `count`); representar lectura y escritura de forma distinta y usar `digit` cuando cambia el contador.
- Evidencia: lectura y seguimiento de datos; pendiente reproducción visual específica de Merge/Radix.

### AUD-011

- Código: `src/data/sortingCpp.js:244–260`; `src/logic/sortingAlgorithms.js:338–364`; `src/logic/cppCodeNeedles.js:1–17`; adaptación de fotogramas en `src/App.jsx`.
- C++ ejecuta `output[--count[digit]] = values[i]`: decrementa antes de escribir. La traza escribe primero `output[count[digit] - 1]` y solo en el siguiente fotograma decrementa el contador, como Java. También crea el auxiliar una vez antes del bucle de dígitos, mientras C++ lo reserva y libera dentro de `countingByDigit` por pasada.
- Precisión importante: **sí existe un mapeador Radix**. Ambas fases apuntan a la misma línea C++; no es correcto registrar este caso como ausencia de resaltado. El problema confirmado es el orden y ciclo de vida representados, que el mapeo de texto no corrige.
- Caso de escritorio `[2,1]`: la fase de escritura muestra `output[0] = 1` antes del fotograma que reduce `count[0]`; en C++ el decremento forma parte de la evaluación previa del índice. Una entrada con varias cifras permite observar además la diferencia de reserva por pasada.
- Corrección propuesta: emitir una traza C++ acorde a esa sentencia y sus reservas/liberaciones, o separar y ordenar las instrucciones del ejemplo C++ para que coincidan con la traza, manteniendo memoria dinámica explícita.

### AUD-012

- Código: `src/logic/codeAnimation.js:675–684` (`lineOf` elige la primera coincidencia), `:789–815` (`finishSuccessfulOperation`) y `:1146–1155` (`remove-index`); `src/data/linkedListJava.js:88–106`.
- Caso de escritorio: lista `[8,13,21,34]`, Java, eliminar índice 2. Se reconecta correctamente `previous.next` y el resultado es `[8,13,34]`. Al cerrar la animación, el buscador genérico toma el primer `size--;` y el primer `return true;`, ubicados dentro de `if (index == 0)`, en vez de las instrucciones al final del método.
- Impacto: el resaltado salta a una rama cuya condición fue falsa. No se afirma un error en el resultado de la eliminación.
- Corrección propuesta: seleccionar las líneas por rama/ámbito ejecutado o por ocurrencia explícita; para índice > 0, usar el `size--` y retorno posteriores a la reconexión.
- Evidencia inicial: lectura y recorrido manual de la ruta de sincronización.
- Reconfirmación en la cuarta pasada, navegador de producción: con `[8,13,21,34]`, Java y eliminar índice 2, el paso 9 resalta la línea 23 (`size--;`) y el paso 10 la línea 24 (`return true;`). Ambas están dentro de `if (index == 0)`. Las instrucciones correctas de esta ruta están en las líneas 32 y 33 del listado mostrado. El resultado `[8,13,34]` y `size = 3` sí coinciden; falla la localización de la rama.

### AUD-013

- Código: `src/logic/fibonacciHeap.js:25–27` crea siempre un evento `promote` después de retirar el mínimo; `src/App.jsx:1180–1184` lo vincula a `addRoot(child)` y al mensaje de promoción.
- Reproducción en navegador: `https://www.dsalab.dev/fibonacci-heap`, ejemplo inicial `[3,7,18,24,31,39]`, Java, extraer raíz. En el paso 2 se muestra «Los hijos del mínimo pasan a la lista de raíces» y se resalta la línea 13, `addRoot(child);`.
- El constructor mostrado asigna grado 0 a cada raíz: el mínimo 3 no tiene hijos. La colección `circularNodes(removed.child)` está vacía, por lo que el `for (Node child : children)` no entra. La escena ya ha retirado 3, pero atribuye el cambio a otra instrucción.
- Impacto: se inventa una iteración y la relación línea/cambio es falsa. No se afirma que el mínimo extraído o la consolidación final sean incorrectos.
- Corrección propuesta: generar eventos de promoción solo por hijos reales; para cero hijos representar la comprobación del bucle y después la desconexión del mínimo. Si se conserva un paso agregado, etiquetarlo como resumen sin resaltar una instrucción individual.
- Contraste técnico: la extracción promueve los hijos existentes y consolida raíces de igual grado, como describe la [lección de Fibonacci Heaps de MIT](https://ocw.mit.edu/courses/6-854j-advanced-algorithms-fall-2005/13851ef27b7bcf8cbcf91862f0f53dec_fibheaps.pdf). La ejecución ficticia del cuerpo se deduce del ejemplo concreto, no de una prueba de invariantes completa.

### AUD-014

- Código: `src/data/specialTreesCpp.js:57–60` y `:428–435`. Los generadores empiezan directamente con `class Trie` y `class MerkleTree`; ambos usan `std::string`. `src/data/beginnerCpp.js` y las funciones de inicialización no añaden esa cabecera.
- Reproducción en navegador: seleccionar C++ en `https://www.dsalab.dev/trie` y `https://www.dsalab.dev/merkle-tree`. El primer renglón visible es la declaración de la clase. Trie usa `const std::string&` en `insertWord`; Merkle declara además `std::string* blocks` y reserva `new std::string[CAPACITY]`.
- Impacto: en un archivo nuevo, sin cabeceras previas o precompiladas aportadas por el usuario, falta la declaración/definición de la clase de biblioteca. No se ejecutó un compilador: es una comprobación manual de las dependencias del código mostrado, no un resultado de compilación observado.
- Corrección propuesta: emitir `#include <string>` al comienzo de ambos ejemplos, independientemente de la operación seleccionada. No exige reemplazar los arreglos ni los punteros dinámicos.
- Referencia primaria: el [borrador del estándar C++, sinopsis de `<string>`](https://eel.is/c++draft/string.syn) declara `basic_string` y el alias `std::string` en esa cabecera.

### AUD-015

- Código: `src/logic/merkle.js:1–10` usa un hash polinómico de 32 bits y reconoce su carácter no criptográfico en un comentario interno. `src/data/educationalDescriptions.js:309–316` afirma que cambiar un dato modifica todos los hashes y que el árbol demuestra integridad, sin distinguir la limitación de este ejemplo. La escena se construye en `src/components/Visualizer.jsx:1183–1210`.
- Reproducción manual en navegador: en Merkle, vaciar el ejemplo, agregar únicamente `Aa` y observar raíz `0x00002287`; vaciar, agregar únicamente `BB` y observar la misma raíz `0x00002287`. Son entradas distintas aceptadas por la interfaz. El resultado se leyó al completar ambas operaciones, no durante una transición.
- Cálculo de escritorio: `7·31² + 65·31 + 97 = 7·31² + 66·31 + 66 = 8839`. Sustituir uno por otro tampoco cambia los ancestros que combinan ese hash con los mismos hermanos.
- Impacto: explicación didáctica demasiado fuerte para la implementación. **No es evidencia de una vulnerabilidad del backend, fuga de datos o fallo de autenticación de DSA Lab**; es el riesgo de presentar esta demostración como un verificador seguro.
- Corrección propuesta: mostrar junto a la visualización y la guía que se usa un hash sencillo para enseñar la estructura, no apto para verificar integridad de seguridad; aclarar que pueden existir colisiones. Si se quiere una demostración de integridad criptográfica, tratarla como una variante separada y sincronizar función y codificación en Java, C++ y simulación.
- Contraste: [NIST define la resistencia a colisiones](https://csrc.nist.gov/glossary/term/collision_resistance) por la dificultad computacional de encontrar entradas distintas con el mismo hash, no por la imposibilidad absoluta de que existan colisiones.

### AUD-016

- Código: `src/logic/operations.js:3153–3161` elimina la celda del estado y publica `count: after.length` en el evento `previousColumn.up = target.up;`. `src/data/matrixCpp.js`, operación `matrix-remove`, ejecuta después `delete target;`, `nonZeroCount--;` y el retorno. El generador de fotogramas pasa de la desconexión de ACOL directamente al retorno final.
- Reproducción en navegador: `https://www.dsalab.dev/matriz-dispersa`, C++, ejemplo inicial de 10 celdas, eliminar fila 0 / columna 4 (valor 3). Tras terminar, retroceder una vez: paso 4, línea 147 `previousColumn->up = target->up;`, panel `noCeros = 9`. Las líneas 148 y 149 aún son `delete target;` y `nonZeroCount--;`; el paso 5 ya es el retorno.
- Impacto: se adelanta el cambio del contador y no se puede observar cuándo se libera el nodo C++. Los enlaces finales y las 9 celdas restantes son coherentes en este caso; no se registra como un error del resultado de eliminación.
- Corrección propuesta: mantener el contador en 10 al desconectar la columna; emitir un evento C++ de liberación del nodo, otro de decremento con 9, y finalmente el retorno. Distinguir nodo desconectado de nodo liberado, sin mantener aristas que apunten a memoria liberada.

## Cuarta pasada: inventario completo y cobertura real

Resultado acumulado: **16 hallazgos abiertos**, cuatro nuevos en esta pasada (AUD-013 a AUD-016). AUD-012 pasa de comprobación por lectura a reproducción en navegador. No se corrigió código de la aplicación.

Se repasó el inventario de **86 temas**, sus grupos y rutas de operación. Esto **no equivale** a ejecutar todas las combinaciones de acciones, lenguajes, entradas y animaciones. La cobertura se distingue abajo para evitar presentar una lectura de catálogo como una prueba visual completa.

| Grupo | Temas incluidos en el inventario | Profundidad de esta pasada |
| --- | --- | --- |
| Lineales (9) | Array, Pila, Cola, Deque, lista simple, lista doble, circular simple, circular doble, Skip List | Lectura de rutas, validación, inicialización y sincronización compartida. Reproducción interactiva específica de lista simple; las otras ocho no tuvieron un recorrido visual completo nuevo. |
| Árboles (23) | General, N-ario, binario, enhebrado, BST, AVL, rojo-negro, Splay, Heap binario, Fibonacci Heap, Trie, trie de sufijos, Segment, Fenwick, B, B+, B*, Merkle, KD, QuadTree, Octree, expresión, AST | Lectura dirigida de modelos, ejemplos y adaptadores. Más detalle en Fibonacci, rojo-negro, enhebrado, multicamino, partición espacial, prefijos y rangos. Navegador: Fibonacci, Trie y Merkle. No se afirma que las 23 escenas se hayan probado exhaustivamente. |
| Hashing (3) | Hash Table, Open Addressing, Separate Chaining | Rutas de guardar/buscar/eliminar, tratamiento de colisiones, casillas borradas y ejemplos Java/C++. Sin nueva reproducción visual de los tres. |
| Grafos (8) | Grafo, dirigido, DFS, BFS, Dijkstra, A*, Prim, Kruskal | Repaso de catálogo y rutas de ejecución; contraste con los hallazgos de BFS, Prim y mapas ya registrados. La reproducción de Dijkstra corresponde a la tercera pasada, no a esta. |
| Recursión (3) | Fibonacci, Factorial, Hanoi | Lectura de límites, casos base, llamadas/retornos y ejemplos C++. Se conserva AUD-006. Sin nueva ejecución visual de las tres. |
| Ordenamientos (10) | Bubble, Selection, Insertion, Merge, Quick, Shell, Heap, Counting, Radix, Bogo | Lectura de generadores de traza y fuentes; repasados comparación, intercambio, auxiliares, límites de Counting y corte de Bogo. Se conservan AUD-010/011. No se ejecutaron todas las entradas posibles ni las diez pantallas. |
| Backtracking (3) | N-Reinas, Laberinto, Sudoku | Lectura de validación, elección/deshacer, límites de traza y salida por solución o falta de ella. Sin prueba visual completa nueva. |
| Otros (7) | Matriz, polinomios, listas generalizadas, matriz poco poblada, Union-Find, LRU, Bloom Filter | Lectura de almacenamiento, recorridos, operaciones y ejemplos. Navegador: eliminación de matriz poco poblada. No se infiere aprobación de los otros casos por ausencia de hallazgo nuevo. |
| Fundamentos (20) | Estructuras de datos, complejidad, POO y las 17 lecciones de `foundationCatalog.js` | Inventario y lectura del catálogo; son páginas teóricas, no 20 algoritmos con traza. No se auditó de nuevo cada párrafo y ejemplo de las lecciones completas. |

### Precisiones y sospechas descartadas

- Skip List avisa en pantalla que los niveles son ilustrativos y pueden diferir de Java/C++. La inicialización a nivel cero y las alturas ilustrativas no se contaron como un nuevo fallo oculto de sincronización. Queda pendiente verificar si se quiere evolucionar esa variante a una representación exacta; eso sería una decisión de producto.
- No se registra que Hash Open pierda las casillas borradas: `algorithm.hashTable` se transmite al ejemplo y al modelo.
- No se registra falta de alias para `Math.abs` en N-Reinas C++: el mapeo existe.
- No se confundió el contador ordinal de mezcla de Bogo con una prueba suficiente de fallo de su contador local `attempts`; no se añadió un hallazgo sin reproducción concluyente.
- Las guías de revisión de interfaz se usaron para contrastar estados y significado del resaltado con `DESIGN.md` y `UX-CONTRACT.md`. No se aplicó un rediseño ni sus comandos de auditoría automática, por el alcance manual solicitado.
- No se ejecutó npm, suites, compiladores ni código de los algoritmos mediante consola. Sí se leyeron archivos y se interactuó manualmente con la aplicación publicada. El commit del despliegue no se comparó con el local; las discrepancias nuevas descritas tienen evidencia en ambas superficies.

### Pendiente para una validación exhaustiva

Completar una matriz por operación: vacío, un elemento, duplicado, inexistente, extremos de enteros, límites de tamaño, operación encadenada, Java/C++/pseudocódigo, español/inglés y reproducción pausada. Revisar también posiciones, contraste y enlaces con captura visual en móvil/escritorio. No declarar «todo correcto» hasta completar esos casos y corregir/reprobar los hallazgos abiertos.

## Tercera pasada: cobertura y resultado

- Se añadieron cinco hallazgos nuevos: AUD-008 a AUD-012. Total registrado: **12**, sin aplicar correcciones.
- Verificación interactiva real en producción: Dijkstra (ejecución, pausa y avance individual) y Heap (extracción con datos iniciales, pausa y avance individual). Los dos defectos observados también están respaldados por la lectura del código local. No se comprobó que el despliegue corresponda exactamente al commit local.
- Lectura dirigida adicional: trazas de Merge/Radix, mapeador C++, finalización de eliminación en lista simple y comparación de hijos del heap. No se encontró un nuevo error de ordenación en las ramas de Shell y Counting inspeccionadas; esto no equivale a validar todos sus casos.
- Se descartó expresamente la sospecha de que Radix C++ careciera de mapeo de líneas: `radixNeedles` existe. Se conserva únicamente la discrepancia de secuencia descrita en AUD-011.
- No se ejecutaron npm, compilaciones ni suites automáticas. Solo se actualizó este documento. Queda pendiente el recorrido visual completo de las demás estructuras y sus casos límite.

## Segunda pasada: alcance y precisión

- Se confirmó que `src/App.jsx:505` obtiene el pseudocódigo visible mediante `getOperationPseudocode`; BFS, Hanoi y Prim llegan a las plantillas citadas, sin una variante específica que repare estas omisiones.
- Importante para AUD-001, AUD-003 y AUD-004: son inconsistencias en los datos del catálogo. No deben confundirse con fallos reproducidos en el panel de código actual. En particular, las operaciones LRU sí tienen plantillas específicas correctas. La lectura de `algorithm.code` encontrada en `sectionTests.js` extrae la primera línea; falta comprobar cualquier otro uso externo antes de atribuir impacto visual al ejemplo completo del catálogo.
- Esta pasada fue lectura manual y seguimiento de casos de escritorio, no una ejecución en el navegador. No certifica posiciones, enlaces renderizados ni tiempos reales de animación. No se ejecutaron npm ni suites automáticas y no se corrigió código de producción.

## Verificación cruzada y pendientes

- La ficha de Skip List distingue correctamente niveles fijos O(n) de niveles escalables con coste esperado O(log n), coherente con las [notas de MIT](https://ocw.mit.edu/courses/6-046j-introduction-to-algorithms-sma-5503-fall-2005/c69eacf7b8344572d9ced8efff02f2b3_l12_skiplists.pdf).
- Se inspeccionaron las rutas de operaciones y fotogramas de Hash Table, Array/Deque, ordenamientos, árboles y pseudocódigo. Esto todavía **no** equivale a una comprobación exhaustiva de cada interacción visual.
- Revisión dirigida adicional: Bubble, Selection e Insertion Sort mantienen, en las ramas inspeccionadas, el orden de comparaciones, intercambios y escritura de valores respecto al Java mostrado. No se registra fallo nuevo allí sin una reproducción concreta. LRU Cache coincide entre simulación, Java y C++; su ficha inicial no.
- Pendiente: recorrer cada estructura con operaciones normales, límites, vacío, duplicados, Java/C++/pseudocódigo, y verificar paso a paso valores, enlaces, variables y línea activa. Registrar nuevos hallazgos aquí con reproducción concreta.
