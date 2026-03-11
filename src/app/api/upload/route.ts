import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuid } from 'uuid'

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO = ['video/mp4', 'video/webm']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ detail: 'No se envio ningun archivo' }, { status: 400 })
    }

    const isImage = ALLOWED_IMAGE.includes(file.type)
    const isVideo = ALLOWED_VIDEO.includes(file.type)

    if (!isImage && !isVideo) {
      return Response.json({ detail: 'Tipo de archivo no permitido' }, { status: 400 })
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    if (file.size > maxSize) {
      return Response.json({ detail: `Archivo muy grande. Maximo ${isImage ? '5MB' : '50MB'}` }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4')
    const filename = `${uuid()}_${Date.now()}.${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadsDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadsDir, filename), buffer)

    return Response.json({
      url: `/uploads/${filename}`,
      type: isImage ? 'IMAGE' : 'VIDEO',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ detail: 'Error al subir archivo' }, { status: 500 })
  }
}
