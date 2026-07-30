const fields = `class DenseMatrix {
    static final int SIZE = 4;

    int[][] values = {
        {3, 0, 7, 2},
        {5, 1, 0, 8},
        {4, 6, 9, 0},
        {2, 7, 3, 5}
    };`;

const validPosition = `boolean validPosition(int row, int column) {
        return row >= 0 && row < SIZE
            && column >= 0 && column < SIZE;
    }`;

const validIndex = `boolean validIndex(int index) {
        return index >= 0 && index < SIZE;
    }`;

const fillMethod = `void fill(int value) {
        for (int row = 0; row < SIZE; row++) {
            for (int column = 0; column < SIZE; column++) {
                values[row][column] = value;
            }
        }
    }`;

const operations = {
  'matrix-set': `boolean set(int row, int column, int value) {
        if (!validPosition(row, column)) {
            return false;
        }
        values[row][column] = value;
        return true;
    }`,
  'matrix-get': `Integer get(int row, int column) {
        if (!validPosition(row, column)) {
            return null;
        }
        return values[row][column];
    }`,
  'matrix-row': `int[] readRow(int row) {
        if (!validIndex(row)) {
            return new int[0];
        }
        int[] result = new int[SIZE];
        for (int column = 0; column < SIZE; column++) {
            result[column] = values[row][column];
        }
        return result;
    }`,
  'matrix-column': `int[] readColumn(int column) {
        if (!validIndex(column)) {
            return new int[0];
        }
        int[] result = new int[SIZE];
        for (int row = 0; row < SIZE; row++) {
            result[row] = values[row][column];
        }
        return result;
    }`,
  'matrix-transpose': `void transpose() {
        for (int row = 0; row < SIZE; row++) {
            for (int column = row + 1; column < SIZE; column++) {
                int temporary = values[row][column];
                values[row][column] = values[column][row];
                values[column][row] = temporary;
            }
        }
    }`,
  'matrix-fill': fillMethod,
  'matrix-clear': `void clear() {
        fill(0);
    }`,
};

const helpers = {
  'matrix-set': validPosition,
  'matrix-get': validPosition,
  'matrix-row': validIndex,
  'matrix-column': validIndex,
  'matrix-transpose': '',
  'matrix-fill': '',
  'matrix-clear': fillMethod,
};

function classMember(source) {
  return `    ${source}`;
}

export function getDenseMatrixJava(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  const helper = helpers[actionId];

  return `${fields}

    // Start of the selected operation
${classMember(operation)}
    // End of the selected operation
${helper ? `
    // Helper used by the selected operation
${classMember(helper)}` : ''}
}`;
}
