import { copyVisualValues } from './visualValues.js';

const nodeName = value => value === null || value === undefined ? 'nil' : String(value);

function eventMessage(event) {
  const value = nodeName(event.subjectValue);
  const target = nodeName(event.targetValue);
  const next = nodeName(event.nextValue);
  const left = event.direction === 'left';
  if (['preorder', 'inorder', 'postorder'].includes(event.action)) {
    const name = { preorder: ['preorden', 'preorder'], inorder: ['inorden', 'inorder'], postorder: ['postorden', 'postorder'] }[event.action];
    if (event.codeKey === 'start') return [`Comienza el recorrido ${name[0]} desde la raíz.`, `Start the ${name[1]} traversal at the root.`];
    if (event.codeKey === 'done') return [`${name[0]}: ${event.output.join(' → ') || 'árbol vacío'}.`, `${name[1]}: ${event.output.join(' → ') || 'empty tree'}.`];
    if (event.codeKey === 'traversal-empty') return ['Se alcanzó nil; esta llamada retorna sin visitar el centinela.', 'Reached nil; this call returns without visiting the sentinel.'];
    if (event.codeKey === 'traversal-enter') return [`La llamada recibe el nodo ${value}.`, `The call receives node ${value}.`];
    if (event.codeKey === 'traversal-emit') return [`Se visita ${value}. Salida: ${event.output.join(' → ')}.`, `Visit ${value}. Output: ${event.output.join(' → ')}.`];
    if (event.codeKey === 'traversal-left' || event.codeKey === 'traversal-right') return [
      `Se llama al recorrido con el hijo ${event.codeKey === 'traversal-left' ? 'izquierdo' : 'derecho'} de ${value}: ${next}.`,
      `Call the traversal with the ${event.codeKey === 'traversal-left' ? 'left' : 'right'} child of ${value}: ${next}.`,
    ];
  }
  switch (event.codeKey) {
    case 'start': return [
      `Comienza ${event.action === 'insert' ? 'la inserción' : event.action === 'remove' ? 'la eliminación' : 'la búsqueda'} de ${target}. Las hojas usan el centinela negro nil.`,
      `Start ${event.action === 'insert' ? 'inserting' : event.action === 'remove' ? 'removing' : 'searching for'} ${target}. Leaves use the black nil sentinel.`,
    ];
    case 'insert-visit': case 'search-visit': return [`Se visita el nodo ${value}.`, `Visit node ${value}.`];
    case 'insert-compare': case 'search-compare': return [
      `${target} ${event.comparison === 0 ? '=' : event.comparison < 0 ? '<' : '>'} ${value}: ${event.comparison === 0 ? 'la clave coincide' : `se elige la rama ${event.comparison < 0 ? 'izquierda' : 'derecha'}`}.`,
      `${target} ${event.comparison === 0 ? '=' : event.comparison < 0 ? '<' : '>'} ${value}: ${event.comparison === 0 ? 'the key matches' : `choose the ${event.comparison < 0 ? 'left' : 'right'} branch`}.`,
    ];
    case 'insert-left': case 'insert-right': case 'search-left': case 'search-right':
    case 'delete-successor-left': return [
      `Desde ${value}, el enlace ${left || event.codeKey === 'delete-successor-left' ? 'izquierdo' : 'derecho'} lleva a ${next}.`,
      `From ${value}, the ${left || event.codeKey === 'delete-successor-left' ? 'left' : 'right'} link leads to ${next}.`,
    ];
    case 'insert-duplicate': return [`${target} ya existe; el árbol no cambia.`, `${target} already exists; the tree is unchanged.`];
    case 'search-found': return [`Se encontró ${target}.`, `Found ${target}.`];
    case 'search-missing': return [`Se alcanzó nil: ${target} no está en el árbol.`, `Reached nil: ${target} is not in the tree.`];
    case 'insert-link-root': return [`El nuevo nodo ${target} se enlaza como raíz, inicialmente rojo.`, `Link new node ${target} as the root, initially red.`];
    case 'insert-link-left': case 'insert-link-right': return [
      `Se enlaza ${target}, inicialmente rojo, como hijo ${event.side === 'left' ? 'izquierdo' : 'derecho'} de ${nodeName(event.parentValue)}.`,
      `Link ${target}, initially red, as the ${event.side === 'left' ? 'left' : 'right'} child of ${nodeName(event.parentValue)}.`,
    ];
    case 'insert-fix': return [`Se repara el conflicto entre ${value} y su padre rojo.`, `Repair the conflict between ${value} and its red parent.`];
    case 'insert-uncle': return [
      `El tío ${nodeName(event.uncleValue)} es ${event.uncleRed ? 'rojo: se recolorea la familia' : 'negro: se comprueba si hace falta rotar'}.`,
      `Uncle ${nodeName(event.uncleValue)} is ${event.uncleRed ? 'red: recolor the family' : 'black: check whether a rotation is needed'}.`,
    ];
    case 'insert-inner': return [`El caso interior requiere una primera rotación en ${value}.`, `The inner case needs a first rotation at ${value}.`];
    case 'insert-ascend': case 'delete-ascend': return [`La reparación continúa desde ${value}.`, `Continue repairing from ${value}.`];
    case 'rotate-left': case 'rotate-right': return [
      `Rotación ${left || event.codeKey === 'rotate-left' ? 'izquierda' : 'derecha'} en ${nodeName(event.pivotValue)}: ${nodeName(event.childValue)} ocupa su lugar. Se conservan todos los nodos.`,
      `${left || event.codeKey === 'rotate-left' ? 'Left' : 'Right'} rotation at ${nodeName(event.pivotValue)}: ${nodeName(event.childValue)} takes its place. All nodes are preserved.`,
    ];
    case 'delete-select': return [`Se prepara la eliminación de ${target}.`, `Prepare to remove ${target}.`];
    case 'delete-successor-visit': return [`Se comprueba ${value} para localizar el sucesor inorden.`, `Inspect ${value} to locate the inorder successor.`];
    case 'delete-successor-found': return [`${value} es el sucesor inorden.`, `${value} is the inorder successor.`];
    case 'delete-transplant-right': case 'delete-transplant-left': return [
      `Se retira ${target} y se reconecta su ${event.codeKey === 'delete-transplant-right' ? 'hijo derecho' : 'hijo izquierdo'} (${nodeName(event.replacementValue)}).`,
      `Remove ${target} and reconnect its ${event.codeKey === 'delete-transplant-right' ? 'right' : 'left'} child (${nodeName(event.replacementValue)}).`,
    ];
    case 'delete-transplant-successor': return [`El sucesor ${value} reemplaza a ${target}; sus subárboles quedan reconectados.`, `Successor ${value} replaces ${target}; its subtrees are reconnected.`];
    case 'delete-fix-start': case 'delete-fix': return [`Se repara la altura negra desde ${value}.`, `Repair the black height from ${value}.`];
    case 'delete-sibling': return [`Se inspecciona el hermano ${value} y sus dos hijos.`, `Inspect sibling ${value} and its two children.`];
    case 'delete-red-sibling': return [`El hermano ${value} es rojo; se transforma el caso mediante recoloreo y rotación.`, `Sibling ${value} is red; transform the case with recoloring and a rotation.`];
    case 'delete-black-nephews': return ['Los dos sobrinos son negros; el déficit negro sube al padre.', 'Both nephews are black; the black-height deficit moves to the parent.'];
    case 'delete-near-nephew': return ['El sobrino lejano es negro; una rotación del hermano prepara el caso final.', 'The far nephew is black; rotate the sibling to prepare the final case.'];
    case 'delete-far-nephew': return ['El sobrino lejano es rojo; se recolorea y se rota el padre para cerrar la reparación.', 'The far nephew is red; recolor and rotate the parent to finish the repair.'];
    case 'delete-finish': return ['La reparación regresa a la raíz.', 'The repair returns to the root.'];
    case 'done': return event.action === 'find'
      ? [event.succeeded ? `${target} fue encontrado.` : `${target} no fue encontrado.`, event.succeeded ? `${target} was found.` : `${target} was not found.`]
      : event.succeeded
        ? [`${target} fue ${event.action === 'insert' ? 'insertado' : 'eliminado'}; las reglas rojo-negro están restauradas.`, `${target} was ${event.action === 'insert' ? 'inserted' : 'removed'}; the red-black rules are restored.`]
        : [`El árbol no cambió: ${target} ${event.action === 'insert' ? 'ya existe' : 'no existe'}.`, `The tree is unchanged: ${target} ${event.action === 'insert' ? 'already exists' : 'does not exist'}.`];
    default:
      if (event.kind === 'recolor') return [
        `${value === 'nil' ? 'El centinela nil' : `El nodo ${value}`} queda ${event.color === 'red' ? 'rojo' : 'negro'}.`,
        `${value === 'nil' ? 'The nil sentinel' : `Node ${value}`} is now ${event.color === 'red' ? 'red' : 'black'}.`,
      ];
      return [`Se actualiza el estado de ${value}.`, `Update the state of ${value}.`];
  }
}

