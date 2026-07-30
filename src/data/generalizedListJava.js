const nodeAndFields = `class GeneralizedList {
    static final int ATOM = 0;
    static final int SUBLIST = 1;
    static final int REFERENCE = 2;
    static final char OPEN = 40;
    static final char CLOSE = 41;
    static final char COMMA = 44;

    static class Node {
        int tag;
        char data;
        Node dlink;
        int ref;
        Node link;

        static Node atomNode(char value) {
            Node node = new Node();
            node.tag = ATOM;
            node.data = value;
            return node;
        }

        static Node sublistNode(Node child) {
            Node node = new Node();
            node.tag = SUBLIST;
            node.dlink = child;
            return node;
        }

        static Node referenceNode() {
            Node node = new Node();
            node.tag = REFERENCE;
            node.ref = 1;
            return node;
        }
    }

    Node root = null;
    String source = "";
    int position = 0;`;

const parserHelpers = `Node parseList() {
        expect(OPEN);
        Node header = Node.referenceNode();
        Node last = null;
        skipSpaces();
        if (current() == CLOSE) {
            position++;
            return header;
        }
        while (true) {
            Node element = parseElement();
            if (last == null) {
                header.link = element;
            } else {
                last.link = element;
            }
            last = element;
            skipSpaces();
            if (current() == COMMA) {
                position++;
                continue;
            }
            expect(CLOSE);
            return header;
        }
    }

    Node parseElement() {
        skipSpaces();
        if (current() == OPEN) {
            return Node.sublistNode(parseList());
        }
        return Node.atomNode(readAtom());
    }

    char readAtom() {
        skipSpaces();
        char atom = current();
        if (!Character.isLowerCase(atom) && !Character.isDigit(atom)) {
            throw new IllegalArgumentException("Falta un atomo");
        }
        position++;
        return atom;
    }

    void expect(char expected) {
        skipSpaces();
        if (current() != expected) {
            throw new IllegalArgumentException("Falta " + expected);
        }
        position++;
    }

    void skipSpaces() {
        while (position < source.length()
                && Character.isWhitespace(source.charAt(position))) {
            position++;
        }
    }

    char current() {
        if (position >= source.length()) {
            return '\\0';
        }
        return source.charAt(position);
    }`;

const depthHelper = `int depthOf(Node header) {
        int maximum = 1;
        Node current = header.link;
        while (current != null) {
            if (current.tag == SUBLIST) {
                maximum = Math.max(maximum, 1 + depthOf(current.dlink));
            }
            current = current.link;
        }
        return maximum;
    }`;

const operations = {
  'glist-build': `Node build(String text) {
        source = text;
        position = 0;
        root = parseList();
        skipSpaces();
        if (position != source.length()) {
            throw new IllegalArgumentException("Contenido inesperado");
        }
        return root;
    }`,
  'glist-head': `Node head() {
        if (root == null || root.link == null) {
            return null;
        }
        return root.link;
    }`,
  'glist-tail': `Node tail() {
        if (root == null || root.link == null) {
            return null;
        }
        return root.link.link;
    }`,
  'glist-length': `int length() {
        int count = 0;
        Node current = root == null ? null : root.link;
        while (current != null) {
            count++;
            current = current.link;
        }
        return count;
    }`,
  'glist-depth': `int depth() {
        if (root == null) {
            return 0;
        }
        return depthOf(root);
    }`,
  'glist-share': `void shareRoot() {
        if (root != null) {
            root.ref++;
        }
    }`,
  'glist-release': `void releaseRoot() {
        if (root == null) {
            return;
        }
        root.ref--;
        if (root.ref == 0) {
            root = null;
        }
    }`,
};

const helpers = {
  'glist-build': parserHelpers,
  'glist-head': '',
  'glist-tail': '',
  'glist-length': '',
  'glist-depth': depthHelper,
  'glist-share': '',
  'glist-release': '',
};

function classMember(source) {
  return `    ${source}`;
}

export function getGeneralizedListJava(actionId) {
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
