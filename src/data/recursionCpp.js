const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const calculate = {
  fibonacci: `int fibonacci(int number) {
    if (number <= 1) return number;
    int left = fibonacci(number - 1);
    int right = fibonacci(number - 2);
    return left + right;
}`,
  factorial: `int factorial(int number) {
    if (number < 0 || number > 10) throw std::invalid_argument("Use a number from 0 to 10");
    if (number <= 1) return 1;
    int smaller = factorial(number - 1);
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
  const resultType = 'int';
  return `${algorithmId === 'factorial' && actionId === 'calculate' ? '#include <stdexcept>\n\n' : ''}class RecursiveCalculation {
public:
    ${resultType} result = 0;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
};`;
}
