// A small pointer-based red-black model for the visualizer. The black sentinel
// mirrors the nil node used by the displayed Java and C++ implementations.
export function createRedBlackTree(values, colors = null) {
  const nil = { value: null, red: false, left: null, right: null, parent: null };
  nil.left = nil;
  nil.right = nil;
  let root = nil;
  let activeTrace = null;

  const valueOf = current => current === nil || !current ? null : current.value;
  const sourceMethodFor = codeKey => {
    if (codeKey.startsWith('search-')) return 'findNode';
    if (codeKey.startsWith('delete-successor-')) return 'smallest';
    if (codeKey.startsWith('insert-recolor-') || ['insert-fix', 'insert-uncle', 'insert-inner', 'insert-ascend'].includes(codeKey)) return 'fixAfterInsert';
    if (codeKey.startsWith('insert-')) return 'insert';
    if (codeKey.startsWith('delete-transplant-') || ['delete-select', 'delete-recolor-replacement'].includes(codeKey)) return 'remove';
    if (codeKey.startsWith('delete-')) return 'fixAfterDelete';
    if (codeKey.startsWith('rotate-')) return activeTrace.action === 'insert' ? 'fixAfterInsert' : 'fixAfterDelete';
    return activeTrace.action === 'find' ? 'findNode' : activeTrace.action;
  };
  const emit = (kind, codeKey, subject, details = {}) => {
    if (!activeTrace) return;
    activeTrace.events.push({
      action: activeTrace.action,
      kind,
      codeKey,
      sourceMethod: sourceMethodFor(codeKey),
      subjectValue: valueOf(subject),
      targetValue: activeTrace.value,
      ...(activeTrace.output && { output: [...activeTrace.output] }),
      ...details,
      // A temporary rotation can move a node below the final 15-slot canvas.
      // The event must still describe the complete tree, not silently drop it.
      snapshot: captureSnapshot(Infinity),
    });
  };
  const recolor = (current, red, codeKey, details = {}) => {
    const previousColor = current.red ? 'red' : 'black';
    current.red = red;
    emit('recolor', codeKey, current, {
      previousColor,
      color: red ? 'red' : 'black',
      sentinel: current === nil,
      ...details,
    });
  };

  const node = (value, red = true) => ({ value, red, left: nil, right: nil, parent: nil });
  const rotateLeft = (pivot, reason = null) => {
    const child = pivot.right;
    pivot.right = child.left;
    if (child.left !== nil) child.left.parent = pivot;
    child.parent = pivot.parent;
    if (pivot.parent === nil) root = child;
    else if (pivot === pivot.parent.left) pivot.parent.left = child;
    else pivot.parent.right = child;
    child.left = pivot;
    pivot.parent = child;
    emit('rotation', 'rotate-left', pivot, {
      direction: 'left', pivotValue: pivot.value, childValue: child.value, reason,
      case: reason,
      helperMethod: 'rotateLeft',
      side: activeTrace?.side ?? null,
    });
  };
  const rotateRight = (pivot, reason = null) => {
    const child = pivot.left;
    pivot.left = child.right;
    if (child.right !== nil) child.right.parent = pivot;
    child.parent = pivot.parent;
    if (pivot.parent === nil) root = child;
    else if (pivot === pivot.parent.right) pivot.parent.right = child;
    else pivot.parent.left = child;
    child.right = pivot;
    pivot.parent = child;
    emit('rotation', 'rotate-right', pivot, {
      direction: 'right', pivotValue: pivot.value, childValue: child.value, reason,
      case: reason,
      helperMethod: 'rotateRight',
      side: activeTrace?.side ?? null,
    });
  };
  const find = value => {
    let current = root;
    let parent = nil;
    while (current !== nil) {
      const comparison = Math.sign(Number(value) - Number(current.value));
      emit('visit', 'search-visit', current, { parentValue: valueOf(current.parent) });
      emit('compare', 'search-compare', current, { comparison });
      if (Number(current.value) === Number(value)) {
        emit('found', 'search-found', current);
        return current;
      }
      const direction = comparison < 0 ? 'left' : 'right';
      parent = current;
      current = current[direction];
      emit('descend', `search-${direction}`, parent, {
        direction, nextValue: valueOf(current), reachedSentinel: current === nil,
      });
    }
    emit('not-found', 'search-missing', nil, { parentValue: valueOf(parent) });
    return current;
  };
  const insert = value => {
    let parent = nil;
    let current = root;
    while (current !== nil) {
      parent = current;
      const comparison = Math.sign(Number(value) - Number(current.value));
      emit('visit', 'insert-visit', current, { parentValue: valueOf(current.parent) });
      emit('compare', 'insert-compare', current, { comparison });
      if (Number(value) === Number(current.value)) {
        emit('duplicate', 'insert-duplicate', current);
        return false;
      }
      const direction = Number(value) < Number(current.value) ? 'left' : 'right';
      current = current[direction];
      emit('descend', `insert-${direction}`, parent, {
        direction, nextValue: valueOf(current), reachedSentinel: current === nil,
      });
    }
    let added = node(value);
    added.parent = parent;
    if (parent === nil) root = added;
    else if (Number(value) < Number(parent.value)) parent.left = added;
    else parent.right = added;
    const side = parent === nil ? 'root' : added === parent.left ? 'left' : 'right';
    emit('link', `insert-link-${side}`, added, { parentValue: valueOf(parent), side, color: 'red' });

    while (added.parent !== nil && added.parent.red) {
      const grandparent = added.parent.parent;
      emit('fixup', 'insert-fix', added, {
        parentValue: valueOf(added.parent), grandparentValue: valueOf(grandparent),
      });
      if (added.parent === grandparent.left) {
        if (activeTrace) activeTrace.side = 'left';
        const uncle = grandparent.right;
        emit('case', 'insert-uncle', uncle, {
          side: 'left', parentValue: valueOf(added.parent),
          grandparentValue: valueOf(grandparent), uncleValue: valueOf(uncle), uncleRed: uncle.red,
        });
        if (uncle.red) {
          recolor(added.parent, false, 'insert-recolor-parent', { side: 'left', case: 'uncle-red' });
          recolor(uncle, false, 'insert-recolor-uncle', { side: 'left', case: 'uncle-red' });
          recolor(grandparent, true, 'insert-recolor-grandparent', { side: 'left', case: 'uncle-red' });
          added = grandparent;
          emit('ascend', 'insert-ascend', added, { side: 'left' });
        } else {
          if (added === added.parent.right) {
            added = added.parent;
            emit('case', 'insert-inner', added, { side: 'left' });
            rotateLeft(added, 'insert-inner');
          }
          recolor(added.parent, false, 'insert-recolor-parent', { side: 'left', case: 'line' });
          recolor(grandparent, true, 'insert-recolor-grandparent', { side: 'left', case: 'line' });
          rotateRight(grandparent, 'insert-outer');
        }
      } else {
        if (activeTrace) activeTrace.side = 'right';
        const uncle = grandparent.left;
        emit('case', 'insert-uncle', uncle, {
          side: 'right', parentValue: valueOf(added.parent),
          grandparentValue: valueOf(grandparent), uncleValue: valueOf(uncle), uncleRed: uncle.red,
        });
        if (uncle.red) {
          recolor(added.parent, false, 'insert-recolor-parent', { side: 'right', case: 'uncle-red' });
          recolor(uncle, false, 'insert-recolor-uncle', { side: 'right', case: 'uncle-red' });
          recolor(grandparent, true, 'insert-recolor-grandparent', { side: 'right', case: 'uncle-red' });
          added = grandparent;
          emit('ascend', 'insert-ascend', added, { side: 'right' });
        } else {
          if (added === added.parent.left) {
            added = added.parent;
            emit('case', 'insert-inner', added, { side: 'right' });
            rotateRight(added, 'insert-inner');
          }
          recolor(added.parent, false, 'insert-recolor-parent', { side: 'right', case: 'line' });
          recolor(grandparent, true, 'insert-recolor-grandparent', { side: 'right', case: 'line' });
          rotateLeft(grandparent, 'insert-outer');
        }
      }
    }
    recolor(root, false, 'insert-recolor-root');
    return true;
  };
  const transplant = (oldNode, replacement) => {
    if (oldNode.parent === nil) root = replacement;
    else if (oldNode === oldNode.parent.left) oldNode.parent.left = replacement;
    else oldNode.parent.right = replacement;
    replacement.parent = oldNode.parent;
  };
  const smallest = start => {
    let current = start;
    emit('successor', 'delete-successor-visit', current);
    while (current.left !== nil) {
      const previous = current;
      current = current.left;
      emit('descend', 'delete-successor-left', previous, { nextValue: valueOf(current) });
      emit('successor', 'delete-successor-visit', current);
    }
    emit('successor', 'delete-successor-found', current);
    return current;
  };
  const fixAfterDelete = start => {
    let current = start;
    emit('fixup', 'delete-fix-start', current, { parentValue: valueOf(current.parent) });
    while (current !== root && !current.red) {
      emit('fixup', 'delete-fix', current, { parentValue: valueOf(current.parent) });
      if (current === current.parent.left) {
        if (activeTrace) activeTrace.side = 'left';
        let sibling = current.parent.right;
        emit('case', 'delete-sibling', sibling, {
          side: 'left', parentValue: valueOf(current.parent), siblingRed: sibling.red,
          nearValue: valueOf(sibling.left), nearRed: sibling.left.red,
          farValue: valueOf(sibling.right), farRed: sibling.right.red,
        });
        if (sibling.red) {
          emit('case', 'delete-red-sibling', sibling, { side: 'left' });
          recolor(sibling, false, 'delete-recolor-sibling-black', { side: 'left' });
          recolor(current.parent, true, 'delete-recolor-parent-red', { side: 'left' });
          rotateLeft(current.parent, 'delete-red-sibling');
          sibling = current.parent.right;
        }
        if (!sibling.left.red && !sibling.right.red) {
          emit('case', 'delete-black-nephews', sibling, { side: 'left' });
          recolor(sibling, true, 'delete-recolor-sibling-red', { side: 'left', case: 'black-nephews' });
          current = current.parent;
          emit('ascend', 'delete-ascend', current, { side: 'left' });
        } else {
          if (!sibling.right.red) {
            emit('case', 'delete-near-nephew', sibling, { side: 'left' });
            recolor(sibling.left, false, 'delete-recolor-near-black', { side: 'left' });
            recolor(sibling, true, 'delete-recolor-sibling-red', { side: 'left', case: 'near-nephew' });
            rotateRight(sibling, 'delete-near-nephew');
            sibling = current.parent.right;
          }
          emit('case', 'delete-far-nephew', sibling, { side: 'left' });
          recolor(sibling, current.parent.red, 'delete-recolor-sibling-parent', { side: 'left' });
          recolor(current.parent, false, 'delete-recolor-parent-black', { side: 'left' });
          recolor(sibling.right, false, 'delete-recolor-far-black', { side: 'left' });
          rotateLeft(current.parent, 'delete-far-nephew');
          current = root;
          emit('fixup', 'delete-finish', current, { side: 'left' });
        }
      } else {
        if (activeTrace) activeTrace.side = 'right';
        let sibling = current.parent.left;
        emit('case', 'delete-sibling', sibling, {
          side: 'right', parentValue: valueOf(current.parent), siblingRed: sibling.red,
          nearValue: valueOf(sibling.right), nearRed: sibling.right.red,
          farValue: valueOf(sibling.left), farRed: sibling.left.red,
        });
        if (sibling.red) {
          emit('case', 'delete-red-sibling', sibling, { side: 'right' });
          recolor(sibling, false, 'delete-recolor-sibling-black', { side: 'right' });
          recolor(current.parent, true, 'delete-recolor-parent-red', { side: 'right' });
          rotateRight(current.parent, 'delete-red-sibling');
          sibling = current.parent.left;
        }
        if (!sibling.right.red && !sibling.left.red) {
          emit('case', 'delete-black-nephews', sibling, { side: 'right' });
          recolor(sibling, true, 'delete-recolor-sibling-red', { side: 'right', case: 'black-nephews' });
          current = current.parent;
          emit('ascend', 'delete-ascend', current, { side: 'right' });
        } else {
          if (!sibling.left.red) {
            emit('case', 'delete-near-nephew', sibling, { side: 'right' });
            recolor(sibling.right, false, 'delete-recolor-near-black', { side: 'right' });
            recolor(sibling, true, 'delete-recolor-sibling-red', { side: 'right', case: 'near-nephew' });
            rotateLeft(sibling, 'delete-near-nephew');
            sibling = current.parent.left;
          }
          emit('case', 'delete-far-nephew', sibling, { side: 'right' });
          recolor(sibling, current.parent.red, 'delete-recolor-sibling-parent', { side: 'right' });
          recolor(current.parent, false, 'delete-recolor-parent-black', { side: 'right' });
          recolor(sibling.left, false, 'delete-recolor-far-black', { side: 'right' });
          rotateRight(current.parent, 'delete-far-nephew');
          current = root;
          emit('fixup', 'delete-finish', current, { side: 'right' });
        }
      }
    }
    recolor(current, false, 'delete-recolor-current-black');
    nil.red = false;
  };
  const remove = value => {
    const target = find(value);
    if (target === nil) return false;
    emit('select', 'delete-select', target, {
      leftValue: valueOf(target.left), rightValue: valueOf(target.right), color: target.red ? 'red' : 'black',
    });
    let removed = target;
    let removedWasRed = removed.red;
    let moved = nil;
    if (target.left === nil) {
      moved = target.right;
      transplant(target, target.right);
      emit('transplant', 'delete-transplant-right', moved, {
        removedValue: target.value, replacementValue: valueOf(moved), parentValue: valueOf(moved.parent),
        removedWasRed, needsFixup: !removedWasRed,
      });
    } else if (target.right === nil) {
      moved = target.left;
      transplant(target, target.left);
      emit('transplant', 'delete-transplant-left', moved, {
        removedValue: target.value, replacementValue: valueOf(moved), parentValue: valueOf(moved.parent),
        removedWasRed, needsFixup: !removedWasRed,
      });
    } else {
      removed = smallest(target.right);
      removedWasRed = removed.red;
      moved = removed.right;
      const successorParentValue = valueOf(removed.parent);
      if (removed.parent === target) moved.parent = removed;
      else {
        // Detaching the successor and reconnecting it replaces one logical node.
        // Do not expose the intermediate pointer state where it is disconnected.
        transplant(removed, removed.right);
        removed.right = target.right;
        removed.right.parent = removed;
      }
      transplant(target, removed);
      removed.left = target.left;
      removed.left.parent = removed;
      emit('transplant', 'delete-transplant-successor', removed, {
        removedValue: target.value, replacementValue: removed.value,
        movedValue: valueOf(moved), successorParentValue,
        removedWasRed, needsFixup: !removedWasRed,
      });
      recolor(removed, target.red, 'delete-recolor-replacement');
    }
    if (!removedWasRed) fixAfterDelete(moved);
    if (root !== nil) root.red = false;
    return true;
  };

  if (Array.isArray(colors)) {
    const place = (index, parent = nil) => {
      if (index >= values.length || values[index] === undefined || values[index] === null) return nil;
      const current = node(values[index], colors[index] === 'red');
      current.parent = parent;
      current.left = place(index * 2 + 1, current);
      current.right = place(index * 2 + 2, current);
      return current;
    };
    root = place(0);
  } else {
    for (const value of values) if (value !== undefined && value !== null) insert(value);
  }

  function captureSnapshot(slotLimit = 15) {
    const slots = [];
    const shades = [];
    let hiddenNode = false;
    const place = (current, index) => {
      if (current === nil) return;
      if (index >= slotLimit) { hiddenNode = true; return; }
      slots[index] = current.value;
      shades[index] = current.red ? 'red' : 'black';
      place(current.left, index * 2 + 1);
      place(current.right, index * 2 + 2);
    };
    place(root, 0);
    while (slots.length && slots.at(-1) === undefined) slots.pop();
    return { values: slots, colors: shades, hiddenNode };
  }
  const snapshot = () => captureSnapshot();
  const traversalOrders = new Set(['preorder', 'inorder', 'postorder']);
  const traverse = order => {
    const visit = (current, parent = nil, side = 'root', depth = 0) => {
      const context = { parentValue: valueOf(parent), side, depth };
      if (current === nil) {
        emit('traversal-empty', 'traversal-empty', nil, context);
        return;
      }
      emit('traversal-enter', 'traversal-enter', current, context);
      const append = () => {
        activeTrace.output.push(current.value);
        emit('traversal-emit', 'traversal-emit', current, context);
      };
      if (order === 'preorder') append();
      emit('traversal-left', 'traversal-left', current, {
        ...context, nextValue: valueOf(current.left),
      });
      visit(current.left, current, 'left', depth + 1);
      if (order === 'inorder') append();
      emit('traversal-right', 'traversal-right', current, {
        ...context, nextValue: valueOf(current.right),
      });
      visit(current.right, current, 'right', depth + 1);
      if (order === 'postorder') append();
    };
    visit(root);
  };
  const trace = (action, value) => {
    const isTraversal = traversalOrders.has(action);
    if (!['insert', 'find', 'remove'].includes(action) && !isTraversal) {
      throw new Error(`Unknown red-black operation: ${action}`);
    }
    const events = [];
    activeTrace = { action, value, events, side: null, ...(isTraversal && { output: [] }) };
    try {
      emit('start', 'start', root);
      let succeeded;
      if (isTraversal) {
        traverse(action);
        succeeded = true;
      } else {
        succeeded = action === 'insert' ? insert(value)
          : action === 'remove' ? remove(value)
            : find(value) !== nil;
      }
      const subject = isTraversal || action === 'remove' ? root
        : succeeded ? findWithoutTrace(value) : nil;
      emit('complete', 'done', subject, { succeeded });
      return { succeeded, events, snapshot: snapshot() };
    } finally {
      activeTrace = null;
    }
  };
  // Completion identifies its subject without appending a second search trace.
  const findWithoutTrace = value => {
    const traceContext = activeTrace;
    activeTrace = null;
    try { return find(value); }
    finally { activeTrace = traceContext; }
  };
  return { insert, remove, find: value => find(value) !== nil, snapshot, trace };
}
