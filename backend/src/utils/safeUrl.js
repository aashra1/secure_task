const net = require("net");

const blockedHostnames = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

const isPrivateIpv4 = (hostname) => {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
};

const isSafePublicHttpsUrl = (value) => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443") ||
      blockedHostnames.has(hostname) ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false;
    }
    if (net.isIPv4(hostname)) return !isPrivateIpv4(hostname);
    if (net.isIPv6(hostname)) {
      const normalized = hostname.toLowerCase();
      return !(
        normalized === "::" ||
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe8") ||
        normalized.startsWith("fe9") ||
        normalized.startsWith("fea") ||
        normalized.startsWith("feb")
      );
    }
    return /^[a-z0-9.-]+$/.test(hostname) && hostname.includes(".");
  } catch {
    return false;
  }
};

module.exports = { isSafePublicHttpsUrl };
