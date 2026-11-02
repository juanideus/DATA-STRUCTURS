import { initialUnionRanks } from '../logic/operationMetadata.js';

export function seedAdvancedLinearExample(source, algorithm, cpp = false) {
  const values = algorithm.values ?? [];
  const access = cpp ? '->' : '.';
  let lines = [];
  if (algorithm.id === 'trie') {
    const type = cpp ? 'Node' : 'TrieNode';
    values.forEach((word, i) => {
      lines.push(`${cpp ? `${type}*` : type} seed${i} = root;`);
      for (const character of word) {
        const letter = character.charCodeAt(0) - 65;
        lines.push(`if (seed${i}${access}children[${letter}] == ${cpp ? 'nullptr' : 'null'}) seed${i}${access}children[${letter}] = new ${type}();`, `seed${i} = seed${i}${access}children[${letter}];`);
      }
      lines.push(`seed${i}${access}isWord = true;`);
    });
  } else if (algorithm.id === 'skip-list') {
    // A valid level-zero initial chain; randomized heights are illustrative.
    values.forEach((value, i) => lines.push(`${cpp ? 'Node*' : 'Node'} seed${i} = new Node(${value}${cpp ? ', 0' : ''});`, `${i ? `seed${i - 1}` : 'head'}${access}next[0] = seed${i};`));
    lines.push(`size = ${values.length};`);
  } else if (algorithm.id === 'lru-cache') {
    values.forEach((entry, i) => {
      const text = String(entry), colon = text.indexOf(':');
      const key = colon < 0 ? text : text.slice(0, colon);
      const value = colon < 0 ? text : text.slice(colon + 1);
      lines.push(`${cpp ? 'Node*' : 'Node'} seed${i} = new Node(${JSON.stringify(key)}, ${JSON.stringify(value)});`, cpp ? `insertInTable(seed${i});` : `cache.put(${JSON.stringify(key)}, seed${i});`, `addLast(seed${i});`);
    });
    if (cpp) lines.push(`size = ${values.length};`);
    const body = lines.map(line => `        ${line}`).join('\n');
    return source.replace(/LRUCache\(\)(?: : table\(new Node\*\[BUCKETS\]\{\}\))? \{[\s\S]*?\n    }/, `LRUCache()${cpp ? ' : table(new Node*[BUCKETS]{})' : ''} {\n${body}\n    }`);
  } else if (algorithm.id === 'union-find') {
    if (!cpp) {
      if (!algorithm.unionRanks || !source.includes('int[] rank')) return source;
      return source.replace(/(UnionFind\(\) \{[\s\S]*?)(\n    })/, (_, body, end) => `${body}\n${algorithm.unionRanks.map((rank, i) => `        rank[${i}] = ${rank};`).join('\n')}${end}`);
    }
    lines.push(`size = ${values.length};`);
    const ranks = algorithm.unionRanks ?? initialUnionRanks(values);
    values.forEach((parent, i) => lines.push(`parent[${i}] = ${parent};`, `rank[${i}] = ${ranks[i]};`));
    return source.replace('        loadInitialExample();', lines.map(line => `        ${line}`).join('\n'));
  } else return source;
  const name = source.match(/class (\w+)/)[1];
  const constructor = `${name}() {\n${lines.map(line => `        ${line}`).join('\n')}\n    }`;
  return cpp ? source.replace(`${name}() = default;`, constructor) : source.replace(/}\s*$/, `    ${constructor}\n}`);
}
