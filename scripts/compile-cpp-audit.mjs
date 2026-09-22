import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerCpp } from '../src/data/beginnerCpp.js';
import { supportsCpp } from '../src/data/cppCatalog.js';
import { getOperationDefinition } from '../src/logic/operations.js';

const workspace = path.resolve('.tmp-cpp-audit');
const failures = [];
let compilationCount = 0;
const BATCH_SIZE = 40;
const classByAlgorithm = new Map();
const fixedArrayDeclaration = /^\s*(?:static\s+const\s+)?(?:unsigned\s+)?(?:int|bool|char|double|float|std::string|[A-Z][A-Za-z0-9_]*\s*\*)\s+[A-Za-z_][A-Za-z0-9_]*\s*\[[^\]]+\]/;

await rm(workspace, { recursive: true, force: true });
await mkdir(workspace, { recursive: true });

try {
  const entries = [];
  for (const algorithm of algorithms.filter(item => supportsCpp(item.id))) {
    for (const action of getOperationDefinition(algorithm).actions) {
      compilationCount++;
      const label = `${algorithm.id}/${action.id}`;
      const source = getBeginnerCpp(algorithm, action.id);
      if (/std::vector|#include\s*<vector>/.test(source)) {
        failures.push(`${label}: usa std::vector; los ejemplos educativos deben conservar arreglos nativos [].`);
      }
      const staticStorage = source.split(/\r?\n/).find(line => fixedArrayDeclaration.test(line));
      if (staticStorage) {
        failures.push(`${label}: declara almacenamiento fijo (${staticStorage.trim()}); debe usar memoria dinámica con new[]/delete[].`);
      }
      const className = source.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/)?.[1];
      const expectedClass = classByAlgorithm.get(algorithm.id);
      if (!className) failures.push(`${label}: no declara una clase C++ completa.`);
      else if (expectedClass && expectedClass !== className) {
        failures.push(`${label}: declara ${className}, pero las otras operaciones de ${algorithm.id} usan ${expectedClass}.`);
      } else classByAlgorithm.set(algorithm.id, className);
      const sourcePath = path.join(workspace, `${String(compilationCount).padStart(3, '0')}.cpp`);
      await writeFile(sourcePath, `#include <cstddef>\n#include <string>\n\n${source}\n\nint main() { return 0; }\n`, 'utf8');
      entries.push({ label, sourcePath });
    }
  }

  const practicalAlgorithms = algorithms.filter(item => getOperationDefinition(item).actions.length > 0);
  const unsupported = practicalAlgorithms.filter(item => !supportsCpp(item.id));
  if (unsupported.length) {
    failures.push(`Faltan implementaciones C++ para: ${unsupported.map(item => item.id).join(', ')}.`);
  }

  for (let start = 0; start < entries.length; start += BATCH_SIZE) {
    const batch = entries.slice(start, start + BATCH_SIZE);
    const compilation = spawnSync(
      'g++',
      ['-std=c++17', '-Wall', '-Wextra', '-pedantic', '-fsyntax-only', ...batch.map(entry => entry.sourcePath)],
      { encoding: 'utf8', timeout: 120_000, windowsHide: true },
    );
      if (compilation.error) {
        failures.push(`${batch[0].label}–${batch.at(-1).label}: ${compilation.error.message}`);
      } else if (compilation.status !== 0) {
        const diagnostic = (compilation.stderr || compilation.stdout).split(/\r?\n/).filter(Boolean).slice(0, 30).join(' | ');
        const affected = batch.filter(entry => diagnostic.includes(path.basename(entry.sourcePath))).map(entry => entry.label);
        failures.push(`${affected.length ? affected.join(', ') : `${batch[0].label}–${batch.at(-1).label}`}: ${diagnostic}`);
      }
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`COMPILACIÓN C++: ${failures.length} de ${compilationCount} ejemplos fallaron.`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`COMPILACIÓN C++ OK: ${compilationCount} códigos compilados con g++ -std=c++17.`);
}
