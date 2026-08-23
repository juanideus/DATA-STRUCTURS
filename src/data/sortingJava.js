const sortingSources = {
  'bubble-sort': `void bubbleSort() {
    for (int end = size - 1; end > 0; end--) {
        boolean changed = false;

        for (int i = 0; i < end; i++) {
            if (values[i] > values[i + 1]) {
                int temp = values[i];
                values[i] = values[i + 1];
                values[i + 1] = temp;
                changed = true;
            }
        }

        if (!changed) {
            break;
        }
    }
    return;
}`,
  'selection-sort': `void selectionSort() {
    for (int i = 0; i < size - 1; i++) {
        int minIndex = i;

        for (int j = i + 1; j < size; j++) {
            if (values[j] < values[minIndex]) {
                minIndex = j;
            }
        }

        if (minIndex != i) {
            int first = i;
            int second = minIndex;
            int temp = values[first];
            values[first] = values[second];
            values[second] = temp;
        }
    }
    return;
}`,
  'insertion-sort': `void insertionSort() {
    for (int i = 1; i < size; i++) {
        int key = values[i];
        int j = i - 1;

        while (j >= 0 && values[j] > key) {
            values[j + 1] = values[j];
            j--;
        }
        values[j + 1] = key;
    }
    return;
}`,
  'merge-sort': `void sort() {
    int[] help = new int[size];
    mergeSort(0, size - 1, help);
}

void mergeSort(int left, int right, int[] help) {
    if (left >= right) {
        return;
    }

    int middle = (left + right) / 2;
    mergeSort(left, middle, help);
    mergeSort(middle + 1, right, help);
    merge(left, middle, right, help);
}

void merge(int left, int middle, int right, int[] help) {
    int i = left;
    int j = middle + 1;
    int k = left;

    while (i <= middle && j <= right) {
        if (values[i] <= values[j]) {
            help[k] = values[i];
            i++;
        } else {
            help[k] = values[j];
            j++;
        }
        k++;
    }
    while (i <= middle) {
        help[k] = values[i];
        i++;
        k++;
    }
    while (j <= right) {
        help[k] = values[j];
        j++;
        k++;
    }
    for (int index = left; index <= right; index++) {
        values[index] = help[index];
    }
}`,
  'quick-sort': `void sort() {
    quickSort(0, size - 1);
}

void quickSort(int low, int high) {
    if (low >= high) {
        return;
    }

    int pivotIndex = partition(low, high);
    quickSort(low, pivotIndex - 1);
    quickSort(pivotIndex + 1, high);
}

int partition(int low, int high) {
    int pivot = values[high];
    int smaller = low - 1;

    for (int current = low; current < high; current++) {
        if (values[current] <= pivot) {
            smaller++;
            swap(smaller, current);
        }
    }
    swap(smaller + 1, high);
    return smaller + 1;
}

void swap(int first, int second) {
    int temporary = values[first];
    values[first] = values[second];
    values[second] = temporary;
}`,
  'shell-sort': `void shellSort() {
    for (int gap = size / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < size; i++) {
            int temp = values[i];
            int j = i;

            while (j >= gap && values[j - gap] > temp) {
                values[j] = values[j - gap];
                j -= gap;
            }
            values[j] = temp;
        }
    }
    return;
}`,
  'heap-sort': `void heapSort() {
    for (int i = size / 2 - 1; i >= 0; i--) {
        heapify(size, i);
    }

    for (int end = size - 1; end > 0; end--) {
        swap(0, end);
        heapify(end, 0);
    }
    return;
}

void heapify(int heapSize, int root) {
    while (true) {
        int largest = root;
        int left = root * 2 + 1;
        int right = root * 2 + 2;

        if (left < heapSize && values[left] > values[largest]) {
            largest = left;
        }
        if (right < heapSize && values[right] > values[largest]) {
            largest = right;
        }
        if (largest == root) {
            return;
        }

        swap(root, largest);
        root = largest;
    }
}

void swap(int first, int second) {
    int temp = values[first];
    values[first] = values[second];
    values[second] = temp;
}`,
  'counting-sort': `void countingSort() {
    if (size < 2) return;

    int min = findMinimum();
    int max = findMaximum();
    int[] count = new int[max - min + 1];

    for (int i = 0; i < size; i++) {
        count[values[i] - min]++;
    }

    int position = 0;
    for (int index = 0; index < count.length; index++) {
        while (count[index] > 0) {
            values[position] = index + min;
            position++;
            count[index]--;
        }
    }
    return;
}

int findMinimum() {
    int min = values[0];
    for (int i = 1; i < size; i++) {
        if (values[i] < min) min = values[i];
    }
    return min;
}

int findMaximum() {
    int max = values[0];
    for (int i = 1; i < size; i++) {
        if (values[i] > max) max = values[i];
    }
    return max;
}`,
  'radix-sort': `void radixSort() {
    if (size < 2) return;

    int offset = findMinimum();
    int maxKey = findMaximum() - offset;
    int[] output = new int[size];

    for (int exp = 1; maxKey / exp > 0; exp *= 10) {
        int[] count = new int[10];

        for (int i = 0; i < size; i++) {
            int digit = ((values[i] - offset) / exp) % 10;
            count[digit]++;
        }
        for (int i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }
        for (int i = size - 1; i >= 0; i--) {
            int digit = ((values[i] - offset) / exp) % 10;
            output[count[digit] - 1] = values[i];
            count[digit]--;
        }
        for (int i = 0; i < size; i++) {
            values[i] = output[i];
        }

        if (exp > maxKey / 10) break;
    }
    return;
}

int findMinimum() {
    int min = values[0];
    for (int i = 1; i < size; i++) {
        if (values[i] < min) min = values[i];
    }
    return min;
}

int findMaximum() {
    int max = values[0];
    for (int i = 1; i < size; i++) {
        if (values[i] > max) max = values[i];
    }
    return max;
}`,
  'bogo-sort': `void bogoSort() {
    while (!isSorted()) {
        shuffle();
    }
    return;
}

boolean isSorted() {
    for (int i = 1; i < size; i++) {
        if (values[i - 1] > values[i]) {
            return false;
        }
    }
    return true;
}

void shuffle() {
    for (int i = size - 1; i > 0; i--) {
        int other = (int) (Math.random() * (i + 1));
        int temp = values[i];
        values[i] = values[other];
        values[other] = temp;
    }
}`,
};

export function getSortingJava(algorithmId, actionId) {
  if (actionId !== 'sort') return null;
  return sortingSources[algorithmId] ?? null;
}
