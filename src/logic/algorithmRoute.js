import { algorithmsById } from '../data/algorithms.js';
import { algorithmIdFromPath } from '../seo.js';

const legacyAlgorithmIds = new Map([
  ['memoria-referencias', 'punteros-referencias'],
  ['punteros-referencias-java', 'punteros-referencias'],
]);

export const resolveLegacyAlgorithmId = id => legacyAlgorithmIds.get(id) ?? id;

export function algorithmIdFromLocation() {
  if (typeof window === 'undefined') return null;
  try {
    const pathCandidate = algorithmIdFromPath(window.location.pathname);
    const resolvedPath = resolveLegacyAlgorithmId(pathCandidate);
    if (algorithmsById.has(resolvedPath)) return resolvedPath;

    // Mantiene compatibilidad con enlaces antiguos como /#/avl.
    const candidate = decodeURIComponent(window.location.hash.replace(/^#\/?/, '').trim());
    const resolvedHash = resolveLegacyAlgorithmId(candidate);
    return algorithmsById.has(resolvedHash) ? resolvedHash : null;
  } catch {
    return null;
  }
}
