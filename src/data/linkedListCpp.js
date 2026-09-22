const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const commonFind = `int find(int target) const {
    Node* current = head;
    int index = 0;

    while (current != nullptr) {
        if (current->value == target) return index;
        current = current->next;
        index++;
    }
    return -1;
}`;

const simpleMethods = {
  'add-start': `void addAtStart(int value) {
    Node* newNode = new Node(value);
    newNode->next = head;
    head = newNode;
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node* newNode = new Node(value);

    if (head == nullptr) {
        head = newNode;
    } else {
        Node* current = head;
        while (current->next != nullptr) {
            current = current->next;
        }
        current->next = newNode;
    }
    size++;
}`,
  'add-index': `bool addAtIndex(int value, int index) {
    if (index < 0 || index > size) return false;

    Node* newNode = new Node(value);
    if (index == 0) {
        newNode->next = head;
        head = newNode;
    } else {
        Node* previous = head;
        for (int i = 0; i < index - 1; i++) {
            previous = previous->next;
        }
        newNode->next = previous->next;
        previous->next = newNode;
    }
    size++;
    return true;
}`,
  'remove-start': `bool removeFromStart() {
    if (head == nullptr) return false;

    Node* removed = head;
    head = head->next;
    delete removed;
    size--;
    return true;
}`,
  'remove-end': `bool removeFromEnd() {
    if (head == nullptr) return false;

    if (head->next == nullptr) {
        delete head;
        head = nullptr;
    } else {
        Node* current = head;
        while (current->next->next != nullptr) {
            current = current->next;
        }
        delete current->next;
        current->next = nullptr;
    }
    size--;
    return true;
}`,
  'remove-index': `bool removeAtIndex(int index) {
    if (index < 0 || index >= size) return false;

    if (index == 0) return removeFromStart();

    Node* previous = head;
    for (int i = 0; i < index - 1; i++) {
        previous = previous->next;
    }
    Node* removed = previous->next;
    previous->next = removed->next;
    delete removed;
    size--;
    return true;
}`,
  'remove-value': `bool removeValue(int target) {
    Node* current = head;
    Node* previous = nullptr;

    while (current != nullptr) {
        if (current->value == target) {
            if (previous == nullptr) head = current->next;
            else previous->next = current->next;

            delete current;
            size--;
            return true;
        }
        previous = current;
        current = current->next;
    }
    return false;
}`,
  find: commonFind,
};

const doubleMethods = {
  'add-start': `void addAtStart(int value) {
    Node* newNode = new Node(value);
    newNode->next = head;

    if (head != nullptr) head->prev = newNode;
    head = newNode;
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node* newNode = new Node(value);

    if (head == nullptr) {
        head = newNode;
    } else {
        Node* current = head;
        while (current->next != nullptr) current = current->next;
        current->next = newNode;
        newNode->prev = current;
    }
    size++;
}`,
  'add-index': `bool addAtIndex(int value, int index) {
    if (index < 0 || index > size) return false;

    Node* newNode = new Node(value);
    if (index == 0) {
        newNode->next = head;
        if (head != nullptr) head->prev = newNode;
        head = newNode;
    } else {
        Node* previous = head;
        for (int i = 0; i < index - 1; i++) previous = previous->next;
        newNode->next = previous->next;
        newNode->prev = previous;
        if (previous->next != nullptr) previous->next->prev = newNode;
        previous->next = newNode;
    }
    size++;
    return true;
}`,
  'remove-start': `bool removeFromStart() {
    if (head == nullptr) return false;

    Node* removed = head;
    head = head->next;
    if (head != nullptr) head->prev = nullptr;
    delete removed;
    size--;
    return true;
}`,
  'remove-end': `bool removeFromEnd() {
    if (head == nullptr) return false;

    Node* current = head;
    while (current->next != nullptr) current = current->next;

    if (current->prev == nullptr) head = nullptr;
    else current->prev->next = nullptr;
    delete current;
    size--;
    return true;
}`,
  'remove-index': `bool removeAtIndex(int index) {
    if (index < 0 || index >= size) return false;

    Node* current = head;
    for (int i = 0; i < index; i++) current = current->next;

    if (current->prev != nullptr) current->prev->next = current->next;
    else head = current->next;
    if (current->next != nullptr) current->next->prev = current->prev;
    delete current;
    size--;
    return true;
}`,
  'remove-value': `bool removeValue(int target) {
    Node* current = head;
    while (current != nullptr && current->value != target) {
        current = current->next;
    }
    if (current == nullptr) return false;

    if (current->prev != nullptr) current->prev->next = current->next;
    else head = current->next;
    if (current->next != nullptr) current->next->prev = current->prev;
    delete current;
    size--;
    return true;
}`,
  find: commonFind,
};

