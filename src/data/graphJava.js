const profiles = {
  grafo: {
    className: 'UndirectedGraph',
    representation: 'matrix',
    directed: false,
    weighted: false,
  },
  'grafo-dirigido': {
    className: 'DirectedGraph',
    representation: 'matrix',
    directed: true,
    weighted: false,
  },
  bfs: {
    className: 'BreadthFirstGraph',
    representation: 'matrix',
    directed: false,
    weighted: false,
  },
  dfs: {
    className: 'DepthFirstGraph',
    representation: 'matrix',
    directed: false,
    weighted: false,
  },
  prim: {
    className: 'PrimGraph',
    representation: 'matrix',
    directed: false,
    weighted: true,
  },
  kruskal: {
    className: 'KruskalGraph',
    representation: 'edge-list',
    directed: false,
    weighted: true,
  },
};

const commonOperations = {
  'vertex-add': `boolean addVertex(String name) {
    if (name == null || name.trim().length() == 0) {
        return false;
    }
    if (vertexCount == MAX_VERTICES) {
        return false;
    }
    if (findVertex(name) != -1) {
        return false;
    }

    vertexNames[vertexCount] = name.trim().toUpperCase();
    vertexCount++;
    return true;
}`,
};

const traversalOperations = {
  'bfs-run': `void breadthFirst(String startName) {
    int start = findVertex(startName);
    if (start == -1) {
        return;
    }

    int[] queue = new int[vertexCount];
    boolean[] visited = new boolean[vertexCount];
    int front = 0;
    int end = 0;
    queue[end] = start;
    end++;
    visited[start] = true;

    while (front < end) {
        int vertex = queue[front];
        front++;
        System.out.println(vertexNames[vertex]);

        for (int next = 0; next < vertexCount; next++) {
            boolean hasEdge = adjacency[vertex][next];
            if (hasEdge && !visited[next]) {
                visited[next] = true;
                queue[end] = next;
                end++;
            }
        }
    }
}`,
  'dfs-run': `void depthFirst(String startName) {
    int start = findVertex(startName);
    if (start == -1) {
        return;
    }

    boolean[] visited = new boolean[vertexCount];
    depthFirstFrom(start, visited);
}`,
};

const primOperation = `void prim(String startName) {
    int start = findVertex(startName);
    if (start == -1) {
        return;
    }

    boolean[] inTree = new boolean[vertexCount];
    int[] bestWeight = new int[vertexCount];
    int[] parent = new int[vertexCount];
    for (int vertex = 0; vertex < vertexCount; vertex++) {
        bestWeight[vertex] = NO_EDGE;
        parent[vertex] = -1;
    }
    bestWeight[start] = 0;

    for (int added = 0; added < vertexCount; added++) {
        int current = -1;
        for (int vertex = 0; vertex < vertexCount; vertex++) {
            if (!inTree[vertex]
                    && (current == -1
                    || bestWeight[vertex] < bestWeight[current])) {
                current = vertex;
            }
        }
        if (current == -1 || bestWeight[current] == NO_EDGE) {
            return; // The graph is disconnected.
        }

        inTree[current] = true;
        if (parent[current] != -1) {
            System.out.println(vertexNames[parent[current]]
                    + " - " + vertexNames[current]
                    + " : " + weights[parent[current]][current]);
        }

        for (int next = 0; next < vertexCount; next++) {
            int weight = weights[current][next];
            if (!inTree[next] && weight < bestWeight[next]) {
                bestWeight[next] = weight;
                parent[next] = current;
            }
        }
    }
}`;

const kruskalOperation = `void kruskal() {
    int[] from = new int[edgeCount];
    int[] to = new int[edgeCount];
    int[] edgeWeight = new int[edgeCount];
    for (int edge = 0; edge < edgeCount; edge++) {
        from[edge] = edges[edge].from;
        to[edge] = edges[edge].to;
        edgeWeight[edge] = edges[edge].weight;
    }

    // Sort the edges from the lightest to the heaviest.
    for (int end = edgeCount - 1; end > 0; end--) {
        for (int index = 0; index < end; index++) {
            if (edgeWeight[index] > edgeWeight[index + 1]) {
                swap(edgeWeight, index, index + 1);
                swap(from, index, index + 1);
                swap(to, index, index + 1);
            }
        }
    }

    int[] parent = new int[vertexCount];
    int[] rank = new int[vertexCount];
    for (int vertex = 0; vertex < vertexCount; vertex++) {
        parent[vertex] = vertex;
    }

    int selected = 0;
    for (int edge = 0; edge < edgeCount && selected < vertexCount - 1; edge++) {
        int firstRoot = find(parent, from[edge]);
        int secondRoot = find(parent, to[edge]);
        if (firstRoot != secondRoot) {
            union(parent, rank, firstRoot, secondRoot);
            System.out.println(vertexNames[from[edge]]
                    + " - " + vertexNames[to[edge]]
                    + " : " + edgeWeight[edge]);
            selected++;
        }
    }
}`;

