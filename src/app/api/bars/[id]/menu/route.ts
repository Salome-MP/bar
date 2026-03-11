import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const categories = await prisma.menuCategory.findMany({
      where: { barId: id },
      include: {
        items: {
          where: { available: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return Response.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        order: c.order,
        items: c.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          available: item.available,
          order: item.order,
        })),
      }))
    )
  } catch (error) {
    console.error('Get menu error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
