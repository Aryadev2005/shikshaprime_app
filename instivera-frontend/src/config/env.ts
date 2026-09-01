import Constants from 'expo-constants';

/**
 * Single source of truth for the backend origin.
 *
 * The backend has no unified mobile gateway — it's 13 independent services,
 * each mounted at its own /api/<service-name> prefix (e.g. /api/identity,
 * /api/student). This just resolves the bare origin; every api/modules/*.ts
 * call is responsible for its own full path, starting with /api/<service>.
 *
 * Resolution order:
 *   1. EXPO_PUBLIC_API_URL   — per-developer override from `.env` (git-ignored)
 *   2. app.json extra.apiUrl — committed default
 *   3. Debug host            — the machine serving the Metro bundle. On a
 *      physical device this is the only value that is reliably reachable,
 *      since `localhost` there means the phone itself.
 *   4. http://127.0.0.1:4000 — simulator fallback
 */

const DEFAULT_PORT = 4000;

/** Metro's host, e.g. "192.168.1.14:8081" -> "192.168.1.14". */
const debugHost = (): string | null => {
  const raw =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;
  const host = raw?.split(':')[0]?.trim();
  return host ? host : null;
};

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

const resolveBaseOrigin = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return stripTrailingSlash(fromEnv);

  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra) return stripTrailingSlash(fromExtra);

  const host = debugHost();
  if (host) return `http://${host}:${DEFAULT_PORT}`;

  return `http://127.0.0.1:${DEFAULT_PORT}`;
};

/** Bare backend origin — no path prefix. Every caller appends /api/<service>/... */
export const API_URL = resolveBaseOrigin();

/** Socket.io connects at the origin root, same as the REST origin. */
export const SOCKET_URL = API_URL;