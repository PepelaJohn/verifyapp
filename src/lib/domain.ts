/**
 * Normalizes a domain or URL string to a plain lowercase hostname.
 * Strips protocol, www prefix, port, and trailing slashes.
 *
 * Examples:
 *   "https://www.example.com/path" → "example.com"
 *   "http://mysite.com:8080"       → "mysite.com"
 *   "EXAMPLE.COM"                  → "example.com"
 */
export function normalizeDomain(input: string): string {
  if (!input) return "";

  let str = input.trim().toLowerCase();

  // Add protocol if missing so URL parsing works
  if (!str.startsWith("http://") && !str.startsWith("https://")) {
    str = "https://" + str;
  }

  try {
    const { hostname } = new URL(str);
    // Strip leading www.
    return hostname.replace(/^www\./, "");
  } catch {
    // Fallback: strip protocol and path manually
    return str
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split(":")[0];
  }
}

/**
 * Returns true if the two domain strings normalize to the same hostname.
 */
export function domainsMatch(a: string, b: string): boolean {
  return normalizeDomain(a) === normalizeDomain(b);
}
