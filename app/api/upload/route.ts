import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createUpload } from '@/lib/cosmic-server'
import { hashIp } from '@/lib/utils'

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

    try {
      // Upload using fetch to Cosmic's media endpoint
      const bucketSlug = process.env.COSMIC_BUCKET_SLUG
      const writeKey = process.env.COSMIC_WRITE_KEY

      // Create FormData for upload
      const uploadFormData = new FormData()
      uploadFormData.append('media', file)
      uploadFormData.append('folder', 'bookshelf-uploads')

      const uploadResponse = await fetch(
        `https://api.cosmicjs.com/v3/buckets/${bucketSlug}/media`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${writeKey}`,
          },
          body: uploadFormData,
        }
      )

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Cosmic media upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorText
        })
        throw new Error(`Failed to upload to Cosmic: ${uploadResponse.statusText}`)
      }

      const mediaData = await uploadResponse.json()
      console.log('Image uploaded to Cosmic successfully:', {
        mediaId: mediaData.media?.id,
        mediaName: mediaData.media?.name,
        url: mediaData.media?.url
      })

      if (!mediaData.media) {
        throw new Error('No media object returned from Cosmic')
      }

      // Create upload object with the uploaded media reference
      const upload = await createUpload({
        ipHash,
        uploadSource: uploadSource || 'web',
        sourceImage: {
          id: mediaData.media.id,
          name: mediaData.media.name,
          url: mediaData.media.url,
          imgix_url: mediaData.media.imgix_url || mediaData.media.url
        }
      })

      console.log('Upload object created with image:', {
        uploadId: upload.id,
        hasSourceImage: !!upload.metadata.source_image
      })

      return NextResponse.json({
        uploadId: upload.id,
        imageUrl: mediaData.media.imgix_url || mediaData.media.url
      })
    } catch (uploadError) {
      console.error('Error during image upload:', uploadError)
      throw uploadError
    }
  } catch (error) {
    console.error('Upload route error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to upload image',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}