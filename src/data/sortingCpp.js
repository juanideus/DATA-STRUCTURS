const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const commonOperations = {
  'add-end': `bool addAtEnd(int value) {
    if (size == CAPACITY) return false;
    values[size] = value;
    size++;
    return true;
}`,
  'remove-value': `bool removeValue(int target) {
    int index = -1;
    for (int i = 0; i < size; i++) {
        if (values[i] == target) {
            index = i;
            break;
        }
    }
    if (index == -1) return false;
    for (int i = index; i < size - 1; i++) {
        values[i] = values[i + 1];
    }
    size--;
    return true;
}`,
  shuffle: `void shuffle() {
    for (int i = size - 1; i > 0; i--) {
        int other = nextRandom() % (i + 1);
        swapValues(i, other);
    }
}`,
  reset: `void reset() {
    size = initialSize;
    for (int i = 0; i < size; i++) {
        values[i] = initialValues[i];
    }
}`,
};

const sortOperations = {
  'bubble-sort': `void sort() {
    for (int end = size - 1; end > 0; end--) {
        bool changed = false;
        for (int i = 0; i < end; i++) {
            if (values[i] > values[i + 1]) {
                swapValues(i, i + 1);
                changed = true;
            }
        }
        if (!changed) break;
    }
}`,
  'selection-sort': `void sort() {
    for (int i = 0; i < size - 1; i++) {
        int minimum = i;
        for (int j = i + 1; j < size; j++) {
            if (values[j] < values[minimum]) minimum = j;
        }
        if (minimum != i) swapValues(i, minimum);
    }
}`,
  'insertion-sort': `void sort() {
    for (int i = 1; i < size; i++) {
        int current = values[i];
        int j = i - 1;
        while (j >= 0 && values[j] > current) {
            values[j + 1] = values[j];
            j--;
        }
        values[j + 1] = current;
    }
}`,
  'merge-sort': `void sort() {
    if (size > 1) mergeSort(0, size - 1);
}`,
  'quick-sort': `void sort() {
    if (size > 1) quickSort(0, size - 1);
}`,
  'shell-sort': `void sort() {
    for (int gap = size / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < size; i++) {
            int current = values[i];
            int j = i;
            while (j >= gap && values[j - gap] > current) {
                values[j] = values[j - gap];
                j -= gap;
            }
            values[j] = current;
        }
    }
}`,
  'heap-sort': `void sort() {
    for (int i = size / 2 - 1; i >= 0; i--) heapify(size, i);
    for (int end = size - 1; end > 0; end--) {
        swapValues(0, end);
        heapify(end, 0);
    }
}`,
  'counting-sort': `bool sort() {
    if (size < 2) return true;

    int minimum = values[0];
    int maximum = values[0];
    for (int i = 1; i < size; i++) {
        if (values[i] < minimum) minimum = values[i];
        if (values[i] > maximum) maximum = values[i];
    }
    long long rangeValue = static_cast<long long>(maximum) - minimum + 1;
    if (rangeValue <= 0 || rangeValue > MAX_COUNT_RANGE) return false;
    int range = static_cast<int>(rangeValue);
    int* count = new int[range]{};
    for (int i = 0; i < size; i++) count[values[i] - minimum]++;

    int index = 0;
    for (int offset = 0; offset < range; offset++) {
        while (count[offset] > 0) {
            values[index] = offset + minimum;
            index++;
            count[offset]--;
        }
    }
    delete[] count;
    return true;
}`,
  'radix-sort': `bool sort() {
    if (size < 2) return true;

    int minimum = values[0];
    int maximum = values[0];
    for (int i = 1; i < size; i++) {
        if (values[i] < minimum) minimum = values[i];
        if (values[i] > maximum) maximum = values[i];
    }
    long long offsetValue = minimum < 0 ? -static_cast<long long>(minimum) : 0;
    long long maximumKey = static_cast<long long>(maximum) + offsetValue;
    if (maximumKey > 2147483647LL) return false;
    for (int exponent = 1; maximumKey / exponent > 0;) {
        countingByDigit(exponent, offsetValue);
        if (exponent > maximumKey / 10) break;
        exponent *= 10;
    }
    return true;
}`,
  'bogo-sort': `bool sort() {
    int attempts = 0;
    while (!isSorted() && attempts < MAX_ATTEMPTS) {
        shuffle();
        attempts++;
    }
    return isSorted();
}`,
};

