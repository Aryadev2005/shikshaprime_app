import { NextFunction } from "express";

export function requireRole(...roles: string[]) {
  return (req, res, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = String(user.role || "").toLowerCase();
    const allowed = roles.map(r => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}