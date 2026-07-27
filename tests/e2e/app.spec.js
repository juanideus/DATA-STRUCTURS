import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem('dsa-test-show-intro') !== 'true') {
      window.localStorage.setItem('dsa-intro-seen', 'true');
    }
  });
  await page.goto('/');
});

async function openAlgorithm(page, algorithmId) {
  const menu = page.getByRole('button', { name: 'Abrir menú' });
  if (await menu.isVisible()) await menu.click();
  await page.locator(`[data-algorithm-id="${algorithmId}"]`).click();
}

test('muestra la introducción sólo durante la primera visita', async ({ page }) => {
  await page.evaluate(() => {
    window.sessionStorage.setItem('dsa-test-show-intro', 'true');
    window.localStorage.removeItem('dsa-intro-seen');
  });
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Comprender es más fácil cuando puedes verlo.' })).toBeVisible();
  await page.getByRole('button', { name: /Entrar ahora/ }).click();
  await expect(page.getByRole('dialog', { name: 'Comprender es más fácil cuando puedes verlo.' })).toBeHidden();

  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Comprender es más fácil cuando puedes verlo.' })).toHaveCount(0);
});

test('abre un tema mediante un enlace compartible', async ({ page }) => {
  await page.goto('/#/avl');
  await expect(page.getByRole('heading', { name: 'Árbol AVL', level: 1 })).toBeVisible();
  await expect(page.locator('[data-algorithm-id="avl"]')).toHaveClass(/selected/);
});

test('conserva tema, velocidad y lenguaje entre recargas', async ({ page }) => {
  await openAlgorithm(page, 'lista-simple');
  await page.getByLabel('Velocidad').selectOption('2');
  await page.getByRole('button', { name: 'Pseudocódigo' }).click();
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Lista simple', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Velocidad')).toHaveValue('2');
  await expect(page.getByRole('button', { name: 'Pseudocódigo' })).toHaveClass(/active/);
});

test('ejecuta y restablece una operación de lista enlazada', async ({ page }) => {
  await openAlgorithm(page, 'lista-doble');
  await page.getByLabel('Velocidad').selectOption('2');
  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Insertar final' }).click();
  await expect(page.locator('.operation-message')).toContainText('99', { timeout: 15000 });
  await expect(page.locator('.code-panel pre')).toContainText('class DoublyLinkedList');

  await page.getByRole('button', { name: 'Restablecer' }).click();
  await expect(page.locator('.operation-message')).toContainText('restablecida');
});

test('permite copiar un reporte sin usar GitHub', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Informar un problema' }).click();
  await page.getByLabel('Resumen corto').fill('Prueba del reporte');
  await page.getByLabel('Cuéntanos qué ocurrió').fill('Descripción para verificar la copia.');
  await page.getByRole('button', { name: 'Copiar reporte' }).click();

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('Prueba del reporte');
  expect(clipboard).toContain('Descripción para verificar la copia.');
});

test('no produce desbordamiento horizontal en móvil', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Comprobación específica para móvil.');
  await page.goto('/#/sudoku');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
