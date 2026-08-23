const numeric = value => Number(value);

function variables(values, entries = {}) {
  return [
    { name: 'size', value: values.length, role: 'size' },
    ...Object.entries(entries)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([name, value]) => ({
        name,
        value: name === 'condición' ? (value ? 'true' : 'false') : value,
        role: name === 'condición' ? (value ? 'true' : 'false') : /^(i|j|end|minIndex|index|root|largest|left|right|gap|position|exp)$/.test(name) ? 'index' : 'value',
      })),
  ];
}

function createTrace(values, edges, algorithmId) {
  const working = [...values];
  const frames = [];
  const fixed = new Set();
  const add = (codeNeedle, message, sortPhase, options = {}) => {
    const length = working.length;
    const rawPosition = options.position ?? options.sortWriteIndex ?? options.sortComparePositions?.[0] ?? 0;
    frames.push({
      values: [...working],
      edges: edges.map(edge => [...edge]),
      position: Math.max(0, Math.min(Math.max(0, length - 1), rawPosition)),
      codeNeedle,
      message,
      sortPhase,
      sortRange: options.sortRange ?? (length ? [0, length - 1] : null),
      sortComparePositions: options.sortComparePositions ?? [],
      sortSwapPositions: options.sortSwapPositions ?? [],
      sortFixedPositions: options.sortFixedPositions ?? [...fixed],
      sortWriteIndex: options.sortWriteIndex ?? null,
      sortAuxValues: options.sortAuxValues,
      sortAuxLabel: options.sortAuxLabel,
      sortGap: options.sortGap,
      sortAttempt: options.sortAttempt,
      variables: variables(working, options.variables),
      delayMs: options.delayMs ?? 360,
      completed: options.completed ?? false,
    });
  };
  const swap = (first, second, phase, context = {}) => {
    add('int temp = values[first];', `temp guarda ${working[first]} del índice ${first}.`, `${phase}-swap-save`, {
      ...context, position: first, sortSwapPositions: [first, second], variables: { ...context.variables, first, second, temp: working[first] },
    });
    const temp = working[first];
    working[first] = working[second];
    add('values[first] = values[second];', `El índice ${first} recibe ${working[first]}.`, `${phase}-swap-first`, {
      ...context, position: first, sortSwapPositions: [first, second], variables: { ...context.variables, first, second, temp },
    });
    working[second] = temp;
    add('values[second] = temp;', `El índice ${second} recibe ${temp}; termina el intercambio.`, `${phase}-swap-complete`, {
      ...context, position: second, sortSwapPositions: [first, second], variables: { ...context.variables, first, second, temp },
    });
  };
  const finish = message => {
    for (let i = 0; i < working.length; i++) fixed.add(i);
    add('return;', message, `${algorithmId}-complete`, { completed: true, delayMs: 500 });
    return { ok: true, values: working, edges, message, step: 0, frames };
  };
  return { working, frames, fixed, add, swap, finish };
}

