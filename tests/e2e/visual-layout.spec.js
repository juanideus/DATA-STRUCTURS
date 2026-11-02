import { expect, test } from '@playwright/test';
import { graphEdgesFor } from '../../src/data/graphDesigns.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dsa-intro-seen', 'true');
    localStorage.setItem('dsa-language', 'es');
  });
});

for (const width of [1280, 320]) {
  test(`diagramas conservan etiquetas completas y legibles a ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    if (width === 320) {
      await page.addInitScript(() => localStorage.setItem('dsa-accessibility-preferences-v1', JSON.stringify({
        fontScale: 'extra-large', darkMode: true, reduceMotion: true,
      })));
    }
    for (const id of ['trie', 'suffix-tree']) {
      await page.goto(`/${id}`);
      const scroller = page.locator('.trie-tree-scroll');
      await expect(scroller).toBeVisible();
      await expect(page.locator('.canvas-grid')).toHaveCSS('height', '480px');
      expect(await page.locator('.trie-tree-visual').evaluate(root => {
        const canvas = root.parentElement.getBoundingClientRect();
        return [...root.querySelectorAll(':scope>.tree-kind-label,:scope>.trie-legend')].every(element => {
          const rect = element.getBoundingClientRect();
          return rect.left >= canvas.left && rect.right <= canvas.right && rect.bottom <= canvas.bottom;
        });
      })).toBe(true);
      const bounds = await scroller.evaluate(root => {
        const scene = root.querySelector('.trie-tree-canvas').getBoundingClientRect();
        return [...root.querySelectorAll('.trie-tree-node small')].map(label => {
          const rect = label.getBoundingClientRect();
          return { left: rect.left - scene.left, right: scene.right - rect.right, bottom: scene.bottom - rect.bottom, font: parseFloat(getComputedStyle(label).fontSize) };
        });
      });
      expect(bounds.length).toBeGreaterThan(0);
      for (const label of bounds) {
        expect(label.left).toBeGreaterThanOrEqual(0);
        expect(label.right).toBeGreaterThanOrEqual(0);
        expect(label.bottom).toBeGreaterThanOrEqual(0);
        expect(label.font).toBeGreaterThanOrEqual(9);
      }
      await scroller.focus();
      await expect(scroller).toBeFocused();
      if (id === 'trie') {
        await page.getByLabel('Palabra', { exact: true }).fill('PROGRAMA');
        await page.getByRole('button', { name: 'Insertar palabra', exact: true }).click();
        await expect(page.locator('.operation-message')).toHaveClass(/running/);
        const pause = page.getByRole('button', { name: 'Pausar', exact: true });
        if (await pause.isVisible()) await pause.click();
        await expect(scroller.locator('.terminal.active')).toHaveCount(0);
        const next = page.getByRole('button', { name: 'Siguiente', exact: true });
        for (let step = 0; step < 100 && await next.isEnabled(); step++) await next.click();
        await expect(page.locator('.operation-message')).toHaveClass(/success/);
        await expect(scroller.locator('.terminal.active')).toHaveAttribute('data-trie-prefix', 'PROGRAMA');
        const visible = await scroller.evaluate(root => {
          const rect = root.getBoundingClientRect(), label = root.querySelector('.terminal.active small').getBoundingClientRect();
          return label.left >= rect.left - 1 && label.right <= rect.right + 1 && label.top >= rect.top - 1 && label.bottom <= rect.bottom + 1;
        });
        expect(visible).toBe(true);
        expect(await scroller.evaluate(root => root.scrollTop)).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }

    await page.goto('/fenwick-tree');
    const fenwick = page.locator('.fenwick-scroll');
    await expect(fenwick.locator('.fenwick-column')).toHaveCount(8);
    for (const label of await fenwick.locator('small').evaluateAll(labels => labels.map(label => parseFloat(getComputedStyle(label).fontSize)))) expect(label).toBeGreaterThanOrEqual(9);
    await fenwick.focus();
    await fenwick.press('ArrowRight');
    await expect.poll(() => fenwick.evaluate(root => root.scrollLeft)).toBeGreaterThan(0);
    await page.getByLabel('Valor / delta', { exact: true }).fill('2147483600');
    await page.getByLabel('Índice / límite', { exact: true }).fill('0');
    await page.getByRole('button', { name: 'Actualizar índice', exact: true }).click();
    const pause = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await pause.isVisible()) await pause.click();
    const next = page.getByRole('button', { name: 'Siguiente', exact: true });
    for (let i = 0; i < 80 && await next.isEnabled(); i++) await next.click();
    await expect(page.locator('.operation-message')).toHaveClass(/success/);
    const overflowingValues = await fenwick.locator('.fenwick-bar strong').evaluateAll(labels => labels.flatMap(label => {
      const rect = label.getBoundingClientRect(), bar = label.parentElement.getBoundingClientRect();
      return rect.left >= bar.left && rect.right <= bar.right ? [] : [{ value: label.textContent, textWidth: rect.width, barWidth: bar.width }];
    }));
    expect(overflowingValues).toEqual([]);

    for (const id of ['dijkstra', 'a-star']) {
      await page.goto(`/${id}`);
      const markers = page.locator('.path-map-marker');
      await expect(markers).toHaveCount(2);
      const bounds = await markers.evaluateAll(elements => elements.map(element => {
        const label = element.querySelector('span').getBoundingClientRect();
        const map = element.parentElement.getBoundingClientRect();
        return { size: element.getBoundingClientRect().width, height: label.height, left: label.left - map.left, right: map.right - label.right };
      }));
      for (const marker of bounds) {
        expect(marker.size).toBeGreaterThanOrEqual(16);
        expect(marker.height).toBeGreaterThanOrEqual(10);
        expect(marker.left).toBeGreaterThanOrEqual(0);
        expect(marker.right).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test(`grafo dirigido conserva nodos y extremos de aristas a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/grafo-dirigido');
    const canvas = page.locator('.graph-design-grafo-dirigido');
    await expect(canvas.locator('.graph-node')).toHaveCount(6);
    const geometryMatches = () => canvas.evaluate((root, edges) => {
      const rect = root.getBoundingClientRect();
      const nodes = [...root.querySelectorAll('.graph-node')].map(node => node.getBoundingClientRect());
      const distanceToRect = (point, box) => Math.hypot(Math.max(box.left - point.x, 0, point.x - box.right), Math.max(box.top - point.y, 0, point.y - box.bottom));
      return edges.every(([from, to], index) => {
        const line = root.querySelector(`.edge-${index}`);
        const point = (x, y) => new DOMPoint(x.baseVal.value, y.baseVal.value).matrixTransform(line.getScreenCTM());
        return distanceToRect(point(line.x1, line.y1), nodes[from]) <= 5 && distanceToRect(point(line.x2, line.y2), nodes[to]) <= 5;
      }) && nodes.every(node => node.left >= rect.left && node.right <= rect.right);
    }, graphEdgesFor('grafo-dirigido'));
    await expect.poll(geometryMatches).toBe(true);
    await page.getByRole('button', { name: 'Nuevo ejemplo', exact: true }).click();
    expect(await geometryMatches()).toBe(true);
  });

  test(`Prim mantiene visible el valor activo en ambos temas a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/prim');
    for (const darkMode of [false, true]) {
      await page.evaluate(darkMode => localStorage.setItem('dsa-accessibility-preferences-v1', JSON.stringify({ darkMode })), darkMode);
      await page.reload();
      const active = page.locator('.graph-design-prim .graph-node.active');
      await expect(active).toBeVisible();
      const contrast = await active.evaluate(node => {
        const luminance = color => color.match(/\d+/g).slice(0, 3).map(Number).map(channel => {
          const value = channel / 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        }).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
        const text = luminance(getComputedStyle(node.querySelector('span')).color);
        const fill = luminance(getComputedStyle(node, '::after').backgroundColor);
        return (Math.max(text, fill) + .05) / (Math.min(text, fill) + .05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
}
