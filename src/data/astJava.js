const nodeClass = `static class Node {
        String label;
        Node left;
        Node right;

        Node(String label) {
            this.label = label;
        }

        Node(String label, Node left, Node right) {
            this.label = label;
            this.left = left;
            this.right = right;
        }
    }`;

const parserHelpers = `Node parseExpression() {
        Node expression = parseTerm();
        skipSpaces();
        while (current() == '+' || current() == '-') {
            char operator = current();
            position++;
            Node right = parseTerm();
            expression = new Node(String.valueOf(operator), expression, right);
            skipSpaces();
        }
        return expression;
    }

    Node parseTerm() {
        Node term = parseFactor();
        skipSpaces();
        while (current() == '*' || current() == '/') {
            char operator = current();
            position++;
            Node right = parseFactor();
            term = new Node(String.valueOf(operator), term, right);
            skipSpaces();
        }
        return term;
    }

    Node parseFactor() {
        skipSpaces();
        if (current() == '(') {
            position++;
            Node expression = parseExpression();
            expect(')');
            return expression;
        }
        if (Character.isDigit(current())) {
            return new Node(readNumber());
        }
        if (Character.isLetter(current()) || current() == '_') {
            return new Node(readIdentifier());
        }
        throw new IllegalArgumentException("Token no valido");
    }

    String readIdentifier() {
        skipSpaces();
        int start = position;
        if (!Character.isLetter(current()) && current() != '_') {
            throw new IllegalArgumentException("Falta un identificador");
        }
        position++;
        while (Character.isLetterOrDigit(current()) || current() == '_') {
            position++;
        }
        return source.substring(start, position);
    }

    String readNumber() {
        skipSpaces();
        int start = position;
        while (Character.isDigit(current())) {
            position++;
        }
        return source.substring(start, position);
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

const operations = {
  'ast-build': `Node buildAst(String code) {
        source = code;
        position = 0;

        Node target = new Node(readIdentifier());
        expect('=');
        Node value = parseExpression();

        skipSpaces();
        if (current() == ';') {
            position++;
        }
        skipSpaces();
        if (position != source.length()) {
            throw new IllegalArgumentException("Contenido inesperado");
        }

        root = new Node("ASSIGN", target, value);
        return root;
    }`,
  'ast-preorder': `void showPreorder() {
        preorder(root);
    }`,
  'ast-clear': `void clear() {
        root = null;
    }`,
};

const actionHelpers = {
  'ast-build': parserHelpers,
  'ast-preorder': `void preorder(Node node) {
        if (node == null) {
            return;
        }
        System.out.println(node.label);
        preorder(node.left);
        preorder(node.right);
    }`,
  'ast-clear': '',
};

function classMember(source) {
  return `    ${source}`;
}

export function getAstJava(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  const helpers = actionHelpers[actionId];

  return `class SimpleAst {
    ${nodeClass}

    Node root = null;
    String source = "";
    int position = 0;

    // Start of the selected operation
${classMember(operation)}
    // End of the selected operation
${helpers ? `
    // Helpers used by the selected operation
${classMember(helpers)}` : ''}
}`;
}
