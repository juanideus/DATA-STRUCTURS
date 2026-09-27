const node = (keys = [], children = []) => ({ keys, children });
const leaf = current => current.children.length === 0;
const childIndex = (current, value, equalRight = false) => {
  let index = 0;
  while (index < current.keys.length && (equalRight ? value >= current.keys[index] : value > current.keys[index])) index++;
  return index;
};

function insertB(root, value, events) {
  const split = (parent, index) => {
    const full = parent.children[index];
    const median = full.keys[1];
    const right = node(full.keys.slice(2), full.children.slice(2));
    full.keys = full.keys.slice(0, 1);
    full.children = full.children.slice(0, 2);
    parent.keys.splice(index, 0, median);
    parent.children.splice(index + 1, 0, right);
    events.push({ type: 'split', promotedKey: median });
  };
  if (root.keys.length === 3) {
    root = node([], [root]);
    split(root, 0);
  }
  let current = root;
  while (!leaf(current)) {
    let index = childIndex(current, value);
    if (current.children[index].keys.length === 3) {
      split(current, index);
      if (value > current.keys[index]) index++;
    }
    current = current.children[index];
  }
  current.keys.splice(childIndex(current, value), 0, value);
  events.push({ type: 'insert', value });
  return root;
}

function insertBPlus(root, value, events) {
  const path = [];
  let current = root;
  while (!leaf(current)) {
    const index = childIndex(current, value, true);
    path.push([current, index]);
    current = current.children[index];
  }
  current.keys.splice(childIndex(current, value), 0, value);
  events.push({ type: 'insert', value });
  if (current.keys.length <= 3) return root;
  const rightLeaf = node(current.keys.splice(2));
  let right = rightLeaf;
  let promoted = right.keys[0];
  events.push({ type: 'split', promotedKey: promoted });
  while (true) {
    if (!path.length) return node([promoted], [current, right]);
    const [parent, index] = path.pop();
    parent.keys.splice(index, 0, promoted);
    parent.children.splice(index + 1, 0, right);
    if (parent.keys.length <= 3) return root;
    promoted = parent.keys[2];
    right = node(parent.keys.splice(3), parent.children.splice(3));
    parent.keys.splice(2, 1);
    current = parent;
    events.push({ type: 'split', promotedKey: promoted });
  }
}

function insertBStar(root, value, events) {
  const path = [];
  let current = root;
  while (!leaf(current)) {
    const index = childIndex(current, value);
    path.push([current, index]);
    current = current.children[index];
  }
  current.keys.splice(childIndex(current, value), 0, value);
  events.push({ type: 'insert', value });
  while (current.keys.length > 5) {
    if (!path.length) {
      const middle = Math.floor(current.keys.length / 2);
      const left = node(current.keys.slice(0, middle), current.children.slice(0, middle + 1));
      const right = node(current.keys.slice(middle + 1), current.children.slice(middle + 1));
      const promotedKey = current.keys[middle];
      events.push({ type: 'split', promotedKey });
      return node([promotedKey], [left, right]);
    }
    const [parent, index] = path.pop();
    const rightSibling = parent.children[index + 1];
    const leftSibling = parent.children[index - 1];
    const left = rightSibling && rightSibling.keys.length < 5 ? current
      : leftSibling && leftSibling.keys.length < 5 ? leftSibling
        : rightSibling ? current : leftSibling;
    const right = left === current ? rightSibling : current;
    const separatorIndex = parent.children.indexOf(left);
    const allKeys = [...left.keys, parent.keys[separatorIndex], ...right.keys];
    const allChildren = [...left.children, ...right.children];
    if (left.keys.length < 5 || right.keys.length < 5) {
      const leftCount = Math.floor(allKeys.length / 2);
      left.keys = allKeys.slice(0, leftCount);
      parent.keys[separatorIndex] = allKeys[leftCount];
      right.keys = allKeys.slice(leftCount + 1);
      if (allChildren.length) {
        left.children = allChildren.slice(0, leftCount + 1);
        right.children = allChildren.slice(leftCount + 1);
      }
      events.push({ type: 'redistribute', promotedKey: parent.keys[separatorIndex] });
      return root;
    }
    const distributable = allKeys.length - 2;
    const firstCount = Math.floor(distributable / 3);
    const secondCount = Math.floor(distributable / 3);
    const firstSeparator = firstCount;
    const secondSeparator = firstCount + 1 + secondCount;
    const middleNode = node(allKeys.slice(firstSeparator + 1, secondSeparator),
      allChildren.length ? allChildren.slice(firstCount + 1, firstCount + secondCount + 2) : []);
    left.keys = allKeys.slice(0, firstSeparator);
    right.keys = allKeys.slice(secondSeparator + 1);
    if (allChildren.length) {
      left.children = allChildren.slice(0, firstCount + 1);
      right.children = allChildren.slice(firstCount + secondCount + 2);
    }
    parent.keys.splice(separatorIndex, 1, allKeys[firstSeparator], allKeys[secondSeparator]);
    parent.children.splice(separatorIndex, 2, left, middleNode, right);
    events.push({ type: 'split', promotedKey: allKeys[firstSeparator] });
    current = parent;
  }
  return root;
}

