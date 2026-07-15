import { operationGroup } from '../logic/operations.js';

const basic = {
  'add-start': `void addAtStart(int value) {
    for (int i = size; i > 0; i--) {
        values[i] = values[i - 1];
    }
    values[0] = value;
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    values[size] = value;
    size++;
}`,
  'add-index': `void addAtIndex(int value, int index) {
    for (int i = size; i > index; i--) {
        values[i] = values[i - 1];
    }
    values[index] = value;
    size++;
}`,
  'set-index': `void updateAtIndex(int value, int index) {
    if (index >= 0 && index < size) {
        values[index] = value;
    }
}`,
  'remove-start': `int removeFromStart() {
    int removed = values[0];
    for (int i = 0; i < size - 1; i++) {
        values[i] = values[i + 1];
    }
    size--;
    return removed;
}`,
  'remove-end': `int removeFromEnd() {
    int removed = values[size - 1];
    size--;
    return removed;
}`,
  'remove-index': `int removeAtIndex(int index) {
    int removed = values[index];
    for (int i = index; i < size - 1; i++) {
        values[i] = values[i + 1];
    }
    size--;
    return removed;
}`,
  'remove-value': `boolean removeValue(int target) {
    for (int i = 0; i < size; i++) {
        if (values[i] == target) {
            removeAtIndex(i);
            return true;
        }
    }
    return false;
}`,
  find: `int find(int target) {
    for (int i = 0; i < size; i++) {
        if (values[i] == target) {
            return i;
        }
    }
    return -1;
}`,
  clear: `void clear() {
    size = 0;
}`,
  reset: `void reset() {
    size = initialSize;
    for (int i = 0; i < size; i++) {
        values[i] = initialValues[i];
    }
}`,
  push: `void push(int value) {
    top++;
    stack[top] = value;
}`,
  pop: `int pop() {
    int value = stack[top];
    top--;
    return value;
}`,
  peek: `int peek() {
    return stack[top];
}`,
  enqueue: `void enqueue(int value) {
    queue[size] = value;
    size++;
}`,
  dequeue: `int dequeue() {
    int first = queue[0];
    for (int i = 0; i < size - 1; i++) {
        queue[i] = queue[i + 1];
    }
    size--;
    return first;
}`,
  front: `int front() {
    return queue[0];
}`,
  'sorted-add': `void insertInOrder(int value) {
    int index = size;
    while (index > 0 && values[index - 1] > value) {
        values[index] = values[index - 1];
        index--;
    }
    values[index] = value;
    size++;
}`,
  'tree-add': `Node insert(Node node, int value) {
    if (node == null) {
        return new Node(value);
    }
    if (value < node.value) {
        node.left = insert(node.left, value);
    } else {
        node.right = insert(node.right, value);
    }
    return node;
}`,
  'heap-add': `void insertHeap(int value) {
    size++;
    int index = size - 1;
    heap[index] = value;

    while (index > 0) {
        int parent = (index - 1) / 2;
        if (heap[parent] >= heap[index]) break;
        int temp = heap[parent];
        heap[parent] = heap[index];
        heap[index] = temp;
        index = parent;
    }
}`,
  'heap-extract': `int removeRoot() {
    int root = heap[0];
    heap[0] = heap[size - 1];
    size--;

    int index = 0;
    while (true) {
        int left = index * 2 + 1;
        int right = index * 2 + 2;
        int largest = index;
        if (left < size && heap[left] > heap[largest]) largest = left;
        if (right < size && heap[right] > heap[largest]) largest = right;
        if (largest == index) break;
        int temp = heap[index];
        heap[index] = heap[largest];
        heap[largest] = temp;
        index = largest;
    }
    return root;
}`,
  preorder: `void preorder(Node node) {
    if (node == null) return;
    System.out.println(node.value);
    preorder(node.left);
    preorder(node.right);
}`,
  inorder: `void inorder(Node node) {
    if (node == null) return;
    inorder(node.left);
    System.out.println(node.value);
    inorder(node.right);
}`,
  postorder: `void postorder(Node node) {
    if (node == null) return;
    postorder(node.left);
    postorder(node.right);
    System.out.println(node.value);
}`,
  'set-word': `void insertWord(String word) {
    TrieNode current = root;
    for (int i = 0; i < word.length(); i++) {
        int letter = word.charAt(i) - 'A';
        if (current.children[letter] == null) {
            current.children[letter] = new TrieNode();
        }
        current = current.children[letter];
    }
    current.isWord = true;
}`,
  'word-find': `boolean searchWord(String word) {
    TrieNode current = root;
    for (int i = 0; i < word.length(); i++) {
        int letter = word.charAt(i) - 'A';
        if (current.children[letter] == null) return false;
        current = current.children[letter];
    }
    return current.isWord;
}`,
  'remove-word': `void removeWord(String word) {
    TrieNode node = findNode(word);
    if (node != null) {
        node.isWord = false;
    }
}`,
  'range-update': `void update(int index, int value) {
    values[index] = value;
}`,
  'prefix-sum': `int prefixSum(int end) {
    int sum = 0;
    for (int i = 0; i <= end; i++) {
        sum = sum + values[i];
    }
    return sum;
}`,
  'range-min': `int minimumUntil(int end) {
    int minimum = values[0];
    for (int i = 1; i <= end; i++) {
        if (values[i] < minimum) minimum = values[i];
    }
    return minimum;
}`,
  'range-view': `void printLeaves() {
    for (int i = 0; i < size; i++) {
        System.out.println(keys[i]);
    }
}`,
  'merkle-root': `int calculateRoot() {
    int rootHash = 0;
    for (int i = 0; i < size; i++) {
        rootHash = rootHash + simpleHash(blocks[i]);
    }
    return rootHash;
}`,
  'set-expression': `Node makeExpressionTree(char operator, int a, int b) {
    Node root = new Node(operator);
    root.left = new Node(a);
    root.right = new Node(b);
    return root;
}`,
  evaluate: `int evaluate(Node node) {
    if (node.isNumber) return node.number;
    int left = evaluate(node.left);
    int right = evaluate(node.right);
    if (node.operator == '+') return left + right;
    if (node.operator == '-') return left - right;
    if (node.operator == '*') return left * right;
    return left / right;
}`,
  'hash-put': `void put(int key, int value) {
    int index = key % table.length;
    while (used[index]) {
        index = (index + 1) % table.length;
    }
    keys[index] = key;
    values[index] = value;
    used[index] = true;
}`,
  'vertex-add': `void addVertex(char name) {
    vertexNames[vertexCount] = name;
    vertexCount++;
}`,
  'vertex-remove': `void removeVertex(int vertex) {
    for (int row = vertex; row < vertexCount - 1; row++) {
        for (int column = 0; column < vertexCount; column++) {
            edges[row][column] = edges[row + 1][column];
        }
    }
    vertexCount--;
}`,
  'edge-add': `void addEdge(int from, int to, int weight) {
    edges[from][to] = weight;
    edges[to][from] = weight;
}`,
  'edge-remove': `void removeEdge(int from, int to) {
    edges[from][to] = 0;
    edges[to][from] = 0;
}`,
  'bfs-run': `void breadthFirst(int start) {
    int[] queue = new int[vertexCount];
    boolean[] visited = new boolean[vertexCount];
    int front = 0;
    int end = 0;
    queue[end++] = start;
    visited[start] = true;

    while (front < end) {
        int vertex = queue[front++];
        System.out.println(vertex);
        for (int next = 0; next < vertexCount; next++) {
            if (edges[vertex][next] != 0 && !visited[next]) {
                visited[next] = true;
                queue[end++] = next;
            }
        }
    }
}`,
  'dfs-run': `void depthFirst(int vertex, boolean[] visited) {
    visited[vertex] = true;
    System.out.println(vertex);

    for (int next = 0; next < vertexCount; next++) {
        if (edges[vertex][next] != 0 && !visited[next]) {
            depthFirst(next, visited);
        }
    }
}`,
  shuffle: `void shuffle() {
    for (int i = size - 1; i > 0; i--) {
        int other = (int) (Math.random() * (i + 1));
        int temp = values[i];
        values[i] = values[other];
        values[other] = temp;
    }
}`,
  sort: `void bubbleSort() {
    for (int end = size - 1; end > 0; end--) {
        for (int i = 0; i < end; i++) {
            if (values[i] > values[i + 1]) {
                int temp = values[i];
                values[i] = values[i + 1];
                values[i + 1] = temp;
            }
        }
    }
}`,
  calculate: `int calculate(int number) {
    if (number <= 1) return number;
    return calculate(number - 1) + calculate(number - 2);
}`,
  'hanoi-set': `void createDisks(int amount) {
    diskCount = amount;
    for (int i = 0; i < amount; i++) {
        source[i] = amount - i;
    }
}`,
  'hanoi-solve': `void hanoi(int disks, char from, char to, char help) {
    if (disks == 0) return;
    hanoi(disks - 1, from, help, to);
    System.out.println("Move " + disks + " from " + from + " to " + to);
    hanoi(disks - 1, help, to, from);
}`,
  solve: `boolean solve(int row) {
    if (row == size) return true;
    for (int column = 0; column < size; column++) {
        if (isSafe(row, column)) {
            board[row] = column;
            if (solve(row + 1)) return true;
            board[row] = -1;
        }
    }
    return false;
}`,
  'step-solution': `boolean tryNextChoice(int row) {
    for (int column = lastColumn + 1; column < size; column++) {
        if (isSafe(row, column)) {
            board[row] = column;
            return true;
        }
    }
    return false;
}`,
  union: `void union(int first, int second) {
    int rootA = findRoot(first);
    int rootB = findRoot(second);
    if (rootA != rootB) {
        parent[rootB] = rootA;
    }
}`,
  'find-root': `int findRoot(int value) {
    while (parent[value] != value) {
        value = parent[value];
    }
    return value;
}`,
  'cache-put': `void put(int key, int value) {
    if (size == capacity) {
        removeOldest();
    }
    keys[size] = key;
    values[size] = value;
    size++;
}`,
  'cache-get': `int get(int key) {
    for (int i = 0; i < size; i++) {
        if (keys[i] == key) {
            return values[i];
        }
    }
    return -1;
}`,
  'bloom-add': `void add(String word) {
    int first = word.length() % bits.length;
    int second = word.charAt(0) % bits.length;
    bits[first] = true;
    bits[second] = true;
}`,
  'bloom-check': `boolean mightContain(String word) {
    int first = word.length() % bits.length;
    int second = word.charAt(0) % bits.length;
    return bits[first] && bits[second];
}`,
  'clear-bits': `void clearBits() {
    for (int i = 0; i < bits.length; i++) {
        bits[i] = false;
    }
}`,
};

