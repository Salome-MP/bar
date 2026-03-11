import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decodeToken, createAccessToken, createRefreshToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return Response.json({ detail: 'Token requerido' }, { status: 400 })
    }

    const payload = decodeToken(refresh_token)
    if (!payload || payload.type !== 'refresh') {
      return Response.json({ detail: 'Token invalido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) {
      return Response.json({ detail: 'Usuario no encontrado o inactivo' }, { status: 401 })
    }

    const accessToken = createAccessToken({ sub: user.id })
    const refreshToken = createRefreshToken({ sub: user.id })

    return Response.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
