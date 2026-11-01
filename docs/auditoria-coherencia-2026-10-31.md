# Registro de discrepancias de código y sincronización

Fecha: 31 de octubre de 2026 (America/Santiago).

Alcance: código Java/C++, pseudocódigo, condiciones, bucles, variables y animación.
Este registro conserva los cinco hallazgos confirmados en la revisión anterior.
La continuación añade seis hallazgos confirmados: once registrados en total.
Guardar un hallazgo no significa corregirlo. No se ejecutó `npm run test`.

## Resumen de los cinco hallazgos conservados

| ID | Prioridad | Estado | Hallazgo |
| --- | --- | --- | --- |
| SYN-001 | P1 | Corregido; verificación dirigida aprobada | Buscar con pseudocódigo lanza una excepción en tres árboles |
| SYN-002 | P2 | Corregido; verificación dirigida aprobada | Eliminar la cabeza circular C++ conserva el tamaño anterior |
| SYN-003 | P2 | Corregido; verificación dirigida aprobada | Desenlazar un nodo circular C++ cambia la identidad mostrada de current |
| SYN-004 | P2 | Corregido; verificación dirigida aprobada | Insertar en matriz dispersa reasigna visualmente punteros que el código no modifica |
| SYN-005 | P2 | Corregido; verificación dirigida aprobada | Insertar cero en matriz dispersa anima la rama de inserción equivocada |

## SYN-001 — Excepción al buscar con pseudocódigo

- Estructuras: Árbol general, Árbol N-ario y Árbol binario.
- Reproducción: seleccionar Pseudocódigo y buscar la raíz existente.
- Observado: `TypeError: Cannot read properties of undefined (reading 'text')`;
  no se prepara la nueva animación.
- Esperado: una traza propia del pseudocódigo o un resumen explícito sin línea activa;
  nunca una excepción por no encontrar sintaxis Java/C++.
- Causa: `createUnorderedTreeFindFrames` obtiene `methodStart = -1` y llama a
  `blockEnd` antes de comprobarlo.
- Ubicación: [codeAnimation.js](../src/logic/codeAnimation.js),
  `createUnorderedTreeFindFrames`, llamada a `blockEnd` (línea 1837 al registrar).
- Solución propuesta: validar el inicio del método y tratar el pseudocódigo mediante
  un resumen cuando no exista un sincronizador semántico específico.
- Criterio de cierre: búsquedas presentes/ausentes y árbol vacío, en los tres formatos,
  sin excepción ni resaltado inventado.

## SYN-002 — Tamaño final incorrecto al eliminar la cabeza circular C++

- Estructura/operación: Lista circular simple, C++, Eliminar valor.
- Reproducción: `[10,20,30]`, eliminar `10`; también `[10]`, eliminar `10`.
- Observado: los valores finales son `[20,30]` pero `size=3`; en el caso unitario
  la lista queda vacía con `size=1`.
- Verificación visual adicional: el ejemplo `[3,7,11,18]`, eliminar `3`, muestra
  tres nodos y conserva `size=4` en Variables en tiempo real.
- Esperado: `size=2`, `size=0` y `size=3`, respectivamente.
- Causa: la traza finaliza en `if (current == head) return removeFromStart();`
  sin aplicar a `logicalSize` el decremento realizado por el auxiliar.
- Ubicación: [codeAnimation.js](../src/logic/codeAnimation.js), rama C++ de
  `createLinkedListSynchronizedFrames` (línea 1195 al registrar).
- Solución propuesta: trazar el auxiliar o actualizar su resultado lógico al retornar.
- Criterio de cierre: cabeza en lista vacía/unitaria/múltiple; valores, head y size
  coherentes en el último paso y al avanzar/retroceder.

## SYN-003 — Identidad incorrecta de current durante el desenlace circular C++

- Estructura/operación: Lista circular simple, C++, Eliminar valor.
- Reproducción: `[10,20,30]`, eliminar `20`.
- Observado: los pasos `previous->next = current->next` y `delete current`
  muestran `current=10`, aunque el puntero real señala el nodo `20` hasta liberarlo.