function bubbleSort(values, edges) {
  const trace = createTrace(values, edges, 'bubble');
  const { working, fixed, add } = trace;
  add('void bubbleSort() {', 'Bubble Sort comienza con todo el arreglo sin ordenar.', 'bubble-start');
  for (let end = working.length - 1; end > 0; end--) {
    add('for (int end = size - 1; end > 0; end--) {', `La pasada comparará los índices 0 a ${end}.`, 'bubble-pass', {
      sortRange: [0, end], variables: { end },
    });
    let changed = false;
    add('boolean changed = false;', `Inicia la pasada que termina en ${end}.`, 'bubble-pass', { sortRange: [0, end], variables: { end, changed } });
    for (let i = 0; i < end; i++) {
      add('for (int i = 0; i < end; i++) {', `i vale ${i}: se revisa el par [${i}, ${i + 1}].`, 'bubble-loop', {
        position: i, sortRange: [0, end], sortComparePositions: [i, i + 1], variables: { end, i, changed },
      });
      const shouldSwap = numeric(working[i]) > numeric(working[i + 1]);
      add('if (values[i] > values[i + 1]) {', `${working[i]} ${shouldSwap ? '>' : '≤'} ${working[i + 1]}: ${shouldSwap ? 'se intercambian' : 'ya están en orden'}.`, 'bubble-compare', {
        position: i, sortRange: [0, end], sortComparePositions: [i, i + 1], variables: { end, i, changed, condición: shouldSwap },
      });
      if (shouldSwap) {
        const temp = working[i];
        add('int temp = values[i];', `temp guarda ${temp} del índice ${i}.`, 'bubble-swap-save', {
          position: i, sortRange: [0, end], sortSwapPositions: [i, i + 1], variables: { end, i, changed, temp },
        });
        working[i] = working[i + 1];
        add('values[i] = values[i + 1];', `El índice ${i} recibe ${working[i]}.`, 'bubble-swap-first', {
          position: i, sortRange: [0, end], sortSwapPositions: [i, i + 1], variables: { end, i, changed, temp },
        });
        working[i + 1] = temp;
        add('values[i + 1] = temp;', `El índice ${i + 1} recibe ${temp}; termina el intercambio.`, 'bubble-swap-complete', {
          position: i + 1, sortRange: [0, end], sortSwapPositions: [i, i + 1], variables: { end, i, changed, temp },
        });
        changed = true;
        add('changed = true;', 'La pasada registra que sí hubo un cambio.', 'bubble-changed', { position: i + 1, sortRange: [0, end], variables: { end, i, changed } });
      }
    }
    fixed.add(end);
    add('if (!changed) {', changed ? `Hubo cambios; se necesita otra pasada.` : `No hubo cambios: el arreglo ya está ordenado.`, 'bubble-early-stop', {
      position: end, sortRange: [0, end], variables: { end, changed, condición: !changed },
    });
    if (!changed) break;
  }
  return trace.finish('Bubble Sort terminó: cada pasada empujó el mayor valor pendiente hacia el final.');
}

function selectionSort(values, edges) {
  const trace = createTrace(values, edges, 'selection');
  const { working, fixed, add, swap } = trace;
  add('void selectionSort() {', 'Selection Sort buscará el mínimo de cada zona pendiente.', 'selection-start');
  for (let i = 0; i < working.length - 1; i++) {
    add('for (int i = 0; i < size - 1; i++) {', `i vale ${i}: aquí se colocará el mínimo de la zona pendiente.`, 'selection-outer-loop', {
      position: i, sortRange: [i, working.length - 1], variables: { i },
    });
    let minIndex = i;
    add('int minIndex = i;', `El mínimo provisional comienza en el índice ${i}: ${working[i]}.`, 'selection-minimum', { position: i, sortRange: [i, working.length - 1], variables: { i, minIndex } });
    for (let j = i + 1; j < working.length; j++) {
      add('for (int j = i + 1; j < size; j++) {', `j vale ${j}: continúa la búsqueda del mínimo.`, 'selection-inner-loop', {
        position: j, sortRange: [i, working.length - 1], sortComparePositions: [j, minIndex], variables: { i, j, minIndex },
      });
      const isSmaller = numeric(working[j]) < numeric(working[minIndex]);
      add('if (values[j] < values[minIndex]) {', `${working[j]} ${isSmaller ? '<' : '≥'} ${working[minIndex]}.`, 'selection-compare', {
        position: j, sortRange: [i, working.length - 1], sortComparePositions: [j, minIndex], variables: { i, j, minIndex, condición: isSmaller },
      });
      if (isSmaller) {
        minIndex = j;
        add('minIndex = j;', `${working[j]} pasa a ser el nuevo mínimo provisional.`, 'selection-new-minimum', { position: j, sortRange: [i, working.length - 1], variables: { i, j, minIndex } });
      }
    }
    add('if (minIndex != i) {', minIndex !== i ? `El mínimo debe moverse al índice ${i}.` : `El índice ${i} ya contiene el mínimo.`, 'selection-place', {
      position: i, sortRange: [i, working.length - 1], sortComparePositions: [i, minIndex], variables: { i, minIndex, condición: minIndex !== i },
    });
    if (minIndex !== i) swap(i, minIndex, 'selection', { sortRange: [i, working.length - 1], variables: { i, minIndex } });
    fixed.add(i);
  }
  return trace.finish('Selection Sort terminó: en cada pasada colocó el menor valor pendiente.');
}

