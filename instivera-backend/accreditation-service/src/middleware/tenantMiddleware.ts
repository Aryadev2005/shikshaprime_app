import { NextFunction } from "express";
import { sequelize } from "../models";
import { QueryTypes } from "sequelize";

const tenantIdCache: Record<string, number> = {};

export async function tenantMiddleware(req: any, res: any, next: NextFunction) {
  if (
    req.path === "/" ||
    req.path === "/health" ||
    req.path === "/ready" ||
    req.path === "/api/accreditation/api-docs.json" ||
    req.path.startsWith("/api/accreditation/api-docs") ||
    req.path.includes("/files")
  ) {
    return next();
  }
  const tenant = req.headers["x-tenant"];
  if (!tenant || typeof tenant !== "string") {
    return res.status(400).json({ error: "Tenant header missing" });
  }
  req.tenant = tenant;

  let tenantId = req.headers["x-tenant-id"] ? Number(req.headers["x-tenant-id"]) : null;
  if (!tenantId) {
    if (tenantIdCache[req.tenant]) {
      tenantId = tenantIdCache[req.tenant];
    } else {
      try {
        const results: any = await sequelize.query(
          `SELECT id FROM tenants WHERE name = :tenant OR subdomain = :tenant OR access_code = :tenant LIMIT 1`,
          { replacements: { tenant: req.tenant }, type: QueryTypes.SELECT }
        );
        if (results && results.length > 0 && results[0].id) {
          tenantId = Number(results[0].id);
          tenantIdCache[req.tenant] = tenantId;
        }
      } catch (e) {
        // Graceful fallback if table doesn't exist or during unit testing
      }
    }
  }

  req.tenant_id = tenantId ;
  req.tenantId = req.tenant_id;

  next();
}


