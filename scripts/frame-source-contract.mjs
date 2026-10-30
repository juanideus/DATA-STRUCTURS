import { getRedBlackCodeLine } from '../src/logic/redBlackCodeMapping.js';

/** Raw operation frames must either name a real source location or explicitly
 * describe a state summary that does not highlight executable code. */
export function hasValidFrameSourceReference(frame, source) {
  if (!frame || typeof source !== 'string') return false;
  if (frame.traceMode === 'summary') {
    return frame.codeLine === null && frame.codeNeedle == null;
  }
  if (frame.redBlackEvent) {
    const resolved = getRedBlackCodeLine(source, frame.redBlackEvent);
    return Number.isInteger(resolved) && resolved >= 0 && resolved < source.split('\n').length;
  }
  const lineCount = source.split('\n').length;
  const hasValidLine = Number.isInteger(frame.codeLine)
    && frame.codeLine >= 0 && frame.codeLine < lineCount;
  const hasValidNeedle = typeof frame.codeNeedle === 'string'
    && frame.codeNeedle.length > 0 && source.includes(frame.codeNeedle);
  return hasValidLine || hasValidNeedle;
}
