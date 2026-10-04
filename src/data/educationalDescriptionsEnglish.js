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
    how: 'A sorting algorithm rearranges values into a chosen order. Depending on the method, it may compare values, count occurrences, process digits, or move values through a heap or temporary storage.',
    strengths: ['Produces ordered data for later processing', 'Makes binary search possible', 'Offers different trade-offs for different data sets'],
    limits: ['Time and memory costs depend on the chosen algorithm', 'Some methods do not preserve the order of equal values', 'A slow method can be impractical for large inputs'],
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

// These lessons need their own explanation: the generic family profile would
// describe operations or performance that the code shown on the page does not use.
const specificGuides = {
  bfs: {
    definition: 'Breadth-First Search explores a graph level by level using a queue.',
    how: 'The starting vertex is marked and enqueued. BFS repeatedly removes the vertex at the front, visits each unvisited neighbor, marks that neighbor immediately, and enqueues it. Marking on enqueue prevents the same vertex from entering the queue more than once.',
    operations: ['Mark and enqueue the starting vertex', 'Dequeue the next pending vertex', 'Inspect its adjacent vertices', 'Mark and enqueue every unvisited neighbor'],
    strengths: ['Visits every reachable vertex in O(V + E) with adjacency lists', 'Finds minimum-edge paths in an unweighted graph', 'Processes vertices in increasing distance from the start'],
    limits: ['The queue can hold many vertices on wide graphs', 'It does not minimize weighted path cost', 'Cycles require an explicit visited set'],
    uses: ['Shortest paths in unweighted graphs', 'Level-order exploration', 'Network reachability', 'Finding degrees of separation'],
    example: 'Like ripples spreading from one point, BFS reaches all vertices one edge away before vertices two edges away.',
    tip: 'Mark a neighbor when it is enqueued, not when it is later removed, so it cannot be queued repeatedly.',
  },
  dijkstra: {
    definition: 'Dijkstra finds the shortest path from a starting cell when every movement cost is non-negative.',
    how: 'The grid is treated as a graph: each walkable cell connects to its four adjacent cells. Distances start at infinity except for the start. At each step, the algorithm settles the reachable cell with the lowest known cost and relaxes its neighbors. Previous-cell references reconstruct the route to the goal.',
    operations: ['Initialize the distances', 'Choose the unsettled cell with the lowest distance', 'Relax its walkable neighbors', 'Follow previous cells to reconstruct the route'],
    strengths: ['Finds an optimal route with non-negative costs', 'Keeps the shortest known distance to every reachable cell', 'Works with different non-negative movement costs'],
    limits: ['Negative movement costs invalidate the method', 'This array-scan version takes O((R · C)²) time', 'It may explore much of the grid before reaching the goal'],
    uses: ['Road and grid routing', 'Network routing', 'Minimum-cost planning'],
    example: 'From every reachable intersection, continue first from the one with the lowest known travel cost.',
    tip: 'A blocked cell has a negative map value here; walkable cells have non-negative costs. Relax a neighbor only when the new route is cheaper.',
  },
  'a-star': {
    definition: 'A* finds a minimum-cost route by combining the cost already travelled with an estimate of the distance to the goal.',
    how: 'For each open grid cell, g is the cost from the start, h is its Manhattan distance to the goal, and f = g + h. A* expands the open cell with the lowest f, checks its four walkable neighbors, and stores a predecessor whenever it improves g. Unit movement costs make Manhattan distance an admissible estimate on this map.',
    operations: ['Set the starting g value to zero', 'Calculate the Manhattan estimate h', 'Choose the open cell with the lowest f', 'Relax neighbors and reconstruct the route'],
    strengths: ['Targets a specific goal', 'Can visit fewer cells than Dijkstra', 'Keeps an optimal route with this admissible heuristic'],
    limits: ['Open and closed cells require extra memory', 'An overestimating heuristic can lose optimality', 'A weak heuristic may offer little advantage over Dijkstra'],
    uses: ['Grid navigation', 'Game character movement', 'Robot route planning'],
    example: 'g records how far you have walked; h estimates what remains; f helps choose the next cell.',
    tip: 'With h = 0, A* behaves like Dijkstra. On this unit-cost four-direction grid, Manhattan distance does not overestimate.',
  },
  'bubble-sort': {
    definition: 'Bubble Sort compares adjacent values and swaps a pair only when the left value is larger.',
    how: 'One pass compares neighbors from left to right and moves the largest remaining value to the end. The next pass stops one position earlier. A changed flag ends the algorithm as soon as a complete pass makes no swap.',
    operations: ['Compare values[i] with values[i + 1]', 'Swap adjacent values in the wrong order', 'Shorten the unsorted range after each pass', 'Stop early if a pass makes no swap'],
    strengths: ['Uses only constant extra space', 'Preserves the order of equal values', 'Finishes in O(n) on already sorted input with the changed flag'],
    limits: ['Average and worst-case time are O(n²)', 'Makes many comparisons and swaps', 'Is inefficient for large collections'],
    uses: ['Teaching nested loops', 'Visualizing comparisons and swaps', 'Very small data sets'],
    example: 'In [5, 2, 4], swap 5 with 2 and then with 4; the 5 reaches the end of the pass.',
    tip: 'A comparison decides whether to swap; the values change only in the following assignment steps.',
  },
  'selection-sort': {
    definition: 'Selection Sort repeatedly selects the smallest value in the unsorted region and places it at its front.',
    how: 'For each position i, scan positions i + 1 through the end to find the smallest value. After the scan, swap it with the value at i only if they differ. The sorted prefix grows by one after every pass.',
    operations: ['Choose the start of the unsorted region', 'Scan for its minimum value', 'Swap the minimum into position i if needed', 'Advance the sorted boundary'],
    strengths: ['Uses only constant extra space', 'Performs at most one swap per pass', 'Makes the sorted and unsorted regions easy to visualize'],
    limits: ['Always makes O(n²) comparisons, even on sorted input', 'The swap can change the order of equal values', 'Is slow for large collections'],
    uses: ['Teaching minimum selection', 'Small in-place sorting examples', 'Cases where writes are more costly than comparisons'],
    example: 'From [5, 2, 4], find 2 in the unsorted region and swap it with 5; then select 4 for the next position.',
    tip: 'Do not swap whenever a smaller value is found during the scan: remember its index and swap once after the inner loop.',
  },
  'matriz-dispersa': {
    definition: 'A Sparse Matrix stores only non-zero cells as nodes shared by a circular row list and a circular column list.',
    how: 'AROW holds one circular header per row and follows left from higher to lower column indices. ACOL holds one circular header per column and follows up from higher to lower row indices. Each non-zero cell is a single node linked into both lists. In C++, both header arrays and all nodes use dynamic memory.',
    operations: ['Find the insertion point in AROW', 'Find the insertion point in ACOL', 'Link one node into both circular lists', 'Remove the node from both lists'],
    strengths: ['Stores only non-zero cells', 'Traverses a selected row without scanning the whole matrix', 'Traverses a selected column without scanning the whole matrix'],
    limits: ['Finding a coordinate requires traversing its row', 'Each node needs both left and up references', 'Insertion and removal must keep AROW and ACOL synchronized'],
    uses: ['Sparse adjacency matrices', 'Scientific matrices with many zeros', 'Large sparse data sets'],
    example: 'Record only occupied city blocks, but list each block by both its street and its avenue.',
    tip: 'Stop a traversal when it returns to its circular header, not when it reaches null. A coordinate lookup is not constant-time in this representation.',
  },
  'skip-list': {
    definition: 'A Skip List is a sorted linked list with extra levels of forward links that let a search skip over groups of values.',
    how: 'Level 0 contains every value. Starting at the highest occupied level, search moves right while the next value is smaller than the target, then drops one level. Insertion chooses the new node’s height at random and repairs the forward links at every level it occupies.',
    strengths: ['Expected O(log n) search and insertion', 'Maintains sorted values without tree rotations', 'Level 0 always supports a complete ordered traversal'],
    limits: ['The worst case is O(n)', 'Extra forward links use memory', 'The chosen random levels affect the shape of the structure'],
    uses: ['Ordered in-memory indexes', 'Sorted sets', 'Concurrent indexing designs'],
    example: 'Think of express lanes above a local road: travel far on the top lane, then descend to reach an exact address.',
    tip: 'Follow the downward search path; the value is confirmed only after checking the next node on level 0.',
  },
  'segment-tree': {
    definition: 'A Segment Tree stores summaries of nested array intervals so a range can be queried without scanning every element.',
    how: 'The root covers the whole array and each child covers half of its parent’s interval. A range query skips disjoint nodes and combines fully covered nodes. Updating one position recomputes only its ancestors. This lesson does not implement lazy propagation.',
    strengths: ['Range sum and minimum queries in O(log n)', 'Point updates in O(log n)', 'Supports associative summaries over intervals'],
    limits: ['Uses more memory than the input array', 'Inclusive boundaries need careful handling', 'Range updates require an additional technique such as lazy propagation'],
    uses: ['Changing statistics over intervals', 'Range sums and minima', 'Competitive programming'],
    example: 'Instead of recounting every page, combine the summaries of the few chapters that cover the requested pages.',
    tip: 'A node contributes its stored summary only when its entire interval is inside the query; otherwise inspect its children.',
  },
  'fenwick-tree': {
    definition: 'A Fenwick Tree, or Binary Indexed Tree, stores partial sums that make prefix sums and point updates fast.',
    how: 'The internal BIT is one-based: cell i summarizes a block of length i & -i. Updating a visible array position adds a delta to every BIT block containing it; a range sum is the difference of two prefix sums. The displayed prefix minimum is computed by scanning the values, not by the sum BIT.',
    strengths: ['Prefix sums and additive point updates in O(log n)', 'Only O(n) auxiliary storage', 'A range sum follows from two prefix sums'],
    limits: ['The internal one-based indices differ from the displayed zero-based array', 'Prefix minimum is O(n) in this lesson', 'A sum BIT cannot answer minimum queries by subtracting prefixes'],
    uses: ['Dynamic frequencies', 'Prefix and range sums', 'Inversion counting'],
    example: 'Each BIT cell keeps the subtotal of a particular block ending at its index.',
    tip: 'When updating, enter a delta rather than the replacement value; when querying a prefix, move toward zero with i -= i & -i.',
  },
  quadtree: {
    definition: 'A QuadTree indexes two-dimensional points by recursively dividing a region into four quadrants.',
    how: 'A region holds points until it reaches capacity. It then splits into northwest, northeast, southwest, and southeast children, redistributes its points, and inserts the new point into the child containing its X and Y coordinates. Only occupied paths need further subdivision.',
    strengths: ['Adapts detail to where points are concentrated', 'Can skip entire irrelevant regions', 'Represents sparse 2D spaces naturally'],
    limits: ['Concentrated points can make the tree deep', 'Points on a boundary need a consistent ownership rule', 'Moving points may require removal and reinsertion'],
    uses: ['2D maps', 'Spatial searches', 'Collision detection'],
    example: 'Divide a map into four tiles and keep dividing only tiles that contain too many points.',
    tip: 'Track the selected quadrant at each level; the displayed point must end in the leaf whose bounds contain its coordinates.',
  },
  octree: {
    definition: 'An Octree indexes three-dimensional points by recursively dividing a cube into eight octants.',
    how: 'A leaf holds points up to its capacity. When full, it splits X, Y, and Z at their midpoints, creates eight children, and redistributes the existing points. A new point descends through the octant containing all three coordinates.',
    strengths: ['Adapts to sparse 3D spaces', 'Can discard large empty volumes', 'Supports spatial grouping at several scales'],
    limits: ['Deep subdivisions need more references', 'Boundary coordinates require a consistent rule', 'Moving points may need reinsertion'],
    uses: ['3D scenes and voxels', 'Robotics', 'Collision searches'],
    example: 'Divide a room into eight smaller boxes, then repeat only inside boxes that become crowded.',
    tip: 'Unlike a QuadTree, each choice uses X, Y, and Z; check all three when following a point into an octant.',
  },
  'hash-table': {
    definition: 'A Hash Table maps a key to an array position, then compares the original key to identify the correct entry.',
    how: 'This lesson uses a fixed array of 12 slots with linear probing. When the hashed slot is occupied, insertion checks consecutive slots and wraps around. Lookup follows the same path; deletion leaves a tombstone so a displaced key remains reachable. Separate Chaining uses a different collision strategy.',
    strengths: ['Expected constant-time exact lookup', 'Compact array-backed storage', 'Shows how a collision changes the search path'],
    limits: ['The displayed table has a fixed capacity and does not rehash', 'Linear probing can form clusters', 'Worst-case lookup is O(n)'],
    uses: ['Dictionaries', 'Frequency counters', 'Lookup tables'],
    example: 'A library code picks the first shelf to inspect; if that shelf is taken, check the following shelves in order.',
    tip: 'The hash gives a starting slot, not proof of a match: compare the stored key and keep probing when needed.',
  },
  'hash-open': {
    definition: 'Open Addressing keeps every hash-table entry inside the table array and resolves collisions by probing other slots.',
    how: 'This implementation uses linear probing: after the hashed slot, it checks consecutive slots and wraps around at the end. Search follows the same sequence. Deletion leaves a tombstone so it cannot hide a displaced key; a later insertion may reuse that slot.',
    strengths: ['Entries need no linked nodes', 'Nearby probes have good memory locality', 'The fixed table makes collisions visible'],
    limits: ['Performance falls as the table fills', 'Linear probing can form clusters', 'A deleted slot cannot simply become never-used'],
    uses: ['Compact lookup tables', 'In-memory maps', 'Teaching collision resolution'],
    example: 'If the assigned locker is taken, check the next locker, wrapping around when you reach the last one.',
    tip: 'Stop a failed search at a never-used slot, not at a tombstone; a key may have been displaced beyond it.',
  },
  'hash-chaining': {
    definition: 'Separate Chaining handles hash collisions by storing multiple entries in the bucket selected by their hash.',
    how: 'The hash selects a bucket, not a unique entry. Each bucket has a linked chain; insertion attaches an entry there, while lookup and deletion compare keys within that chain. A collision does not require searching other array slots or leaving tombstones.',
    strengths: ['Collisions do not exhaust a probing sequence', 'Deletion can unlink an entry directly', 'Buckets can grow as more keys collide'],
    limits: ['Each node needs a link and separate allocation', 'Poor distribution creates long chains', 'Worst-case lookup remains O(n)'],
    uses: ['In-memory dictionaries', 'Symbol tables', 'Grouping entries by hash bucket'],
    example: 'One numbered locker holds a short list of entries whose keys led to the same locker.',
    tip: 'After selecting a bucket, compare the full key of each entry; a shared hash position does not make two keys equal.',
  },
  prim: {
    definition: 'Prim builds a minimum spanning tree of a connected, undirected, weighted graph.',
    how: 'Starting from one vertex, it records the cheapest known connection and parent for each outside vertex. Each round scans those values, adds the cheapest reachable vertex, and updates its neighbors. The displayed matrix-based code runs in O(V²); it does not use a priority queue.',
    strengths: ['Produces a minimum-cost spanning tree', 'The matrix-based version is straightforward for dense graphs', 'Each update shows which edge improves a connection'],
    limits: ['A disconnected graph cannot produce one spanning tree', 'It applies to undirected graphs', 'A spanning tree is not a shortest-path tree'],
    uses: ['Network cabling', 'Connecting facilities', 'Minimum-cost infrastructure'],
    example: 'Keep expanding a network using the cheapest cable that reaches a place not yet connected.',
    tip: 'The chosen edge must cross from the existing tree to a vertex outside it; otherwise it would create a cycle.',
  },
  'union-find': {
    definition: 'Union-Find maintains disjoint groups and quickly checks whether two elements have the same representative.',
    how: 'Every element points to a parent. Find follows parents to the root and compresses that path on return. Union links two different roots by rank. Rank approximates tree height, not group size, and increases only when two equal-rank roots are joined.',
    strengths: ['Near-constant amortized find and union', 'Compact representation of changing connectivity', 'Useful for rejecting cycles in Kruskal'],
    limits: ['It does not directly split groups', 'It does not reveal a path between elements', 'Comparing immediate parents is not enough to test connectivity'],
    uses: ['Kruskal’s algorithm', 'Cycle detection', 'Dynamic connectivity'],
    example: 'Each group has a representative; two people belong together when following their parent links reaches the same root.',
    tip: 'Compare find(a) and find(b), not parent[a] and parent[b].',
  },
  'lru-cache': {
    definition: 'An LRU Cache evicts the least recently used entry when its fixed capacity is reached.',
    how: 'A hash table finds a key while a doubly linked list records usage order. In this implementation, head is the least recent entry and tail is the most recent. A successful get or an update moves its node to the tail; a miss leaves the order unchanged. Eviction removes the head from both the list and the table.',
    strengths: ['Expected O(1) get and put', 'Makes recent accesses quick to retain', 'Combines a map with an explicit usage order'],
    limits: ['Nodes and hash entries use extra memory', 'Every successful access changes the list', 'Recency is not always a good predictor of future use'],
    uses: ['Page and image caches', 'Expensive computed results', 'Memory-bounded lookup tables'],
    example: 'Keep recently used books within reach; when the shelf is full, remove the book untouched for the longest time.',
    tip: 'In this lesson, read the list from oldest at head to newest at tail; the evicted key must disappear from both structures.',
  },
};

export function getEnglishEducationalDescription(algorithm) {
  const profile = profiles[profileKey(algorithm)];
  const definition = getOperationDefinition(algorithm);
  const specific = specificGuides[algorithm.id];
  const operations = specific?.operations ?? definition.actions.map(action => translateOperationLabel(action.label, 'en'));
  while (operations.length < 4) operations.push(['Inspect the current state', 'Traverse the stored values', 'Validate the structure invariant', 'Reset the example'][operations.length]);
  const detail = specialDetails[algorithm.id];
  return {
    definition: specific?.definition ?? algorithm.description,
    how: specific?.how ?? (detail ? `${profile.how} ${detail}` : profile.how),
    operations,
    strengths: specific?.strengths ?? profile.strengths,
    limits: specific?.limits ?? profile.limits,
    uses: specific?.uses ?? profile.uses,
    example: specific?.example ?? profile.example,
    tip: specific?.tip ?? detail ?? profile.tip,
  };
}
