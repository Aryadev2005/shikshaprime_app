import Constants from 'expo-constants';

/**
 * Single source of truth for the backend origin.
 *
 * Resolution order:
 *   1. EXPO_PUBLIC_API_URL   — per-developer override from `.env` (git-ignored).
 *   2. app.json extra.apiUrl — committed default.
 *   3. Debug host            — the machine serving the Metro bundle. On a
 *      physical device this is the only value that is reliably reachable,
 *      since `localhost` there means the phone itself.
 *   4. http://127.0.0.1:4000 — simulator fallback.
 *
 * `.env.example` documented EXPO_PUBLIC_API_URL, but nothing read it — the app
 * was pinned to a stale hotspot IP baked into app.json.
 */

const API_PATH = '/api/mobile';
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
  if (host) return `http://${host}:${DEFAULT_PORT}${API_PATH}`;

  return `http://127.0.0.1:${DEFAULT_PORT}${API_PATH}`;
};

/** Full API base, including the `/api/mobile` prefix. */
export const API_URL = resolveBaseOrigin();

/** Server origin without the API prefix — what Socket.io must connect to. */
export const SOCKET_URL = API_URL.endsWith(API_PATH)
  ? API_URL.slice(0, -API_PATH.length)
  : API_URL;