function removeB(root, value) {
  const erase = (current, target) => {
    let index = current.keys.findIndex(key => key >= target);
    if (index < 0) index = current.keys.length;
    if (index < current.keys.length && current.keys[index] === target) {
      if (leaf(current)) {
        current.keys.splice(index, 1);
        return;
      }
      const left = current.children[index];
      const right = current.children[index + 1];
      if (left.keys.length >= 2) {
        let predecessor = left;
        while (!leaf(predecessor)) predecessor = predecessor.children.at(-1);
        const replacement = predecessor.keys.at(-1);
        current.keys[index] = replacement;
        erase(left, replacement);
      } else if (right.keys.length >= 2) {
        let successor = right;
        while (!leaf(successor)) successor = successor.children[0];
        const replacement = successor.keys[0];
        current.keys[index] = replacement;
        erase(right, replacement);
      } else {
        left.keys.push(current.keys.splice(index, 1)[0], ...right.keys);
        left.children.push(...right.children);
        current.children.splice(index + 1, 1);
        erase(left, target);
      }
      return;
    }
    if (leaf(current)) return;
    let child = current.children[index];
    if (child.keys.length === 1) {
      const left = current.children[index - 1];
      const right = current.children[index + 1];
      if (left?.keys.length >= 2) {
        child.keys.unshift(current.keys[index - 1]);
        current.keys[index - 1] = left.keys.pop();
        if (!leaf(left)) child.children.unshift(left.children.pop());
      } else if (right?.keys.length >= 2) {
        child.keys.push(current.keys[index]);
        current.keys[index] = right.keys.shift();
        if (!leaf(right)) child.children.push(right.children.shift());
      } else if (right) {
        child.keys.push(current.keys.splice(index, 1)[0], ...right.keys);
        child.children.push(...right.children);
        current.children.splice(index + 1, 1);
      } else {
        left.keys.push(current.keys.splice(index - 1, 1)[0], ...child.keys);
        left.children.push(...child.children);
        current.children.splice(index, 1);
        child = left;
      }
    }
    erase(child, target);
  };
  erase(root, value);
  return root.keys.length === 0 && root.children.length ? root.children[0] : root;
}

function removeBPlus(root, value) {
  const path = [];
  let current = root;
  while (!leaf(current)) {
    const index = childIndex(current, value, true);
    path.push([current, index]);
    current = current.children[index];
  }
  current.keys.splice(current.keys.indexOf(value), 1);
  while (path.length) {
    const [parent, index] = path.pop();
    const minimum = leaf(current) ? 2 : 1;
    if (current.keys.length >= minimum) break;
    const left = parent.children[index - 1];
    const right = parent.children[index + 1];
    if (left && left.keys.length > minimum) {
      if (leaf(current)) current.keys.unshift(left.keys.pop());
      else {
        current.children.unshift(left.children.pop());
        current.keys.unshift(parent.keys[index - 1]);
        parent.keys[index - 1] = left.keys.pop();
      }
      break;
    }
    if (right && right.keys.length > minimum) {
      if (leaf(current)) current.keys.push(right.keys.shift());
      else {
        current.children.push(right.children.shift());
        current.keys.push(parent.keys[index]);
        parent.keys[index] = right.keys.shift();
      }
      break;
    }
    if (left) {
      if (!leaf(current)) left.keys.push(parent.keys[index - 1]);
      left.keys.push(...current.keys);
      left.children.push(...current.children);
      parent.children.splice(index, 1);
      parent.keys.splice(index - 1, 1);
    } else if (right) {
      if (!leaf(current)) current.keys.push(parent.keys[index]);
      current.keys.push(...right.keys);
      current.children.push(...right.children);
      parent.children.splice(index + 1, 1);
      parent.keys.splice(index, 1);
    }
    current = parent;
  }
  if (root.keys.length === 0 && root.children.length) root = root.children[0];
  const firstKey = currentNode => leaf(currentNode) ? currentNode.keys[0] : firstKey(currentNode.children[0]);
  const refresh = currentNode => {
    currentNode.children.forEach(refresh);
    if (!leaf(currentNode)) currentNode.keys = currentNode.children.slice(1).map(firstKey);
  };
  refresh(root);
  return root;
}

