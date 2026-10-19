import path from 'node:path';

const tokenRules = [
  ['private-key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['resend-api-key', /\bre_[A-Za-z0-9]{20,}\b/],
  ['provider-api-key', /\bsk[-_](?:live[-_])?[A-Za-z0-9_-]{24,}\b/],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['credentials-in-url', /\b(?:https?|postgres(?:ql)?|mysql|rediss?):\/\/[^\s/:"'<>]+:[^\s/@"'<>]+@/],
];

function entropy(value) {
  const frequencies = new Map();
  for (const character of value) frequencies.set(character, (frequencies.get(character) ?? 0) + 1);
  let result = 0;
  for (const count of frequencies.values()) {
    const probability = count / value.length;
    result -= probability * Math.log2(probability);
  }
  return result;
}

function isExplicitPlaceholder(value) {
  return /^(?:<[^>]+>|\$\{[^}]+\}|[xX.]{8,})$/.test(value)
    || /^(?:your|replace|placeholder|example|pon|pega|ingresa|reemplaza|tu|clave)[_-]/i.test(value);
}

function looksLikeLiteralSecret(value) {
  return value.length >= 20 && entropy(value) >= 3.5 && !isExplicitPlaceholder(value);
}

export function sensitivePathReason(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  const basename = normalized.split('/').at(-1);
  if (/^\.env(?:\..*)?$/i.test(basename) && basename !== '.env.example') return 'tracked-env-file';
  if (/\.(?:pem|key|p12|pfx|jks|keystore)$/i.test(basename)
    || /^(?:id_rsa|id_dsa|id_ecdsa|id_ed25519|\.git-credentials)$/i.test(basename)) {
    return 'credential-file-needs-review';
  }
  return null;
}

export function isInsideDirectory(root, filePath) {
  const relative = path.relative(path.resolve(root), path.resolve(filePath));
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export function scanSecretText(text) {
  const findings = [];
  const lines = String(text).split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    for (const [rule, pattern] of tokenRules) {
      if (pattern.test(line)) findings.push({ line: index + 1, rule });
    }
    const assignments = /\b[A-Za-z0-9_]*(?:SECRET|PASSWORD|PASSWD|API_KEY|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY|CLIENT_SECRET)[A-Za-z0-9_]*\s*[:=]\s*(["'])([^"'\r\n]+)\1/gi;
    for (const match of line.matchAll(assignments)) {
      const value = match[2];
      if (looksLikeLiteralSecret(value)) {
        findings.push({ line: index + 1, rule: 'sensitive-literal-assignment' });
        break;
      }
    }
    const envAssignment = line.match(/^\s*(?:export\s+)?[A-Z0-9_]*(?:SECRET|PASSWORD|PASSWD|API_KEY|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY|CLIENT_SECRET)[A-Z0-9_]*=([^\s#"']+)/);
    if (envAssignment && looksLikeLiteralSecret(envAssignment[1])) {
      findings.push({ line: index + 1, rule: 'sensitive-env-assignment' });
    }
  }
  return findings;
}

export function safeFindingPath(filePath) {
  let safe = String(filePath).replace(/[\u0000-\u001f\u007f]/g, '?');
  for (const [, pattern] of tokenRules) {
    safe = safe.replace(new RegExp(pattern.source, 'g'), '[REDACTED]');
  }
  return safe;
}

export function formatSecretFindings(findings) {
  return findings.map(({ filePath, line, rule, revision }) => {
    const location = `${safeFindingPath(filePath)}${line ? `:${line}` : ''}`;
    const version = /^[a-f0-9]{40,64}$/.test(revision ?? '') ? ` (Git ${revision.slice(0, 12)})` : '';
    return `- ${location}${version} — ${rule}`; // Never start an untrusted path as a GitHub workflow command.
  }).join('\n');
}
