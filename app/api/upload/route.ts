import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createUpload } from '@/lib/cosmic-server'
import { hashIp } from '@/lib/utils'
import { cosmic } from '@/lib/cosmic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadSource = formData.get('uploadSource') as string | null

    // Get IP for rate limiting
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const ipHash = hashIp(ip, process.env.SALT_SECRET || 'default-salt')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    console.log('Uploading image to Cosmic media library:', {
      filename: file.name,
      size: file.size,
      type: file.type
    })

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload image to Cosmic media library
    const mediaResponse = await cosmic.media.insertOne({
      media: buffer,
      folder: 'bookshelf-uploads', // Organize uploads in a folder
      metadata: {
        upload_source: uploadSource || 'web',
        uploaded_at: new Date().toISOString(),
        ip_hash: ipHash
      }
    })

    console.log('Image uploaded to Cosmic:', {
      mediaId: mediaResponse.media.id,
      mediaName: mediaResponse.media.name,
      url: mediaResponse.media.url
    })

    // Create upload object with the uploaded media reference
    const upload = await createUpload({
      ipHash,
      uploadSource: uploadSource || 'web',
      sourceImage: {
        id: mediaResponse.media.id,
        name: mediaResponse.media.name,
        url: mediaResponse.media.url,
        imgix_url: mediaResponse.media.imgix_url
      }
    })

    console.log('Upload object created:', upload.id)

    return NextResponse.json({
      uploadId: upload.id,
      imageUrl: mediaResponse.media.imgix_url
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}