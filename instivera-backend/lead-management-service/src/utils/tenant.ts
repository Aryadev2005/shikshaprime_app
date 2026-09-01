import { Request } from "express";

export function detectTenant(req: Request): string {
  const host = req.headers.host || "";          // e.g. "collegea.shikshaprime.com"
  const subdomain = host.split(".")[0];        // "collegea"
  return subdomain;
}
