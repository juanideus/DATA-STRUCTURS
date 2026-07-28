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