- Esperado: conservar la identidad del nodo retirado al desenlazarlo y no representar
  después un puntero liberado como si apuntara al predecesor.
- Causa: las variables se deducen del arreglo ya compactado usando `index-1`.
- Ubicación: [codeAnimation.js](../src/logic/codeAnimation.js), fotogramas de
  desenlace y liberación (líneas 1197–1198 al registrar).
- Solución propuesta: separar identidad del puntero, índice visual y estado de memoria;
  conservar `pointerValue` y representar explícitamente la liberación.
- Criterio de cierre: eliminar un nodo intermedio y el último; current conserva la
  identidad correcta y no se simula una desreferencia después de `delete`.

## SYN-004 — Punteros visualmente reasignados al insertar en matriz poco poblada

- Formatos: Java y C++.
- Reproducción: ejemplo predeterminado; insertar `9` en fila `0`, columna `0`.
- Observado: el recorrido acaba con `currentRow=AROW[0]` y `currentColumn=ACOL[0]`,
  pero los pasos de enlace y el final los muestran apuntando al nodo nuevo.
- Esperado: los punteros actuales conservan sus destinos; `newNode` es otra variable.
  Las asignaciones `previousRow.left = newNode` y `previousColumn.up = newNode`
  no reasignan `currentRow` ni `currentColumn`.
- Ubicación: [operations.js](../src/logic/operations.js),
  `executeSparseMatrixOperation`, fases `link-row`, `link-column` y finalización
  (líneas 3220, 3229 y entorno de 2941 al registrar).
- Solución propuesta: mantener los destinos de búsqueda y mostrar newNode por separado.
- Criterio de cierre: insertar antes, entre y después de nodos existentes; distinguir
  enlaces modificados, variables locales y nodo activo en ambos formatos.

## SYN-005 — Rama y bucle equivocados al insertar cero en matriz poco poblada

- Formatos: Java y C++.
- Reproducción: ejemplo predeterminado; insertar `0` en fila `0`, columna `0`,
  donde no existe un nodo.
- Observado: la traza resalta dos avances `currentRow = currentRow.left` del método
  de inserción y después retorna; omite la llamada a eliminación. El retorno C++
  queda además sin correspondencia exacta.
- Esperado: evaluar `value == 0`, ejecutar `remove(row,column)` y retornar antes
  de declarar o recorrer los punteros de la inserción.
- Causa: se generan los recorridos de `baseFrames` antes de elegir la rama cero.
- Ubicación: [operations.js](../src/logic/operations.js), construcción de
  `baseFrames` y rama `value === 0` (líneas 3059 y 3145 al registrar).
- Solución propuesta: decidir primero la rama y trazar la eliminación y su retorno real.
- Criterio de cierre: cero en celda existente/inexistente, Java/C++; no se ejecutan
  líneas de la rama descartada y los estados finales coinciden.

## Hallazgos nuevos de la continuación

| ID | Prioridad | Estado | Hallazgo |
| --- | --- | --- | --- |
| SYN-006 | P2 | Corregido; verificación dirigida aprobada | Trazas C++ de índices continúan después de retornos delegados |
| SYN-007 | P2 | Corregido; verificación dirigida aprobada | La eliminación en lista doble hace reaparecer un nodo entre pasos |
| SYN-008 | P2 | Corregido; verificación dirigida aprobada | La inserción circular C++ resalta el retorno de una rama falsa |
| SYN-009 | P2 | Corregido; verificación dirigida aprobada | La suma de polinomios resalta instrucciones de otra rama |
| SYN-010 | P2 | Corregido; verificación dirigida aprobada | El modo desafío propone inserciones fuera del rango int32 |
| SYN-011 | P2 | Corregido; verificación dirigida aprobada | Laberinto simula una política de revisitas distinta de Java/C++ |

### SYN-006 — Continuación visual después de un retorno delegado C++

Estado actualizado: corregido para las llamadas delegadas de índices en extremos.
La traza respeta el retorno del llamador y presenta el auxiliar como resumen explícito
sin línea activa. No pretende una traza interna exacta del auxiliar. Se verificaron
eliminación de índice cero y las inserciones delegadas, incluidos vacío y un nodo.
Prueba: `tests/regressions/list-delegation-state.test.mjs`.
La ordenación interna de una inserción intermedia no delegada no forma parte de este cierre.

