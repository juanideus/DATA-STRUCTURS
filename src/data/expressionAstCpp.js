const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const expressionOperations = {
  'set-expression': `Node* buildExpressionTree(const std::string& expression) {
    destroy(root);
    root = nullptr;
    Node** nodes = new Node*[CAPACITY]{};
    char* operators = new char[CAPACITY]{};
    int nodeTop = 0;
    int operatorTop = 0;

    for (int i = 0; i < static_cast<int>(expression.length()); i++) {
        char token = expression[i];
        if (token == ' ') continue;
        if (token >= '0' && token <= '9') {
            int number = 0;
            while (i < static_cast<int>(expression.length())
                    && expression[i] >= '0' && expression[i] <= '9') {
                number = number * 10 + expression[i] - '0';
                i++;
            }
            i--;
            nodes[nodeTop++] = new Node(number);
        } else if (token == '(') {
            operators[operatorTop++] = token;
        } else if (token == ')') {
            while (operatorTop > 0 && operators[operatorTop - 1] != '(') {
                if (!applyTop(nodes, nodeTop, operators, operatorTop)) {
                    releaseStacks(nodes, nodeTop, operators);
                    return nullptr;
                }
            }
            if (operatorTop == 0) {
                releaseStacks(nodes, nodeTop, operators);
                return nullptr;
            }
            operatorTop--;
        } else {
            while (operatorTop > 0 && operators[operatorTop - 1] != '('
                    && precedence(operators[operatorTop - 1]) >= precedence(token)) {
                if (!applyTop(nodes, nodeTop, operators, operatorTop)) {
                    releaseStacks(nodes, nodeTop, operators);
                    return nullptr;
                }
            }
            operators[operatorTop++] = token;
        }
    }
    while (operatorTop > 0) {
        if (!applyTop(nodes, nodeTop, operators, operatorTop)) {
            releaseStacks(nodes, nodeTop, operators);
            return nullptr;
        }
    }
    if (nodeTop != 1) {
        releaseStacks(nodes, nodeTop, operators);
        return nullptr;
    }
    root = nodes[0];
    delete[] nodes;
    delete[] operators;
    return root;
}`,
  evaluate: `int evaluate(const Node* node) const {
    if (node == nullptr) return 0;
    if (node->isNumber) return node->number;
    int left = evaluate(node->left);
    int right = evaluate(node->right);
    if (node->operation == '+') return left + right;
    if (node->operation == '-') return left - right;
    if (node->operation == '*') return left * right;
    return right == 0 ? 0 : left / right;
}`,
  preorder: `void preorder(const Node* node) {
    if (node == nullptr) return;
    lastVisited = node->isNumber ? node->number : node->operation;
    preorder(node->left);
    preorder(node->right);
}`,
  postorder: `void postorder(const Node* node) {
    if (node == nullptr) return;
    postorder(node->left);
    postorder(node->right);
    lastVisited = node->isNumber ? node->number : node->operation;
}`,
};

const expressionHelpers = `int precedence(char operation) const {
    if (operation == '+' || operation == '-') return 1;
    if (operation == '*' || operation == '/') return 2;
    return 0;
}

bool applyTop(Node** nodes, int& nodeTop, char* operators, int& operatorTop) {
    if (nodeTop < 2 || operatorTop == 0) return false;
    Node* right = nodes[--nodeTop];
    Node* left = nodes[--nodeTop];
    nodes[nodeTop++] = new Node(operators[--operatorTop], left, right);
    return true;
}

void releaseStacks(Node** nodes, int nodeTop, char* operators) {
    for (int i = 0; i < nodeTop; i++) destroy(nodes[i]);
    delete[] nodes;
    delete[] operators;
}`;

function expressionCpp(actionId) {
  const operation = expressionOperations[actionId];
  if (!operation) return null;
  return `class ExpressionTree {
public:
    static const int CAPACITY = 128;
    struct Node {
        bool isNumber;
        int number;
        char operation;
        Node* left;
        Node* right;
        explicit Node(int number)
            : isNumber(true), number(number), operation(0), left(nullptr), right(nullptr) {}
        Node(char operation, Node* left, Node* right)
            : isNumber(false), number(0), operation(operation), left(left), right(right) {}
    };
    Node* root = nullptr;
    int lastVisited = 0;

    ~ExpressionTree() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Dynamically allocated stack helpers used above
${indent(expressionHelpers)}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        destroy(node->left);
        destroy(node->right);
        delete node;
    }
};`;
}

