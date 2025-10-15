import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { cosmic } from '@/lib/cosmic'
import { createUpload } from '@/lib/cosmic-server'
import { hashIp, isValidImageType, mbToBytes } from '@/lib/utils'

const MAX_SIZE = mbToBytes(Number(process.env.IMAGE_MAX_MB) || 8)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG and PNG images are allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Image must be less than ${process.env.IMAGE_MAX_MB}MB` },
        { status: 400 }
      )
    }

    // Upload to Cosmic media
    // Convert File to Buffer for Cosmic SDK
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const mediaResponse = await cosmic.media.insertOne({
      media: buffer,
      folder: 'uploads',
      metadata: {
        originalName: file.name,
        contentType: file.type
      }
    })

    // Get IP address for rate limiting
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'unknown'
    const ipHash = hashIp(ip, process.env.SALT_SECRET || 'default-salt')

    // Create upload record with media object
    const upload = await createUpload({
      ipHash,
      sourceImage: mediaResponse.media
    })

    return NextResponse.json({
      uploadId: upload.id
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}