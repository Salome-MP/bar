import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSecretKey } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return Response.json({ detail: 'Email requerido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const token = jwt.sign({ sub: user.id, purpose: 'reset' }, getSecretKey(), {
        expiresIn: '30m',
      })

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

      try {
        await sendPasswordResetEmail(email, resetUrl)
      } catch (e) {
        console.error('Error sending reset email:', e)
      }
    }

    return Response.json({ message: 'Si el email existe, se envio un enlace de recuperacion' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
