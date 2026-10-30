// Resolve semantic red-black events against the actual displayed source. A
// missing instruction stays unmapped rather than inventing a line progression.
const normalize = line => String(line)
  .replace(/->/g, '.')
  .replace(/\bNode\s*\*/g, 'Node')
  .replace(/\bbool\b/g, 'boolean')
  .replace(/\bnullptr\b/g, 'null')
  .trim();
const compact = line => normalize(line).replace(/\s+/g, '');

function closingBrace(lines, lineIndex, column) {
  let depth = 0;
  for (let index = lineIndex; index < lines.length; index++) {
    const text = lines[index].text;
    for (let offset = index === lineIndex ? column : 0; offset < text.length; offset++) {
      if (text[offset] === '{') depth++;
      if (text[offset] === '}' && --depth === 0) return { index, column: offset };
    }
  }
  return null;
}

function sourceMethod(lines, name, overload = 'first') {
  const declaration = new RegExp(`^(?:public\\s+)?(?:boolean|void|Node|java\\.util\\.List<Integer>)\\s+${name}\\s*\\(`);
  const parameter = overload === 'node' ? new RegExp(`\\b${name}\\s*\\(\\s*Node\\b`)
    : overload === 'wrapper' ? new RegExp(`\\b${name}\\s*\\(\\s*\\)`)
      : null;
  const start = lines.findIndex(line => declaration.test(line.text) && (!parameter || parameter.test(line.text)));
  if (start < 0) return [];
  const opening = lines[start].text.indexOf('{');
  if (opening < 0) return [];
  const end = closingBrace(lines, start, opening);
  return end ? lines.slice(start, end.index + 1) : [];
}

function sideBranches(method, condition) {
  const start = method.findIndex(line => line.compact === condition);
  if (start < 0) return { left: [], right: [] };
  const closing = closingBrace(method, start, method[start].text.indexOf('{'));
  if (!closing) return { left: [], right: [] };
  const elseOpening = method[closing.index].text.indexOf('{', closing.column + 1);
  if (elseOpening < 0 || !/else/.test(method[closing.index].text.slice(closing.column + 1, elseOpening))) {
    return { left: [], right: [] };
  }
  const end = closingBrace(method, closing.index, elseOpening);
  return {
    left: method.slice(start + 1, closing.index),
    right: end ? method.slice(closing.index + 1, end.index) : [],
  };
}

