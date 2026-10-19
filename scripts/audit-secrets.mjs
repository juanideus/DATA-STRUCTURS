import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatSecretFindings, isInsideDirectory, scanSecretText, sensitivePathReason } from './secret-scanner.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const maxTextBytes = 5 * 1024 * 1024;
const binaryExtension = /\.(?:png|jpe?g|gif|webp|avif|ico|pdf|woff2?|ttf|otf|eot|mp[34]|webm|zip|gz|br)$/i;

function git(args, options = {}) {
  return execFileSync('git', ['-c', `safe.directory=${projectRoot.replaceAll('\\', '/')}`, ...args], {
    cwd: projectRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
    windowsHide: true,
    ...options,
  });
}

function scanContent(content, filePath, findings, revision) {
  if (content.includes(0)) return;
  if (content.length > maxTextBytes) {
    findings.push({ filePath, rule: 'text-file-too-large-to-scan', revision });
    return;
  }
  for (const finding of scanSecretText(content.toString('utf8'))) findings.push({ ...finding, filePath, revision });
}

function scanFile(relative, findings) {
  const filePath = relative.replaceAll('\\', '/');
  const reason = sensitivePathReason(filePath);
  if (reason) {
    findings.push({ filePath, rule: reason });
    return; // Do not open actual env files or credential containers.
  }
  const fullPath = path.resolve(projectRoot, filePath);
  if (!isInsideDirectory(projectRoot, fullPath)) {
    findings.push({ filePath, rule: 'path-outside-project' });
    return;
  }
  const metadata = lstatSync(fullPath);
  if (metadata.isSymbolicLink()) {
    findings.push({ filePath, rule: 'symlink-needs-review' });
    return;
  }
  if (!isInsideDirectory(realpathSync(projectRoot), realpathSync(fullPath))) {
    findings.push({ filePath, rule: 'resolved-path-outside-project' });
    return;
  }
  if (!metadata.isFile() || binaryExtension.test(filePath)) return;
  if (metadata.size > maxTextBytes) {
    findings.push({ filePath, rule: 'text-file-too-large-to-scan' });
    return;
  }
  scanContent(readFileSync(fullPath), filePath, findings);
}

function scanHistory(findings) {
  const entries = git(['rev-list', '--objects', '--all'], { encoding: 'utf8' }).split(/\r?\n/);
  const byObject = new Map();
  for (const entry of entries) {
    const separator = entry.indexOf(' ');
    if (separator < 0) continue;
    const revision = entry.slice(0, separator);
    const filePath = entry.slice(separator + 1);
    const reason = sensitivePathReason(filePath);
    if (reason) {
      findings.push({ filePath, rule: reason, revision });
      continue;
    }
    if (!binaryExtension.test(filePath)) byObject.set(revision, filePath);
  }
  if (!byObject.size) return 0;
  const metadata = git(['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], {
    input: `${[...byObject.keys()].join('\n')}\n`, encoding: 'utf8',
  });
  const blobs = [];
  for (const line of metadata.trim().split(/\r?\n/)) {
    const [revision, type, size] = line.split(' ');
    if (type !== 'blob') continue;
    if (Number(size) > maxTextBytes) findings.push({ filePath: byObject.get(revision), revision, rule: 'text-file-too-large-to-scan' });
    else blobs.push(revision);
  }
  if (!blobs.length) return 0;
  const contents = git(['cat-file', '--batch'], { input: `${blobs.join('\n')}\n` });
  let offset = 0;
  let count = 0;
  while (offset < contents.length) {
    const newline = contents.indexOf(10, offset);
    if (newline < 0) throw new Error('Invalid Git object stream');
    const [revision, type, sizeText] = contents.subarray(offset, newline).toString('ascii').split(' ');
    const size = Number(sizeText);
    if (type !== 'blob' || !Number.isSafeInteger(size) || size < 0) throw new Error('Invalid Git object metadata');
    offset = newline + 1;
    if (offset + size >= contents.length) throw new Error('Incomplete Git object stream');
    scanContent(contents.subarray(offset, offset + size), byObject.get(revision), findings, revision);
    offset += size + 1;
    count++;
  }
  return count;
}

function scanArtifacts(findings) {
  const root = path.join(projectRoot, 'dist');
  let count = 0;
  if (lstatSync(root).isSymbolicLink() || !isInsideDirectory(realpathSync(projectRoot), realpathSync(root))) {
    findings.push({ filePath: 'dist', rule: 'published-root-symlink-needs-review' });
    return count;
  }
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(projectRoot, absolute);
      if (entry.isSymbolicLink()) findings.push({ filePath: relative, rule: 'published-symlink-needs-review' });
      else if (entry.isDirectory()) {
        if (/^(?:\.git|\.github|node_modules|report)$/.test(entry.name)) findings.push({ filePath: relative, rule: 'private-directory-in-published-artifacts' });
        else walk(absolute);
      } else {
        count++;
        if (/\.(?:map|log|sqlite3?|db)$/i.test(entry.name)) findings.push({ filePath: relative, rule: 'unexpected-published-artifact' });
        scanFile(relative, findings);
      }
    }
  }
  walk(root); // A missing dist must fail, not silently pass a publication check.
  return count;
}

try {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(arg => arg !== '--artifacts-only')) throw new Error('Unsupported option');
  const findings = [];
  let workingFiles = 0;
  let historicalBlobs = 0;
  let artifactFiles = 0;
  if (args.includes('--artifacts-only')) artifactFiles = scanArtifacts(findings);
  else {
    const tracked = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
    workingFiles = tracked.length;
    for (const filePath of tracked) scanFile(filePath, findings);
    historicalBlobs = scanHistory(findings);
  }
  const unique = [...new Map(findings.map(finding => [JSON.stringify(finding), finding])).values()];
  if (unique.length) {
    console.error(`SECRET AUDIT FAILED: ${unique.length} finding(s). Values are never printed.`);
    console.error(formatSecretFindings(unique));
    process.exitCode = 1;
  } else console.log(`SECRET AUDIT OK: ${workingFiles} working-tree files, ${historicalBlobs} historical blobs, ${artifactFiles} published files. Heuristic scan; not a security guarantee.`);
} catch {
  // Git/filesystem errors can contain file contents or arguments; do not forward them.
  console.error('SECRET AUDIT INCOMPLETE: unable to inspect the full requested scope. No secret values printed.');
  process.exitCode = 1;
}
