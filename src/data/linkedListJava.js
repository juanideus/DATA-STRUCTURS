const indentBlock = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const wrapListCode = (className, hasPreviousLink, method) => `class ${className} {
${indentBlock(`class Node {
    int value;
    Node next;${hasPreviousLink ? '\n    Node prev;' : ''}

    Node(int value) {
        this.value = value;
        this.next = null;${hasPreviousLink ? '\n        this.prev = null;' : ''}
    }
}

Node head = null;
Node tail = null;
int size = 0;

// Start of the selected operation
${method}`)}
}`;

const simpleMethods = {
  'add-start': `void addAtStart(int value) {
    Node newNode = new Node(value);
    newNode.next = head;
    head = newNode;

    if (tail == null) {
        tail = newNode;
    }
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
        tail = newNode;
    } else {
        tail.next = newNode;
        tail = newNode;
    }
    size++;
}`,
  'add-index': `boolean addAtIndex(int value, int index) {
    if (index < 0 || index > size) {
        return false;
    }

    Node newNode = new Node(value);
    if (index == 0) {
        newNode.next = head;
        head = newNode;
        if (tail == null) tail = newNode;
    } else if (index == size) {
        tail.next = newNode;
        tail = newNode;
    } else {
        Node current = head;
        for (int i = 0; i < index - 1; i++) {
            current = current.next;
        }
        newNode.next = current.next;
        current.next = newNode;
    }
    size++;
    return true;
}`,
  'remove-start': `boolean removeFromStart() {
    if (head == null) {
        return false;
    }

    head = head.next;
    size--;
    if (head == null) {
        tail = null;
    }
    return true;
}`,
  'remove-end': `boolean removeFromEnd() {
    if (head == null) {
        return false;
    }

    if (head == tail) {
        head = null;
        tail = null;
    } else {
        Node current = head;
        while (current.next != tail) {
            current = current.next;
        }
        current.next = null;
        tail = current;
    }
    size--;
    return true;
}`,
  'remove-index': `boolean removeAtIndex(int index) {
    if (index < 0 || index >= size) {
        return false;
    }

    if (index == 0) {
        head = head.next;
        size--;
        if (head == null) tail = null;
        return true;
    }

    Node previous = head;
    for (int i = 0; i < index - 1; i++) {
        previous = previous.next;
    }
    Node removed = previous.next;
    previous.next = removed.next;
    if (removed == tail) tail = previous;
    size--;
    return true;
}`,
  'remove-value': `boolean removeValue(int target) {
    Node current = head;
    Node previous = null;

    while (current != null) {
        if (current.value == target) {
            if (previous == null) head = current.next;
            else previous.next = current.next;

            if (current == tail) tail = previous;
            size--;
            return true;
        }
        previous = current;
        current = current.next;
    }
    return false;
}`,
  find: `int find(int target) {
    Node current = head;
    int index = 0;

    while (current != null) {
        if (current.value == target) return index;
        current = current.next;
        index++;
    }
    return -1;
}`,
};

