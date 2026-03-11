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
    const { name, description, price, image, available, order } = body

    if (!name || price === undefined) {
      return Response.json({ detail: 'Nombre y precio requeridos' }, { status: 400 })
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price,
        image: image || null,
        available: available !== undefined ? available : true,
        order: order || 0,
        categoryId: id,
      },
    })

    return Response.json(
      {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        available: item.available,
        order: item.order,
        category_id: item.categoryId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create menu item error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
