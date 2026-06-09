import rateLimit from 'express-rate-limit';

const json429 = (msg: string) => ({ status: 0, data: null, message: msg });

/** 200 req / 15 min — applied globally to all routes */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429('Too many requests, please try again later.'),
});

/** 20 req / 15 min — applied to auth endpoints (login, OTP) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429('Too many authentication attempts, please try again later.'),
});

/** 10 req / 15 min — applied to file-upload endpoints */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429('Upload rate limit exceeded, please try again later.'),
});
