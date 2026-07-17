export const copyVisualValues = values => values.map(value => (
  value && typeof value === 'object' ? { ...value } : value
));

export function executableCodeLines(code) {
  return code.split('\n')
    .map((text, index) => ({ index, text: text.trim() }))
    .filter(line => line.text && line.text !== '}' && line.text !== '};');
}

const isLoop = text => /\b(?:for|while)\s*\(/.test(text);
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

export function estimateLoopIterations({ actionId, beforeValues, afterValues, finalStep, finalMessage = '' }) {
  const beforeLength = Math.max(1, beforeValues.length);
  const afterLength = Math.max(1, afterValues.length);
  const target = Math.max(0, Number(finalStep) || 0);
  const failedSearch = /no (?:existe|fue encontrado|aparece)|no existe/i.test(finalMessage);

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
  const expanded = expandBlock(lines, 0, lines.length - 1, Math.max(1, iterationCount));
  const maximumFrames = 180;
  if (expanded.length <= maximumFrames) return expanded;

  const finalLine = executableCodeLines(code).at(-1) ?? { index: 0, text: 'operation' };
  return [...expanded.slice(0, maximumFrames - 1), { ...finalLine, truncated: true }];
}

const cloneEdges = edges => edges.map(edge => [...edge]);

function framePosition(actionId, line, beforeValues, workingValues, finalStep) {
  const length = Math.max(1, workingValues.length);
  const iteration = Math.max(0, line.iteration ?? 0);
  const target = Math.max(0, Number(finalStep) || 0);

  if (['add-start','add-index'].includes(actionId)) return Math.max(target, Math.min(length - 1, beforeValues.length - iteration));
  if (['remove-start','remove-index','dequeue'].includes(actionId)) return Math.min(length - 1, target + iteration);
  if (['find','remove-value','cache-get','word-find','prefix-sum','range-min','range-view','merkle-root','reset','clear-bits'].includes(actionId)) return Math.min(length - 1, iteration);
  if (['sort','shuffle'].includes(actionId)) return Math.min(length - 1, line.outerIteration ?? iteration);
  return Math.min(length - 1, line.iteration === null || line.iteration === undefined ? target : iteration);
}

function applyVisibleMutation({ actionId, line, workingValues, beforeValues, afterValues, finalStep }) {
  const text = line.text.replace(/\s+/g, ' ');
  const iteration = Math.max(0, line.iteration ?? 0);
  const target = Math.max(0, Number(finalStep) || 0);

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

function loopIndexValue(actionId, line, beforeValues, finalStep) {
  if (line.iteration === null || line.iteration === undefined) return null;
  const iteration = Math.max(0, line.iteration);
  const target = Math.max(0, Number(finalStep) || 0);

  if (['add-start', 'add-index'].includes(actionId)) {
    return Math.max(target, beforeValues.length - iteration);
  }
  if (actionId === 'remove-index') return target + iteration;
  return iteration;
}

function createLiveVariables({ actionId, line, beforeValues, workingValues, finalStep, position, inputValues = {} }) {
  const index = loopIndexValue(actionId, line, beforeValues, finalStep);
  const hasRequestedIndex = inputValues.index !== undefined && inputValues.index !== null && inputValues.index !== '';
  const requestedIndex = hasRequestedIndex ? Number(inputValues.index) : null;
  const requestedValue = inputValues.value ?? inputValues.word ?? inputValues.key;
  const sizeGrows = /\bsize\s*(?:\+\+|\+=)/.test(line.text);
  const sizeShrinks = /\bsize\s*(?:--|-=)/.test(line.text);
  const visibleSize = beforeValues.length + (sizeGrows ? 1 : sizeShrinks ? -1 : 0);
  const variables = [];

  if (index !== null) variables.push({ name: 'i', value: readableVariableValue(index), role: 'index' });
  variables.push({ name: 'size', value: readableVariableValue(visibleSize), role: 'size' });
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

  if (!succeeded) {
    return [{
      values: copyVisualValues(beforeValues), edges: cloneEdges(beforeEdges), position: 0,
      codeLine: fallbackLine.index, message: finalMessage, delayMs: 0, failed: true,
      variables: createLiveVariables({ actionId, line: fallbackLine, beforeValues, workingValues: beforeValues, finalStep, position: 0, inputValues }),
    }];
  }

  const iterationCount = estimateLoopIterations({ actionId, beforeValues, afterValues, finalStep, finalMessage });
  const sequence = buildCodeExecutionTrace(code, iterationCount);
  const workingValues = copyVisualValues(beforeValues);
  const frames = sequence.map(line => {
    applyVisibleMutation({ actionId, line, workingValues, beforeValues, afterValues, finalStep });
    const position = framePosition(actionId, line, beforeValues, workingValues, finalStep);
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
      variables: createLiveVariables({ actionId, line, beforeValues, workingValues, finalStep, position, inputValues }),
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
      { name: 'size', value: readableVariableValue(afterValues.length), role: 'size' },
      { name: 'posición final', value: readableVariableValue(Math.max(0, Number(finalStep) || 0)), role: 'position' },
      { name: 'estado', value: 'completado', role: 'true' },
    ],
  };
  if (!frames.length) return [finalFrame];
  frames.push(finalFrame);
  return frames;
}

export function adaptFramesToCode(frames, code, keepOriginalLines) {
  const lines = executableCodeLines(code);
  const lastCodeLine = Math.max(0, code.split('\n').length - 1);
  return frames.map((frame, index) => {
    if (keepOriginalLines) return { ...frame, codeLine: Math.min(lastCodeLine, Math.max(0, frame.codeLine ?? 0)) };
    const progress = frames.length <= 1 ? 1 : index / (frames.length - 1);
    const line = lines[Math.min(lines.length - 1, Math.round(progress * Math.max(0, lines.length - 1)))];
    return { ...frame, codeLine: line?.index ?? 0 };
  });
}
