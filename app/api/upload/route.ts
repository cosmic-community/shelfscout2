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

      const responseData = await uploadResponse.json()
      
      // Log the full response for debugging
      console.log('Full Cosmic media API response:', JSON.stringify(responseData, null, 2))
      
      // Changed: Cosmic v3 Media API returns { media: {...} } structure
      // Extract the media object from the response
      let mediaObject = null
      
      if (responseData && typeof responseData === 'object') {
        // Check if response has a 'media' property (standard Cosmic v3 structure)
        if (responseData.media && typeof responseData.media === 'object') {
          mediaObject = responseData.media
          console.log('Successfully extracted media object from response.media')
        } 
        // Fallback: check if the response itself is the media object (has required fields)
        else if (responseData.id && responseData.name && (responseData.url || responseData.imgix_url)) {
          mediaObject = responseData
          console.log('Response is the media object directly')
        }
      }

      // Validate that we have a media object with required fields
      if (!mediaObject || !mediaObject.name) {
        console.error('Invalid media object structure:', {
          hasResponseData: !!responseData,
          hasMediaProperty: !!(responseData && responseData.media),
          responseKeys: responseData ? Object.keys(responseData) : [],
          mediaObjectKeys: mediaObject ? Object.keys(mediaObject) : []
        })
        throw new Error('No valid media object returned from Cosmic - missing required fields')
      }

      // Ensure we have the required fields
      const validatedMediaObject = {
        id: mediaObject.id || '',
        name: mediaObject.name,
        url: mediaObject.url || mediaObject.imgix_url || '',
        imgix_url: mediaObject.imgix_url || mediaObject.url || ''
      }

      console.log('Validated media object:', validatedMediaObject)

      // Create upload object with the uploaded media reference
      const upload = await createUpload({
        ipHash,
        uploadSource: uploadSource || 'web',
        sourceImage: validatedMediaObject
      })

      console.log('Upload object created successfully:', {
        uploadId: upload.id,
        hasSourceImage: !!upload.metadata.source_image
      })

      return NextResponse.json({
        uploadId: upload.id,
        imageUrl: validatedMediaObject.imgix_url || validatedMediaObject.url
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