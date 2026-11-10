const radixNeedles = {
  'radix-start': 'bool sort()',
  'radix-size-check': 'if (size < 2)',
  'radix-offset': 'long long offset =',
  'radix-maximum': 'long long maxKey =',
  'radix-exp-loop': 'for (long long exp =',
  'radix-output-array': 'int* output =',
  'radix-pass': 'int* count =',
  'radix-digit': 'long long key =',
  'radix-count': 'count[(key / exponent)',
  'radix-prefix': 'for (int digit = 1;',
  'radix-output': 'output[--count[digit]]',
  'radix-decrement': 'output[--count[digit]]',
  'radix-write': 'values[i] = output[i];',
  'radix-free-count': 'delete[] count;',
  'radix-free-output': 'delete[] output;',
  'radix-complete': 'return true;',
};

const countingNeedles = {
  'counting-start': 'bool sort()',
  'counting-size-check': 'if (size < 2)',
  'counting-range': 'long long rangeValue =',
  'counting-range-check': 'if (rangeValue <= 0 || rangeValue > MAX_COUNT_RANGE)',
  'counting-array': 'int* count = new int[range]{};',
  'counting-min': 'int min = findMinimum();',
  'counting-max': 'int max = findMaximum();',
  'counting-count-loop': 'for (int i = 0; i < size; i++) {',
  'counting-count': 'count[values[i] - min]++;',
  'counting-rebuild-loop': 'for (int index = 0; index < range; index++) {',
  'counting-frequency-check': 'while (count[index] > 0) {',
  'counting-write': 'values[position] = index + min;',
  'counting-position': 'position++;',
  'counting-decrement': 'count[index]--;',
  'counting-complete': 'return true;',
};

const graphTraversalNeedles = {
  'bfs-run': {
    'void breadthFirst(String startName) {': 'bool breadthFirst(char startName) {',
    'int start = findVertex(startName);': 'int start = findVertex(startName);',
    'if (start == -1) {': 'if (start == -1) return false;',
    'boolean[] visited = new boolean[vertexCount];': 'bool* visited = new bool[MAX_VERTICES]{};',
    'int[] queue = new int[vertexCount];': 'int* queue = new int[MAX_VERTICES]{};',
    'queue[end] = start;': 'queue[rear++] = start;',
    'visited[start] = true;': 'visited[start] = true;',
    'while (front < end) {': 'while (front < rear) {',
    'int vertex = queue[front];': 'int vertex = queue[front++];',
    'front++;': 'int vertex = queue[front++];',
    'System.out.println(vertexNames[vertex]);': 'visit(vertexNames[vertex]);',
    'for (int next = 0; next < vertexCount; next++) {': 'for (int neighbor = 0; neighbor < vertexCount; neighbor++) {',
    'boolean hasEdge = adjacency[vertex][next];': 'if (adjacency[vertex][neighbor] && !visited[neighbor]) {',
    'if (hasEdge && !visited[next]) {': 'if (adjacency[vertex][neighbor] && !visited[neighbor]) {',
    'visited[next] = true;': 'visited[neighbor] = true;',
    'queue[end] = next;': 'queue[rear++] = neighbor;',
    'end++;': 'queue[rear++] = neighbor;',
  },
  'dfs-run': {
    'void depthFirst(String startName) {': 'bool depthFirst(char startName) {',
    'int start = findVertex(startName);': 'int start = findVertex(startName);',
    'if (start == -1) {': 'if (start == -1) return false;',
    'boolean[] visited = new boolean[vertexCount];': 'bool* visited = new bool[MAX_VERTICES]{};',
    'depthFirstFrom(start, visited);': 'depthFirstFrom(start, visited);',
    'void depthFirstFrom(int vertex, boolean[] visited) {': 'void depthFirstFrom(int vertex, bool visited[]) {',
    'visited[vertex] = true;': 'visited[vertex] = true;',
    'System.out.println(vertexNames[vertex]);': 'visit(vertexNames[vertex]);',
    'for (int next = 0; next < vertexCount; next++) {': 'for (int neighbor = 0; neighbor < vertexCount; neighbor++) {',
    'boolean hasEdge = adjacency[vertex][next];': 'if (adjacency[vertex][neighbor] && !visited[neighbor]) {',
    'if (hasEdge && !visited[next]) {': 'if (adjacency[vertex][neighbor] && !visited[neighbor]) {',
    'depthFirstFrom(next, visited);': 'depthFirstFrom(neighbor, visited);',
  },
};

