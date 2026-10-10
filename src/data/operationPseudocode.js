const lines = (...items) => items.join('\n');

const templates = {
  'add-start': lines('validar que exista espacio', 'desplazar elementos una posición a la derecha', 'guardar valor en la posición 0', 'aumentar tamaño'),
  'add-end': lines('validar que exista espacio', 'guardar valor en la posición tamaño', 'aumentar tamaño'),
  'add-index': lines('validar índice y espacio disponible', 'desplazar a la derecha desde el final hasta índice', 'guardar valor en índice', 'aumentar tamaño'),
  'set-index': lines('validar que índice exista', 'reemplazar el valor de esa posición'),
  'remove-start': lines('validar que la estructura no esté vacía', 'guardar el primer elemento', 'desplazar los demás una posición a la izquierda', 'disminuir tamaño', 'devolver elemento eliminado'),
  'remove-end': lines('validar que la estructura no esté vacía', 'disminuir tamaño', 'devolver el último elemento'),
  'remove-index': lines('validar que índice exista', 'guardar el elemento', 'desplazar a la izquierda desde índice', 'disminuir tamaño', 'devolver elemento eliminado'),
  'remove-value': lines('buscar el valor según la estructura', 'si no existe: devolver falso', 'reconectar o desplazar los elementos necesarios', 'liberar el nodo si corresponde', 'devolver verdadero'),
  find: lines('comenzar en la entrada de la estructura', 'comparar el elemento actual con el objetivo', 'avanzar por el enlace o rama correspondiente', 'devolver posición o indicar que no existe'),
  clear: lines('recorrer los nodos o posiciones ocupadas', 'liberar o desvincular cada elemento', 'establecer tamaño en 0'),
  reset: lines('descartar el estado de la ejecución actual', 'copiar nuevamente los datos iniciales', 'restablecer índices, enlaces y auxiliares'),
  push: lines('validar que la pila tenga espacio', 'aumentar tope', 'guardar el valor en el nuevo tope'),
  pop: lines('validar que la pila no esté vacía', 'guardar el elemento del tope', 'disminuir tope', 'devolver elemento'),
  peek: lines('validar que la estructura no esté vacía', 'devolver la raíz o el elemento del tope sin eliminarlo'),
  enqueue: lines('validar capacidad', 'crear el nuevo nodo', 'enlazarlo después del último', 'actualizar frente y final', 'aumentar tamaño'),
  dequeue: lines('validar que la cola no esté vacía', 'guardar el nodo del frente', 'mover frente al siguiente nodo', 'actualizar final si quedó vacía', 'liberar el nodo y devolver su valor'),
  front: lines('validar que la cola no esté vacía', 'devolver el valor del frente sin eliminarlo'),
  'sorted-add': lines('descender hasta la hoja o posición correcta', 'insertar la clave manteniendo el orden', 'si hay desborde: dividir o redistribuir', 'propagar el separador hacia el padre'),
  'tree-add': lines('comparar el dato con el nodo actual', 'descender recursivamente por la región o rama correcta', 'crear el nodo al llegar a una referencia nula', 'restaurar las propiedades especiales del árbol'),
  'heap-add': lines('agregar el valor en la última hoja del árbol completo', 'compararlo con su padre', 'intercambiar mientras viole la propiedad del heap', 'terminar con el heap restaurado'),
  'heap-extract': lines('guardar la raíz', 'mover la última hoja a la raíz', 'eliminar la última posición', 'comparar con los hijos e intercambiar con el adecuado', 'repetir hasta restaurar el heap'),
  preorder: lines('visitar nodo actual', 'recorrer recursivamente cada hijo en orden'),
  inorder: lines('recorrer subárbol izquierdo', 'visitar nodo actual', 'recorrer subárbol derecho'),
  postorder: lines('recorrer cada hijo', 'visitar nodo actual al regresar'),
  'range-view': lines('buscar la primera hoja', 'recorrer las hojas mediante el enlace siguiente', 'emitir sus claves en orden'),
  'range-update': lines('validar índice', 'actualizar el valor base', 'propagar el cambio por los nodos responsables'),
  'prefix-sum': lines('iniciar acumulador en 0', 'visitar los nodos que cubren el prefijo', 'sumar cada aporte', 'devolver acumulador'),
  'range-min': lines('visitar los nodos que cubren el prefijo', 'comparar sus mínimos', 'devolver el menor valor'),
  'set-word': lines('comenzar en la raíz', 'para cada carácter: calcular su rama', 'crear el nodo si no existe', 'marcar el final de la palabra'),
  'word-find': lines('comenzar en la raíz', 'seguir una rama por cada carácter', 'si falta una rama: no existe', 'comprobar la marca de fin de palabra'),
  'remove-word': lines('buscar recursivamente la palabra', 'desmarcar su final', 'eliminar nodos que ya no compartan prefijos'),
  'hash-put': lines('calcular índice con la función hash', 'resolver colisiones según la tabla', 'actualizar la clave o guardar una entrada nueva'),
  'cache-put': lines('buscar la clave', 'actualizarla o crear un nodo', 'moverla al frente por ser la más reciente', 'si excede capacidad: eliminar la menos reciente'),
  'cache-get': lines('buscar la clave', 'si no existe: indicar fallo', 'mover su nodo al frente', 'devolver el valor'),
  'bloom-add': lines('para cada función hash', 'calcular una posición', 'activar el bit correspondiente'),
  'bloom-check': lines('para cada función hash', 'calcular una posición', 'si algún bit está apagado: no existe', 'si todos están activos: posiblemente existe'),
  'clear-bits': lines('recorrer el arreglo de bits', 'establecer cada bit en falso'),
  'vertex-add': lines('validar que el vértice no exista', 'agregar el vértice', 'ampliar la representación de conexiones'),
  'vertex-remove': lines('localizar el vértice', 'eliminar sus aristas', 'compactar vértices e índices'),
  'edge-add': lines('validar ambos vértices', 'guardar la conexión y su peso', 'guardar también la inversa si el grafo no es dirigido'),
  'edge-remove': lines('localizar ambos vértices', 'eliminar la conexión', 'eliminar también la inversa si corresponde'),
  'bfs-run': lines('encolar el origen y marcarlo visitado', 'mientras la cola no esté vacía', '  desencolar y visitar un vértice', '  encolar sus vecinos aún no visitados'),
  'dfs-run': lines('visitar y marcar el vértice actual', 'para cada vecino no visitado', '  ejecutar DFS recursivamente sobre ese vecino'),
  'prim-run': lines('iniciar el árbol desde un vértice', 'elegir la arista mínima que conecta un vértice nuevo', 'agregarla al árbol', 'repetir hasta conectar todos los vértices'),
  'kruskal-run': lines('ordenar aristas por peso', 'examinar cada arista en ese orden', 'si une componentes distintos: seleccionarla', 'unir ambos componentes'),
  'shortest-path': lines('inicializar costos y predecesores', 'seleccionar el nodo pendiente de menor costo', 'relajar cada vecino válido', 'repetir hasta llegar al destino', 'reconstruir el camino con los predecesores'),
  sort: lines('preparar los límites y auxiliares del algoritmo', 'comparar los elementos indicados por el método', 'mover, contar o intercambiar cuando corresponda', 'repetir hasta que todo el arreglo quede ordenado'),
  shuffle: lines('recorrer desde el último elemento hasta el segundo', 'elegir un índice aleatorio entre 0 y la posición actual', 'intercambiar ambos elementos'),
  calculate: lines('comprobar el caso base', 'crear la llamada recursiva necesaria', 'recibir el resultado de la llamada hija', 'combinar y devolver el resultado'),
  'hanoi-set': lines('validar cantidad de discos', 'colocar los discos de mayor a menor en la torre origen', 'vaciar las torres auxiliar y destino'),
  'hanoi-solve': lines('mover n-1 discos de origen a auxiliar', 'mover el disco mayor al destino', 'mover n-1 discos de auxiliar a destino'),
  solve: lines('probar una decisión válida', 'avanzar mediante una llamada recursiva', 'si alcanza el caso base: éxito', 'si falla: deshacer la decisión y probar otra'),
  'step-solution': lines('seleccionar la siguiente decisión posible', 'validar las restricciones', 'avanzar recursivamente', 'deshacer la decisión si conduce a un bloqueo'),
  union: lines('hallar la raíz de ambos elementos', 'si son iguales: ya están unidos', 'enlazar el árbol de menor rango bajo el otro', 'actualizar rango si eran iguales'),
  'find-root': lines('seguir enlaces de padre hasta la raíz', 'comprimir el camino durante el regreso', 'devolver la raíz'),
  'set-expression': lines('separar operadores y operandos', 'respetar paréntesis y precedencia', 'crear nodos y conectarlos al árbol'),
  evaluate: lines('evaluar recursivamente el hijo izquierdo', 'evaluar recursivamente el hijo derecho', 'aplicar el operador del nodo', 'devolver el resultado'),
  'ast-build': lines('leer la asignación', 'analizar expresión respetando precedencia', 'crear nodos para operadores, identificadores y literales', 'conectar la raíz ASSIGN'),
  'ast-preorder': lines('visitar la etiqueta del nodo', 'recorrer hijo izquierdo', 'recorrer hijo derecho'),
  'ast-clear': lines('liberar recursivamente los nodos del AST', 'establecer raíz en nulo'),
  'merkle-root': lines('calcular el hash de cada bloque', 'combinar hashes por parejas', 'duplicar el último cuando el nivel sea impar', 'repetir hasta obtener un único hash raíz'),
  'matrix-set': lines('validar fila y columna', 'calcular la posición lineal', 'guardar el valor'),
  'matrix-get': lines('validar fila y columna', 'buscar la posición', 'devolver el valor o cero si no existe'),
  'matrix-insert': lines('validar fila y columna', 'buscar un nodo existente en ambas listas', 'actualizarlo o crear un nodo dinámico', 'enlazarlo en AROW y ACOL manteniendo el orden circular inverso'),
  'matrix-remove': lines('buscar el nodo por fila y columna', 'desenlazarlo de AROW', 'desenlazarlo de ACOL', 'liberar su memoria'),
  'matrix-row': lines('entrar por AROW de la fila', 'recorrer circularmente de derecha a izquierda', 'visitar cada nodo hasta volver al inicio'),
  'matrix-column': lines('entrar por ACOL de la columna', 'recorrer circularmente de abajo hacia arriba', 'visitar cada nodo hasta volver al inicio'),
  'matrix-transpose': lines('crear matriz con dimensiones invertidas', 'para cada celda', 'copiar valor intercambiando fila y columna'),
  'matrix-fill': lines('recorrer filas', 'recorrer columnas', 'asignar el valor solicitado a cada celda'),
  'matrix-clear': lines('recorrer las celdas o nodos almacenados', 'liberar o establecer cada valor en cero'),
  'poly-insert-a': lines('buscar el exponente en A', 'sumar coeficientes si ya existe', 'si no existe: insertar término ordenado'),
  'poly-insert-b': lines('buscar el exponente en B', 'sumar coeficientes si ya existe', 'si no existe: insertar término ordenado'),
  'poly-remove-a': lines('buscar el exponente en A', 'reconectar la lista', 'liberar el término'),
  'poly-remove-b': lines('buscar el exponente en B', 'reconectar la lista', 'liberar el término'),
  'poly-add': lines('comparar exponentes de A y B', 'copiar el término de mayor exponente', 'si son iguales: sumar coeficientes', 'avanzar hasta terminar ambas listas'),
  'poly-clear-result': lines('recorrer el polinomio resultado', 'liberar cada término', 'establecer C en nulo'),
  'glist-build': lines('leer el texto carácter por carácter', 'crear átomos y encabezamientos dinámicos', 'usar dlink para bajar y link para avanzar'),
  'glist-head': lines('validar que la lista no esté vacía', 'devolver el primer elemento del nivel actual'),
  'glist-tail': lines('validar que exista un primer elemento', 'devolver la lista que comienza en su siguiente enlace'),
  'glist-length': lines('recorrer únicamente los enlaces del nivel actual', 'contar cada elemento'),
  'glist-depth': lines('calcular recursivamente la profundidad de cada sublista', 'devolver uno más que la mayor profundidad hija'),
  'glist-share': lines('aumentar el contador de referencias', 'devolver la misma raíz compartida'),
  'glist-release': lines('disminuir el contador de referencias', 'si llega a cero: liberar recursivamente la estructura'),
};

