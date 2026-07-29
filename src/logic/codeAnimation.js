export const copyVisualValues = values => values.map(value => (
  value && typeof value === 'object' ? { ...value } : value
));

export function executableCodeLines(code) {
  return code.split('\n')
    .map((text, index) => ({ index, text: text.trim() }))
    .filter(line => line.text && line.text !== '}' && line.text !== '};');
}

const isLoop = text => /\b(?:for|while)\s*\(/.test(text);
const isDoLoop = text => /^\s*do\s*\{/.test(text);
const openingBraces = text => (text.match(/{/g) ?? []).length;
const closingBraces = text => (text.match(/}/g) ?? []).length;

function blockEnd(lines, loopIndex, maximum) {
  let balance = 0;
  let opened = false;
  for (let index = loopIndex; index <= maximum; index++) {
    const openedHere = openingBraces(lines[index].text);
    balance += openedHere;
    if (openedHere) opened = true;
    balance -= closingBraces(lines[index].text);
    if (opened && balance <= 0) return index;
  }
  return Math.min(maximum, loopIndex + 1);
}

function expandBlock(lines, start, end, baseIterations, depth = 0, outerIteration = null) {
  const trace = [];
  let index = start;

  while (index <= end) {
    const line = lines[index];
    const text = line.text.trim();
    if (!text || text === '}' || text === '};') { index++; continue; }

    if (isDoLoop(text)) {
      const closingIndex = blockEnd(lines, index, end);
      const iterations = depth === 0 ? baseIterations : Math.min(baseIterations, 4);
      for (let iteration = 0; iteration < iterations; iteration++) {
        trace.push({ index, text, iteration, totalIterations: iterations, loopDepth: depth, loopCondition: true, outerIteration });
        if (closingIndex > index) {
          trace.push(...expandBlock(lines, index + 1, closingIndex - 1, baseIterations, depth + 1, iteration));
        }
        trace.push({ ...lines[closingIndex], iteration, totalIterations: iterations, loopDepth: depth, loopCondition: true, outerIteration });
      }
      trace.push({ ...lines[closingIndex], iteration: iterations, totalIterations: iterations, loopDepth: depth, loopExit: true, outerIteration });
      index = closingIndex + 1;
      continue;
    }

    if (isLoop(text)) {
      const closingIndex = blockEnd(lines, index, end);
      const iterations = depth === 0 ? baseIterations : Math.min(baseIterations, 4);
      for (let iteration = 0; iteration < iterations; iteration++) {
        trace.push({ index, text, iteration, totalIterations: iterations, loopDepth: depth, loopCondition: true, outerIteration });
        if (closingIndex > index) {
          trace.push(...expandBlock(lines, index + 1, closingIndex - 1, baseIterations, depth + 1, iteration));
        }
      }
      trace.push({ index, text, iteration: iterations, totalIterations: iterations, loopDepth: depth, loopExit: true, outerIteration });
      index = closingIndex + 1;
      continue;
    }

    trace.push({ index, text, iteration: outerIteration, totalIterations: outerIteration === null ? null : baseIterations, loopDepth: depth });
    index++;
  }

  return trace;
}

export function estimateLoopIterations({ actionId, beforeValues, afterValues, finalStep, finalMessage = '', lengthBasedArray = false }) {
  const beforeLength = Math.max(1, beforeValues.length);
  const afterLength = Math.max(1, afterValues.length);
  const target = Math.max(0, Number(finalStep) || 0);
  const failedSearch = /no (?:existe|fue encontrado|aparece)|no existe/i.test(finalMessage);

  if (lengthBasedArray && ['add-start', 'add-end', 'add-index'].includes(actionId)) return beforeValues.length;
  if (lengthBasedArray && ['remove-start', 'remove-end', 'remove-index'].includes(actionId)) return afterValues.length;
  if (actionId === 'add-start') return beforeLength;
  if (actionId === 'add-index') return Math.max(1, beforeLength - target);
  if (['remove-start','dequeue'].includes(actionId)) return Math.max(1, afterValues.length);
  if (actionId === 'remove-index') return Math.max(1, afterValues.length - target);
  if (['find','remove-value','cache-get','word-find'].includes(actionId)) return failedSearch ? beforeLength : Math.min(beforeLength, target + 1);
  if (['prefix-sum','range-min'].includes(actionId)) return Math.min(beforeLength, target + 1);
  if (['heap-add','heap-extract'].includes(actionId)) return Math.max(1, Math.ceil(Math.log2(afterLength + 1)));
  if (['sorted-add','find-root'].includes(actionId)) return Math.max(1, Math.min(beforeLength, Math.abs(beforeLength - target)));
  if (actionId === 'calculate') return Math.min(20, afterLength);
  if (['reset','clear-bits','range-view','merkle-root','shuffle','sort','vertex-remove','bfs-run','dfs-run'].includes(actionId)) return Math.min(12, Math.max(beforeLength, afterLength));
  return Math.min(10, Math.max(beforeLength, afterLength));
}

export function buildCodeExecutionTrace(code, iterationCount) {
  const lines = code.split('\n').map((text, index) => ({ index, text }));
  const operationMarker = lines.findIndex(line => line.text.trim() === '// Start of the selected operation');
  const operationEndMarker = lines.findIndex((line, index) => (
    index > operationMarker && line.text.trim() === '// End of the selected operation'
  ));
  const firstExecutionLine = operationMarker >= 0 ? operationMarker + 1 : 0;
  const lastExecutionLine = operationEndMarker >= 0 ? operationEndMarker - 1 : lines.length - 1;
  const expanded = expandBlock(lines, firstExecutionLine, lastExecutionLine, Math.max(1, iterationCount));
  const maximumFrames = 180;
  if (expanded.length <= maximumFrames) return expanded;

  const finalLine = executableCodeLines(code).at(-1) ?? { index: 0, text: 'operation' };
  return [...expanded.slice(0, maximumFrames - 1), { ...finalLine, truncated: true }];
}

const cloneEdges = edges => edges.map(edge => [...edge]);

function framePosition(actionId, line, beforeValues, workingValues, finalStep, lengthBasedArray = false) {
  const length = Math.max(1, workingValues.length);
  const iteration = Math.max(0, line.iteration ?? 0);
  const target = Math.max(0, Number(finalStep) || 0);

  if (lengthBasedArray && line.iteration !== null && line.iteration !== undefined) {
    if (actionId === 'add-start') return Math.min(length - 1, iteration + 1);
    if (actionId === 'add-index') return Math.min(length - 1, iteration < target ? iteration : iteration + 1);
    if (['add-end', 'remove-start', 'remove-end', 'remove-index'].includes(actionId)) {
      return Math.min(length - 1, iteration);
    }
  }
  if (['add-start','add-index'].includes(actionId)) return Math.max(target, Math.min(length - 1, beforeValues.length - iteration));
  if (['remove-start','remove-index','dequeue'].includes(actionId)) return Math.min(length - 1, target + iteration);
  if (['find','remove-value','cache-get','word-find','prefix-sum','range-min','range-view','merkle-root','reset','clear-bits'].includes(actionId)) return Math.min(length - 1, iteration);
  if (['sort','shuffle'].includes(actionId)) return Math.min(length - 1, line.outerIteration ?? iteration);
  return Math.min(length - 1, line.iteration === null || line.iteration === undefined ? target : iteration);
}

function applyVisibleMutation({ actionId, line, workingValues, beforeValues, afterValues, finalStep, lengthBasedArray = false }) {
  const text = line.text.replace(/\s+/g, ' ');
  const iteration = Math.max(0, line.iteration ?? 0);
  const target = Math.max(0, Number(finalStep) || 0);

  if (lengthBasedArray) {
    if (/int\[\] result = new int\[n \+ 1\]/.test(text) && workingValues.length < afterValues.length) {
      workingValues.push(undefined);
    }
    if (/int\[\] result = new int\[n - 1\]/.test(text) && workingValues.length > afterValues.length) {
      workingValues.length = afterValues.length;
    }

    if (actionId === 'add-start' && /result\[i \+ 1\] = values\[i\]/.test(text) && iteration < beforeValues.length) {
      workingValues[iteration + 1] = beforeValues[iteration];
    }
    if (actionId === 'add-end' && /result\[i\] = values\[i\]/.test(text) && iteration < beforeValues.length) {
      workingValues[iteration] = beforeValues[iteration];
    }
    if (actionId === 'add-index' && /result\[destination\] = values\[i\]/.test(text) && iteration < beforeValues.length) {
      const destination = iteration < target ? iteration : iteration + 1;
      workingValues[destination] = beforeValues[iteration];
    }
    if (actionId === 'remove-start' && /result\[i\] = values\[i \+ 1\]/.test(text) && iteration < afterValues.length) {
      workingValues[iteration] = beforeValues[iteration + 1];
    }
    if (actionId === 'remove-end' && /result\[i\] = values\[i\]/.test(text) && iteration < afterValues.length) {
      workingValues[iteration] = beforeValues[iteration];
    }
    if (actionId === 'remove-index' && /result\[i\] = values\[source\]/.test(text) && iteration < afterValues.length) {
      const source = iteration < target ? iteration : iteration + 1;
      workingValues[iteration] = beforeValues[source];
    }
    if (actionId === 'add-start' && /result\[0\] = value/.test(text)) workingValues[0] = afterValues[0];
    if (actionId === 'add-end' && /result\[n\] = value/.test(text)) workingValues[afterValues.length - 1] = afterValues.at(-1);
    if (actionId === 'add-index' && /result\[index\] = value/.test(text)) workingValues[target] = afterValues[target];
    if (actionId === 'set-index' && /values\[index\] = value/.test(text)) workingValues[target] = afterValues[target];
    return;
  }

  if (['add-start','add-index'].includes(actionId) && /values\[i\]\s*=\s*values\[i\s*-\s*1\]/.test(text)) {
    if (workingValues.length < afterValues.length) workingValues.push(undefined);
    const destination = beforeValues.length - iteration;
    if (destination > target && destination < workingValues.length) workingValues[destination] = workingValues[destination - 1];
  }

  if (['remove-start','remove-index'].includes(actionId) && /values\[i\]\s*=\s*values\[i\s*\+\s*1\]/.test(text)) {
    const destination = target + iteration;
    if (destination + 1 < workingValues.length) workingValues[destination] = workingValues[destination + 1];
  }

  if (actionId === 'dequeue' && /queue\[i\]\s*=\s*queue\[i\s*\+\s*1\]/.test(text)) {
    if (iteration + 1 < workingValues.length) workingValues[iteration] = workingValues[iteration + 1];
  }

  if (actionId === 'reset' && /values\[i\]\s*=\s*initialValues\[i\]/.test(text) && iteration < afterValues.length) {
    workingValues[iteration] = afterValues[iteration];
  }

  if (actionId === 'clear-bits' && /bits\[i\]\s*=\s*false/.test(text) && iteration < workingValues.length) {
    workingValues[iteration] = 0;
  }
}

function readableVariableValue(value) {
  if (value === undefined) return 'sin valor';
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function loopIndexValue(actionId, line, beforeValues, finalStep, lengthBasedArray = false) {
  if (line.iteration === null || line.iteration === undefined) return null;
  const iteration = Math.max(0, line.iteration);
  const target = Math.max(0, Number(finalStep) || 0);

  if (lengthBasedArray) return iteration;
  if (['add-start', 'add-index'].includes(actionId)) {
    return Math.max(target, beforeValues.length - iteration);
  }
  if (actionId === 'remove-index') return target + iteration;
  return iteration;
}

function createLiveVariables({ actionId, line, beforeValues, workingValues, finalStep, position, inputValues = {}, lengthBasedArray = false }) {
  const index = loopIndexValue(actionId, line, beforeValues, finalStep, lengthBasedArray);
  const hasRequestedIndex = inputValues.index !== undefined && inputValues.index !== null && inputValues.index !== '';
  const requestedIndex = hasRequestedIndex ? Number(inputValues.index) : null;
  const requestedValue = inputValues.value ?? inputValues.word ?? inputValues.key;
  const sizeGrows = /\bsize\s*(?:\+\+|\+=)/.test(line.text);
  const sizeShrinks = /\bsize\s*(?:--|-=)/.test(line.text);
  const visibleSize = beforeValues.length + (sizeGrows ? 1 : sizeShrinks ? -1 : 0);
  const variables = [];

  if (index !== null) variables.push({ name: 'i', value: readableVariableValue(index), role: 'index' });
  if (lengthBasedArray) {
    variables.push({ name: 'n', value: readableVariableValue(beforeValues.length), role: 'size' });
    if (/\bresult\b/.test(line.text) || workingValues.length !== beforeValues.length) {
      variables.push({ name: 'result.length', value: readableVariableValue(workingValues.length), role: 'size' });
    }
  } else {
    variables.push({ name: 'size', value: readableVariableValue(visibleSize), role: 'size' });
  }
  if (requestedValue !== undefined && requestedValue !== '') {
    variables.push({ name: 'value', value: readableVariableValue(requestedValue), role: 'input' });
  }
  if (hasRequestedIndex && Number.isFinite(requestedIndex)) {
    variables.push({ name: 'index', value: readableVariableValue(requestedIndex), role: 'input' });
  }
  variables.push({ name: 'posición activa', value: readableVariableValue(position), role: 'position' });

  const activeValue = workingValues[position];
  if (activeValue !== undefined) {
    variables.push({ name: 'elemento', value: readableVariableValue(activeValue), role: 'value' });
  }
  if (line.iteration !== null && line.iteration !== undefined) {
    variables.push({ name: 'condición', value: line.loopExit ? 'false' : 'true', role: line.loopExit ? 'false' : 'true' });
  }
  return variables;
}

function executionMessage(line) {
  if (line.loopExit) return `El bucle termina después de ${line.totalIterations} iteraciones.`;
  if (line.iteration !== null && line.iteration !== undefined) {
    return `Iteración ${Math.min(line.iteration + 1, line.totalIterations)} de ${line.totalIterations}: línea ${line.index + 1}, ${line.text}`;
  }
  return `Ejecutando línea ${line.index + 1}: ${line.text}`;
}

export function createCodeSynchronizedFrames({ code, actionId, beforeValues, afterValues, beforeEdges, afterEdges, finalStep, finalMessage, succeeded = true, inputValues = {} }) {
  const executable = executableCodeLines(code);
  const fallbackLine = executable[0] ?? { index: 0, text: 'operation' };
  const lengthBasedArray = /\bint\s+n\s*=\s*values\.length\b/.test(code);

  if (!succeeded) {
    return [{
      values: copyVisualValues(beforeValues), edges: cloneEdges(beforeEdges), position: 0,
      codeLine: fallbackLine.index, message: finalMessage, delayMs: 0, failed: true,
      variables: createLiveVariables({ actionId, line: fallbackLine, beforeValues, workingValues: beforeValues, finalStep, position: 0, inputValues, lengthBasedArray }),
    }];
  }

  const iterationCount = estimateLoopIterations({ actionId, beforeValues, afterValues, finalStep, finalMessage, lengthBasedArray });
  const sequence = buildCodeExecutionTrace(code, iterationCount);
  const workingValues = copyVisualValues(beforeValues);
  const frames = sequence.map(line => {
    applyVisibleMutation({ actionId, line, workingValues, beforeValues, afterValues, finalStep, lengthBasedArray });
    const position = framePosition(actionId, line, beforeValues, workingValues, finalStep, lengthBasedArray);
    return {
      values: copyVisualValues(workingValues),
      edges: cloneEdges(beforeEdges),
      position,
      codeLine: line.index,
      message: executionMessage(line),
      delayMs: line.iteration !== null && line.iteration !== undefined ? 430 : 650,
      iteration: line.iteration,
      totalIterations: line.totalIterations,
      loopExit: line.loopExit ?? false,
      variables: createLiveVariables({ actionId, line, beforeValues, workingValues, finalStep, position, inputValues, lengthBasedArray }),
    };
  });

  const finalFrame = {
    values: copyVisualValues(afterValues),
    edges: cloneEdges(afterEdges),
    position: Math.max(0, Number(finalStep) || 0),
    codeLine: executable.at(-1)?.index ?? 0,
    message: finalMessage,
    delayMs: 650,
    completed: true,
    variables: [
      ...(lengthBasedArray
        ? [
            { name: 'n', value: readableVariableValue(beforeValues.length), role: 'size' },
            { name: 'result.length', value: readableVariableValue(afterValues.length), role: 'size' },
          ]
        : [{ name: 'size', value: readableVariableValue(afterValues.length), role: 'size' }]),
      { name: 'posición final', value: readableVariableValue(Math.max(0, Number(finalStep) || 0)), role: 'position' },
      { name: 'estado', value: 'completado', role: 'true' },
    ],
  };
  if (!frames.length) return [finalFrame];
  frames.push(finalFrame);
  return frames;
}

export function createLinkedListSynchronizedFrames({
  algorithm,
  code,
  actionId,
  beforeValues,
  afterValues,
  beforeEdges,
  afterEdges,
  finalStep,
  finalMessage,
  succeeded = true,
  inputValues = {},
}) {
  const sourceLines = code.split('\n');
  const operationMarker = sourceLines.findIndex(line => line.trim() === '// Start of the selected operation');
  const firstLine = operationMarker >= 0 ? operationMarker + 1 : 0;
  const lineOf = (pattern, occurrence = 0) => {
    let seen = 0;
    for (let index = firstLine; index < sourceLines.length; index++) {
      if (!pattern.test(sourceLines[index].trim())) continue;
      if (seen === occurrence) return index;
      seen++;
    }
    return firstLine;
  };
  const methodPatterns = {
    'add-start': /void addAtStart\(/,
    'add-end': /void addAtEnd\(/,
    'add-index': /boolean addAtIndex\(/,
    'remove-start': /boolean removeFromStart\(/,
    'remove-end': /boolean removeFromEnd\(/,
    'remove-index': /boolean removeAtIndex\(/,
    'remove-value': /boolean removeValue\(/,
    find: /int find\(/,
  };
  const methodLine = lineOf(methodPatterns[actionId] ?? /(?:void|boolean|int)\s+\w+\(/);
  const circular = algorithm.id.includes('circular');
  const doubly = algorithm.id.includes('doble');
  const requestedIndex = inputValues.index === '' || inputValues.index === undefined
    ? null
    : Number(inputValues.index);
  const requestedValue = inputValues.value;
  const targetIndex = beforeValues.findIndex(value => String(value) === String(requestedValue));
  const frames = [];

  const frameVariables = ({ values, position, pointer = 'current', pointerValue, index = null, condition = null }) => [
    { name: 'head', value: readableVariableValue(values[0] ?? null), role: 'value' },
    { name: 'size', value: readableVariableValue(values.length), role: 'size' },
    ...(index === null ? [] : [{ name: 'i', value: readableVariableValue(index), role: 'index' }]),
    {
      name: pointer,
      value: readableVariableValue(
        pointerValue !== undefined
          ? pointerValue
          : pointer === 'newNode'
            ? requestedValue
            : values[position] ?? null,
      ),
      role: 'position',
    },
    ...(requestedValue === undefined || requestedValue === '' ? [] : [{ name: 'value', value: readableVariableValue(requestedValue), role: 'input' }]),
    ...(requestedIndex === null || !Number.isFinite(requestedIndex) ? [] : [{ name: 'index', value: readableVariableValue(requestedIndex), role: 'input' }]),
    ...(condition === null ? [] : [{ name: 'condición', value: condition ? 'true' : 'false', role: condition ? 'true' : 'false' }]),
    { name: 'sentido', value: 'head → next', role: 'value' },
  ];
  const addFrame = ({
    pattern,
    message,
    position = 0,
    values = beforeValues,
    pointer = 'current',
    index = null,
    condition = null,
    completed = false,
    delayMs = 280,
    occurrence = 0,
    pointerValue,
  }) => {
    const safePosition = Math.max(0, Math.min(Math.max(0, values.length - 1), position));
    frames.push({
      values: copyVisualValues(values),
      edges: cloneEdges(completed ? afterEdges : beforeEdges),
      position: safePosition,
      codeLine: pattern ? lineOf(pattern, occurrence) : methodLine,
      message,
      delayMs,
      completed,
      variables: frameVariables({ values, position: safePosition, pointer, pointerValue, index, condition }),
    });
  };
  const conditionFrame = (pattern, condition, message, position = 0, pointer = 'current', index = null, values = beforeValues, occurrence = 0, pointerValue) => {
    addFrame({ pattern, condition, message: `${message} La condición es ${condition ? 'true' : 'false'}.`, position, pointer, pointerValue, index, values, occurrence, delayMs: 240 });
  };
  const traverse = ({ pointer, initPattern, loopPattern, movePattern, moves, start = 0 }) => {
    if (initPattern) {
      addFrame({
        pattern: initPattern,
        message: `${pointer} comienza en head, que corresponde al índice 0.`,
        position: start,
        pointer,
        index: 0,
        delayMs: 240,
      });
    }
    for (let index = 0; index < moves; index++) {
      const position = beforeValues.length ? (start + index) % beforeValues.length : 0;
      conditionFrame(loopPattern, true, `${pointer} todavía no llegó a la posición buscada.`, position, pointer, index);
      addFrame({
        pattern: movePattern,
        message: `${pointer} avanza desde el índice ${position} al índice ${(position + 1) % Math.max(1, beforeValues.length)}.`,
        position: beforeValues.length ? (position + 1) % beforeValues.length : 0,
        pointer,
        index: index + 1,
        delayMs: 250,
      });
    }
    const finalPosition = beforeValues.length ? (start + moves) % beforeValues.length : 0;
    conditionFrame(loopPattern, false, `${pointer} termina el recorrido hacia adelante.`, finalPosition, pointer, moves);
    return finalPosition;
  };
  const finishSuccessfulOperation = (message = finalMessage, position = finalStep) => {
    const changesSize = actionId.startsWith('add-')
      || actionId.startsWith('remove-');
    if (changesSize) {
      const isInsertion = actionId.startsWith('add-');
      const returnsBoolean = !['add-start', 'add-end'].includes(actionId);
      addFrame({
        pattern: isInsertion ? /size\+\+;/ : /size--;/,
        message: isInsertion
          ? `size aumenta a ${afterValues.length}.`
          : `size disminuye a ${afterValues.length}.`,
        position,
        values: afterValues,
        completed: !returnsBoolean,
        delayMs: 230,
      });
      if (returnsBoolean) {
        addFrame({
          pattern: /return true;/,
          message,
          position,
          values: afterValues,
          completed: true,
          delayMs: 240,
        });
      }
    }
  };
  const complete = (pattern, message = finalMessage, position = finalStep, occurrence = 0) => {
    if (!succeeded) {
      addFrame({
        pattern,
        message,
        position,
        values: afterValues,
        completed: true,
        delayMs: 320,
        occurrence,
      });
      return;
    }

    addFrame({
      pattern,
      message,
      position,
      values: afterValues,
      completed: actionId === 'find',
      delayMs: 320,
      occurrence,
    });
    if (actionId === 'find') return;
    finishSuccessfulOperation(message, position);
  };
  const reject = (pattern, condition, message = finalMessage) => {
    conditionFrame(pattern, condition, message, 0);
    addFrame({ pattern: /return false;|return -1;/, message, condition, completed: true, delayMs: 260 });
    return frames;
  };

  addFrame({ message: `Comienza ${sourceLines[methodLine].trim()}.`, position: 0, pointer: 'head', delayMs: 220 });

  if (['add-index', 'remove-index'].includes(actionId)) {
    const validation = actionId === 'add-index'
      ? /if \(index < 0 \|\| index > size\)/
      : /if \(index < 0 \|\| index >= size\)/;
    const valid = Number.isInteger(requestedIndex)
      && requestedIndex >= 0
      && requestedIndex <= beforeValues.length - (actionId === 'remove-index' ? 1 : 0);
    conditionFrame(validation, !valid, valid ? 'El índice pertenece al rango permitido.' : finalMessage, 0, 'head');
    if (!valid) {
      addFrame({ pattern: /return false;/, message: finalMessage, condition: true, completed: true, delayMs: 260 });
      return frames;
    }
  }

  if (['remove-start', 'remove-end'].includes(actionId) && beforeValues.length === 0) {
    return reject(/if \(head == null\)/, true);
  }

  if (actionId === 'add-start') {
    addFrame({ pattern: /Node newNode = new Node\(value\);/, message: `Se crea el nodo nuevo con el valor ${requestedValue}.`, pointer: 'newNode' });
    if (!circular && !doubly) {
      addFrame({ pattern: /newNode\.next = head;/, message: 'El nuevo nodo apunta a la cabeza actual.', pointer: 'newNode' });
      complete(/head = newNode;/);
      return frames;
    }
    if (!circular && doubly) {
      addFrame({ pattern: /newNode\.next = head;/, message: 'El nuevo nodo apunta a la cabeza actual.', pointer: 'newNode' });
      conditionFrame(/if \(head != null\)/, beforeValues.length > 0, 'Comprueba si debe actualizarse el enlace prev de la cabeza.');
      if (beforeValues.length > 0) addFrame({ pattern: /head\.prev = newNode;/, message: 'La cabeza anterior apunta hacia atrás al nodo nuevo.' });
      complete(/head = newNode;/);
      return frames;
    }

    conditionFrame(/if \(head == null\)/, beforeValues.length === 0, 'Comprueba si la lista circular está vacía.');
    if (beforeValues.length === 0) {
      addFrame({ pattern: /head = newNode;/, message: 'head comienza apuntando al primer nodo.', pointer: 'head' });
      if (doubly) {
        addFrame({ pattern: /newNode\.next = newNode;/, message: 'next vuelve al mismo nodo y cierra el ciclo.', pointer: 'newNode' });
        complete(/newNode\.prev = newNode;/);
      } else {
        complete(/newNode\.next = newNode;/);
      }
      return frames;
    }
    if (!doubly) {
      traverse({ pointer: 'last', initPattern: /Node last = head;/, loopPattern: /while \(last\.next != head\)/, movePattern: /last = last\.next;/, moves: Math.max(0, beforeValues.length - 1) });
      addFrame({ pattern: /newNode\.next = head;/, message: 'El nodo nuevo apunta a la cabeza actual.', pointer: 'newNode' });
      addFrame({ pattern: /last\.next = newNode;/, message: 'El último nodo enlaza con el nuevo nodo.' });
    } else {
      addFrame({ pattern: /Node last = head\.prev;/, message: 'El último nodo se obtiene desde head.prev, sin guardar una variable de cola.', position: beforeValues.length - 1, pointer: 'last' });
      addFrame({ pattern: /newNode\.next = head;/, message: 'El nodo nuevo apunta a la cabeza actual.', pointer: 'newNode' });
      addFrame({ pattern: /newNode\.prev = last;/, message: 'El enlace prev del nodo nuevo apunta al último nodo.', position: beforeValues.length - 1, pointer: 'newNode' });
      addFrame({ pattern: /head\.prev = newNode;/, message: 'La cabeza enlaza hacia atrás con el nodo nuevo.', pointer: 'head' });
      addFrame({ pattern: /last\.next = newNode;/, message: 'El último nodo enlaza con el nuevo nodo.', position: beforeValues.length - 1, pointer: 'last' });
    }
    complete(/head = newNode;/);
    return frames;
  }

  if (actionId === 'add-end') {
    addFrame({ pattern: /Node newNode = new Node\(value\);/, message: `Se crea el nodo nuevo con el valor ${requestedValue}.`, pointer: 'newNode' });
    conditionFrame(/if \(head == null\)/, beforeValues.length === 0, 'Comprueba si la lista está vacía.');
    if (beforeValues.length === 0) {
      if (circular) {
        addFrame({ pattern: /head = newNode;/, message: 'head comienza apuntando al primer nodo.', pointer: 'head' });
        if (doubly) {
          addFrame({ pattern: /newNode\.next = newNode;/, message: 'next vuelve al mismo nodo y cierra el ciclo.', pointer: 'newNode' });
          complete(/newNode\.prev = newNode;/);
        } else {
          complete(/newNode\.next = newNode;/);
        }
      } else {
        complete(/head = newNode;/);
      }
      return frames;
    }
    if (circular && doubly) {
      addFrame({ pattern: /Node last = head\.prev;/, message: 'Obtiene el último nodo desde head.prev.', position: beforeValues.length - 1, pointer: 'last' });
      addFrame({ pattern: /newNode\.prev = last;/, message: 'El nuevo nodo apunta hacia atrás al último.', position: beforeValues.length - 1, pointer: 'newNode' });
      addFrame({ pattern: /newNode\.next = head;/, message: 'El nuevo nodo apunta hacia adelante a head.', pointer: 'newNode' });
      addFrame({ pattern: /last\.next = newNode;/, message: 'El último nodo apunta hacia adelante al nuevo.', position: beforeValues.length - 1, pointer: 'last' });
      complete(/head\.prev = newNode;/, finalMessage, afterValues.length - 1);
      return frames;
    }
    const pointer = circular ? 'last' : 'current';
    const loopPattern = circular ? /while \(last\.next != head\)/ : /while \(current\.next != null\)/;
    const movePattern = circular ? /last = last\.next;/ : /current = current\.next;/;
    traverse({
      pointer,
      initPattern: circular ? /Node last = head;/ : /Node current = head;/,
      loopPattern,
      movePattern,
      moves: Math.max(0, beforeValues.length - 1),
    });
    if (circular) {
      addFrame({ pattern: /newNode\.next = head;/, message: 'El nodo nuevo vuelve a head para conservar el ciclo.', pointer: 'newNode' });
      complete(/last\.next = newNode;/, finalMessage, afterValues.length - 1);
    } else if (doubly) {
      addFrame({ pattern: /current\.next = newNode;/, message: 'El último nodo apunta al nodo nuevo.', position: beforeValues.length - 1, pointer: 'current' });
      complete(/newNode\.prev = current;/, finalMessage, afterValues.length - 1);
    } else {
      complete(/current\.next = newNode;/, finalMessage, afterValues.length - 1);
    }
    return frames;
  }

  if (actionId === 'add-index') {
    const index = requestedIndex;
    addFrame({ pattern: /Node newNode = new Node\(value\);/, message: `Se crea el nodo nuevo con el valor ${requestedValue}.`, pointer: 'newNode' });
    if (circular) conditionFrame(/if \(size == 0\)/, beforeValues.length === 0, 'Comprueba si debe crearse el primer ciclo.', 0, 'head');
    const atStart = index === 0;
    if (beforeValues.length > 0 || !circular) conditionFrame(/(?:else )?if \(index == 0\)/, atStart, 'Comprueba si la inserción corresponde a la cabeza.', 0, 'head');

    if (atStart) {
      if (circular && beforeValues.length === 0) {
        addFrame({ pattern: /head = newNode;/, message: 'head comienza apuntando al primer nodo.', pointer: 'head' });
        if (doubly) {
          addFrame({ pattern: /newNode\.next = newNode;/, message: 'next vuelve al mismo nodo y cierra el ciclo.', pointer: 'newNode' });
          complete(/newNode\.prev = newNode;/, finalMessage, 0);
        } else {
          complete(/newNode\.next = newNode;/, finalMessage, 0);
        }
        return frames;
      }
      if (circular && !doubly) {
        traverse({ pointer: 'last', initPattern: /Node last = head;/, loopPattern: /while \(last\.next != head\)/, movePattern: /last = last\.next;/, moves: Math.max(0, beforeValues.length - 1) });
        addFrame({ pattern: /newNode\.next = head;/, message: 'El nodo nuevo apunta a la cabeza actual.', pointer: 'newNode' });
        addFrame({ pattern: /last\.next = newNode;/, message: 'El último nodo apunta al nodo nuevo.', position: beforeValues.length - 1, pointer: 'last' });
        complete(/head = newNode;/, finalMessage, 0, 1);
        return frames;
      }
      if (circular && doubly) {
        addFrame({ pattern: /Node last = head\.prev;/, message: 'El último nodo se obtiene desde head.prev.', position: beforeValues.length - 1, pointer: 'last' });
        addFrame({ pattern: /newNode\.next = head;/, message: 'El nodo nuevo apunta hacia adelante a head.', pointer: 'newNode' });
        addFrame({ pattern: /newNode\.prev = last;/, message: 'El nodo nuevo apunta hacia atrás al último.', position: beforeValues.length - 1, pointer: 'newNode' });
        addFrame({ pattern: /head\.prev = newNode;/, message: 'head enlaza hacia atrás con el nodo nuevo.', pointer: 'head' });
        addFrame({ pattern: /last\.next = newNode;/, message: 'El último nodo enlaza hacia adelante con el nuevo.', position: beforeValues.length - 1, pointer: 'last' });
        complete(/head = newNode;/, finalMessage, 0, 1);
        return frames;
      }
      if (doubly) {
        addFrame({ pattern: /newNode\.next = head;/, message: 'El nodo nuevo apunta a la cabeza actual.', pointer: 'newNode' });
        conditionFrame(/if \(head != null\)/, beforeValues.length > 0, 'Comprueba si la cabeza anterior debe enlazar hacia atrás.');
        if (beforeValues.length > 0) addFrame({ pattern: /head\.prev = newNode;/, message: 'La cabeza anterior enlaza hacia atrás con el nodo nuevo.', pointer: 'head' });
      } else {
        addFrame({ pattern: /newNode\.next = head;/, message: 'El nodo nuevo apunta a la cabeza actual.', pointer: 'newNode' });
      }
      complete(/head = newNode;/, finalMessage, 0);
      return frames;
    }

    if (circular && doubly) {
      traverse({ pointer: 'current', initPattern: /Node current = head;/, loopPattern: /for \(int i = 0; i < index; i\+\+\)/, movePattern: /current = current\.next;/, moves: index });
      addFrame({ pattern: /newNode\.prev = current\.prev;/, message: 'prev del nodo nuevo apunta al nodo anterior.', position: index, pointer: 'newNode' });
      addFrame({ pattern: /newNode\.next = current;/, message: 'next del nodo nuevo apunta al nodo encontrado.', position: index, pointer: 'newNode' });
      addFrame({ pattern: /current\.prev\.next = newNode;/, message: 'El nodo anterior enlaza hacia adelante con el nuevo.', position: Math.max(0, index - 1), pointer: 'current.prev' });
      complete(/current\.prev = newNode;/, finalMessage, index);
      return frames;
    }
    traverse({
      pointer: 'previous',
      initPattern: /Node previous = head;/,
      loopPattern: /for \(int i = 0; i < index - 1; i\+\+\)/,
      movePattern: /previous = previous\.next;/,
      moves: Math.max(0, index - 1),
    });
    addFrame({ pattern: /newNode\.next = previous\.next;/, message: 'El nodo nuevo conserva la referencia al siguiente.', position: index, pointer: 'newNode' });
    if (doubly) {
      addFrame({ pattern: /newNode\.prev = previous;/, message: 'El nodo nuevo apunta hacia atrás al nodo anterior.', position: Math.max(0, index - 1), pointer: 'newNode' });
      const hasFollowingNode = index < beforeValues.length;
      conditionFrame(/if \(previous\.next != null\)/, hasFollowingNode, 'Comprueba si existe un nodo siguiente que deba actualizar prev.', Math.max(0, index - 1), 'previous', index - 1);
      if (hasFollowingNode) {
        addFrame({ pattern: /previous\.next\.prev = newNode;/, message: 'El nodo siguiente enlaza hacia atrás con el nodo nuevo.', position: index, pointer: 'previous.next' });
      }
    }
    complete(/previous\.next = newNode;/, finalMessage, index);
    return frames;
  }

  if (actionId === 'remove-start') {
    conditionFrame(/if \(head == null\)/, false, 'La lista contiene al menos un nodo.');
    if (!circular) {
      if (doubly) {
        addFrame({ pattern: /head = head\.next;/, message: 'head avanza al nodo siguiente.', position: 0, values: afterValues, pointer: 'head' });
        const hasNewHead = afterValues.length > 0;
        conditionFrame(/if \(head != null\)/, hasNewHead, 'Comprueba si quedó una nueva cabeza.', 0, 'head');
        if (hasNewHead) complete(/head\.prev = null;/, finalMessage, 0);
        else finishSuccessfulOperation(finalMessage, 0);
      } else {
        complete(/head = head\.next;/, finalMessage, 0);
      }
      return frames;
    }
    const single = beforeValues.length === 1;
    conditionFrame(/if \(head\.next == head\)/, single, 'Comprueba si la cabeza es el único nodo.');
    if (single) {
      complete(/head = null;/, finalMessage, 0);
      return frames;
    }
    if (!doubly) {
      traverse({ pointer: 'last', initPattern: /Node last = head;/, loopPattern: /while \(last\.next != head\)/, movePattern: /last = last\.next;/, moves: beforeValues.length - 1 });
      addFrame({ pattern: /head = head\.next;/, message: 'La cabeza avanza al siguiente nodo.', position: 0, values: afterValues, pointer: 'head' });
      complete(/last\.next = head;/, finalMessage, 0);
    } else {
      addFrame({ pattern: /Node last = head\.prev;/, message: 'Obtiene el último nodo desde head.prev.', position: beforeValues.length - 1, pointer: 'last' });
      addFrame({ pattern: /head = head\.next;/, message: 'La cabeza avanza al siguiente nodo.', position: 0, values: afterValues, pointer: 'head' });
      addFrame({ pattern: /head\.prev = last;/, message: 'La nueva cabeza enlaza hacia atrás con el último nodo.', position: 0, values: afterValues, pointer: 'head' });
      complete(/last\.next = head;/, finalMessage, 0);
    }
    return frames;
  }

  if (actionId === 'remove-end') {
    conditionFrame(/if \(head == null\)/, false, 'La lista contiene al menos un nodo.');
    if (!circular && doubly) {
      traverse({
        pointer: 'current',
        initPattern: /Node current = head;/,
        loopPattern: /while \(current\.next != null\)/,
        movePattern: /current = current\.next;/,
        moves: Math.max(0, beforeValues.length - 1),
      });
      const single = beforeValues.length === 1;
      conditionFrame(/if \(current\.prev == null\)/, single, 'Comprueba si el nodo encontrado también es la cabeza.', beforeValues.length - 1, 'current', beforeValues.length - 1);
      if (single) complete(/head = null;/, finalMessage, 0);
      else complete(/current\.prev\.next = null;/, finalMessage, Math.max(0, afterValues.length - 1));
      return frames;
    }
    const single = beforeValues.length === 1;
    const singlePattern = circular ? /if \(head\.next == head\)/ : /if \(head\.next == null\)/;
    conditionFrame(singlePattern, single, 'Comprueba si existe un solo nodo.');
    if (single) {
      complete(/head = null;/, finalMessage, 0);
      return frames;
    }
    if (circular && doubly) {
      addFrame({ pattern: /Node last = head\.prev;/, message: 'Obtiene el último nodo desde head.prev.', position: beforeValues.length - 1, pointer: 'last' });
      addFrame({ pattern: /Node newLast = last\.prev;/, message: 'El nodo anterior será el nuevo último.', position: Math.max(0, beforeValues.length - 2), pointer: 'newLast' });
      addFrame({ pattern: /newLast\.next = head;/, message: 'El nuevo último vuelve a apuntar a head.', position: Math.max(0, afterValues.length - 1), values: afterValues, pointer: 'newLast' });
      complete(/head\.prev = newLast;/, finalMessage, Math.max(0, afterValues.length - 1));
      return frames;
    }
    if (circular) {
      traverse({ pointer: 'previous', initPattern: /Node previous = head;/, loopPattern: /while \(previous\.next\.next != head\)/, movePattern: /previous = previous\.next;/, moves: Math.max(0, beforeValues.length - 2) });
      complete(/previous\.next = head;/, finalMessage, Math.max(0, afterValues.length - 1));
      return frames;
    }
    traverse({ pointer: 'current', initPattern: /Node current = head;/, loopPattern: /while \(current\.next\.next != null\)/, movePattern: /current = current\.next;/, moves: Math.max(0, beforeValues.length - 2) });
    complete(/current\.next = null;/, finalMessage, Math.max(0, afterValues.length - 1));
    return frames;
  }

  if (actionId === 'remove-index') {
    const index = requestedIndex;
    if (!circular && !doubly) {
      conditionFrame(/if \(index == 0\)/, index === 0, 'Comprueba si debe eliminarse la cabeza.', 0, 'head');
      if (index === 0) {
        complete(/head = head\.next;/, finalMessage, 0);
      } else {
        traverse({ pointer: 'previous', initPattern: /Node previous = head;/, loopPattern: /for \(int i = 0; i < index - 1; i\+\+\)/, movePattern: /previous = previous\.next;/, moves: index - 1 });
        complete(/previous\.next = previous\.next\.next;/, finalMessage, Math.max(0, index - 1));
      }
      return frames;
    }
    if (circular && !doubly) {
      const single = beforeValues.length === 1;
      conditionFrame(/if \(size == 1\)/, single, 'Comprueba si existe un solo nodo.', 0, 'head');
      if (single) {
        complete(/head = null;/, finalMessage, 0);
      } else if (index === 0) {
        conditionFrame(/else if \(index == 0\)/, true, 'El índice corresponde a la cabeza.', 0, 'head');
        traverse({ pointer: 'last', initPattern: /Node last = head;/, loopPattern: /while \(last\.next != head\)/, movePattern: /last = last\.next;/, moves: beforeValues.length - 1 });
        addFrame({ pattern: /head = head\.next;/, message: 'head avanza al siguiente nodo.', position: 0, values: afterValues, pointer: 'head' });
        complete(/last\.next = head;/, finalMessage, 0);
      } else {
        conditionFrame(/else if \(index == 0\)/, false, 'El índice no corresponde a la cabeza.', 0, 'head');
        traverse({ pointer: 'previous', initPattern: /Node previous = head;/, loopPattern: /for \(int i = 0; i < index - 1; i\+\+\)/, movePattern: /previous = previous\.next;/, moves: index - 1 });
        complete(/previous\.next = previous\.next\.next;/, finalMessage, Math.max(0, index - 1));
      }
      return frames;
    }

    traverse({ pointer: 'current', initPattern: /Node current = head;/, loopPattern: /for \(int i = 0; i < index; i\+\+\)/, movePattern: /current = current\.next;/, moves: index });
    if (circular) {
      conditionFrame(/if \(size == 1\)/, beforeValues.length === 1, 'Comprueba si existe un solo nodo.', index, 'current', index);
      if (beforeValues.length === 1) complete(/head = null;/, finalMessage, 0);
      else {
        addFrame({ pattern: /current\.prev\.next = current\.next;/, message: 'El nodo anterior salta al nodo que sigue.', position: Math.max(0, index - 1), values: afterValues, pointer: 'current.prev' });
        addFrame({ pattern: /current\.next\.prev = current\.prev;/, message: 'El nodo siguiente enlaza hacia atrás con el anterior.', position: Math.min(index, Math.max(0, afterValues.length - 1)), values: afterValues, pointer: 'current.next' });
        conditionFrame(/if \(current == head\)/, index === 0, 'Comprueba si el nodo encontrado es la cabeza.', index, 'current', index);
        if (index === 0) complete(/head = current\.next;/, finalMessage, 0);
        else finishSuccessfulOperation(finalMessage, Math.max(0, index - 1));
      }
    } else {
      conditionFrame(/if \(current\.prev == null\)/, index === 0, 'Comprueba si el nodo encontrado es la cabeza.', index, 'current', index);
      if (index === 0) {
        addFrame({ pattern: /head = current\.next;/, message: 'head avanza al nodo siguiente.', position: 0, values: afterValues, pointer: 'head' });
      } else {
        addFrame({ pattern: /current\.prev\.next = current\.next;/, message: 'El nodo anterior salta al nodo eliminado.', position: Math.max(0, index - 1), values: afterValues, pointer: 'current.prev' });
      }
      const hasFollowingNode = index < beforeValues.length - 1;
      conditionFrame(/if \(current\.next != null\)/, hasFollowingNode, 'Comprueba si existe un nodo siguiente que deba actualizar prev.', index, 'current', index);
      if (hasFollowingNode) complete(/current\.next\.prev = current\.prev;/, finalMessage, Math.min(index, Math.max(0, afterValues.length - 1)));
      else finishSuccessfulOperation(finalMessage, Math.max(0, afterValues.length - 1));
    }
    return frames;
  }

  if (['find', 'remove-value'].includes(actionId)) {
    const isFind = actionId === 'find';
    const returnFailurePattern = isFind ? /return -1;/ : /return false;/;

    if (beforeValues.length === 0) {
      if (circular) {
        conditionFrame(/if \(head == null\)/, true, 'Comprueba si la lista está vacía.', 0, 'head');
      } else {
        addFrame({ pattern: /Node current = head;/, message: 'current comienza en head, que es null.', position: 0, pointer: 'current' });
        if (!isFind && !doubly) {
          addFrame({ pattern: /Node previous = null;/, message: 'Todavía no existe un nodo anterior.', position: 0, pointer: 'previous' });
        }
        if (isFind) addFrame({ pattern: /int index = 0;/, message: 'La búsqueda prepara el índice 0.', position: 0, pointer: 'current', index: 0 });
        conditionFrame(/while \(current != null\)/, false, 'No hay un nodo que visitar.', 0, 'current', isFind ? 0 : null);
      }
      complete(returnFailurePattern, finalMessage, 0);
      return frames;
    }

    const lastVisited = targetIndex >= 0 ? targetIndex : beforeValues.length - 1;

    if (circular) {
      conditionFrame(/if \(head == null\)/, false, 'La lista contiene al menos un nodo.', 0, 'head');

      if (!isFind && !doubly) {
        const headMatches = targetIndex === 0;
        conditionFrame(/if \(head\.value == target\)/, headMatches, `Compara la cabeza ${beforeValues[0]} con ${requestedValue}.`, 0, 'head', 0);
        if (headMatches) {
          const single = beforeValues.length === 1;
          conditionFrame(/if \(head\.next == head\)/, single, 'Comprueba si la cabeza es el único nodo.', 0, 'head', 0);
          if (single) {
            complete(/head = null;/, finalMessage, 0);
          } else {
            traverse({
              pointer: 'last',
              initPattern: /Node last = head;/,
              loopPattern: /while \(last\.next != head\)/,
              movePattern: /last = last\.next;/,
              moves: beforeValues.length - 1,
            });
            addFrame({ pattern: /head = head\.next;/, message: 'head avanza al nodo siguiente.', position: 0, values: afterValues, pointer: 'head' });
            complete(/last\.next = head;/, finalMessage, 0);
          }
          return frames;
        }

        addFrame({ pattern: /Node previous = head;/, message: 'previous comienza en head, índice 0.', position: 0, pointer: 'previous', index: 0 });
        addFrame({ pattern: /Node current = head\.next;/, message: 'current comienza en el índice 1.', position: Math.min(1, beforeValues.length - 1), pointer: 'current', index: 1 });
        const circularSimpleStart = 1;
        const circularSimpleEnd = targetIndex >= 1 ? targetIndex : beforeValues.length - 1;
        for (let index = circularSimpleStart; index <= circularSimpleEnd; index++) {
          addFrame({ pattern: /do \{/, message: `El ciclo procesa el índice ${index}.`, position: index, pointer: 'current', index });
          const matches = index === targetIndex;
          conditionFrame(/if \(current\.value == target\)/, matches, `Compara ${beforeValues[index]} con ${requestedValue}.`, index, 'current', index);
          if (matches) {
            complete(/previous\.next = current\.next;/, finalMessage, Math.max(0, index - 1));
            return frames;
          }
          addFrame({ pattern: /previous = current;/, message: `previous queda en el índice ${index}.`, position: index, pointer: 'previous', index });
          const returnsToHead = index === beforeValues.length - 1;
          addFrame({
            pattern: /current = current\.next;/,
            message: returnsToHead ? 'current vuelve a head.' : `current avanza al índice ${index + 1}.`,
            position: returnsToHead ? 0 : index + 1,
            pointer: 'current',
            index: index + 1,
          });
          conditionFrame(/while \(current != head\)/, !returnsToHead, returnsToHead ? 'El recorrido volvió a head y termina.' : 'El recorrido todavía no volvió a head.', returnsToHead ? 0 : index + 1, 'current', index + 1);
        }
        complete(/return false;/, finalMessage, Math.max(0, beforeValues.length - 1));
        return frames;
      }

      addFrame({ pattern: /Node current = head;/, message: 'current comienza en head, índice 0.', position: 0, pointer: 'current', index: 0 });
      if (isFind) addFrame({ pattern: /int index = 0;/, message: 'La búsqueda comienza en el índice 0.', position: 0, pointer: 'current', index: 0 });

      for (let index = 0; index <= lastVisited; index++) {
        addFrame({ pattern: /do \{/, message: `El ciclo procesa el índice ${index}.`, position: index, pointer: 'current', index });
        const matches = index === targetIndex;
        conditionFrame(/if \(current\.value == target\)/, matches, `Compara ${beforeValues[index]} con ${requestedValue}.`, index, 'current', index);
        if (matches) {
          if (isFind) {
            complete(/return index;/, finalMessage, index);
            return frames;
          }

          const single = beforeValues.length === 1;
          conditionFrame(/if \(size == 1\)/, single, 'Comprueba si current es el único nodo.', index, 'current', index);
          if (single) {
            complete(/head = null;/, finalMessage, 0);
            return frames;
          }
          addFrame({ pattern: /current\.prev\.next = current\.next;/, message: 'El nodo anterior salta al nodo encontrado.', position: Math.max(0, index - 1), values: afterValues, pointer: 'current.prev', index });
          addFrame({ pattern: /current\.next\.prev = current\.prev;/, message: 'El nodo siguiente enlaza hacia atrás con el anterior.', position: Math.min(index, Math.max(0, afterValues.length - 1)), values: afterValues, pointer: 'current.next', index });
          conditionFrame(/if \(current == head\)/, index === 0, 'Comprueba si el nodo eliminado es head.', index, 'current', index, afterValues);
          if (index === 0) complete(/head = current\.next;/, finalMessage, 0);
          else finishSuccessfulOperation(finalMessage, Math.max(0, index - 1));
          return frames;
        }

        const returnsToHead = index === beforeValues.length - 1;
        addFrame({
          pattern: /current = current\.next;/,
          message: returnsToHead ? 'current vuelve a head.' : `current avanza al índice ${index + 1}.`,
          position: returnsToHead ? 0 : index + 1,
          pointer: 'current',
          index: index + 1,
        });
        if (isFind) addFrame({ pattern: /index\+\+;/, message: `index aumenta a ${index + 1}.`, position: returnsToHead ? 0 : index + 1, pointer: 'current', index: index + 1 });
        conditionFrame(/while \(current != head\)/, !returnsToHead, returnsToHead ? 'El recorrido volvió a head y termina.' : 'El recorrido continúa.', returnsToHead ? 0 : index + 1, 'current', index + 1);
      }
      complete(returnFailurePattern, finalMessage, Math.max(0, beforeValues.length - 1));
      return frames;
    }

    addFrame({ pattern: /Node current = head;/, message: 'current comienza en head, índice 0.', position: 0, pointer: 'current', index: 0 });
    if (!isFind && !doubly) addFrame({ pattern: /Node previous = null;/, message: 'Al comenzar todavía no existe un nodo anterior.', position: 0, pointer: 'previous', index: 0 });
    if (isFind) addFrame({ pattern: /int index = 0;/, message: 'La búsqueda comienza en el índice 0.', position: 0, pointer: 'current', index: 0 });

    for (let index = 0; index <= lastVisited; index++) {
      conditionFrame(/while \(current != null\)/, true, `El recorrido visita el índice ${index}.`, index, 'current', index);
      const matches = index === targetIndex;
      conditionFrame(/if \(current\.value == target\)/, matches, `Compara ${beforeValues[index]} con ${requestedValue}.`, index, 'current', index);
      if (matches) {
        if (isFind) {
          complete(/return index;/, finalMessage, index);
          return frames;
        }
        if (!doubly) {
          const atHead = index === 0;
          conditionFrame(/if \(previous == null\)/, atHead, 'Comprueba si current es head.', index, 'current', index);
          complete(atHead ? /head = current\.next;/ : /previous\.next = current\.next;/, finalMessage, Math.max(0, index - 1));
          return frames;
        }

        const atHead = index === 0;
        conditionFrame(/if \(current\.prev == null\)/, atHead, 'Comprueba si current es head.', index, 'current', index);
        if (atHead) {
          addFrame({ pattern: /head = current\.next;/, message: 'head avanza al nodo siguiente.', position: 0, values: afterValues, pointer: 'head', index });
        } else {
          addFrame({ pattern: /current\.prev\.next = current\.next;/, message: 'El nodo anterior salta al nodo encontrado.', position: Math.max(0, index - 1), values: afterValues, pointer: 'current.prev', index });
        }
        const hasFollowingNode = index < beforeValues.length - 1;
        conditionFrame(/if \(current\.next != null\)/, hasFollowingNode, 'Comprueba si existe un nodo siguiente que deba actualizar prev.', index, 'current', index, afterValues);
        if (hasFollowingNode) complete(/current\.next\.prev = current\.prev;/, finalMessage, Math.min(index, Math.max(0, afterValues.length - 1)));
        else finishSuccessfulOperation(finalMessage, Math.max(0, afterValues.length - 1));
        return frames;
      }

      if (!isFind && !doubly) addFrame({ pattern: /previous = current;/, message: `previous queda en el índice ${index}.`, position: index, pointer: 'previous', index });
      addFrame({
        pattern: /current = current\.next;/,
        message: index === beforeValues.length - 1 ? 'current avanza a null.' : `current avanza al índice ${index + 1}.`,
        position: Math.min(index + 1, beforeValues.length - 1),
        pointer: 'current',
        pointerValue: index === beforeValues.length - 1 ? null : undefined,
        index: index + 1,
      });
      if (isFind) addFrame({ pattern: /index\+\+;/, message: `index aumenta a ${index + 1}.`, position: Math.min(index + 1, beforeValues.length - 1), pointer: 'current', index: index + 1 });
    }
    conditionFrame(/while \(current != null\)/, false, 'current es null y el recorrido termina.', Math.max(0, beforeValues.length - 1), 'current', beforeValues.length, beforeValues, 0, null);
    complete(returnFailurePattern, finalMessage, Math.max(0, beforeValues.length - 1));
    return frames;
  }

  if (!succeeded) return reject(/return false;|return -1;/, true);
  complete(null);
  return frames;
}

const orderedBinaryTreeIds = new Set(['bst', 'avl', 'rojo-negro', 'splay-tree', 'kd-tree']);
const binaryTreeIds = new Set([
  'arbol-binario', 'bst', 'avl', 'rojo-negro', 'splay-tree', 'heap',
  'segment-tree', 'merkle-tree', 'kd-tree', 'expression-tree',
]);

const occupiedTreePosition = (values, index) => (
  index >= 0 && index < values.length && values[index] !== undefined && values[index] !== null
);

function binarySearchVisitPositions(values, target, includeInsertionPosition = false) {
  const positions = [];
  let index = 0;
  while (index < 15) {
    positions.push(index);
    if (!occupiedTreePosition(values, index)) break;
    const current = Number(values[index]);
    const requested = Number(target);
    if (!Number.isFinite(current) || !Number.isFinite(requested) || current === requested) break;
    index = requested < current ? index * 2 + 1 : index * 2 + 2;
  }
  if (!includeInsertionPosition && !occupiedTreePosition(values, positions.at(-1))) positions.pop();
  return positions;
}

function binaryTraversalPositions(values, order) {
  const positions = [];
  const visit = index => {
    if (!occupiedTreePosition(values, index)) return;
    if (order === 'preorder') positions.push(index);
    visit(index * 2 + 1);
    if (order === 'inorder') positions.push(index);
    visit(index * 2 + 2);
    if (order === 'postorder') positions.push(index);
  };
  visit(0);
  return positions;
}

function heapVisitPositions(actionId, beforeValues, afterValues, finalStep) {
  if (actionId === 'heap-add') {
    let index = Math.max(0, afterValues.length - 1);
    const positions = [index];
    while (index > 0) {
      index = Math.floor((index - 1) / 2);
      positions.push(index);
    }
    return positions;
  }
  if (actionId === 'heap-extract') {
    const positions = [0];
    let index = 0;
    while (index * 2 + 1 < afterValues.length) {
      const left = index * 2 + 1;
      const right = left + 1;
      index = right < afterValues.length && Number(afterValues[right]) > Number(afterValues[left]) ? right : left;
      positions.push(index);
    }
    return positions;
  }
  return [Math.max(0, Number(finalStep) || 0)];
}

function treeVisitPositions({ algorithm, actionId, beforeValues, afterValues, finalStep, inputValues }) {
  const target = inputValues.value;
  if (algorithm.type === 'heap') return heapVisitPositions(actionId, beforeValues, afterValues, finalStep);

  if (orderedBinaryTreeIds.has(algorithm.id) && ['tree-add', 'find', 'remove-value'].includes(actionId)) {
    return binarySearchVisitPositions(beforeValues, target, actionId === 'tree-add');
  }

  if (binaryTreeIds.has(algorithm.id) && ['preorder', 'inorder', 'postorder'].includes(actionId)) {
    return binaryTraversalPositions(beforeValues, actionId);
  }

  if (['preorder', 'inorder', 'postorder', 'range-view', 'merkle-root'].includes(actionId)) {
    return beforeValues.map((value, index) => value === undefined ? null : index).filter(index => index !== null);
  }

  if (['prefix-sum', 'range-min'].includes(actionId)) {
    const limit = Math.max(0, Number(inputValues.index) || 0);
    return Array.from({ length: Math.min(beforeValues.length, limit + 1) }, (_, index) => index);
  }

  if (actionId === 'range-update') return [Math.max(0, Number(inputValues.index) || 0)];
  if (['find', 'remove-value', 'word-find', 'remove-word'].includes(actionId)) {
    const found = beforeValues.findIndex(value => String(value) === String(target));
    const end = found >= 0 ? found : beforeValues.length - 1;
    return Array.from({ length: Math.max(1, end + 1) }, (_, index) => index);
  }
  if (['tree-add', 'sorted-add', 'set-word', 'set-expression', 'add-end'].includes(actionId)) {
    return [Math.max(0, Number(finalStep) || Math.max(0, afterValues.length - 1))];
  }
  return [Math.max(0, Number(finalStep) || 0)];
}

function structuralMutationLine(code, algorithm, actionId) {
  const lines = code.split('\n');
  const patterns = actionId === 'tree-add'
    ? algorithm.id === 'avl'
      ? [/return node;/, /return rotate/, /new Node/]
      : algorithm.id === 'rojo-negro'
        ? [/fixAfterInsert/, /root =/, /new Node/]
        : algorithm.id === 'splay-tree'
          ? [/root = splay/, /return new Node/, /new Node/]
          : [/return new Node/, /new Node/, /children\.add/, /children\[/, /points\[/, /node\.value\s*=/]
    : actionId === 'heap-add'
      ? [/swap\(/, /heap\[index\]\s*=\s*value/, /values\[size\]\s*=\s*value/]
      : actionId === 'heap-extract'
        ? [/size--/, /swap\(/, /heap\[0\]\s*=/]
        : ['remove-value', 'remove-word', 'remove-end'].includes(actionId)
          ? [/size--/, /isWord\s*=\s*false/, /return node\.(?:left|right)/, /keyCount--/]
          : actionId === 'range-update'
            ? [/\+=\s*delta/, /tree\[node\]\s*=/, /values\[index\]\s*=/]
            : actionId === 'sorted-add'
              ? [/insertIntoParent/, /split/, /keys\[index\]\s*=\s*value/, /keyCount\+\+/]
              : actionId === 'set-word'
                ? [/isWord\s*=\s*true/, /text\s*=/]
                : actionId === 'set-expression'
                  ? [/return root/, /new Node/]
                  : actionId === 'add-end'
                    ? [/blocks\[size\]\s*=/, /size\+\+/]
                    : [];

  for (const pattern of patterns) {
    const index = lines.findIndex(line => pattern.test(line));
    if (index >= 0) return index;
  }
  return null;
}

export function createTreeSynchronizedFrames(args) {
  const baseFrames = createCodeSynchronizedFrames(args);
  if (!args.succeeded || !baseFrames.length) return baseFrames;

  const visits = treeVisitPositions(args).filter(position => Number.isInteger(position) && position >= 0);
  if (!visits.length) return baseFrames;

  const repeatsRecursiveMethod = orderedBinaryTreeIds.has(args.algorithm.id)
    && ['tree-add', 'find', 'remove-value', 'preorder', 'inorder', 'postorder'].includes(args.actionId)
    && visits.length > 1;
  const bodyFrames = baseFrames.filter(frame => !frame.completed);
  const timeline = repeatsRecursiveMethod
    ? [
        ...visits.flatMap((position, visitIndex) => bodyFrames.map(frame => ({
          ...frame,
          treeVisitPosition: position,
          treeVisitIndex: visitIndex,
          treeVisitTotal: visits.length,
        }))),
        { ...baseFrames.at(-1), completed: true },
      ]
    : baseFrames;

  const changesStructure = JSON.stringify(args.beforeValues) !== JSON.stringify(args.afterValues);
  const mutationLine = structuralMutationLine(args.code, args.algorithm, args.actionId);
  let mutationFrame = -1;
  if (changesStructure && mutationLine !== null) {
    for (let index = timeline.length - 1; index >= 0; index--) {
      if (timeline[index].codeLine === mutationLine) {
        mutationFrame = index;
        break;
      }
    }
  }
  if (changesStructure && mutationFrame < 0) mutationFrame = Math.max(0, timeline.length - 2);

  return timeline.map((frame, index) => {
    const progress = timeline.length <= 1 ? 1 : index / (timeline.length - 1);
    const visitIndex = Math.min(visits.length - 1, Math.floor(progress * visits.length));
    let position = frame.completed
      ? Math.max(0, Number(args.finalStep) || 0)
      : frame.treeVisitPosition ?? visits[visitIndex];
    const values = changesStructure && index < mutationFrame
      ? copyVisualValues(args.beforeValues)
      : changesStructure
        ? copyVisualValues(args.afterValues)
        : copyVisualValues(frame.values);
    if (values[position] === undefined && index < mutationFrame) {
      const previousVisiblePosition = visits.slice(0, visitIndex + 1).reverse()
        .find(candidate => args.beforeValues[candidate] !== undefined);
      if (previousVisiblePosition !== undefined) position = previousVisiblePosition;
    }
    const visibleValue = values[position] ?? args.beforeValues[position];
    const variables = [
      ...(frame.variables ?? []).filter(variable => variable.name !== 'posición activa'),
      { name: 'nodo activo', value: readableVariableValue(visibleValue), role: 'value' },
      { name: 'índice del nodo', value: readableVariableValue(position), role: 'position' },
    ];
    if (frame.treeVisitIndex !== undefined) {
      variables.push({
        name: 'llamada recursiva',
        value: `${frame.treeVisitIndex + 1} de ${frame.treeVisitTotal}`,
        role: 'index',
      });
    }
    const message = frame.completed
      ? args.finalMessage
      : visibleValue !== undefined
        ? `Nodo ${visibleValue}: ${frame.message}`
        : frame.message;
    return { ...frame, values, position, variables, message };
  });
}

export function adaptFramesToCode(frames, code, keepOriginalLines) {
  const lines = executableCodeLines(code);
  const lastCodeLine = Math.max(0, code.split('\n').length - 1);
  const sourceLines = code.split('\n');
  const operationMarker = sourceLines.findIndex(line => line.trim() === '// Start of the selected operation');
  const operationEndMarker = sourceLines.findIndex((line, index) => (
    index > operationMarker && line.trim() === '// End of the selected operation'
  ));
  const selectedStart = operationMarker >= 0 ? operationMarker + 1 : 0;
  const selectedEnd = operationEndMarker >= 0 ? operationEndMarker - 1 : sourceLines.length - 1;
  const phasePatterns = {
    search: [/findLeaf\(/, /Node leaf\s*=/],
    insert: [/insertInOrder\(/, /insertNonFull\(/],
    split: [/splitLeaf\(/, /splitChild\(/, /splitTwoNodesIntoThree\(/],
    promote: [/insertIntoParent\(/, /int separator\s*=/, /parent\.keys\[childIndex\]\s*=/, /insertSeparator\(/, /redistribute\(/],
    settled: [/^}\s*$/],
  };
  return frames.map((frame, index) => {
    if (keepOriginalLines) {
      if (frame.codeNeedle) {
        let matchedLine = sourceLines.findIndex((line, sourceIndex) => (
          sourceIndex >= selectedStart
          && sourceIndex <= selectedEnd
          && line.includes(frame.codeNeedle)
        ));
        if (matchedLine < 0) {
          matchedLine = sourceLines.findIndex(line => line.includes(frame.codeNeedle));
        }
        if (matchedLine >= 0) return { ...frame, codeLine: matchedLine };
      }
      if (frame.treePhase) {
        const patterns = phasePatterns[frame.treePhase] ?? [];
        let matchedLine = -1;
        for (const pattern of patterns) {
          matchedLine = sourceLines.findIndex(line => pattern.test(line.trim()));
          if (matchedLine >= 0) break;
        }
        if (frame.treePhase === 'settled') {
          const endMarker = sourceLines.findIndex(line => line.trim() === '// End of the selected operation');
          if (endMarker > 0) matchedLine = endMarker - 1;
        }
        if (matchedLine >= 0) return { ...frame, codeLine: matchedLine };
      }
      return { ...frame, codeLine: Math.min(lastCodeLine, Math.max(0, frame.codeLine ?? 0)) };
    }
    const progress = frames.length <= 1 ? 1 : index / (frames.length - 1);
    const line = lines[Math.min(lines.length - 1, Math.round(progress * Math.max(0, lines.length - 1)))];
    return { ...frame, codeLine: line?.index ?? 0 };
  });
}
