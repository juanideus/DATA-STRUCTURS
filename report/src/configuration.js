import { clientIpSource, isRailwayPublicIngress, parseTrustedProxyCidrs } from './client-address.js';

// Require an explicit trust model instead of guessing private ingress CIDRs.
export function assertProxyConfiguration(environment = process.env) {
  const source = clientIpSource(environment);
  if (!['', 'socket', 'trusted-proxy', 'railway-public'].includes(source)) {
    throw new Error('CLIENT_IP_SOURCE debe ser socket, trusted-proxy o railway-public.');
  }
  const ranges = parseTrustedProxyCidrs(environment.TRUSTED_PROXY_CIDRS);
  if (ranges === null) {
    throw new Error('TRUSTED_PROXY_CIDRS debe contener únicamente rangos CIDR válidos.');
  }
  if (source === 'railway-public') {
    if (!isRailwayPublicIngress(environment)) {
      throw new Error('railway-public requiere producción y las variables de contexto de Railway.');
    }
    if (ranges.length) throw new Error('railway-public no se combina con TRUSTED_PROXY_CIDRS.');
    if (environment.RAILWAY_TCP_PROXY_DOMAIN || environment.RAILWAY_TCP_APPLICATION_PORT) {
      throw new Error('railway-public no admite un TCP proxy; usa únicamente ingress HTTP público.');
    }
    return;
  }
  if (source === 'trusted-proxy' && !ranges.length) {
    throw new Error('trusted-proxy requiere TRUSTED_PROXY_CIDRS confirmados.');
  }
  if (source === 'socket' && ranges.length) {
    throw new Error('socket no se combina con TRUSTED_PROXY_CIDRS.');
  }
  if (environment.NODE_ENV === 'production' && environment.RAILWAY_PROJECT_ID && !ranges.length) {
    throw new Error('Configura CLIENT_IP_SOURCE=railway-public para el ingress HTTP público dedicado de Railway.');
  }
}
