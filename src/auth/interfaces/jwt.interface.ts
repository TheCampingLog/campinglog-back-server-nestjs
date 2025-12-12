export interface JwtData {
  email: string;
  role: string;
}

export interface AccessTokenPayload {
  email: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
}

export interface RefreshData {
  id: string;
  sub: string;
}

export interface RefreshTokenPayload {
  id: string;
  sub: string;
  iat: number;
  exp: number;
}
