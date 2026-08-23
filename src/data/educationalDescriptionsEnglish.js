import { getOperationDefinition, operationGroup } from '../logic/operations.js';
import { translateOperationLabel } from '../i18n.jsx';

const profiles = {
  array: {
    how: 'The values occupy indexed positions. Reading a known index is direct, while inserting or deleting away from the end requires shifting neighboring values.',
    strengths: ['Constant-time access by index', 'Compact and predictable memory layout', 'Simple traversal from index 0 to n - 1', 'Useful as a building block for many other structures'],
    limits: ['A traditional Java array has a fixed capacity', 'Middle insertions and deletions require shifting values', 'An invalid index causes an error', 'Searching an unsorted array is linear'],
    uses: ['Tables and sequences', 'Matrices and image data', 'Implementing stacks and heaps', 'Dynamic programming tables'],
    example: 'Think of numbered lockers: knowing the index tells you exactly which locker to open.',
    tip: 'For a structure of size n, the valid indices are 0 through n - 1.',
  },
  list: {
    how: 'Each value lives in a node connected through references. Traversal starts at head and follows links one node at a time; circular and doubly linked variants change how those links close and in which directions they can be followed.',
    strengths: ['Grows and shrinks dynamically', 'Does not require contiguous memory', 'Can reconnect known nodes without shifting every value', 'Makes reference changes explicit'],
    limits: ['There is no constant-time access by index', 'Every node needs one or more references', 'A broken link can disconnect part of the structure', 'Boundary and one-node cases require care'],
    uses: ['Playlists and histories', 'Queue and deque implementations', 'Collision chains in hash tables', 'LRU caches and navigation'],
    example: 'Imagine a treasure hunt in which every clue contains the location of the next clue.',
    tip: 'Preserve the next reference before reconnecting or deleting a node so the remaining chain is never lost.',
  },
  stack: {
    how: 'All changes happen at one end called the top. Push places a value on top, while pop removes exactly the most recently inserted value.',
    strengths: ['Push and pop are constant-time operations', 'The LIFO rule is easy to reason about', 'Naturally represents nested work', 'Supports undo and recursive execution'],
    limits: ['Only the top is directly accessible', 'Searching requires traversal', 'Pop on an empty stack is invalid', 'Uncontrolled growth can exhaust memory'],
    uses: ['Java call stacks', 'Undo histories', 'Expression evaluation', 'Depth-first search'],
    example: 'It behaves like a stack of plates: the plate placed last is removed first.',
    tip: 'Always check whether the stack is empty before pop or peek.',
  },
  queue: {
    how: 'New values enter at the rear and leave from the front. An efficient implementation keeps both endpoints so it never shifts every stored value.',
    strengths: ['Preserves arrival order', 'Enqueue and dequeue can be constant time', 'Provides fair task processing', 'Forms the foundation of breadth-first search'],
    limits: ['Middle elements are not directly accessible', 'Empty dequeue must be handled', 'A bounded queue can overflow', 'Array implementations need circular indexing or compaction'],
    uses: ['Print jobs and service turns', 'Message processing', 'Breadth-first graph traversal', 'Task scheduling'],
    example: 'It works like a checkout line: the first person to arrive is served first.',
    tip: 'Use front and rear indices or references instead of shifting the entire queue.',
  },
  tree: {
    how: 'Nodes form a hierarchy beginning at a root. Each operation follows child references recursively or iteratively, and ordered tree variants use comparisons to decide which branch to explore.',
    strengths: ['Represents hierarchical data naturally', 'Each subtree can be processed with the same algorithm', 'Ordered and balanced variants support efficient search', 'Offers several meaningful traversal orders'],
    limits: ['Performance depends on tree height and invariants', 'References and balancing data require extra memory', 'Incorrect rotations or links can disconnect subtrees', 'An unbalanced search tree can become linear'],
    uses: ['File systems and menus', 'Search indexes', 'Compilers and expression evaluation', 'Priority and range-query structures'],
    example: 'Think of an organization chart: every node owns a value and branches toward related descendants.',
    tip: 'Before changing a tree, identify the invariant that must still be true after the operation.',
  },
  heap: {
    how: 'A heap is a complete tree commonly stored in an array. After insertion or root extraction, values move upward or downward until the heap-order rule is restored.',
    strengths: ['The root priority is available immediately', 'Insertion and extraction are logarithmic', 'Array storage avoids child references', 'Always maintains a complete shape'],
    limits: ['Only the root is globally ordered', 'Searching for an arbitrary value is linear', 'Every update must restore heap order', 'It is not a Binary Search Tree'],
    uses: ['Priority queues', 'Schedulers', 'Heap Sort', 'Shortest-path and graph algorithms'],
    example: 'A max-heap keeps the most important task at the top while the remaining tasks stay partially ordered below it.',
    tip: 'After replacing the root with the last node, heapify repeatedly until the complete tree is a valid heap again.',
  },
  graph: {
    how: 'Vertices represent entities and edges represent their relationships. Each algorithm follows adjacency information while tracking visited vertices, distances, or connected components according to its own rules.',
    strengths: ['Models arbitrary relationships', 'Supports directed, undirected, and weighted connections', 'Enables reachability and route analysis', 'Can represent networks that are not hierarchical'],
    limits: ['Dense graphs can consume substantial memory', 'Cycles require explicit visited-state handling', 'Weights and directions change which algorithms are valid', 'Visual layout does not define logical distance'],
    uses: ['Road and transport networks', 'Social connections', 'Computer networks', 'Dependencies and recommendation systems'],
    example: 'Cities are vertices and roads are edges; direction and weight describe how each road may be travelled.',
    tip: 'Choose the algorithm only after checking whether edges are directed, weighted, or allowed to be negative.',
  },
  hash: {
    how: 'A hash function converts a key into a table position. When two keys select the same position, the implementation resolves the collision through probing or a linked chain.',
    strengths: ['Average constant-time lookup and insertion', 'Direct access through meaningful keys', 'Works well for large dictionaries', 'Supports sets, maps, and caches'],
    limits: ['Collisions are unavoidable', 'The worst case can become linear', 'Resizing requires redistributing keys', 'A poor hash function produces uneven buckets'],
    uses: ['Dictionaries and sets', 'Database indexes', 'Caches and symbol tables', 'Counting and grouping values'],
    example: 'A library code directs each book to a shelf; collisions occur when multiple codes select the same shelf.',
    tip: 'Always compare the original key after hashing; equal table positions do not imply equal keys.',
  },
  sort: {
    how: 'The algorithm compares and rearranges values according to an ordering rule. Divide-and-conquer variants split the input, solve smaller subproblems, and combine their results.',
    strengths: ['Produces ordered data for later processing', 'Makes binary search possible', 'Exposes comparison and recursion clearly', 'Different algorithms fit different data properties'],
    limits: ['Time and memory costs vary by algorithm', 'Some variants are unstable', 'Poor pivot choices can hurt Quick Sort', 'Merge Sort requires auxiliary storage'],
    uses: ['Reports and rankings', 'Preparing data for binary search', 'Grouping duplicate values', 'Database and interface ordering'],
    example: 'Imagine arranging cards: the algorithm defines which cards to compare and where each one must move.',
    tip: 'Follow the real partition or merge operation; do not replace it with swaps from Bubble Sort.',
  },
  recursion: {
    how: 'A method solves a problem by calling itself with a smaller input. Every call has its own variables and remains on the call stack until its child call returns.',
    strengths: ['Expresses self-similar problems clearly', 'Matches trees and divide-and-conquer naturally', 'Keeps each subproblem focused', 'Makes the call hierarchy visible'],
    limits: ['A missing base case causes infinite recursion', 'Every call consumes stack space', 'Repeated subproblems can be expensive', 'Deep recursion can overflow the stack'],
    uses: ['Tree traversals', 'Divide-and-conquer algorithms', 'Backtracking', 'Mathematical definitions'],
    example: 'Opening nested boxes requires finishing the innermost box before returning through the earlier boxes.',
    tip: 'Verify both the base case and that every recursive call moves closer to it.',
  },
  backtracking: {
    how: 'The solver chooses a candidate, checks whether it is safe, explores recursively, and removes that choice when it cannot lead to a solution.',
    strengths: ['Systematically explores possible solutions', 'Rejects invalid partial solutions early', 'Models constraints directly', 'Can produce one or every valid solution'],
    limits: ['The search space can grow exponentially', 'A weak safety test wastes substantial work', 'State must be restored exactly when returning', 'Large inputs may require heuristics'],
    uses: ['Sudoku and N-Queens', 'Maze solving', 'Scheduling with constraints', 'Generating combinations and permutations'],
    example: 'At every intersection, mark one route; if it becomes impossible, return, erase the mark, and try another route.',
    tip: 'The undo step is essential: after a failed recursive call, restore the state before testing the next candidate.',
  },
  matrix: {
    how: 'Values are addressed by row and column. Dense matrices reserve every cell, while sparse representations store only non-zero entries and connect them through row and column lists.',
    strengths: ['Natural representation of tabular data', 'Direct access to known coordinates', 'Predictable row and column traversal', 'Supports many mathematical algorithms'],
    limits: ['Dense matrices reserve space for zero cells', 'Indices must remain within both dimensions', 'Whole-matrix operations use nested loops', 'Sparse links must remain synchronized'],
    uses: ['Images and game boards', 'Scientific calculations', 'Dynamic programming', 'Graph and recommendation data'],
    example: 'A spreadsheet cell is located using two coordinates: its row and its column.',
    tip: 'Keep row and column roles consistent and validate both indices before accessing a cell.',
  },
  specialized: {
    how: 'This structure combines carefully chosen values, links, or auxiliary rules so its main operations match the problem it was designed to solve.',
    strengths: ['Targets a specific family of problems', 'Makes its core invariant explicit', 'Can outperform general structures for its intended use', 'Provides a reusable data model'],
    limits: ['Its invariants must be preserved after every change', 'It may use additional metadata or references', 'It is not optimal for every workload', 'Boundary cases require deliberate testing'],
    uses: ['Algorithm design', 'Indexing and caching', 'Compilers and symbolic processing', 'Specialized data management'],
    example: 'Think of a purpose-built organizer whose compartments and links match exactly the operations you perform most often.',
    tip: 'State the invariant in one sentence before implementing an insertion or deletion.',
  },
};

