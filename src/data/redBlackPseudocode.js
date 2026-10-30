const traversalActions = new Set(['preorder', 'inorder', 'postorder']);
const supportedActions = new Set(['tree-add', 'remove-value', 'find', ...traversalActions]);
const cache = new Map();

function buildRedBlackPseudocode(actionId, language) {
  const text = (es, en) => language === 'en' ? en : es;
  const keyword = {
    function: text('función', 'function'),
    if: text('si', 'if'),
    else: text('si no', 'else'),
    while: text('mientras', 'while'),
    return: text('devolver', 'return'),
  };
  const source = [];
  const lineMap = new Map();
  const add = (line = '', keys = [], selectors = {}) => {
    const index = source.push(line) - 1;
    for (const key of typeof keys === 'string' ? [keys] : keys) {
      const entries = lineMap.get(key) ?? [];
      entries.push({ line: index, ...selectors });
      lineMap.set(key, entries);
    }
  };
  const method = name => add(`${keyword.function} ${name} {`);

  add(text('// nil es un centinela negro compartido; no es null.', '// nil is the shared black sentinel; it is not null.'));
  add(text('// Inicialización del árbol, una sola vez:', '// Tree initialization, performed once:'));
  add('nil ← new Node(0, false)');
  add('nil.left ← nil');
  add('nil.right ← nil');
  add('nil.parent ← null');
  add('root ← nil');
  add();
  add('// Start of the selected operation');

  if (actionId === 'tree-add') {
    method('insert(value)');
    add('    parent ← null');
    add('    current ← root', 'start');
    add(`    ${keyword.while} (current ≠ nil) {`, 'insert-visit');
    add('        parent ← current');
    add(`        ${keyword.if} (value = current.value) {`, 'insert-compare');
    add(`            ${keyword.return} false`, 'insert-duplicate');
    add('        }');
    add('        current ← value < current.value ? current.left : current.right', ['insert-left', 'insert-right']);
    add('    }');
    add('    added ← new Node(value, true)');
    add('    added.left ← nil');
    add('    added.right ← nil');
    add('    added.parent ← parent');
    add(`    ${keyword.if} (parent = null) {`);
    add('        root ← added', 'insert-link-root');
    add(`    } ${keyword.else} ${keyword.if} (value < parent.value) {`);
    add('        parent.left ← added', 'insert-link-left');
    add(`    } ${keyword.else} {`);
    add('        parent.right ← added', 'insert-link-right');
    add('    }');
    add('    fixAfterInsert(added)');
    add(`    ${keyword.return} true`, 'done');
    add('}');
  } else if (actionId === 'remove-value') {
    method('remove(target)');
    add('    node ← findNode(target)', 'start');
    add(`    ${keyword.if} (node = nil) {`);
    add(`        ${keyword.return} false`, 'delete-missing');
    add('    }');
    add('    removed ← node', 'delete-select');
    add('    removedWasRed ← removed.red');
    add('    moved ← nil');
    add(`    ${keyword.if} (node.left = nil) {`);
    add('        moved ← node.right');
    add('        transplant(node, node.right)', 'delete-transplant-right');
    add(`    } ${keyword.else} ${keyword.if} (node.right = nil) {`);
    add('        moved ← node.left');
    add('        transplant(node, node.left)', 'delete-transplant-left');
    add(`    } ${keyword.else} {`);
    add('        removed ← smallest(node.right)');
    add('        removedWasRed ← removed.red');
    add('        moved ← removed.right');
    add(`        ${keyword.if} (removed.parent = node) {`);
    add('            moved.parent ← removed');
    add(`        } ${keyword.else} {`);
    add('            transplant(removed, removed.right)');
    add('            removed.right ← node.right');
    add('            removed.right.parent ← removed');
    add('        }');
    add('        transplant(node, removed)');
    add('        removed.left ← node.left');
    add('        removed.left.parent ← removed', 'delete-transplant-successor');
    add('        removed.red ← node.red', 'delete-recolor-replacement');
    add('    }');
    add(text('    // C++: liberar node; Java: node queda desvinculado.', '    // C++: free node; Java: node is now unlinked.'));
    add(`    ${keyword.if} (not removedWasRed) fixAfterDelete(moved)`, 'delete-fix-start');
    add('    root.red ← false');
    add('    nil.red ← false');
    add(`    ${keyword.return} true`, 'done');
    add('}');
  } else if (traversalActions.has(actionId)) {
    method(`${actionId}()`);
    add('    result ← []', 'start');
    add(`    ${actionId}(root, result)`);
    add(`    ${keyword.return} result`, 'done');
    add('}');
  } else {
    method('find(target)');
    add('    result ← findNode(target)', 'start');
    add(text('    // Java devuelve un booleano; C++ search devuelve el nodo o nullptr.', '    // Java returns a boolean; C++ search returns the node or nullptr.'));
    add(`    ${keyword.return} result ≠ nil`, 'done');
    add('}');
  }

  add('// End of the selected operation');
  add();

  if (actionId === 'find' || actionId === 'remove-value') {
    method('findNode(target)');
    add('    current ← root');
    add(`    ${keyword.while} (current ≠ nil and current.value ≠ target) {`, ['search-visit', 'search-compare']);
    add('        current ← target < current.value ? current.left : current.right', ['search-left', 'search-right']);
    add('    }');
    add(`    ${keyword.return} current`, ['search-found', 'search-missing']);
    add('}');
    add();
  }

  if (actionId === 'remove-value') {
    method('smallest(node)');
    add(`    ${keyword.while} (node.left ≠ nil) {`, 'delete-successor-visit');
    add('        node ← node.left', 'delete-successor-left');
    add('    }');
    add(`    ${keyword.return} node`, 'delete-successor-found');
    add('}');
    add();
    method('transplant(oldNode, replacement)');
    add(`    ${keyword.if} (oldNode.parent = null) {`);
    add('        root ← replacement');
    add(`    } ${keyword.else} ${keyword.if} (oldNode = oldNode.parent.left) {`);
    add('        oldNode.parent.left ← replacement');
    add(`    } ${keyword.else} {`);
    add('        oldNode.parent.right ← replacement');
    add('    }');
    add('    replacement.parent ← oldNode.parent');
    add('}');
    add();
  }

  if (actionId === 'tree-add' || actionId === 'remove-value') {
    for (const direction of ['left', 'right']) {
      const isLeft = direction === 'left';
      const opposite = isLeft ? 'right' : 'left';
      method(`rotate${isLeft ? 'Left' : 'Right'}(node)`);
      add(`    child ← node.${opposite}`);
      add(`    node.${opposite} ← child.${direction}`);
      add(`    ${keyword.if} (child.${direction} ≠ nil) child.${direction}.parent ← node`);
      add('    child.parent ← node.parent');
      add(`    ${keyword.if} (node.parent = null) {`);
      add('        root ← child');
      add(`    } ${keyword.else} ${keyword.if} (node = node.parent.${direction}) {`);
      add(`        node.parent.${direction} ← child`);
      add(`    } ${keyword.else} {`);
      add(`        node.parent.${opposite} ← child`);
      add('    }');
      add(`    child.${direction} ← node`);
      add('    node.parent ← child');
      add('}');
      add();
    }
  }

  if (actionId === 'tree-add') {
    method('fixAfterInsert(node)');
    add(`    ${keyword.while} (node.parent ≠ null and node.parent.red) {`, 'insert-fix');
    add('        parent ← node.parent');
    add('        grandparent ← parent.parent');
    for (const side of ['left', 'right']) {
      const isLeft = side === 'left';
      const opposite = isLeft ? 'right' : 'left';
      const innerRotation = isLeft ? 'Left' : 'Right';
      const outerRotation = isLeft ? 'Right' : 'Left';
      add(isLeft ? `        ${keyword.if} (parent = grandparent.left) {` : `        } ${keyword.else} {`);
      add(`            uncle ← grandparent.${opposite}`, 'insert-uncle', { side });
      add(`            ${keyword.if} (uncle.red) {`);
      add('                parent.red ← false', 'insert-recolor-parent', { side, case: 'uncle-red' });
      add('                uncle.red ← false', 'insert-recolor-uncle', { side, case: 'uncle-red' });
      add('                grandparent.red ← true', 'insert-recolor-grandparent', { side, case: 'uncle-red' });
      add('                node ← grandparent', 'insert-ascend', { side });
      add(`            } ${keyword.else} {`);
      add(`                ${keyword.if} (node = parent.${opposite}) {`);
      add('                    node ← parent', 'insert-inner', { side });
      add(`                    rotate${innerRotation}(node)`, `rotate-${innerRotation.toLowerCase()}`, { reason: 'insert-inner' });
      add('                    parent ← node.parent');
      add('                    grandparent ← parent.parent');
      add('                }');
      add('                parent.red ← false', 'insert-recolor-parent', { side, case: 'line' });
      add('                grandparent.red ← true', 'insert-recolor-grandparent', { side, case: 'line' });
      add(`                rotate${outerRotation}(grandparent)`, `rotate-${outerRotation.toLowerCase()}`, { reason: 'insert-outer' });
      add('            }');
    }
    add('        }');
    add('    }');
    add('    root.red ← false', 'insert-recolor-root');
    add('}');
  }

  if (actionId === 'remove-value') {
    method('fixAfterDelete(node)');
    add(`    ${keyword.while} (node ≠ root and not node.red) {`, 'delete-fix');
    for (const side of ['left', 'right']) {
      const isLeft = side === 'left';
      const opposite = isLeft ? 'right' : 'left';
      const towardSibling = isLeft ? 'Left' : 'Right';
      const towardNode = isLeft ? 'Right' : 'Left';
      add(isLeft ? `        ${keyword.if} (node = node.parent.left) {` : `        } ${keyword.else} {`);
      add(`            sibling ← node.parent.${opposite}`, 'delete-sibling', { side });
      add(`            ${keyword.if} (sibling.red) {`, 'delete-red-sibling', { side });
      add('                sibling.red ← false', 'delete-recolor-sibling-black', { side });
      add('                node.parent.red ← true', 'delete-recolor-parent-red', { side });
      add(`                rotate${towardSibling}(node.parent)`, `rotate-${towardSibling.toLowerCase()}`, { reason: 'delete-red-sibling' });
      add(`                sibling ← node.parent.${opposite}`);
      add('            }');
      add(`            ${keyword.if} (not sibling.${side}.red and not sibling.${opposite}.red) {`, 'delete-black-nephews', { side });
      add('                sibling.red ← true', 'delete-recolor-sibling-red', { side, case: 'black-nephews' });
      add('                node ← node.parent', 'delete-ascend', { side });
      add(`            } ${keyword.else} {`);
      add(`                ${keyword.if} (not sibling.${opposite}.red) {`, 'delete-near-nephew', { side });
      add(`                    sibling.${side}.red ← false`, 'delete-recolor-near-black', { side });
      add('                    sibling.red ← true', 'delete-recolor-sibling-red', { side, case: 'near-nephew' });
      add(`                    rotate${towardNode}(sibling)`, `rotate-${towardNode.toLowerCase()}`, { reason: 'delete-near-nephew' });
      add(`                    sibling ← node.parent.${opposite}`);
      add('                }');
      add('                sibling.red ← node.parent.red', ['delete-far-nephew', 'delete-recolor-sibling-parent'], { side });
      add('                node.parent.red ← false', 'delete-recolor-parent-black', { side });
      add(`                sibling.${opposite}.red ← false`, 'delete-recolor-far-black', { side });
      add(`                rotate${towardSibling}(node.parent)`, `rotate-${towardSibling.toLowerCase()}`, { reason: 'delete-far-nephew' });
      add('                node ← root', 'delete-finish', { side });
      add('            }');
    }
    add('        }');
    add('    }');
    add('    node.red ← false', 'delete-recolor-current-black');
    add('    nil.red ← false');
    add('}');
  }

  if (traversalActions.has(actionId)) {
    method(`${actionId}(node, result)`);
    add(`    ${keyword.if} (node = nil) {`, ['traversal-enter', 'traversal-empty']);
    add(`        ${keyword.return}`);
    add('    }');
    const steps = {
      preorder: ['emit', 'left', 'right'],
      inorder: ['left', 'emit', 'right'],
      postorder: ['left', 'right', 'emit'],
    }[actionId];
    for (const step of steps) {
      if (step === 'emit') add('    result.add(node.value)', 'traversal-emit');
      else add(`    ${actionId}(node.${step}, result)`, `traversal-${step}`);
    }
    add('}');
  }

  return { code: source.join('\n'), lineMap };
}

function getSource(actionId, language) {
  if (!supportedActions.has(actionId)) return null;
  const normalizedLanguage = language === 'en' ? 'en' : 'es';
  const key = `${actionId}:${normalizedLanguage}`;
  if (!cache.has(key)) cache.set(key, buildRedBlackPseudocode(actionId, normalizedLanguage));
  return cache.get(key);
}

export function getRedBlackPseudocode(actionId, language = 'es') {
  return getSource(actionId, language)?.code ?? null;
}

/** Zero-based source line; an ambiguous or unsupported event has no active line. */
export function getRedBlackPseudocodeLine(actionId, language = 'es', event = {}) {
  const key = event.codeKey === 'done' && event.succeeded === false
    ? actionId === 'tree-add' ? 'insert-duplicate'
      : actionId === 'remove-value' ? 'delete-missing' : event.codeKey
    : event.codeKey;
  const entries = getSource(actionId, language)?.lineMap.get(key) ?? [];
  const matches = entries.filter(entry => ['side', 'case', 'reason'].every(selector => (
    entry[selector] === undefined || entry[selector] === event[selector]
  )));
  return matches.length === 1 ? matches[0].line : null;
}
