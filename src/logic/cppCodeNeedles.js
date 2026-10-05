const radixNeedles = {
  'radix-start': 'bool sort()',
  'radix-size-check': 'if (size < 2)',
  'radix-offset': 'long long offsetValue',
  'radix-maximum': 'long long maximumKey',
  'radix-exp-loop': 'for (long long exponent',
  'radix-output-array': 'int* output =',
  'radix-pass': 'int* count =',
  'radix-digit': 'long long key =',
  'radix-count': 'count[(key / exponent)',
  'radix-prefix': 'for (int digit = 1;',
  'radix-output': 'output[--count[digit]]',
  'radix-decrement': 'output[--count[digit]]',
  'radix-write': 'values[i] = output[i];',
  'radix-complete': 'return true;',
};

export function cppCodeNeedle(algorithmId, actionId, frame) {
  if (algorithmId === 'radix-sort') return radixNeedles[frame.sortPhase] ?? null;
  if (algorithmId !== 'polinomios') return null;

  const needle = frame.codeNeedle;
  if (needle === 'C = null;') return 'clearList(C);';
  const target = actionId.endsWith('a') ? 'A' : 'B';
  if (actionId.startsWith('poly-insert-')) {
    if (needle?.startsWith('void insertIn')) return `void insert${target}(`;
    if (needle === `${target} = insertOrdered(${target}, coefficient, exponent);`) {
      return `insertTerm(${target}, coefficient, exponent);`;
    }
    if (needle === 'if (coefficient == 0) {') return 'if (coefficient == 0) return;';
  }
  if (actionId.startsWith('poly-remove-')) {
    if (needle?.startsWith('void removeFrom')) return `bool remove${target}(`;
    if (needle === `${target} = removeExponent(${target}, exponent);`) {
      return `bool removed = removeTerm(${target}, exponent);`;
    }
  }
  return null;
}
