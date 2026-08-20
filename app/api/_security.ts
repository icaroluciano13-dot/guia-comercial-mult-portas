const PRODUCTION_ORIGINS = new Set([
  "https://guia-comercial-mult-portas.eletrovale-cont.chatgpt.site",
]);

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "terminal.local"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function isTrustedAppOrigin(origin: string) {
  try {
    const normalized = new URL(origin).origin;
    return PRODUCTION_ORIGINS.has(normalized) || isLocalDevelopmentOrigin(normalized);
  } catch {
    return false;
  }
}

/**
 * State-changing routes accept only the published application (plus local
 * development). Browsers send Origin on cross-site writes, which prevents a
 * third-party page from reusing the cross-site session cookie.
 */
export function isTrustedAppRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return isTrustedAppOrigin(origin);

  try {
    return isTrustedAppOrigin(new URL(request.url).origin);
  } catch {
    return false;
  }
}

export function rejectUntrustedMutation(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return null;
  if (isTrustedAppRequest(request)) return null;
  return Response.json(
    { error: "Solicitação não autorizada." },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

export function withApiSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
