import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bar = await prisma.bar.findUnique({ where: { id } })

    if (!bar) {
      return Response.json({ detail: 'Bar no encontrado' }, { status: 404 })
    }

    return Response.json({
      id: bar.id,
      name: bar.name,
      slug: bar.slug,
      description: bar.description,
      logo: bar.logo,
      cover_image: bar.coverImage,
      address: bar.address,
      phone: bar.phone,
      social_media: bar.socialMedia,
      schedule: bar.schedule,
      is_active: bar.isActive,
    })
  } catch (error) {
    console.error('Get bar error:', error)
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
    const bar = await prisma.bar.findUnique({ where: { id } })

    if (!bar) {
      return Response.json({ detail: 'Bar no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, address, phone, social_media, schedule, logo, cover_image } = body

    const updated = await prisma.bar.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(social_media !== undefined && { socialMedia: social_media }),
        ...(schedule !== undefined && { schedule }),
        ...(logo !== undefined && { logo }),
        ...(cover_image !== undefined && { coverImage: cover_image }),
      },
    })

    return Response.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      logo: updated.logo,
      cover_image: updated.coverImage,
      address: updated.address,
      phone: updated.phone,
      social_media: updated.socialMedia,
      schedule: updated.schedule,
      is_active: updated.isActive,
    })
  } catch (error) {
    console.error('Update bar error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
