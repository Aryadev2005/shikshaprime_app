import { verifyToken } from "../utils/jwt";

export function requireRole(...roles: string[]) {
    return function (req: any, res: any, next: any) {
        let user = req.user;

        // If user is not already set by an upstream middleware, parse the JWT here
        if (!user) {
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res.status(401).json({ status: "error", message: "Unauthorized: Missing token", data: null });
            }

            const token = authHeader.split(" ")[1];
            try {
                user = verifyToken(token);
                req.user = user;
            } catch (err) {
                return res.status(401).json({ status: "error", message: "Unauthorized: Invalid or expired token", data: null });
            }
        }

        if (!user) {
            return res.status(401).json({ status: "error", message: "Unauthorized", data: null });
        }

        const userRole = String(user.role).toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ status: "error", message: `Forbidden: insufficient role (requires ${allowedRoles.join(" or ")})`, data: null });
        }
        next();
    };
}