const weightedGraphNeedles = {
  'prim-run': {
    'void prim(String startName) {': 'bool prim(char startName) {',
    'int start = findVertex(startName);': 'int start = findVertex(startName);',
    'if (start == -1) {': 'if (start == -1) return false;',
    'boolean[] inTree = new boolean[vertexCount];': 'bool* inTree = new bool[MAX_VERTICES]{};',
    'int[] bestWeight = new int[vertexCount];': 'int* key = new int[MAX_VERTICES];',
    'int[] parent = new int[vertexCount];': 'int* parent = new int[MAX_VERTICES];',
    'for (int vertex = 0; vertex < vertexCount; vertex++) {': 'for (int i = 0; i < vertexCount; i++) {',
    'bestWeight[vertex] = NO_EDGE;': 'key[i] = INF;',
    'parent[vertex] = -1;': 'parent[i] = -1;',
    'bestWeight[start] = 0;': 'key[start] = 0;',
    'for (int added = 0; added < vertexCount; added++) {': 'for (int count = 0; count < vertexCount; count++) {',
    'int current = -1;': 'int vertex = minimumKey(key, inTree);',
    'if (!inTree[vertex]': 'if (!inTree[i] && key[i] < best) {',
    'if (current == -1 || bestWeight[current] == NO_EDGE) {': 'if (vertex == -1) {',
    'inTree[current] = true;': 'inTree[vertex] = true;',
    'if (parent[current] != -1) {': 'if (parent[vertex] != -1) {',
    'System.out.println(vertexNames[parent[current]]': 'treeEdges[treeEdgeCount++] = {parent[vertex], vertex, weight};',
    'for (int next = 0; next < vertexCount; next++) {': 'for (int neighbor = 0; neighbor < vertexCount; neighbor++) {',
    'int weight = weights[current][next];': 'int weight = weights[vertex][neighbor];',
    'if (!inTree[next] && weight < bestWeight[next]) {': 'if (weight != INF && !inTree[neighbor] && weight < key[neighbor]) {',
    'bestWeight[next] = weight;': 'key[neighbor] = weight;',
    'parent[next] = current;': 'parent[neighbor] = vertex;',
  },
  'kruskal-run': {
    'void kruskal() {': 'bool kruskal() {',
    'int[] from = new int[edgeCount];': 'Edge* ordered = new Edge[MAX_EDGES];',
    'from[edge] = edges[edge].from;': 'for (int i = 0; i < edgeCount; i++) ordered[i] = edges[i];',
    'to[edge] = edges[edge].to;': 'for (int i = 0; i < edgeCount; i++) ordered[i] = edges[i];',
    'edgeWeight[edge] = edges[edge].weight;': 'for (int i = 0; i < edgeCount; i++) ordered[i] = edges[i];',
    'for (int end = edgeCount - 1; end > 0; end--) {': 'sortEdges(ordered, edgeCount);',
    'for (int index = 0; index < end; index++) {': 'sortEdges(ordered, edgeCount);',
    'if (edgeWeight[index] > edgeWeight[index + 1]) {': 'while (j >= 0 && array[j].weight > current.weight) {',
    'swap(edgeWeight, index, index + 1);': 'array[j + 1] = array[j];',
    'swap(from, index, index + 1);': 'array[j + 1] = array[j];',
    'swap(to, index, index + 1);': 'array[j + 1] = array[j];',
    'int[] parent = new int[vertexCount];': 'int* parent = new int[MAX_VERTICES];',
    'int[] rank = new int[vertexCount];': 'int* rank = new int[MAX_VERTICES]{};',
    'for (int vertex = 0; vertex < vertexCount; vertex++) {': 'for (int i = 0; i < vertexCount; i++) parent[i] = i;',
    'parent[vertex] = vertex;': 'for (int i = 0; i < vertexCount; i++) parent[i] = i;',
    'int selected = 0;': 'int selected = 0;',
    'for (int edge = 0; edge < edgeCount && selected < vertexCount - 1; edge++) {': 'for (int i = 0; i < edgeCount && selected < vertexCount - 1; i++) {',
    'int firstRoot = find(parent, from[edge]);': 'int rootFrom = findRoot(parent, ordered[i].from);',
    'int secondRoot = find(parent, to[edge]);': 'int rootTo = findRoot(parent, ordered[i].to);',
    'if (firstRoot != secondRoot) {': 'if (rootFrom != rootTo) {',
    'union(parent, rank, firstRoot, secondRoot);': 'unite(parent, rank, rootFrom, rootTo);',
    'System.out.println(vertexNames[from[edge]]': 'treeEdges[treeEdgeCount++] = ordered[i];',
  },
};

