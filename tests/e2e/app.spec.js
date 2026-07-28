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

test('los 53 temas cargan su visualizador, controles y código sin errores', async ({ page }) => {
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
    await expect(page.locator(`[data-visualizer="${algorithm.id}"]`)).toBeVisible();
    await expect(page.locator('.operation-actions button')).toHaveCount(getOperationDefinition(algorithm).actions.length);

    if (['dijkstra', 'a-star'].includes(algorithm.id)) {
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

test('rechaza datos extremos sin alterar ni romper las estructuras', async ({ page }) => {
  await page.goto('/array');
  const initialArrayCells = await page.locator('.linear-visual .data-cell').count();
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
    { id: 'bfs', fields: { 'Origen / vértice': 'A' }, action: 'Recorrer BFS' },
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
