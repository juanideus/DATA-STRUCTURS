const indent = source => source.split('\n').map(line => (line ? `    ${line}` : '')).join('\n');

const operations = {
  'glist-build': `Node* build(const std::string& text) {
    releaseHeader(root);
    root = nullptr;
    source = text;
    position = 0;
    valid = true;
    root = parseList();
    skipSpaces();
    if (!valid || position != static_cast<int>(source.length())) {
        releaseHeader(root);
        root = nullptr;
    }
    return root;
}`,
  'glist-head': `Node* head() const {
    return root == nullptr ? nullptr : root->link;
}`,
  'glist-tail': `Node* tail() const {
    if (root == nullptr || root->link == nullptr) return nullptr;
    return root->link->link;
}`,
  'glist-length': `int length() const {
    int count = 0;
    Node* current = root == nullptr ? nullptr : root->link;
    while (current != nullptr) {
        count++;
        current = current->link;
    }
    return count;
}`,
  'glist-depth': `int depth() const {
    return root == nullptr ? 0 : depthOf(root);
}`,
  'glist-share': `Node* shareRoot() {
    if (root != nullptr) root->ref++;
    return root;
}`,
  'glist-release': `void releaseRoot() {
    if (root == nullptr) return;
    root->ref--;
    if (root->ref == 0) {
        destroyElements(root);
        delete root;
        root = nullptr;
    }
}`,
};

const parser = `Node* parseList() {
    if (!expect('(')) return nullptr;
    Node* header = makeReference();
    Node* last = nullptr;
    skipSpaces();
    if (current() == ')') {
        position++;
        return header;
    }
    while (valid) {
        Node* element = parseElement();
        if (element == nullptr) break;
        if (last == nullptr) header->link = element;
        else last->link = element;
        last = element;
        skipSpaces();
        if (current() == ',') {
            position++;
            continue;
        }
        if (!expect(')')) break;
        return header;
    }
    releaseHeader(header);
    return nullptr;
}

Node* parseElement() {
    skipSpaces();
    if (current() == '(') return makeSublist(parseList());
    char atom = current();
    if (!((atom >= 'a' && atom <= 'z') || (atom >= '0' && atom <= '9'))) {
        valid = false;
        return nullptr;
    }
    position++;
    return makeAtom(atom);
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

const helpers = `Node* makeAtom(char value) {
    Node* node = new Node();
    node->tag = ATOM;
    node->data = value;
    return node;
}

Node* makeSublist(Node* child) {
    if (child == nullptr) return nullptr;
    Node* node = new Node();
    node->tag = SUBLIST;
    node->dlink = child;
    return node;
}

Node* makeReference() {
    Node* node = new Node();
    node->tag = REFERENCE;
    node->ref = 1;
    return node;
}

int depthOf(const Node* header) const {
    int maximum = 1;
    const Node* current = header->link;
    while (current != nullptr) {
        if (current->tag == SUBLIST) {
            int childDepth = 1 + depthOf(current->dlink);
            if (childDepth > maximum) maximum = childDepth;
        }
        current = current->link;
    }
    return maximum;
}

void releaseHeader(Node* header) {
    if (header == nullptr) return;
    header->ref--;
    if (header->ref > 0) return;
    destroyElements(header);
    delete header;
}

void destroyElements(Node* header) {
    Node* current = header->link;
    while (current != nullptr) {
        Node* next = current->link;
        if (current->tag == SUBLIST) releaseHeader(current->dlink);
        delete current;
        current = next;
    }
}`;

export function getGeneralizedListCpp(actionId) {
  const operation = operations[actionId];
  if (!operation) return null;
  return `class GeneralizedList {
public:
    static const int ATOM = 0;
    static const int SUBLIST = 1;
    static const int REFERENCE = 2;
    struct Node {
        int tag = ATOM;
        char data = '\\0';
        Node* dlink = nullptr;
        int ref = 0;
        Node* link = nullptr;
    };
    Node* root = nullptr;
    std::string source;
    int position = 0;
    bool valid = true;

    ~GeneralizedList() { releaseHeader(root); }

    // Start of the selected operation
${indent(operation)}
    // End of the selected operation

    // Recursive parser and pointer helpers
${indent(parser)}

${indent(helpers)}
};`;
}
