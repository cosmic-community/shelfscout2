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
      
      // Changed: Add comprehensive logging of the response structure
      console.log('Full Cosmic media response:', JSON.stringify(mediaData, null, 2))
      console.log('Response keys:', Object.keys(mediaData))
      
      // Changed: Handle different possible response structures from Cosmic
      // The response might be { media: {...} } or just the media object directly
      let mediaObject = null
      
      if (mediaData.media) {
        // Standard structure: { media: {...} }
        mediaObject = mediaData.media
        console.log('Found media object in mediaData.media')
      } else if (mediaData.id && mediaData.name && mediaData.url) {
        // Direct structure: the response IS the media object
        mediaObject = mediaData
        console.log('Response is the media object directly')
      } else if (mediaData.object && mediaData.object.metadata && mediaData.object.metadata.url) {
        // Object structure: { object: { metadata: { url, ... } } }
        mediaObject = {
          id: mediaData.object.id,
          name: mediaData.object.metadata.name || mediaData.object.title,
          url: mediaData.object.metadata.url,
          imgix_url: mediaData.object.metadata.imgix_url || mediaData.object.metadata.url
        }
        console.log('Found media data in object.metadata structure')
      }

      if (!mediaObject) {
        console.error('Could not extract media object from response:', {
          hasMedia: !!mediaData.media,
          hasId: !!mediaData.id,
          hasObject: !!mediaData.object,
          responseKeys: Object.keys(mediaData)
        })
        throw new Error('No media object returned from Cosmic - unexpected response structure')
      }

      console.log('Extracted media object:', {
        id: mediaObject.id,
        name: mediaObject.name,
        url: mediaObject.url,
        imgix_url: mediaObject.imgix_url
      })

      // Create upload object with the uploaded media reference
      const upload = await createUpload({
        ipHash,
        uploadSource: uploadSource || 'web',
        sourceImage: {
          id: mediaObject.id,
          name: mediaObject.name,
          url: mediaObject.url,
          imgix_url: mediaObject.imgix_url || mediaObject.url
        }
      })

      console.log('Upload object created with image:', {
        uploadId: upload.id,
        hasSourceImage: !!upload.metadata.source_image
      })

      return NextResponse.json({
        uploadId: upload.id,
        imageUrl: mediaObject.imgix_url || mediaObject.url
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