import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createAccessToken, createRefreshToken } from '@/lib/auth'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_name, first_name, last_name, email, password, phone } = body

    if (!bar_name || !first_name || !last_name || !email || !password) {
      return Response.json({ detail: 'Faltan campos requeridos' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ detail: 'El email ya esta registrado' }, { status: 400 })
    }

    const hashedPassword = hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: first_name,
        lastName: last_name,
        phone: phone || null,
        role: 'BAR_ADMIN',
      },
    })

    let slug = slugify(bar_name)
    const existingBar = await prisma.bar.findUnique({ where: { slug } })
    if (existingBar) {
      slug = `${slug}-${user.id.slice(0, 8)}`
    }

    await prisma.bar.create({
      data: {
        name: bar_name,
        slug,
        adminId: user.id,
      },
    })

    const accessToken = createAccessToken({ sub: user.id })
    const refreshToken = createRefreshToken({ sub: user.id })

    return Response.json(
      { access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
