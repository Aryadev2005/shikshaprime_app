export function validateEnv(requiredVars: string[]): void {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error('[startup] Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}
