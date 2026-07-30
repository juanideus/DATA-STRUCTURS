const operations = {
  'vertex-add': `boolean addVertex(String name) {
    if (name == null || name.trim().length() == 0) {
        return false;
    }
    if (vertexCount == MAX_VERTICES) {
        return false;
    }
    if (indexOfVertex(name) != -1) {
        return false;
    }

    vertexNames[vertexCount] = name.trim().toUpperCase();
    vertexCount++;
    return true;
}`,
  'vertex-remove': `boolean removeVertex(String name) {
    int vertex = indexOfVertex(name);
    if (vertex == -1) {
        return false;
    }

    for (int index = vertex; index < vertexCount - 1; index++) {
        vertexNames[index] = vertexNames[index + 1];
    }

    // Desplazar las filas de la matriz.
    for (int row = vertex; row < vertexCount - 1; row++) {
        for (int column = 0; column < vertexCount; column++) {
            weights[row][column] = weights[row + 1][column];
        }
    }

    // Desplazar también las columnas de la matriz.
    for (int column = vertex; column < vertexCount - 1; column++) {
        for (int row = 0; row < vertexCount - 1; row++) {
            weights[row][column] = weights[row][column + 1];
        }
    }

    vertexCount--;
    vertexNames[vertexCount] = null;
    for (int index = 0; index < MAX_VERTICES; index++) {
        weights[vertexCount][index] = NO_EDGE;
        weights[index][vertexCount] = NO_EDGE;
    }
    return true;
}`,
  'edge-add': `boolean addEdge(String fromName, String toName, int weight) {
    int from = indexOfVertex(fromName);
    int to = indexOfVertex(toName);
    if (from == -1 || to == -1 || from == to) {
        return false;
    }
    if (weights[from][to] != NO_EDGE) {
        return false;
    }

    weights[from][to] = weight;
    if (!directed) {
        weights[to][from] = weight;
    }
    return true;
}`,
  'edge-remove': `boolean removeEdge(String fromName, String toName) {
    int from = indexOfVertex(fromName);
    int to = indexOfVertex(toName);
    if (from == -1 || to == -1 || weights[from][to] == NO_EDGE) {
        return false;
    }

    weights[from][to] = NO_EDGE;
    if (!directed) {
        weights[to][from] = NO_EDGE;
    }
    return true;
}`,
  'bfs-run': `void breadthFirst(String startName) {
    int start = indexOfVertex(startName);
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
            boolean hasEdge = weights[vertex][next] != NO_EDGE;
            if (hasEdge && !visited[next]) {
                visited[next] = true;
                queue[end] = next;
                end++;
            }
        }
    }
}`,
  'dfs-run': `void depthFirst(String startName) {
    int start = indexOfVertex(startName);
    if (start == -1) {
        return;
    }

    boolean[] visited = new boolean[vertexCount];
    depthFirstFrom(start, visited);
}`,
  'prim-run': `void prim(String startName) {
    int start = indexOfVertex(startName);
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
            return; // El grafo no es conexo.
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
}`,
  'kruskal-run': `void kruskal() {
    int maximumEdges = vertexCount * vertexCount;
    int[] from = new int[maximumEdges];
    int[] to = new int[maximumEdges];
    int[] edgeWeight = new int[maximumEdges];
    int edgeCount = 0;

    for (int first = 0; first < vertexCount; first++) {
        for (int second = first + 1; second < vertexCount; second++) {
            if (weights[first][second] != NO_EDGE) {
                from[edgeCount] = first;
                to[edgeCount] = second;
                edgeWeight[edgeCount] = weights[first][second];
                edgeCount++;
            }
        }
    }

    // Ordenar las aristas desde el menor peso.
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
}`,
};

const helpers = {
  indexOfVertex: `int indexOfVertex(String name) {
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
        boolean hasEdge = weights[vertex][next] != NO_EDGE;
        if (hasEdge && !visited[next]) {
            depthFirstFrom(next, visited);
        }
    }
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

const actionHelpers = {
  'vertex-add': ['indexOfVertex'],
  'vertex-remove': ['indexOfVertex'],
  'edge-add': ['indexOfVertex'],
  'edge-remove': ['indexOfVertex'],
  'bfs-run': ['indexOfVertex'],
  'dfs-run': ['indexOfVertex', 'depthFirstFrom'],
  'prim-run': ['indexOfVertex'],
  'kruskal-run': ['find', 'union', 'swap'],
};

function indent(source, spaces = 4) {
  const padding = ' '.repeat(spaces);
  return source.split('\n').map(line => `${padding}${line}`).join('\n');
}

export function getGraphJava(algorithmId, actionId) {
  const operation = operations[actionId];
  if (!operation || ['dijkstra', 'a-star'].includes(algorithmId)) {
    return null;
  }

  const directed = algorithmId === 'grafo-dirigido';
  const usedHelpers = (actionHelpers[actionId] ?? [])
    .map(name => `\n    // Método auxiliar utilizado arriba: ${name}\n${indent(helpers[name])}`)
    .join('\n');

  return `class Graph {
    static final int MAX_VERTICES = 8;
    static final int NO_EDGE = 1000000000;

    String[] vertexNames = new String[MAX_VERTICES];
    int[][] weights = new int[MAX_VERTICES][MAX_VERTICES];
    int vertexCount = 0;
    final boolean directed = ${directed};

    Graph() {
        for (int row = 0; row < MAX_VERTICES; row++) {
            for (int column = 0; column < MAX_VERTICES; column++) {
                weights[row][column] = NO_EDGE;
            }
        }
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${usedHelpers}
}`;
}
