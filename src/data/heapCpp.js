const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'heap-add': `bool insertHeap(int value) {
    if (size == CAPACITY) return false;

    int index = size;
    heap[index] = value;
    size++;
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (heap[parent] >= heap[index]) break;
        swapValues(parent, index);
        index = parent;
    }
    return true;
}`,
  'heap-extract': `bool removeRoot(int& removed) {
    if (size == 0) return false;

    removed = heap[0];
    heap[0] = heap[size - 1];
    size--;
    heapifyDown(0);
    return true;
}`,
  peek: `bool root(int& value) const {
    if (size == 0) return false;
    value = heap[0];
    return true;
}`,
  clear: `void clear() {
    size = 0;
}`,
};

const swap = `void swapValues(int left, int right) {
    int temporary = heap[left];
    heap[left] = heap[right];
    heap[right] = temporary;
}`;

const heapify = `void heapifyDown(int index) {
    while (true) {
        int largest = index;
        int left = 2 * index + 1;
        int right = 2 * index + 2;
        if (left < size && heap[left] > heap[largest]) largest = left;
        if (right < size && heap[right] > heap[largest]) largest = right;
        if (largest == index) return;
        swapValues(index, largest);
        index = largest;
    }
}`;

export function getHeapCpp(algorithmId, actionId) {
  if (algorithmId !== 'heap' || !operations[actionId]) return null;
  const helpers = actionId === 'heap-add'
    ? [swap]
    : actionId === 'heap-extract'
      ? [heapify, swap]
      : [];
  return `class MaxHeap {
public:
    static const int CAPACITY = 15;
    int* heap;
    int size = 0;

    MaxHeap() : heap(new int[CAPACITY]{}) {}
    MaxHeap(const MaxHeap&) = delete;
    MaxHeap& operator=(const MaxHeap&) = delete;
    ~MaxHeap() { delete[] heap; }

    // Start of the selected operation
${indent(operations[actionId])}
    // End of the selected operation
${helpers.length ? `\n    // Auxiliary methods used above\n${helpers.map(indent).join('\n\n')}` : ''}
};`;
}
