import jwt from "jsonwebtoken";
import { config } from "../config";

interface JWTPayload {
  username: string;
  role: string;
  email: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt_secret, { expiresIn: "24h" });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt_secret) as JWTPayload;
}