- Reproducción: `[10,20,30]`, eliminar índice `0` en Lista simple, Lista circular
  simple o Lista circular doble, con C++ seleccionado.
- Observado: se resaltan instrucciones locales posteriores como `for`, modificaciones
  de enlaces, `size--` o `return true`, aunque `if (index == 0) return removeFromStart()`
  ya devuelve el control desde el método principal.
- También afecta a inserciones circulares que delegan a `addAtStart`/`addAtEnd`.
  En una inserción intermedia, la secuencia Java puede incluso adelantar la creación
  de newNode respecto al recorrido que la precede en C++.
- Esperado: seguir el auxiliar invocado y retornar sin ejecutar el resto de esa llamada.
- Ubicación: [codeAnimation.js](../src/logic/codeAnimation.js), ramas `add-index`
  y `remove-index` del sincronizador de listas (entorno de líneas 958 y 1104).
- Solución propuesta: modelar las ramas y delegaciones propias de C++, no reutilizar
  sin adaptación el orden de sentencias Java.
- Criterio de cierre: índices inicial/intermedio/final de las cuatro listas, ambos
  lenguajes; ningún paso del método principal después de un retorno inmediato.
- Es distinto de SYN-002: aquí se ejecutan visualmente sentencias inalcanzables en
  otra operación, no solo se conserva un contador después de eliminar por valor.

### SYN-007 — Un nodo eliminado reaparece durante una condición

Estado actualizado: corregido. Las condiciones posteriores a cambiar enlaces reciben
el snapshot actualizado, conservando aparte la identidad de current cuando procede.
Se verificaron eliminar inicio e índice cero en Java/C++, con uno y varios nodos,
comprobando que ningún fotograma posterior restaure el snapshot original.
Prueba: `tests/regressions/list-delegation-state.test.mjs`.

- Formatos: Java y C++, Lista doble.
- Reproducción: `[10,20,30]`, eliminar inicio; también eliminar índice `0`.
- Observado: `head = head.next` muestra `[20,30]`, el siguiente `if (head != null)`
  vuelve a `[10,20,30]` y la siguiente mutación vuelve a `[20,30]`.
- Esperado: una condición no revierte la mutación ya realizada.
- Ubicación: [codeAnimation.js](../src/logic/codeAnimation.js), condiciones posteriores
  a modificar head/current (líneas 1037 y 1153 al registrar).
- Causa: `conditionFrame` usa por defecto `beforeValues`, no el estado visible actual.
- Solución propuesta: conservar el snapshot actualizado en las condiciones; separar
  la identidad de los punteros de las posiciones del arreglo compactado.
- Criterio de cierre: avanzar y retroceder por eliminar inicio/índice cero, con uno y
  varios nodos; solo las operaciones reales pueden cambiar los datos mostrados.

### SYN-008 — Retorno final dentro de una rama falsa

Estado actualizado: corregido. La inserción C++ no delegada resuelve el retorno
posterior a su propio incremento de size, dentro del método seleccionado. Se conservan
los retornos específicos de las ramas delegadas de los extremos. Se verificaron todos
los índices válidos de listas vacías, unitarias y de tres nodos, en ambas circulares.
Prueba: `tests/regressions/list-delegation-state.test.mjs`.

- Formato/operación: C++, Lista circular simple y Lista circular doble, insertar en índice.
- Reproducción: `[10,20,30]`, insertar `99` en índice `1`.
- Observado: el último paso resalta el primer `return true`, dentro de `if(index == 0)`,
  aunque el índice es 1. En circular simple corresponde a la línea generada 35, no 44;
  en circular doble, 39 en vez de 54, para ese fixture.
- Esperado: el retorno al final de la rama efectivamente ejecutada.
- Ubicación: [codeAnimation.js](../src/logic/codeAnimation.js),
  `finishSuccessfulOperation`, búsqueda de `/return true;/` (entorno de línea 808).
