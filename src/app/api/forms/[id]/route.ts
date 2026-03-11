import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const form = await prisma.form.findUnique({ where: { id } })
    if (!form) {
      return Response.json({ detail: 'Formulario no encontrado' }, { status: 404 })
    }

    return Response.json({
      id: form.id,
      name: form.name,
      fields: form.fields,
      bar_id: form.barId,
    })
  } catch (error) {
    console.error('Get form error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id } = await params

    const form = await prisma.form.findUnique({
      where: { id },
      include: { bar: true },
    })

    if (!form) {
      return Response.json({ detail: 'Formulario no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && form.bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, fields } = body

    const updated = await prisma.form.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(fields !== undefined && { fields }),
      },
    })

    return Response.json({
      id: updated.id,
      name: updated.name,
      fields: updated.fields,
      bar_id: updated.barId,
    })
  } catch (error) {
    console.error('Update form error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id } = await params

    const form = await prisma.form.findUnique({
      where: { id },
      include: { bar: true },
    })

    if (!form) {
      return Response.json({ detail: 'Formulario no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && form.bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    await prisma.form.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Delete form error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
