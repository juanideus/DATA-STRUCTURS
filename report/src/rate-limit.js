const SECOND = 1_000;

const retryAfterSeconds = (oldest, windowMs, now) =>
  Math.max(1, Math.ceil((oldest + windowMs - now) / SECOND));

export function createReportRateLimiter({
  clock = Date.now,
  perAddressLimit = 5,
  perAddressWindowMs = 15 * 60 * SECOND,
  globalLimit = 120,
  globalWindowMs = 60 * SECOND,
  maxTrackedAddresses = 5_000,
} = {}) {
  const requestsByAddress = new Map();
  let globalRequests = [];
  let lastCleanup = 0;

  const cleanup = now => {
    for (const [address, timestamps] of requestsByAddress) {
      const active = timestamps.filter(timestamp => now - timestamp < perAddressWindowMs);
      if (active.length) requestsByAddress.set(address, active);
      else requestsByAddress.delete(address);
    }
    lastCleanup = now;
  };

  return address => {
    const now = clock();
    if (now - lastCleanup >= perAddressWindowMs) cleanup(now);

    const recent = (requestsByAddress.get(address) || [])
      .filter(timestamp => now - timestamp < perAddressWindowMs);
    if (recent.length >= perAddressLimit) {
      return {
        allowed: false,
        retryAfterSeconds: retryAfterSeconds(recent[0], perAddressWindowMs, now),
      };
    }

    globalRequests = globalRequests.filter(timestamp => now - timestamp < globalWindowMs);
    if (globalRequests.length >= globalLimit) {
      return {
        allowed: false,
        retryAfterSeconds: retryAfterSeconds(globalRequests[0], globalWindowMs, now),
      };
    }

    if (!requestsByAddress.has(address) && requestsByAddress.size >= maxTrackedAddresses) {
      cleanup(now);
      if (requestsByAddress.size >= maxTrackedAddresses) {
        return { allowed: false, retryAfterSeconds: Math.ceil(globalWindowMs / SECOND) };
      }
    }

    requestsByAddress.set(address, [...recent, now]);
    globalRequests.push(now);
    return { allowed: true };
  };
}
