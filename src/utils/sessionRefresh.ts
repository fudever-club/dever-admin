import { constants } from "@/settings";

/**
 * Single-flight silent session refresh against the httpOnly cookie session.
 * Concurrent 401s share one refresh request; returns true when the retried
 * call is worth attempting again. Never throws.
 */
let inflightRefresh: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!inflightRefresh) {
    inflightRefresh = (async () => {
      try {
        const res = await fetch(`${constants.API_SERVER}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        return res.ok;
      } catch {
        return false;
      }
    })().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

/** Auth endpoints must never trigger a refresh loop. */
export function isAuthEndpoint(url: string): boolean {
  return url.includes("/api/v1/auth/login") || url.includes("/api/v1/auth/refresh");
}
