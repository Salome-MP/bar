import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const items = await prisma.barGallery.findMany({
      where: { barId: id },
      orderBy: { order: 'asc' },
    })
    return Response.json(items.map(i => ({
      id: i.id,
      url: i.url,
      caption: i.caption,
      type: i.type,
      order: i.order,
    })))
  } catch (error) {
    console.error('Gallery list error:', error)
    return Response.json({ detail: 'Error interno' }, { status: 500 })
  }
}

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
    if (!bar) return Response.json({ detail: 'Bar no encontrado' }, { status: 404 })
    if (user.role === 'BAR_ADMIN' && bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { url, caption, type } = body

    if (!url) return Response.json({ detail: 'URL requerida' }, { status: 400 })

    const count = await prisma.barGallery.count({ where: { barId: id } })

    const item = await prisma.barGallery.create({
      data: {
        url,
        caption: caption || null,
        type: type || 'IMAGE',
        order: count,
        barId: id,
      },
    })

    return Response.json({ id: item.id, url: item.url, caption: item.caption, type: item.type, order: item.order }, { status: 201 })
  } catch (error) {
    console.error('Gallery create error:', error)
    return Response.json({ detail: 'Error interno' }, { status: 500 })
  }
}
