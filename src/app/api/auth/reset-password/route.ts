import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, getSecretKey } from '@/lib/auth'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return Response.json({ detail: 'Token y contrasena requeridos' }, { status: 400 })
    }

    let payload: Record<string, string>
    try {
      payload = jwt.verify(token, getSecretKey()) as Record<string, string>
    } catch {
      return Response.json({ detail: 'Token invalido o expirado' }, { status: 400 })
    }

    if (payload.purpose !== 'reset') {
      return Response.json({ detail: 'Token invalido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      return Response.json({ detail: 'Usuario no encontrado' }, { status: 404 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(password) },
    })

    return Response.json({ message: 'Contrasena actualizada correctamente' })
  } catch (error) {
    console.error('Reset password error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
