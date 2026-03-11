import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export function getSecretKey(): string {
  const key = process.env.SECRET_KEY
  if (!key) throw new Error('SECRET_KEY environment variable is required')
  return key
}
const ACCESS_EXPIRE_MIN = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '30')
const REFRESH_EXPIRE_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || '7')

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(plain: string, hashed: string): boolean {
  return bcrypt.compareSync(plain, hashed)
}

export function createAccessToken(data: Record<string, string>): string {
  return jwt.sign({ ...data, type: 'access' }, getSecretKey(), {
    expiresIn: `${ACCESS_EXPIRE_MIN}m`,
  })
}

export function createRefreshToken(data: Record<string, string>): string {
  return jwt.sign({ ...data, type: 'refresh' }, getSecretKey(), {
    expiresIn: `${REFRESH_EXPIRE_DAYS}d`,
  })
}

export function decodeToken(token: string): Record<string, string> | null {
  try {
    return jwt.verify(token, getSecretKey()) as Record<string, string>
  } catch {
    return null
  }
}

export async function getCurrentUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const payload = decodeToken(token)
  if (!payload || payload.type !== 'access') return null

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user || !user.isActive) return null

  return user
}

export async function requireAuth(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) {
    return Response.json({ detail: 'Token invalido' }, { status: 401 })
  }
  return user
}

export async function requireRole(request: Request, ...roles: string[]) {
  const user = await getCurrentUser(request)
  if (!user) {
    return Response.json({ detail: 'Token invalido' }, { status: 401 })
  }
  if (!roles.includes(user.role)) {
    return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
  }
  return user
}
