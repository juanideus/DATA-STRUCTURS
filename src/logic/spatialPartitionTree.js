export const SPATIAL_NODE_CAPACITY = 2;
const MAX_DEPTH = 8;

const dimensionsFor = kind => kind === 'octree' ? 3 : 2;
const rootBounds = dimensions => Array.from({ length: dimensions }, () => [-100, 100]);
const makeNode = (bounds, depth = 0) => ({ bounds, depth, points: [], children: null });
const midpoint = ([minimum, maximum]) => (minimum + maximum) / 2;
const pointKey = point => point.join(',');

export function parseSpatialPoint(raw, kind) {
  const coordinates = String(raw ?? '').split(',').map(Number);
  const dimensions = dimensionsFor(kind);
  return coordinates.length === dimensions
    && coordinates.every(value => Number.isInteger(value) && value >= -100 && value < 100)
    ? coordinates : null;
}

function childIndex(node, point) {
  return point.reduce((index, coordinate, axis) => (
    index | (coordinate >= midpoint(node.bounds[axis]) ? 1 << axis : 0)
  ), 0);
}

function subdivide(node, dimensions) {
  node.children = Array.from({ length: 1 << dimensions }, (_, index) => makeNode(
    node.bounds.map((bounds, axis) => (
      index & (1 << axis)
        ? [midpoint(bounds), bounds[1]]
        : [bounds[0], midpoint(bounds)]
    )),
    node.depth + 1,
  ));
  const previous = node.points;
  node.points = [];
  previous.forEach(point => insertInto(node.children[childIndex(node, point)], point, dimensions));
}

function insertInto(node, point, dimensions) {
  if (!node.children && node.points.length < SPATIAL_NODE_CAPACITY) {
    node.points.push(point);
    return;
  }
  if (!node.children) {
    if (node.depth >= MAX_DEPTH) throw new Error('Los puntos quedan demasiado juntos para mostrarlos en ocho niveles.');
    subdivide(node, dimensions);
  }
  insertInto(node.children[childIndex(node, point)], point, dimensions);
}

function matchingLeaf(root, point) {
  let node = root;
  while (node.children) node = node.children[childIndex(node, point)];
  return node;
}

export function createSpatialPartitionTree(kind, values = [], previousSnapshot = null) {
  const dimensions = dimensionsFor(kind);
  const root = previousSnapshot
    ? JSON.parse(JSON.stringify(previousSnapshot))
    : makeNode(rootBounds(dimensions));

  if (!previousSnapshot) values.forEach(value => {
    const point = parseSpatialPoint(value, kind);
    if (point) insertInto(root, point, dimensions);
  });

  return {
    contains(raw) {
      const point = parseSpatialPoint(raw, kind);
      if (!point) return false;
      return matchingLeaf(root, point).points.some(current => pointKey(current) === pointKey(point));
    },
    insert(raw) {
      const point = parseSpatialPoint(raw, kind);
      if (!point || this.contains(raw)) return false;
      insertInto(root, point, dimensions);
      return true;
    },
    remove(raw) {
      const point = parseSpatialPoint(raw, kind);
      if (!point) return false;
      const leaf = matchingLeaf(root, point);
      const index = leaf.points.findIndex(current => pointKey(current) === pointKey(point));
      if (index < 0) return false;
      leaf.points.splice(index, 1);
      return true;
    },
    preorder() {
      const nodes = [];
      const visit = (node, path) => {
        nodes.push({ path, depth: node.depth, pointCount: node.points.length, divided: Boolean(node.children) });
        node.children?.forEach((child, index) => visit(child, `${path}.${index}`));
      };
      visit(root, 'root');
      return nodes;
    },
    snapshot() { return JSON.parse(JSON.stringify(root)); },
  };
}
