import { verifyToken } from "../utils/jwt";

export function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // attach user info for downstream use
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
