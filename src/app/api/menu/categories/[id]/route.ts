import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id } = await params

    const category = await prisma.menuCategory.findUnique({
      where: { id },
      include: { bar: true },
    })

    if (!category) {
      return Response.json({ detail: 'Categoria no encontrada' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && category.bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, order } = body

    const updated = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(order !== undefined && { order }),
      },
    })

    return Response.json({
      id: updated.id,
      name: updated.name,
      order: updated.order,
      bar_id: updated.barId,
    })
  } catch (error) {
    console.error('Update category error:', error)
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

    const category = await prisma.menuCategory.findUnique({
      where: { id },
      include: { bar: true },
    })

    if (!category) {
      return Response.json({ detail: 'Categoria no encontrada' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && category.bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    await prisma.menuCategory.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Delete category error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