const helpers = {
  swap: `void swapValues(int left, int right) {
    int temporary = values[left];
    values[left] = values[right];
    values[right] = temporary;
}`,
  random: `int nextRandom() {
    seed = seed * 1103515245u + 12345u;
    return static_cast<int>((seed >> 16) & 0x7fff);
}`,
  merge: `void mergeSort(int left, int right) {
    if (left >= right) return;
    int middle = left + (right - left) / 2;
    mergeSort(left, middle);
    mergeSort(middle + 1, right);
    merge(left, middle, right);
}

void merge(int left, int middle, int right) {
    int* auxiliary = new int[CAPACITY]{};
    int i = left;
    int j = middle + 1;
    int k = left;
    while (i <= middle && j <= right) {
        auxiliary[k++] = values[i] <= values[j] ? values[i++] : values[j++];
    }
    while (i <= middle) auxiliary[k++] = values[i++];
    while (j <= right) auxiliary[k++] = values[j++];
    for (int index = left; index <= right; index++) values[index] = auxiliary[index];
    delete[] auxiliary;
}`,
  quick: `void quickSort(int low, int high) {
    if (low >= high) return;
    int pivotIndex = partition(low, high);
    quickSort(low, pivotIndex - 1);
    quickSort(pivotIndex + 1, high);
}

int partition(int low, int high) {
    int pivot = values[high];
    int smaller = low;
    for (int current = low; current < high; current++) {
        if (values[current] <= pivot) {
            swapValues(smaller, current);
            smaller++;
        }
    }
    swapValues(smaller, high);
    return smaller;
}`,
  heap: `void heapify(int heapSize, int root) {
    while (true) {
        int largest = root;
        int left = 2 * root + 1;
        int right = 2 * root + 2;
        if (left < heapSize && values[left] > values[largest]) largest = left;
        if (right < heapSize && values[right] > values[largest]) largest = right;
        if (largest == root) return;
        swapValues(root, largest);
        root = largest;
    }
}`,
  radix: `void countingByDigit(int exponent, long long offset) {
    int* output = new int[CAPACITY]{};
    int* count = new int[10]{};
    for (int i = 0; i < size; i++) {
        long long key = static_cast<long long>(values[i]) + offset;
        count[(key / exponent) % 10]++;
    }
    for (int digit = 1; digit < 10; digit++) count[digit] += count[digit - 1];
    for (int i = size - 1; i >= 0; i--) {
        long long key = static_cast<long long>(values[i]) + offset;
        int digit = static_cast<int>((key / exponent) % 10);
        output[--count[digit]] = values[i];
    }
    for (int i = 0; i < size; i++) values[i] = output[i];
    delete[] count;
    delete[] output;
}`,
  sorted: `bool isSorted() const {
    for (int i = 1; i < size; i++) {
        if (values[i - 1] > values[i]) return false;
    }
    return true;
}`,
};

function dependencies(algorithmId, actionId) {
  if (actionId === 'shuffle') return [helpers.random, helpers.swap];
  if (actionId !== 'sort') return [];
  if (['bubble-sort', 'selection-sort'].includes(algorithmId)) return [helpers.swap];
  if (algorithmId === 'merge-sort') return [helpers.merge];
  if (algorithmId === 'quick-sort') return [helpers.quick, helpers.swap];
  if (algorithmId === 'heap-sort') return [helpers.heap, helpers.swap];
  if (algorithmId === 'radix-sort') return [helpers.radix];
  if (algorithmId === 'bogo-sort') return [commonOperations.shuffle, helpers.sorted, helpers.random, helpers.swap];
  return [];
}

export function getSortingCpp(algorithmId, actionId) {
  const sortingIds = new Set([
    'bubble-sort',
    'selection-sort',
    'insertion-sort',
    'merge-sort',
    'quick-sort',
    'shell-sort',
    'heap-sort',
    'counting-sort',
    'radix-sort',
    'bogo-sort',
  ]);
  if (!sortingIds.has(algorithmId)) return null;
  const operation = actionId === 'sort' ? sortOperations[algorithmId] : commonOperations[actionId];
  if (!operation) return null;
  const extra = dependencies(algorithmId, actionId);
  return `class RawArraySorter {
public:
    static const int CAPACITY = 100;
    static const int MAX_COUNT_RANGE = 100000;
    static const int MAX_ATTEMPTS = 10000;
    int* values;
    int* initialValues;
    int size = 0;
    int initialSize = 0;
    unsigned int seed = 123456789u;

    RawArraySorter()
        : values(new int[CAPACITY]{}), initialValues(new int[CAPACITY]{}) {}
    RawArraySorter(const RawArraySorter&) = delete;
    RawArraySorter& operator=(const RawArraySorter&) = delete;
    ~RawArraySorter() {
        delete[] values;
        delete[] initialValues;
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
${extra.length ? `\n    // Auxiliary methods used above\n${extra.map(indent).join('\n\n')}` : ''}
};`;
}
