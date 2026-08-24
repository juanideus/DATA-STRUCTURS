import { expect, test } from '@playwright/test';
import { algorithms } from '../../src/data/algorithms.js';
import { getOperationDefinition } from '../../src/logic/operations.js';
import { createSectionTest } from '../../src/logic/sectionTests.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('dsa-language', 'es');
    if (window.sessionStorage.getItem('dsa-test-show-intro') !== 'true') {
      window.localStorage.setItem('dsa-intro-seen', 'true');
    }
  });
  await page.goto('/');
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
  await expect(report.getByText('Your name', { exact: true })).toBeVisible();
  await expect(report.getByText('What kind of problem is it?', { exact: true })).toBeVisible();
  await expect(report).not.toContainText('Tu nombre');
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
  await expect(page).toHaveTitle(/Dijkstra: Visual Guide and Java/);
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
    } else if (['dijkstra', 'a-star'].includes(algorithm.id)) {
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  }
  await expect(page.locator('[data-matrix-row="1"][data-matrix-column="2"]')).toContainText('42');
  await expect(page.locator('.operation-message')).toContainText('Celda (1, 2) actualizada');

  await page.getByRole('button', { name: 'Transponer', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 35; index++) {
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  }
  await expect(page.locator('[data-polynomial="A"][data-exponent="8"]')).toHaveCount(0);
  await expect(page.locator('[data-polynomial="C"]')).toHaveCount(0);
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  }
  await expect(page.locator('.generalized-node.tag-0')).toHaveCount(5);
  await expect(page.locator('.generalized-node.tag-1')).toHaveCount(3);
  await expect(page.locator('.generalized-node.tag-2')).toHaveCount(4);
  await expect(page.locator('.generalized-edge.dlink')).toHaveCount(3);

  await page.getByRole('button', { name: 'Obtener Head', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 5; index++) await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('Head(A) = (a,b)');

  await page.getByRole('button', { name: 'Calcular profundidad', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 60; index++) await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.locator('.operation-message')).toContainText('Depth(A) = 3');

  await page.getByRole('button', { name: 'Compartir raíz', exact: true }).click();
  if (await pause.isVisible()) await pause.click();
  for (let index = 0; index < 5; index++) await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.locator('[data-generalized-path="root.header"]')).toContainText('2');
  await expect(page.locator('.generalized-aliases')).toContainText('R2');
});

test('rechaza datos extremos sin alterar ni romper las estructuras', async ({ page }) => {
  await page.goto('/array');
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
      await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    }

    expect(activeLines.size, `${sample.id}: el código no avanzó`).toBeGreaterThan(2);
    expect(messages.size, `${sample.id}: la explicación no avanzó`).toBeGreaterThan(1);
    expect(sawVariables, `${sample.id}: no mostró variables`).toBe(true);
  }
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
      await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  }

  await expect(nodes).toHaveCount(8);
  await expect(page.locator('.tree-arbol-binario .tree-node[data-tree-index="7"] .tree-value')).toHaveText('2');
  await expect(page.locator('.operation-message')).toContainText('insertado recursivamente');
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
});

test('AVL inserta 1 sin reconstruir ni rotar incorrectamente el árbol', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'La lógica y los factores son idénticos en móvil.');
  await page.goto('/avl');
  await page.getByLabel('Valor').fill('1');
  await page.getByRole('button', { name: 'Insertar nodo', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausar', exact: true });
  if (await pause.isVisible()) await pause.click();

  for (let step = 0; step < 75; step++) {
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
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
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  }

  const leaves = page.locator('.leaf-bnode');
  await expect(leaves).toHaveCount(8);
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
  for (const preference of ['Contraste alto', 'Paleta apta para daltonismo', 'Reducir movimiento']) {
    await dialog.getByLabel(preference).focus();
    await page.keyboard.press('Space');
  }

  await expect(page.locator('html')).toHaveAttribute('data-font-scale', 'large');
  await expect(page.locator('html')).toHaveAttribute('data-high-contrast', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-color-vision', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(launch).toBeFocused();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-font-scale', 'large');
  await expect(page.locator('html')).toHaveAttribute('data-high-contrast', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-color-vision', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dsa-accessibility-preferences-v1') ?? '{}'));
  expect(stored).toEqual({ fontScale: 'large', highContrast: true, colorVision: true, reduceMotion: true });
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
