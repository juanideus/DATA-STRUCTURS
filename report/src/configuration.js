import { parseTrustedProxyCidrs } from './client-address.js';

// Refuse an ambiguous deployment rather than silently grouping every Railway
// visitor under its ingress address or trusting a client-supplied header.
export function assertProxyConfiguration(environment = process.env) {
  const ranges = parseTrustedProxyCidrs(environment.TRUSTED_PROXY_CIDRS);
  if (ranges === null) {
    throw new Error('TRUSTED_PROXY_CIDRS debe contener únicamente rangos CIDR válidos.');
  }
  if (environment.NODE_ENV === 'production' && environment.RAILWAY_PROJECT_ID && !ranges.length) {
    throw new Error('Configura TRUSTED_PROXY_CIDRS con los rangos confirmados del ingress de Railway antes de desplegar.');
  }
}
