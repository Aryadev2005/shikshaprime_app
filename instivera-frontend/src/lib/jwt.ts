/**
 * Minimal, dependency-free JWT payload decoder.
 *
 * Deliberately does NOT use `atob`:
 *  - `atob` is not defined by React Native itself (it only type-checks because
 *    Expo's tsconfig pulls in `lib.dom`), so relying on it couples us to
 *    whichever engine happens to be running.
 *  - JWT segments are base64**url** encoded (`-`/`_` instead of `+`/`/`, with
 *    padding stripped). Feeding those straight to `atob` throws or yields
 *    garbage, which previously made role detection silently fail.
 */

const B64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decode a standard base64 string into a binary-safe JS string. */
const base64Decode = (input: string): string => {
  const clean = input.replace(/[^A-Za-z0-9+/=]/g, '');
  let output = '';

  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_ALPHABET.indexOf(clean[i]);
    const c1 = B64_ALPHABET.indexOf(clean[i + 1]);
    const c2 = B64_ALPHABET.indexOf(clean[i + 2]);
    const c3 = B64_ALPHABET.indexOf(clean[i + 3]);

    if (c0 < 0 || c1 < 0) break;

    output += String.fromCharCode((c0 << 2) | (c1 >> 4));
    if (c2 >= 0) output += String.fromCharCode(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 >= 0) output += String.fromCharCode(((c2 & 3) << 6) | c3);
  }

  return output;
};

/** Interpret a binary string as UTF-8 so non-ASCII names survive the round trip. */
const utf8Decode = (binary: string): string => {
  try {
    return decodeURIComponent(
      binary
        .split('')
        .map((ch) => `%${`00${ch.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
  } catch {
    return binary;
  }
};

export interface JwtPayload {
  role?: string;
  sub?: string;
  exp?: number;
  [key: string]: unknown;
}

/** Decode a JWT's payload. Returns null for anything malformed. */
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    // base64url -> base64, then restore the stripped padding.
    let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';

    return JSON.parse(utf8Decode(base64Decode(b64))) as JwtPayload;
  } catch {
    return null;
  }
};

/** Extract the role claim from a JWT, if present. */
export const decodeJwtRole = (token: string): string | null =>
  decodeJwt(token)?.role ?? null;

/** True when the token carries an `exp` claim that is already in the past. */
export const isJwtExpired = (token: string): boolean => {
  const exp = decodeJwt(token)?.exp;
  return typeof exp === 'number' && exp * 1000 <= Date.now();
};
