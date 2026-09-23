const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const denseOperations = {
  'matrix-set': `bool set(int row, int column, int value) {
    if (!validPosition(row, column)) return false;
    values[row][column] = value;
    return true;
}`,
  'matrix-get': `bool get(int row, int column, int& value) const {
    if (!validPosition(row, column)) return false;
    value = values[row][column];
    return true;
}`,
  'matrix-row': `bool copyRow(int row, int output[]) const {
    if (row < 0 || row >= size) return false;
    for (int column = 0; column < size; column++) {
        output[column] = values[row][column];
    }
    return true;
}`,
  'matrix-column': `bool copyColumn(int column, int output[]) const {
    if (column < 0 || column >= size) return false;
    for (int row = 0; row < size; row++) {
        output[row] = values[row][column];
    }
    return true;
}`,
  'matrix-transpose': `void transpose() {
    for (int row = 0; row < size; row++) {
        for (int column = row + 1; column < size; column++) {
            int temporary = values[row][column];
            values[row][column] = values[column][row];
            values[column][row] = temporary;
        }
    }
}`,
  'matrix-fill': `void fill(int value) {
    for (int row = 0; row < size; row++) {
        for (int column = 0; column < size; column++) {
            values[row][column] = value;
        }
    }
}`,
  'matrix-clear': `void clear() {
    for (int row = 0; row < size; row++) {
        for (int column = 0; column < size; column++) {
            values[row][column] = 0;
        }
    }
}`,
};

const validPosition = `bool validPosition(int row, int column) const {
    return row >= 0 && row < size && column >= 0 && column < size;
}`;

