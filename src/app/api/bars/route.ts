import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search')

    const where: Record<string, unknown> = { isActive: true }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const bars = await prisma.bar.findMany({
      where,
      include: {
        events: {
          where: { isActive: true, startDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
          take: 1,
          select: { title: true, startDate: true },
        },
        _count: { select: { events: { where: { isActive: true } } } },
      },
    })

    return Response.json(
      bars.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        logo: b.logo,
        cover_image: b.coverImage,
        address: b.address,
        phone: b.phone,
        social_media: b.socialMedia,
        schedule: b.schedule,
        is_active: b.isActive,
        event_count: b._count.events,
        next_event: b.events[0] ? {
          title: b.events[0].title,
          date: b.events[0].startDate.toISOString(),
        } : null,
      }))
    )
  } catch (error) {
    console.error('List bars error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