const doubleMethods = {
  'add-start': `void addAtStart(int value) {
    Node newNode = new Node(value);
    newNode.next = head;

    if (head == null) {
        tail = newNode;
    } else {
        head.prev = newNode;
    }
    head = newNode;
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node newNode = new Node(value);
    newNode.prev = tail;

    if (tail == null) {
        head = newNode;
    } else {
        tail.next = newNode;
    }
    tail = newNode;
    size++;
}`,
  'add-index': `boolean addAtIndex(int value, int index) {
    if (index < 0 || index > size) {
        return false;
    }

    Node newNode = new Node(value);
    if (index == 0) {
        newNode.next = head;
        if (head == null) tail = newNode;
        else head.prev = newNode;
        head = newNode;
    } else if (index == size) {
        newNode.prev = tail;
        tail.next = newNode;
        tail = newNode;
    } else {
        Node current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        newNode.prev = current.prev;
        newNode.next = current;
        current.prev.next = newNode;
        current.prev = newNode;
    }
    size++;
    return true;
}`,
  'remove-start': `boolean removeFromStart() {
    if (head == null) {
        return false;
    }

    head = head.next;
    size--;
    if (head == null) tail = null;
    else head.prev = null;
    return true;
}`,
  'remove-end': `boolean removeFromEnd() {
    if (tail == null) {
        return false;
    }

    tail = tail.prev;
    size--;
    if (tail == null) head = null;
    else tail.next = null;
    return true;
}`,
  'remove-index': `boolean removeAtIndex(int index) {
    if (index < 0 || index >= size) {
        return false;
    }

    Node current = head;
    for (int i = 0; i < index; i++) {
        current = current.next;
    }
    if (current.prev == null) head = current.next;
    else current.prev.next = current.next;

    if (current.next == null) tail = current.prev;
    else current.next.prev = current.prev;
    size--;
    return true;
}`,
  'remove-value': `boolean removeValue(int target) {
    Node current = head;

    while (current != null) {
        if (current.value == target) {
            if (current.prev == null) head = current.next;
            else current.prev.next = current.next;

            if (current.next == null) tail = current.prev;
            else current.next.prev = current.prev;
            size--;
            return true;
        }
        current = current.next;
    }
    return false;
}`,
  find: `int find(int target) {
    Node current = head;
    int index = 0;

    while (current != null) {
        if (current.value == target) return index;
        current = current.next;
        index++;
    }
    return -1;
}`,
};

const circularSimpleMethods = {
  'add-start': `void addAtStart(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
        tail = newNode;
        newNode.next = newNode;
    } else {
        newNode.next = head;
        head = newNode;
        tail.next = head;
    }
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
        tail = newNode;
        newNode.next = newNode;
    } else {
        newNode.next = head;
        tail.next = newNode;
        tail = newNode;
    }
    size++;
}`,
  'add-index': `boolean addAtIndex(int value, int index) {
    if (index < 0 || index > size) {
        return false;
    }

    Node newNode = new Node(value);
    if (size == 0) {
        head = newNode;
        tail = newNode;
        newNode.next = newNode;
    } else if (index == 0) {
        newNode.next = head;
        head = newNode;
        tail.next = head;
    } else {
        Node previous = head;
        for (int i = 0; i < index - 1; i++) {
            previous = previous.next;
        }
        newNode.next = previous.next;
        previous.next = newNode;
        if (index == size) tail = newNode;
        tail.next = head;
    }
    size++;
    return true;
}`,
  'remove-start': `boolean removeFromStart() {
    if (head == null) {
        return false;
    }

    if (head == tail) {
        head = null;
        tail = null;
    } else {
        head = head.next;
        tail.next = head;
    }
    size--;
    return true;
}`,
  'remove-end': `boolean removeFromEnd() {
    if (head == null) {
        return false;
    }

    if (head == tail) {
        head = null;
        tail = null;
    } else {
        Node previous = head;
        while (previous.next != tail) {
            previous = previous.next;
        }
        previous.next = head;
        tail = previous;
    }
    size--;
    return true;
}`,
  'remove-index': `boolean removeAtIndex(int index) {
    if (index < 0 || index >= size) {
        return false;
    }

    if (size == 1) {
        head = null;
        tail = null;
    } else if (index == 0) {
        head = head.next;
        tail.next = head;
    } else {
        Node previous = head;
        for (int i = 0; i < index - 1; i++) {
            previous = previous.next;
        }
        if (previous.next == tail) tail = previous;
        previous.next = previous.next.next;
        tail.next = head;
    }
    size--;
    return true;
}`,
  'remove-value': `boolean removeValue(int target) {
    if (head == null) return false;

    Node current = head;
    Node previous = tail;
    do {
        if (current.value == target) {
            if (size == 1) {
                head = null;
                tail = null;
            } else {
                previous.next = current.next;
                if (current == head) head = current.next;
                if (current == tail) tail = previous;
                tail.next = head;
            }
            size--;
            return true;
        }
        previous = current;
        current = current.next;
    } while (current != head);
    return false;
}`,
  find: `int find(int target) {
    if (head == null) return -1;

    Node current = head;
    int index = 0;
    do {
        if (current.value == target) return index;
        current = current.next;
        index++;
    } while (current != head);
    return -1;
}`,
};

