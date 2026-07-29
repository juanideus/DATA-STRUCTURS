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
int size = 0;

// Start of the selected operation
${method}`)}
}`;

const simpleMethods = {
  'add-start': `void addAtStart(int value) {
    Node newNode = new Node(value);
    newNode.next = head;
    head = newNode;
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
    } else {
        Node current = head;
        while (current.next != null) {
            current = current.next;
        }
        current.next = newNode;
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
    } else {
        Node previous = head;
        for (int i = 0; i < index - 1; i++) {
            previous = previous.next;
        }
        newNode.next = previous.next;
        previous.next = newNode;
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
    return true;
}`,
  'remove-end': `boolean removeFromEnd() {
    if (head == null) {
        return false;
    }

    if (head.next == null) {
        head = null;
    } else {
        Node current = head;
        while (current.next.next != null) {
            current = current.next;
        }
        current.next = null;
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
        return true;
    }

    Node previous = head;
    for (int i = 0; i < index - 1; i++) {
        previous = previous.next;
    }
    previous.next = previous.next.next;
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

    if (head != null) {
        head.prev = newNode;
    }
    head = newNode;
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
    } else {
        Node current = head;
        while (current.next != null) {
            current = current.next;
        }
        current.next = newNode;
        newNode.prev = current;
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
        if (head != null) head.prev = newNode;
        head = newNode;
    } else {
        Node previous = head;
        for (int i = 0; i < index - 1; i++) {
            previous = previous.next;
        }
        newNode.next = previous.next;
        newNode.prev = previous;
        if (previous.next != null) {
            previous.next.prev = newNode;
        }
        previous.next = newNode;
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
    if (head != null) head.prev = null;
    return true;
}`,
  'remove-end': `boolean removeFromEnd() {
    if (head == null) {
        return false;
    }

    Node current = head;
    while (current.next != null) {
        current = current.next;
    }
    if (current.prev == null) head = null;
    else current.prev.next = null;
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
    if (current.prev == null) head = current.next;
    else current.prev.next = current.next;

    if (current.next != null) current.next.prev = current.prev;
    size--;
    return true;
}`,
  'remove-value': `boolean removeValue(int target) {
    Node current = head;

    while (current != null) {
        if (current.value == target) {
            if (current.prev == null) head = current.next;
            else current.prev.next = current.next;

            if (current.next != null) current.next.prev = current.prev;
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
        newNode.next = newNode;
    } else {
        Node last = head;
        while (last.next != head) {
            last = last.next;
        }
        newNode.next = head;
        last.next = newNode;
        head = newNode;
    }
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
        newNode.next = newNode;
    } else {
        Node last = head;
        while (last.next != head) {
            last = last.next;
        }
        newNode.next = head;
        last.next = newNode;
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
        newNode.next = newNode;
    } else if (index == 0) {
        Node last = head;
        while (last.next != head) {
            last = last.next;
        }
        newNode.next = head;
        last.next = newNode;
        head = newNode;
    } else {
        Node previous = head;
        for (int i = 0; i < index - 1; i++) {
            previous = previous.next;
        }
        newNode.next = previous.next;
        previous.next = newNode;
    }
    size++;
    return true;
}`,
  'remove-start': `boolean removeFromStart() {
    if (head == null) {
        return false;
    }

    if (head.next == head) {
        head = null;
    } else {
        Node last = head;
        while (last.next != head) {
            last = last.next;
        }
        head = head.next;
        last.next = head;
    }
    size--;
    return true;
}`,
  'remove-end': `boolean removeFromEnd() {
    if (head == null) {
        return false;
    }

    if (head.next == head) {
        head = null;
    } else {
        Node previous = head;
        while (previous.next.next != head) {
            previous = previous.next;
        }
        previous.next = head;
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
    } else if (index == 0) {
        Node last = head;
        while (last.next != head) {
            last = last.next;
        }
        head = head.next;
        last.next = head;
    } else {
        Node previous = head;
        for (int i = 0; i < index - 1; i++) {
            previous = previous.next;
        }
        previous.next = previous.next.next;
    }
    size--;
    return true;
}`,
  'remove-value': `boolean removeValue(int target) {
    if (head == null) return false;

    if (head.value == target) {
        if (head.next == head) {
            head = null;
        } else {
            Node last = head;
            while (last.next != head) {
                last = last.next;
            }
            head = head.next;
            last.next = head;
        }
        size--;
        return true;
    }

    Node previous = head;
    Node current = head.next;
    do {
        if (current.value == target) {
            previous.next = current.next;
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
        newNode.next = newNode;
        newNode.prev = newNode;
    } else {
        Node last = head.prev;
        newNode.next = head;
        newNode.prev = last;
        head.prev = newNode;
        last.next = newNode;
        head = newNode;
    }
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node newNode = new Node(value);

    if (head == null) {
        head = newNode;
        newNode.next = newNode;
        newNode.prev = newNode;
    } else {
        Node last = head.prev;
        newNode.prev = last;
        newNode.next = head;
        last.next = newNode;
        head.prev = newNode;
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
        newNode.next = newNode;
        newNode.prev = newNode;
    } else if (index == 0) {
        Node last = head.prev;
        newNode.next = head;
        newNode.prev = last;
        head.prev = newNode;
        last.next = newNode;
        head = newNode;
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

    if (head.next == head) {
        head = null;
    } else {
        Node last = head.prev;
        head = head.next;
        head.prev = last;
        last.next = head;
    }
    size--;
    return true;
}`,
  'remove-end': `boolean removeFromEnd() {
    if (head == null) {
        return false;
    }

    if (head.next == head) {
        head = null;
    } else {
        Node last = head.prev;
        Node newLast = last.prev;
        newLast.next = head;
        head.prev = newLast;
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
    } else {
        current.prev.next = current.next;
        current.next.prev = current.prev;
        if (current == head) head = current.next;
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
            } else {
                current.prev.next = current.next;
                current.next.prev = current.prev;
                if (current == head) head = current.next;
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