function arrayPseudocode(actionId, language) {
  const text = (es, en) => language === 'en' ? en : es;
  const insert = ['add-start', 'add-end', 'add-index'].includes(actionId);
  const remove = ['remove-start', 'remove-end', 'remove-index'].includes(actionId);
  if (actionId === 'set-index') return lines(
    text('n ← longitud de values en Java; size en C++', 'n ← values.length in Java; size in C++'),
    text('si index < 0 o index ≥ n: devolver false', 'if index < 0 or index ≥ n: return false'),
    'values[index] ← value', text('devolver true', 'return true'),
  );
  if (!insert && !remove) return null;
  const indexed = actionId.endsWith('index');
  const atStart = actionId.endsWith('start');
  const position = indexed ? 'index' : atStart ? '0' : insert ? 'n' : 'n - 1';
  const invalidJava = indexed
    ? text(`si index < 0 o index ${insert ? '>' : '≥'} n: devolver values sin modificar`, `if index < 0 or index ${insert ? '>' : '≥'} n: return values unchanged`)
    : text('si n = 0: devolver values sin modificar', 'if n = 0: return values unchanged');
  const invalidCpp = indexed
    ? text(`si index < 0 o index ${insert ? '>' : '≥'} size: devolver false`, `if index < 0 or index ${insert ? '>' : '≥'} size: return false`)
    : text('si size = 0: devolver false', 'if size = 0: return false');
  const javaCopy = insert
    ? text(`copiar values[i] a result[i + 1] si i ≥ ${position}; en caso contrario, a result[i]`, `copy values[i] to result[i + 1] if i ≥ ${position}; otherwise, to result[i]`)
    : text(`copiar todos los elementos a result, omitiendo la posición ${position}`, `copy all elements to result, skipping position ${position}`);
  const cppPosition = indexed ? 'index' : atStart ? '0' : 'size';
  return lines('Java:', '  n ← values.length',
    ...(indexed || remove ? ['  ' + invalidJava] : []),
    `  result ← new int[n ${insert ? '+' : '-'} 1]`, '  ' + javaCopy,
    ...(insert ? [`  result[${position}] ← value`] : []),
    '  ' + text('devolver result: el nuevo arreglo', 'return result: the new array'), '', 'C++:',
    ...(indexed || remove ? ['  ' + invalidCpp] : []),
    ...(insert ? [
      '  ' + text('si size = capacity: reservar el doble, copiar values y liberar el bloque anterior', 'if size = capacity: allocate twice the capacity, copy values and free the old block'),
      ...(atStart || indexed ? ['  ' + text(`desplazar a la derecha desde size hasta ${cppPosition} + 1`, `shift right from size down to ${cppPosition} + 1`)] : []),
      `  values[${cppPosition}] ← value`, '  size++',
    ] : [
      ...(atStart || indexed ? ['  ' + text(`desplazar a la izquierda desde ${cppPosition} hasta size - 2`, `shift left from ${cppPosition} to size - 2`)] : []),
      '  size--',
    ]),
    '  ' + text('devolver true: operación realizada', 'return true: operation succeeded'),
  );
}

