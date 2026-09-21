export type SignInRole = "customer" | "companion";

const FALLBACK_PATH = "/choose-role";
const FORWARDED_HOST_PATTERN = /^[a-z0-9.-]+(?::\d{1,5})?$/i;

export function getSafeNext(rawNext: string | null | undefined) {
  if (!rawNext) return FALLBACK_PATH;

  try {
    const base = new URL("https://care-companion.local");
    const target = new URL(rawNext, base);
    return target.origin === base.origin && rawNext.startsWith("/")
      ? `${target.pathname}${target.search}${target.hash}`
      : FALLBACK_PATH;
  } catch {
    return FALLBACK_PATH;
  }
}

export function getAppOrigin(
  requestUrl: string,
  forwardedHost: string | null,
  isDevelopment = process.env.NODE_ENV === "development",
) {
  const requestOrigin = new URL(requestUrl).origin;
  if (
    isDevelopment ||
    !forwardedHost ||
    !FORWARDED_HOST_PATTERN.test(forwardedHost)
  ) {
    return requestOrigin;
  }
  return `https://${forwardedHost}`;
}

export function buildOAuthCallbackUrl(origin: string, role: SignInRole) {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", `/choose-role?role=${role}`);
  return callback.toString();
}
