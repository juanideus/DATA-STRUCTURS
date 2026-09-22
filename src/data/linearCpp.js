const indent = (source, spaces = 4) => {
  const padding = ' '.repeat(spaces);
  return source.split('\n').map(line => `${padding}${line}`).join('\n');
};

const arrayOperations = {
  'add-start': `bool addAtStart(int value) {
    if (size == CAPACITY) return false;

    for (int i = size; i > 0; i--) {
        values[i] = values[i - 1];
    }
    values[0] = value;
    size++;
    return true;
}`,
  'add-end': `bool addAtEnd(int value) {
    if (size == CAPACITY) return false;

    values[size] = value;
    size++;
    return true;
}`,
  'add-index': `bool addAtIndex(int value, int index) {
    if (index < 0 || index > size || size == CAPACITY) {
        return false;
    }

    for (int i = size; i > index; i--) {
        values[i] = values[i - 1];
    }
    values[index] = value;
    size++;
    return true;
}`,
  'set-index': `bool updateAtIndex(int value, int index) {
    if (index < 0 || index >= size) return false;

    values[index] = value;
    return true;
}`,
  'remove-start': `bool removeFromStart() {
    if (size == 0) return false;

    for (int i = 0; i < size - 1; i++) {
        values[i] = values[i + 1];
    }
    size--;
    return true;
}`,
  'remove-end': `bool removeFromEnd() {
    if (size == 0) return false;

    size--;
    return true;
}`,
  'remove-index': `bool removeAtIndex(int index) {
    if (index < 0 || index >= size) return false;

    for (int i = index; i < size - 1; i++) {
        values[i] = values[i + 1];
    }
    size--;
    return true;
}`,
};

const stackOperations = {
  push: `bool push(int value) {
    if (top == CAPACITY - 1) return false;

    top++;
    values[top] = value;
    return true;
}`,
  pop: `bool pop(int& removed) {
    if (top == -1) return false;

    removed = values[top];
    top--;
    return true;
}`,
  peek: `bool peek(int& value) const {
    if (top == -1) return false;

    value = values[top];
    return true;
}`,
  clear: `void clear() {
    while (top >= 0) {
        top--;
    }
}`,
};

const queueOperations = {
  enqueue: `bool enqueue(int value) {
    if (size == CAPACITY) return false;

    Node* newNode = new Node(value);
    if (rear == nullptr) {
        front = newNode;
        rear = newNode;
    } else {
        rear->next = newNode;
        rear = newNode;
    }
    size++;
    return true;
}`,
  dequeue: `bool dequeue(int& removed) {
    if (front == nullptr) return false;

    Node* oldFront = front;
    removed = oldFront->value;
    front = front->next;
    delete oldFront;

    if (front == nullptr) rear = nullptr;
    size--;
    return true;
}`,
  front: `bool peekFront(int& value) const {
    if (front == nullptr) return false;

    value = front->value;
    return true;
}`,
  clear: `void clear() {
    while (front != nullptr) {
        Node* removed = front;
        front = front->next;
        delete removed;
    }
    rear = nullptr;
    size = 0;
}`,
};

const dequeOperations = {
  'add-start': `bool addAtStart(int value) {
    if (size == CAPACITY) return false;

    for (int i = size; i > 0; i--) {
        values[i] = values[i - 1];
    }
    values[0] = value;
    size++;
    return true;
}`,
  'add-end': `bool addAtEnd(int value) {
    if (size == CAPACITY) return false;

    values[size] = value;
    size++;
    return true;
}`,
  'remove-start': `bool removeFromStart(int& removed) {
    if (size == 0) return false;

    removed = values[0];
    for (int i = 0; i < size - 1; i++) {
        values[i] = values[i + 1];
    }
    size--;
    return true;
}`,
  'remove-end': `bool removeFromEnd(int& removed) {
    if (size == 0) return false;

    removed = values[size - 1];
    size--;
    return true;
}`,
};

function wrapArray(className, operation) {
  return `class ${className} {
public:
    static const int CAPACITY = 100;
    int* values;
    int size = 0;

    ${className}() : values(new int[CAPACITY]{}) {}
    ${className}(const ${className}&) = delete;
    ${className}& operator=(const ${className}&) = delete;
    ~${className}() { delete[] values; }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
};`;
}

function stackCpp(actionId) {
  const operation = stackOperations[actionId];
  if (!operation) return null;
  return `class ArrayStack {
public:
    static const int CAPACITY = 15;
    int* values;
    int top = -1;

    ArrayStack() : values(new int[CAPACITY]{}) {}
    ArrayStack(const ArrayStack&) = delete;
    ArrayStack& operator=(const ArrayStack&) = delete;
    ~ArrayStack() { delete[] values; }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
};`;
}

function queueCpp(actionId) {
  const operation = queueOperations[actionId];
  if (!operation) return null;
  return `class LinkedQueue {
public:
    static const int CAPACITY = 15;

    struct Node {
        int value;
        Node* next;

        explicit Node(int value) : value(value), next(nullptr) {}
    };

    Node* front = nullptr;
    Node* rear = nullptr;
    int size = 0;

    ~LinkedQueue() {
        clearNodes();
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

private:
    void clearNodes() {
        while (front != nullptr) {
            Node* removed = front;
            front = front->next;
            delete removed;
        }
        rear = nullptr;
        size = 0;
    }
};`;
}

export function getLinearCpp(algorithmId, actionId) {
  if (algorithmId === 'array') {
    const operation = arrayOperations[actionId];
    return operation ? wrapArray('RawArray', operation) : null;
  }
  if (algorithmId === 'pila') return stackCpp(actionId);
  if (algorithmId === 'cola') return queueCpp(actionId);
  if (algorithmId === 'deque') {
    const operation = dequeOperations[actionId];
    return operation ? wrapArray('ArrayDeque', operation) : null;
  }
  return null;
}