- Solución propuesta: identificar el retorno por método y rama, no su primera coincidencia.
- Criterio de cierre: índices cero/intermedio/tamaño; el retorno resaltado pertenece
  a la ruta tomada y no a un bloque descartado.

### SYN-009 — Instrucciones repetidas de la suma de polinomios

Estado actualizado: corregido. Los eventos identifican el auxiliar add y la ocurrencia
de la instrucción en la rama ejecutada. El adaptador permite resolver ocurrencias
dentro de ese método, fuera del bloque de la operación seleccionada, y no usa una
coincidencia ajena si falta el auxiliar. Se comprobaron las cinco ramas, cancelaciones,
operandos vacíos y exponentes intercalados en Java/C++.
Prueba: `tests/regressions/polynomial-branch-mapping.test.mjs`.

- Formatos: Java y C++.
- Reproducción: `A = 2x^14`, `B = 3x^8`, sumar polinomios.
- Observado: se toma la rama `p.exponent > q.exponent`, pero `end = end.next`,
  `p = p.next` y el avance restante de q se resuelven a sus primeras apariciones,
  dentro de la rama de exponentes iguales.
- Esperado: resaltar cada instrucción en la rama que realmente la ejecuta.
- Ubicación: [codeAnimation.js](../src/logic/codeAnimation.js), resolución y caché
  de `codeNeedle` (entorno de 2084); [operations.js](../src/logic/operations.js),
  eventos de suma (entorno de 2295, 2323 y 2341).
- Solución propuesta: identificar auxiliar, rama y ocurrencia de cada instrucción.
  El `codeOccurrence` actual solo busca dentro del bloque seleccionado y no basta
  por sí solo para el método auxiliar `add()` externo a ese bloque.
- Criterio de cierre: exponentes iguales/mayores/menores, cancelación y restos de
  ambos operandos; cada paso queda en su rama real, en Java y C++.

### SYN-010 — Desafío con inserción imposible por límite numérico

Estado actualizado: corregido. El generador conserva los candidatos dentro de int32;
al alcanzar un extremo continúa por el otro y evita los valores ya ocupados. Se
verificaron 252 casos de Array/Pila/Cola y 24 de BST/AVL con extremos numéricos,
operandos vacíos, valores ocupados y límites de capacidad. Además, la auditoría de
desafíos verificó 810 acciones y sus respuestas en 66 estructuras.
Prueba: `tests/regressions/challenge-int32.test.mjs` y `scripts/audit-challenges.mjs`.

- Estructuras: Array, Pila y Cola.
- Reproducción: estado `[2147483647]`, crear desafío con intento 0.
- Observado: propone insertar `2147483648` mediante add-end/Push/Enqueue y ofrece
  una respuesta correcta para esa inserción; al comprobarla, executeOperation rechaza
  el valor por exceder int32.
- Esperado: que el desafío proponga una operación admitida por el mismo validador.
- Ubicación: [challenges.js](../src/logic/challenges.js), `nextUniqueValue` (línea 59),
  factories de Array/Pila/Cola (líneas 93, 120 y 146 al registrar).
- Solución propuesta: elegir valores únicos dentro de int32 y validar la acción
  generada antes de presentarla; si no procede insertar, elegir otra acción válida.
- Criterio de cierre: extremos INT_MIN/INT_MAX, vacío y límites de capacidad; todas
  las acciones propuestas pasan la validación y producen el resultado anunciado.

### SYN-011 — Laberinto discrepa sobre volver a una celda descartada

- Formatos: Java y C++; distinto del pendiente de inicialización de sus ejemplos.
- Reproducción con un mapa alcanzable por Nuevo ejemplo:

  ```js
  const maze = [
    0,1,0,1,1,0,
    0,1,1,1,0,1,
    0,0,0,1,0,0,
    1,0,0,0,0,0,
    1,0,0,0,1,1,
    0,1,1,0,0,0,
  ];
  ```

- Ejecutar solve con ese arreglo produce 140 fotogramas. En el fotograma 92
  (índice base cero), `(2,4)` se desmarca y su estado visual pasa a 3. En el 105,
  isFree vuelve a consultar `(2,4)` y el simulador dice false.
