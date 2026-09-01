import { verifyToken } from "../utils/jwt";
import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({ status: "error", message: "Missing authorization token", data: null });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = verifyToken(token);
        (req as any).user = decoded;
        next();
    } catch {
        return res.status(403).json({ status: "error", message: "Invalid or expired token", data: null });
    }
}