export function getDenseMatrixCpp(actionId) {
  const operation = denseOperations[actionId];
  if (!operation) return null;
  const needsValidation = ['matrix-set', 'matrix-get'].includes(actionId);
  return `class DenseMatrix {
public:
    int size;
    int** values;

    explicit DenseMatrix(int dimension = 4)
        : size(dimension > 0 ? dimension : 1), values(new int*[size]{}) {
        for (int row = 0; row < size; row++) values[row] = new int[size]{};
    }
    DenseMatrix(const DenseMatrix&) = delete;
    DenseMatrix& operator=(const DenseMatrix&) = delete;
    ~DenseMatrix() {
        for (int row = 0; row < size; row++) delete[] values[row];
        delete[] values;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${needsValidation ? `\n    // Auxiliary method used above\n${indent(validPosition)}` : ''}
};`;
}

const sparseOperations = {
  'matrix-insert': `bool insert(int value, int row, int column) {
    if (!validPosition(row, column)) return false;
    if (value == 0) {
        remove(row, column);
        return true;
    }

    Node* rowHeader = AROW[row];
    Node* previousRow = rowHeader;
    Node* currentRow = rowHeader->left;
    while (currentRow != rowHeader && currentRow->column > column) {
        previousRow = currentRow;
        currentRow = currentRow->left;
    }
    if (currentRow != rowHeader && currentRow->column == column) {
        currentRow->value = value;
        return true;
    }

    Node* columnHeader = ACOL[column];
    Node* previousColumn = columnHeader;
    Node* currentColumn = columnHeader->up;
    while (currentColumn != columnHeader && currentColumn->row > row) {
        previousColumn = currentColumn;
        currentColumn = currentColumn->up;
    }

    Node* newNode = new Node(value, row, column);
    newNode->left = currentRow;
    previousRow->left = newNode;
    newNode->up = currentColumn;
    previousColumn->up = newNode;
    nonZeroCount++;
    return true;
}`,
  'matrix-get': `bool get(int row, int column, int& value) const {
    if (!validPosition(row, column)) return false;
    Node* header = AROW[row];
    Node* current = header->left;
    while (current != header && current->column > column) current = current->left;
    value = current != header && current->column == column ? current->value : 0;
    return true;
}`,
  'matrix-remove': `bool remove(int row, int column) {
    if (!validPosition(row, column)) return false;
    Node* rowHeader = AROW[row];
    Node* previousRow = rowHeader;
    Node* target = rowHeader->left;
    while (target != rowHeader && target->column > column) {
        previousRow = target;
        target = target->left;
    }
    if (target == rowHeader || target->column != column) return false;
    previousRow->left = target->left;

    Node* columnHeader = ACOL[column];
    Node* previousColumn = columnHeader;
    Node* currentColumn = columnHeader->up;
    while (currentColumn != target) {
        previousColumn = currentColumn;
        currentColumn = currentColumn->up;
    }
    previousColumn->up = target->up;
    delete target;
    nonZeroCount--;
    return true;
}`,
  'matrix-row': `bool copyRow(int row, int* output) const {
    if (row < 0 || row >= height) return false;
    for (int column = 0; column < width; column++) output[column] = 0;
    Node* header = AROW[row];
    Node* current = header->left;
    while (current != header) {
        output[current->column] = current->value;
        current = current->left;
    }
    return true;
}`,
  'matrix-column': `bool copyColumn(int column, int* output) const {
    if (column < 0 || column >= width) return false;
    for (int row = 0; row < height; row++) output[row] = 0;
    Node* header = ACOL[column];
    Node* current = header->up;
    while (current != header) {
        output[current->row] = current->value;
        current = current->up;
    }
    return true;
}`,
  'matrix-clear': `void clear() {
    for (int row = 0; row < height; row++) {
        Node* header = AROW[row];
        Node* current = header->left;
        while (current != header) {
            Node* removed = current;
            current = current->left;
            delete removed;
        }
        header->left = header;
    }
    for (int column = 0; column < width; column++) ACOL[column]->up = ACOL[column];
    nonZeroCount = 0;
}`,
};

const sparseRemove = sparseOperations['matrix-remove'];
const sparseValid = `bool validPosition(int row, int column) const {
    return row >= 0 && row < height && column >= 0 && column < width;
}`;

export function getSparseMatrixCpp(actionId) {
  const operation = sparseOperations[actionId];
  if (!operation) return null;
  const helpers = [];
  if (['matrix-insert', 'matrix-get', 'matrix-remove'].includes(actionId)) helpers.push(sparseValid);
  if (actionId === 'matrix-insert') helpers.push(sparseRemove);
  return `class SparseMatrix {
public:
    struct Node {
        int value;
        int row;
        int column;
        Node* left;
        Node* up;

        Node(int value, int row, int column)
            : value(value), row(row), column(column), left(nullptr), up(nullptr) {}
    };

    int height;
    int width;
    Node** AROW;
    Node** ACOL;
    int nonZeroCount = 0;

    SparseMatrix(int matrixHeight = 5, int matrixWidth = 6)
        : height(matrixHeight > 0 ? matrixHeight : 1),
          width(matrixWidth > 0 ? matrixWidth : 1),
          AROW(new Node*[height]{}), ACOL(new Node*[width]{}) {
        for (int row = 0; row < height; row++) {
            AROW[row] = new Node(0, row, -1);
            AROW[row]->left = AROW[row];
        }
        for (int column = 0; column < width; column++) {
            ACOL[column] = new Node(0, -1, column);
            ACOL[column]->up = ACOL[column];
        }
    }

    SparseMatrix(const SparseMatrix&) = delete;
    SparseMatrix& operator=(const SparseMatrix&) = delete;

    ~SparseMatrix() {
        clearNodes();
        for (int row = 0; row < height; row++) delete AROW[row];
        for (int column = 0; column < width; column++) delete ACOL[column];
        delete[] AROW;
        delete[] ACOL;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${helpers.length ? `\n    // Auxiliary methods used above\n${helpers.map(indent).join('\n\n')}` : ''}

private:
    void clearNodes() {
        for (int row = 0; row < height; row++) {
            Node* header = AROW[row];
            Node* current = header->left;
            while (current != header) {
                Node* removed = current;
                current = current->left;
                delete removed;
            }
            header->left = header;
        }
        for (int column = 0; column < width; column++) ACOL[column]->up = ACOL[column];
        nonZeroCount = 0;
    }
};`;
}