const denseMatrixNeedles = {
  'matrix-set': {
    'boolean set(int row, int column, int value) {': 'bool set(int row, int column, int value) {',
    'if (!validPosition(row, column)) {': 'if (!validPosition(row, column)) return false;',
    'boolean validPosition(int row, int column) {': 'bool validPosition(int row, int column) const {',
    'return row >= 0 && row < SIZE': 'return row >= 0 && row < size && column >= 0 && column < size;',
    'values[row][column] = value;': 'values[row][column] = value;',
    'return true;': 'return true;',
  },
  'matrix-get': {
    'Integer get(int row, int column) {': 'bool get(int row, int column, int& value) const {',
    'if (!validPosition(row, column)) {': 'if (!validPosition(row, column)) return false;',
    'boolean validPosition(int row, int column) {': 'bool validPosition(int row, int column) const {',
    'return row >= 0 && row < SIZE': 'return row >= 0 && row < size && column >= 0 && column < size;',
    'return values[row][column];': 'value = values[row][column];',
  },
  'matrix-row': {
    'int[] readRow(int row) {': 'bool copyRow(int row, int output[]) const {',
    'if (!validIndex(row)) {': 'if (row < 0 || row >= size) return false;',
    'boolean validIndex(int index) {': 'if (row < 0 || row >= size) return false;',
    'return index >= 0 && index < SIZE;': 'if (row < 0 || row >= size) return false;',
    'int[] result = new int[SIZE];': 'bool copyRow(int row, int output[]) const {',
    'for (int column = 0; column < SIZE; column++) {': 'for (int column = 0; column < size; column++) {',
    'result[column] = values[row][column];': 'output[column] = values[row][column];',
    'return result;': 'return true;',
  },
  'matrix-column': {
    'int[] readColumn(int column) {': 'bool copyColumn(int column, int output[]) const {',
    'if (!validIndex(column)) {': 'if (column < 0 || column >= size) return false;',
    'boolean validIndex(int index) {': 'if (column < 0 || column >= size) return false;',
    'return index >= 0 && index < SIZE;': 'if (column < 0 || column >= size) return false;',
    'int[] result = new int[SIZE];': 'bool copyColumn(int column, int output[]) const {',
    'for (int row = 0; row < SIZE; row++) {': 'for (int row = 0; row < size; row++) {',
    'result[row] = values[row][column];': 'output[row] = values[row][column];',
    'return result;': 'return true;',
  },
  'matrix-transpose': {
    'void transpose() {': 'void transpose() {',
    'for (int row = 0; row < SIZE; row++) {': 'for (int row = 0; row < size; row++) {',
    'for (int column = row + 1; column < SIZE; column++) {': 'for (int column = row + 1; column < size; column++) {',
    'int temporary = values[row][column];': 'int temporary = values[row][column];',
    'values[row][column] = values[column][row];': 'values[row][column] = values[column][row];',
    'values[column][row] = temporary;': 'values[column][row] = temporary;',
  },
  'matrix-fill': {
    'void fill(int value) {': 'void fill(int value) {',
    'for (int row = 0; row < SIZE; row++) {': 'for (int row = 0; row < size; row++) {',
    'for (int column = 0; column < SIZE; column++) {': 'for (int column = 0; column < size; column++) {',
    'values[row][column] = value;': 'values[row][column] = value;',
  },
  'matrix-clear': {
    'void clear() {': 'void clear() {',
    'fill(0);': 'fill(0);',
    'void fill(int value) {': 'void fill(int value) {',
    'for (int row = 0; row < SIZE; row++) {': 'for (int row = 0; row < size; row++) {',
    'for (int column = 0; column < SIZE; column++) {': 'for (int column = 0; column < size; column++) {',
    'values[row][column] = value;': 'values[row][column] = value;',
  },
};

