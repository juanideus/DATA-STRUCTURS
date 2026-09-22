const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'hanoi-set': `bool setDisks(int amount) {
    if (amount < 1 || amount > CAPACITY) return false;
    diskCount = amount;
    sourceSize = amount;
    auxiliarySize = 0;
    targetSize = 0;
    for (int i = 0; i < amount; i++) source[i] = amount - i;
    return true;
}`,
  'hanoi-solve': `void solve() {
    moveTower(diskCount, source, sourceSize, target, targetSize, auxiliary, auxiliarySize);
}`,
  reset: `void reset() {
    setDisks(diskCount);
}`,
};

const moveTower = `void moveTower(int amount, int from[], int& fromSize, int to[], int& toSize, int help[], int& helpSize) {
    if (amount == 0) return;
    moveTower(amount - 1, from, fromSize, help, helpSize, to, toSize);
    to[toSize++] = from[--fromSize];
    moveTower(amount - 1, help, helpSize, to, toSize, from, fromSize);
}`;

export function getHanoiCpp(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  const helpers = [];
  if (actionId === 'hanoi-solve') helpers.push(moveTower);
  if (actionId === 'reset') helpers.push(operations['hanoi-set']);
  return `class TowersOfHanoi {
public:
    static const int CAPACITY = 7;
    int* source;
    int* auxiliary;
    int* target;
    int sourceSize = 0;
    int auxiliarySize = 0;
    int targetSize = 0;
    int diskCount = 3;

    TowersOfHanoi()
        : source(new int[CAPACITY]{}), auxiliary(new int[CAPACITY]{}),
          target(new int[CAPACITY]{}) {
        sourceSize = diskCount;
        for (int i = 0; i < diskCount; i++) source[i] = diskCount - i;
    }

    ~TowersOfHanoi() {
        delete[] source;
        delete[] auxiliary;
        delete[] target;
    }

    TowersOfHanoi(const TowersOfHanoi&) = delete;
    TowersOfHanoi& operator=(const TowersOfHanoi&) = delete;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${helpers.length ? `\n    // Auxiliary method used above\n${helpers.map(indent).join('\n\n')}` : ''}
};`;
}
