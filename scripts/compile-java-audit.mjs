import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { algorithms } from '../src/data/algorithms.js';
import { getBeginnerJava } from '../src/data/beginnerJava.js';
import { getOperationDefinition } from '../src/logic/operations.js';

const workspace = path.resolve('.tmp-java-audit');
const failures = [];
let compilationCount = 0;
const BATCH_SIZE = 40;

function classNameOf(source) {
  return source.match(/\bpublic\s+class\s+([A-Za-z_]\w*)/)?.[1]
    ?? source.match(/\bclass\s+([A-Za-z_]\w*)/)?.[1]
    ?? null;
}

function compilableSource(source, contextId) {
  const className = classNameOf(source);
  if (!className) throw new Error(`${contextId}: el Java mostrado no declara una clase completa.`);
  return { className, source };
}

await rm(workspace, { recursive: true, force: true });
await mkdir(workspace, { recursive: true });

try {
  const output = path.join(workspace, 'classes');
  const entries = [];
  await mkdir(output, { recursive: true });

  for (const algorithm of algorithms) {
    for (const action of getOperationDefinition(algorithm).actions) {
      compilationCount++;
      const label = `${algorithm.id}/${action.id}`;
      const displayedSource = getBeginnerJava(algorithm, action.id);
      const { className, source } = compilableSource(displayedSource, algorithm.id);
      const auditId = String(compilationCount).padStart(3, '0');
      const folder = path.join(workspace, 'sources', auditId);
      await mkdir(folder, { recursive: true });
      const sourcePath = path.join(folder, `${className}.java`);
      const packagedSource = `package audit.p${auditId};\n\n${source}`;
      await writeFile(sourcePath, packagedSource, 'utf8');
      entries.push({ auditId, label, sourcePath });
    }
  }

  for (let start = 0; start < entries.length; start += BATCH_SIZE) {
    const batch = entries.slice(start, start + BATCH_SIZE);
    const argumentFile = path.join(workspace, `sources-${String(start / BATCH_SIZE + 1).padStart(2, '0')}.txt`);
    const argumentsText = batch
      .map(entry => `"${entry.sourcePath.replaceAll('\\', '/')}"`)
      .join('\n');
    await writeFile(argumentFile, argumentsText, 'utf8');
    const firstNumber = start + 1;
    const lastNumber = start + batch.length;
    const compilation = spawnSync(
      'javac',
      ['-encoding', 'UTF-8', '-d', output, `@${argumentFile}`],
      { encoding: 'utf8', timeout: 120_000, windowsHide: true },
    );
    if (compilation.error) {
      failures.push(`Códigos ${firstNumber}-${lastNumber}: ${compilation.error.message}`);
      continue;
    }
    if (compilation.status !== 0) {
      const diagnostic = `${compilation.stderr || compilation.stdout}`
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(0, 30)
        .join(' | ');
      const mentioned = batch.filter(entry => diagnostic.includes(entry.auditId)).map(entry => entry.label);
      failures.push(`${mentioned.length ? mentioned.join(', ') : `Códigos ${firstNumber}-${lastNumber}`}: ${diagnostic}`);
    }
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`COMPILACIÓN JAVA: ${failures.length} de ${compilationCount} ejemplos fallaron.`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`COMPILACIÓN JAVA OK: ${compilationCount} códigos compilados con javac.`);
}
