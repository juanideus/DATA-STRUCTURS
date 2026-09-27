// Match the 32-bit overflow of Java int and C++ unsigned int bit for bit.
export const merkleHash = value => {
  let hash = 7;
  for (const character of String(value)) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return hash;
};

export const combineMerkleHashes = (left, right) => (Math.imul(left, 31) + right) >>> 0;
export const formatMerkleHash = hash => `0x${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;

export function merkleLevels(values) {
  if (!values.length) return [];
  const levels = [values.map((value, index) => ({
    hash: merkleHash(value), label: String(value), start: index, end: index,
  }))];
  while (levels.at(-1).length > 1) {
    const previous = levels.at(-1);
    const next = [];
    for (let index = 0; index < previous.length; index += 2) {
      const left = previous[index];
      const right = previous[index + 1] ?? left;
      next.push({
        hash: combineMerkleHashes(left.hash, right.hash),
        label: `${left.label}+${right.label}`,
        start: left.start,
        end: right.end,
      });
    }
    levels.push(next);
  }
  return levels;
}
