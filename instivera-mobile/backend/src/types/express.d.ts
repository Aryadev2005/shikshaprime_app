declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        role: string;
        email: string;
        user_code: string;
        user_type: string;
      };
      token?: string;
      tenant?: string;
    }
  }
}

export {};
