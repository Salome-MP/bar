import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult

  try {
    const { id } = await params
    const body = await request.json()
    const { is_active } = body

    if (is_active === undefined) {
      return Response.json({ detail: 'is_active requerido' }, { status: 400 })
    }

    const bar = await prisma.bar.findUnique({ where: { id } })
    if (!bar) {
      return Response.json({ detail: 'Bar no encontrado' }, { status: 404 })
    }

    const updated = await prisma.bar.update({
      where: { id },
      data: { isActive: is_active },
    })

    return Response.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      is_active: updated.isActive,
    })
  } catch (error) {
    console.error('Toggle bar status error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
