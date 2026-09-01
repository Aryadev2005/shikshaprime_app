import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError";

export const validate = (req: Request, _res: Response, next: NextFunction) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw new ApiError(422, "Validation failed", result.array().map((e) => `${e.type}:${e.msg}`));
  }
  next();
};