const special = {
  'btree:sorted-add': `void insert(int value) {
    Node leaf = findLeaf(value);
    insertInOrder(leaf, value);

    if (leaf.keyCount > MAX_KEYS) {
        Node rightLeaf = splitLeaf(leaf);
        int separator = rightLeaf.keys[0];
        insertIntoParent(leaf, separator, rightLeaf);
    }
}`,
  'sudoku:solve': `boolean solveSudoku(int row, int column) {
    if (row == 9) return true; // base case: board completed
    if (column == 9) return solveSudoku(row + 1, 0);
    if (board[row][column] != 0) {
        return solveSudoku(row, column + 1);
    }

    for (int number = 1; number <= 9; number++) {
        if (isValid(row, column, number)) {
            board[row][column] = number; // choose
            if (solveSudoku(row, column + 1)) return true;
            board[row][column] = 0;      // undo: backtracking
        }
    }
    return false;
}

boolean isValid(int row, int column, int number) {
    for (int index = 0; index < 9; index++) {
        if (board[row][index] == number) return false;
        if (board[index][column] == number) return false;
    }

    int firstRow = (row / 3) * 3;
    int firstColumn = (column / 3) * 3;
    for (int r = firstRow; r < firstRow + 3; r++) {
        for (int c = firstColumn; c < firstColumn + 3; c++) {
            if (board[r][c] == number) return false;
        }
    }
    return true;
}`,
  'sudoku:step-solution': `boolean tryCell(int row, int column) {
    for (int number = 1; number <= 9; number++) {
        if (isValid(row, column, number)) {
            board[row][column] = number; // try a number
            if (solveSudoku(row, column + 1)) {
                return true;
            }
            board[row][column] = 0;      // it failed: undo it
        }
    }
    return false;
}

boolean isValid(int row, int column, int number) {
    for (int index = 0; index < 9; index++) {
        if (board[row][index] == number) return false;
        if (board[index][column] == number) return false;
    }
    int firstRow = (row / 3) * 3;
    int firstColumn = (column / 3) * 3;
    for (int r = firstRow; r < firstRow + 3; r++) {
        for (int c = firstColumn; c < firstColumn + 3; c++) {
            if (board[r][c] == number) return false;
        }
    }
    return true;
}`,
  'queens:solve': `int size;
int[] queens;

boolean solveQueens(int boardSize) {
    size = boardSize;
    queens = new int[size];
    for (int row = 0; row < size; row++) {
        queens[row] = -1; // this row has no queen yet
    }
    return placeQueen(0);
}

boolean placeQueen(int row) {
    if (row == size) return true; // base case

    for (int column = 0; column < size; column++) {
        if (isSafe(row, column)) {
            queens[row] = column; // choose
            if (placeQueen(row + 1)) return true; // recursion
            queens[row] = -1;     // undo: backtracking
        }
    }
    return false;
}

boolean isSafe(int row, int column) {
    for (int previousRow = 0; previousRow < row; previousRow++) {
        int previousColumn = queens[previousRow];
        if (previousColumn == column) return false; // same column
        int rowDistance = row - previousRow;
        int columnDistance = Math.abs(column - previousColumn);
        if (rowDistance == columnDistance) return false; // diagonal
    }
    return true;
}`,
  'queens:step-solution': `int size;
int[] queens;

boolean solveQueens(int boardSize) {
    size = boardSize;
    queens = new int[size];
    for (int row = 0; row < size; row++) {
        queens[row] = -1;
    }
    return placeQueen(0);
}

boolean placeQueen(int row) {
    if (row == size) return true;

    for (int column = 0; column < size; column++) {
        if (isSafe(row, column)) {
            queens[row] = column;
            if (placeQueen(row + 1)) return true;
            queens[row] = -1; // backtracking
        }
    }
    return false;
}

boolean isSafe(int row, int column) {
    for (int previousRow = 0; previousRow < row; previousRow++) {
        int previousColumn = queens[previousRow];
        if (previousColumn == column) return false;
        int rowDistance = row - previousRow;
        int columnDistance = Math.abs(column - previousColumn);
        if (rowDistance == columnDistance) return false;
    }
    return true;
}`,
  'maze:solve': `boolean solveMaze(int row, int column) {
    if (!isFree(row, column)) return false;

    path[row][column] = true; // choose this cell
    if (isExit(row, column)) return true; // base case
    if (solveMaze(row, column + 1)) return true;
    if (solveMaze(row + 1, column)) return true;
    if (solveMaze(row, column - 1)) return true;
    if (solveMaze(row - 1, column)) return true;

    path[row][column] = false; // dead end: backtracking
    return false;
}

boolean isFree(int row, int column) {
    if (row < 0 || row >= 6 || column < 0 || column >= 6) return false;
    return maze[row][column] == 0 && !path[row][column];
}

boolean isExit(int row, int column) {
    return row == 5 && column == 5;
}`,
  'maze:step-solution': `boolean solveMaze(int row, int column) {
    if (!isFree(row, column)) return false;
    path[row][column] = true;
    if (isExit(row, column)) return true;
    if (solveMaze(row, column + 1)) return true;
    if (solveMaze(row + 1, column)) return true;
    if (solveMaze(row, column - 1)) return true;
    if (solveMaze(row - 1, column)) return true;
    path[row][column] = false; // backtracking
    return false;
}

boolean isFree(int row, int column) {
    if (row < 0 || row >= 6 || column < 0 || column >= 6) return false;
    return maze[row][column] == 0 && !path[row][column];
}

boolean isExit(int row, int column) {
    return row == 5 && column == 5;
}`,
  'heap:peek': `int root() {
    return heap[0];
}`,
  'fibonacci-heap:heap-add': `void insertMinimum(int value) {
    values[size] = value;
    size++;
    for (int i = size - 1; i > 0 && values[i] < values[i - 1]; i--) {
        int temp = values[i];
        values[i] = values[i - 1];
        values[i - 1] = temp;
    }
}`,
  'fibonacci-heap:heap-extract': `int extractMinimum() {
    int minimum = values[0];
    for (int i = 0; i < size - 1; i++) {
        values[i] = values[i + 1];
    }
    size--;
    return minimum;
}`,
  'math:calculate:factorial': `int factorial(int number) {
    int result = 1;
    for (int i = 1; i <= number; i++) {
        result = result * i;
    }
    return result;
}`,
  'list:add-start': `Node addAtStart(Node head, int value) {
    Node newNode = new Node(value);
    newNode.next = head;
    return newNode;
}`,
  'list:add-end': `void addAtEnd(Node head, int value) {
    Node current = head;
    while (current.next != null) {
        current = current.next;
    }
    current.next = new Node(value);
}`,
  'list:find': `Node find(Node head, int target) {
    Node current = head;
    while (current != null) {
        if (current.value == target) return current;
        current = current.next;
    }
    return null;
}`,
  'tree:find': `Node search(Node node, int target) {
    if (node == null || node.value == target) return node;
    if (target < node.value) return search(node.left, target);
    return search(node.right, target);
}`,
  'tree:remove-value': `Node remove(Node node, int target) {
    if (node == null) return null;
    if (target < node.value) node.left = remove(node.left, target);
    else if (target > node.value) node.right = remove(node.right, target);
    else if (node.left == null) return node.right;
    else if (node.right == null) return node.left;
    return node;
}`,
};

export function getBeginnerJava(algorithm, actionId) {
  const group = operationGroup(algorithm);
  if (algorithm.id === 'factorial' && actionId === 'calculate') {
    return special['math:calculate:factorial'];
  }
  return special[`${algorithm.id}:${actionId}`] ?? special[`${group}:${actionId}`] ?? basic[actionId] ?? `void operation() {
    // Follow the visual steps.
}`;
}
