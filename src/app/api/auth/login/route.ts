import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createAccessToken, createRefreshToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json({ detail: 'Faltan campos requeridos' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.password)) {
      return Response.json({ detail: 'Credenciales invalidas' }, { status: 401 })
    }

    if (!user.isActive) {
      return Response.json({ detail: 'Cuenta desactivada' }, { status: 403 })
    }

    const accessToken = createAccessToken({ sub: user.id })
    const refreshToken = createRefreshToken({ sub: user.id })

    return Response.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
