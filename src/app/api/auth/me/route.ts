import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof Response) return authResult
  const user = authResult

  const bar = await prisma.bar.findUnique({ where: { adminId: user.id } })

  return Response.json({
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    phone: user.phone,
    role: user.role,
    bar_id: bar?.id || null,
  })
}
