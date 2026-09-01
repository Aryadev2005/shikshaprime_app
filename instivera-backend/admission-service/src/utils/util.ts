export function normalizeEnum<T extends string>(
  raw: string,
  allowed: readonly T[],
  fallback: T
): T {
  const val = raw.trim().toUpperCase();
  return (allowed.includes(val as T) ? val : fallback) as T;
}