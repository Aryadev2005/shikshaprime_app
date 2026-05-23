import { NextFunction } from "express";

export function tenantMiddleware(req, res, next: NextFunction) {
  // Skip tenant validation for static file routes
  // /files - legacy file endpoints
  // /uploads - static file serving for images, PDFs, etc (no tenant isolation needed)
  if (req.path.includes("/files") || req.path.includes("/uploads")) {
    return next();
  }
  const tenant = req.headers["x-tenant"];
  if (!tenant || typeof tenant !== "string") {
    return res.status(400).json({ error: "Tenant header missing" });
  }
  req.tenant = tenant;
  next();
}
