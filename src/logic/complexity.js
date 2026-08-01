export const COMPLEXITY_ORDERS = [
  { id: 'constant', label: 'O(1)', name: 'Constante', color: '#4f7c78' },
  { id: 'logarithmic', label: 'O(log n)', name: 'Logarítmica', color: '#3973a5' },
  { id: 'linear', label: 'O(n)', name: 'Lineal', color: '#8a6a3d' },
  { id: 'linearithmic', label: 'O(n log n)', name: 'Lineal-logarítmica', color: '#7a5c99' },
  { id: 'quadratic', label: 'O(n²)', name: 'Cuadrática', color: '#bd6b42' },
  { id: 'exponential', label: 'O(2ⁿ)', name: 'Exponencial', color: '#a74444' },
];

export function complexityValue(order, n) {
  const size = Math.max(1, Number(n));
  if (order === 'constant') return 1;
  if (order === 'logarithmic') return Math.max(1, Math.ceil(Math.log2(size)));
  if (order === 'linear') return size;
  if (order === 'linearithmic') return Math.ceil(size * Math.log2(size));
  if (order === 'quadratic') return size * size;
  if (order === 'exponential') return 2 ** size;
  return 0;
}