function profileKey(algorithm) {
  const group = operationGroup(algorithm);
  if (['array', 'range'].includes(group)) return 'array';
  if (['list', 'skip', 'deque'].includes(group)) return 'list';
  if (group === 'stack') return 'stack';
  if (group === 'queue') return 'queue';
  if (['tree', 'threadedTree', 'trie', 'btree', 'merkle', 'spatial', 'expression', 'ast'].includes(group)) return 'tree';
  if (group === 'heap') return 'heap';
  if (['graph', 'shortestPath', 'union'].includes(group)) return 'graph';
  if (['hash', 'cache', 'bloom'].includes(group)) return 'hash';
  if (group === 'sort') return 'sort';
  if (['math', 'hanoi'].includes(group)) return 'recursion';
  if (['queens', 'maze', 'sudoku'].includes(group)) return 'backtracking';
  if (['matrix', 'sparseMatrix'].includes(group)) return 'matrix';
  return 'specialized';
}

const specialDetails = {
  'lista-doble': 'Its prev and next references allow traversal in both directions, but both neighboring links must be repaired after a change.',
  'lista-circular-simple': 'Its last node points back to head, so traversal stops when it returns to the starting node rather than when it finds null.',
  'lista-circular-doble': 'The last and first nodes connect through both next and prev; even a one-node list must show both circular relationships.',
  'arbol-enhebrado': 'Empty child references become inorder threads. A flag distinguishes a real child from a predecessor or successor thread.',
  avl: 'Every node tracks height and a balance factor. Rotations restore the valid range from -1 to 1 after an update.',
  'rojo-negro': 'Color rules and rotations keep every root-to-leaf path within a bounded height.',
  trie: 'Each edge represents a character and an end-of-word flag distinguishes a complete stored word from a shared prefix.',
  'bplus-tree': 'Internal nodes guide the search, while all records remain in linked leaves so ranges can be read sequentially.',
  'matriz-dispersa': 'AROW follows left from right to left and ACOL follows up from bottom to top. Both circular paths share the same non-zero node.',
  dijkstra: 'It always expands the unsettled position with the smallest known distance and only works with non-negative edge costs.',
  'a-star': 'It orders candidates by f = g + h, combining travelled cost with an estimate toward the goal.',
  'n-reinas': 'isSafe checks the column and both diagonals before a queen is placed in the current row.',
  sudoku: 'A candidate is valid only when it is absent from its row, column, and 3×3 box.',
  'bubble-sort': 'Each pass compares adjacent values and fixes one more position at the right. If a complete pass makes no swap, the algorithm stops early.',
  'selection-sort': 'Each pass scans the entire unsorted region, remembers its minimum index, and performs at most one final swap.',
  'insertion-sort': 'key preserves the value being inserted while larger values shift right; key is finally written at j + 1.',
  'merge-sort': 'It recursively sorts both halves and merges them by repeatedly selecting the smaller front value.',
  'quick-sort': 'Partition places values around a pivot, then recursion sorts the partitions independently.',
  'shell-sort': 'Gapped insertion passes move distant values first. The final gap of one completes a normal insertion ordering.',
  'heap-sort': 'It builds a max-heap, moves the root to the final region, reduces heapSize, and restores the heap after every extraction.',
  'counting-sort': 'It uses count[value - min], so this lesson also handles negative integers. Its usefulness depends on the numeric range k.',
  'radix-sort': 'Stable digit passes process units, tens, and higher positions. Subtracting the minimum creates non-negative keys without changing order.',
  'bogo-sort': 'It performs real Fisher–Yates shuffles until sorted. The lesson may omit intermediate frames, never forces the result with another sort, and limits practice to seven values so factorial behavior cannot freeze the browser.',
  polinomios: 'Terms remain ordered by exponent. Equal exponents are combined and zero coefficients are not stored.',
  'listas-generalizadas': 'A tag distinguishes atoms, sublists, and headers; link moves horizontally and dlink enters a nested list.',
  'union-find': 'Path compression shortens find paths and union by rank prevents unnecessarily tall trees.',
  'bloom-filter': 'Several hash functions set bits. A missing bit proves absence, while all bits set means only “possibly present.”',
};

export function getEnglishEducationalDescription(algorithm) {
  const profile = profiles[profileKey(algorithm)];
  const definition = getOperationDefinition(algorithm);
  const operations = definition.actions.map(action => translateOperationLabel(action.label, 'en'));
  while (operations.length < 4) operations.push(['Inspect the current state', 'Traverse the stored values', 'Validate the structure invariant', 'Reset the example'][operations.length]);
  const detail = specialDetails[algorithm.id];
  return {
    definition: `${algorithm.description} ${algorithm.name} is studied here as a data structure or algorithm with explicit state, operations, and rules that remain valid after every step.`,
    how: detail ? `${profile.how} ${detail}` : profile.how,
    operations,
    strengths: profile.strengths,
    limits: profile.limits,
    uses: profile.uses,
    example: profile.example,
    tip: detail ?? profile.tip,
  };
}
