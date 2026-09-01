import { verifyToken } from "../utils/jwt";

export function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ status: "error", message: "Missing token", data: null });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ status: "error", message: "Invalid or expired token", data: null });
  }
}
