import { expect, test } from '@playwright/test';
import { algorithms } from '../../src/data/algorithms.js';
import { getOperationDefinition } from '../../src/logic/operations.js';

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
  await page.goto('/avl');
  await expect(page.getByRole('heading', { name: 'Árbol AVL', level: 1 })).toBeVisible();
  await expect(page.locator('[data-algorithm-id="avl"]')).toHaveClass(/selected/);
  await expect(page).toHaveURL(/\/avl$/);

  await page.goto('/#/sudoku');
  await expect(page).toHaveURL(/\/sudoku$/);
  await expect(page.getByRole('heading', { name: 'Sudoku Solver 9×9', level: 1 })).toBeVisible();
});

test('la sección de complejidad explica la teoría con gráficos y sin laboratorio ni código', async ({ page }) => {
  await page.goto('/complejidad-algoritmica');
  await expect(page.getByRole('heading', { name: 'Complejidad algorítmica', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¿Qué es la complejidad algorítmica?', level: 2 })).toBeVisible();
  await expect(page.locator('.complexity-static-chart .curve')).toHaveCount(6);
  await expect(page.locator('.complexity-order-table [role="row"]')).toHaveCount(7);
  await expect(page.locator('.complexity-notation-card')).toContainText('O(g(n))');
  await expect(page.locator('.complexity-notation-card')).toContainText('Ω(g(n))');
  await expect(page.locator('.complexity-notation-card')).toContainText('Θ(g(n))');
  await expect(page.locator('.visual-panel')).toHaveCount(0);
  await expect(page.locator('.code-panel')).toHaveCount(0);
  await expect(page.locator('.operations-panel')).toHaveCount(0);
  await expect(page.locator('.player')).toHaveCount(0);
});

test('fundamentos explica qué son las estructuras de datos sin convertirlo en un laboratorio', async ({ page }) => {
  await page.goto('/estructuras-de-datos');
  await expect(page.locator('[data-algorithm-id="estructuras-de-datos"]')).toHaveText('01Estructuras de datos');
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

test('los 60 temas cargan su contenido correspondiente sin errores', async ({ page }) => {
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
    if (['theory', 'complexity'].includes(algorithm.type)) {
      await expect(page.locator(algorithm.type === 'complexity' ? '[data-complexity-lesson]' : '[data-data-structures-lesson]')).toBeVisible();
      await expect(page.locator('.visual-panel')).toHaveCount(0);
      await expect(page.locator('.code-panel')).toHaveCount(0);
      await expect(page.locator('.operation-actions')).toHaveCount(0);
    } else {
      await expect(page.locator(`[data-visualizer="${algorithm.id}"]`)).toBeVisible();
    }
    await expect(page.locator('.operation-actions button')).toHaveCount(getOperationDefinition(algorithm).actions.length);

    if (['theory', 'complexity'].includes(algorithm.type)) {
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
  await page.getByLabel('Expresión').fill('<script>alert(1)</script>');
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
  await page.goto('/sudoku');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
