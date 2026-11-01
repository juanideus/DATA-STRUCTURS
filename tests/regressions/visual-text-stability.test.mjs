import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import test from 'node:test';

const visualizerCssPath = fileURLToPath(new URL('../../src/visualizer.css', import.meta.url));
const stylesCssPath = fileURLToPath(new URL('../../src/styles.css', import.meta.url));
const visualizerSourcePath = fileURLToPath(new URL('../../src/components/Visualizer.jsx', import.meta.url));
const textBearingActiveSelectors = new Set([
  '.tree-node.active', '.graph-node.active', '.child-bnode.splitting', '.root-bnode.promoting',
  '.trie-tree-node.active', '.maze-grid .current', '.chess-board>div.current', '.spatial-point.active',
  '.generalized-node.active', '.dense-matrix-cell.active', '.hanoi-scene .tower i.active.moving',
  '.recursion-call-node.current',
]);

async function parseStylesheet(path) {
  return postcss.parse(await readFile(path, 'utf8'), { from: path });
}

test('los estados activos mantienen escala estable para texto dentro de las visualizaciones', async () => {
  const roots = await Promise.all([visualizerCssPath, stylesCssPath].map(parseStylesheet));
  const foundSelectors = new Set();

  for (const root of roots) {
    root.walkRules(rule => {
      const selectors = rule.selectors ?? rule.selector.split(',').map(selector => selector.trim());
      for (const selector of selectors) {
        if (!textBearingActiveSelectors.has(selector)) continue;
        foundSelectors.add(selector);
        rule.walkDecls('transform', declaration => {
          assert.doesNotMatch(declaration.value, /scale\s*\(/i, `${selector} must not scale its text`);
        });
      }
    });
  }

  assert.deepEqual([...foundSelectors].sort(), [...textBearingActiveSelectors].sort());
});

test('las animaciones de nodos conservan el movimiento con énfasis de borde y no de escala', async () => {
  const root = await parseStylesheet(visualizerCssPath);
  const keyframes = new Map();
  root.walkAtRules('keyframes', atRule => {
    keyframes.set(atRule.params, atRule);
  });

  for (const name of ['heapMoveToRoot', 'leafSplit', 'parentReceives', 'hanoiMovePulse']) {
    const keyframe = keyframes.get(name);
    assert.ok(keyframe, `missing ${name} animation`);
    keyframe.walkDecls('transform', declaration => {
      assert.doesNotMatch(declaration.value, /scale\s*\(/i, `${name} must not scale labels`);
    });
  }

  let splitAnimation = false;
  root.walkRules('.child-bnode.splitting', rule => {
    rule.walkDecls('animation', declaration => {
      splitAnimation ||= declaration.value.includes('leafSplit');
    });
  });
  assert.equal(splitAnimation, true, 'B-tree split should still animate its focus ring');
});

test('los conectores del árbol roscado se calculan con el tamaño fijo de nodo', async () => {
  const source = await readFile(visualizerSourcePath, 'utf8');
  assert.match(source, /return \(nodeWidth \/ 2 \+ 14\) \* 100 \/ Math\.min\(x, 100 - x\)/);
  assert.match(source, /const radiusX = \(node\.header \? 68 : nodeWidth\) \/ 2 \+ 2/);
  assert.doesNotMatch(source, /nodeWidth\s*\*\s*1\.12|id === step \? 1\.12/);
});
