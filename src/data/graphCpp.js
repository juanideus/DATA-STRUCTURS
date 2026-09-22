const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const findVertex = `int findVertex(char name) const {
    for (int i = 0; i < vertexCount; i++) {
        if (vertexNames[i] == name) return i;
    }
    return -1;
}`;

const unweightedOperations = {
  'vertex-add': `bool addVertex(char name) {
    if (vertexCount == MAX_VERTICES || findVertex(name) != -1) return false;
    vertexNames[vertexCount] = name;
    vertexCount++;
    return true;
}`,
  'vertex-remove': `bool removeVertex(char name) {
    int index = findVertex(name);
    if (index == -1) return false;

    for (int i = index; i < vertexCount - 1; i++) {
        vertexNames[i] = vertexNames[i + 1];
    }
    for (int row = index; row < vertexCount - 1; row++) {
        for (int column = 0; column < vertexCount; column++) {
            adjacency[row][column] = adjacency[row + 1][column];
        }
    }
    for (int column = index; column < vertexCount - 1; column++) {
        for (int row = 0; row < vertexCount - 1; row++) {
            adjacency[row][column] = adjacency[row][column + 1];
        }
    }
    vertexCount--;
    return true;
}`,
  'edge-add-undirected': `bool addEdge(char fromName, char toName) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || from == to) return false;
    adjacency[from][to] = true;
    adjacency[to][from] = true;
    return true;
}`,
  'edge-add-directed': `bool addEdge(char fromName, char toName) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || from == to) return false;
    adjacency[from][to] = true;
    return true;
}`,
  'edge-remove-undirected': `bool removeEdge(char fromName, char toName) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || !adjacency[from][to]) return false;
    adjacency[from][to] = false;
    adjacency[to][from] = false;
    return true;
}`,
  'edge-remove-directed': `bool removeEdge(char fromName, char toName) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || !adjacency[from][to]) return false;
    adjacency[from][to] = false;
    return true;
}`,
  'bfs-run': `bool breadthFirst(char startName) {
    int start = findVertex(startName);
    if (start == -1) return false;

    bool* visited = new bool[MAX_VERTICES]{};
    int* queue = new int[MAX_VERTICES]{};
    int front = 0;
    int rear = 0;
    queue[rear++] = start;
    visited[start] = true;

    while (front < rear) {
        int vertex = queue[front++];
        visit(vertexNames[vertex]);
        for (int neighbor = 0; neighbor < vertexCount; neighbor++) {
            if (adjacency[vertex][neighbor] && !visited[neighbor]) {
                visited[neighbor] = true;
                queue[rear++] = neighbor;
            }
        }
    }
    delete[] visited;
    delete[] queue;
    return true;
}`,
  'dfs-run': `bool depthFirst(char startName) {
    int start = findVertex(startName);
    if (start == -1) return false;
    bool* visited = new bool[MAX_VERTICES]{};
    depthFirstFrom(start, visited);
    delete[] visited;
    return true;
}`,
};

const visit = `void visit(char name) {
    lastVisited = name;
}`;

const depthFirstFrom = `void depthFirstFrom(int vertex, bool visited[]) {
    visited[vertex] = true;
    visit(vertexNames[vertex]);
    for (int neighbor = 0; neighbor < vertexCount; neighbor++) {
        if (adjacency[vertex][neighbor] && !visited[neighbor]) {
            depthFirstFrom(neighbor, visited);
        }
    }
}`;

function unweightedCpp(algorithmId, actionId) {
  const directed = algorithmId === 'grafo-dirigido';
  const key = actionId === 'edge-add'
    ? `edge-add-${directed ? 'directed' : 'undirected'}`
    : actionId === 'edge-remove'
      ? `edge-remove-${directed ? 'directed' : 'undirected'}`
      : actionId;
  const operation = unweightedOperations[key];
  if (!operation) return null;
  const dependencies = [findVertex];
  if (actionId === 'bfs-run') dependencies.push(visit);
  if (actionId === 'dfs-run') dependencies.push(depthFirstFrom, visit);
  return `class ${directed ? 'DirectedGraph' : 'Graph'} {
public:
    static const int MAX_VERTICES = 26;
    char* vertexNames;
    bool** adjacency;
    int vertexCount = 0;
    char lastVisited = '\\0';

    ${directed ? 'DirectedGraph' : 'Graph'}()
        : vertexNames(new char[MAX_VERTICES]{}), adjacency(new bool*[MAX_VERTICES]{}) {
        for (int row = 0; row < MAX_VERTICES; row++) adjacency[row] = new bool[MAX_VERTICES]{};
    }
    ${directed ? 'DirectedGraph' : 'Graph'}(const ${directed ? 'DirectedGraph' : 'Graph'}&) = delete;
    ${directed ? 'DirectedGraph' : 'Graph'}& operator=(const ${directed ? 'DirectedGraph' : 'Graph'}&) = delete;
    ~${directed ? 'DirectedGraph' : 'Graph'}() {
        for (int row = 0; row < MAX_VERTICES; row++) delete[] adjacency[row];
        delete[] adjacency;
        delete[] vertexNames;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Auxiliary methods used above
${dependencies.map(indent).join('\n\n')}
};`;
}

