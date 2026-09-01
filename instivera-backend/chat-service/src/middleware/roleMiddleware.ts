export function requireRole(role: string) {
  return function (req, res, next) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (String(user.role).toLowerCase() !== String(role).toLowerCase()) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
