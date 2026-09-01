import { NextFunction } from "express";

export function tenantMiddleware(req, res, next: NextFunction) {
  const bypassPaths = ["/api/identity/api-docs", "/api/identity/api-docs.json"];

  // Bypass tenant check for Swagger docs and storage files
  if (req.path.includes("/files") || bypassPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }
  const tenant = req.headers["x-tenant"];
  if (!tenant || typeof tenant !== "string") {
    return res.status(400).json({ error: "Tenant header missing" });
  }
  req.tenant = tenant;
  next();
}
