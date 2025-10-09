import jwt from 'jsonwebtoken'

export type AuthUser = {
  id: string
  email: string
  role: 'SUPER_ADMIN' | 'MIDDLE_ADMIN' | 'LOW_ADMIN' | 'COURIER'
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Please configure it in your environment.')
  }
  return secret
}

export function signJwt(payload: AuthUser, expiresIn: string = '24h'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn })
}

export function verifyJwt(token: string): AuthUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthUser
  } catch {
    return null
  }
}

export function getBearerToken(authHeader?: string | null): string | null {
  if (!authHeader) return null
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null
  return authHeader.slice(7).trim()
}