function linkedListPseudocode(id, actionId, language) {
  const circular = id.includes('circular');
  const doubly = id.endsWith('doble');
  const text = (es, en) => language === 'en' ? en : es;
  const connect = text('reconectar next de los vecinos', 'reconnect the neighbors through next');
  const repairPrevious = doubly ? [text('reconectar también prev de los vecinos', 'also reconnect the neighbors through prev')] : [];
  const closeCircle = circular ? [text('conservar el cierre del último nodo con head', 'preserve the link from the last node back to head')] : [];
  const release = text('liberar el nodo en C++; desvincularlo en Java', 'free the node in C++; unlink it in Java');
  const empty = text('si head = null: indicar que la lista está vacía', 'if head = null: report that the list is empty');
  const findLast = doubly && circular ? 'last ← head.prev' : text(
    circular ? 'last ← head; recorrer next hasta que last.next = head' : 'last ← head; recorrer next hasta que last.next = null',
    circular ? 'last ← head; follow next until last.next = head' : 'last ← head; follow next until last.next = null',
  );
  const create = text('crear newNode con el valor', 'create newNode with the value');
  const emptyInsert = circular
    ? text(`si head = null: head ← newNode; newNode.next ← newNode${doubly ? '; newNode.prev ← newNode' : ''}; size++; terminar`, `if head = null: head ← newNode; newNode.next ← newNode${doubly ? '; newNode.prev ← newNode' : ''}; size++; finish`)
    : text('si head = null: head ← newNode; size++; terminar', 'if head = null: head ← newNode; size++; finish');
  const methods = {
    'add-start': lines(create, ...(circular ? [emptyInsert, findLast] : []), 'newNode.next ← head',
      ...(doubly ? [circular ? 'newNode.prev ← last; last.next ← newNode; head.prev ← newNode' : text('si head ≠ null: head.prev ← newNode', 'if head ≠ null: head.prev ← newNode')] : circular ? ['last.next ← newNode'] : []),
      'head ← newNode', 'size++'),
    'add-end': lines(create, emptyInsert, findLast, 'last.next ← newNode',
      ...(doubly ? ['newNode.prev ← last'] : []), 'newNode.next ← ' + (circular ? 'head' : 'null'),
      ...(doubly && circular ? ['head.prev ← newNode'] : []), 'size++'),
    'add-index': lines(text('validar 0 ≤ index ≤ size', 'validate 0 ≤ index ≤ size'),
      text('si index = 0: insertar al inicio y terminar', 'if index = 0: insert at start and finish'),
      text('recorrer next hasta previous, en index - 1', 'follow next to previous, at index - 1'), create,
      'newNode.next ← previous.next', ...(doubly ? ['newNode.prev ← previous', text('si previous.next ≠ null: previous.next.prev ← newNode', 'if previous.next ≠ null: previous.next.prev ← newNode')] : []),
      'previous.next ← newNode', 'size++'),
    'remove-start': lines(empty,
      ...(circular ? [text('si head.next = head: liberar o desvincular head; head ← null; size--; terminar', 'if head.next = head: free or unlink head; head ← null; size--; finish'), findLast] : []),
      'removed ← head', 'head ← head.next',
      ...(circular ? ['last.next ← head', ...(doubly ? ['head.prev ← last'] : [])] : doubly ? [text('si head ≠ null: head.prev ← null', 'if head ≠ null: head.prev ← null')] : []), release, 'size--'),
    'remove-end': lines(empty, text('si hay un solo nodo: eliminar al inicio y terminar', 'if there is only one node: remove at start and finish'),
      text('localizar el último nodo y su anterior mediante los enlaces', 'locate the last node and its predecessor through the links'),
      'removed ← last', 'previous.next ← ' + (circular ? 'head' : 'null'),
      ...(doubly && circular ? ['head.prev ← previous'] : []), release, 'size--'),
    'remove-index': lines(text('validar 0 ≤ index < size', 'validate 0 ≤ index < size'),
      text('si index = 0: eliminar al inicio y terminar', 'if index = 0: remove at start and finish'),
      text('recorrer next hasta el nodo del índice y conservar su anterior', 'follow next to the indexed node and retain its predecessor'),
      connect, ...repairPrevious, ...closeCircle, release, 'size--'),
    'remove-value': lines(empty,
      text(circular ? 'buscar la primera coincidencia; detenerse al volver a head' : 'buscar la primera coincidencia; detenerse al llegar a null', circular ? 'find the first match; stop when returning to head' : 'find the first match; stop at null'),
      text('si no existe: devolver falso', 'if it does not exist: return false'),
      text('si es head: eliminar al inicio y terminar', 'if it is head: remove at start and finish'),
      connect, ...repairPrevious, ...closeCircle, release, 'size--', text('devolver verdadero', 'return true')),
    find: lines(text('si head = null: devolver -1', 'if head = null: return -1'), 'current ← head; index ← 0',
      text('comparar current.value con el objetivo; si coincide: devolver index', 'compare current.value with the target; if equal: return index'),
      'current ← current.next; index++',
      text(circular ? 'repetir hasta que current = head' : 'repetir hasta que current = null', circular ? 'repeat until current = head' : 'repeat until current = null'), text('devolver -1', 'return -1')),
    clear: lines(text(circular ? 'recorrer una vuelta completa conservando next antes de retirar cada nodo' : 'recorrer hasta null conservando next antes de retirar cada nodo', circular ? 'traverse one full cycle, retaining next before removing each node' : 'traverse to null, retaining next before removing each node'), release, 'head ← null; size ← 0'),
  };
  return methods[actionId];
}

