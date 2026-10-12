import { getThreadedTreeLinks, occupiedThreadedPosition, THREADED_HEADER } from './operationMetadata.js';

// Snapshots follow pointer assignments, not a reconstruction of the final tree.
export function executeThreadedTreeOperation({ actionId, fields, values, initialValues, edges }) {
  const before = [...values];
  const raw = String(fields.value ?? '').trim();
  const value = raw === '' ? null : Number(raw);
  const valid = value !== null && Number.isInteger(value) && value >= -2147483648 && value <= 2147483647;
  const nodes = new Map();
  const retiredNodes = new Map();
  const { links } = getThreadedTreeLinks(before);
  links.forEach(meta => nodes.set(meta.index, {
    id: meta.index, value: before[meta.index],
    left: meta.leftThread ? meta.predecessor : meta.index * 2 + 1,
    right: meta.rightThread ? meta.successor : meta.index * 2 + 2,
    leftThread: meta.leftThread, rightThread: meta.rightThread,
  }));
  const root = THREADED_HEADER;
  const header = { id: root, header: true, value: 'root', left: nodes.has(0) ? 0 : root,
    right: root, leftThread: !nodes.has(0), rightThread: false };
  let current = header.left;
  let currentReady = false;
  let parent = root;
  const frames = [];
  const getNode = id => id === root ? header : nodes.get(id) ?? retiredNodes.get(id);
  const pointerValue = id => id === root ? 'root' : getNode(id)?.value ?? '—';
  const slots = () => {
    const result = [];
    const place = (id, index) => {
      if (id === root) return;
      const node = nodes.get(id);
      result[index] = node.value;
      if (!node.leftThread) place(node.left, index * 2 + 1);
      if (!node.rightThread) place(node.right, index * 2 + 2);
    };
    if (!header.leftThread) place(header.left, 0);
    return Array.from(result);
  };
  const snapshot = () => {
    const connected = new Set();
    const visit = id => {
      if (id === root || connected.has(id) || !nodes.has(id)) return;
      connected.add(id);
      const node = nodes.get(id);
      if (!node.leftThread) visit(node.left);
      if (!node.rightThread) visit(node.right);
    };
    if (!header.leftThread) visit(header.left);
    return { root, nodes: [{ ...header, connected: true }, ...[...nodes.values()].map(node => ({ ...node, connected: connected.has(node.id) }))] };
  };
  const ref = (name, id) => ({ name, value: pointerValue(id), role: 'value' });
  const input = name => ({ name, value, role: 'input' });
  const emit = (codeNeedle, message, messageEn, options = {}) => {
    const { variables = [], ...frameOptions } = options;
    const focus = options.focus === undefined ? current : options.focus;
    const helper = variables.some(variable => variable.name === 'node');
    const owner = helper ? 'node' : currentReady ? 'current' : focus === root ? 'root' : 'newNode';
    const node = getNode(helper || !currentReady ? focus : current);
    const released = !helper && currentReady && retiredNodes.has(current);
    const visualValues = [];
    nodes.forEach(item => { visualValues[item.id] = item.value; });
    frames.push({
      values: Array.from(visualValues), position: focus ?? -1, codeNeedle, message, messageEn,
      threadedState: snapshot(), delayMs: 760, completed: false,
      variables: [
        ...(currentReady ? [{ ...ref('current', current), ...(released ? { cppValue: 'dangling' } : {}) }] : []),
        ref('root', root), ref('root.left', header.left),
        ...(node ? [
          { name: `${owner}.leftThread`, value: node.leftThread, role: node.leftThread ? 'true' : 'false', ...(released ? { cppValue: '—' } : {}) },
          { name: `${owner}.rightThread`, value: node.rightThread, role: node.rightThread ? 'true' : 'false', ...(released ? { cppValue: '—' } : {}) },
        ] : []),
        ...variables,
      ],
      ...frameOptions,
    });
  };
  const fail = (message, messageEn) => {
    if (frames.length) frames.at(-1).completed = true;
    return { ok: false, values: before, edges, message, messageEn, step: 0, ...(frames.length ? { frames } : {}) };
  };
  const finish = (message, messageEn, position = current) => {
    const updated = slots();
    const positions = new Map([[root, root]]);
    const place = (id, slot) => {
      if (id === root) return;
      positions.set(id, slot);
      const node = nodes.get(id);
      if (!node.leftThread) place(node.left, slot * 2 + 1);
      if (!node.rightThread) place(node.right, slot * 2 + 2);
    };
    if (!header.leftThread) place(header.left, 0);
    const remap = id => positions.get(id);
    const last = frames.at(-1);
    if (last) {
      last.completed = true;
      last.values = updated;
      last.position = remap(last.position) ?? -1;
      last.threadedState = {
        root,
        nodes: [{ ...header, left: remap(header.left), connected: true }, ...[...nodes.values()].map(node => ({
          ...node, id: remap(node.id), left: remap(node.left), right: remap(node.right), connected: true,
        }))],
      };
      if (last.activeThread) last.activeThread = { ...last.activeThread, from: remap(last.activeThread.from), to: remap(last.activeThread.to) };
    }
    return { ok: true, values: updated, edges, message, messageEn, step: remap(position) ?? 0, frames };
  };
  const leftMost = (id, initial = false) => {
    const original = id;
    while (!getNode(id).leftThread) {
      emit('while (!node.leftThread)', 'node tiene un hijo izquierdo real.', 'node has a real left child.', { focus: id, variables: [ref('node', id)] });
      id = getNode(id).left;
      emit('node = node.left;', 'node avanza al hijo izquierdo, no a un hilo.', 'node moves to the left child, not to a thread.', { focus: id, variables: [ref('node', id)] });
    }
    emit('while (!node.leftThread)', 'El hilo izquierdo detiene el descenso.', 'The left thread stops the descent.', { focus: id, variables: [ref('node', id)] });
    emit('return node;', id === root ? 'leftMost devuelve la cabecera: no hay datos.' : 'leftMost devuelve el menor nodo de este subárbol.', id === root ? 'leftMost returns the header: there are no data nodes.' : 'leftMost returns the smallest node in this subtree.', { focus: id, variables: [ref('node', id)] });
    current = id;
    currentReady = true;
    emit(initial ? 'Node current = leftMost(root.left);' : 'current = leftMost(current.right);',
      'current recibe el resultado de leftMost.', 'current receives the result of leftMost.', { focus: id, variables: [ref('subtree', original)] });
    return id;
  };

  if (actionId === 'reset') return { ok: true, values: [...initialValues], edges, message: 'Estructura restablecida a su estado inicial.', step: 0 };
  if (actionId !== 'inorder' && !valid) return fail('Ingresa un entero válido de 32 bits.', 'Enter a valid 32-bit integer.');

  if (actionId === 'tree-add') {
    const duplicate = [...nodes.values()].some(node => node.value === value);
    if (!duplicate && nodes.size >= 15) return fail('La demostración admite hasta 15 nodos con datos visibles, además de la cabecera.', 'The demonstration supports up to 15 visible data nodes, plus the header.');
    let insertPosition = 0;
    if (!duplicate) while (occupiedThreadedPosition(before, insertPosition)) insertPosition = insertPosition * 2 + (value < before[insertPosition] ? 1 : 2);
    if (insertPosition >= 15) return fail('La inserción produciría un nivel que no cabe completo en el visualizador.', 'This insertion would create a level that does not fit in the visualizer.');
    emit('Node parent = root;', 'parent comienza en la cabecera root.', 'parent starts at the root header.', { focus: root, variables: [ref('parent', parent), input('value')] });
    currentReady = true;
    emit('Node current = root.left;', 'current recibe el primer nodo con datos, o la cabecera si está vacío.', 'current receives the first data node, or the header when empty.', { variables: [input('value')] });
    while (current !== root) {
      const node = nodes.get(current);
      emit('while (current != root)', `Se visita ${node.value} y se compara con ${value}.`, `Visit ${node.value} and compare it with ${value}.`, { variables: [input('value')] });
      emit('if (value == current.value) return root;', node.value === value ? `${value} ya existe; no se inserta ni se cambia la estructura.` : 'El valor no está repetido; continúa la búsqueda.', node.value === value ? `${value} already exists; return without inserting.` : 'The value is not a duplicate; continue searching.', { cppCodeNeedle: 'if (current->value == value) return false;' });
      if (node.value === value) return fail(`${value} ya existe en el árbol.`, `${value} already exists in the tree.`);
      parent = current;
      emit('parent = current;', 'parent conserva el nodo actual.', 'parent keeps the current node.', { variables: [ref('parent', parent)] });
      const side = value < node.value ? 'left' : 'right';
      emit('if (value < current.value)', 'La comparación decide entre izquierda y derecha.', 'The comparison chooses left or right.', { variables: [input('value')] });
      emit(`if (!current.${side}Thread) current = current.${side};`, `Se comprueba si ${side} es un hijo real.`, `Check whether ${side} is a real child.`);
      if (node[`${side}Thread`]) {
        emit('else break;', 'Se encontró un hilo: el ciclo termina aquí.', 'A thread was found: the loop stops here.', { codeOccurrence: side === 'right' ? 1 : 0 });
        break;
      }
      current = node[side];
      emit(`if (!current.${side}Thread) current = current.${side};`, 'current avanza al hijo real.', 'current moves to the real child.');
    }
    if (parent === root) emit('while (current != root)', 'current es la cabecera; no se entra al ciclo.', 'current is the header; the loop is not entered.');
    nodes.set(insertPosition, { id: insertPosition, value, left: insertPosition, right: insertPosition, leftThread: true, rightThread: true });
    const newNode = nodes.get(insertPosition);
    emit('Node newNode = new Node(value);', `Se reserva el nodo ${value}, todavía sin conectar.`, `Allocate node ${value}, still unlinked.`, { focus: insertPosition, variables: [ref('newNode', insertPosition)] });
    emit('if (parent == root)', parent === root ? 'El árbol estaba vacío: se conectará a la cabecera.' : 'Hay un padre con datos: se sustituirá uno de sus hilos.', parent === root ? 'The tree was empty: connect the node to the header.' : 'The parent holds data: replace one of its threads.', { focus: insertPosition });
    if (parent === root) {
      for (const side of ['left', 'right']) {
        newNode[side] = root;
        emit(`newNode.${side} = root;`, 'El hilo externo del nodo nuevo apunta a la cabecera.', 'The new node’s outer thread points to the header.', { focus: insertPosition, activeThread: { from: insertPosition, to: root, side } });
      }
      header.left = insertPosition;
      emit('root.left = newNode;', 'root.left recibe el nodo; aún conserva el indicador de hilo.', 'root.left receives the node; its thread flag has not changed yet.', { focus: root });
      header.leftThread = false;
      emit('root.leftThread = false;', 'La cabecera ya enlaza un hijo real con datos.', 'The header now links to a real data child.', { focus: insertPosition });
    } else {
      const parentNode = nodes.get(parent);
      const side = value < parentNode.value ? 'left' : 'right';
      emit('} else if (value < parent.value)', 'La comparación con parent elige el enlace que se sustituirá.', 'The comparison with parent chooses the link to replace.', { focus: insertPosition });
      for (const link of ['left', 'right']) {
        const target = side === 'left' ? (link === 'left' ? parentNode.left : parent) : (link === 'left' ? parent : parentNode.right);
        newNode[link] = target;
        const needle = side === 'left' ? (link === 'left' ? 'newNode.left = parent.left;' : 'newNode.right = parent;') : (link === 'left' ? 'newNode.left = parent;' : 'newNode.right = parent.right;');
        emit(needle, `Se asigna el hilo ${link} del nodo nuevo a ${pointerValue(target)}.`, `Set the new node's ${link} thread to ${pointerValue(target)}.`, { focus: insertPosition, activeThread: { from: insertPosition, to: target, side: link }, threadPhase: 'link' });
      }
      parentNode[side] = insertPosition;
      emit(`parent.${side} = newNode;`, 'El puntero del padre recibe el nodo nuevo.', 'The parent pointer receives the new node.', { focus: insertPosition });
      parentNode[`${side}Thread`] = false;
      emit(`parent.${side}Thread = false;`, 'El indicador confirma que ahora es un hijo real.', 'The flag confirms that this is now a real child.', { focus: insertPosition, threadPhase: 'child' });
    }
    emit('return root;', `Nodo ${value} insertado y enhebrado correctamente.`, `Node ${value} inserted with its threads connected.`, { cppCodeNeedle: 'return true;', focus: insertPosition });
    return finish(`Nodo ${value} insertado y enhebrado correctamente.`, `Node ${value} inserted with its threads connected.`, insertPosition);
  }

  if (actionId === 'find' || actionId === 'remove-value') {
    const removing = actionId === 'remove-value';
    if (removing) emit('Node parent = root;', 'parent comienza en la cabecera root.', 'parent starts at the root header.', { focus: root, variables: [ref('parent', parent)] });
    currentReady = true;
    emit('Node current = root.left;', 'La búsqueda comienza en root.left, sin comparar el valor de la cabecera.', 'The search starts at root.left, without comparing the header value.', { variables: [input('target')] });
    const loop = removing ? 'while (current != root && current.value != target)' : 'while (current != root)';
    while (current !== root) {
      const node = nodes.get(current);
      emit(loop, node.value === value && removing ? 'Se encontró target; termina la búsqueda.' : `La búsqueda está en ${node.value}.`, node.value === value && removing ? 'target was found; the search loop ends.' : `The search is at ${node.value}.`, { variables: [input('target')] });
      if (!removing) emit('if (target == current.value) return current;', value === node.value ? `${value} fue encontrado.` : 'No coincide; se compara para elegir un hijo.', value === node.value ? `${value} was found.` : 'No match; compare to choose a child.', { cppCodeNeedle: 'if (current->value == target) return current;' });
      if (node.value === value) {
        if (!removing) return finish(`${value} fue encontrado.`, `${value} was found.`);
        break;
      }
      if (removing) { parent = current; emit('parent = current;', 'parent conserva el nodo anterior.', 'parent keeps the previous node.', { variables: [ref('parent', parent)] }); }
      const side = value < node.value ? 'left' : 'right';
      emit('if (target < current.value)', 'La comparación decide la dirección de búsqueda.', 'The comparison chooses the search direction.');
      emit(`if (current.${side}Thread) return root;`, node[`${side}Thread`] ? 'La referencia es un hilo: el valor no existe.' : 'La referencia es un hijo real; la búsqueda continúa.', node[`${side}Thread`] ? 'The reference is a thread: the value does not exist.' : 'The reference is a real child; continue searching.', removing ? { cppCodeNeedle: `if (current->${side}Thread) return false;` } : {});
      if (node[`${side}Thread`]) return fail(removing ? `${value} no existe en el árbol.` : `${value} no fue encontrado.`, removing ? `${value} does not exist in the tree.` : `${value} was not found.`);
      current = node[side];
      emit(`current = current.${side};`, 'current avanza sin atravesar hilos.', 'current advances without crossing threads.');
    }
    if (current === root) {
      emit(loop, 'current es la cabecera; no se entra al ciclo.', 'current is the header; the loop is not entered.');
      emit(removing ? 'if (current == root) return root;' : 'return root;', 'La cabecera representa que el valor no fue encontrado.', 'The header indicates that the value was not found.', removing ? { cppCodeNeedle: 'if (current == root) return false;' } : {});
      return fail(removing ? `${value} no existe en el árbol.` : `${value} no fue encontrado.`, removing ? `${value} does not exist in the tree.` : `${value} was not found.`);
    }
  }

  if (actionId === 'inorder') {
    current = leftMost(header.left, true);
    const output = [];
    while (current !== root) {
      emit('while (current != root)', 'current tiene datos; se visita el nodo.', 'current holds data; visit the node.');
      output.push(nodes.get(current).value);
      emit('System.out.println(current.value);', `Se visita ${pointerValue(current)}.`, `Visit ${pointerValue(current)}.`, { cppCodeNeedle: 'visit(current->value);', variables: [{ name: 'output', value: output.join(' → '), role: 'value' }] });
      const node = nodes.get(current);
      emit('if (current.rightThread)', node.rightThread ? 'El enlace derecho es un hilo.' : 'El enlace derecho es un hijo real.', node.rightThread ? 'The right link is a thread.' : 'The right link is a real child.');
      if (node.rightThread) {
        const from = current;
        current = node.right;
        emit('current = current.right;', current === root ? 'El hilo externo devuelve current a la cabecera.' : 'current sigue el hilo al sucesor inorden.', current === root ? 'The outer thread returns current to the header.' : 'current follows the thread to the inorder successor.', { cppCodeNeedle: 'if (current->rightThread) current = current->right;', activeThread: { from, to: current, side: 'right' }, threadPhase: current === root ? 'finish' : 'follow' });
      } else current = leftMost(node.right);
    }
    const message = `inorder: ${output.join(' → ') || '∅'}.`;
    emit('while (current != root)', `${message} current llegó a la cabecera; termina sin visitarla.`, `${message} current reached the header; stop without visiting it.`, { variables: [{ name: 'output', value: output.join(' → ') || '∅', role: 'value' }], ...(output.length ? { activeThread: { from: [...nodes.values()].find(node => node.value === output.at(-1)).id, to: root, side: 'right' }, threadPhase: 'finish' } : {}) });
    return finish(message, message, root);
  }

  if (actionId === 'remove-value') {
    emit('if (current == root) return root;', 'current no es la cabecera: se puede eliminar.', 'current is not the header: removal can proceed.', { cppCodeNeedle: 'if (current == root) return false;' });
    let node = nodes.get(current);
    emit('if (!current.leftThread && !current.rightThread)', 'Se comprueba si current tiene dos hijos reales.', 'Check whether current has two real children.');
    if (!node.leftThread && !node.rightThread) {
      let successorParent = current;
      let successor = node.right;
      emit('Node successorParent = current;', 'successorParent comienza en current.', 'successorParent starts at current.', { variables: [ref('successorParent', successorParent)] });
      emit('Node successor = current.right;', 'Se busca el sucesor en el hijo derecho.', 'Search for the successor at the right child.', { focus: successor, variables: [ref('successor', successor)] });
      while (!nodes.get(successor).leftThread) {
        emit('while (!successor.leftThread)', 'El candidato tiene un hijo izquierdo real.', 'The candidate has a real left child.', { focus: successor });
        successorParent = successor;
        emit('successorParent = successor;', 'Se conserva el padre del candidato.', 'Keep the candidate’s parent.', { focus: successor, variables: [ref('successorParent', successorParent)] });
        successor = nodes.get(successor).left;
        emit('successor = successor.left;', 'Se desciende al siguiente candidato.', 'Move down to the next candidate.', { focus: successor, variables: [ref('successor', successor)] });
      }
      emit('while (!successor.leftThread)', 'El hilo izquierdo detiene la búsqueda del sucesor.', 'The left thread stops the successor search.', { focus: successor });
      node.value = nodes.get(successor).value;
      emit('current.value = successor.value;', 'Se copia sólo el valor; ambos nodos siguen presentes.', 'Copy only the value; both nodes are still present.');
      parent = successorParent;
      emit('parent = successorParent;', 'parent recibe el padre del sucesor.', 'parent receives the successor parent.', { variables: [ref('parent', parent)] });
      current = successor;
      node = nodes.get(current);
      emit('current = successor;', 'Se retirará el nodo sucesor original.', 'The original successor node will be removed.');
    }
    const child = !node.leftThread ? node.left : !node.rightThread ? node.right : root;
    emit(!node.leftThread ? 'if (!current.leftThread) child = current.left;' : !node.rightThread ? 'else if (!current.rightThread) child = current.right;' : 'else child = root;', 'child conserva el único hijo real, o la cabecera si no hay ninguno.', 'child keeps the only real child, or the header if there is none.', { variables: [ref('child', child)] });
    let predecessor = node.left;
    if (!node.leftThread) while (!nodes.get(predecessor).rightThread) predecessor = nodes.get(predecessor).right;
    emit('Node predecessor = inorderPredecessor(current);', 'Se localiza el predecesor antes de desconectar.', 'Find the predecessor before unlinking.', { variables: [ref('predecessor', predecessor), ref('child', child)] });
    let successor = node.right;
    if (!node.rightThread) while (!nodes.get(successor).leftThread) successor = nodes.get(successor).left;
    emit('Node successor = inorderSuccessor(current);', 'Se localiza el sucesor antes de modificar enlaces.', 'Find the successor before changing links.', { variables: [ref('predecessor', predecessor), ref('successor', successor), ref('child', child)] });
    emit('if (parent == root)', 'Se comprueba si current es el primer nodo con datos.', 'Check whether current is the first data node.');
    if (parent === root) {
      header.left = child;
      emit('root.left = child;', 'La cabecera recibe el hijo conservado, o vuelve a sí misma.', 'The header receives the retained child, or points back to itself.', { focus: root });
      header.leftThread = child === root;
      emit('root.leftThread = (child == root);', child === root ? 'El árbol quedó vacío; root.left vuelve a ser un hilo.' : 'root.left sigue siendo un hijo real.', child === root ? 'The tree is empty; root.left becomes a thread again.' : 'root.left remains a real child.', { focus: root });
    } else {
      const parentNode = nodes.get(parent);
      const side = parentNode.left === current ? 'left' : 'right';
      emit('} else if (current == parent.left)', 'Se determina qué enlace del padre apunta a current.', 'Determine which parent link points to current.');
      emit('if (child == root)', child === root ? 'No hay hijo real: se restaurará un hilo.' : 'Hay un hijo real: sustituirá al nodo retirado.', child === root ? 'There is no real child: restore a thread.' : 'A real child will replace the removed node.', { codeOccurrence: side === 'right' ? 1 : 0 });
      if (child === root) {
        parentNode[side] = side === 'left' ? predecessor : successor;
        emit(`parent.${side} = ${side === 'left' ? 'predecessor' : 'successor'};`, 'El puntero del padre recibe el vecino inorden.', 'The parent pointer receives the inorder neighbor.');
        parentNode[`${side}Thread`] = true;
        emit(`parent.${side}Thread = true;`, 'El indicador confirma que el enlace es un hilo.', 'The flag confirms that the link is a thread.');
      } else {
        parentNode[side] = child;
        emit(`parent.${side} = child;`, 'El padre queda conectado al hijo real conservado.', 'The parent is connected to the retained real child.');
      }
    }
    emit('if (child != root && !current.leftThread)', 'Se comprueba si el hilo del predecesor necesita reparación.', 'Check whether the predecessor thread needs repair.');
    if (child !== root && !node.leftThread) {
      nodes.get(predecessor).right = successor;
      emit('predecessor.right = successor;', 'El predecesor salta el nodo retirado y apunta al sucesor.', 'The predecessor skips the removed node and points to the successor.');
    } else {
      emit('} else if (child != root && !current.rightThread)', 'Se comprueba si el hilo del sucesor necesita reparación.', 'Check whether the successor thread needs repair.');
      if (child !== root && !node.rightThread) {
        nodes.get(successor).left = predecessor;
        emit('successor.left = predecessor;', 'El sucesor salta el nodo retirado y apunta al predecesor.', 'The successor skips the removed node and points to the predecessor.');
      }
    }
    retiredNodes.set(current, node);
    nodes.delete(current);
    emit('delete current;', 'C++ libera sólo el nodo desconectado; conserva la cabecera.', 'C++ releases only the unlinked node; the header is retained.', { codeLanguage: 'cpp', focus: root });
    emit('return root;', `${value} fue eliminado; los hijos y los hilos quedaron reconectados.`, `${value} was removed; the children and threads are reconnected.`, { cppCodeNeedle: 'return true;', focus: root });
    return finish(`${value} fue eliminado y el enhebrado quedó consistente.`, `${value} was removed and the threads remain consistent.`, root);
  }
  return fail('La operación del árbol enhebrado todavía no está disponible.', 'This threaded tree operation is not available yet.');
}
