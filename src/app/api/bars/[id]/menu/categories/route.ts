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
    const { name, order } = body

    if (!name) {
      return Response.json({ detail: 'Nombre requerido' }, { status: 400 })
    }

    const category = await prisma.menuCategory.create({
      data: {
        name,
        order: order || 0,
        barId: id,
      },
    })

    return Response.json(
      {
        id: category.id,
        name: category.name,
        order: category.order,
        bar_id: category.barId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create category error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const categories = await prisma.menuCategory.findMany({
      where: { barId: id },
      orderBy: { order: 'asc' },
    })

    return Response.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        order: c.order,
        bar_id: c.barId,
      }))
    )
  } catch (error) {
    console.error('List categories error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
