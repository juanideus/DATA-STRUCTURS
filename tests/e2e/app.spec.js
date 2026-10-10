import { expect, test } from '@playwright/test';
import { algorithms } from '../../src/data/algorithms.js';
import { englishAlgorithmDescriptions } from '../../src/data/algorithmTranslations.js';
import { getOperationDefinition } from '../../src/logic/operations.js';
import { createSectionTest } from '../../src/logic/sectionTests.js';

async function advanceAvailableStep(page) {
  const next = page.getByRole('button', { name: 'Siguiente', exact: true });
  // The player now disables its boundary controls instead of accepting no-op clicks.
  if (await next.isEnabled()) await next.click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('dsa-language', 'es');
    if (window.sessionStorage.getItem('dsa-test-show-intro') !== 'true') {
      window.localStorage.setItem('dsa-intro-seen', 'true');
    }
  });
  await page.goto('/');
});

test('la búsqueda lateral informa resultados y se puede borrar sin perder el foco', async ({ page }, testInfo) => {
  if (testInfo.project.name.startsWith('mobile')) {
    const menuButton = page.getByRole('button', { name: 'Abrir menú' });
    await menuButton.focus();
    await menuButton.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Navegación de algoritmos' })).toBeVisible();
  }
  const search = page.getByRole('searchbox', { name: 'Buscar algoritmo…' });
  await search.fill('tema que no existe');
  await expect(page.locator('.search-results-status')).toContainText('No hay temas que coincidan');
  await expect(page.locator('.sidebar .nav-item')).toHaveCount(0);
  await page.getByRole('button', { name: 'Borrar búsqueda' }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(page.locator('.sidebar .nav-item')).toHaveCount(algorithms.length);
});

test('un dato inválido permanece visible y Enter repite la operación seleccionada', async ({ page }) => {
  await page.goto('/pila');
  const value = page.locator('.operation-fields input').first();
  await value.fill('2147483648');
  await page.getByRole('button', { name: 'Push', exact: true }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
  await expect(value).toHaveValue('2147483648');
  await value.fill('37');
  await value.press('Enter');
  await expect(page.locator('.operation-message')).toContainText('Push');
  await expect(value).toHaveValue('37');
  await page.getByRole('button', { name: 'Pop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pop', exact: true })).toHaveClass(/selected-operation/);
  await value.press('Enter');
  await expect(page.locator('.operation-message')).toContainText('Pop');
  await expect(page.getByRole('button', { name: 'Pop', exact: true })).toHaveClass(/selected-operation/);
});

test('cada tema tiene una descripción específica en inglés', async ({ page }) => {
  expect(algorithms.filter(algorithm => !englishAlgorithmDescriptions[algorithm.id])).toEqual([]);
  await page.goto('/en/skip-list');
  await expect(page.locator('.hero p')).toContainText('Layered linked lists');
  await page.goto('/en/matriz-dispersa');
  await expect(page.locator('.sparse-node-legend')).toContainText('NODE:');
  await expect(page.locator('.sparse-node-legend')).toContainText('circular return to header');
  await page.goto('/en/grafo');
  await expect(page.locator('.complexity-card')).toContainText('Traversal O(V²) with an adjacency matrix');
});

test('las trazas inglesas de Pila y Cola no mezclan los mensajes de sus primeros pasos', async ({ page }) => {
  await page.goto('/en/pila');
  await page.getByLabel('Value').fill('31');
  await page.getByRole('button', { name: 'Push', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('Push receives the value 31.');
  await expect(page.locator('.operation-message')).toContainText('top is', { timeout: 8_000 });
  await expect(page.locator('.operation-message')).toContainText('Push finished: 31 is the new top.', { timeout: 15_000 });

  await page.goto('/en/cola');
  await page.getByLabel('Value').fill('31');
  await page.getByRole('button', { name: 'Enqueue', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('Enqueue receives the value 31.');
  await expect(page.locator('.operation-message')).toContainText('size is', { timeout: 8_000 });
  await expect(page.locator('.operation-message')).toContainText('Enqueue finished: 31 is at the rear of the queue.', { timeout: 15_000 });
});

test('la portada explica una operación real y mantiene accesibles las ayudas en pantallas medianas', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole('heading', { name: 'Las estructuras de datos se entienden mejor cuando las ves cambiar.' })).toBeVisible();
  await expect(page.locator('.welcome-demo')).toContainText('result[0] = value;');
  await expect(page.locator('.welcome-path')).toHaveCount(0);
  for (const selector of ['.accessibility-launch', '.guided-tour-launch', '.bug-fab']) {
    await expect(page.locator(`.global-tools ${selector}`)).toHaveCSS('position', 'static');
  }
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Data structures make more sense when you can see them change.' })).toBeVisible();
  await expect(page.locator('.welcome-demo')).toContainText('Adding at the beginning');
});

test('carga el ejecutor y la animación solo cuando se realiza una operación', async ({ page }) => {
  const loadedAssets = () => page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  await expect(page.getByRole('heading', { name: 'Las estructuras de datos se entienden mejor cuando las ves cambiar.' })).toBeVisible();
  expect((await loadedAssets()).some(url => /\/assets\/(?:operations|codeAnimation)-[^/]+\.js/.test(url))).toBe(false);

  await page.goto('/array');
  await expect(page.locator('.data-cell').first()).toBeVisible();
  expect((await loadedAssets()).some(url => /\/assets\/(?:operations|codeAnimation)-[^/]+\.js/.test(url))).toBe(false);

  await page.getByRole('button', { name: 'Agregar inicio' }).click();
  await expect.poll(async () => (await loadedAssets()).filter(url => /\/assets\/(?:operations|codeAnimation)-[^/]+\.js/.test(url)).length).toBe(2);
});

test('detecta inglés y traduce la guía completa cuando no existe una preferencia guardada', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.removeItem('dsa-language');
    window.localStorage.setItem('dsa-intro-seen', 'true');
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveURL(/\/en$/);

  await page.goto('/en/avl');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'AVL Tree', level: 1 })).toBeVisible();
  const guide = page.locator('.educational-description');
  await expect(guide.getByText('Complete guide', { exact: true })).toBeVisible();
  await expect(guide).toContainText('How it works internally');
  await expect(guide).toContainText('balance factor');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US');

  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { name: 'Árbol AVL', level: 1 })).toBeVisible();
  await expect(guide.getByText('Guía completa', { exact: true })).toBeVisible();
  await context.close();
});

test('traduce todas las páginas de fundamentos al inglés', async ({ page }) => {
  const foundations = algorithms.filter(algorithm => algorithm.category === 'Fundamentos');
  for (const algorithm of foundations) {
    await page.goto(`/${algorithm.id}?lang=en`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('[data-foundation-lesson]')).toBeVisible();
    await expect(page.locator('[data-foundation-lesson]')).toContainText('CENTRAL IDEA');
    await expect(page.locator('[data-foundation-lesson]')).toContainText('IDEA TO REMEMBER');
    await expect(page.locator('[data-foundation-lesson]')).not.toContainText('IDEA CENTRAL');
  }
});

test('complejidad en inglés conserva el gráfico y dibuja O(log n) de forma continua', async ({ page }) => {
  await page.goto('/complejidad-algoritmica?lang=en');
  const chart = page.locator('.complexity-static-chart');
  await expect(chart).toBeVisible();
  await expect(chart).toContainText('O(log n)');
  const logarithmicPath = chart.locator('.curve-logarithmic');
  await expect(logarithmicPath).toHaveCount(1);
  const points = await logarithmicPath.getAttribute('d');
  expect(points?.match(/\bL\b/g)?.length).toBeGreaterThanOrEqual(150);
  const yValues = [...(points?.matchAll(/(?:M|L)\s+[\d.-]+\s+([\d.-]+)/g) ?? [])].map(match => match[1]);
  expect(new Set(yValues).size).toBeGreaterThan(140);
  await expect(chart.locator('.curve-constant')).toHaveCount(1);
  await expect(chart.locator('.curve-linear')).toHaveCount(1);
  await expect(chart.locator('.curve-quadratic')).toHaveCount(1);
  await expect(chart.locator('.curve-exponential')).toHaveCount(1);
  await expect(chart.locator('.curve-factorial')).toHaveCount(1);
  await expect(chart).toContainText('O(n!)');
  await expect(chart.locator('.curve-constant')).toHaveAttribute('d', /^M 8 [\d.]+ H 96$/);
  const starts = await chart.locator('.curve').evaluateAll(paths => Object.fromEntries(paths.map(path => {
    const id = [...path.classList].find(name => name.startsWith('curve-') && name !== 'curve');
    const [, x, y] = path.getAttribute('d').match(/^M\s+([\d.-]+)\s+([\d.-]+)/) ?? [];
    return [id, { x: Number(x), y: Number(y) }];
  })));
  expect(starts['curve-logarithmic']).toEqual({ x: 8, y: 88 });
  expect(starts['curve-linear']).toEqual({ x: 8, y: 88 });
  expect(starts['curve-linearithmic']).toEqual({ x: 8, y: 88 });
  expect(starts['curve-quadratic']).toEqual({ x: 8, y: 88 });
  expect(starts['curve-exponential']).toEqual({ x: 8, y: 88 });
  expect(starts['curve-factorial']).toEqual({ x: 8, y: 88 });
  expect(starts['curve-constant'].y).toBeLessThan(88);
});

test('el modo inglés traduce también la interfaz interactiva, desafíos, prueba, tour y reporte', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'La cobertura bilingüe completa se comprueba una vez en escritorio.');
  await page.goto('/array?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Array', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add at start' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New example' })).toBeVisible();
  await expect(page.getByText('Real-time variables')).toBeVisible();

  await page.getByRole('button', { name: 'Challenge mode', exact: true }).click();
  const challenge = page.locator('.challenge-panel');
  await expect(challenge).toContainText('Predict before running');
  await expect(challenge).toContainText('I need a hint');
  await expect(challenge).not.toContainText('Modo desafío');
  await page.getByRole('button', { name: 'Exit', exact: true }).click();

  await page.getByRole('button', { name: 'Take test' }).click();
  const assessment = page.locator('.section-test-modal');
  await expect(assessment).toContainText('Section assessment');
  await expect(assessment).toContainText('Anti-cheating rule');
  await expect(assessment).not.toContainText('Evaluación de la sección');
  await assessment.getByRole('button', { name: 'Close test' }).click();

  await page.getByRole('button', { name: 'Open the guided tour of how DSA Lab works' }).click();
  const tour = page.locator('.guided-tour-card');
  await expect(tour).toContainText('Choose what you want to learn');
  await expect(tour).toContainText('Skip tour');
  await tour.getByRole('button', { name: 'Close tour' }).click();

  await page.getByRole('button', { name: 'Report a problem' }).click();
  const report = page.locator('.bug-modal');
  await expect(report.getByText(/^Your name Required$/)).toBeVisible();
  await expect(report.getByText(/^What kind of problem is it\? Required$/)).toBeVisible();
  await expect(report).not.toContainText('Tu nombre');
  await report.getByRole('button', { name: 'Send report' }).click();
  await expect(report.getByText('Enter your name.', { exact: true })).toBeVisible();
  await expect(report.getByText('Enter a short summary of the problem.', { exact: true })).toBeVisible();
  await expect(report.getByText('Select the kind of problem you found.', { exact: true })).toBeVisible();
  await expect(report.getByText('Tell us what happened.', { exact: true })).toBeVisible();
  await expect(report).not.toContainText('Escribe tu nombre.');
});

test('el formulario de reportes explica cada dato faltante y enfoca el primer error', async ({ page }) => {
  await page.goto('/array');
  await page.getByRole('button', { name: 'Informar un problema' }).click();
  const report = page.locator('.bug-modal');

  await report.getByRole('button', { name: 'Enviar reporte' }).click();
  await expect(report.getByText('Revisa los campos marcados antes de continuar.')).toBeVisible();
  await expect(report.getByText('Escribe tu nombre.', { exact: true })).toBeVisible();
  await expect(report.getByText('Escribe un resumen corto del problema.', { exact: true })).toBeVisible();
  await expect(report.getByText('Selecciona el tipo de problema que encontraste.', { exact: true })).toBeVisible();
  await expect(report.getByText('Cuéntanos qué ocurrió.', { exact: true })).toBeVisible();
  await expect(report.getByRole('textbox', { name: /Tu nombre/ })).toBeFocused();

  await report.getByRole('textbox', { name: /Tu nombre/ }).fill('J');
  await report.getByRole('textbox', { name: /Tu correo/ }).fill('correo-invalido');
  await report.getByRole('textbox', { name: /Resumen corto/ }).fill('No avanza');
  await report.getByRole('combobox', { name: /Qué tipo de problema/ }).selectOption({ label: 'Algo no funciona' });
  await report.getByRole('textbox', { name: /Cuéntanos qué ocurrió/ }).fill('Se frena');
  await report.getByRole('button', { name: 'Enviar reporte' }).click();

  await expect(report.getByText('Tu nombre debe tener al menos 2 caracteres.', { exact: true })).toBeVisible();
  await expect(report.getByText('Escribe un correo válido, por ejemplo nombre@correo.com.', { exact: true })).toBeVisible();
  await expect(report.getByText('La descripción debe tener al menos 10 caracteres.', { exact: true })).toBeVisible();

  await report.getByRole('textbox', { name: /Tu nombre/ }).fill('Juan');
  await report.getByRole('textbox', { name: /Tu correo/ }).fill('juan@example.com');
  await report.getByRole('textbox', { name: /Cuéntanos qué ocurrió/ }).fill('La animación deja de avanzar al insertar el segundo dato.');
  await expect(report.locator('[aria-invalid="true"]')).toHaveCount(0);
  await expect(report.getByText('Revisa los campos marcados antes de continuar.')).toHaveCount(0);
});