function skipListPseudocode(actionId, language) {
  const text = (es, en) => language === 'en' ? en : es;
  const search = [
    'current ← head',
    text('para level desde el nivel activo más alto hasta 0:', 'for level from the highest active level down to 0:'),
    text('  mientras current.next[level] ≠ null y current.next[level].value < value: avanzar', '  while current.next[level] ≠ null and current.next[level].value < value: advance'),
  ];
  const predecessors = [...search, '  update[level] ← current', 'candidate ← current.next[0]'];
  const methods = {
    'sorted-add': lines(...predecessors, text('si candidate ≠ null y candidate.value = value: terminar sin insertar', 'if candidate ≠ null and candidate.value = value: finish without inserting'),
      text('elegir newLevel aleatorio dentro del máximo permitido', 'choose a random newLevel within the allowed maximum'),
      text('si newLevel supera el nivel activo: completar update con head y aumentar el nivel activo', 'if newLevel exceeds the active level: fill update with head and raise the active level'),
      text('crear newNode y, para cada nivel de 0 a newLevel:', 'create newNode and, for each level from 0 to newLevel:'),
      '  newNode.next[level] ← update[level].next[level]', '  update[level].next[level] ← newNode', 'size++'),
    'remove-value': lines(...predecessors, text('si candidate = null o candidate.value ≠ value: devolver falso', 'if candidate = null or candidate.value ≠ value: return false'),
      text('en cada nivel que apunta a candidate: enlazar update[level] con candidate.next[level]', 'at each level pointing to candidate: link update[level] to candidate.next[level]'),
      text('liberar candidate en C++; desvincularlo en Java', 'free candidate in C++; unlink it in Java'),
      text('bajar el nivel activo mientras la capa superior esté vacía', 'lower the active level while the top layer is empty'), 'size--', text('devolver verdadero', 'return true')),
    find: lines(...search, 'candidate ← current.next[0]', text('devolver candidate ≠ null y candidate.value = value', 'return candidate ≠ null and candidate.value = value')),
    clear: lines(text('recorrer el nivel 0 y retirar todos los nodos', 'traverse level 0 and remove all nodes'), text('establecer todos los enlaces de head en null', 'set every head link to null'), 'level ← 0; size ← 0'),
  };
  return methods[actionId];
}

