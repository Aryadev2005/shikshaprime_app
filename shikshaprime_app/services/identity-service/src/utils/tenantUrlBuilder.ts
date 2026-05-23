const BASE_DOMAIN: string = process.env.BASE_DOMAIN || "mainapp.local";
const BASE_PORT: number = Number(process.env.BASE_PORT);
const BASE_METHOD: string = process.env.BASE_METHOD || "http";
const CONTEXT: string = process.env.CONTEXT || "";

/**
 * Build a tenant-specific URL.
 *
 * @param tenant - The tenant identifier (e.g. "collegea", "schoolone").
 * @param port - The port number (e.g. 3000 for frontend, 9050 for APIs).
 * @param path - The path to append (e.g. "/online-registration").
 * @returns The full URL as a string.
 */
export function buildTenantUrl(tenant: string, port: number, path: string): string {
  const url = new URL(`http://${tenant}.${BASE_DOMAIN}:${port}`);
  url.pathname = path;
  return url.toString();
}

export function buildTenantFrontendUrl(tenant: string, path: string): string {
  const url = new URL(`${BASE_METHOD}://${tenant}.${BASE_DOMAIN}:${BASE_PORT}`);
  url.pathname = `${CONTEXT}${path}`;
  return url.toString();
}


/**
 * Build a frontend URL for a tenant.
 */
export function buildFrontendUrl(tenant: string, path: string = "/"): string {
  return buildTenantFrontendUrl(tenant, path);
}

/**
 * Build a college API URL for a tenant.
 */
export function buildApiUrl(tenant: string, path: string): string {
  return buildTenantUrl(tenant, 9050, path);
}

/**
 * Build a school API URL for a tenant.
 */
export function buildSchoolApiUrl(tenant: string, path: string): string {
  return buildTenantUrl(tenant, 9060, path);
}