export function requireRole(...roles: string[]) {
          return function (req, res, next) {
                    const user = req.user;
                    if (!user) {
                              return res.status(401).json({ status: "error", message: "Unauthorized", data: null });
                    }

                    const userRole = String(user.role).toLowerCase();
                    const allowedRoles = roles.map(r => r.toLowerCase());

                    if (!allowedRoles.includes(userRole)) {
                              return res.status(403).json({ status: "error", message: "Forbidden: insufficient role", data: null });
                    }
                    next();
          };
}