function insertionSort(values, edges) {
  const trace = createTrace(values, edges, 'insertion');
  const { working, fixed, add } = trace;
  if (working.length) fixed.add(0);
  add('void insertionSort() {', 'Insertion Sort comienza con el primer elemento como zona ordenada.', 'insertion-start');
  for (let i = 1; i < working.length; i++) {
    add('for (int i = 1; i < size; i++) {', `i vale ${i}: se insertará este valor en la zona [0..${i - 1}].`, 'insertion-loop', {
      position: i, sortRange: [0, i], variables: { i },
    });
    const key = working[i];
    let j = i - 1;
    add('int key = values[i];', `key guarda ${key} para insertarlo en la zona ordenada.`, 'insertion-key', { position: i, sortRange: [0, i], variables: { i, j, key } });
    while (true) {
      const inBounds = j >= 0;
      const shouldShift = inBounds && numeric(working[j]) > numeric(key);
      const comparison = !inBounds ? 'j salió del arreglo: termina la búsqueda.' : shouldShift ? `${working[j]} > ${key}: se desplaza a la derecha.` : `${working[j]} ≤ ${key}: aquí termina la búsqueda.`;
      add('while (j >= 0 && values[j] > key) {', comparison, 'insertion-compare', {
        position: Math.max(0, j), sortRange: [0, i], sortComparePositions: inBounds ? [j, j + 1] : [], variables: { i, j, key, condición: shouldShift },
      });
      if (!shouldShift) break;
      working[j + 1] = working[j];
      add('values[j + 1] = values[j];', `${working[j]} se desplaza del índice ${j} al ${j + 1}.`, 'insertion-shift', { position: j + 1, sortRange: [0, i], sortSwapPositions: [j, j + 1], variables: { i, j, key } });
      j--;
      add('j--;', `j retrocede a ${j}.`, 'insertion-move', { position: Math.max(0, j), sortRange: [0, i], variables: { i, j, key } });
    }
    working[j + 1] = key;
    fixed.add(i);
    add('values[j + 1] = key;', `${key} se inserta en el índice ${j + 1}.`, 'insertion-write', { position: j + 1, sortRange: [0, i], sortWriteIndex: j + 1, variables: { i, j, key } });
  }
  return trace.finish('Insertion Sort terminó: cada valor quedó insertado en la posición correcta de la zona ordenada.');
}