export function cppCodeNeedle(algorithmId, actionId, frame) {
  if (algorithmId === 'arbol-enhebrado') return frame.cppCodeNeedle ?? null;
  if (algorithmId === 'bogo-sort' && actionId === 'sort') {
    if (frame.sortPhase === 'bogo-not-sorted') return 'if (values[i - 1] > values[i]) return false;';
    const needles = {
      'boolean bogoSort() {': 'bool sort() {',
      'long[] state = {2166136261L};': 'unsigned int state = 2166136261u;',
      'state[0] = (state[0] + (long) values[i] * (i + 3)) & 0xffffffffL;': 'state += static_cast<unsigned int>(values[i]) * static_cast<unsigned int>(i + 3);',
      'while (!isSorted() && attempts < 250000) {': 'while (!isSorted() && attempts < MAX_ATTEMPTS) {',
      'state[0] = (state[0] * 1664525L + 1013904223L) & 0xffffffffL;': 'state = state * 1664525u + 1013904223u;',
      'int other = (int) ((state[0] * (i + 1)) >>> 32);': 'int other = static_cast<int>((static_cast<unsigned long long>(state) * (i + 1)) >> 32);',
      'if (values[i - 1] > values[i]) {': 'if (values[i - 1] > values[i]) return false;',
    };
    return needles[frame.codeNeedle] ?? null;
  }
  if (algorithmId === 'merge-sort') {
    if (frame.codeNeedle === 'int[] help = new int[size];') return 'int* help = new int[size]{};';
    if (frame.codeNeedle?.includes('int[] help')) return frame.codeNeedle.replaceAll('int[] help', 'int help[]');
  }
  if (algorithmId === 'cola') {
    if (frame.codeNeedle === 'if (front == null) {' && /rear|también/.test(frame.message)) return 'if (front == nullptr) rear = nullptr;';
    if (frame.codeNeedle === 'rear = null;') return 'if (front == nullptr) rear = nullptr;';
    const queueNeedles = {
      'boolean enqueue(int value) {': 'bool enqueue(int value) {',
      'if (size == MAX_SIZE) {': 'if (size == CAPACITY) return false;',
      'Node newNode = new Node(value);': 'Node* newNode = new Node(value);',
      'rear = front;': 'rear = newNode;',
      'Integer dequeue() {': 'bool dequeue(int& removed) {',
      'if (front == null) {': 'if (front == nullptr)',
      'int removed = front.value;': 'removed = oldFront->value;',
      'return removed;': 'return true;',
      'Integer peekFront() {': 'bool peekFront(int& value) const {',
      'return front.value;': 'value = front->value;',
      'return null;': 'return false;',
    };
    return queueNeedles[frame.codeNeedle] ?? null;
  }
  if (['prim', 'kruskal'].includes(algorithmId)) {
    return weightedGraphNeedles[actionId]?.[frame.codeNeedle] ?? null;
  }
  if (algorithmId === 'matriz') {
    return denseMatrixNeedles[actionId]?.[frame.codeNeedle] ?? null;
  }
  if (algorithmId === 'matriz-dispersa') {
    if (actionId === 'matrix-insert' && frame.codeNeedle === 'return;') return 'return true;';
    const aliases = {
      'validatePosition(row, column);': 'if (!validPosition(row, column)) return false;',
      'return current.value;': 'value = current != header && current->column == column ? current->value : 0;',
      'return 0;': 'value = current != header && current->column == column ? current->value : 0;',
      'Node current = rowHeader.left;': 'Node* current = header->left;',
      'Node current = columnHeader.up;': 'Node* current = header->up;',
    };
    return aliases[frame.codeNeedle] ?? null;
  }
  if (algorithmId === 'pila') {
    const stackNeedles = {
      'Integer pop() {': 'bool pop(int& removed) {',
      'Integer peek() {': 'bool peek(int& value) const {',
      'int removed = values[top];': 'removed = values[top];',
      'return removed;': 'return true;',
      'return values[top];': 'value = values[top];',
      'return null;': 'return false;',
      'if (top == -1) {': 'if (top == -1) return false;',
      'if (top == MAX_SIZE - 1) {': 'if (top == CAPACITY - 1) return false;',
    };
    return stackNeedles[frame.codeNeedle] ?? null;
  }
  if (['grafo', 'grafo-dirigido', 'dfs', 'bfs'].includes(algorithmId)) {
    return graphTraversalNeedles[actionId]?.[frame.codeNeedle] ?? null;
  }
  if (algorithmId === 'radix-sort') return radixNeedles[frame.sortPhase] ?? null;
  if (algorithmId === 'counting-sort') {
    if (frame.sortPhase === 'counting-complete' && frame.codeNeedle === 'if (size < 2) return true;') return frame.codeNeedle;
    return countingNeedles[frame.sortPhase] ?? null;
  }
  if (algorithmId !== 'polinomios') return null;

  const needle = frame.codeNeedle;
  if (needle === 'C = null;') return 'clearList(C);';
  const target = actionId.endsWith('a') ? 'A' : 'B';
  if (actionId.startsWith('poly-insert-')) {
    if (needle === 'if (current.coefficient == 0) {') return 'if (current->coefficient == 0) removeTerm(head, exponent);';
    if (needle === 'head = current.next;') return 'head = current->next;';
    if (needle?.startsWith('void insertIn')) return `void insert${target}(`;
    if (needle === `${target} = insertOrdered(${target}, coefficient, exponent);`) {
      return `insertTerm(${target}, coefficient, exponent);`;
    }
    if (needle === 'if (coefficient == 0) {') return 'if (coefficient == 0) return;';
    if (needle === 'if (coefficient != 0) C = null;') return 'if (coefficient != 0) clearList(C);';
    if (needle === 'return head;' && frame.message?.includes('coeficiente cero se descarta')) {
      return 'if (coefficient == 0) return;';
    }
  }
  if (actionId.startsWith('poly-remove-')) {
    if (needle?.startsWith('void removeFrom')) return `bool remove${target}(`;
    if (needle === `if (!containsExponent(${target}, exponent)) return;`) {
      return `if (!containsExponent(${target}, exponent)) return false;`;
    }
    if (needle === `${target} = removeExponent(${target}, exponent);`) {
      return `bool removed = removeTerm(${target}, exponent);`;
    }
  }
  return null;
}
