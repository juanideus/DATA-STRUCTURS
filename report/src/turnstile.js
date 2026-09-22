const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_LIMIT = 2048;
const OFFICIAL_HOSTNAMES = Object.freeze([
  'www.dsalab.dev',
  'dsalab.dev',
  'data-structurs.vercel.app',
]);

const normalizedHostnames = environment => {
  const configured = String(environment.TURNSTILE_HOSTNAMES || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...OFFICIAL_HOSTNAMES, ...configured])];
};

export const normalizeTurnstileToken = value => String(value || '').trim().slice(0, TOKEN_LIMIT);

export async function verifyTurnstile({
  secret,
  token,
  remoteIp,
  environment = process.env,
  fetchImpl = fetch,
}) {
  if (!secret) return { success: true, skipped: true };

  const responseToken = normalizeTurnstileToken(token);
  if (!responseToken) return { success: false, reason: 'missing-token' };

  const payload = new URLSearchParams({ secret, response: responseToken });
  if (remoteIp && remoteIp !== 'unknown') payload.set('remoteip', remoteIp);

  let response;
  try {
    response = await fetchImpl(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload,
      signal: AbortSignal.timeout(6_000),
    });
  } catch {
    const error = new Error('No fue posible validar la verificación de seguridad. Inténtalo nuevamente.');
    error.status = 502;
    throw error;
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('No fue posible validar la verificación de seguridad. Inténtalo nuevamente.');
    error.status = 502;
    throw error;
  }

  const hostname = String(result.hostname || '').toLowerCase();
  const validHostname = hostname && normalizedHostnames(environment).includes(hostname);
  const validAction = !result.action || result.action === 'report';

  return {
    success: result.success === true && validHostname && validAction,
    reason: result.success !== true ? 'challenge-failed' : !validHostname ? 'invalid-hostname' : !validAction ? 'invalid-action' : undefined,
  };
}

export { OFFICIAL_HOSTNAMES, TOKEN_LIMIT, VERIFY_URL };
