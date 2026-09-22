const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const calculate = {
  fibonacci: `int fibonacci(int number) {
    if (number <= 1) return number;
    int left = fibonacci(number - 1);
    int right = fibonacci(number - 2);
    return left + right;
}`,
  factorial: `long long factorial(int number) {
    if (number <= 1) return 1;
    long long smaller = factorial(number - 1);
    return number * smaller;
}`,
};

export function getRecursionCpp(algorithmId, actionId) {
  if (!['fibonacci', 'factorial'].includes(algorithmId)) return null;
  const operation = actionId === 'calculate'
    ? calculate[algorithmId]
    : actionId === 'reset'
      ? `void reset() {
    result = 0;
}`
      : null;
  if (!operation) return null;
  const resultType = algorithmId === 'factorial' ? 'long long' : 'int';
  return `class RecursiveCalculation {
public:
    ${resultType} result = 0;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
};`;
}
