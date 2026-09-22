const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const queensSolve = `bool solve(int boardSize) {
    if (boardSize < 4 || boardSize > 8) return false;
    resize(boardSize);
    return placeRow(0);
}`;
const queensHelpers = `bool placeRow(int row) {
    if (row == size) return true;
    for (int column = 0; column < size; column++) {
        if (isSafe(row, column)) {
            queens[row] = column;
            if (placeRow(row + 1)) return true;
            queens[row] = -1;
        }
    }
    return false;
}

bool isSafe(int row, int column) {
    for (int previousRow = 0; previousRow < row; previousRow++) {
        int previousColumn = queens[previousRow];
        if (previousColumn == column) return false;
        int rowDistance = row - previousRow;
        int difference = column - previousColumn;
        int columnDistance = difference < 0 ? -difference : difference;
        if (rowDistance == columnDistance) return false;
    }
    return true;
}

void resize(int boardSize) {
    if (boardSize != size) {
        delete[] queens;
        size = boardSize;
        queens = new int[size];
    }
    resetValues();
}`;

function queensCpp(actionId) {
  const operation = ['solve', 'step-solution'].includes(actionId)
    ? queensSolve
    : actionId === 'reset'
      ? `void reset() {
    resetValues();
}`
      : null;
  if (!operation) return null;
  return `class NQueens {
public:
    int size;
    int* queens;

    explicit NQueens(int boardSize = 4)
        : size(boardSize), queens(new int[boardSize]) { resetValues(); }
    ~NQueens() { delete[] queens; }
    NQueens(const NQueens&) = delete;
    NQueens& operator=(const NQueens&) = delete;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${actionId === 'reset' ? '' : `\n    // Recursive helpers used above\n${indent(queensHelpers)}`}

private:
    void resetValues() {
        for (int row = 0; row < size; row++) queens[row] = -1;
    }
};`;
}

const mazeSolve = `bool solve(int startRow, int startColumn) {
    clearPath();
    return explore(startRow, startColumn);
}`;
const mazeHelpers = `bool explore(int row, int column) {
    if (!isFree(row, column)) return false;
    path[row][column] = true;
    if (isExit(row, column)) return true;

    if (explore(row, column + 1)) return true;
    if (explore(row + 1, column)) return true;
    if (explore(row, column - 1)) return true;
    if (explore(row - 1, column)) return true;
    path[row][column] = false;
    return false;
}

bool isFree(int row, int column) const {
    return row >= 0 && row < height && column >= 0 && column < width
        && maze[row][column] == 0 && !path[row][column];
}

bool isExit(int row, int column) const {
    return row == exitRow && column == exitColumn;
}

void clearPath() {
    for (int row = 0; row < height; row++) {
        for (int column = 0; column < width; column++) path[row][column] = false;
    }
}`;

function mazeCpp(actionId) {
  const operation = ['solve', 'step-solution'].includes(actionId)
    ? mazeSolve
    : actionId === 'reset'
      ? `void reset() {
    clearPath();
}`
      : null;
  if (!operation) return null;
  return `class MazeSolver {
public:
    int height;
    int width;
    int** maze;
    bool** path;
    int exitRow;
    int exitColumn;

    MazeSolver(const int* cells = nullptr, int rows = 6, int columns = 6)
        : height(rows), width(columns), maze(new int*[rows]{}),
          path(new bool*[rows]{}), exitRow(rows - 1), exitColumn(columns - 1) {
        for (int row = 0; row < height; row++) {
            maze[row] = new int[width]{};
            path[row] = new bool[width]{};
            for (int column = 0; column < width; column++) {
                maze[row][column] = cells == nullptr ? 0 : cells[row * width + column];
            }
        }
    }

    ~MazeSolver() {
        for (int row = 0; row < height; row++) {
            delete[] maze[row];
            delete[] path[row];
        }
        delete[] maze;
        delete[] path;
    }

    MazeSolver(const MazeSolver&) = delete;
    MazeSolver& operator=(const MazeSolver&) = delete;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Recursive helpers used above
${indent(mazeHelpers)}
};`;
}

const sudokuSolve = `bool solve() {
    for (int row = 0; row < SIZE; row++) {
        for (int column = 0; column < SIZE; column++) {
            if (board[row][column] != 0) continue;
            for (int number = 1; number <= SIZE; number++) {
                if (isValid(row, column, number)) {
                    board[row][column] = number;
                    if (solve()) return true;
                    board[row][column] = 0;
                }
            }
            return false;
        }
    }
    return true;
}`;
const sudokuValid = `bool isValid(int row, int column, int number) const {
    for (int index = 0; index < SIZE; index++) {
        if (board[row][index] == number || board[index][column] == number) return false;
    }
    int boxRow = (row / 3) * 3;
    int boxColumn = (column / 3) * 3;
    for (int r = boxRow; r < boxRow + 3; r++) {
        for (int c = boxColumn; c < boxColumn + 3; c++) {
            if (board[r][c] == number) return false;
        }
    }
    return true;
}`;

function sudokuCpp(actionId) {
  const operation = ['solve', 'step-solution'].includes(actionId)
    ? sudokuSolve
    : actionId === 'reset'
      ? `void reset() {
    for (int row = 0; row < SIZE; row++) {
        for (int column = 0; column < SIZE; column++) board[row][column] = initial[row][column];
    }
}`
      : null;
  if (!operation) return null;
  return `class SudokuSolver {
public:
    static const int SIZE = 9;
    int** board;
    int** initial;

    SudokuSolver() : board(new int*[SIZE]{}), initial(new int*[SIZE]{}) {
        for (int row = 0; row < SIZE; row++) {
            board[row] = new int[SIZE]{};
            initial[row] = new int[SIZE]{};
        }
    }

    ~SudokuSolver() {
        for (int row = 0; row < SIZE; row++) {
            delete[] board[row];
            delete[] initial[row];
        }
        delete[] board;
        delete[] initial;
    }

    SudokuSolver(const SudokuSolver&) = delete;
    SudokuSolver& operator=(const SudokuSolver&) = delete;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${actionId === 'reset' ? '' : `\n    // Validation used by backtracking\n${indent(sudokuValid)}`}
};`;
}

export function getBacktrackingCpp(algorithmId, actionId) {
  if (algorithmId === 'n-reinas') return queensCpp(actionId);
  if (algorithmId === 'laberinto') return mazeCpp(actionId);
  if (algorithmId === 'sudoku') return sudokuCpp(actionId);
  return null;
}