const circularSimpleMethods = {
  'add-start': `void addAtStart(int value) {
    Node* newNode = new Node(value);
    if (head == nullptr) {
        head = newNode;
        newNode->next = newNode;
    } else {
        Node* last = head;
        while (last->next != head) last = last->next;
        newNode->next = head;
        last->next = newNode;
        head = newNode;
    }
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node* newNode = new Node(value);
    if (head == nullptr) {
        head = newNode;
        newNode->next = newNode;
    } else {
        Node* last = head;
        while (last->next != head) last = last->next;
        last->next = newNode;
        newNode->next = head;
    }
    size++;
}`,
  'add-index': `bool addAtIndex(int value, int index) {
    if (index < 0 || index > size) return false;
    if (index == 0) {
        addAtStart(value);
        return true;
    }

    Node* previous = head;
    for (int i = 0; i < index - 1; i++) previous = previous->next;
    Node* newNode = new Node(value);
    newNode->next = previous->next;
    previous->next = newNode;
    size++;
    return true;
}`,
  'remove-start': `bool removeFromStart() {
    if (head == nullptr) return false;

    if (head->next == head) {
        delete head;
        head = nullptr;
    } else {
        Node* last = head;
        while (last->next != head) last = last->next;
        Node* removed = head;
        head = head->next;
        last->next = head;
        delete removed;
    }
    size--;
    return true;
}`,
  'remove-end': `bool removeFromEnd() {
    if (head == nullptr) return false;
    if (head->next == head) return removeFromStart();

    Node* previous = head;
    while (previous->next->next != head) previous = previous->next;
    Node* removed = previous->next;
    previous->next = head;
    delete removed;
    size--;
    return true;
}`,
  'remove-index': `bool removeAtIndex(int index) {
    if (index < 0 || index >= size) return false;
    if (index == 0) return removeFromStart();

    Node* previous = head;
    for (int i = 0; i < index - 1; i++) previous = previous->next;
    Node* removed = previous->next;
    previous->next = removed->next;
    delete removed;
    size--;
    return true;
}`,
  'remove-value': `bool removeValue(int target) {
    if (head == nullptr) return false;

    Node* current = head;
    Node* previous = nullptr;
    do {
        if (current->value == target) {
            if (current == head) return removeFromStart();
            previous->next = current->next;
            delete current;
            size--;
            return true;
        }
        previous = current;
        current = current->next;
    } while (current != head);
    return false;
}`,
  find: `int find(int target) const {
    if (head == nullptr) return -1;

    Node* current = head;
    int index = 0;
    do {
        if (current->value == target) return index;
        current = current->next;
        index++;
    } while (current != head);
    return -1;
}`,
};

