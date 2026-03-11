import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; galleryId: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id, galleryId } = await params
    const bar = await prisma.bar.findUnique({ where: { id } })
    if (!bar) return Response.json({ detail: 'Bar no encontrado' }, { status: 404 })
    if (user.role === 'BAR_ADMIN' && bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    await prisma.barGallery.delete({ where: { id: galleryId } })
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Gallery delete error:', error)
    return Response.json({ detail: 'Error interno' }, { status: 500 })
  }
}