- Sin embargo, Java/C++ conservan el muro original `maze[2][4] == 0` y han hecho
  `path[2][4] = false`; su isFree devolvería true y exploraría de nuevo esa celda.
- Causa: el simulador calcula disponibilidad con `maze[position] === 0` y reutiliza
  ese mismo arreglo para la marca decorativa de callejón sin salida (valor 3).
- Ubicación: [operations.js](../src/logic/operations.js), `solveMazeWithTrace`,
  disponibilidad y retroceso (líneas 1940 y 1996); [beginnerJava.js](../src/data/beginnerJava.js)
  (isFree, entorno de 807); [backtrackingCpp.js](../src/data/backtrackingCpp.js) (línea 93).
- Solución propuesta: separar muros, camino activo y marcas visuales. Si se desea
  una variante con visitados permanentes, también debe aparecer en el código mostrado.
- Criterio de cierre: mapas con ciclos y callejones, con/sin solución; mismas decisiones
  de isFree y mismas rutas de recursión entre simulador y código.

## Pendiente previo independiente

Sigue pendiente completar la inicialización de algunos ejemplos completos para que
usen los mismos datos que la simulación. Heap C++ ya fue ajustado. Este pendiente
amplio no se cuenta como uno de los cinco hallazgos conservados arriba.

## Continuación de la revisión

Los hallazgos nuevos se añaden con identificadores posteriores, sin renumerar ni
repetir SYN-001 a SYN-005. Las hipótesis sin reproducción confirmada no cuentan como
discrepancias. Un resumen etiquetado o una línea declarada sin correspondencia no se
consideran, por sí solos, una ejecución inventada.

En la continuación de diagnóstico solo se editó este registro. La verificación usó casos dirigidos
con las funciones reales de operación, generadores de código y sincronizadores; no
se modificó código de aplicación ni se ejecutó `npm run test`. No equivale a una
certificación exhaustiva de ausencia de errores en todo el catálogo.

Posteriormente el usuario autorizó corregir los puntos 1 y 2 de la última lista,
correspondientes a SYN-006 y SYN-007. Se modificaron el sincronizador y sus regresiones;
los cinco hallazgos originales y los demás hallazgos nuevos no se dan por corregidos.

En la siguiente intervención el usuario autorizó también el punto 3, SYN-008.
Quedan corregidos SYN-006, SYN-007 y SYN-008; los otros ocho hallazgos registrados
siguen pendientes, además del pendiente general de inicialización de ejemplos.

Después se autorizó y corrigió el punto 4, SYN-009. El estado actual es cuatro
hallazgos corregidos (SYN-006 a SYN-009) y siete pendientes (SYN-001 a SYN-005,
SYN-010 y SYN-011), más el pendiente general de inicialización de ejemplos.

Después se autorizó y corrigió el punto 5, SYN-010. Quedan corregidos SYN-006 a
SYN-010; siguen pendientes los cinco originales (SYN-001 a SYN-005), SYN-011 y el
pendiente general de inicialización de ejemplos.

## Cierre de los seis hallazgos restantes — 1 de noviembre de 2026

Se corrigieron SYN-001 a SYN-005 y SYN-011. La búsqueda en pseudocódigo usa un
resumen seguro; la eliminación circular conserva el tamaño y la identidad de current
hasta liberar el nodo, y después lo marca como liberado. Los enlaces de la matriz
dispersa conservan los punteros del recorrido y muestran newNode por separado;
la rama cero llama a remove sin ejecutar recorridos de inserción.

Laberinto vuelve a aceptar celdas desmarcadas, como Java/C++. Para evitar bloquear
la interfaz en ciclos costosos, la visualización tiene un presupuesto de pasos:
si se agota, conserva la entrada y comunica que la búsqueda fue interrumpida, sin
afirmar que el laberinto carezca de solución.

Verificación dirigida: `tests/regressions/remaining-sync-review.test.mjs`.
Los once hallazgos registrados quedan corregidos; el pendiente amplio de
inicialización de otros ejemplos completos NO se da por cerrado.