const helpers = {
  findVertex: `int findVertex(String name) {
    if (name == null) {
        return -1;
    }
    for (int index = 0; index < vertexCount; index++) {
        if (vertexNames[index].equalsIgnoreCase(name.trim())) {
            return index;
        }
    }
    return -1;
}`,
  depthFirstFrom: `void depthFirstFrom(int vertex, boolean[] visited) {
    visited[vertex] = true;
    System.out.println(vertexNames[vertex]);

    for (int next = 0; next < vertexCount; next++) {
        boolean hasEdge = adjacency[vertex][next];
        if (hasEdge && !visited[next]) {
            depthFirstFrom(next, visited);
        }
    }
}`,
  removeEdgeAt: `void removeEdgeAt(int edgeIndex) {
    for (int index = edgeIndex; index < edgeCount - 1; index++) {
        edges[index] = edges[index + 1];
    }
    edgeCount--;
    edges[edgeCount] = null;
}`,
  find: `int find(int[] parent, int vertex) {
    if (parent[vertex] != vertex) {
        parent[vertex] = find(parent, parent[vertex]);
    }
    return parent[vertex];
}`,
  union: `void union(int[] parent, int[] rank, int firstRoot, int secondRoot) {
    if (rank[firstRoot] < rank[secondRoot]) {
        parent[firstRoot] = secondRoot;
    } else if (rank[firstRoot] > rank[secondRoot]) {
        parent[secondRoot] = firstRoot;
    } else {
        parent[secondRoot] = firstRoot;
        rank[firstRoot]++;
    }
}`,
  swap: `void swap(int[] values, int first, int second) {
    int temporary = values[first];
    values[first] = values[second];
    values[second] = temporary;
}`,
};

function matrixVertexRemove(profile) {
  const matrix = profile.weighted ? 'weights' : 'adjacency';
  const emptyValue = profile.weighted ? 'NO_EDGE' : 'false';
  return `boolean removeVertex(String name) {
    int vertex = findVertex(name);
    if (vertex == -1) {
        return false;
    }

    for (int index = vertex; index < vertexCount - 1; index++) {
        vertexNames[index] = vertexNames[index + 1];
    }
    for (int row = vertex; row < vertexCount - 1; row++) {
        for (int column = 0; column < vertexCount; column++) {
            ${matrix}[row][column] = ${matrix}[row + 1][column];
        }
    }
    for (int column = vertex; column < vertexCount - 1; column++) {
        for (int row = 0; row < vertexCount - 1; row++) {
            ${matrix}[row][column] = ${matrix}[row][column + 1];
        }
    }

    vertexCount--;
    vertexNames[vertexCount] = null;
    for (int index = 0; index < MAX_VERTICES; index++) {
        ${matrix}[vertexCount][index] = ${emptyValue};
        ${matrix}[index][vertexCount] = ${emptyValue};
    }
    return true;
}`;
}

function matrixEdgeAdd(profile) {
  const parameters = profile.weighted
    ? 'String fromName, String toName, int weight'
    : 'String fromName, String toName';
  const matrix = profile.weighted ? 'weights' : 'adjacency';
  const occupied = profile.weighted
    ? 'weights[from][to] != NO_EDGE'
    : 'adjacency[from][to]';
  const value = profile.weighted ? 'weight' : 'true';
  const reverse = profile.directed ? '' : `\n    ${matrix}[to][from] = ${value};`;
  return `boolean addEdge(${parameters}) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || from == to) {
        return false;
    }
    if (${occupied}) {
        return false;
    }

    ${matrix}[from][to] = ${value};${reverse}
    return true;
}`;
}

function matrixEdgeRemove(profile) {
  const matrix = profile.weighted ? 'weights' : 'adjacency';
  const missing = profile.weighted
    ? 'weights[from][to] == NO_EDGE'
    : '!adjacency[from][to]';
  const emptyValue = profile.weighted ? 'NO_EDGE' : 'false';
  const reverse = profile.directed ? '' : `\n    ${matrix}[to][from] = ${emptyValue};`;
  return `boolean removeEdge(String fromName, String toName) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || ${missing}) {
        return false;
    }

    ${matrix}[from][to] = ${emptyValue};${reverse}
    return true;
}`;
}