test('ninguna sección deja controles principales en español al activar inglés', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name.startsWith('mobile'), 'El contenido bilingüe se recorre completo una vez en escritorio.');
  const forbidden = /\b(Visualización|Nuevo ejemplo|Vaciar|Restablecer|Realizar prueba|Variables en tiempo real|Agregar inicio|Agregar final|Eliminar inicio|Eliminar final|Guía completa|Idea central|Próximamente)\b/i;
  for (const algorithm of algorithms) {
    await page.goto(`/${algorithm.id}?lang=en`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    if (!['theory', 'complexity', 'oop', 'foundation'].includes(algorithm.type)) {
      await expect(page.locator('.clear-demo-button')).toHaveAccessibleName('Clear');
      await expect(page.locator('.clear-demo-button')).toBeVisible();
    }
    const visibleText = await page.locator('body').innerText();
    expect(visibleText, `Texto español visible en ${algorithm.id}`).not.toMatch(forbidden);
  }
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
  await page.goto('/avl');
  await expect(page.getByRole('heading', { name: 'Árbol AVL', level: 1 })).toBeVisible();
  await expect(page.locator('[data-algorithm-id="avl"]')).toHaveClass(/selected/);
  await expect(page).toHaveURL(/\/avl$/);

  await page.goto('/#/sudoku');
  await expect(page).toHaveURL(/\/sudoku$/);
  await expect(page.getByRole('heading', { name: 'Sudoku Solver 9×9', level: 1 })).toBeVisible();
});

test('expone rutas, enlaces y metadatos rastreables en ambos idiomas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content', 'DSA Lab');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  const structuredData = JSON.parse(await page.locator('#dsa-structured-data').textContent());
  const website = structuredData['@graph'].find(item => item['@type'] === 'WebSite');
  expect(website).toMatchObject({
    name: 'DSA Lab',
    url: 'https://www.dsalab.dev/',
    alternateName: ['DSALab', 'Data Structures and Algorithms Lab'],
  });

  await page.goto('/avl');
  await expect(page).toHaveURL(/\/avl$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.dsalab.dev/avl');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://www.dsalab.dev/en/avl');
  expect(await page.locator('#dsa-structured-data').textContent()).toContain('LearningResource');
  await expect(page.locator('[data-algorithm-id="array"]')).toHaveAttribute('href', '/array');

  const mobileMenu = page.getByRole('button', { name: 'Abrir menú' });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/avl$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.dsalab.dev/en/avl');
  await expect(page.locator('[data-algorithm-id="array"]')).toHaveAttribute('href', '/en/array');

  await page.goto('/en/dijkstra');
  await expect(page.getByRole('heading', { name: 'Dijkstra', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/Dijkstra: Visual Guide, Java and C\+\+/);
});

