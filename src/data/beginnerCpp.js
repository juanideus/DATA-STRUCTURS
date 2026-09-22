import { getLinearCpp } from './linearCpp.js';
import { getLinkedListCpp } from './linkedListCpp.js';
import { getSortingCpp } from './sortingCpp.js';
import { getHeapCpp } from './heapCpp.js';
import { getRecursionCpp } from './recursionCpp.js';
import { getGraphCpp } from './graphCpp.js';
import { getDenseMatrixCpp, getSparseMatrixCpp } from './matrixCpp.js';
import { getHashCpp } from './hashCpp.js';
import { getOtherCpp } from './otherCpp.js';
import { getBacktrackingCpp } from './backtrackingCpp.js';
import { getHanoiCpp } from './hanoiCpp.js';
import { getPolynomialCpp } from './polynomialCpp.js';
import { getTreeCpp } from './treeCpp.js';
import { getSkipListCpp } from './advancedLinearCpp.js';
import { getMoreTreesCpp } from './moreTreesCpp.js';
import { getSpecialTreesCpp } from './specialTreesCpp.js';
import { getThreadedTreeCpp } from './threadedTreeCpp.js';
import { getPathfindingCpp } from './pathfindingCpp.js';
import { getSpatialTreesCpp } from './spatialTreesCpp.js';
import { getExpressionAstCpp } from './expressionAstCpp.js';
import { getGeneralizedListCpp } from './generalizedListCpp.js';
import { getRedBlackCpp } from './redBlackCpp.js';
import { getFibonacciHeapCpp } from './fibonacciHeapCpp.js';
import { getMultiwayTreesCpp } from './multiwayTreesCpp.js';

export function getBeginnerCpp(algorithm, actionId) {
  const source = getLinearCpp(algorithm.id, actionId)
    ?? getLinkedListCpp(algorithm.id, actionId)
    ?? getSortingCpp(algorithm.id, actionId)
    ?? getHeapCpp(algorithm.id, actionId)
    ?? getRecursionCpp(algorithm.id, actionId)
    ?? getGraphCpp(algorithm.id, actionId)
    ?? (algorithm.id === 'matriz' ? getDenseMatrixCpp(actionId) : null)
    ?? (algorithm.id === 'matriz-dispersa' ? getSparseMatrixCpp(actionId) : null)
    ?? getHashCpp(algorithm.id, actionId)
    ?? getOtherCpp(algorithm.id, actionId)
    ?? getBacktrackingCpp(algorithm.id, actionId)
    ?? (algorithm.id === 'hanoi' ? getHanoiCpp(actionId) : null)
    ?? (algorithm.id === 'polinomios' ? getPolynomialCpp(actionId) : null)
    ?? getTreeCpp(algorithm.id, actionId)
    ?? (algorithm.id === 'skip-list' ? getSkipListCpp(actionId) : null)
    ?? getMoreTreesCpp(algorithm.id, actionId)
    ?? getSpecialTreesCpp(algorithm.id, actionId)
    ?? (algorithm.id === 'arbol-enhebrado' ? getThreadedTreeCpp(actionId) : null)
    ?? getPathfindingCpp(algorithm.id, actionId)
    ?? getSpatialTreesCpp(algorithm.id, actionId)
    ?? getExpressionAstCpp(algorithm.id, actionId)
    ?? (algorithm.id === 'listas-generalizadas' ? getGeneralizedListCpp(actionId) : null)
    ?? (algorithm.id === 'rojo-negro' ? getRedBlackCpp(actionId) : null)
    ?? (algorithm.id === 'fibonacci-heap' ? getFibonacciHeapCpp(actionId) : null)
    ?? getMultiwayTreesCpp(algorithm.id, actionId);

  if (!source) {
    throw new Error(`No existe código C++ para ${algorithm.id}/${actionId}.`);
  }
  return source;
}
