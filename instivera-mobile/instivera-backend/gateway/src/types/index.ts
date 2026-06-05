export interface JwtPayload {
  username: string;
  role: string;
  email: string;
  user_code: string;
  user_type: string;
}

export interface UpstreamError {
  status: 0 | 1;
  message: string;
  data?: any;
}