function boundedLinearPseudocode(id, actionId, language) {
  const text = (es, en) => language === 'en' ? en : es;
  const result = text('Java: devolver el valor; C++: guardarlo en el parámetro de salida y devolver true', 'Java: return the value; C++: store it in the output parameter and return true');
  const empty = text('si está vacía: Java devuelve null; C++ devuelve false', 'if empty: Java returns null; C++ returns false');
  if (id === 'pila') {
    return {
      push: lines(text('si top = 14: devolver false (capacidad: 15)', 'if top = 14: return false (capacity: 15)'), 'top++', 'values[top] ← value', text('devolver true', 'return true')),
      pop: lines(empty, 'removed ← values[top]', 'values[top] ← 0', 'top--', result),
      peek: lines(empty, text('consultar values[top] sin modificar la pila', 'read values[top] without modifying the stack'), result),
      clear: lines(text('mientras top ≥ 0:', 'while top ≥ 0:'), '  values[top] ← 0', '  top--'),
    }[actionId];
  }
  if (id === 'cola') {
    return {
      enqueue: lines(text('si size = 15: devolver false', 'if size = 15: return false'), text('crear newNode con value y next = null', 'create newNode with value and next = null'),
        text('si rear = null: front ← newNode; rear ← newNode', 'if rear = null: front ← newNode; rear ← newNode'),
        text('en otro caso: rear.next ← newNode; rear ← newNode', 'otherwise: rear.next ← newNode; rear ← newNode'), 'size++', text('devolver true', 'return true')),
      dequeue: lines(empty, 'removed ← front.value', 'oldFront ← front', 'front ← front.next',
        text('en C++: liberar oldFront; en Java, el nodo queda desvinculado', 'in C++: free oldFront; in Java, the node is unlinked'),
        text('si front = null: rear ← null', 'if front = null: rear ← null'), 'size--', result),
      front: lines(empty, text('consultar front.value sin retirar el nodo', 'read front.value without removing the node'), result),
      clear: lines(text('Java: front ← null; rear ← null; size ← 0', 'Java: front ← null; rear ← null; size ← 0'),
        text('C++: recorrer desde front, conservar next y liberar cada nodo', 'C++: traverse from front, retain next and free each node'),
        text('C++: front ← null; rear ← null; size ← 0', 'C++: front ← null; rear ← null; size ← 0')),
    }[actionId];
  }
  if (id === 'deque') {
    const full = text('si size = 100: Java lanza una excepción; C++ devuelve false', 'if size = 100: Java throws an exception; C++ returns false');
    const emptyDeque = text('si size = 0: Java lanza una excepción; C++ devuelve false', 'if size = 0: Java throws an exception; C++ returns false');
    const inserted = text('Java: terminar; C++: devolver true', 'Java: finish; C++: return true');
    return {
      'add-start': lines(full, text('para i desde size hasta 1, descendiendo: values[i] ← values[i - 1]', 'for i from size down to 1: values[i] ← values[i - 1]'), 'values[0] ← value', 'size++', inserted),
      'add-end': lines(full, 'values[size] ← value', 'size++', inserted),
      'remove-start': lines(emptyDeque, 'removed ← values[0]', text('para i desde 0 hasta size - 2: values[i] ← values[i + 1]', 'for i from 0 to size - 2: values[i] ← values[i + 1]'), 'size--', result),
      'remove-end': lines(emptyDeque, 'removed ← values[size - 1]', 'size--', result),
    }[actionId];
  }
  return null;
}

export function getOperationPseudocode(algorithm, actionId, language = 'es') {
  if (['pila', 'cola', 'deque'].includes(algorithm.id)) {
    const source = boundedLinearPseudocode(algorithm.id, actionId, language);
    if (source) return source;
  }
  if (algorithm.id === 'array') {
    const source = arrayPseudocode(actionId, language);
    if (source) return source;
  }
  if (['lista-simple', 'lista-doble', 'lista-circular-simple', 'lista-circular-doble'].includes(algorithm.id)) {
    const source = linkedListPseudocode(algorithm.id, actionId, language);
    if (source) return source;
  }
  if (algorithm.id === 'skip-list') {
    const source = skipListPseudocode(actionId, language);
    if (source) return source;
  }
  return templates[actionId] ?? lines(
    `preparar operación ${actionId} sobre ${algorithm.name}`,
    'validar los datos de entrada',
    'actualizar la estructura respetando sus invariantes',
    'devolver el resultado',
  );
}
