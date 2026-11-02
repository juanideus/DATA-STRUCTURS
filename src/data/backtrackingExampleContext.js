export function seedBacktrackingExample(source, algorithm, cpp = false) {
  const values = algorithm.values ?? [];
  if (algorithm.id === 'hanoi') {
    const amount = values.length;
    const rods = [0, 1, 2].map(rod => values.filter(disk => (typeof disk === 'object' ? disk.rod : 0) === rod).map(disk => typeof disk === 'object' ? disk.size : disk).sort((a, b) => b - a));
    if (cpp) {
      const assignments = rods.flatMap((disks, rod) => [`            ${['source', 'auxiliary', 'target'][rod]}Size = ${disks.length};`, ...disks.map((disk, i) => `            ${['source', 'auxiliary', 'target'][rod]}[${i}] = ${disk};`)]).join('\n');
      return source.replace('int diskCount = 5;', `int diskCount = ${amount};`).replace('int amount = 5', `int amount = ${amount}`)
        .replace('        for (int i = 0; i < diskCount; i++) source[i] = diskCount - i;', `        for (int i = 0; i < diskCount; i++) source[i] = diskCount - i;\n        if (amount == ${amount}) {\n${assignments}\n        }`);
    }
    for (const name of ['source', 'help', 'target']) if (!source.includes(`int[] ${name}`)) source = source.replace(/}\s*$/, `    int[] ${name} = new int[8];\n}`);
    if (!/int diskCount\s*[;=]/.test(source)) source = source.replace(/}\s*$/, '    int diskCount;\n}');
    return source.replace(/}\s*$/, `    Hanoi() {\n        diskCount = ${amount};\n${rods.flatMap((disks, rod) => disks.map((disk, i) => `        ${['source', 'help', 'target'][rod]}[${i}] = ${disk};`)).join('\n')}\n    }\n}`);
  }
  if (!['sudoku', 'laberinto'].includes(algorithm.id)) return source;
  const sudoku = algorithm.id === 'sudoku';
  const side = sudoku ? 9 : Math.sqrt(values.length);
  const cells = values.map(value => sudoku ? value : value === 1 ? 1 : 0);
  if (!cpp) {
    const name = sudoku ? 'board' : 'maze';
    const rows = Array.from({ length: side }, (_, i) => `{${cells.slice(i * side, (i + 1) * side).join(', ')}}`);
    const field = `int[][] ${name} = {${rows.join(', ')}};`;
    source = source.includes(`int[][] ${name} =`) ? source.replace(`int[][] ${name} = new int[9][9];`, field) : source.replace(/}\s*$/, `    ${field}\n}`);
    if (!sudoku) source = source.replace('boolean[][] path = new boolean[9][9];', `boolean[][] path = new boolean[${side}][${side}];`);
    return source;
  }
  if (!sudoku) return source
    .replace('        for (int row = 0; row < height; row++) {', `        int* startingCells = new int[${cells.length}]{${cells.join(', ')}};\n        for (int row = 0; row < height; row++) {`)
    .replace('maze[row][column] = cells == nullptr ? 0 : cells[row * width + column];', `maze[row][column] = cells != nullptr ? cells[row * width + column]\n                    : (height == ${side} && width == ${side} ? startingCells[row * width + column] : 0);`)
    .replace('    }\n\n    ~MazeSolver', '        delete[] startingCells;\n    }\n\n    ~MazeSolver');
  const initial = algorithm.initialValues ?? cells;
  const marker = '            initial[row] = new int[SIZE]{};\n        }';
  return source.replace(marker, `${marker}\n${cells.map((value, i) => `        board[${Math.floor(i / 9)}][${i % 9}] = ${value};\n        initial[${Math.floor(i / 9)}][${i % 9}] = ${initial[i]};`).join('\n')}`);
}
