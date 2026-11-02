import { expect, test } from '@playwright/test';
import { algorithms } from '../../src/data/algorithms.js';
import { getOperationDefinition, initialUnionRanks } from '../../src/logic/operationMetadata.js';
import { getBeginnerJava } from '../../src/data/beginnerJava.js';
import { getBeginnerCpp } from '../../src/data/beginnerCpp.js';
import { getOperationPseudocode } from '../../src/data/operationPseudocode.js';
import { graphEdgesFor } from '../../src/data/graphDesigns.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dsa-language', 'es');
    localStorage.setItem('dsa-intro-seen', 'true');
    localStorage.setItem('dsa-code-mode', 'java');
  });
});

for (const category of [...new Set(algorithms.filter(a => getOperationDefinition(a).actions.length).map(a => a.category))]) {
  test(`cada botón selecciona su código en los tres formatos: ${category}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile'), 'The full catalog binding is shared; mobile interactions are exercised separately.');
    test.setTimeout(180_000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const algorithm of algorithms.filter(a => a.category === category)) {
      for (const action of getOperationDefinition(algorithm).actions) {
        await page.goto(`/${algorithm.id}`);
        const button = page.locator('.operation-actions').getByRole('button', { name: action.label, exact: true });
        await button.click();
        await expect(button, `${algorithm.id}/${action.id}`).toHaveClass(/selected-operation/);
        await expect(page.locator('.code-panel .note strong')).toContainText(action.label);
        const snapshot = { ...algorithm, initialValues: algorithm.values, ...(algorithm.id === 'union-find' ? { unionRanks: initialUnionRanks(algorithm.values) } : {}) };
        for (const [format, generate] of [['Java', getBeginnerJava], ['C++', getBeginnerCpp], ['Pseudocódigo', getOperationPseudocode]]) {
          await page.getByRole('button', { name: format, exact: true }).click();
          const expected = generate(snapshot, action.id, 'es').replace(/^[ \t]+$/gm, '').trim();
          await expect.poll(async () => page.locator('.code-panel pre code').evaluateAll(nodes => nodes.map(node => {
            const clone = node.cloneNode(true);
            clone.querySelector('i')?.remove();
            return clone.textContent.trim() ? clone.textContent : '';
          }).join('\n').trim()), { message: `${algorithm.id}/${action.id}/${format} must show the selected implementation` }).toBe(expected);
        }
      }
    }
    expect(errors).toEqual([]);
  });
}

test('ejecutar paso a paso espera al usuario en Java y C++', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.clock.pauseAt(new Date());
  for (const id of ['n-reinas', 'laberinto', 'sudoku']) {
    for (const mode of ['Java', 'C++']) {
      await page.goto(`/${id}`);
      await page.getByRole('button', { name: mode, exact: true }).click();
      await page.getByRole('button', { name: 'Ejecutar paso a paso', exact: true }).click();
      const next = page.getByRole('button', { name: 'Siguiente', exact: true });
      await expect(next).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Reproducir', exact: true })).toBeVisible();
      const timeline = page.locator('.timeline span');
      const initial = await timeline.getAttribute('style');
      await page.clock.runFor(3_000);
      await expect(timeline).toHaveAttribute('style', initial);
      await next.click();
      await expect(timeline).not.toHaveAttribute('style', initial);
      await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeEnabled();
      await expect(page.locator('.code-panel pre code.active')).toHaveCount(1);
      await expect.poll(() => page.locator('.code-panel pre').evaluate(panel => {
        const active = panel.querySelector('code.active');
        if (!active) return false;
        const bounds = panel.getBoundingClientRect(), line = active.getBoundingClientRect();
        return line.top >= bounds.top && line.bottom <= bounds.bottom;
      })).toBe(true);
      if (id === 'laberinto' && mode === 'C++') await page.locator('.workspace').screenshot({ path: testInfo.outputPath('laberinto-paso-a-paso.png') });
    }
  }
});

test('limpiar búsqueda conserva el mapa y lo describe correctamente', async ({ page }) => {
  for (const id of ['dijkstra', 'a-star']) {
    await page.goto(`/${id}`);
    await page.getByRole('button', { name: 'Nuevo ejemplo', exact: true }).click();
    const map = page.locator('.path-map-visual');
    const before = await map.innerHTML();
    await page.getByRole('button', { name: 'Limpiar búsqueda', exact: true }).click();
    await expect(page.locator('.operation-message')).toContainText('Se conserva el mapa actual');
    expect(await map.innerHTML()).toBe(before);
  }
});

test('nuevo ejemplo comparte los pesos entre el grafo y Java/C++', async ({ page }) => {
  for (const id of ['prim', 'kruskal']) {
    await page.goto(`/${id}`);
    await page.getByRole('button', { name: 'Nuevo ejemplo', exact: true }).click();
    const weights = await page.locator('.graph-weight').allTextContents();
    const edges = graphEdgesFor(id);
    expect(weights).toHaveLength(edges.length);
    for (const format of ['Java', 'C++']) {
      await page.getByRole('button', { name: format, exact: true }).click();
      for (const [[from, to], i] of edges.map((edge, i) => [edge, i])) {
        const assignment = id === 'kruskal' && format === 'Java'
          ? `edges[${i}] = new Edge(${from}, ${to}, ${weights[i]});`
          : `weights[${from}][${to}] = ${weights[i]};`;
        await expect(page.locator('.code-panel pre')).toContainText(assignment);
      }
    }
  }
});