const weightedCommon = {
  'vertex-add': unweightedOperations['vertex-add'],
  'vertex-remove': `bool removeVertex(char name) {
    int index = findVertex(name);
    if (index == -1) return false;
    for (int i = index; i < vertexCount - 1; i++) vertexNames[i] = vertexNames[i + 1];
    for (int row = index; row < vertexCount - 1; row++) {
        for (int column = 0; column < vertexCount; column++) {
            weights[row][column] = weights[row + 1][column];
        }
    }
    for (int column = index; column < vertexCount - 1; column++) {
        for (int row = 0; row < vertexCount - 1; row++) {
            weights[row][column] = weights[row][column + 1];
        }
    }
    vertexCount--;
    return true;
}`,
  'edge-add': `bool addEdge(char fromName, char toName, int weight) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || from == to || weight <= 0) return false;
    weights[from][to] = weight;
    weights[to][from] = weight;
    return true;
}`,
  'edge-remove': `bool removeEdge(char fromName, char toName) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || weights[from][to] == 0) return false;
    weights[from][to] = 0;
    weights[to][from] = 0;
    return true;
}`,
};

const kruskalOperations = {
  'vertex-add': unweightedOperations['vertex-add'],
  'vertex-remove': `bool removeVertex(char name) {
    int index = findVertex(name);
    if (index == -1) return false;

    for (int edge = 0; edge < edgeCount;) {
        if (edges[edge].from == index || edges[edge].to == index) {
            for (int i = edge; i < edgeCount - 1; i++) edges[i] = edges[i + 1];
            edgeCount--;
        } else {
            if (edges[edge].from > index) edges[edge].from--;
            if (edges[edge].to > index) edges[edge].to--;
            edge++;
        }
    }
    for (int i = index; i < vertexCount - 1; i++) vertexNames[i] = vertexNames[i + 1];
    vertexCount--;
    return true;
}`,
  'edge-add': `bool addEdge(char fromName, char toName, int weight) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || from == to || weight <= 0 || edgeCount == MAX_EDGES) return false;
    for (int i = 0; i < edgeCount; i++) {
        bool sameEdge = (edges[i].from == from && edges[i].to == to)
            || (edges[i].from == to && edges[i].to == from);
        if (sameEdge) {
            edges[i].weight = weight;
            return true;
        }
    }
    edges[edgeCount] = {from, to, weight};
    edgeCount++;
    return true;
}`,
  'edge-remove': `bool removeEdge(char fromName, char toName) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1) return false;
    for (int edge = 0; edge < edgeCount; edge++) {
        bool sameEdge = (edges[edge].from == from && edges[edge].to == to)
            || (edges[edge].from == to && edges[edge].to == from);
        if (sameEdge) {
            for (int i = edge; i < edgeCount - 1; i++) edges[i] = edges[i + 1];
            edgeCount--;
            return true;
        }
    }
    return false;
}`,
};

const prim = `bool prim(char startName) {
    int start = findVertex(startName);
    if (start == -1) return false;

    int* key = new int[MAX_VERTICES];
    int* parent = new int[MAX_VERTICES];
    bool* inTree = new bool[MAX_VERTICES]{};
    for (int i = 0; i < vertexCount; i++) {
        key[i] = INF;
        parent[i] = -1;
    }
    key[start] = 0;

    for (int count = 0; count < vertexCount; count++) {
        int vertex = minimumKey(key, inTree);
        if (vertex == -1) break;
        inTree[vertex] = true;
        for (int neighbor = 0; neighbor < vertexCount; neighbor++) {
            int weight = weights[vertex][neighbor];
            if (weight > 0 && !inTree[neighbor] && weight < key[neighbor]) {
                key[neighbor] = weight;
                parent[neighbor] = vertex;
            }
        }
    }
    delete[] key;
    delete[] parent;
    delete[] inTree;
    return true;
}`;