function shellSort(values, edges) {
  const trace = createTrace(values, edges, 'shell');
  const { working, add } = trace;
  add('void shellSort() {', 'Shell Sort comienza con comparaciones entre elementos alejados.', 'shell-start');
  for (let gap = Math.floor(working.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    add('for (int gap = size / 2; gap > 0; gap /= 2) {', `El salto actual es ${gap}.`, 'shell-gap', { sortGap: gap, variables: { gap } });
    for (let i = gap; i < working.length; i++) {
      add('for (int i = gap; i < size; i++) {', `i vale ${i}; se inicia una inserción con salto ${gap}.`, 'shell-loop', {
        position: i, sortGap: gap, variables: { gap, i },
      });
      const temp = working[i];
      let j = i;
      add('int temp = values[i];', `temp guarda ${temp} del índice ${i}.`, 'shell-key', { position: i, sortGap: gap, variables: { gap, i, j, temp } });
      while (true) {
        const inBounds = j >= gap;
        const shift = inBounds && numeric(working[j - gap]) > numeric(temp);
        const comparison = !inBounds ? `j es menor que gap: termina esta inserción.` : shift ? `${working[j - gap]} > ${temp}: se desplaza ${gap} posiciones.` : `${working[j - gap]} ≤ ${temp}: termina esta inserción.`;
        add('while (j >= gap && values[j - gap] > temp) {', comparison, 'shell-compare', {
          position: j, sortComparePositions: inBounds ? [j - gap, j] : [], sortGap: gap, variables: { gap, i, j, temp, condición: shift },
        });
        if (!shift) break;
        working[j] = working[j - gap];
        add('values[j] = values[j - gap];', `${working[j]} avanza al índice ${j}.`, 'shell-shift', { position: j, sortSwapPositions: [j - gap, j], sortGap: gap, variables: { gap, i, j, temp } });
        j -= gap;
        add('j -= gap;', `j retrocede hasta ${j}.`, 'shell-move', { position: j, sortGap: gap, variables: { gap, i, j, temp } });
      }
      working[j] = temp;
      add('values[j] = temp;', `${temp} queda insertado en el índice ${j}.`, 'shell-write', { position: j, sortWriteIndex: j, sortGap: gap, variables: { gap, i, j, temp } });
    }
  }
  return trace.finish('Shell Sort terminó cuando el salto llegó a 1 y completó la inserción final.');
}

function heapSort(values, edges) {
  const trace = createTrace(values, edges, 'heap-sort');
  const { working, fixed, add, swap } = trace;
  const heapify = (heapSize, root) => {
    let current = root;
    while (true) {
      let largest = current;
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      add('int largest = root;', `Se revisa el subárbol con raíz en ${current}.`, 'heap-sort-heapify', { position: current, sortRange: heapSize ? [0, heapSize - 1] : null, variables: { heapSize, root: current, largest, left, right } });
      if (left < heapSize) {
        const larger = numeric(working[left]) > numeric(working[largest]);
        add('if (left < heapSize && values[left] > values[largest]) {', `${working[left]} ${larger ? '>' : '≤'} ${working[largest]}.`, 'heap-sort-left', { position: left, sortRange: [0, heapSize - 1], sortComparePositions: [left, largest], variables: { heapSize, root: current, largest, left, right, condición: larger } });
        if (larger) largest = left;
      }
      if (right < heapSize) {
        const larger = numeric(working[right]) > numeric(working[largest]);
        add('if (right < heapSize && values[right] > values[largest]) {', `${working[right]} ${larger ? '>' : '≤'} ${working[largest]}.`, 'heap-sort-right', { position: right, sortRange: [0, heapSize - 1], sortComparePositions: [right, largest], variables: { heapSize, root: current, largest, left, right, condición: larger } });
        if (larger) largest = right;
      }
      const mustSwap = largest !== current;
      add('if (largest == root) {', mustSwap ? `El mayor está en ${largest}; debe subir.` : 'La raíz ya es la mayor: heapify termina.', 'heap-sort-check', { position: current, sortRange: heapSize ? [0, heapSize - 1] : null, sortComparePositions: [current, largest], variables: { heapSize, root: current, largest, condición: !mustSwap } });
      if (!mustSwap) return;
      swap(current, largest, 'heap-sort', { sortRange: [0, heapSize - 1], variables: { heapSize, root: current, largest } });
      current = largest;
      add('root = largest;', `heapify continúa desde el índice ${current}.`, 'heap-sort-descend', {
        position: current, sortRange: [0, heapSize - 1], variables: { heapSize, root: current, largest },
      });
    }
  };
  add('void heapSort() {', 'Heap Sort primero construye un max-heap.', 'heap-sort-start');
  for (let i = Math.floor(working.length / 2) - 1; i >= 0; i--) {
    add('for (int i = size / 2 - 1; i >= 0; i--) {', `i vale ${i}: se heapifica este nodo interno.`, 'heap-sort-build-loop', { position: i, variables: { i, heapSize: working.length } });
    add('heapify(size, i);', `Se aplica heapify desde el nodo interno ${i}.`, 'heap-sort-build', { position: i, variables: { i, heapSize: working.length } });
    heapify(working.length, i);
  }
  for (let end = working.length - 1; end > 0; end--) {
    add('for (int end = size - 1; end > 0; end--) {', `El máximo del heap activo se fijará en ${end}.`, 'heap-sort-extract-loop', { position: end, sortRange: [0, end], variables: { end } });
    add('swap(0, end);', `La raíz máxima ${working[0]} pasa a la posición final ${end}.`, 'heap-sort-extract', { position: 0, sortRange: [0, end], sortSwapPositions: [0, end], variables: { end } });
    swap(0, end, 'heap-sort', { sortRange: [0, end], variables: { end } });
    fixed.add(end);
    add('heapify(end, 0);', `Se restaura el max-heap usando solo [0..${end - 1}].`, 'heap-sort-restore', { position: 0, sortRange: end > 0 ? [0, end - 1] : null, variables: { end, heapSize: end } });
    heapify(end, 0);
  }
  return trace.finish('Heap Sort terminó: cada máximo fue extraído a su posición definitiva.');
}

function countingSort(values, edges) {
  const trace = createTrace(values, edges, 'counting');
  const { working, add } = trace;
  add('void countingSort() {', 'Counting Sort contará las frecuencias antes de reconstruir el arreglo.', 'counting-start');
  add('if (size < 2) return;', working.length < 2 ? 'Hay menos de dos valores: el arreglo ya está ordenado.' : 'Hay al menos dos valores: comienza el conteo.', 'counting-size-check', { variables: { condición: working.length < 2 } });
  if (working.length < 2) return trace.finish('Counting Sort terminó: no era necesario mover valores.');
  const min = Math.min(...working.map(numeric));
  const max = Math.max(...working.map(numeric));
  const range = max - min + 1;
  if (!Number.isSafeInteger(range) || range > 4096) {
    return { ok: false, message: 'Counting Sort necesita un rango entre mínimo y máximo de hasta 4096 posiciones para mantener segura esta demostración.' };
  }
  const count = new Array(range).fill(0);
  add('int min = findMinimum();', `El mínimo es ${min}. Se usará como desplazamiento.`, 'counting-min', { variables: { min, max } });
  add('int max = findMaximum();', `El máximo es ${max}; el rango contiene ${range} valores posibles.`, 'counting-max', { variables: { min, max, range } });
  add('int[] count = new int[max - min + 1];', `Se crean ${range} contadores, uno para cada valor entre ${min} y ${max}.`, 'counting-array', { sortAuxValues: count, sortAuxLabel: 'count', variables: { min, max, range } });
  for (let i = 0; i < working.length; i++) {
    const index = numeric(working[i]) - min;
    add('for (int i = 0; i < size; i++) {', `i vale ${i}; se contará ${working[i]}.`, 'counting-count-loop', { position: i, sortComparePositions: [i], sortAuxValues: count, sortAuxLabel: 'count', variables: { i, index, value: working[i] } });
    count[index]++;
    add('count[values[i] - min]++;', `${working[i]} incrementa count[${index}] a ${count[index]}.`, 'counting-count', { position: i, sortComparePositions: [i], sortAuxValues: count, sortAuxLabel: 'count', variables: { i, index, value: working[i], count: count[index] } });
  }
  let write = 0;
  for (let index = 0; index < count.length; index++) {
    add('for (int index = 0; index < count.length; index++) {', `Se reconstruirá el valor ${index + min} con frecuencia ${count[index]}.`, 'counting-rebuild-loop', { position: write, sortAuxValues: count, sortAuxLabel: 'count', variables: { index, position: write, count: count[index] } });
    while (count[index] > 0) {
      add('while (count[index] > 0) {', `count[${index}] es ${count[index]}: todavía queda una copia por escribir.`, 'counting-frequency-check', { position: write, sortAuxValues: count, sortAuxLabel: 'count', variables: { index, position: write, count: count[index], condición: true } });
      const value = index + min;
      working[write] = value;
      add('values[position] = index + min;', `${value} se escribe en values[${write}].`, 'counting-write', { position: write, sortWriteIndex: write, sortAuxValues: count, sortAuxLabel: 'count', variables: { index, position: write, value, count: count[index] } });
      write++;
      add('position++;', `La siguiente escritura será en el índice ${write}.`, 'counting-position', { position: Math.min(write, Math.max(0, working.length - 1)), sortAuxValues: count, sortAuxLabel: 'count', variables: { index, position: write, value, count: count[index] } });
      count[index]--;
      add('count[index]--;', `Quedan ${count[index]} copias del valor ${value}.`, 'counting-decrement', { position: Math.min(write, Math.max(0, working.length - 1)), sortAuxValues: count, sortAuxLabel: 'count', variables: { index, position: write, value, count: count[index] } });
    }
    add('while (count[index] > 0) {', `count[${index}] es 0: se avanza al siguiente valor.`, 'counting-frequency-check', { position: Math.min(write, Math.max(0, working.length - 1)), sortAuxValues: count, sortAuxLabel: 'count', variables: { index, position: write, count: 0, condición: false } });
  }
  return trace.finish('Counting Sort terminó: los conteos reconstruyeron el arreglo de menor a mayor.');
}

function radixSort(values, edges) {
  const trace = createTrace(values, edges, 'radix');
  const { working, add } = trace;
  add('void radixSort() {', 'Radix Sort preparará claves no negativas y las ordenará dígito por dígito.', 'radix-start');
  add('if (size < 2) return;', working.length < 2 ? 'Hay menos de dos valores: el arreglo ya está ordenado.' : 'Hay al menos dos valores: comienzan las pasadas por dígito.', 'radix-size-check', { variables: { condición: working.length < 2 } });
  if (working.length < 2) return trace.finish('Radix Sort terminó: no era necesario mover valores.');
  const min = Math.min(...working.map(numeric));
  const maxKey = Math.max(...working.map(value => numeric(value) - min));
  add('int offset = findMinimum();', `Se usa ${min} como desplazamiento; value - offset será una clave no negativa.`, 'radix-offset', { variables: { offset: min, maxKey } });
  add('int maxKey = findMaximum() - offset;', `La clave desplazada más grande es ${maxKey}.`, 'radix-maximum', { variables: { offset: min, maxKey } });
  const output = new Array(working.length);
  add('int[] output = new int[size];', `Se crea output con ${working.length} posiciones para la distribución estable.`, 'radix-output-array', { sortAuxValues: output, sortAuxLabel: 'output', variables: { size: working.length } });
  for (let exp = 1; Math.floor(maxKey / exp) > 0; exp *= 10) {
    add('for (int exp = 1; maxKey / exp > 0; exp *= 10) {', `Se ordenará usando el dígito correspondiente a exp = ${exp}.`, 'radix-exp-loop', { variables: { exp, maxKey } });
    const count = new Array(10).fill(0);
    add('int[] count = new int[10];', `Se prepara el conteo estable para el dígito de posición ${exp}.`, 'radix-pass', { sortAuxValues: count, sortAuxLabel: `dígito ×${exp}`, variables: { exp } });
    for (let i = 0; i < working.length; i++) {
      const digit = Math.floor((numeric(working[i]) - min) / exp) % 10;
      add('int digit = ((values[i] - offset) / exp) % 10;', `${working[i]} tiene dígito ${digit} en esta pasada.`, 'radix-digit', { position: i, sortComparePositions: [i], sortAuxValues: count, sortAuxLabel: `dígito ×${exp}`, variables: { exp, i, digit, value: working[i] } });
      count[digit]++;
      add('count[digit]++;', `El contador del dígito ${digit} aumenta a ${count[digit]}.`, 'radix-count', { position: i, sortComparePositions: [i], sortAuxValues: count, sortAuxLabel: `dígito ×${exp}`, variables: { exp, i, digit, count: count[digit] } });
    }
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
      add('count[i] += count[i - 1];', `El acumulado hasta el dígito ${i} es ${count[i]}.`, 'radix-prefix', { sortAuxValues: count, sortAuxLabel: `acumulado ×${exp}`, variables: { exp, i, count: count[i] } });
    }
    for (let i = working.length - 1; i >= 0; i--) {
      const digit = Math.floor((numeric(working[i]) - min) / exp) % 10;
      const position = count[digit] - 1;
      output[position] = working[i];
      add('output[count[digit] - 1] = values[i];', `${working[i]} se coloca de forma estable en output[${position}].`, 'radix-output', { position: i, sortWriteIndex: position, sortAuxValues: output, sortAuxLabel: 'output', variables: { exp, i, digit, position } });
      count[digit]--;
      add('count[digit]--;', `La próxima clave con dígito ${digit} se colocará una posición antes.`, 'radix-decrement', { position: i, sortWriteIndex: position, sortAuxValues: count, sortAuxLabel: `acumulado ×${exp}`, variables: { exp, i, digit, position, count: count[digit] } });
    }
    for (let i = 0; i < working.length; i++) {
      working[i] = output[i];
      add('values[i] = output[i];', `${working[i]} vuelve al índice ${i} después de esta pasada.`, 'radix-write', { position: i, sortWriteIndex: i, sortAuxValues: output, sortAuxLabel: 'output', variables: { exp, i } });
    }
    if (exp > Number.MAX_SAFE_INTEGER / 10) break;
  }
  return trace.finish('Radix Sort terminó: las pasadas estables por dígitos dejaron el arreglo ordenado.');
}

