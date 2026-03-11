import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { v4 as uuid } from 'uuid'

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO = ['video/mp4', 'video/webm']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE!
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY!
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME!
const BUNNY_BASE_PATH = process.env.BUNNY_BASE_PATH || 'appbar'

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
    const bunnyPath = `${BUNNY_BASE_PATH}/${filename}`

    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Bunny Storage
    const bunnyRes = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${bunnyPath}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_STORAGE_API_KEY,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
      }
    )

    if (!bunnyRes.ok) {
      const errorText = await bunnyRes.text()
      console.error('Bunny upload error:', bunnyRes.status, errorText)
      return Response.json({ detail: 'Error al subir archivo al CDN' }, { status: 500 })
    }

    const cdnUrl = `https://${BUNNY_CDN_HOSTNAME}/${bunnyPath}`

    return Response.json({
      url: cdnUrl,
      type: isImage ? 'IMAGE' : 'VIDEO',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ detail: 'Error al subir archivo' }, { status: 500 })
  }
}
