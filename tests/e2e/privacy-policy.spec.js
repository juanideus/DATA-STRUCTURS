import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dsa-language', 'es');
    localStorage.setItem('dsa-intro-seen', 'true');
  });
  await page.goto('/');
});

test('privacy replaces the sidebar credit and is available in both languages', async ({ page }, testInfo) => {
  if (testInfo.project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Abrir menú' }).click();
  }
  const link = page.getByRole('link', { name: 'Política de privacidad' });
  await expect(link).toBeVisible();
  await expect(page.locator('meta[name="author"], .author-credit')).toHaveCount(0);
  const structuredData = JSON.parse(await page.locator('#dsa-structured-data').textContent());
  expect(structuredData['@graph'].every(item => item['@type'] !== 'Person' && !item.author)).toBe(true);
  await link.focus();
  await link.press('Enter');
  await expect(page).toHaveURL(/\/politica-de-privacidad\.html$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeVisible();
  await expect(page.getByText(/Versión 1\.0/)).toBeVisible();
  await expect(page.getByText(/90 días después de cerrar el caso/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cloudflare Turnstile' })).toHaveAttribute('href', 'https://www.cloudflare.com/turnstile-privacy-policy/');
  const reviewedOn = await page.locator('time').getAttribute('datetime');
  expect(reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await expect(page.locator('script')).toHaveCount(0);
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
  await expect(page.getByText(/Version 1\.0/)).toBeVisible();
  await expect(page.getByText(/90 days after the case is closed/)).toBeVisible();
  await expect(page.locator('time')).toHaveAttribute('datetime', reviewedOn);
  await expect(page.getByRole('link', { name: 'Cloudflare Turnstile' })).toHaveAttribute('href', 'https://www.cloudflare.com/turnstile-privacy-policy/');
  await expect(page.locator('script')).toHaveCount(0);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(18, 26, 38)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
});

test('reading the policy from the report form keeps the draft', async ({ page }) => {
  await page.getByRole('button', { name: 'Informar un problema' }).click();
  const report = page.locator('.bug-modal');
  const title = report.getByRole('textbox', { name: /Resumen corto/ });
  await title.fill('Borrador sin enviar');
  const popupPromise = page.waitForEvent('popup');
  await report.getByRole('link', { name: /Política de privacidad/ }).click();
  const policy = await popupPromise;
  await expect(policy.getByRole('heading', { name: 'Política de privacidad' })).toBeVisible();
  await policy.close();
  await expect(title).toHaveValue('Borrador sin enviar');
});