const circularDoubleMethods = {
  'add-start': `void addAtStart(int value) {
    Node* newNode = new Node(value);
    if (head == nullptr) {
        head = newNode;
        newNode->next = newNode;
        newNode->prev = newNode;
    } else {
        Node* last = head->prev;
        newNode->next = head;
        newNode->prev = last;
        last->next = newNode;
        head->prev = newNode;
        head = newNode;
    }
    size++;
}`,
  'add-end': `void addAtEnd(int value) {
    Node* newNode = new Node(value);
    if (head == nullptr) {
        head = newNode;
        newNode->next = newNode;
        newNode->prev = newNode;
    } else {
        Node* last = head->prev;
        newNode->prev = last;
        newNode->next = head;
        last->next = newNode;
        head->prev = newNode;
    }
    size++;
}`,
  'add-index': `bool addAtIndex(int value, int index) {
    if (index < 0 || index > size) return false;
    if (index == 0) {
        addAtStart(value);
        return true;
    }
    if (index == size) {
        addAtEnd(value);
        return true;
    }

    Node* current = head;
    for (int i = 0; i < index; i++) current = current->next;
    Node* newNode = new Node(value);
    newNode->prev = current->prev;
    newNode->next = current;
    current->prev->next = newNode;
    current->prev = newNode;
    size++;
    return true;
}`,
  'remove-start': `bool removeFromStart() {
    if (head == nullptr) return false;

    if (head->next == head) {
        delete head;
        head = nullptr;
    } else {
        Node* removed = head;
        Node* last = head->prev;
        head = head->next;
        head->prev = last;
        last->next = head;
        delete removed;
    }
    size--;
    return true;
}`,
  'remove-end': `bool removeFromEnd() {
    if (head == nullptr) return false;
    if (head->next == head) return removeFromStart();

    Node* removed = head->prev;
    Node* newLast = removed->prev;
    newLast->next = head;
    head->prev = newLast;
    delete removed;
    size--;
    return true;
}`,
  'remove-index': `bool removeAtIndex(int index) {
    if (index < 0 || index >= size) return false;
    if (index == 0) return removeFromStart();

    Node* current = head;
    for (int i = 0; i < index; i++) current = current->next;
    current->prev->next = current->next;
    current->next->prev = current->prev;
    delete current;
    size--;
    return true;
}`,
  'remove-value': `bool removeValue(int target) {
    if (head == nullptr) return false;

    Node* current = head;
    do {
        if (current->value == target) {
            if (current == head) return removeFromStart();
            current->prev->next = current->next;
            current->next->prev = current->prev;
            delete current;
            size--;
            return true;
        }
        current = current->next;
    } while (current != head);
    return false;
}`,
  find: `int find(int target) const {
    if (head == nullptr) return -1;

    Node* current = head;
    int index = 0;
    do {
        if (current->value == target) return index;
        current = current->next;
        index++;
    } while (current != head);
    return -1;
}`,
};

function clearHelper(circular) {
  if (!circular) return `void clearNodes() {
    while (head != nullptr) {
        Node* removed = head;
        head = head->next;
        delete removed;
    }
    size = 0;
}`;
  return `void clearNodes() {
    if (head == nullptr) return;
    Node* current = head->next;
    while (current != head) {
        Node* removed = current;
        current = current->next;
        delete removed;
    }
    delete head;
    head = nullptr;
    size = 0;
}`;
}

function wrapList({ className, doubly, circular, method, helpers = [] }) {
  return `class ${className} {
public:
    struct Node {
        int value;
        Node* next;
${doubly ? '        Node* prev;\n' : ''}
        explicit Node(int value)
            : value(value), next(nullptr)${doubly ? ', prev(nullptr)' : ''} {}
    };

    Node* head = nullptr;
    int size = 0;

    ~${className}() {
        clearNodes();
    }

    // Start of the selected operation
${indent(method)}
    // End of the selected operation
${helpers.length ? `\n    // Auxiliary methods used by the selected operation\n${helpers.map(indent).join('\n\n')}` : ''}

private:
${indent(clearHelper(circular))}
};`;
}

const configurations = {
  'lista-simple': { className: 'SinglyLinkedList', doubly: false, circular: false, methods: simpleMethods },
  'lista-doble': { className: 'DoublyLinkedList', doubly: true, circular: false, methods: doubleMethods },
  'lista-circular-simple': { className: 'CircularSinglyLinkedList', doubly: false, circular: true, methods: circularSimpleMethods },
  'lista-circular-doble': { className: 'CircularDoublyLinkedList', doubly: true, circular: true, methods: circularDoubleMethods },
};

export function getLinkedListCpp(algorithmId, actionId) {
  const configuration = configurations[algorithmId];
  const method = configuration?.methods[actionId];
  if (!configuration || !method) return null;
  const dependencyNames = {
    'add-index': algorithmId === 'lista-circular-doble' ? ['add-start', 'add-end'] : algorithmId === 'lista-circular-simple' ? ['add-start'] : [],
    'remove-end': algorithmId.includes('circular') ? ['remove-start'] : [],
    'remove-index': algorithmId.includes('circular') || algorithmId === 'lista-simple' ? ['remove-start'] : [],
    'remove-value': algorithmId.includes('circular') ? ['remove-start'] : [],
  }[actionId] ?? [];
  const helpers = dependencyNames.map(name => configuration.methods[name]);
  return wrapList({ ...configuration, circular: algorithmId.includes('circular'), method, helpers });
}
