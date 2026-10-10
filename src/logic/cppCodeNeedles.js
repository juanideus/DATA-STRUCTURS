const radixNeedles = {
  'radix-start': 'bool sort()',
  'radix-size-check': 'if (size < 2)',
  'radix-offset': 'long long offsetValue',
  'radix-maximum': 'long long maximumKey',
  'radix-exp-loop': 'for (long long exponent',
  'radix-output-array': 'int* output =',
  'radix-pass': 'int* count =',
  'radix-digit': 'long long key =',
  'radix-count': 'count[(key / exponent)',
  'radix-prefix': 'for (int digit = 1;',
  'radix-output': 'output[--count[digit]]',
  'radix-decrement': 'output[--count[digit]]',
  'radix-write': 'values[i] = output[i];',
  'radix-complete': 'return true;',
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

export function cppCodeNeedle(algorithmId, actionId, frame) {
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
  if (algorithmId !== 'polinomios') return null;

  const needle = frame.codeNeedle;
  if (needle === 'C = null;') return 'clearList(C);';
  const target = actionId.endsWith('a') ? 'A' : 'B';
  if (actionId.startsWith('poly-insert-')) {
    if (needle?.startsWith('void insertIn')) return `void insert${target}(`;
    if (needle === `${target} = insertOrdered(${target}, coefficient, exponent);`) {
      return `insertTerm(${target}, coefficient, exponent);`;
    }
    if (needle === 'if (coefficient == 0) {') return 'if (coefficient == 0) return;';
  }
  if (actionId.startsWith('poly-remove-')) {
    if (needle?.startsWith('void removeFrom')) return `bool remove${target}(`;
    if (needle === `${target} = removeExponent(${target}, exponent);`) {
      return `bool removed = removeTerm(${target}, exponent);`;
    }
  }
  return null;
}
