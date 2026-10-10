const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const dijkstra = `bool shortestPath(int start, int goal) {
    if (start < 0 || start >= CELL_COUNT || goal < 0 || goal >= CELL_COUNT) return false;
    if (map[start] < 0 || map[goal] < 0) return false;
    bool* settled = new bool[CELL_COUNT]{};
    for (int cell = 0; cell < CELL_COUNT; cell++) {
        distance[cell] = INF;
        previous[cell] = -1;
    }
    distance[start] = 0;

    for (int step = 0; step < CELL_COUNT; step++) {
        int current = minimumDistance(settled);
        if (current == -1) break;
        settled[current] = true;
        if (current == goal) {
            delete[] settled;
            return true;
        }

        int* neighbors = new int[4]{};
        int count = collectNeighbors(current, neighbors);
        for (int i = 0; i < count; i++) {
            int neighbor = neighbors[i];
            int candidate = distance[current] + map[neighbor];
            if (!settled[neighbor] && candidate < distance[neighbor]) {
                distance[neighbor] = candidate;
                previous[neighbor] = current;
            }
        }
        delete[] neighbors;
    }
    bool reached = distance[goal] != INF;
    delete[] settled;
    return reached;
}`;

const astar = `bool shortestPath(int start, int goal) {
    if (start < 0 || start >= CELL_COUNT || goal < 0 || goal >= CELL_COUNT) return false;
    if (map[start] < 0 || map[goal] < 0) return false;
    bool* closed = new bool[CELL_COUNT]{};
    int* score = new int[CELL_COUNT];
    for (int cell = 0; cell < CELL_COUNT; cell++) {
        distance[cell] = INF;
        score[cell] = INF;
        previous[cell] = -1;
    }
    distance[start] = 0;
    minStepCost = minimumPassableCost();
    score[start] = heuristic(start, goal);

    for (int step = 0; step < CELL_COUNT; step++) {
        int current = minimumScore(score, closed);
        if (current == -1) break;
        closed[current] = true;
        if (current == goal) {
            delete[] closed;
            delete[] score;
            return true;
        }

        int* neighbors = new int[4]{};
        int count = collectNeighbors(current, neighbors);
        for (int i = 0; i < count; i++) {
            int neighbor = neighbors[i];
            int candidate = distance[current] + map[neighbor];
            if (!closed[neighbor] && candidate < distance[neighbor]) {
                previous[neighbor] = current;
                distance[neighbor] = candidate;
                score[neighbor] = candidate + heuristic(neighbor, goal);
            }
        }
        delete[] neighbors;
    }
    delete[] closed;
    delete[] score;
    return false;
}`;

const commonHelpers = `int collectNeighbors(int cell, int* output) const {
    int row = cell / COLUMNS;
    int column = cell % COLUMNS;
    int count = 0;
    if (row > 0 && map[cell - COLUMNS] >= 0) output[count++] = cell - COLUMNS;
    if (column + 1 < COLUMNS && map[cell + 1] >= 0) output[count++] = cell + 1;
    if (row + 1 < ROWS && map[cell + COLUMNS] >= 0) output[count++] = cell + COLUMNS;
    if (column > 0 && map[cell - 1] >= 0) output[count++] = cell - 1;
    return count;
}`;

const dijkstraHelper = `int minimumDistance(const bool settled[]) const {
    int best = INF;
    int selected = -1;
    for (int cell = 0; cell < CELL_COUNT; cell++) {
        if (!settled[cell] && distance[cell] < best) {
            best = distance[cell];
            selected = cell;
        }
    }
    return selected;
}`;