function bogoSort(values, edges) {
  const trace = createTrace(values, edges, 'bogo');
  const { working, add } = trace;
  if (working.length > 7) {
    return { ok: false, message: 'Bogo Sort real se limita a 7 valores: su tiempo esperado crece como n! y una entrada mayor puede bloquear el navegador.' };
  }
  const ordered = () => working.every((value, index) => index === 0 || numeric(working[index - 1]) <= numeric(value));
  let seed = working.reduce((total, value, index) => (total + (numeric(value) || 0) * (index + 3)) >>> 0, 2166136261);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const checkOrder = (show, attempt) => {
    for (let i = 1; i < working.length; i++) {
      if (show) add('for (int i = 1; i < size; i++) {', `isSorted compara los índices ${i - 1} y ${i}.`, 'bogo-check-loop', { position: i, sortComparePositions: [i - 1, i], sortAttempt: attempt, variables: { attempt, i } });
      const outOfOrder = numeric(working[i - 1]) > numeric(working[i]);
      if (show) add('if (values[i - 1] > values[i]) {', `${working[i - 1]} ${outOfOrder ? '>' : '≤'} ${working[i]}.`, 'bogo-compare', { position: i, sortComparePositions: [i - 1, i], sortAttempt: attempt, variables: { attempt, i, condición: outOfOrder } });
      if (outOfOrder) {
        if (show) add('return false;', 'isSorted encuentra una inversión y devuelve false.', 'bogo-not-sorted', { position: i, sortComparePositions: [i - 1, i], sortAttempt: attempt, variables: { attempt, i } });
        return false;
      }
    }
    if (show) add('return true;', 'No quedan inversiones: isSorted devuelve true.', 'bogo-sorted', { position: Math.max(0, working.length - 1), sortAttempt: attempt, variables: { attempt } });
    return true;
  };
  const shuffle = (show, attempt) => {
    if (show) add('shuffle();', `Se ejecuta la mezcla aleatoria real número ${attempt}.`, 'bogo-shuffle', { sortAttempt: attempt, variables: { attempt } });
    for (let i = working.length - 1; i > 0; i--) {
      if (show) add('for (int i = size - 1; i > 0; i--) {', `Fisher–Yates elegirá una posición entre 0 y ${i}.`, 'bogo-shuffle-loop', { position: i, sortAttempt: attempt, variables: { attempt, i } });
      const other = Math.floor(random() * (i + 1));
      if (show) add('int other = (int) (Math.random() * (i + 1));', `La posición aleatoria elegida es ${other}.`, 'bogo-random-index', { position: i, sortComparePositions: [i, other], sortAttempt: attempt, variables: { attempt, i, other } });
      const temp = working[i];
      if (show) add('int temp = values[i];', `temp guarda ${temp}.`, 'bogo-swap-save', { position: i, sortSwapPositions: [i, other], sortAttempt: attempt, variables: { attempt, i, other, temp } });
      working[i] = working[other];
      if (show) add('values[i] = values[other];', `El índice ${i} recibe ${working[i]}.`, 'bogo-swap-first', { position: i, sortSwapPositions: [i, other], sortAttempt: attempt, variables: { attempt, i, other, temp } });
      working[other] = temp;
      if (show) add('values[other] = temp;', `El índice ${other} recibe ${temp}.`, 'bogo-swap-complete', { position: other, sortSwapPositions: [i, other], sortAttempt: attempt, variables: { attempt, i, other, temp } });
    }
  };
  add('void bogoSort() {', 'Bogo Sort comprobará si el arreglo ya está ordenado.', 'bogo-start', { sortAttempt: 0, variables: { attempt: 0 } });
  let attempt = 0;
  const visibleAttempts = 8;
  const maximumAttempts = 250000;
  let omittedAttempts = 0;
  while (attempt < maximumAttempts) {
    const showCheck = attempt < visibleAttempts || ordered();
    const knownOrder = ordered();
    if (showCheck) add('while (!isSorted()) {', knownOrder ? 'Se evalúa isSorted para confirmar que el arreglo ya está ordenado.' : `Se evalúa isSorted antes del intento ${attempt + 1}.`, 'bogo-check', { sortAttempt: attempt, variables: { attempt, condición: !knownOrder } });
    const isOrdered = checkOrder(showCheck, attempt);
    if (isOrdered) break;
    attempt++;
    const showShuffle = attempt <= visibleAttempts;
    shuffle(showShuffle, attempt);
    if (!showShuffle) omittedAttempts++;
    if (!showShuffle && ordered()) {
      add('shuffle();', `La mezcla aleatoria real ${attempt} produjo el orden; se omitieron ${omittedAttempts} intentos intermedios para que la animación sea utilizable.`, 'bogo-shuffle', { sortAttempt: attempt, variables: { attempt }, delayMs: 600 });
    }
  }
  if (!ordered()) {
    return { ok: false, message: `Bogo Sort realizó ${maximumAttempts} mezclas aleatorias reales sin encontrar el orden. Restablece o genera un ejemplo más pequeño para volver a intentarlo.` };
  }
  return trace.finish(`Bogo Sort terminó después de ${attempt} mezcla${attempt === 1 ? '' : 's'} aleatoria${attempt === 1 ? '' : 's'} real${attempt === 1 ? '' : 'es'}.`);
}

const SORT_EXECUTORS = {
  'bubble-sort': bubbleSort,
  'selection-sort': selectionSort,
  'insertion-sort': insertionSort,
  'shell-sort': shellSort,
  'heap-sort': heapSort,
  'counting-sort': countingSort,
  'radix-sort': radixSort,
  'bogo-sort': bogoSort,
};

export function executeEducationalSort(algorithmId, values, edges) {
  return SORT_EXECUTORS[algorithmId]?.(values, edges) ?? null;
}
