const stackOperations = {
  push: `boolean push(int value) {
    if (top == MAX_SIZE - 1) {
        return false;
    }

    top++;
    values[top] = value;
    return true;
}`,
  pop: `Integer pop() {
    if (top == -1) {
        return null;
    }

    int removed = values[top];
    values[top] = 0;
    top--;
    return removed;
}`,
  peek: `Integer peek() {
    if (top == -1) {
        return null;
    }

    return values[top];
}`,
  clear: `void clear() {
    while (top >= 0) {
        values[top] = 0;
        top--;
    }
}`,
};

const queueOperations = {
  enqueue: `boolean enqueue(int value) {
    if (size == MAX_SIZE) {
        return false;
    }

    Node newNode = new Node(value);
    if (rear == null) {
        front = newNode;
        rear = front;
    } else {
        rear.next = newNode;
        rear = newNode;
    }
    size++;
    return true;
}`,
  dequeue: `Integer dequeue() {
    if (front == null) {
        return null;
    }

    int removed = front.value;
    front = front.next;
    if (front == null) {
        rear = null;
    }
    size--;
    return removed;
}`,
  front: `Integer peekFront() {
    if (front == null) {
        return null;
    }

    return front.value;
}`,
  clear: `void clear() {
    front = null;
    rear = null;
    size = 0;
}`,
};

const dequeOperations = {
  'add-start': `void addAtStart(int value) {
    if (size == values.length) {
        throw new IllegalStateException("Deque is full");
    }

    for (int i = size; i > 0; i--) {
        values[i] = values[i - 1];
    }
    values[0] = value;
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    if (size == values.length) {
        throw new IllegalStateException("Deque is full");
    }

    values[size] = value;
    size++;
}`,
  'remove-start': `int removeFromStart() {
    if (size == 0) {
        throw new IllegalStateException("Deque is empty");
    }

    int removed = values[0];
    for (int i = 0; i < size - 1; i++) {
        values[i] = values[i + 1];
    }
    size--;
    return removed;
}`,
  'remove-end': `int removeFromEnd() {
    if (size == 0) {
        throw new IllegalStateException("Deque is empty");
    }

    int removed = values[size - 1];
    size--;
    return removed;
}`,
};

function indent(source, spaces = 4) {
  const padding = ' '.repeat(spaces);
  return source.split('\n').map(line => `${padding}${line}`).join('\n');
}

function stackJava(actionId) {
  const operation = stackOperations[actionId];
  if (!operation) return null;

  return `class ArrayStack {
    static final int MAX_SIZE = 15;

    int[] values = new int[MAX_SIZE];
    int top = -1;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
}`;
}

function queueJava(actionId) {
  const operation = queueOperations[actionId];
  if (!operation) return null;

  return `class LinkedQueue {
    static final int MAX_SIZE = 15;

    static class Node {
        int value;
        Node next;

        Node(int value) {
            this.value = value;
            this.next = null;
        }
    }

    Node front = null;
    Node rear = null;
    int size = 0;

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation
}`;
}

export function getLinearJava(algorithmId, actionId) {
  if (algorithmId === 'pila') return stackJava(actionId);
  if (algorithmId === 'cola') return queueJava(actionId);
  if (algorithmId === 'deque') return dequeOperations[actionId] ?? null;
  return null;
}