const astarHelpers = `int minimumPassableCost() const {
    int minimum = INF;
    for (int cell = 0; cell < CELL_COUNT; cell++) {
        if (map[cell] >= 0 && map[cell] < minimum) minimum = map[cell];
    }
    return minimum == INF ? 0 : minimum;
}

int heuristic(int first, int second) const {
    int firstRow = first / COLUMNS;
    int firstColumn = first % COLUMNS;
    int secondRow = second / COLUMNS;
    int secondColumn = second % COLUMNS;
    int rowDistance = firstRow > secondRow ? firstRow - secondRow : secondRow - firstRow;
    int columnDistance = firstColumn > secondColumn ? firstColumn - secondColumn : secondColumn - firstColumn;
    return (rowDistance + columnDistance) * minStepCost;
}

int minimumScore(const int score[], const bool closed[]) const {
    int best = INF;
    int selected = -1;
    for (int cell = 0; cell < CELL_COUNT; cell++) {
        if (!closed[cell] && score[cell] < best) {
            best = score[cell];
            selected = cell;
        }
    }
    return selected;
}`;

const reconstructPath = `// After shortestPath succeeds, the caller owns the returned array (delete[]).
int* reconstructPath(int start, int goal, int& length) const {
    length = 0;
    if (start < 0 || start >= CELL_COUNT || goal < 0 || goal >= CELL_COUNT) return nullptr;
    if (distance[goal] == INF) return nullptr;
    int current = goal;
    while (current >= 0 && current < CELL_COUNT && length < CELL_COUNT) {
        length++;
        if (current == start) break;
        current = previous[current];
    }
    if (current != start) { length = 0; return nullptr; }
    int* path = new int[length];
    current = goal;
    for (int index = length - 1; index >= 0; index--) {
        path[index] = current;
        current = previous[current];
    }
    return path;
}`;

export function getPathfindingCpp(algorithmId, actionId) {
  if (!['dijkstra', 'a-star'].includes(algorithmId)) return null;
  const operation = actionId === 'shortest-path'
    ? algorithmId === 'dijkstra' ? dijkstra : astar
    : actionId === 'reset'
      ? `void reset() {
    for (int cell = 0; cell < CELL_COUNT; cell++) {
        map[cell] = initialMap[cell];
        distance[cell] = INF;
        previous[cell] = -1;
    }
}`
      : null;
  if (!operation) return null;
  const helpers = actionId === 'shortest-path'
    ? [commonHelpers, algorithmId === 'dijkstra' ? dijkstraHelper : astarHelpers, reconstructPath]
    : [];
  return `class ${algorithmId === 'dijkstra' ? 'DijkstraGrid' : 'AStarGrid'} {
public:
    static const int ROWS = 12;
    static const int COLUMNS = 22;
    static const int CELL_COUNT = ROWS * COLUMNS;
    static const int INF = 1000000000;
    int* map;
    int* initialMap;
    int* distance;
    int* previous;
    int minStepCost = 0;

    explicit ${algorithmId === 'dijkstra' ? 'DijkstraGrid' : 'AStarGrid'}(const int* cells = nullptr)
        : map(new int[CELL_COUNT]{}), initialMap(new int[CELL_COUNT]{}), distance(new int[CELL_COUNT]{}),
          previous(new int[CELL_COUNT]{}) {
        for (int cell = 0; cell < CELL_COUNT; cell++) {
            int value = cells == nullptr ? 1 : cells[cell];
            map[cell] = value;
            initialMap[cell] = value;
        }
        resetSearchStorage();
    }

    ~${algorithmId === 'dijkstra' ? 'DijkstraGrid' : 'AStarGrid'}() {
        delete[] map;
        delete[] initialMap;
        delete[] distance;
        delete[] previous;
    }

    ${algorithmId === 'dijkstra' ? 'DijkstraGrid' : 'AStarGrid'}(
        const ${algorithmId === 'dijkstra' ? 'DijkstraGrid' : 'AStarGrid'}&) = delete;
    ${algorithmId === 'dijkstra' ? 'DijkstraGrid' : 'AStarGrid'}& operator=(
        const ${algorithmId === 'dijkstra' ? 'DijkstraGrid' : 'AStarGrid'}&) = delete;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${helpers.length ? `\n    // Search helpers used above\n${helpers.map(indent).join('\n\n')}` : ''}

private:
    void resetSearchStorage() {
        for (int cell = 0; cell < CELL_COUNT; cell++) {
            distance[cell] = INF;
            previous[cell] = -1;
        }
    }
};`;
}