const minimumKey = `int minimumKey(const int key[], const bool inTree[]) const {
    int best = INF;
    int vertex = -1;
    for (int i = 0; i < vertexCount; i++) {
        if (!inTree[i] && key[i] < best) {
            best = key[i];
            vertex = i;
        }
    }
    return vertex;
}`;

const kruskal = `void kruskal() {
    Edge* ordered = new Edge[MAX_EDGES];
    for (int i = 0; i < edgeCount; i++) ordered[i] = edges[i];
    sortEdges(ordered, edgeCount);

    int* parent = new int[MAX_VERTICES];
    int* rank = new int[MAX_VERTICES]{};
    for (int i = 0; i < vertexCount; i++) parent[i] = i;
    int selected = 0;
    for (int i = 0; i < edgeCount && selected < vertexCount - 1; i++) {
        int rootFrom = findRoot(parent, ordered[i].from);
        int rootTo = findRoot(parent, ordered[i].to);
        if (rootFrom != rootTo) {
            unite(parent, rank, rootFrom, rootTo);
            selected++;
        }
    }
    delete[] ordered;
    delete[] parent;
    delete[] rank;
}`;

const kruskalHelpers = `void sortEdges(Edge array[], int count) {
    for (int i = 1; i < count; i++) {
        Edge current = array[i];
        int j = i - 1;
        while (j >= 0 && array[j].weight > current.weight) {
            array[j + 1] = array[j];
            j--;
        }
        array[j + 1] = current;
    }
}

int findRoot(int parent[], int vertex) {
    if (parent[vertex] != vertex) parent[vertex] = findRoot(parent, parent[vertex]);
    return parent[vertex];
}

void unite(int parent[], int rank[], int left, int right) {
    if (rank[left] < rank[right]) parent[left] = right;
    else if (rank[left] > rank[right]) parent[right] = left;
    else {
        parent[right] = left;
        rank[left]++;
    }
}`;

function weightedCpp(algorithmId, actionId) {
  const isKruskal = algorithmId === 'kruskal';
  const operation = actionId === 'prim-run'
    ? prim
    : actionId === 'kruskal-run'
      ? kruskal
      : isKruskal
        ? kruskalOperations[actionId]
        : weightedCommon[actionId];
  if (!operation) return null;
  const dependencies = [findVertex];
  if (actionId === 'prim-run') dependencies.push(minimumKey);
  if (actionId === 'kruskal-run') dependencies.push(kruskalHelpers);
  return `class ${isKruskal ? 'KruskalGraph' : 'PrimGraph'} {
public:
    static const int MAX_VERTICES = 26;
    static const int MAX_EDGES = 100;
    static const int INF = 1000000000;
    struct Edge { int from; int to; int weight; };
    char* vertexNames;
    int** weights;
    Edge* edges;
    int vertexCount = 0;
    int edgeCount = 0;

    ${isKruskal ? 'KruskalGraph' : 'PrimGraph'}()
        : vertexNames(new char[MAX_VERTICES]{}), weights(new int*[MAX_VERTICES]{}),
          edges(new Edge[MAX_EDGES]{}) {
        for (int row = 0; row < MAX_VERTICES; row++) weights[row] = new int[MAX_VERTICES]{};
    }
    ${isKruskal ? 'KruskalGraph' : 'PrimGraph'}(const ${isKruskal ? 'KruskalGraph' : 'PrimGraph'}&) = delete;
    ${isKruskal ? 'KruskalGraph' : 'PrimGraph'}& operator=(const ${isKruskal ? 'KruskalGraph' : 'PrimGraph'}&) = delete;
    ~${isKruskal ? 'KruskalGraph' : 'PrimGraph'}() {
        for (int row = 0; row < MAX_VERTICES; row++) delete[] weights[row];
        delete[] weights;
        delete[] edges;
        delete[] vertexNames;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Auxiliary methods used above
${dependencies.map(indent).join('\n\n')}
};`;
}

export function getGraphCpp(algorithmId, actionId) {
  if (['grafo', 'grafo-dirigido', 'bfs', 'dfs'].includes(algorithmId)) {
    return unweightedCpp(algorithmId, actionId);
  }
  if (['prim', 'kruskal'].includes(algorithmId)) return weightedCpp(algorithmId, actionId);
  return null;
}