export function createRedBlackCodeMapper(code) {
  const lines = String(code).split('\n').map((line, index) => ({
    index, text: normalize(line), compact: compact(line),
  }));
  const methods = new Map();
  const method = (name, overload = 'first') => {
    const key = `${name}:${overload}`;
    if (!methods.has(key)) methods.set(key, sourceMethod(lines, name, overload));
    return methods.get(key);
  };
  const selectedFind = method('find').length ? 'find' : 'search';
  const branches = {
    fixAfterInsert: sideBranches(method('fixAfterInsert'), 'if(parent==grandparent.left){'),
    fixAfterDelete: sideBranches(method('fixAfterDelete'), 'if(node==node.parent.left){'),
  };
  const findLine = (scope, text, occurrence = 0) => {
    const expected = compact(text);
    return scope.filter(line => line.compact === expected)[occurrence]?.index ?? null;
  };
  const declaration = name => method(name)[0]?.index ?? null;

  return event => {
    if (!event || typeof event.codeKey !== 'string') return null;
    const { codeKey, action, side, reason } = event;
    const operation = action === 'find' ? selectedFind : action;
    const isTraversal = ['preorder', 'inorder', 'postorder'].includes(action);
    if (isTraversal) {
      const helper = method(action, 'node');
      const wrapper = method(action, 'wrapper');
      if (codeKey === 'start') return (wrapper[0] ?? helper[0])?.index ?? null;
      if (codeKey === 'done') {
        if (wrapper.length) return findLine(wrapper, 'return result;');
        if (event.subjectValue === null) return findLine(helper, 'if (node == nil) return;');
        return findLine(helper, action === 'postorder'
          ? 'lastVisited = node.value;'
          : `${action}(node.right);`);
      }
      switch (codeKey) {
        case 'traversal-enter':
        case 'traversal-empty':
          return findLine(helper, 'if (node == nil) return;');
        case 'traversal-left':
          return findLine(helper, `${action}(node.left, result);`)
            ?? findLine(helper, `${action}(node.left);`);
        case 'traversal-right':
          return findLine(helper, `${action}(node.right, result);`)
            ?? findLine(helper, `${action}(node.right);`);
        case 'traversal-emit':
          return findLine(helper, 'result.add(node.value);')
            ?? findLine(helper, 'lastVisited = node.value;');
        default:
          return null;
      }
    }
    if (codeKey === 'start') return declaration(operation);
    if (codeKey === 'done') {
      if (action === 'find') {
        return findLine(method(operation), operation === 'find'
          ? 'return findNode(target) != nil;'
          : 'return result == nil ? nullptr : result;');
      }
      if (event.succeeded) return findLine(method(operation), 'return true;');
      return findLine(method(operation), action === 'insert'
        ? 'if (value == current.value) return false;'
        : 'if (node == nil) return false;');
    }

    const scopeName = event.sourceMethod;
    const scope = method(scopeName);
    if (!scope.length) return null;
    const sided = branches[scopeName]?.[side] ?? [];
    const instruction = text => findLine(scope, text);
    const branchInstruction = (text, occurrence = 0) => findLine(sided, text, occurrence);

    switch (codeKey) {
      case 'search-visit':
      case 'search-compare':
        return instruction('while (current != nil && current.value != target) {');
      case 'search-left':
      case 'search-right':
        return instruction('current = target < current.value ? current.left : current.right;');
      case 'search-found':
      case 'search-missing':
        return instruction('return current;');
      case 'insert-visit':
        return instruction('while (current != nil) {');
      case 'insert-compare':
      case 'insert-duplicate':
        return instruction('if (value == current.value) return false;');
      case 'insert-left':
      case 'insert-right':
        return instruction('current = value < current.value ? current.left : current.right;');
      case 'insert-link-root':
        return instruction('if (parent == null) root = added;')
          ?? instruction('if (parent == nullptr) root = node;');
      case 'insert-link-left':
        return instruction('else if (value < parent.value) parent.left = added;')
          ?? instruction('else if (value < parent.value) parent.left = node;');
      case 'insert-link-right':
        return instruction('else parent.right = added;')
          ?? instruction('else parent.right = node;');
      case 'insert-fix':
        return instruction('while (node.parent != null && node.parent.red) {');
      case 'insert-uncle':
        return branchInstruction(`Node uncle = grandparent.${side === 'left' ? 'right' : 'left'};`);
      case 'insert-inner':
        return branchInstruction('node = parent;');
      case 'insert-recolor-parent':
        return ['uncle-red', 'line'].includes(event.case)
          ? branchInstruction('parent.red = false;', event.case === 'line' ? 1 : 0)
          : null;
      case 'insert-recolor-uncle':
        return branchInstruction('uncle.red = false;');
      case 'insert-recolor-grandparent':
        return ['uncle-red', 'line'].includes(event.case)
          ? branchInstruction('grandparent.red = true;', event.case === 'line' ? 1 : 0)
          : null;
      case 'insert-ascend':
        return branchInstruction('node = grandparent;');
      case 'insert-recolor-root':
        return instruction('root.red = false;');
      case 'delete-select':
        return instruction('Node removed = node;');
      case 'delete-transplant-right':
        return instruction('transplant(node, node.right);');
      case 'delete-transplant-left':
        return instruction('transplant(node, node.left);');
      case 'delete-transplant-successor':
        return instruction('transplant(node, removed);');
      case 'delete-recolor-replacement':
        return instruction('removed.red = node.red;');
      case 'delete-successor-visit':
      case 'delete-successor-left':
        return instruction('while (node.left != nil) node = node.left;');
      case 'delete-successor-found':
        return instruction('return node;');
      case 'delete-fix-start':
        return declaration('fixAfterDelete');
      case 'delete-fix':
        return instruction('while (node != root && !node.red) {');
      case 'delete-sibling':
        return branchInstruction(`Node sibling = node.parent.${side === 'left' ? 'right' : 'left'};`);
      case 'delete-red-sibling':
        return branchInstruction('if (sibling.red) {');
      case 'delete-black-nephews':
        return branchInstruction(side === 'left'
          ? 'if (!sibling.left.red && !sibling.right.red) {'
          : 'if (!sibling.right.red && !sibling.left.red) {');
      case 'delete-near-nephew':
        return branchInstruction(`if (!sibling.${side === 'left' ? 'right' : 'left'}.red) {`);
      case 'delete-far-nephew':
      case 'delete-recolor-sibling-parent':
        return branchInstruction('sibling.red = node.parent.red;');
      case 'delete-recolor-sibling-black':
        return branchInstruction('sibling.red = false;');
      case 'delete-recolor-parent-red':
        return branchInstruction('node.parent.red = true;');
      case 'delete-recolor-sibling-red':
        return ['black-nephews', 'near-nephew'].includes(event.case)
          ? branchInstruction('sibling.red = true;', event.case === 'near-nephew' ? 1 : 0)
          : null;
      case 'delete-recolor-near-black':
        return branchInstruction(`sibling.${side === 'left' ? 'left' : 'right'}.red = false;`);
      case 'delete-recolor-parent-black':
        return branchInstruction('node.parent.red = false;');
      case 'delete-recolor-far-black':
        return branchInstruction(`sibling.${side === 'left' ? 'right' : 'left'}.red = false;`);
      case 'delete-ascend':
        return branchInstruction('node = node.parent;');
      case 'delete-finish':
        return branchInstruction('node = root;');
      case 'delete-recolor-current-black':
        return instruction('node.red = false;');
      case 'rotate-left':
      case 'rotate-right': {
        const rotate = codeKey === 'rotate-left' ? 'rotateLeft' : 'rotateRight';
        if (scopeName === 'fixAfterInsert') {
          if (reason === 'insert-inner') return branchInstruction(`${rotate}(node);`);
          if (reason === 'insert-outer') return branchInstruction(`${rotate}(grandparent);`);
          return null;
        }
        if (scopeName === 'fixAfterDelete') {
          if (reason === 'delete-near-nephew') return branchInstruction(`${rotate}(sibling);`);
          if (reason === 'delete-red-sibling') return branchInstruction(`${rotate}(node.parent);`, 0);
          if (reason === 'delete-far-nephew') return branchInstruction(`${rotate}(node.parent);`, 1);
        }
        return null;
      }
      default:
        return null;
    }
  };
}

export function getRedBlackCodeLine(code, event) {
  return createRedBlackCodeMapper(code)(event);
}