const circularDoubleMethods = {
  'add-start': `void addAtStart(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
        tail = newNode;
        newNode.next = newNode;
        newNode.prev = newNode;
    } else {
        newNode.next = head;
        newNode.prev = tail;
        head.prev = newNode;
        tail.next = newNode;
        head = newNode;
    }
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
        tail = newNode;
        newNode.next = newNode;
        newNode.prev = newNode;
    } else {
        newNode.prev = tail;
        newNode.next = head;
        tail.next = newNode;
        head.prev = newNode;
        tail = newNode;
    }
    size++;
}`,
  'add-index': `boolean addAtIndex(int value, int index) {
    if (index < 0 || index > size) {
        return false;
    }

    Node newNode = new Node(value);
    if (size == 0) {
        head = newNode;
        tail = newNode;
        newNode.next = newNode;
        newNode.prev = newNode;
    } else if (index == 0) {
        newNode.next = head;
        newNode.prev = tail;
        head.prev = newNode;
        tail.next = newNode;
        head = newNode;
    } else if (index == size) {
        newNode.prev = tail;
        newNode.next = head;
        tail.next = newNode;
        head.prev = newNode;
        tail = newNode;
    } else {
        Node current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        newNode.prev = current.prev;
        newNode.next = current;
        current.prev.next = newNode;
        current.prev = newNode;
    }
    size++;
    return true;
}`,
  'remove-start': `boolean removeFromStart() {
    if (head == null) {
        return false;
    }

    if (head == tail) {
        head = null;
        tail = null;
    } else {
        head = head.next;
        head.prev = tail;
        tail.next = head;
    }
    size--;
    return true;
}`,
  'remove-end': `boolean removeFromEnd() {
    if (tail == null) {
        return false;
    }

    if (head == tail) {
        head = null;
        tail = null;
    } else {
        tail = tail.prev;
        tail.next = head;
        head.prev = tail;
    }
    size--;
    return true;
}`,
  'remove-index': `boolean removeAtIndex(int index) {
    if (index < 0 || index >= size) {
        return false;
    }

    Node current = head;
    for (int i = 0; i < index; i++) {
        current = current.next;
    }
    if (size == 1) {
        head = null;
        tail = null;
    } else {
        current.prev.next = current.next;
        current.next.prev = current.prev;
        if (current == head) head = current.next;
        if (current == tail) tail = current.prev;
        head.prev = tail;
        tail.next = head;
    }
    size--;
    return true;
}`,
  'remove-value': `boolean removeValue(int target) {
    if (head == null) return false;

    Node current = head;
    do {
        if (current.value == target) {
            if (size == 1) {
                head = null;
                tail = null;
            } else {
                current.prev.next = current.next;
                current.next.prev = current.prev;
                if (current == head) head = current.next;
                if (current == tail) tail = current.prev;
                head.prev = tail;
                tail.next = head;
            }
            size--;
            return true;
        }
        current = current.next;
    } while (current != head);
    return false;
}`,
  find: `int find(int target) {
    if (head == null) return -1;

    Node current = head;
    int index = 0;
    do {
        if (current.value == target) return index;
        current = current.next;
        index++;
    } while (current != head);
    return -1;
}`,
};

const listDefinitions = {
  'lista-simple': ['SimpleLinkedList', false, simpleMethods],
  'lista-doble': ['DoublyLinkedList', true, doubleMethods],
  'lista-circular-simple': ['CircularSinglyLinkedList', false, circularSimpleMethods],
  'lista-circular-doble': ['CircularDoublyLinkedList', true, circularDoubleMethods],
};

export const linkedListJava = Object.fromEntries(
  Object.entries(listDefinitions).flatMap(([listId, [className, hasPreviousLink, methods]]) => (
    Object.entries(methods).map(([actionId, method]) => [
      `${listId}:${actionId}`,
      wrapListCode(className, hasPreviousLink, method),
    ])
  )),
);