## Revisión cruzada de animación, variables y código visible — 1 de noviembre de 2026

La revisión recorrió los 86 temas del catálogo, sus 310 acciones y 3100 casos
funcionales, además de compilación y ejecución nativa. El barrido de producción
ejercitó 196 pruebas en escritorio y móvil; la corrida inicial encontró seis
fallos y la corrida dirigida posterior confirmó corregidos los cinco casos activos
(los otros cuatro seleccionados eran omisiones intencionales para móvil).

### SYN-012 — Variables de Hanoi C++ mostraban nombres Java

Estado: corregido. La traza compartida mostraba `disks` y las torres con nombres
Java mientras resaltaba `hanoi(int amount, int from[], int& fromSize, ...)` en C++.
La proyección C++ ahora muestra `amount`, los arreglos `from`/`to`/`help`, sus
referencias de tamaño y los campos `diskCount`/`sourceSize`/`auxiliarySize`/
`targetSize` en la validación y el retorno final. Una regresión comprueba los
valores al primer movimiento, al finalizar y cuando se intenta resolver por segunda
vez. Prueba: `tests/regressions/audit-findings-fixes.test.mjs`.

### SYN-013 — Constructor C++ de Array no usaba la capacidad declarada

Estado: corregido. Al inyectar el ejemplo visible, el constructor reemplazaba
`new int[CAPACITY]` por `new int[100]`, aunque `CAPACITY` ya estaba declarado en la
clase. La generación conserva el nombre de la constante para ejemplos de hasta 100
elementos; ejemplos mayores reservan el tamaño requerido y sincronizan el campo
`capacity`. Pruebas: la auditoría de consistencia de ejemplos y el E2E
`C++ usa punteros y memoria dinámica explícita`.

### SYN-014 — El último fotograma del Laberinto no informaba la resolución

Estado: corregido. La última llamada animada sí devolvía `true`, pero el mensaje
solo decía que la llamada recursiva propagaba ese valor. Ahora el fotograma final
indica que el laberinto quedó resuelto y que el resultado llegó a
`solveMaze(0, 0)`, manteniendo la línea C++/Java que realiza el retorno.
Prueba: E2E `Laberinto mueve el código entre isFree, isExit, recursión y backtracking`.

Las expectativas de otros dos fallos E2E estaban desfasadas respecto del código
real: Union-Find restaura su ejemplo con `resetSets()` sin parámetro, y Counting
Sort obtiene el mínimo con `findMinimum()` mientras Radix usa `countingByDigit()`.
Se actualizaron esas comprobaciones para que verifiquen las funciones realmente
mostradas. También se hizo explícito en las guías que Hash Table usa un arreglo fijo
de 12 casillas, en español e inglés.

Verificación final: `node --test tests/regressions/*.test.mjs` (137 aprobadas),
`node scripts/audit-functions.mjs` (86 temas, 310 acciones, 3100 casos),
`node scripts/compile-cpp-audit.mjs` (310 códigos compilados),
`node scripts/runtime-cpp-audit.mjs` (78 escenarios), y pruebas E2E dirigidas de
guías, Laberinto, punteros C++, reinicios y ordenamientos (6 aprobadas; 4 omitidas
por diseño en móvil). La primera corrida E2E reportó seis fallos: tres hallazgos
de producto/copia (guía Hash Table, mensaje final de Laberinto y reserva inicial
de Array, detectada en ambos viewports) y dos expectativas obsoletas del test
(firma `resetSets` y nombres auxiliares de ordenamiento). Después de corregirlos
o alinear las expectativas, la corrida final completa pasó 173 pruebas y omitió
23 por diseño (cero fallos) en escritorio y móvil.

La revisión cruzada no equivale a certificar formalmente cada posible estado de
cada estructura. Las auditorías cubren todas las acciones del catálogo y casos
dirigidos por estructura; los estados de entrada ilimitados siguen sujetos a los
límites que aplica la interfaz.

La configuración de CI exporta `DSA_EXAMPLE_JAVA` y `DSA_EXAMPLE_CXX`, de modo que
las regresiones nativas de Java/C++ se ejecuten en vez de quedar omitidas.