const astOperations = {
  'ast-build': `Node* buildAst(const std::string& code) {
    destroy(root);
    root = nullptr;
    source = code;
    position = 0;
    valid = true;

    Node* target = new Node(readIdentifier());
    if (!valid || !expect('=')) {
        delete target;
        return nullptr;
    }
    Node* value = parseExpression();
    skipSpaces();
    if (current() == ';') position++;
    skipSpaces();
    if (!valid || value == nullptr || position != static_cast<int>(source.length())) {
        delete target;
        destroy(value);
        return nullptr;
    }
    root = new Node("ASSIGN", target, value);
    return root;
}`,
  'ast-preorder': `void preorder(const Node* node) {
    if (node == nullptr) return;
    lastVisited = node->label;
    preorder(node->left);
    preorder(node->right);
}`,
  'ast-clear': `void clear() {
    destroy(root);
    root = nullptr;
}`,
};

const astParser = `Node* parseExpression() {
    Node* expression = parseTerm();
    skipSpaces();
    while (current() == '+' || current() == '-') {
        char operation = current();
        position++;
        Node* right = parseTerm();
        expression = new Node(std::string(1, operation), expression, right);
        skipSpaces();
    }
    return expression;
}

Node* parseTerm() {
    Node* term = parseFactor();
    skipSpaces();
    while (current() == '*' || current() == '/') {
        char operation = current();
        position++;
        Node* right = parseFactor();
        term = new Node(std::string(1, operation), term, right);
        skipSpaces();
    }
    return term;
}

Node* parseFactor() {
    skipSpaces();
    if (current() == '(') {
        position++;
        Node* expression = parseExpression();
        if (!expect(')')) valid = false;
        return expression;
    }
    if (current() >= '0' && current() <= '9') return new Node(readNumber());
    if ((current() >= 'A' && current() <= 'Z')
            || (current() >= 'a' && current() <= 'z') || current() == '_') {
        return new Node(readIdentifier());
    }
    valid = false;
    return nullptr;
}

std::string readIdentifier() {
    skipSpaces();
    int start = position;
    char token = current();
    if (!((token >= 'A' && token <= 'Z') || (token >= 'a' && token <= 'z') || token == '_')) {
        valid = false;
        return "";
    }
    position++;
    while (true) {
        token = current();
        if (!((token >= 'A' && token <= 'Z') || (token >= 'a' && token <= 'z')
                || (token >= '0' && token <= '9') || token == '_')) break;
        position++;
    }
    return source.substr(start, position - start);
}

std::string readNumber() {
    skipSpaces();
    int start = position;
    while (current() >= '0' && current() <= '9') position++;
    return source.substr(start, position - start);
}

bool expect(char expected) {
    skipSpaces();
    if (current() != expected) {
        valid = false;
        return false;
    }
    position++;
    return true;
}

void skipSpaces() {
    while (position < static_cast<int>(source.length()) && source[position] == ' ') position++;
}

char current() const {
    return position < static_cast<int>(source.length()) ? source[position] : '\\0';
}`;

function astCpp(actionId) {
  const operation = astOperations[actionId];
  if (!operation) return null;
  return `class AbstractSyntaxTree {
public:
    struct Node {
        std::string label;
        Node* left;
        Node* right;
        explicit Node(const std::string& label) : label(label), left(nullptr), right(nullptr) {}
        Node(const std::string& label, Node* left, Node* right)
            : label(label), left(left), right(right) {}
    };
    Node* root = nullptr;
    std::string source;
    std::string lastVisited;
    int position = 0;
    bool valid = true;

    ~AbstractSyntaxTree() { destroy(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Recursive-descent parser used to build the AST
${indent(astParser)}

private:
    void destroy(Node* node) {
        if (node == nullptr) return;
        destroy(node->left);
        destroy(node->right);
        delete node;
    }
};`;
}

export function getExpressionAstCpp(algorithmId, actionId) {
  if (algorithmId === 'expression-tree') return expressionCpp(actionId);
  if (algorithmId === 'ast') return astCpp(actionId);
  return null;
}
