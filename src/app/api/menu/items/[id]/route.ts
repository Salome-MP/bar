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

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: { include: { bar: true } } },
    })

    if (!item) {
      return Response.json({ detail: 'Item no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && item.category.bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, image, available, order, category_id } = body

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(image !== undefined && { image }),
        ...(available !== undefined && { available }),
        ...(order !== undefined && { order }),
        ...(category_id !== undefined && { categoryId: category_id }),
      },
    })

    return Response.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      image: updated.image,
      available: updated.available,
      order: updated.order,
      category_id: updated.categoryId,
    })
  } catch (error) {
    console.error('Update menu item error:', error)
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

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: { include: { bar: true } } },
    })

    if (!item) {
      return Response.json({ detail: 'Item no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && item.category.bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    await prisma.menuItem.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Delete menu item error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
