/** This computer, a private network, or a name reserved for testing. */
export function isLocalDevelopmentHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host === "[::1]" || /\.(localhost|local|test)$/.test(host)) return true;
  const ip = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  if (!ip) return false;
  const [a, b] = [Number(ip[1]), Number(ip[2])];
  return host === "0.0.0.0" || a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function isLocalDevelopmentUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && isLocalDevelopmentHost(url.hostname);
  } catch { return false; }
}
