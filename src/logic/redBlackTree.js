// A small pointer-based red-black model for the visualizer. The black sentinel
// mirrors the nil node used by the displayed Java and C++ implementations.
export function createRedBlackTree(values, colors = null) {
  const nil = { value: null, red: false, left: null, right: null, parent: null };
  nil.left = nil;
  nil.right = nil;
  let root = nil;

  const node = (value, red = true) => ({ value, red, left: nil, right: nil, parent: nil });
  const rotateLeft = pivot => {
    const child = pivot.right;
    pivot.right = child.left;
    if (child.left !== nil) child.left.parent = pivot;
    child.parent = pivot.parent;
    if (pivot.parent === nil) root = child;
    else if (pivot === pivot.parent.left) pivot.parent.left = child;
    else pivot.parent.right = child;
    child.left = pivot;
    pivot.parent = child;
  };
  const rotateRight = pivot => {
    const child = pivot.left;
    pivot.left = child.right;
    if (child.right !== nil) child.right.parent = pivot;
    child.parent = pivot.parent;
    if (pivot.parent === nil) root = child;
    else if (pivot === pivot.parent.right) pivot.parent.right = child;
    else pivot.parent.left = child;
    child.right = pivot;
    pivot.parent = child;
  };
  const find = value => {
    let current = root;
    while (current !== nil && Number(current.value) !== Number(value)) {
      current = Number(value) < Number(current.value) ? current.left : current.right;
    }
    return current;
  };
  const insert = value => {
    let parent = nil;
    let current = root;
    while (current !== nil) {
      parent = current;
      if (Number(value) === Number(current.value)) return false;
      current = Number(value) < Number(current.value) ? current.left : current.right;
    }
    let added = node(value);
    added.parent = parent;
    if (parent === nil) root = added;
    else if (Number(value) < Number(parent.value)) parent.left = added;
    else parent.right = added;

    while (added.parent !== nil && added.parent.red) {
      const grandparent = added.parent.parent;
      if (added.parent === grandparent.left) {
        const uncle = grandparent.right;
        if (uncle.red) {
          added.parent.red = false;
          uncle.red = false;
          grandparent.red = true;
          added = grandparent;
        } else {
          if (added === added.parent.right) {
            added = added.parent;
            rotateLeft(added);
          }
          added.parent.red = false;
          grandparent.red = true;
          rotateRight(grandparent);
        }
      } else {
        const uncle = grandparent.left;
        if (uncle.red) {
          added.parent.red = false;
          uncle.red = false;
          grandparent.red = true;
          added = grandparent;
        } else {
          if (added === added.parent.left) {
            added = added.parent;
            rotateRight(added);
          }
          added.parent.red = false;
          grandparent.red = true;
          rotateLeft(grandparent);
        }
      }
    }
    root.red = false;
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
    while (current.left !== nil) current = current.left;
    return current;
  };
  const fixAfterDelete = start => {
    let current = start;
    while (current !== root && !current.red) {
      if (current === current.parent.left) {
        let sibling = current.parent.right;
        if (sibling.red) {
          sibling.red = false;
          current.parent.red = true;
          rotateLeft(current.parent);
          sibling = current.parent.right;
        }
        if (!sibling.left.red && !sibling.right.red) {
          sibling.red = true;
          current = current.parent;
        } else {
          if (!sibling.right.red) {
            sibling.left.red = false;
            sibling.red = true;
            rotateRight(sibling);
            sibling = current.parent.right;
          }
          sibling.red = current.parent.red;
          current.parent.red = false;
          sibling.right.red = false;
          rotateLeft(current.parent);
          current = root;
        }
      } else {
        let sibling = current.parent.left;
        if (sibling.red) {
          sibling.red = false;
          current.parent.red = true;
          rotateRight(current.parent);
          sibling = current.parent.left;
        }
        if (!sibling.right.red && !sibling.left.red) {
          sibling.red = true;
          current = current.parent;
        } else {
          if (!sibling.left.red) {
            sibling.right.red = false;
            sibling.red = true;
            rotateLeft(sibling);
            sibling = current.parent.left;
          }
          sibling.red = current.parent.red;
          current.parent.red = false;
          sibling.left.red = false;
          rotateRight(current.parent);
          current = root;
        }
      }
    }
    current.red = false;
    nil.red = false;
  };
  const remove = value => {
    const target = find(value);
    if (target === nil) return false;
    let removed = target;
    let removedWasRed = removed.red;
    let moved = nil;
    if (target.left === nil) {
      moved = target.right;
      transplant(target, target.right);
    } else if (target.right === nil) {
      moved = target.left;
      transplant(target, target.left);
    } else {
      removed = smallest(target.right);
      removedWasRed = removed.red;
      moved = removed.right;
      if (removed.parent === target) moved.parent = removed;
      else {
        transplant(removed, removed.right);
        removed.right = target.right;
        removed.right.parent = removed;
      }
      transplant(target, removed);
      removed.left = target.left;
      removed.left.parent = removed;
      removed.red = target.red;
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

  const snapshot = () => {
    const slots = [];
    const shades = [];
    let hiddenNode = false;
    const place = (current, index) => {
      if (current === nil) return;
      if (index >= 15) { hiddenNode = true; return; }
      slots[index] = current.value;
      shades[index] = current.red ? 'red' : 'black';
      place(current.left, index * 2 + 1);
      place(current.right, index * 2 + 2);
    };
    place(root, 0);
    while (slots.length && slots.at(-1) === undefined) slots.pop();
    return { values: slots, colors: shades, hiddenNode };
  };
  return { insert, remove, find: value => find(value) !== nil, snapshot };
}
