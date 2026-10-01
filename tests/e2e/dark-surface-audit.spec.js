import { test, expect } from '@playwright/test';
import { algorithms } from '../../src/data/algorithms.js';

test('audita superficies claras en visualizadores oscuros', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dsa-intro-seen', 'true');
    localStorage.setItem('dsa-accessibility-preferences-v1', JSON.stringify({ darkMode: true }));
  });
  const findings = [];
  for (const algorithm of algorithms.filter(item => item.category !== 'Fundamentos')) {
    await page.goto(`/${algorithm.id}`);
    const canvas = page.locator('.canvas-grid');
    await expect(canvas).toBeVisible();
    await expect(canvas.locator('.description-loading')).toHaveCount(0);
    const surfaces = await canvas.evaluate(root => {
      const light = value => {
        const match = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
        return match && Number(match[4] ?? 1) >= 0.5 && match.slice(1, 4).every(channel => Number(channel) > 205);
      };
      return [...root.querySelectorAll('*')].filter(element => {
        const rect = element.getBoundingClientRect();
        if (rect.width < 16 || rect.height < 16) return false;
        const style = getComputedStyle(element);
        if (element instanceof SVGElement) return ['rect', 'circle', 'polygon'].includes(element.tagName.toLowerCase()) && light(style.fill);
        return light(style.backgroundColor);
      }).map(element => ({
        tag: element.tagName.toLowerCase(),
        className: element.getAttribute('class')?.baseVal ?? element.getAttribute('class') ?? '',
        parent: element.parentElement?.getAttribute('class')?.baseVal ?? element.parentElement?.getAttribute('class') ?? '',
      })).slice(0, 10);
    });
    if (surfaces.length) findings.push({ id: algorithm.id, surfaces });
  }
  expect(findings).toEqual([]);
});

test('mantiene legibles los valores de nodos, tablero y variables', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dsa-intro-seen', 'true');
    localStorage.setItem('dsa-accessibility-preferences-v1', JSON.stringify({ darkMode: true }));
  });
  const contrastOf = async (route, backgroundSelector, textSelector, svg = false) => {
    await page.goto(route);
    await expect(page.locator(backgroundSelector).first()).toBeVisible();
    return page.evaluate(({ backgroundSelector, textSelector, svg }) => {
      const background = getComputedStyle(document.querySelector(backgroundSelector));
      const foreground = getComputedStyle(document.querySelector(textSelector));
      const luminance = color => {
        const channels = color.match(/\d+/g).slice(0, 3).map(Number).map(channel => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const a = luminance(svg ? background.fill : background.backgroundColor);
      const b = luminance(svg ? foreground.fill : foreground.color);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }, { backgroundSelector, textSelector, svg });
  };

  expect(await contrastOf('/array', '.data-cell.active', '.data-cell.active span')).toBeGreaterThanOrEqual(4.5);
  expect(await contrastOf('/matriz-dispersa', '.sparse-node:not(.active) rect', '.sparse-node:not(.active) .node-value', true)).toBeGreaterThanOrEqual(4.5);
  expect(await contrastOf('/matriz-dispersa', '.variable-item', '.variable-item strong')).toBeGreaterThanOrEqual(4.5);
  expect(await contrastOf('/sudoku', '.sudoku-grid>div.given', '.sudoku-grid>div.given')).toBeGreaterThanOrEqual(4.5);
});
