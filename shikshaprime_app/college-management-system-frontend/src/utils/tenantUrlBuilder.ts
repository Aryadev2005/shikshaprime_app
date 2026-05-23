const BASE_DOMAIN: string = process.env.NEXT_PUBLIC_BASE_DOMAIN || "mainapp.local";
const BASE_METHOD: string = process.env.NEXT_PUBLIC_BASE_METHOD || "http";

/**
 * Build a tenant-specific URL.
 *
 * @param tenant - The tenant identifier (e.g. "collegea", "schoolone").
 * @param port - The port number (e.g. 3000 for frontend, 9050 for APIs).
 * @param path - The path to append (e.g. "/online-registration").
 * @returns The full URL as a string.
 */
export function buildTenantUrl(tenant: string, port: number, path: string): string {
  const url = new URL(`${BASE_METHOD}://${tenant}.${BASE_DOMAIN}:${port}`);
  url.pathname = path;
  return url.toString();
}

/**
 * Build a frontend URL for a tenant.
 */
export function buildFrontendUrl(tenant: string, port: number, path: string = "/"): string {
  return buildTenantUrl(tenant, port, path);
}

/**
 * Build a college API URL for a tenant.
 */
export function buildApiUrl(tenant: string, port: number, path: string): string {
  return buildTenantUrl(tenant, port, path);
}

/**
 * Build a school API URL for a tenant.
 */
export function buildSchoolApiUrl(tenant: string, path: string): string {
  return buildTenantUrl(tenant, 9060, path);
}

/**
 * Get the current tenant from the browser (cookie or hostname).
 */
export function getCurrentTenant(): string {
  if (typeof document !== "undefined") {
    const tenantCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("tenant="));
    if (tenantCookie) {
      return tenantCookie.split("=")[1];
    }
  }

  // Fallback to hostname if cookie not found
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const parts = host.split(".");
    if (parts.length > 1) {
      // Handle localhost or standard subdomains
      return parts[0] === "localhost" ? "collegea" : parts[0];
    }
  }

  return "collegea"; // Final default fallback
}