test('la sección de complejidad explica la teoría con gráficos y sin laboratorio ni código', async ({ page }) => {
  await page.goto('/complejidad-algoritmica');
  await expect(page.getByRole('heading', { name: 'Complejidad algorítmica', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¿Qué es la complejidad algorítmica?', level: 2 })).toBeVisible();
  await expect(page.locator('.complexity-static-chart .curve')).toHaveCount(7);
  await expect(page.locator('.complexity-order-table [role="row"]')).toHaveCount(8);
  await expect(page.locator('.complexity-notation-card')).toContainText('O(g(n))');
  await expect(page.locator('.complexity-notation-card')).toContainText('Ω(g(n))');
  await expect(page.locator('.complexity-notation-card')).toContainText('Θ(g(n))');
  await expect(page.locator('.visual-panel')).toHaveCount(0);
  await expect(page.locator('.code-panel')).toHaveCount(0);
  await expect(page.locator('.operations-panel')).toHaveCount(0);
  await expect(page.locator('.player')).toHaveCount(0);
});

test('la prueba de complejidad pide calcular Big O a partir de código sencillo', async ({ page }) => {
  await page.goto('/complejidad-algoritmica');
  await page.getByRole('button', { name: 'Realizar prueba' }).click();
  await page.getByRole('button', { name: 'Comenzar prueba' }).click();

  const firstQuestion = page.locator('.section-test-question');
  await expect(firstQuestion).toContainText('Observa el diagrama');
  await firstQuestion.locator('label').filter({ hasText: 'Complejidad algorítmica' }).locator('input').check();
  await page.getByRole('button', { name: 'Siguiente pregunta' }).click();

  await expect(page.getByText('2/10', { exact: true })).toBeVisible();
  await expect(page.locator('.section-test-code')).toBeVisible();
  await expect(page.locator('.section-test-code')).toContainText(/for|while/);
  await expect(page.locator('.section-test-question label')).toHaveCount(4);
  await expect(page.locator('.section-test-question')).toContainText(/O\(1\)|O\(log n\)|O\(n\)|O\(n log n\)|O\(n²\)/);
});

test('fundamentos explica qué son las estructuras de datos sin convertirlo en un laboratorio', async ({ page }) => {
  await page.goto('/estructuras-de-datos');
  await expect(page.locator('[data-algorithm-id="estructuras-de-datos"]')).toHaveText('67Estructuras de datos');
  await expect(page.getByRole('heading', { name: '¿Qué son las estructuras de datos?', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¿Qué es una estructura de datos?', level: 2 })).toBeVisible();
  await expect(page.locator('[data-data-structures-lesson]')).toContainText('Tipo de Dato Abstracto (TDA)');
  await expect(page.locator('.data-family-grid > div')).toHaveCount(4);
  await expect(page.locator('.data-operation-table [role="row"]')).toHaveCount(7);
  await expect(page.locator('.visual-panel')).toHaveCount(0);
  await expect(page.locator('.code-panel')).toHaveCount(0);
  await expect(page.locator('.operations-panel')).toHaveCount(0);
  await expect(page.locator('.player')).toHaveCount(0);
});

test('Backtracking, Búsqueda Binaria y Divide y Vencerás tienen fundamentos completos', async ({ page }) => {
  const guides = [
    ['fundamentos-backtracking', 'Fundamentos de Backtracking', 'elegir, explorar y deshacer'],
    ['fundamentos-busqueda-binaria', 'Fundamentos de Búsqueda Binaria', 'datos están ordenados'],
    ['fundamentos-divide-venceras', 'Fundamentos de Divide y Vencerás', 'cómo dividir'],
  ];

  for (const [id, title, keyIdea] of guides) {
    await page.goto(`/${id}`);
    const lesson = page.locator(`[data-foundation-lesson="${id}"]`);
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    await expect(lesson).toBeVisible();
    await expect(lesson.locator('.foundation-section-grid > article')).toHaveCount(5);
    await expect(lesson.locator('.foundation-code-wrap')).not.toHaveCount(0);
    await expect(lesson.locator('.foundation-mistakes li')).toHaveCount(5);
    await expect(lesson.locator('.foundation-checklist li')).toHaveCount(5);
    await expect(lesson).toContainText(keyIdea);
    await expect(page.locator('.visual-panel')).toHaveCount(0);
    await expect(page.locator('.code-panel')).toHaveCount(0);
  }
});

test('las guías específicas explican la implementación real en ambos idiomas', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'El mismo contenido se presenta en ambos tamaños de pantalla.');
  const guides = [
    ['prim', 'O(V²), sin cola de prioridad', 'O(V²); it does not use a priority queue'],
    ['fenwick-tree', 'no es una consulta O(log n) del BIT de sumas', 'Prefix minimum is O(n) in this lesson'],
    ['hash-table', 'arreglo de 12 casillas y sondeo lineal', 'fixed array of 12 slots with linear probing'],
    ['hash-open', 'usa sondeo lineal', 'uses linear probing'],
    ['hash-chaining', 'cada bucket suele ser una lista', 'Each bucket has a linked chain'],
    ['union-find', 'no cuenta sus elementos', 'not group size'],
    ['lru-cache', 'head es la entrada menos reciente', 'head is the least recent entry'],
  ];

  for (const [id, spanish, english] of guides) {
    await page.goto(`/${id}`);
    await expect(page.locator('.educational-description')).toContainText(spanish);
    await page.goto(`/en/${id}`);
    await expect(page.locator('.educational-description')).toContainText(english);
  }
});

test('amplía el código completo sin perder líneas, idioma ni navegación por teclado', async ({ page }) => {
  await page.goto('/array');
  const inlineCode = page.locator('.panel.code-panel pre');
  const open = page.getByRole('button', { name: 'Ver código completo' });
  await expect(open).toBeVisible();
  await open.click();

  const dialog = page.getByRole('dialog', { name: /Código completo/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('pre code')).toHaveCount(await inlineCode.locator('code').count());
  await expect(dialog.locator('pre')).toContainText('class');
  expect((await dialog.locator('pre').boundingBox()).height).toBeGreaterThan((await inlineCode.boundingBox()).height);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();

  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await open.click();
  await expect(dialog).toContainText('C++');
  await expect(dialog.locator('pre')).toContainText('class');
  await dialog.getByRole('button', { name: 'Cerrar código completo' }).click();
  await expect(dialog).toHaveCount(0);

  await page.goto('/en/array');
  await page.getByRole('button', { name: 'View full code' }).click();
  await expect(page.getByRole('dialog', { name: /Full code/ })).toBeVisible();
});

test('el modo desafío predice operaciones y conserva el progreso local', async ({ page }) => {
  await page.evaluate(() => window.localStorage.removeItem('dsa-challenge-progress-v1'));

  for (const algorithmId of ['array', 'pila', 'cola', 'bst', 'avl']) {
    await page.goto(`/${algorithmId}`);
    const toggle = page.getByRole('button', { name: 'Modo desafío', exact: true });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole('heading', { name: 'Predice antes de ejecutar' })).toBeVisible();
    await expect(page.locator('.challenge-options button')).toHaveCount(3);
    await expect(page.locator('.operations-panel')).toHaveCount(0);

    if (algorithmId === 'array') {
      await page.getByRole('button', { name: 'Necesito una pista' }).click();
      await expect(page.locator('.challenge-hint')).toBeVisible();
    }

    await page.locator('.challenge-options button').first().click();
    await expect(page.locator('.challenge-feedback')).toBeVisible();
    await expect(page.locator('.challenge-options .correct-answer')).toHaveCount(1);
    await page.getByRole('button', { name: 'Comprobar con la animación' }).click();
    await expect(page.getByRole('button', { name: 'Animación iniciada' })).toBeVisible();
  }

  const progress = await page.evaluate(() => JSON.parse(window.localStorage.getItem('dsa-challenge-progress-v1')));
  expect(progress.attempts).toBe(5);
  expect(progress.hints).toBe(1);
  expect(Object.keys(progress.byAlgorithm).sort()).toEqual(['array', 'avl', 'bst', 'cola', 'pila']);

  await page.goto('/array');
  await page.getByRole('button', { name: 'Modo desafío', exact: true }).click();
  await expect(page.locator('.challenge-progress')).toContainText('/5');

  await page.goto('/dijkstra');
  await expect(page.getByRole('button', { name: 'Modo desafío', exact: true })).toBeVisible();
});

test('los 86 temas cargan su contenido correspondiente sin errores', async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors = [];
  const failedResponses = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  for (const algorithm of algorithms) {
    await page.goto(`/${algorithm.id}`);
    await expect(page.getByRole('heading', { name: algorithm.name, level: 1 })).toBeVisible();
    if (['theory', 'complexity', 'oop', 'foundation'].includes(algorithm.type)) {
      const lessonSelector = algorithm.type === 'complexity'
        ? '[data-complexity-lesson]'
        : algorithm.type === 'oop' ? '[data-oop-lesson]' : algorithm.type === 'foundation' ? `[data-foundation-lesson="${algorithm.id}"]` : '[data-data-structures-lesson]';
      await expect(page.locator(lessonSelector)).toBeVisible();
      await expect(page.locator('.visual-panel')).toHaveCount(0);
      await expect(page.locator('.code-panel')).toHaveCount(0);
      await expect(page.locator('.operation-actions')).toHaveCount(0);
    } else {
      await expect(page.locator(`[data-visualizer="${algorithm.id}"]`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Modo desafío', exact: true })).toBeVisible();
    }
    await expect(page.locator('.operation-actions button')).toHaveCount(getOperationDefinition(algorithm).actions.length);

    if (['theory', 'complexity', 'oop', 'foundation'].includes(algorithm.type)) {
      await expect(page.locator('.code-panel')).toHaveCount(0);
    } else {
      await expect(page.locator('.code-panel code')).not.toHaveCount(0);
      await expect(page.locator('.variables-panel')).toBeVisible();
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${algorithm.id} produce desbordamiento horizontal`).toBeLessThanOrEqual(1);
  }

  expect(pageErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});

test('el AST construye la asignación, anima su Java completo y recorre en preorden', async ({ page }) => {
  await page.goto('/ast');
  await expect(page.getByRole('heading', { name: 'AST (Abstract Syntax Tree)', level: 1 })).toBeVisible();
  await expect(page.locator('.code-panel pre')).toContainText('class SimpleAst');
  await expect(page.locator('.code-panel pre')).toContainText('parseExpression');
  await expect(page.locator('.code-panel pre')).toContainText('parseTerm');
  await expect(page.locator('.code-panel pre')).toContainText('parseFactor');

  await page.getByLabel('Código Java simple').fill('total = price + quantity * 2;');
  await page.getByRole('button', { name: 'Construir AST', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();

  const activeLines = new Set();
  for (let index = 0; index < 12; index++) {
    const activeLine = page.locator('.code-panel code.active');
    if (await activeLine.count()) activeLines.add((await activeLine.innerText()).trim());
    await advanceAvailableStep(page);
  }
  expect(activeLines.size).toBeGreaterThan(5);
  await expect(page.locator('.tree-ast .tree-node')).toHaveCount(7);
  await expect(page.locator('.tree-ast [data-tree-index="0"]')).toContainText('ASSIGN');
  await expect(page.locator('.tree-ast .ast-statement-node')).toHaveCount(1);
  await expect(page.locator('.tree-ast .ast-operator-node')).toHaveCount(2);
  await expect(page.locator('.tree-ast .ast-identifier-node')).toHaveCount(3);
  await expect(page.locator('.tree-ast .ast-literal-node')).toHaveCount(1);

  await page.getByRole('button', { name: 'Recorrer preorden', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 60; index++) {
    await advanceAvailableStep(page);
  }
  await expect(page.locator('.operation-message')).toContainText('Preorden: ASSIGN → total → + → price → * → quantity → 2');

  await page.getByLabel('Código Java simple').fill('total = ;');
  await page.getByRole('button', { name: 'Construir AST', exact: true }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
  await expect(page.locator('.tree-ast .tree-node')).toHaveCount(7);
});

test('la matriz densa sincroniza índices, recorridos y transposición con Java', async ({ page }) => {
  await page.goto('/matriz');
  await expect(page.getByRole('heading', { name: 'Matriz', level: 1 })).toBeVisible();
  await expect(page.locator('.dense-matrix-cell')).toHaveCount(16);
  await expect(page.locator('.code-panel pre')).toContainText('int[][] values');
  await expect(page.locator('.code-panel pre')).toContainText('boolean set');

  await page.getByRole('spinbutton', { name: 'Fila', exact: true }).fill('1');
  await page.getByRole('spinbutton', { name: 'Columna', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'Valor', exact: true }).fill('42');
  await page.getByRole('button', { name: 'Guardar valor', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 8; index++) {
    await advanceAvailableStep(page);
  }
  await expect(page.locator('[data-matrix-row="1"][data-matrix-column="2"]')).toContainText('42');
  await expect(page.locator('.operation-message')).toContainText('Celda (1, 2) actualizada');

  await page.getByRole('button', { name: 'Transponer', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 35; index++) {
    await advanceAvailableStep(page);
  }
  await expect(page.locator('[data-matrix-row="0"][data-matrix-column="1"]')).toContainText('5');
  await expect(page.locator('[data-matrix-row="2"][data-matrix-column="1"]')).toContainText('42');
  await expect(page.locator('.operation-message')).toContainText('matriz transpuesta');

  await page.getByRole('spinbutton', { name: 'Fila', exact: true }).fill('4');
  await page.getByRole('spinbutton', { name: 'Columna', exact: true }).fill('0');
  await page.getByRole('spinbutton', { name: 'Valor', exact: true }).fill('9');
  await page.getByRole('button', { name: 'Guardar valor', exact: true }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
  await expect(page.locator('.dense-matrix-cell')).toHaveCount(16);
});

test('los polinomios suman A y B avanzando p y q sobre nodos COEF EXP LINK', async ({ page }) => {
  await page.goto('/polinomios');
  await expect(page.getByRole('heading', { name: 'Polinomios con listas', level: 1 })).toBeVisible();
  await expect(page.locator('[data-polynomial="A"]')).toHaveCount(3);
  await expect(page.locator('[data-polynomial="B"]')).toHaveCount(3);
  await expect(page.locator('[data-polynomial="C"]')).toHaveCount(0);
  await expect(page.locator('.code-panel pre')).toContainText('int coefficient');
  await expect(page.locator('.code-panel pre')).toContainText('int exponent');
  await expect(page.locator('.code-panel pre')).toContainText('Node next');

  await page.getByRole('button', { name: 'Sumar A + B', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();
  const visitedLines = new Set();
  for (let index = 0; index < 38; index++) {
    visitedLines.add((await page.locator('.code-panel code.active').textContent())?.trim());
    await advanceAvailableStep(page);
  }
  expect(visitedLines.size).toBeGreaterThan(8);
  await expect(page.locator('[data-polynomial="C"]')).toHaveCount(5);
  await expect(page.locator('.polynomial-c .polynomial-expression')).toContainText('11x^14 − 3x^10 + 2x^8 + 10x^6 + 1');
  await expect(page.locator('.operation-message')).toContainText('C = 11x^14 − 3x^10 + 2x^8 + 10x^6 + 1');

  await page.getByRole('spinbutton', { name: 'Coeficiente', exact: true }).fill('-2');
  await page.getByRole('spinbutton', { name: 'Exponente', exact: true }).fill('8');
  await page.getByRole('button', { name: 'Insertar / agrupar en A', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 14; index++) {
    await advanceAvailableStep(page);
  }
  await expect(page.locator('[data-polynomial="A"][data-exponent="8"]')).toHaveCount(0);
  await expect(page.locator('[data-polynomial="C"]')).toHaveCount(0);
});

test('el C++ de polinomios parte del ejemplo visible y limpia C al cambiar A', async ({ page }) => {
  await page.goto('/polinomios');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await expect(page.locator('.code-panel pre')).toContainText('explicit LinkedPolynomial(bool loadExample = true)');
  await page.getByRole('spinbutton', { name: 'Exponente', exact: true }).fill('8');
  await page.getByRole('button', { name: 'Eliminar de A', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();
  for (let step = 0; step < 12; step++) {
    await advanceAvailableStep(page);
  }
  await expect(page.locator('.code-panel code.active')).toContainText('clearList(C);');
  await expect(page.locator('[data-polynomial="A"][data-exponent="8"]')).toHaveCount(0);
});

test('la lista generalizada distingue tag, dlink, link y referencias compartidas', async ({ page }) => {
  await page.goto('/listas-generalizadas');
  await expect(page.getByRole('heading', { name: 'Listas generalizadas', level: 1 })).toBeVisible();
  await expect(page.locator('.code-panel pre')).toContainText('int tag');
  await expect(page.locator('.code-panel pre')).toContainText('Node dlink');
  await expect(page.locator('.code-panel pre')).toContainText('int ref');
  await expect(page.locator('.code-panel pre')).toContainText('Node link');

  await page.getByRole('textbox', { name: 'Lista generalizada', exact: true }).fill('((a,b),((c,d),e))');
  await page.getByRole('button', { name: 'Construir lista', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 34; index++) {
    await advanceAvailableStep(page);
  }
  await expect(page.locator('.generalized-node.tag-0')).toHaveCount(5);
  await expect(page.locator('.generalized-node.tag-1')).toHaveCount(3);
  await expect(page.locator('.generalized-node.tag-2')).toHaveCount(4);
  await expect(page.locator('.generalized-edge.dlink')).toHaveCount(3);

  await page.getByRole('button', { name: 'Obtener Head', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 5; index++) await advanceAvailableStep(page);
  await expect(page.locator('.operation-message')).toContainText('Head(A) = (a,b)');

  await page.getByRole('button', { name: 'Calcular profundidad', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 60; index++) await advanceAvailableStep(page);
  await expect(page.locator('.operation-message')).toContainText('Depth(A) = 3');

  await page.getByRole('button', { name: 'Compartir raíz', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 5; index++) await advanceAvailableStep(page);
  await expect(page.locator('[data-generalized-path="root.header"]')).toContainText('2');
  await expect(page.locator('.generalized-aliases')).toContainText('R2');
});

test('rechaza datos extremos sin alterar ni romper las estructuras', async ({ page }) => {
  await page.goto('/array');
  await expect(page.locator('.linear-visual .data-cell')).not.toHaveCount(0);
  const initialArrayCells = await page.locator('.linear-visual .data-cell').count();
  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Agregar en índice' }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
  await expect(page.locator('.linear-visual .data-cell')).toHaveCount(initialArrayCells);

  await page.getByLabel('Valor').fill('99');
  await page.getByLabel('Índice').fill('-1');
  await page.getByRole('button', { name: 'Agregar en índice' }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
  await expect(page.locator('.linear-visual .data-cell')).toHaveCount(initialArrayCells);

  await page.goto('/matriz-dispersa');
  await page.getByLabel('Fila').fill('99');
  await page.getByRole('button', { name: 'Recorrer fila' }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
  await expect(page.locator('.sparse-node')).toHaveCount(10);

  await page.goto('/expression-tree');
  const initialScriptCount = await page.locator('script').count();
  await page.getByRole('textbox', { name: 'Expresión', exact: true }).fill('<script>alert(1)</script>');
  await page.getByRole('button', { name: 'Construir' }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
  await expect(page.locator('script')).toHaveCount(initialScriptCount);

  await page.goto('/factorial');
  await page.getByLabel('Número n').fill('21');
  await page.getByRole('button', { name: 'Calcular' }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);

  await page.goto('/grafo');
  await page.getByLabel('Origen / vértice').fill('A');
  await page.getByLabel('Destino').fill('A');
  await page.getByRole('button', { name: 'Agregar arista' }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
});

test('Fibonacci y Factorial construyen y resuelven su árbol real de llamadas', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La lógica recursiva es idéntica; el catálogo móvil verifica su adaptación visual.');
  test.setTimeout(55_000);
  const samples = [
    { id: 'fibonacci', input: '4', nodes: 9, result: 'Fibonacci(4) = 3', calls: ['int left = fibonacci(number - 1);', 'int right = fibonacci(number - 2);'] },
    { id: 'factorial', input: '4', nodes: 4, result: 'Factorial(4) = 24', calls: ['int smaller = factorial(number - 1);', 'return number * smaller;'] },
  ];

  for (const sample of samples) {
    await page.goto(`/${sample.id}`);
    await page.getByLabel('Velocidad').selectOption('2');
    await page.getByLabel('Número n').fill(sample.input);
    await page.getByRole('button', { name: 'Calcular', exact: true }).click();

    await expect(page.locator('.operation-message')).toContainText(sample.result, { timeout: 30_000 });
    await expect(page.locator('.recursion-call-node')).toHaveCount(sample.nodes);
    await expect(page.locator('.recursion-call-node.returned')).toHaveCount(sample.nodes);
    await expect(page.locator('.recursion-call-node.current')).toContainText(sample.input);
    await expect(page.locator('.recursion-tree-legend')).toContainText('Esperando retorno');
    const java = await page.locator('.code-panel pre').innerText();
    for (const call of sample.calls) expect(java).toContain(call);
  }
});

test('la línea Java, las variables y la animación avanzan juntas en distintas categorías', async ({ page }) => {
  test.setTimeout(120_000);
  const cases = [
    { id: 'array', fields: { Valor: '99' }, action: 'Agregar inicio' },
    { id: 'bfs', fields: { 'Origen / vértice': 'A' }, action: 'Ejecutar BFS' },
    { id: 'hanoi', fields: {}, action: 'Resolver' },
    { id: 'n-reinas', fields: { Tamaño: '8' }, action: 'Resolver' },
  ];

  for (const sample of cases) {
    await page.goto(`/${sample.id}`);
    for (const [label, value] of Object.entries(sample.fields)) {
      await page.getByLabel(label).fill(value);
    }
    await page.getByRole('button', { name: sample.action, exact: true }).click();
    const pause = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await pause.isVisible()) await pause.click();

    const activeLines = new Set();
    const messages = new Set();
    let sawVariables = false;
    for (let step = 0; step < 18; step++) {
      const activeCode = page.locator('.code-panel code.active');
      if (await activeCode.count()) activeLines.add((await activeCode.textContent())?.trim());
      const message = await page.locator('.operation-message p').textContent();
      if (message) messages.add(message.trim());
      sawVariables ||= await page.locator('.variable-item').count() > 0;
      await advanceAvailableStep(page);
    }

    expect(activeLines.size, `${sample.id}: el código no avanzó`).toBeGreaterThan(2);
    expect(messages.size, `${sample.id}: la explicación no avanzó`).toBeGreaterThan(1);
    expect(sawVariables, `${sample.id}: no mostró variables`).toBe(true);
  }
});

test('cambiar de lenguaje durante una operación conserva el resultado confirmado', async ({ page }) => {
  await page.goto('/array');
  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Agregar final', exact: true }).click();
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await expect(page.locator('.linear-visual .data-cell span').last()).toHaveText('99');
  await expect(page.locator('.operation-message')).toContainText('99 fue agregado al final');
});

test('Quick Sort y Merge Sort ejecutan sus algoritmos reales junto al código', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La lógica es idéntica y el catálogo móvil ya valida el visualizador.');
  test.setTimeout(90_000);
  const samples = [
    {
      id: 'quick-sort',
      expected: [4, 10, 18, 21, 33, 47, 55],
      codeParts: ['int partition(int low, int high)', 'int pivot = values[high]', 'quickSort(low, pivotIndex - 1)'],
      phases: ['Elegir pivote', 'Comparar con pivote', 'Pivote en posición definitiva'],
    },
    {
      id: 'merge-sort',
      expected: [5, 8, 12, 19, 27, 38, 44],
      codeParts: ['int[] help = new int[size]', 'void merge(int left, int middle, int right, int[] help)', 'values[index] = help[index]'],
      phases: ['Dividir en mitades', 'Comparar mitades', 'Escribir resultado'],
    },
  ];

  for (const sample of samples) {
    await page.goto(`/${sample.id}`);
    await page.getByRole('button', { name: 'Ordenar', exact: true }).click();
    const java = await page.locator('.code-panel').textContent();
    expect(java).not.toContain('bubbleSort');
    for (const codePart of sample.codeParts) expect(java).toContain(codePart);

    const pause = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await pause.isVisible()) await pause.click();

    const visitedPhases = new Set();
    const visitedLines = new Set();
    let sawPivotOrHalves = false;
    let sawAuxiliaryValue = false;
    let completed = false;
    const next = page.getByRole('button', { name: 'Siguiente', exact: true });
    for (let frame = 0; frame < 420; frame++) {
      const currentPhase = (await page.locator('.sort-phase-label strong').textContent())?.trim();
      visitedPhases.add(currentPhase);
      visitedLines.add((await page.locator('.code-panel code.active').textContent())?.trim());
      if (sample.id === 'quick-sort') {
        sawPivotOrHalves ||= await page.locator('.sort-cell.pivot, .sort-cell.fixed').count() > 0;
      } else {
        sawPivotOrHalves ||= await page.locator('.sort-cell.left-half, .sort-cell.right-half').count() > 0;
        const auxiliaryValues = await page.locator('.auxiliary-row .sort-cell span').allTextContents();
        sawAuxiliaryValue ||= auxiliaryValues.some(value => value.trim() !== '·');
      }
      if (currentPhase === `${sample.id === 'quick-sort' ? 'Quick' : 'Merge'} Sort terminado`) {
        completed = true;
        break;
      }
      await next.click();
    }

    for (const phase of sample.phases) {
      expect(visitedPhases.has(phase), `${sample.id}: no mostró la fase ${phase}`).toBe(true);
    }
    expect(visitedLines.size, `${sample.id}: el código no avanzó`).toBeGreaterThan(5);
    expect(sawPivotOrHalves, `${sample.id}: faltan sus estados visuales propios`).toBe(true);
    if (sample.id === 'merge-sort') expect(sawAuxiliaryValue, 'Merge Sort: help nunca recibió valores').toBe(true);
    expect(completed, `${sample.id}: la reproducción no llegó al resultado final`).toBe(true);

    const visibleValues = (await page.locator('.sort-array-row').first().locator('.sort-cell span').allTextContents())
      .map(Number);
    expect(visibleValues).toEqual(sample.expected);
  }
});

test('los otros ocho ordenamientos usan su lógica y animación propias', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La lógica se audita en escritorio y el catálogo móvil se prueba por separado.');
  test.setTimeout(120_000);
  const samples = [
    { id: 'bubble-sort', method: 'void bubbleSort()', phase: 'Bubble Sort terminado', expected: [8, 10, 13, 14, 22, 29, 37] },
    { id: 'selection-sort', method: 'void selectionSort()', phase: 'Selection Sort terminado', expected: [3, 7, 12, 18, 25, 31, 40] },
    { id: 'insertion-sort', method: 'void insertionSort()', phase: 'Insertion Sort terminado', expected: [4, 6, 11, 18, 19, 23, 27] },
    { id: 'shell-sort', method: 'void shellSort()', phase: 'Shell Sort terminado', expected: [5, 8, 11, 17, 19, 26, 33, 42] },
    { id: 'heap-sort', method: 'void heapSort()', phase: 'Heap Sort terminado', expected: [4, 9, 12, 17, 21, 28, 31, 35] },
    { id: 'counting-sort', method: 'void countingSort()', phase: 'Counting Sort terminado', expected: [-2, -2, 1, 1, 4, 4, 5, 7] },
    { id: 'radix-sort', method: 'void radixSort()', phase: 'Radix Sort terminado', expected: [-90, 2, 24, 45, 66, 75, 170, 802] },
    { id: 'bogo-sort', method: 'void bogoSort()', phase: 'Bogo Sort terminado', expected: [1, 2, 3, 4] },
  ];

  for (const sample of samples) {
    await page.goto(`/${sample.id}`);
    await page.getByRole('button', { name: 'Ordenar', exact: true }).click();
    const java = await page.locator('.code-panel').textContent();
    expect(java).toContain(sample.method);
    expect(java).not.toContain('Arrays.sort');

    const pause = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await pause.isVisible()) await pause.click();
    const visitedLines = new Set();
    let completed = false;
    for (let frame = 0; frame < 420; frame++) {
      const phase = (await page.locator('.sort-phase-label strong').textContent())?.trim();
      const line = (await page.locator('.code-panel code.active').textContent())?.trim();
      if (line) visitedLines.add(line);
      if (phase === sample.phase) {
        completed = true;
        break;
      }
      await advanceAvailableStep(page);
    }

    expect(completed, `${sample.id}: no alcanzó su fase final`).toBe(true);
    expect(visitedLines.size, `${sample.id}: el código no avanzó con la animación`).toBeGreaterThan(2);
    const visibleValues = (await page.locator('.sort-array-row').first().locator('.sort-cell span').allTextContents()).map(Number);
    expect(visibleValues).toEqual(sample.expected);
  }
});

test('Laberinto mueve el código entre isFree, isExit, recursión y backtracking', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La traza es idéntica en ambos tamaños.');
  await page.goto('/laberinto');
  await page.getByRole('button', { name: 'Resolver recursivamente', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();

  const visitedLines = new Set();
  for (let step = 0; step < 100; step++) {
    const activeLine = (await page.locator('.code-panel code.active').textContent())?.replace(/^\d+\s*/, '').trim();
    if (activeLine) visitedLines.add(activeLine);
    await advanceAvailableStep(page);
  }

  expect([...visitedLines].some(line => line.startsWith('if (!isFree'))).toBe(true);
  expect([...visitedLines].some(line => line.startsWith('path[row][column] = true'))).toBe(true);
  expect([...visitedLines].some(line => line.startsWith('if (isExit'))).toBe(true);
  expect([...visitedLines].some(line => line.includes('solveMaze(row + 1, column)'))).toBe(true);
  expect([...visitedLines].some(line => line.startsWith('path[row][column] = false'))).toBe(true);
  await expect(page.locator('.maze-grid > div').nth(35)).toHaveClass(/path/);
  await expect(page.locator('.operation-message')).toContainText('laberinto quedó resuelto');
});

test('Sudoku recorre todas las líneas ejecutables del Java mostrado', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La cobertura del código es idéntica en ambos tamaños.');
  test.setTimeout(90_000);
  await page.goto('/sudoku');
  await page.getByRole('button', { name: 'Resolver 9×9', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();

  const visitedLines = new Set();
  for (let step = 0; step < 110; step++) {
    const activeLine = (await page.locator('.code-panel code.active').textContent())?.replace(/^\d+\s*/, '').trim();
    if (activeLine) visitedLines.add(activeLine);
    await advanceAvailableStep(page);
  }

  const requiredFragments = [
    'boolean solveSudoku(int row, int column)',
    'if (row == 9) return true',
    'if (column == 9) return solveSudoku',
    'if (board[row][column] != 0)',
    'return solveSudoku(row, column + 1)',
    'for (int number = 1; number <= 9; number++)',
    'if (isValid(row, column, number))',
    'board[row][column] = number',
    'if (solveSudoku(row, column + 1)) return true',
    'board[row][column] = 0',
    'return false',
    'boolean isValid(int row, int column, int number)',
    'for (int index = 0; index < 9; index++)',
    'if (board[row][index] == number) return false',
    'if (board[index][column] == number) return false',
    'int firstRow = (row / 3) * 3',
    'int firstColumn = (column / 3) * 3',
    'for (int r = firstRow; r < firstRow + 3; r++)',
    'for (int c = firstColumn; c < firstColumn + 3; c++)',
    'if (board[r][c] == number) return false',
    'return true',
  ];

  for (const fragment of requiredFragments) {
    expect(
      [...visitedLines].some(line => line.includes(fragment)),
      `Sudoku no iluminó la línea: ${fragment}`,
    ).toBe(true);
  }
  await expect(page.locator('.sudoku-grid > div')).toHaveCount(81);
  const completedCells = await page.locator('.sudoku-grid > div').evaluateAll(cells => cells.filter(cell => cell.textContent.trim()).length);
  expect(completedCells).toBe(81);
});

test('ocultar el menú también libera el espacio del encabezado del tema', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'El menú lateral móvil usa su propio panel superpuesto.');
  await page.goto('/matriz-dispersa');
  const visualPanel = page.locator('.visual-panel');
  const initialBox = await visualPanel.boundingBox();

  await page.getByRole('button', { name: 'Ocultar menú lateral' }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-collapsed/);
  await expect(page.getByRole('heading', { name: 'Matriz poco poblada', level: 1 })).toHaveCount(0);

  await expect.poll(async () => (await visualPanel.boundingBox())?.width ?? 0).toBeGreaterThan(initialBox.width);
  const expandedBox = await visualPanel.boundingBox();
  expect(expandedBox.width).toBeGreaterThan(initialBox.width);
  expect(expandedBox.y).toBeLessThan(initialBox.y);
  expect(expandedBox.y).toBeGreaterThanOrEqual(12);

  await page.getByRole('button', { name: 'Mostrar menú lateral' }).click();
  await expect(page.getByRole('heading', { name: 'Matriz poco poblada', level: 1 })).toBeVisible();
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

test('C++ usa punteros y memoria dinámica explícita', async ({ page }) => {
  await page.goto('/array');
  await page.getByRole('button', { name: 'C++', exact: true }).click();

  const arrayCode = page.locator('.code-panel pre');
  await expect(arrayCode).toContainText('int* values');
  await expect(arrayCode).toContainText('new int[CAPACITY]');
  await expect(arrayCode).toContainText('delete[] values');
  await expect(arrayCode).toContainText('values[i] = values[i - 1]');
  await expect(arrayCode).not.toContainText('vector');

  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Agregar inicio', exact: true }).click();
  await expect(page.locator('.code-panel code.active')).toBeVisible();

  await page.goto('/lista-simple');
  await expect(page.getByRole('button', { name: 'C++', exact: true })).toHaveClass(/active/);
  await page.getByRole('button', { name: 'Eliminar inicio', exact: true }).click();
  const listCode = await page.locator('.code-panel pre').textContent();
  expect(listCode).toContain('Node* removed = head');
  expect(listCode).toContain('head = head->next');
  expect(listCode).toContain('delete removed');

  await page.reload();
  await expect(page.getByRole('button', { name: 'C++', exact: true })).toHaveClass(/active/);

  await page.goto('/bst');
  await expect(page.getByRole('button', { name: 'C++', exact: true })).toHaveClass(/active/);
  await expect(page.locator('.code-panel pre')).toContainText('Node* insert(Node* node, int value)');

  await page.goto('/bubble-sort');
  await expect(page.getByRole('button', { name: 'C++', exact: true })).toHaveClass(/active/);
  await page.getByRole('button', { name: 'Ordenar', exact: true }).click();
  const sortingCode = await page.locator('.code-panel pre').textContent();
  expect(sortingCode).toContain('int* values');
  expect(sortingCode).toContain('delete[] values');
  expect(sortingCode).toContain('for (int end = size - 1; end > 0; end--)');
  expect(sortingCode).not.toContain('vector');

  await page.goto('/rojo-negro');
  await expect(page.getByRole('button', { name: 'C++', exact: true })).toHaveClass(/active/);
  await expect(page.locator('.code-panel pre')).toContainText('class RedBlackTree');
  await expect(page.locator('.code-panel pre')).toContainText('Node* nil');

  await page.goto('/bstar-tree');
  await expect(page.getByRole('button', { name: 'C++', exact: true })).toHaveClass(/active/);
  await expect(page.locator('.code-panel pre')).toContainText('class BStarTree');
  await expect(page.locator('.code-panel pre')).toContainText('int* keys');
  await expect(page.locator('.code-panel pre')).toContainText('new int[MAX_KEYS + 1]');
  await expect(page.locator('.code-panel pre')).toContainText('delete[] keys');
  await page.getByLabel('Clave').fill('15');
  await page.getByRole('button', { name: 'Eliminar clave', exact: true }).click();
  await expect(page.locator('.code-panel pre')).toContainText('fixUnderflow');
  await expect(page.locator('.code-panel pre')).not.toContainText('RawArraySorter');

  await page.goto('/fibonacci-heap');
  await page.getByTitle('Ejecutar: Vaciar').click();
  await expect(page.locator('.code-panel pre')).toContainText('class FibonacciHeap');
  await expect(page.locator('.code-panel pre')).toContainText('destroyCircular');

  await page.goto('/matriz-dispersa');
  await expect(page.locator('.code-panel pre')).toContainText('Node** AROW');
  await expect(page.locator('.code-panel pre')).toContainText('Node** ACOL');
  await expect(page.locator('.code-panel pre')).toContainText('int height');
  await expect(page.locator('.code-panel pre')).toContainText('int width');
  await expect(page.locator('.code-panel pre')).toContainText('SparseMatrix(int matrixHeight = 5, int matrixWidth = 6)');
  await expect(page.locator('.code-panel pre')).toContainText('delete[] AROW');
  await expect(page.locator('.code-panel pre')).toContainText('delete[] ACOL');
});

test('la animación C++ ilumina instrucciones reales y nunca el armazón de la clase', async ({ page }) => {
  test.setTimeout(90_000);
  const samples = [
    { id: 'pila', field: ['Valor', '91'], action: 'Push', steps: 7 },
    { id: 'bfs', field: ['Origen / vértice', 'A'], action: 'Ejecutar BFS', steps: 24 },
    { id: 'hanoi', field: null, action: 'Resolver', steps: 24 },
    { id: 'laberinto', field: null, action: 'Resolver recursivamente', steps: 40 },
  ];

  for (const sample of samples) {
    await page.goto(`/${sample.id}`);
    await page.getByRole('button', { name: 'C++', exact: true }).click();
    if (sample.field) await page.getByLabel(sample.field[0]).fill(sample.field[1]);
    await page.getByRole('button', { name: sample.action, exact: true }).click();
    const pause = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await pause.isVisible()) await pause.click();

    const activeLines = new Set();
    for (let step = 0; step < sample.steps; step++) {
      const active = (await page.locator('.code-panel code.active').textContent())?.trim();
      if (active) activeLines.add(active);
      await advanceAvailableStep(page);
    }

    expect(activeLines.size, `${sample.id}: C++ quedó detenido`).toBeGreaterThan(2);
    for (const line of activeLines) {
      expect(line, `${sample.id}: iluminó una declaración de clase`).not.toMatch(/^class\b/);
      expect(line, `${sample.id}: iluminó un modificador de acceso`).not.toMatch(/^(public|private|protected):$/);
      expect(['{', '}', '};']).not.toContain(line);
    }
  }
});

test('BFS en C++ sincroniza rear, memoria dinámica y la condición final de la cola', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La traza es idéntica y la prueba completa se ejecuta en escritorio.');
  test.setTimeout(90_000);
  await page.goto('/bfs');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await page.getByRole('button', { name: 'Ejecutar BFS', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('BFS comienza desde el vértice A.');
  await expect(page.locator('.code-panel pre')).toContainText('int* queue = new int[MAX_VERTICES]{};');
  await expect(page.locator('.code-panel pre')).toContainText('bool* visited = new bool[MAX_VERTICES]{};');

  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();

  let completed = false;
  const activeLines = new Set();
  for (let step = 0; step < 220; step++) {
    const message = (await page.locator('.operation-message p').textContent())?.trim() ?? '';
    const activeLine = (await page.locator('.code-panel code.active').textContent())?.trim() ?? '';
    if (activeLine) activeLines.add(activeLine.replace(/^\d+/, '').trim());
    if (message.includes('BFS termina después de liberar toda la memoria dinámica.')) {
      completed = true;
      break;
    }
    await advanceAvailableStep(page);
  }

  expect(completed, 'BFS debe alcanzar su condición de salida').toBe(true);
  await expect(page.locator('.code-panel code.active')).toContainText('return true;');
  await expect(page.locator('.operation-message')).toContainText('BFS termina después de liberar toda la memoria dinámica.');
  expect(activeLines).toContain('while (front < rear) {');
  expect(activeLines).toContain('delete[] visited;');
  expect(activeLines).toContain('delete[] queue;');
  await expect(page.locator('.variables-panel')).toContainText('rear');

  await page.goto('/grafo');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await page.getByRole('button', { name: 'Recorrer DFS', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('DFS comienza desde el vértice A.');
  const dfsPause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await dfsPause.isVisible()) await dfsPause.click();
  let dfsCompleted = false;
  const dfsActiveLines = new Set();
  for (let step = 0; step < 160; step++) {
    const message = (await page.locator('.operation-message p').textContent())?.trim() ?? '';
    const activeLine = (await page.locator('.code-panel code.active').textContent())?.trim() ?? '';
    if (activeLine) dfsActiveLines.add(activeLine.replace(/^\d+/, '').trim());
    if (message.includes('DFS termina después de liberar la memoria dinámica.')) {
      dfsCompleted = true;
      break;
    }
    await advanceAvailableStep(page);
  }
  expect(dfsCompleted, 'DFS debe terminar después de liberar visited').toBe(true);
  expect(dfsActiveLines).toContain('delete[] visited;');
  await expect(page.locator('.code-panel code.active')).toContainText('return true;');
});

test('BFS y DFS en C++ muestran el estado y las variables de sus instrucciones reales', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La traza es idéntica y se comprueba en escritorio.');
  test.setTimeout(60_000);
  const activeLine = page.locator('.code-panel code.active');
  const next = page.getByRole('button', { name: 'Siguiente', exact: true });
  const variable = name => page.locator('.variables-panel .variable-item')
    .filter({ has: page.getByText(name, { exact: true }) }).locator('strong');
  const pending = page.locator('.graph-operation-status span')
    .filter({ hasText: 'Pendientes' }).locator('b');
  const stepTo = async needle => {
    for (let step = 0; step < 90; step++) {
      if ((await activeLine.textContent())?.includes(needle)) return;
      await next.click();
    }
    throw new Error(`No se iluminó la instrucción C++: ${needle}`);
  };
  const pause = async () => {
    const button = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await button.isVisible()) await button.click();
  };

  await page.goto('/bfs');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await page.getByRole('button', { name: 'Ejecutar BFS', exact: true }).click();
  await pause();

  await stepTo('int* queue = new int[MAX_VERTICES]{};');
  await expect(pending).toHaveText('∅');
  await expect(variable('front')).toHaveCount(0);
  await expect(variable('rear')).toHaveCount(0);
  await stepTo('bool* visited = new bool[MAX_VERTICES]{};');
  await expect(pending).toHaveText('∅');
  await expect(variable('rear')).toHaveCount(0);
  await stepTo('int front = 0;');
  await expect(variable('front')).toHaveText('0');
  await expect(variable('rear')).toHaveCount(0);
  await stepTo('int rear = 0;');
  await expect(variable('rear')).toHaveText('0');
  await expect(pending).toHaveText('∅');
  await stepTo('queue[rear++] = start;');
  await expect(variable('rear')).toHaveText('1');
  await expect(pending).toHaveText('A');
  await stepTo('int vertex = queue[front++];');
  await expect(variable('front')).toHaveText('1');
  await expect(pending).toHaveText('∅');
  await next.click();
  await expect(activeLine).not.toContainText('int vertex = queue[front++];');
  await stepTo('for (int neighbor = 0; neighbor < vertexCount; neighbor++) {');
  await expect(variable('neighbor')).toHaveText('0');
  await expect(variable('next')).toHaveCount(0);
  await stepTo('if (adjacency[vertex][neighbor] && !visited[neighbor]) {');
  await expect(variable('hasEdge')).toHaveCount(0);
  await next.click();
  await expect(activeLine).not.toContainText('if (adjacency[vertex][neighbor] && !visited[neighbor]) {');
  await stepTo('queue[rear++] = neighbor;');
  await expect(variable('rear')).toHaveText('2');
  await next.click();
  await expect(activeLine).not.toContainText('queue[rear++] = neighbor;');

  await page.goto('/grafo');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await page.getByRole('button', { name: 'Recorrer DFS', exact: true }).click();
  await pause();
  await stepTo('for (int neighbor = 0; neighbor < vertexCount; neighbor++) {');
  await expect(variable('neighbor')).toHaveText('0');
  await expect(variable('next')).toHaveCount(0);
  await stepTo('if (adjacency[vertex][neighbor] && !visited[neighbor]) {');
  await expect(variable('hasEdge')).toHaveCount(0);
  await next.click();
  await expect(activeLine).not.toContainText('if (adjacency[vertex][neighbor] && !visited[neighbor]) {');
});

test('avisa si falla la carga diferida del código en vez de dejar la operación sin respuesta', async ({ page }) => {
  await page.goto('/bfs');
  await page.route(/beginnerCpp.*\.js/, route => route.abort());
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/error/);
  await expect(page.locator('.operation-message')).toContainText('No se pudo cargar el código de la operación.');

  await page.getByRole('button', { name: 'Ejecutar BFS', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('Recarga la página e inténtalo de nuevo.');
});

test('QuadTree y Octree insertan coordenadas reales coherentes con su código', async ({ page }) => {
  test.setTimeout(60_000);
  const cases = [
    { id: 'quadtree', coordinates: { 'Coordenada X': '91', 'Coordenada Y': '-84' }, point: '91,-84', dimensions: 2, pointSelector: '.spatial-quad-point' },
    { id: 'octree', coordinates: { 'Coordenada X': '-88', 'Coordenada Y': '79', 'Coordenada Z': '63' }, point: '-88,79,63', dimensions: 3, pointSelector: '.spatial-leaf' },
  ];

  for (const sample of cases) {
    await page.goto(`/${sample.id}`);
    for (const [label, value] of Object.entries(sample.coordinates)) await page.getByLabel(label).fill(value);
    await page.getByRole('button', { name: 'Insertar punto', exact: true }).click();
    const pause = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await pause.isVisible()) await pause.click();
    const visiblePoint = page.locator(sample.pointSelector, { hasText: sample.point });
    for (let step = 0; step < 80 && await visiblePoint.count() === 0; step++) {
      await advanceAvailableStep(page);
    }
    await expect(visiblePoint).toBeVisible();
    await expect(page.locator('.operation-message')).toContainText(sample.point);

    await page.getByRole('button', { name: 'C++', exact: true }).click();
    const code = page.locator('.code-panel pre');
    await expect(code).toContainText('struct Point');
    await expect(code).toContainText('double x');
    await expect(code).toContainText('double y');
    if (sample.dimensions === 3) await expect(code).toContainText('double z');
  }
});

test('los reinicios especializados muestran el estado que realmente restauran', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La implementación mostrada es la misma en ambos tamaños.');
  test.setTimeout(60_000);
  const samples = [
    { id: 'hanoi', expected: 'resetTowers(int disks)' },
    { id: 'n-reinas', expected: 'resetQueens(int boardSize)' },
    { id: 'laberinto', expected: 'resetPath()' },
    { id: 'sudoku', expected: 'resetBoard(int[][] initialBoard)' },
    { id: 'union-find', expected: 'resetSets(int amount)' },
  ];

  for (const sample of samples) {
    await page.goto(`/${sample.id}`);
    await page.getByRole('button', { name: 'Java', exact: true }).click();
    await page.getByTitle('Ejecutar: Restablecer').click();
    const code = await page.locator('.code-panel pre').textContent();
    expect(code).toContain(sample.expected);
    expect(code).not.toContain('values[i] = initialValues[i]');
  }
});

test('Segment Tree y Fenwick C++ reconstruyen sus índices al restablecer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La ejecución nativa C++ comprueba los valores y los índices internos.');
  const samples = [
    { id: 'segment-tree', required: ['tree[i] = 0;', 'minimumTree[i] = INF;', 'build(1, 0, size - 1);'] },
    { id: 'fenwick-tree', required: ['bit[i] = 0;', 'bit[index] += values[i];', 'index += index & -index;'] },
  ];
  for (const sample of samples) {
    await page.goto(`/${sample.id}`);
    await page.getByRole('button', { name: 'C++', exact: true }).click();
    await page.getByTitle('Ejecutar: Restablecer').click();
    const code = await page.locator('.code-panel pre').textContent();
    for (const fragment of sample.required) expect(code).toContain(fragment);
  }
});

test('Counting y Radix C++ conservan los negativos mediante desplazamiento', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La ejecución nativa también está cubierta por la auditoría C++.');
  const samples = [
    { id: 'counting-sort', required: ['int minimum = values[0]', 'values[i] - minimum', 'offset + minimum'] },
    { id: 'radix-sort', required: ['minimum < 0', 'countingByDigit(exponent, offsetValue)', 'static_cast<long long>(values[i]) + offset'] },
  ];

  for (const sample of samples) {
    await page.goto(`/${sample.id}`);
    await page.getByRole('button', { name: 'C++', exact: true }).click();
    await page.getByRole('button', { name: 'Ordenar', exact: true }).click();
    const code = await page.locator('.code-panel pre').textContent();
    for (const fragment of sample.required) expect(code).toContain(fragment);
    expect(code).not.toContain('if (values[i] < 0) return false');
  }
});

test('Radix C++ ilumina el ciclo de dígitos que realmente ejecuta', async ({ page }) => {
  await page.goto('/radix-sort');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await page.getByRole('button', { name: 'Ordenar', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();
  let sawExponent = false;
  for (let step = 0; step < 20; step++) {
    const message = await page.locator('.operation-message p').textContent();
    if (message?.includes('exp = 1')) {
      await expect(page.locator('.code-panel code.active')).toContainText('for (long long exponent = 1;');
      sawExponent = true;
      break;
    }
    await advanceAvailableStep(page);
  }
  expect(sawExponent).toBe(true);
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

test('vacía los datos y permite construir estructuras desde cero', async ({ page }) => {
  await page.goto('/array');
  await expect(page.locator('.data-cell')).toHaveCount(6);
  await page.getByRole('button', { name: 'Vaciar', exact: true }).click();
  await expect(page.locator('.empty-visual')).toBeVisible();
  await expect(page.locator('.operation-message')).toContainText('desde cero');
  await page.getByLabel('Valor').fill('42');
  await page.getByRole('button', { name: 'Agregar final', exact: true }).click();
  await expect(page.locator('.data-cell')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator('.data-cell')).toContainText('42');

  await page.goto('/grafo');
  await page.getByRole('button', { name: 'Vaciar', exact: true }).click();
  await expect(page.locator('.empty-visual')).toContainText('Estructura vacía');
  await page.getByLabel('Origen / vértice').fill('X');
  await page.getByRole('button', { name: 'Agregar vértice' }).click();
  await expect(page.locator('.graph-node')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator('.graph-node')).toContainText('X');
});

test('vaciar conserva las dimensiones de estructuras de tamaño fijo', async ({ page }) => {
  await page.goto('/matriz');
  await page.getByRole('button', { name: 'Vaciar', exact: true }).click();
  await expect(page.locator('.dense-matrix-cell')).toHaveCount(16);
  await expect(page.locator('.dense-matrix-cell strong')).toHaveText(new Array(16).fill('0'));

  await page.goto('/sudoku');
  await page.getByRole('button', { name: 'Vaciar', exact: true }).click();
  await expect(page.locator('.sudoku-grid > div')).toHaveCount(81);
  await expect(page.locator('.sudoku-grid > div').filter({ hasText: /\d/ })).toHaveCount(0);

  await page.goto('/n-reinas');
  await page.getByRole('button', { name: 'Vaciar', exact: true }).click();
  await expect(page.locator('.chess-board > div')).toHaveCount(16);
  await expect(page.locator('.chess-board .queen')).toHaveCount(0);
});

test('lista circular doble conserva next y prev cuando queda un solo nodo', async ({ page }) => {
  await page.goto('/lista-circular-doble');
  await page.getByLabel('Velocidad').selectOption('2');
  await expect(page.locator('.circle-node')).toHaveCount(4);

  for (let remaining = 3; remaining >= 1; remaining--) {
    await page.getByRole('button', { name: 'Eliminar final', exact: true }).click();
    if (remaining === 1) {
      await expect(page.locator('.circle-node')).toHaveCount(1, { timeout: 15_000 });
    }
  }

  const nextLoop = page.locator('.singleton-loop[data-link-direction="next"]');
  const previousLoop = page.locator('.singleton-loop[data-link-direction="prev"]');
  await expect(nextLoop).toHaveCount(1);
  await expect(previousLoop).toHaveCount(1);
  await expect(nextLoop).toHaveClass(/forward/);
  await expect(previousLoop).toHaveClass(/reverse/);
});

test('Stack y Queue muestran su código completo mientras cambia la estructura', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La traza y el Java son idénticos en ambos tamaños.');

  await page.goto('/pila');
  await expect(page.locator('.code-panel pre')).toContainText('class ArrayStack');
  await expect(page.locator('.code-panel pre')).toContainText('int top = -1');
  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Push', exact: true }).click();
  const stackLines = new Set();
  let stackChangedDuringTrace = false;
  for (let step = 0; step < 7; step++) {
    stackLines.add((await page.locator('.code-panel code.active').textContent())?.trim());
    const visibleValues = await page.locator('.stack-visual .data-cell span').allTextContents();
    if (visibleValues.includes('99')) stackChangedDuringTrace = true;
    await advanceAvailableStep(page);
  }
  expect(stackLines.size).toBeGreaterThanOrEqual(4);
  expect(stackChangedDuringTrace).toBe(true);
  await expect(page.locator('.stack-visual .data-cell').first()).toContainText('TOPE');
  await expect(page.locator('.stack-visual .data-cell').first()).toContainText('99');

  await page.goto('/cola');
  await expect(page.locator('.code-panel pre')).toContainText('class LinkedQueue');
  await expect(page.locator('.code-panel pre')).toContainText('Node front = null');
  await expect(page.locator('.code-panel pre')).toContainText('Node rear = null');
  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Enqueue', exact: true }).click();
  const queueLines = new Set();
  let queueChangedDuringTrace = false;
  for (let step = 0; step < 9; step++) {
    queueLines.add((await page.locator('.code-panel code.active').textContent())?.trim());
    const visibleValues = await page.locator('.linear-visual.queue .data-cell span').allTextContents();
    if (visibleValues.includes('99')) queueChangedDuringTrace = true;
    await advanceAvailableStep(page);
  }
  expect(queueLines.size).toBeGreaterThanOrEqual(6);
  expect(queueChangedDuringTrace).toBe(true);
  await expect(page.locator('.linear-visual.queue .data-cell').last()).toContainText('FINAL');
  await expect(page.locator('.linear-visual.queue .data-cell').last()).toContainText('99');

  await page.getByRole('button', { name: 'Dequeue', exact: true }).click();
  const dequeueJava = await page.locator('.code-panel pre').textContent();
  expect(dequeueJava).toContain('front = front.next');
  expect(dequeueJava).not.toContain('for (');
});

test('Deque valida el vacío y no ejecuta excepciones durante una inserción válida', async ({ page }) => {
  await page.goto('/deque');
  await page.getByRole('button', { name: 'Java', exact: true }).click();
  await page.getByRole('button', { name: 'Vaciar', exact: true }).click();
  await expect(page.locator('.linear-visual .data-cell')).toHaveCount(0);

  for (const action of ['Quitar frente', 'Quitar final']) {
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect(page.locator('.operation-message')).toHaveClass(/error/);
    await expect(page.locator('.linear-visual .data-cell')).toHaveCount(0);
    await expect(page.locator('.code-panel code.active')).toContainText('if (size == 0)');
  }

  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Agregar final', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();
  await expect(page.locator('.code-panel pre')).toContainText('if (size == values.length)');
  await expect(page.locator('.code-panel pre')).toContainText('int[] values = new int[100]');
  for (let step = 0; step < 12; step++) {
    await expect(page.locator('.code-panel code.active')).not.toContainText('throw');
    await advanceAvailableStep(page);
  }
  await expect(page.locator('.linear-visual .data-cell span')).toHaveText('99');
  await expect(page.locator('.operation-message')).not.toHaveClass(/error/);

  await page.getByRole('button', { name: 'Vaciar', exact: true }).click();
  await expect(page.locator('.linear-visual .data-cell')).toHaveCount(0);
  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Agregar frente', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  let sawFrontAssignment = false;
  for (let step = 0; step < 12; step++) {
    const activeLine = await page.locator('.code-panel code.active').textContent();
    expect(activeLine).not.toContain('throw');
    expect(activeLine).not.toContain('values[i] = values[i - 1]');
    if (activeLine?.includes('values[0] = value')) {
      sawFrontAssignment = true;
      await expect(page.locator('.linear-visual .data-cell span')).toHaveText('99');
    }
    await advanceAvailableStep(page);
  }
  expect(sawFrontAssignment).toBe(true);
  await expect(page.locator('.linear-visual .data-cell span')).toHaveText('99');
});

test('sincroniza el recorrido BST con la línea Java y las variables', async ({ page }) => {
  await page.goto('/bst');
  await page.getByLabel('Valor').fill('1');
  await page.getByRole('button', { name: 'Buscar' }).click();
  const pause = page.getByRole('button', { name: 'Pausar' });
  if (await pause.isVisible()) await pause.click();

  const visitedNodes = new Set();
  const activeLines = new Set();
  for (let step = 0; step < 24; step++) {
    const activeNode = page.locator('.tree-node.active .tree-value');
    if (await activeNode.count()) {
      const nodeValue = (await activeNode.textContent())?.trim();
      const liveNode = page.locator('.variable-item').filter({ hasText: 'nodo activo' }).locator('strong');
      await expect(liveNode).toHaveText(nodeValue);
      visitedNodes.add(nodeValue);
    }
    activeLines.add((await page.locator('.code-panel code.active').textContent())?.trim());
    await advanceAvailableStep(page);
  }

  expect([...visitedNodes]).toEqual(expect.arrayContaining(['8', '3', '1']));
  expect(activeLines.size).toBeGreaterThan(3);
});

test('los grafos muestran Java completo y Prim/Kruskal ejecutan su algoritmo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'El código y la traza son idénticos en ambos tamaños.');
  test.setTimeout(90_000);

  await page.goto('/grafo');
  await page.getByLabel('Origen / vértice').fill('G');
  await page.getByRole('button', { name: 'Agregar vértice', exact: true }).click();
  const addVertexJava = await page.locator('.code-panel pre').textContent();
  expect(addVertexJava).toContain('class UndirectedGraph');
  expect(addVertexJava).toContain('static final int MAX_VERTICES = 8;');
  expect(addVertexJava).toContain('String[] vertexNames');
  expect(addVertexJava).toContain('boolean[][] adjacency');
  expect(addVertexJava).toContain('boolean addVertex(String name)');
  expect(addVertexJava).toContain('int findVertex(String name)');
  expect(addVertexJava).not.toContain('int[][] weights');
  expect(addVertexJava).not.toContain('boolean directed');

  await page.goto('/grafo-dirigido');
  await page.getByLabel('Origen / vértice').fill('A');
  await page.getByLabel('Destino').fill('F');
  await expect(page.getByLabel('Peso')).toHaveCount(0);
  await page.getByRole('button', { name: 'Agregar arista', exact: true }).click();
  const directedJava = await page.locator('.code-panel pre').textContent();
  expect(directedJava).toContain('class DirectedGraph');
  expect(directedJava).toContain('adjacency[from][to] = true');
  expect(directedJava).not.toContain('adjacency[to][from] = true');
  expect(directedJava).not.toContain('directed');

  for (const sample of [
    { id: 'prim', action: 'Ejecutar Prim', method: 'void prim(String startName)', storage: 'int[][] weights', forbidden: 'Edge[] edges', cost: 15 },
    { id: 'kruskal', action: 'Ejecutar Kruskal', method: 'void kruskal()', storage: 'Edge[] edges', forbidden: 'int[][] weights', cost: 16 },
  ]) {
    await page.goto(`/${sample.id}`);
    await page.getByLabel('Velocidad').selectOption('2');
    await page.getByRole('button', { name: sample.action, exact: true }).click();
    const java = await page.locator('.code-panel pre').textContent();
    expect(java).toContain(sample.method);
    expect(java).toContain(sample.storage);
    expect(java).not.toContain(sample.forbidden);
    expect(java).not.toContain('void breadthFirst');
    expect(java).not.toContain('void depthFirst');
    await expect(page.locator('.operation-message')).toContainText(`costo total ${sample.cost}`, { timeout: 35_000 });
    await expect(page.locator('.graph-operation-status')).toContainText('5');
    await expect(page.locator('.graph-operation-status')).toContainText(String(sample.cost));
    await expect(page.locator('.graph-canvas .visited-edge')).toHaveCount(5);
  }
});

test('árbol binario inserta recursivamente sin utilizar Queue', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La recursión y el resultado son idénticos en móvil.');
  await page.goto('/arbol-binario');
  await expect(page.locator('.code-panel pre')).toContainText('insertAtFirstAvailableLevel');
  await expect(page.locator('.code-panel pre')).not.toContainText('Queue');

  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Insertar nodo', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();

  const visitedNodes = new Set();
  for (let step = 0; step < 75; step++) {
    const activeNode = page.locator('.tree-node.active .tree-value');
    if (await activeNode.count()) visitedNodes.add((await activeNode.textContent())?.trim());
    await advanceAvailableStep(page);
  }

  expect([...visitedNodes]).toEqual(expect.arrayContaining(['8', '3', '1', '99']));
  const valuesByIndex = await page.locator('.tree-arbol-binario .tree-node').evaluateAll(nodes => (
    nodes.map(node => [Number(node.dataset.treeIndex), Number(node.querySelector('.tree-value')?.textContent)])
  ));
  expect(valuesByIndex).toEqual([[0, 8], [1, 3], [2, 12], [3, 1], [4, 5], [5, 10], [6, 15], [7, 99]]);
  await expect(page.locator('.variable-item').filter({ hasText: 'nodo' }).locator('strong')).toHaveText('99');
  await expect(page.locator('.operation-message')).toContainText('insertado recursivamente');
});

test('árbol binario rechaza el 1 repetido y luego inserta correctamente el 2', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La validación utiliza la misma lógica en móvil.');
  await page.goto('/arbol-binario');
  const nodes = page.locator('.tree-arbol-binario .tree-node');

  await page.getByLabel('Valor').fill('1');
  await page.getByRole('button', { name: 'Insertar nodo', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('ya existe');
  await expect(nodes).toHaveCount(7);

  await page.getByLabel('Valor').fill('2');
  await page.getByRole('button', { name: 'Insertar nodo', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();
  for (let step = 0; step < 75; step++) {
    await advanceAvailableStep(page);
  }

  await expect(nodes).toHaveCount(8);
  await expect(page.locator('.tree-arbol-binario .tree-node[data-tree-index="7"] .tree-value')).toHaveText('2');
  await expect(page.locator('.operation-message')).toContainText('insertado recursivamente');
});

test('árbol binario C++ elimina usando el nodo más profundo a la derecha', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La lógica C++ se comprueba también con ejecución nativa.');
  await page.goto('/arbol-binario');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await page.getByLabel('Valor').fill('3');
  await page.getByRole('button', { name: 'Eliminar nodo', exact: true }).click();
  await expect(page.locator('.code-panel pre')).toContainText('Node* right = nodeAtDepth(node->right, depth - 1);');
  await expect(page.locator('.operation-message')).toContainText('eliminado', { timeout: 30_000 });
  const valuesByIndex = await page.locator('.tree-arbol-binario .tree-node').evaluateAll(nodes => (
    nodes.map(node => [Number(node.dataset.treeIndex), Number(node.querySelector('.tree-value')?.textContent)])
  ));
  expect(valuesByIndex).toEqual([[0, 8], [1, 15], [2, 12], [3, 1], [4, 5], [5, 10]]);
});

test('árbol enhebrado distingue hijos, sigue hilos e inserta correctamente', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La estructura se valida completa en escritorio y comparte la misma lógica en móvil.');
  test.setTimeout(45_000);
  await page.goto('/arbol-enhebrado');

  await expect(page.getByRole('heading', { name: 'Árbol binario enhebrado', level: 1 })).toBeVisible();
  await expect(page.locator('.threaded-child-layer line')).toHaveCount(6);
  await expect(page.locator('.thread-edge')).toHaveCount(8);
  await expect(page.locator('.thread-edge[data-thread-from="3"][data-thread-to="1"][data-thread-side="right"]')).toHaveCount(1);
  await expect(page.locator('.thread-edge[data-thread-from="4"][data-thread-to="0"][data-thread-side="right"]')).toHaveCount(1);
  await expect(page.locator('.code-panel pre')).toContainText('leftThread');
  await expect(page.locator('.code-panel pre')).toContainText('rightThread');
  await page.getByLabel('Velocidad').selectOption('2');

  await page.getByLabel('Valor').fill('12');
  await page.getByRole('button', { name: 'Insertar nodo', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('enhebrado correctamente', { timeout: 15_000 });
  await expect(page.locator('.threaded-node[data-tree-index="9"] .tree-value')).toHaveText('12');
  await expect(page.locator('.thread-edge[data-thread-from="9"][data-thread-to="1"][data-thread-side="left"]')).toHaveCount(1);
  await expect(page.locator('.thread-edge[data-thread-from="9"][data-thread-to="4"][data-thread-side="right"]')).toHaveCount(1);

  await page.getByRole('button', { name: 'Inorden sin pila', exact: true }).click();
  await expect(page.locator('.thread-edge.active')).toBeVisible({ timeout: 12_000 });
  await expect(page.locator('.operation-message')).toContainText('5 → 10 → 12 → 15 → 20 → 25 → 30 → 35', { timeout: 20_000 });
  await expect(page.locator('.code-panel pre')).not.toContainText('Stack');
  await expect(page.locator('.code-panel pre')).not.toContainText('Queue');
});

test('muestra Java específico para árboles especializados', async ({ page }) => {
  await page.goto('/avl');
  await expect(page.locator('.code-panel pre')).toContainText('balanceOf');
  await expect(page.locator('.code-panel pre')).toContainText('rotateRight');

  await page.goto('/suffix-tree');
  await expect(page.locator('.code-panel pre')).toContainText('insertSuffix');

  await page.goto('/bplus-tree');
  await expect(page.locator('.code-panel pre')).toContainText('splitLeaf');
  await expect(page.locator('.code-panel pre')).toContainText('insertIntoParent');

  await page.goto('/rojo-negro');
  await expect(page.locator('.code-panel pre')).toContainText('nil.left = nil');
  await expect(page.locator('.code-panel pre')).toContainText('if (node == parent.right)');
  await expect(page.locator('.code-panel pre')).toContainText('if (node == parent.left)');
  const colorRules = await page.evaluate(() => {
    const colors = new Map(
      [...document.querySelectorAll('.tree-node[data-tree-index]')].map(node => [
        Number(node.dataset.treeIndex),
        node.dataset.nodeColor,
      ]),
    );
    const blackHeight = index => {
      if (!colors.has(index)) return 1;
      const left = blackHeight(index * 2 + 1);
      const right = blackHeight(index * 2 + 2);
      if (left < 0 || right < 0 || left !== right) return -1;
      return left + (colors.get(index) === 'black-node' ? 1 : 0);
    };
    const redHasRedChild = [...colors].some(([index, color]) => (
      color === 'red-node'
      && (colors.get(index * 2 + 1) === 'red-node' || colors.get(index * 2 + 2) === 'red-node')
    ));
    return {
      rootIsBlack: colors.get(0) === 'black-node',
      equalBlackHeight: blackHeight(0) > 0,
      redHasRedChild,
    };
  });
  expect(colorRules).toEqual({
    rootIsBlack: true,
    equalBlackHeight: true,
    redHasRedChild: false,
  });
  await page.getByLabel('Valor').fill('5');
  await page.getByRole('button', { name: 'Eliminar nodo' }).click();
  await expect(page.locator('.code-panel pre')).toContainText('if (node.left == nil)');
  await expect(page.locator('.code-panel pre')).toContainText('root = nil');
});

test('el árbol de expresión inicial acepta el signo menos mostrado', async ({ page }) => {
  await page.goto('/expression-tree');
  await page.getByLabel('Velocidad').selectOption('2');
  await page.getByRole('button', { name: 'Evaluar', exact: true }).click();
  await expect(page.locator('.operation-message')).toHaveClass(/success/);
  await expect(page.locator('.operation-message')).toContainText('Resultado del árbol de expresión: 29.', { timeout: 20_000 });
});

test('el árbol de expresión muestra división entera coherente con Java y C++', async ({ page }) => {
  await page.goto('/expression-tree');
  await page.getByLabel('Velocidad').selectOption('2');
  await page.getByRole('textbox', { name: 'Expresión', exact: true }).fill('7/2');
  await page.getByRole('button', { name: 'Evaluar', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('Resultado del árbol de expresión: 3.', { timeout: 20_000 });
  await expect(page.locator('.code-panel pre')).toContainText('return left / right;');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await expect(page.locator('.code-panel pre')).toContainText('return left / right;');
  await expect(page.locator('.code-panel pre')).toContainText('if (right == 0) throw std::domain_error');
});

test('Sudoku y Hanoi C++ narran el mismo código y estado que muestran', async ({ page }) => {
  await page.goto('/sudoku');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await expect(page.locator('.code-panel pre')).toContainText('bool solveSudoku(int row, int column)');
  await page.getByRole('button', { name: 'Resolver 9×9', exact: true }).click();
  const sudokuPause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await sudokuPause.isVisible()) await sudokuPause.click();
  await expect(page.locator('.operation-message')).toContainText('solveSudoku(0, 0)');
  await expect(page.locator('.code-panel code.active')).toContainText('bool solveSudoku(int row, int column)');
  await advanceAvailableStep(page);
  await expect(page.locator('.operation-message')).toContainText('caso base');
  await expect(page.locator('.code-panel code.active')).toContainText('if (row == 9) return true;');

  await page.goto('/hanoi');
  await page.getByRole('button', { name: 'C++', exact: true }).click();
  await expect(page.locator('.code-panel pre')).toContainText('int diskCount = 5;');
  await page.getByRole('button', { name: 'Resolver', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('hanoi(5, A, C, B)');
  await expect(page.locator('.code-panel code.active')).toContainText('void hanoi(int amount');
});

test('N-Reinas y Laberinto C++ nombran la función que se ilumina', async ({ page }) => {
  for (const sample of [
    { id: 'n-reinas', action: 'Resolver', method: 'solveQueens(' },
    { id: 'laberinto', action: 'Resolver recursivamente', method: 'solveMaze(' },
  ]) {
    await page.goto(`/${sample.id}`);
    await page.getByRole('button', { name: 'C++', exact: true }).click();
    await page.getByRole('button', { name: sample.action, exact: true }).click();
    await expect(page.locator('.operation-message')).toContainText(sample.method);
    await expect(page.locator('.code-panel code.active')).toContainText(sample.method);
  }
});

test('Dijkstra y A* muestran código Java y C++ junto al mapa', async ({ page }) => {
  test.setTimeout(60_000);
  for (const id of ['dijkstra', 'a-star']) {
    await page.goto(`/${id}`);
    await expect(page.locator('.code-panel')).toBeVisible();
    const mapWidth = (await page.locator('.path-map-visual').boundingBox()).width;
    const panelWidth = (await page.locator('.visual-panel').boundingBox()).width;
    expect(mapWidth).toBeGreaterThan(panelWidth * 0.8);
    await page.getByRole('button', { name: 'Java', exact: true }).click();
    await expect(page.locator('.code-panel pre')).toContainText('map[next] < 0');
    await page.getByRole('button', { name: 'C++', exact: true }).click();
    await expect(page.locator('.code-panel pre')).toContainText('map[neighbor]');
    await page.clock.pauseAt(new Date());
    await page.getByRole('button', { name: id === 'dijkstra' ? 'Ejecutar Dijkstra' : 'Ejecutar A*', exact: true }).click();
    await expect(page.locator('.operation-message')).toHaveClass(/running/);
    await expect(page.locator('.operation-message')).toContainText('Ejecutando');
    await expect(page.locator('.code-panel code.active')).toContainText('distance[start] = 0;');
    const pause = page.getByRole('button', { name: 'Pausar', exact: true });
    if (await pause.isVisible()) await pause.click();
    await advanceAvailableStep(page);
    await expect(page.locator('.code-panel code.active')).toContainText(
      id === 'dijkstra' ? 'minimumDistance(settled)' : 'minimumScore(score, closed)',
    );
    await expect(page.locator('.operation-message')).toHaveClass(/running/);
    // Advance through the actual player while the clock remains paused.
    // A single large clock jump cannot flush React's per-step timer effects.
    const next = page.getByRole('button', { name: 'Siguiente', exact: true });
    for (let remainingSteps = 0; remainingSteps < 1000 && await next.isEnabled(); remainingSteps++) {
      await next.press('Enter');
    }
    await expect(page.locator('.operation-message')).toHaveClass(/success/);
    await expect(page.locator('.operation-message')).toContainText('Operación completada');
    await expect(next).toBeDisabled();
  }
});

test('Dijkstra y A* mantienen visible la línea activa al avanzar por el código', async ({ page }) => {
  for (const [algorithm, action] of [['dijkstra', 'Ejecutar Dijkstra'], ['a-star', 'Ejecutar A*']]) {
    for (const mode of ['Java', 'C++']) {
      await page.goto(`/${algorithm}`);
      await page.getByRole('button', { name: mode, exact: true }).click();
      await page.getByRole('button', { name: action, exact: true }).click();
      const pause = page.getByRole('button', { name: 'Pausar', exact: true });
      if (await pause.isVisible()) await pause.click();
      const code = page.locator('.panel.code-panel pre');
      for (let step = 0; step < 12; step++) {
        await advanceAvailableStep(page);
        await expect.poll(async () => code.evaluate(panel => {
          const active = panel.querySelector('code.active');
          if (!active) return false;
          const panelBounds = panel.getBoundingClientRect();
          const lineBounds = active.getBoundingClientRect();
          return lineBounds.top >= panelBounds.top && lineBounds.bottom <= panelBounds.bottom;
        }), { timeout: 1500 }).toBe(true);
      }
    }
  }
});

test('el Java visible incluye la clase y el contexto de cada familia', async ({ page }) => {
  for (const [id, className] of [
    ['array', 'Array'], ['avl', 'AVLTree'], ['btree', 'BTree'],
    ['bubble-sort', 'BubbleSort'], ['laberinto', 'Maze'],
    ['rojo-negro', 'RedBlackTree'], ['fibonacci-heap', 'FibonacciHeap'],
    ['heap', 'BinaryHeap'], ['union-find', 'UnionFind'], ['hash-table', 'HashTable'],
  ]) {
    await page.goto(`/${id}`);
    await page.getByRole('button', { name: 'Java', exact: true }).click();
    await expect(page.locator('.code-panel pre')).toContainText(`class ${className} {`);
    await expect(page.locator('.code-panel pre')).not.toContainText('AlgorithmExample');
    if (id === 'fibonacci-heap') {
      await expect(page.locator('.code-panel pre')).toContainText('void insertMinimum(int value)');
      await expect(page.locator('.code-panel pre')).toContainText('void addRoot(Node node)');
    } else {
      await expect(page.locator('.code-panel pre')).toContainText('// Start of the selected operation');
    }
  }
});

test('AVL inserta 1 sin reconstruir ni rotar incorrectamente el árbol', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La lógica y los factores son idénticos en móvil.');
  await page.goto('/avl');
  await page.getByLabel('Valor').fill('1');
  await page.getByRole('button', { name: 'Insertar nodo', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();

  for (let step = 0; step < 75; step++) {
    await advanceAvailableStep(page);
  }

  const nodes = await page.locator('.tree-avl .tree-node').evaluateAll(items => items.map(item => ({
    index: Number(item.dataset.treeIndex),
    value: Number(item.querySelector('.tree-value')?.textContent),
    balance: item.querySelector('.tree-node-badge')?.textContent,
  })));
  expect(nodes).toEqual([
    { index: 0, value: 30, balance: 'BF 1' },
    { index: 1, value: 20, balance: 'BF 1' },
    { index: 2, value: 40, balance: 'BF 0' },
    { index: 3, value: 10, balance: 'BF 1' },
    { index: 4, value: 25, balance: 'BF 0' },
    { index: 5, value: 35, balance: 'BF 0' },
    { index: 6, value: 50, balance: 'BF 0' },
    { index: 7, value: 1, balance: 'BF 0' },
  ]);
  await expect(page.locator('.operation-message')).toContainText('no fue necesaria una rotación');
});

test('B+ acepta inserciones seguidas y mantiene nodos de máximo tres claves', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'La jerarquía completa se valida una vez en escritorio.');
  await page.goto('/bplus-tree');
  await page.getByLabel('Velocidad').selectOption('2');
  const valueInput = page.getByLabel('Clave');
  const insertButton = page.getByRole('button', { name: 'Insertar clave' });

  for (let value = 100; value < 115; value++) {
    await valueInput.fill(String(value));
    await insertButton.click();
  }

  const pause = page.getByRole('button', { name: 'Pausar' });
  if (await pause.isVisible()) await pause.click();
  for (let step = 0; step < 6; step++) {
    await advanceAvailableStep(page);
  }

  const leaves = page.locator('.leaf-bnode');
  // 21 keys under true B+ leaf splitting (2+2) produce 11 leaves,
  // unlike the former fake grouping of three keys per leaf.
  await expect(leaves).toHaveCount(11);
  await expect(page.locator('.btree-visual')).toContainText('114');
  expect(await page.locator('.internal-bnode').count()).toBeGreaterThanOrEqual(3);
  for (const text of await leaves.allTextContents()) {
    const keys = text.replace(/HOJA|NODO/g, '').split('|').filter(key => key.trim());
    expect(keys.length).toBeLessThanOrEqual(3);
  }
  const layout = await page.evaluate(() => {
    const canvas = document.querySelector('.btree-visual').getBoundingClientRect();
    const nodes = [...document.querySelectorAll('.multiway-node')].map(node => node.getBoundingClientRect());
    const outside = nodes.some(node => (
      node.left < canvas.left - 1 || node.right > canvas.right + 1
      || node.top < canvas.top - 1 || node.bottom > canvas.bottom + 1
    ));
    const overlap = nodes.some((node, index) => nodes.slice(index + 1).some(other => (
      node.left < other.right && node.right > other.left
      && node.top < other.bottom && node.bottom > other.top
    )));
    return { outside, overlap };
  });
  expect(layout).toEqual({ outside: false, overlap: false });
});

test('la matriz poco poblada es circular y se recorre en el sentido enseñado', async ({ page }) => {
  await page.goto('/matriz-dispersa');
  await expect(page.getByRole('heading', { name: 'Matriz poco poblada', level: 1 })).toBeVisible();
  await expect(page.locator('.sparse-header.row-header')).toHaveCount(5);
  await expect(page.locator('.sparse-header.column-header')).toHaveCount(6);
  await expect(page.locator('.sparse-axis-title.dimension-title')).toContainText('ALTO 5 · LARGO 6');
  await expect(page.locator('.sparse-node')).toHaveCount(10);
  await expect(page.locator('.sparse-row-links .row-return')).toHaveCount(5);
  await expect(page.locator('.sparse-column-links .column-return')).toHaveCount(6);

  const directions = await page.evaluate(() => ({
    rowLinksPointLeft: [...document.querySelectorAll('.sparse-row-links line')]
      .every(line => Number(line.getAttribute('x1')) > Number(line.getAttribute('x2'))),
    columnLinksPointUp: [...document.querySelectorAll('.sparse-column-links line')]
      .every(line => Number(line.getAttribute('y1')) > Number(line.getAttribute('y2'))),
  }));
  expect(directions).toEqual({ rowLinksPointLeft: true, columnLinksPointUp: true });

  await expect(page.locator('.code-panel pre')).toContainText('Node left;');
  await expect(page.locator('.code-panel pre')).toContainText('Node up;');
  await expect(page.locator('.code-panel pre')).toContainText('AROW[row].left = AROW[row]');
  await expect(page.locator('.code-panel pre')).toContainText('ACOL[column].up = ACOL[column]');

  await page.getByLabel('Fila').fill('4');
  await page.getByLabel('Columna').fill('4');
  await page.getByLabel('Valor').fill('99');
  await page.getByRole('button', { name: 'Insertar / actualizar' }).click();
  await expect(page.locator('.operation-message')).toContainText('nodo compartido', { timeout: 20000 });
  await expect(page.locator('[data-cell-key="4:4"]')).toHaveCount(1);
  await expect(page.locator('.code-panel code.active')).toContainText('nonZeroCount++');

  await page.getByLabel('Fila').fill('1');
  await page.getByRole('button', { name: 'Recorrer fila' }).click();
  await expect(page.locator('.operation-message')).toContainText('4 ← 8 ← 7 ← 2', { timeout: 15000 });
});

test('matriz poco poblada pide los datos faltantes sin sustituirlos por cero', async ({ page }) => {
  await page.goto('/matriz-dispersa');
  const insert = page.getByRole('button', { name: 'Insertar / actualizar' });
  await insert.click();
  await expect(page.locator('.operation-message')).toContainText('Ingresa la fila');
  await page.getByLabel('Fila').fill('0');
  await insert.click();
  await expect(page.locator('.operation-message')).toContainText('Ingresa la columna');
  await page.getByLabel('Columna').fill('0');
  await insert.click();
  await expect(page.locator('.operation-message')).toContainText('Ingresa el valor');
  await expect(page.getByLabel('Fila')).toHaveValue('0');
  await expect(page.getByLabel('Columna')).toHaveValue('0');
  await page.getByLabel('Valor').fill('99');
  await insert.click();
  await expect(page.locator('[data-cell-key="0:0"]')).toHaveAttribute('data-value', '99', { timeout: 20000 });
});

test('muestra el formulario activo para informar un problema', async ({ page }) => {
  await page.getByRole('button', { name: 'Informar un problema' }).click();
  const dialog = page.getByRole('dialog', { name: '¿Encontraste algo extraño?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('filter', 'none');
  await expect(page.getByRole('heading', { name: 'Próximamente' })).toHaveCount(0);
  await expect(page.locator('.bug-modal-preview')).toHaveCount(0);
  await expect(dialog.getByLabel('Tu nombre')).toBeEnabled();
  await expect(dialog.getByLabel('Resumen corto')).toBeEnabled();
  await expect(dialog.getByLabel('Cuéntanos qué ocurrió')).toBeEnabled();
  await expect(dialog.getByRole('button', { name: 'Enviar reporte' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Cerrar formulario' }).click();
  await expect(page.locator('.bug-modal')).toHaveCount(0);
});

test('permite configurar accesibilidad, conserva preferencias y devuelve el foco al cerrar', async ({ page }) => {
  await page.goto('/array');
  const launch = page.getByRole('button', { name: 'Opciones de accesibilidad' });
  const [launchBox, complexityBox] = await Promise.all([
    launch.boundingBox(),
    page.locator('.complexity-card').boundingBox(),
  ]);
  const overlapsComplexity = launchBox && complexityBox
    && launchBox.x < complexityBox.x + complexityBox.width
    && launchBox.x + launchBox.width > complexityBox.x
    && launchBox.y < complexityBox.y + complexityBox.height
    && launchBox.y + launchBox.height > complexityBox.y;
  expect(overlapsComplexity).toBeFalsy();
  await launch.focus();
  await launch.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Haz que DSA Lab sea cómodo para ti' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('radio')).toHaveCount(3);
  await dialog.getByRole('radio', { name: /Grande/ }).click();
  for (const preference of ['Modo oscuro', 'Contraste alto', 'Paleta apta para daltonismo', 'Reducir movimiento']) {
    await dialog.getByLabel(preference).focus();
    await page.keyboard.press('Space');
  }

  await expect(page.locator('html')).toHaveAttribute('data-font-scale', 'large');
  await expect(page.locator('html')).toHaveAttribute('data-high-contrast', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-color-vision', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-dark-mode', 'true');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(launch).toBeFocused();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-font-scale', 'large');
  await expect(page.locator('html')).toHaveAttribute('data-high-contrast', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-color-vision', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-dark-mode', 'true');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dsa-accessibility-preferences-v1') ?? '{}'));
  expect(stored).toEqual({ fontScale: 'large', highContrast: true, colorVision: true, reduceMotion: true, darkMode: true });
});

test('el modo oscuro cambia las superficies y se puede desactivar', async ({ page }) => {
  await page.goto('/array');
  await page.getByRole('button', { name: 'Opciones de accesibilidad' }).click();
  const darkMode = page.getByRole('dialog').getByLabel('Modo oscuro');
  await darkMode.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-dark-mode', 'true');
  const colors = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    panel: getComputedStyle(document.querySelector('.panel')).backgroundColor,
  }));
  expect(colors.body).toBe('rgb(18, 26, 38)');
  expect(colors.panel).toBe('rgb(28, 39, 54)');
  await darkMode.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-dark-mode', 'false');
});

test('ofrece navegación por teclado para saltar al contenido principal', async ({ page }) => {
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Saltar al contenido principal' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('el menú móvil encierra el foco y vuelve al botón que lo abrió', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Comprobación específica para móvil.');
  const menuButton = page.getByRole('button', { name: 'Abrir menú' });
  await menuButton.focus();
  await menuButton.press('Enter');
  const navigationDialog = page.getByRole('dialog', { name: 'Navegación de algoritmos' });
  await expect(navigationDialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(navigationDialog).toHaveCount(0);
  await expect(menuButton).toBeFocused();
});

test('permite completar una prueba conceptual de diez preguntas por sección', async ({ page }) => {
  const arrayTest = createSectionTest(algorithms.find(algorithm => algorithm.id === 'array'));
  await page.goto('/array');
  await page.getByRole('button', { name: 'Realizar prueba' }).click();
  const dialog = page.getByRole('dialog', { name: 'Prueba de Array' });
  await expect(dialog).toContainText('10 preguntas');
  await expect(dialog).toContainText('bloqueada durante 45 minutos');
  await page.getByRole('button', { name: 'Comenzar prueba' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar prueba' })).toHaveCount(0);

  for (let question = 0; question < 10; question += 1) {
    const incorrectChoiceIndex = arrayTest.questions[question].choices.findIndex(choice => !choice.correct);
    await dialog.getByRole('radio').nth(incorrectChoiceIndex).check();
    await dialog.getByRole('button', { name: question === 9 ? 'Entregar prueba' : 'Siguiente pregunta' }).click();
  }

  await expect(dialog.getByText('Prueba finalizada').first()).toBeVisible();
  const review = dialog.locator('.section-test-review');
  await expect(review.getByRole('heading', { name: 'Revisa tus respuestas' })).toBeVisible();
  await expect(review.locator('li')).toHaveCount(10);
  await expect(review).toContainText('Tu respuesta');
  await expect(review).toContainText('Explicación');
  await expect(review.locator('.correct-answer')).toHaveCount(10);
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('dsa-section-test-results-v1') ?? '[]'));
  expect(history.at(-1)).toMatchObject({ algorithmId: 'array', status: 'completed', total: 10 });
});

test('anula y registra como copia una prueba si la página pierde visibilidad', async ({ page }) => {
  await page.goto('/avl');
  await page.getByRole('button', { name: 'Realizar prueba' }).click();
  await page.getByRole('button', { name: 'Comenzar prueba' }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  const dialog = page.getByRole('dialog', { name: 'Prueba de Árbol AVL' });
  await expect(dialog.getByRole('heading', { name: 'Prueba cancelada por copia' })).toBeVisible();
  await expect(dialog).toContainText('Se cambió de pestaña');
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('dsa-section-test-results-v1') ?? '[]'));
  expect(history.at(-1)).toMatchObject({ algorithmId: 'avl', status: 'cancelled-copy', reason: 'hidden' });
  expect(history.at(-1).lockedUntil - Date.now()).toBeGreaterThan(44 * 60 * 1000);
  expect(history.at(-1).lockedUntil - Date.now()).toBeLessThanOrEqual(45 * 60 * 1000);
  await page.getByRole('button', { name: 'Entendido' }).click();
  const lockedButton = page.getByRole('button', { name: /Bloqueada · 45 min/ });
  await expect(lockedButton).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: /Bloqueada · 45 min/ })).toBeDisabled();
});

test('registra como copia si se abandona la página durante una prueba', async ({ page }) => {
  await page.goto('/array');
  await page.getByRole('button', { name: 'Realizar prueba' }).click();
  await page.getByRole('button', { name: 'Comenzar prueba' }).click();
  await page.goto('/pila');

  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('dsa-section-test-results-v1') ?? '[]'));
  expect(history.at(-1)).toMatchObject({ algorithmId: 'array', status: 'cancelled-copy', reason: 'unload' });
  await page.goto('/array');
  await expect(page.getByRole('button', { name: /Bloqueada · 45 min/ })).toBeDisabled();
});

test('no produce desbordamiento horizontal en móvil', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Comprobación específica para móvil.');
  await page.goto('/sudoku');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('el recorrido guiado explica sus herramientas y puede completarse', async ({ page }) => {
  await page.goto('/complejidad-algoritmica');
  const launch = page.getByRole('button', { name: 'Abrir recorrido guiado de cómo funciona DSA Lab' });
  await expect(launch).toBeVisible();
  await launch.click();

  await expect(page).toHaveURL(/\/array$/);
  await expect(page.getByRole('dialog', { name: 'Elige qué quieres aprender' })).toBeVisible();
  await expect(page.locator('.guided-tour-spotlight')).toBeVisible();

  const remainingTitles = [
    'Observa cómo cambia la estructura',
    'Experimenta con tus propios datos',
    'Controla la animación',
    'Relaciona la animación con el código',
    'Revisa las variables en tiempo real',
    'Comprueba lo aprendido',
  ];
  for (const title of remainingTitles) {
    await page.getByRole('button', { name: 'Siguiente paso del recorrido', exact: true }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Finalizar recorrido', exact: true }).click();
  await expect(page.locator('.guided-tour')).toHaveCount(0);
});
