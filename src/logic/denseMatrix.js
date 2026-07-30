export const DENSE_MATRIX_SIZE = 4;
export const DENSE_MATRIX_CELL_COUNT = DENSE_MATRIX_SIZE * DENSE_MATRIX_SIZE;

export const DEFAULT_DENSE_MATRIX_VALUES = [
  3, 0, 7, 2,
  5, 1, 0, 8,
  4, 6, 9, 0,
  2, 7, 3, 5,
];

export function denseMatrixIndex(row, column) {
  return row * DENSE_MATRIX_SIZE + column;
}

export function validDenseMatrixCoordinate(value) {
  return Number.isInteger(value) && value >= 0 && value < DENSE_MATRIX_SIZE;
}

export function normalizeDenseMatrixValues(values) {
  return Array.from(
    { length: DENSE_MATRIX_CELL_COUNT },
    (_, index) => Number.isFinite(Number(values[index])) ? Number(values[index]) : 0,
  );
}

export function transposeDenseMatrix(values) {
  const transposed = normalizeDenseMatrixValues(values);
  for (let row = 0; row < DENSE_MATRIX_SIZE; row++) {
    for (let column = row + 1; column < DENSE_MATRIX_SIZE; column++) {
      const first = denseMatrixIndex(row, column);
      const second = denseMatrixIndex(column, row);
      [transposed[first], transposed[second]] = [transposed[second], transposed[first]];
    }
  }
  return transposed;
}
