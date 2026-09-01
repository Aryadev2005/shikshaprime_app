import { NextFunction } from "express";

export function tenantMiddleware(req, res, next: NextFunction) {
  if (req.path === "/api/fees-management/api-docs.json" || req.path.startsWith("/api/fees-management/api-docs")) {
    return next();
  }
  if (req.path.includes("/files")) {
    return next();
  }
  const tenant = req.headers["x-tenant"];
  if (!tenant || typeof tenant !== "string") {
    return res.status(400).json({ error: "Tenant header missing" });
  }
  req.tenant = tenant;
  next();
}
