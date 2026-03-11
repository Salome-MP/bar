import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id } = await params
    const bar = await prisma.bar.findUnique({ where: { id } })

    if (!bar) {
      return Response.json({ detail: 'Bar no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, fields } = body

    if (!name || !fields) {
      return Response.json({ detail: 'Faltan campos requeridos' }, { status: 400 })
    }

    const form = await prisma.form.create({
      data: {
        name,
        fields,
        barId: id,
      },
    })

    return Response.json(
      {
        id: form.id,
        name: form.name,
        fields: form.fields,
        bar_id: form.barId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create form error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult

  try {
    const { id } = await params

    const forms = await prisma.form.findMany({
      where: { barId: id },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(
      forms.map((f) => ({
        id: f.id,
        name: f.name,
        fields: f.fields,
        bar_id: f.barId,
      }))
    )
  } catch (error) {
    console.error('List forms error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