export function createRedBlackAnimationFrames(trace, edges) {
  const maxSlots = Math.max(0, ...trace.events.map(event => event.snapshot.values.length));
  const maxNodes = Math.max(0, ...trace.events.map(event => event.snapshot.values.filter(value => value !== undefined).length));
  const maxDigits = Math.max(1, ...trace.events.flatMap(event => event.snapshot.values.filter(value => value !== undefined).map(value => String(value).length)));
  const layout = { extended: maxSlots > 15 || maxDigits > 6, levels: Math.max(1, Math.ceil(Math.log2(maxSlots + 1))), maxNodes, nodeWidth: Math.max(43, maxDigits * 7.5 + 18) };
  return trace.events.map((event, index) => {
    const [message, messageEn] = eventMessage(event);
    const { snapshot, ...metadata } = event;
    const variables = [
      ...(event.targetValue === undefined || event.targetValue === null ? [] : [{ name: 'target', value: event.targetValue, role: 'input' }]),
      { name: 'node', value: nodeName(event.subjectValue), role: 'value' },
      ...(event.output ? [{ name: 'output', value: event.output.join(' → ') || '—', role: 'value' }] : []),
      ...['parent', 'grandparent', 'uncle', 'sibling', 'near', 'far', 'replacement'].flatMap(name => (
        Object.hasOwn(event, `${name}Value`) ? [{ name, value: nodeName(event[`${name}Value`]), role: 'value' }] : []
      )),
      { name: 'size', value: snapshot.values.filter(value => value !== undefined).length, role: 'size' },
    ];
    return {
      values: copyVisualValues(snapshot.values),
      treeColors: [...snapshot.colors],
      edges: edges.map(edge => [...edge]),
      position: event.subjectValue === null ? -1 : snapshot.values.findIndex(value => value !== undefined && Number(value) === Number(event.subjectValue)),
      redBlackEvent: metadata,
      redBlackLayout: layout,
      message, messageEn, variables,
      delayMs: event.kind === 'rotation' || event.kind === 'recolor' ? 850 : 600,
      completed: index === trace.events.length - 1,
      failed: index === trace.events.length - 1 && !trace.succeeded,
    };
  });
}
