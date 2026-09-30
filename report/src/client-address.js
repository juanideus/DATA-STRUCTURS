import net from 'node:net';

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

const cloudflareAddresses = new net.BlockList();
for (const cidr of CLOUDFLARE_RANGES) {
  const [address, prefix] = cidr.split('/');
  cloudflareAddresses.addSubnet(address, Number(prefix), net.isIP(address) === 4 ? 'ipv4' : 'ipv6');
}

const validIp = value => {
  const address = String(value || '').trim();
  return net.isIP(address) ? address : null;
};

export const clientAddress = request => {
  const railwayHeader = request.headers['x-real-ip'];
  const railwayAddress = validIp(String(Array.isArray(railwayHeader) ? railwayHeader[0] : railwayHeader || '')
    .split(',')[0]);
  const cloudflareHeader = request.headers['cf-connecting-ip'];
  const cloudflareAddress = validIp(Array.isArray(cloudflareHeader) ? cloudflareHeader[0] : cloudflareHeader);

  if (railwayAddress && cloudflareAddress &&
      cloudflareAddresses.check(railwayAddress, net.isIP(railwayAddress) === 4 ? 'ipv4' : 'ipv6')) {
    return cloudflareAddress;
  }

  return railwayAddress || validIp(request.socket.remoteAddress) || 'unknown';
};
