import net from 'node:net';

// Use one stable key for equivalent IPv6 spellings and IPv4-mapped addresses.
// Header lists, scoped/link-local zone identifiers, ports and bracketed addresses
// are not single client IP addresses and must not cross the proxy trust boundary.
export function canonicalIp(value) {
  if (typeof value !== 'string') return null;
  const address = value.trim();
  if (!address || address.includes('%')) return null;
  const family = net.isIP(address);
  if (family === 4) return address;
  if (family !== 6) return null;

  const normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(normalized);
  if (!mapped) return normalized;
  const high = Number.parseInt(mapped[1], 16);
  const low = Number.parseInt(mapped[2], 16);
  return [high >>> 8, high & 255, low >>> 8, low & 255].join('.');
}

// null means malformed configuration; [] means forwarding is not trusted.
// A malformed entry invalidates the whole list instead of partially trusting it.
export function parseTrustedProxyCidrs(value) {
  if (value === undefined || value === '') return [];
  if (typeof value !== 'string' || !value.trim()) return null;
  const ranges = [];
  for (const entry of value.split(',')) {
    const match = /^([^/]+)\/(0|[1-9][0-9]{0,2})$/.exec(entry.trim());
    if (!match) return null;
    const originalFamily = net.isIP(match[1]);
    const address = canonicalIp(match[1]);
    let prefix = Number(match[2]);
    if (!address || !originalFamily || prefix > (originalFamily === 4 ? 32 : 128)) return null;
    const family = net.isIP(address);
    if (originalFamily === 6 && family === 4) {
      if (prefix < 96) return null;
      prefix -= 96;
    }
    ranges.push({ address, prefix, type: family === 4 ? 'ipv4' : 'ipv6' });
  }
  return ranges;
}

const blockListFromRanges = ranges => {
  const list = new net.BlockList();
  for (const { address, prefix, type } of ranges) list.addSubnet(address, prefix, type);
  return list;
};

// Published at https://www.cloudflare.com/ips/ (checked 2026-09-30).
const CLOUDFLARE_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22',
  '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
  '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22',
  '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32',
  '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29',
  '2c0f:f248::/32',
];

const cloudflareAddresses = blockListFromRanges(parseTrustedProxyCidrs(CLOUDFLARE_RANGES.join(',')));

export function clientIpSource(environment = process.env) {
  const value = environment?.CLIENT_IP_SOURCE;
  return value === undefined ? '' : typeof value === 'string' ? value.trim() : null;
}

// This is an explicit deployment/topology declaration, not request authentication.
// Railway public HTTP ingress overwrites X-Real-IP; its private mesh does not.
// Do not enable this mode for a listener reachable by untrusted private callers
// or a TCP proxy. See report/README.md for the supported, dedicated topology.
export function isRailwayPublicIngress(environment = process.env) {
  return clientIpSource(environment) === 'railway-public'
    && environment.NODE_ENV === 'production'
    && ['RAILWAY_PROJECT_ID', 'RAILWAY_SERVICE_ID', 'RAILWAY_DEPLOYMENT_ID']
      .every(name => typeof environment[name] === 'string' && environment[name].trim().length > 0);
}

let previousProxyConfiguration;
let trustedProxyAddresses = new net.BlockList();

export const clientAddress = (request, environment = process.env) => {
  const socketAddress = canonicalIp(request?.socket?.remoteAddress);
  if (!socketAddress) return 'unknown';

  const source = clientIpSource(environment);
  if (source === 'railway-public') {
    if (!isRailwayPublicIngress(environment) || parseTrustedProxyCidrs(environment.TRUSTED_PROXY_CIDRS)?.length !== 0) return 'unknown';
    if (request.rawHeaders) {
      let occurrences = 0;
      for (let index = 0; index < request.rawHeaders.length; index += 2) {
        if (String(request.rawHeaders[index]).toLowerCase() === 'x-real-ip') occurrences++;
      }
      if (occurrences !== 1) return 'unknown';
    }
    // Consume only Railway's result, never derive it again from CF/XFF/Forwarded.
    // A missing/ambiguous result must not collapse all visitors onto the socket.
    return canonicalIp(request.headers?.['x-real-ip']) || 'unknown';
  }
  if (source === 'socket') return socketAddress;
  if (!['', 'trusted-proxy'].includes(source)) return 'unknown';

  const configuration = environment?.TRUSTED_PROXY_CIDRS;
  if (configuration !== previousProxyConfiguration) {
    trustedProxyAddresses = blockListFromRanges(parseTrustedProxyCidrs(configuration) || []);
    previousProxyConfiguration = configuration;
  }
  const socketType = net.isIP(socketAddress) === 4 ? 'ipv4' : 'ipv6';
  if (!trustedProxyAddresses.check(socketAddress, socketType)) return socketAddress;

  // The configured ingress must overwrite this header, never append to it.
  const proxyAddress = canonicalIp(request.headers?.['x-real-ip']);
  if (!proxyAddress) return socketAddress;
  const cloudflareAddress = canonicalIp(request.headers?.['cf-connecting-ip']);

  if (cloudflareAddress &&
      cloudflareAddresses.check(proxyAddress, net.isIP(proxyAddress) === 4 ? 'ipv4' : 'ipv6')) {
    return cloudflareAddress;
  }

  return proxyAddress;
};