function edgeListOperation(actionId) {
  if (actionId === 'vertex-remove') {
    return `boolean removeVertex(String name) {
    int vertex = findVertex(name);
    if (vertex == -1) {
        return false;
    }

    for (int edge = edgeCount - 1; edge >= 0; edge--) {
        if (edges[edge].from == vertex || edges[edge].to == vertex) {
            removeEdgeAt(edge);
        } else {
            if (edges[edge].from > vertex) {
                edges[edge].from--;
            }
            if (edges[edge].to > vertex) {
                edges[edge].to--;
            }
        }
    }
    for (int index = vertex; index < vertexCount - 1; index++) {
        vertexNames[index] = vertexNames[index + 1];
    }
    vertexCount--;
    vertexNames[vertexCount] = null;
    return true;
}`;
  }
  if (actionId === 'edge-add') {
    return `boolean addEdge(String fromName, String toName, int weight) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1 || from == to || edgeCount == MAX_EDGES) {
        return false;
    }
    for (int edge = 0; edge < edgeCount; edge++) {
        boolean sameDirection = edges[edge].from == from && edges[edge].to == to;
        boolean oppositeDirection = edges[edge].from == to && edges[edge].to == from;
        if (sameDirection || oppositeDirection) {
            return false;
        }
    }

    edges[edgeCount] = new Edge(from, to, weight);
    edgeCount++;
    return true;
}`;
  }
  if (actionId === 'edge-remove') {
    return `boolean removeEdge(String fromName, String toName) {
    int from = findVertex(fromName);
    int to = findVertex(toName);
    if (from == -1 || to == -1) {
        return false;
    }
    for (int edge = 0; edge < edgeCount; edge++) {
        boolean sameDirection = edges[edge].from == from && edges[edge].to == to;
        boolean oppositeDirection = edges[edge].from == to && edges[edge].to == from;
        if (sameDirection || oppositeDirection) {
            removeEdgeAt(edge);
            return true;
        }
    }
    return false;
}`;
  }
  if (actionId === 'kruskal-run') return kruskalOperation;
  return commonOperations[actionId] ?? null;
}

function matrixOperation(profile, actionId) {
  if (actionId === 'vertex-remove') return matrixVertexRemove(profile);
  if (actionId === 'edge-add') return matrixEdgeAdd(profile);
  if (actionId === 'edge-remove') return matrixEdgeRemove(profile);
  if (actionId === 'prim-run' && profile.weighted) return primOperation;
  if (actionId === 'bfs-run' && !profile.weighted) return traversalOperations[actionId];
  if (actionId === 'dfs-run' && !profile.weighted) return traversalOperations[actionId];
  return commonOperations[actionId] ?? null;
}

function helperNames(profile, actionId) {
  if (profile.representation === 'edge-list') {
    if (actionId === 'vertex-remove') return ['findVertex', 'removeEdgeAt'];
    if (actionId === 'edge-remove') return ['findVertex', 'removeEdgeAt'];
    if (actionId === 'edge-add' || actionId === 'vertex-add') return ['findVertex'];
    if (actionId === 'kruskal-run') return ['find', 'union', 'swap'];
    return [];
  }
  if (actionId === 'dfs-run') return ['findVertex', 'depthFirstFrom'];
  if (['vertex-add', 'vertex-remove', 'edge-add', 'edge-remove', 'bfs-run', 'prim-run'].includes(actionId)) {
    return ['findVertex'];
  }
  return [];
}

function indent(source, spaces = 4) {
  const padding = ' '.repeat(spaces);
  return source.split('\n').map(line => `${padding}${line}`).join('\n');
}

function matrixFields(profile) {
  if (profile.weighted) {
    return `    static final int NO_EDGE = 1000000000;

    String[] vertexNames = new String[MAX_VERTICES];
    int[][] weights = new int[MAX_VERTICES][MAX_VERTICES];
    int vertexCount = 0;

    ${profile.className}() {
        for (int row = 0; row < MAX_VERTICES; row++) {
            for (int column = 0; column < MAX_VERTICES; column++) {
                weights[row][column] = NO_EDGE;
            }
        }
    }`;
  }
  return `    String[] vertexNames = new String[MAX_VERTICES];
    boolean[][] adjacency = new boolean[MAX_VERTICES][MAX_VERTICES];
    int vertexCount = 0;`;
}

function edgeListFields() {
  return `    static final int MAX_EDGES = 28;

    static class Edge {
        int from;
        int to;
        int weight;

        Edge(int from, int to, int weight) {
            this.from = from;
            this.to = to;
            this.weight = weight;
        }
    }

    String[] vertexNames = new String[MAX_VERTICES];
    Edge[] edges = new Edge[MAX_EDGES];
    int vertexCount = 0;
    int edgeCount = 0;`;
}

export function getGraphJava(algorithmId, actionId) {
  const profile = profiles[algorithmId];
  if (!profile) return null;

  const operation = profile.representation === 'edge-list'
    ? edgeListOperation(actionId)
    : matrixOperation(profile, actionId);
  if (!operation) return null;

  const usedHelpers = helperNames(profile, actionId)
    .map(name => `\n    // Helper used by the selected operation: ${name}\n${indent(helpers[name])}`)
    .join('\n');
  const fields = profile.representation === 'edge-list'
    ? edgeListFields()
    : matrixFields(profile);

  return `class ${profile.className} {
    static final int MAX_VERTICES = 8;

${fields}

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${usedHelpers}
}`;
}
