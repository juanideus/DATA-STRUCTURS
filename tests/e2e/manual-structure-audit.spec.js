import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dsa-language', 'es');
    localStorage.setItem('dsa-intro-seen', 'true');
  });
});

test('las ocho escenas auditadas permiten pausar y avanzar sin errores', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'La revisión de fotogramas se hace en escritorio.');
  test.setTimeout(180_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const scenes = [
    ['dijkstra', 'Ejecutar Dijkstra', 'Java'],
    ['a-star', 'Ejecutar A*', 'Java'],
    ['heap', 'Extraer raíz', 'Java'],
    ['merge-sort', 'Ordenar', 'Java'],
    ['radix-sort', 'Ordenar', 'C++'],
    ['lista-simple', 'Eliminar índice', 'Java'],
    ['fibonacci-heap', 'Extraer raíz', 'Java'],
    ['matriz-dispersa', 'Eliminar posición', 'C++'],
  ];
  for (const [id, action, language] of scenes) {
    await page.goto(`/${id}`);
    await page.getByRole('button', { name: language, exact: true }).click();
    if (id === 'lista-simple') await page.locator('.operation-fields input').last().fill('2');
    if (id === 'matriz-dispersa') {
      const inputs = page.locator('.operation-fields input');
      await inputs.nth(0).fill('0');
      await inputs.nth(1).fill('4');
    }
    await page.getByRole('button', { name: action, exact: true }).click();
    const pause = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await pause.isVisible()) await pause.click();
    const next = page.getByRole('button', { name: 'Siguiente', exact: true });
    await expect(next, id).toBeEnabled();
    for (let index = 0; index < 8 && await next.isEnabled(); index++) {
      await next.click();
      await expect(page.locator('.operation-message'), id).not.toBeEmpty();
    }
  }
  expect(errors).toEqual([]);
});

test('Radix C++ decrementa antes de escribir y libera cada auxiliar por pasada', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'La traza detallada se revisa en escritorio.');
  test.setTimeout(120_000);
  await page.goto('/radix-sort');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await page.getByRole('button', { name: 'Ordenar', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();
  const next = page.getByRole('button', { name: 'Siguiente', exact: true });
  const seen = [];
  for (let index = 0; index < 500 && await next.isEnabled(); index++) {
    const active = (await page.locator('.code-panel code.active').textContent())?.trim() ?? '';
    if (active.includes('output[--count[digit]]')) {
      const message = await page.locator('.operation-message').textContent();
      seen.push(message.includes('decrementa') ? 'decrement' : 'output');
    }
    if (active.includes('delete[] count')) seen.push('free-count');
    if (active.includes('delete[] output')) seen.push('free-output');
    if (seen.includes('free-output')) break;
    await next.click();
  }
  expect(seen.slice(0, 2)).toEqual(['decrement', 'output']);
  expect(seen).toContain('free-count');
  expect(seen).toContain('free-output');
});

test('Merkle advierte que el hash visual admite colisiones', async ({ page }) => {
  await page.goto('/merkle-tree');
  await expect(page.locator('.merkle-caveat')).toContainText('admite colisiones');
});
