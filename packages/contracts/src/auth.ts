export interface JwtPayload {
  sub: string
  email?: string
  preferred_username?: string
  [key: string]: any
}
