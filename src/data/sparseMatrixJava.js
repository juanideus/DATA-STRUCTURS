const nodeAndFields = `public class SparseMatrix {
    static class Node {
        int value;
        int row;
        int column;
        Node left;
        Node up;

        Node(int value, int row, int column) {
            this.value = value;
            this.row = row;
            this.column = column;
        }
    }

    private final int rowCount;
    private final int columnCount;
    private final Node[] AROW;
    private final Node[] ACOL;
    private int nonZeroCount;

    public SparseMatrix(int rowCount, int columnCount) {
        if (rowCount <= 0 || columnCount <= 0) {
            throw new IllegalArgumentException("Matrix size must be positive");
        }

        this.rowCount = rowCount;
        this.columnCount = columnCount;
        AROW = new Node[rowCount];
        ACOL = new Node[columnCount];

        for (int row = 0; row < rowCount; row++) {
            AROW[row] = new Node(0, row, -1);
            AROW[row].left = AROW[row];
        }

        for (int column = 0; column < columnCount; column++) {
            ACOL[column] = new Node(0, -1, column);
            ACOL[column].up = ACOL[column];
        }
    }`;

const validatePosition = `    private void validatePosition(int row, int column) {
        if (row < 0 || row >= rowCount
                || column < 0 || column >= columnCount) {
            throw new IndexOutOfBoundsException(
                "Position outside the matrix"
            );
        }
    }`;

const insertMethod = `    public void insert(int value, int row, int column) {
        validatePosition(row, column);

        if (value == 0) {
            remove(row, column);
            return;
        }

        Node rowHeader = AROW[row];
        Node previousRow = rowHeader;
        Node currentRow = rowHeader.left;

        while (currentRow != rowHeader
                && currentRow.column > column) {
            previousRow = currentRow;
            currentRow = currentRow.left;
        }

        if (currentRow != rowHeader
                && currentRow.column == column) {
            currentRow.value = value;
            return;
        }

        Node columnHeader = ACOL[column];
        Node previousColumn = columnHeader;
        Node currentColumn = columnHeader.up;

        while (currentColumn != columnHeader
                && currentColumn.row > row) {
            previousColumn = currentColumn;
            currentColumn = currentColumn.up;
        }

        Node newNode = new Node(value, row, column);

        newNode.left = currentRow;
        previousRow.left = newNode;

        newNode.up = currentColumn;
        previousColumn.up = newNode;

        nonZeroCount++;
    }`;

const getMethod = `    public int get(int row, int column) {
        validatePosition(row, column);

        Node rowHeader = AROW[row];
        Node current = rowHeader.left;

        while (current != rowHeader
                && current.column > column) {
            current = current.left;
        }

        if (current != rowHeader
                && current.column == column) {
            return current.value;
        }

        return 0;
    }`;

const removeMethod = `    public boolean remove(int row, int column) {
        validatePosition(row, column);

        Node rowHeader = AROW[row];
        Node previousRow = rowHeader;
        Node target = rowHeader.left;

        while (target != rowHeader
                && target.column > column) {
            previousRow = target;
            target = target.left;
        }

        if (target == rowHeader || target.column != column) {
            return false;
        }

        previousRow.left = target.left;

        Node columnHeader = ACOL[column];
        Node previousColumn = columnHeader;
        Node currentColumn = columnHeader.up;

        while (currentColumn != target) {
            previousColumn = currentColumn;
            currentColumn = currentColumn.up;
        }

        previousColumn.up = target.up;
        nonZeroCount--;
        return true;
    }`;

const showRowMethod = `    public void showRow(int row) {
        if (row < 0 || row >= rowCount) {
            throw new IndexOutOfBoundsException("Invalid row");
        }

        Node rowHeader = AROW[row];
        Node current = rowHeader.left;

        while (current != rowHeader) {
            System.out.println(
                "(" + current.row + ", " + current.column
                + ") = " + current.value
            );
            current = current.left;
        }
    }`;

const showColumnMethod = `    public void showColumn(int column) {
        if (column < 0 || column >= columnCount) {
            throw new IndexOutOfBoundsException("Invalid column");
        }

        Node columnHeader = ACOL[column];
        Node current = columnHeader.up;

        while (current != columnHeader) {
            System.out.println(
                "(" + current.row + ", " + current.column
                + ") = " + current.value
            );
            current = current.up;
        }
    }`;

const clearMethod = `    public void clear() {
        for (int row = 0; row < rowCount; row++) {
            AROW[row].left = AROW[row];
        }

        for (int column = 0; column < columnCount; column++) {
            ACOL[column].up = ACOL[column];
        }

        nonZeroCount = 0;
    }`;

const selected = method => `${nodeAndFields}

    // Start of the selected operation
${method}
    // End of the selected operation`;

const closeClass = source => `${source}
}`;

export function getSparseMatrixJava(actionId) {
    if (actionId === 'matrix-insert') {
        return closeClass(`${selected(insertMethod)}

${removeMethod}

${validatePosition}`);
    }
    if (actionId === 'matrix-get') {
        return closeClass(`${selected(getMethod)}

${validatePosition}`);
    }
    if (actionId === 'matrix-remove') {
        return closeClass(`${selected(removeMethod)}

${validatePosition}`);
    }
    if (actionId === 'matrix-row') return closeClass(selected(showRowMethod));
    if (actionId === 'matrix-column') return closeClass(selected(showColumnMethod));
    if (actionId === 'matrix-clear') return closeClass(selected(clearMethod));
    return null;
}