function removeBStar(root, value) {
  const path = [];
  let current = root;
  let index;
  while (current) {
    index = current.keys.findIndex(key => key >= value);
    if (index < 0) index = current.keys.length;
    if (current.keys[index] === value) break;
    if (leaf(current)) return root;
    path.push([current, index]);
    current = current.children[index];
  }
  if (!leaf(current)) {
    path.push([current, index]);
    let predecessor = current.children[index];
    while (!leaf(predecessor)) {
      path.push([predecessor, predecessor.keys.length]);
      predecessor = predecessor.children.at(-1);
    }
    const replacement = predecessor.keys.at(-1);
    current.keys[index] = replacement;
    current = predecessor;
    index = current.keys.length - 1;
  }
  current.keys.splice(index, 1);
  while (path.length) {
    const [parent, childPosition] = path.pop();
    const minimum = parent === root ? 2 : 3;
    if (current.keys.length >= minimum) break;
    const left = parent.children[childPosition - 1];
    const right = parent.children[childPosition + 1];
    if (left && left.keys.length > minimum) {
      current.keys.unshift(parent.keys[childPosition - 1]);
      parent.keys[childPosition - 1] = left.keys.pop();
      if (!leaf(left)) current.children.unshift(left.children.pop());
      break;
    }
    if (right && right.keys.length > minimum) {
      current.keys.push(parent.keys[childPosition]);
      parent.keys[childPosition] = right.keys.shift();
      if (!leaf(right)) current.children.push(right.children.shift());
      break;
    }
    if (parent === root && parent.keys.length === 1) {
      const first = parent.children[0];
      const second = parent.children[1];
      first.keys.push(parent.keys[0], ...second.keys);
      first.children.push(...second.children);
      root = first;
      break;
    }
    let start = childPosition === 0 ? 0 : childPosition - 1;
    if (start + 2 > parent.keys.length) start = parent.keys.length - 2;
    const first = parent.children[start];
    const second = parent.children[start + 1];
    const third = parent.children[start + 2];
    const keys = [...first.keys, parent.keys[start], ...second.keys, parent.keys[start + 1], ...third.keys];
    const children = [...first.children, ...second.children, ...third.children];
    const firstCount = Math.floor((keys.length - 1) / 2);
    first.keys = keys.slice(0, firstCount);
    second.keys = keys.slice(firstCount + 1);
    parent.keys.splice(start, 2, keys[firstCount]);
    if (children.length) {
      first.children = children.slice(0, firstCount + 1);
      second.children = children.slice(firstCount + 1);
    }
    parent.children.splice(start, 3, first, second);
    current = parent;
  }
  return root.keys.length === 0 && root.children.length ? root.children[0] : root;
}

export function createMultiwayTree(id, values = [], previous = null) {
  let root = previous?.root ? structuredClone(previous.root) : node();
  const order = previous?.order ? [...previous.order] : [];
  const insert = value => {
    const number = Number(value);
    const events = [];
    root = id === 'btree' ? insertB(root, number, events)
      : id === 'bplus-tree' ? insertBPlus(root, number, events)
        : insertBStar(root, number, events);
    order.push(number);
    return { tree: snapshot(), events };
  };
  const snapshot = () => ({ root: structuredClone(root), order: [...order] });
  if (!previous) values.forEach(insert);
  const remove = value => {
    const index = order.indexOf(Number(value));
    if (index < 0) return { tree: snapshot(), events: [] };
    order.splice(index, 1);
    if (id === 'btree') {
      root = removeB(root, Number(value));
      return { tree: snapshot(), events: [{ type: 'remove', value: Number(value) }] };
    }
    if (id === 'bplus-tree') {
      root = removeBPlus(root, Number(value));
      return { tree: snapshot(), events: [{ type: 'remove', value: Number(value) }] };
    }
    if (id === 'bstar-tree') {
      root = removeBStar(root, Number(value));
      return { tree: snapshot(), events: [{ type: 'remove', value: Number(value) }] };
    }
    return { tree: snapshot(), events: [{ type: 'remove', value: Number(value) }] };
  };
  return { snapshot, insert, remove };
}
