const nodeAndFields = `class LinkedPolynomial {
    static class Node {
        int coefficient;
        int exponent;
        Node next;

        Node(int coefficient, int exponent) {
            this.coefficient = coefficient;
            this.exponent = exponent;
        }

        Node(int coefficient, int exponent, Node next) {
            this.coefficient = coefficient;
            this.exponent = exponent;
            this.next = next;
        }
    }

    Node A = new Node(3, 14,
        new Node(2, 8, new Node(1, 0)));
    Node B = new Node(8, 14,
        new Node(-3, 10, new Node(10, 6)));
    Node C = null;`;

const insertHelper = `Node insertOrdered(Node head, int coefficient, int exponent) {
        if (coefficient == 0) {
            return head;
        }
        Node previous = null;
        Node current = head;
        while (current != null && current.exponent > exponent) {
            previous = current;
            current = current.next;
        }
        if (current != null && current.exponent == exponent) {
            current.coefficient += coefficient;
            if (current.coefficient == 0) {
                if (previous == null) {
                    head = current.next;
                } else {
                    previous.next = current.next;
                }
            }
            return head;
        }
        Node newNode = new Node(coefficient, exponent);
        newNode.next = current;
        if (previous == null) {
            return newNode;
        }
        previous.next = newNode;
        return head;
    }`;

const removeHelper = `Node removeExponent(Node head, int exponent) {
        Node previous = null;
        Node current = head;
        while (current != null && current.exponent != exponent) {
            previous = current;
            current = current.next;
        }
        if (current == null) {
            return head;
        }
        if (previous == null) {
            return current.next;
        }
        previous.next = current.next;
        return head;
    }`;

const addHelper = `Node add(Node first, Node second) {
        Node dummy = new Node(0, 0);
        Node end = dummy;
        Node p = first;
        Node q = second;

        while (p != null && q != null) {
            if (p.exponent == q.exponent) {
                int coefficient = p.coefficient + q.coefficient;
                if (coefficient != 0) {
                    end.next = new Node(coefficient, p.exponent);
                    end = end.next;
                }
                p = p.next;
                q = q.next;
            } else if (p.exponent > q.exponent) {
                end.next = new Node(p.coefficient, p.exponent);
                end = end.next;
                p = p.next;
            } else {
                end.next = new Node(q.coefficient, q.exponent);
                end = end.next;
                q = q.next;
            }
        }
        while (p != null) {
            end.next = new Node(p.coefficient, p.exponent);
            end = end.next;
            p = p.next;
        }
        while (q != null) {
            end.next = new Node(q.coefficient, q.exponent);
            end = end.next;
            q = q.next;
        }
        return dummy.next;
    }`;

const operations = {
  'poly-insert-a': `void insertInA(int coefficient, int exponent) {
        A = insertOrdered(A, coefficient, exponent);
        C = null;
    }`,
  'poly-insert-b': `void insertInB(int coefficient, int exponent) {
        B = insertOrdered(B, coefficient, exponent);
        C = null;
    }`,
  'poly-remove-a': `void removeFromA(int exponent) {
        A = removeExponent(A, exponent);
        C = null;
    }`,
  'poly-remove-b': `void removeFromB(int exponent) {
        B = removeExponent(B, exponent);
        C = null;
    }`,
  'poly-add': `void sumPolynomials() {
        C = add(A, B);
    }`,
  'poly-clear-result': `void clearResult() {
        C = null;
    }`,
};

const helpers = {
  'poly-insert-a': insertHelper,
  'poly-insert-b': insertHelper,
  'poly-remove-a': removeHelper,
  'poly-remove-b': removeHelper,
  'poly-add': addHelper,
  'poly-clear-result': '',
};

function classMember(source) {
  return `    ${source}`;
}

export function getPolynomialJava(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  return `${nodeAndFields}

    // Start of the selected operation
${classMember(operation)}
    // End of the selected operation
${helpers[actionId] ? `
    // Helper used by the selected operation
${classMember(helpers[actionId])}` : ''}
}`;
}
