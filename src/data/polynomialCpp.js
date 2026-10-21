const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const insert = (listName) => `void insert${listName}(int coefficient, int exponent) {
    insertTerm(${listName}, coefficient, exponent);
    clearList(C);
}`;
const remove = (listName) => `bool remove${listName}(int exponent) {
    bool removed = removeTerm(${listName}, exponent);
    if (removed) clearList(C);
    return removed;
}`;

const operations = {
  'poly-insert-a': insert('A'),
  'poly-insert-b': insert('B'),
  'poly-remove-a': remove('A'),
  'poly-remove-b': remove('B'),
  'poly-add': `void sumPolynomials() {
    validateSum(A, B);
    clearList(C);
    C = add(A, B);
}`,
  'poly-clear-result': `void clearResult() {
    clearList(C);
}`,
};

const insertTerm = `void insertTerm(Node*& head, int coefficient, int exponent) {
    if (exponent < 0) throw std::invalid_argument("Exponent must be nonnegative");
    if (coefficient == 0) return;
    Node* current = head;
    Node* previous = nullptr;
    while (current != nullptr && current->exponent > exponent) {
        previous = current;
        current = current->next;
    }
    if (current != nullptr && current->exponent == exponent) {
        long long combined = static_cast<long long>(current->coefficient) + coefficient;
        if (combined < -2147483648LL || combined > 2147483647LL) {
            throw std::overflow_error("Coefficient exceeds the 32-bit range");
        }
        current->coefficient += coefficient;
        if (current->coefficient == 0) removeTerm(head, exponent);
        return;
    }
    Node* newNode = new Node(coefficient, exponent);
    newNode->next = current;
    if (previous == nullptr) head = newNode;
    else previous->next = newNode;
}`;

const removeTerm = `bool removeTerm(Node*& head, int exponent) {
    Node* current = head;
    Node* previous = nullptr;
    while (current != nullptr && current->exponent != exponent) {
        previous = current;
        current = current->next;
    }
    if (current == nullptr) return false;
    if (previous == nullptr) head = current->next;
    else previous->next = current->next;
    delete current;
    return true;
}`;

const add = `Node* add(Node* first, Node* second) {
    validateSum(first, second);
    Node dummy(0, 0);
    Node* end = &dummy;
    Node* p = first;
    Node* q = second;
    while (p != nullptr && q != nullptr) {
        if (p->exponent == q->exponent) {
            int coefficient = p->coefficient + q->coefficient;
            if (coefficient != 0) {
                end->next = new Node(coefficient, p->exponent);
                end = end->next;
            }
            p = p->next;
            q = q->next;
        } else if (p->exponent > q->exponent) {
            end->next = new Node(p->coefficient, p->exponent);
            end = end->next;
            p = p->next;
        } else {
            end->next = new Node(q->coefficient, q->exponent);
            end = end->next;
            q = q->next;
        }
    }
    while (p != nullptr) {
        end->next = new Node(p->coefficient, p->exponent);
        end = end->next;
        p = p->next;
    }
    while (q != nullptr) {
        end->next = new Node(q->coefficient, q->exponent);
        end = end->next;
        q = q->next;
    }
    return dummy.next;
}`;

const validateSum = `void validateSum(const Node* first, const Node* second) const {
    while (first != nullptr && second != nullptr) {
        if (first->exponent == second->exponent) {
            long long combined = static_cast<long long>(first->coefficient) + second->coefficient;
            if (combined < -2147483648LL || combined > 2147483647LL) {
                throw std::overflow_error("Coefficient exceeds the 32-bit range");
            }
            first = first->next;
            second = second->next;
        } else if (first->exponent > second->exponent) first = first->next;
        else second = second->next;
    }
}`;

const clearList = `void clearList(Node*& head) {
    while (head != nullptr) {
        Node* removed = head;
        head = head->next;
        delete removed;
    }
}`;

export function getPolynomialCpp(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  const helpers = actionId.startsWith('poly-insert')
    ? [insertTerm, removeTerm, clearList]
    : actionId.startsWith('poly-remove')
      ? [removeTerm, clearList]
      : actionId === 'poly-add'
        ? [validateSum, add, clearList]
        : [clearList];
  return `#include <stdexcept>

class LinkedPolynomial {
public:
    struct Node {
        int coefficient;
        int exponent;
        Node* next;
        Node(int coefficient, int exponent)
            : coefficient(coefficient), exponent(exponent), next(nullptr) {}
    };
    Node* A = nullptr;
    Node* B = nullptr;
    Node* C = nullptr;

    explicit LinkedPolynomial(bool loadExample = true) {
        if (!loadExample) return;
        A = new Node(3, 14);
        A->next = new Node(2, 8);
        A->next->next = new Node(1, 0);
        B = new Node(8, 14);
        B->next = new Node(-3, 10);
        B->next->next = new Node(10, 6);
    }

    ~LinkedPolynomial() {
        clearList(A);
        clearList(B);
        clearList(C);
    }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Pointer helpers used above
${helpers.map(indent).join('\n\n')}
};`;
}
