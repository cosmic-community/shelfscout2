import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import {
  getUpload,
  updateUpload,
  createRecommendation,
  getSettings,
} from '@/lib/cosmic-server'
import { hashIp, buildAmazonLink } from '@/lib/utils'
import { BookPick, OwnedBook } from '@/types'

// Mock AI agent functions (replace with actual Cosmic AI Agent calls)
async function visionDetectBooks(imageUrl: string) {
  // TODO: Implement Cosmic AI Agent vision_detect_books tool
  // For now, return mock data
  return [
    { title_candidate: 'Pachinko', author_candidate: 'Min Jin Lee', confidence: 0.95 },
    { title_candidate: 'Dune', author_candidate: 'Frank Herbert', confidence: 0.92 },
    { title_candidate: 'Sapiens', author_candidate: 'Yuval Noah Harari', confidence: 0.88 },
  ]
}

async function normalizeBooks(candidates: any[]): Promise<OwnedBook[]> {
  // TODO: Implement Cosmic AI Agent fetch_open_library and fetch_google_books tools
  // For now, return normalized mock data
  return candidates.map(c => ({
    title: c.title_candidate,
    author: c.author_candidate,
    isbn13: '9780123456789',
    subjects: ['Fiction', 'Historical'],
    year: 2020
  }))
}

async function generateRecommendations(
  ownedBooks: OwnedBook[],
  amazonTag: string
): Promise<BookPick[]> {
  // TODO: Implement Cosmic AI Agent llm_reason tool for recommendations
  // For now, return mock recommendations
  const mockBooks = [
    {
      title: 'The Overstory',
      author: 'Richard Powers',
      reason: 'Rich storytelling that weaves together multiple perspectives, much like Pachinko.',
      genres: ['Fiction', 'Literary']
    },
    {
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      reason: 'Scientific adventure with world-building depth similar to Dune\'s universe.',
      genres: ['Science Fiction', 'Adventure']
    },
    {
      title: 'Homo Deus',
      author: 'Yuval Noah Harari',
      reason: 'Continues the thought-provoking exploration of humanity begun in Sapiens.',
      genres: ['Nonfiction', 'History']
    }
  ]

  return mockBooks.map(book => ({
    ...book,
    amazon_url: buildAmazonLink(book.title, book.author, amazonTag),
    alt: {
      title: 'Educated',
      author: 'Tara Westover',
      reason: 'Compelling memoir exploring themes of knowledge and transformation.',
      amazon_url: buildAmazonLink('Educated', 'Tara Westover', amazonTag)
    }
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uploadId, manualTitles } = body

    // Get settings for Amazon tag
    const settings = await getSettings()
    const amazonTag = settings.metadata.amazon_tag

    let ownedBooks: OwnedBook[]
    let parsedTitles: any[] = []

    if (uploadId) {
      // Image-based analysis
      const upload = await getUpload(uploadId)
      if (!upload) {
        return NextResponse.json(
          { error: 'Upload not found' },
          { status: 404 }
        )
      }

      if (!upload.metadata.source_image) {
        return NextResponse.json(
          { error: 'No image in upload' },
          { status: 400 }
        )
      }

      // Extract books from image using AI
      parsedTitles = await visionDetectBooks(
        upload.metadata.source_image.imgix_url
      )
      ownedBooks = await normalizeBooks(parsedTitles)

      // Update upload with parsed data
      await updateUpload(uploadId, {
        status: 'analyzed',
        parsed_titles: parsedTitles,
        owned_books: ownedBooks
      })
    } else if (manualTitles && Array.isArray(manualTitles)) {
      // Manual entry analysis
      parsedTitles = manualTitles.map(title => ({
        title_candidate: title,
        confidence: 1.0
      }))
      ownedBooks = await normalizeBooks(parsedTitles)

      // Get IP for rate limiting
      const headersList = await headers()
      const ip = headersList.get('x-forwarded-for') || 
                 headersList.get('x-real-ip') || 
                 'unknown'
      const ipHash = hashIp(ip, process.env.SALT_SECRET || 'default-salt')

      // Create upload record for manual entry
      const { createUpload } = await import('@/lib/cosmic-server')
      const upload = await createUpload({ ipHash })
      await updateUpload(upload.id, {
        status: 'analyzed',
        parsed_titles: parsedTitles,
        owned_books: ownedBooks
      })
      uploadId = upload.id
    } else {
      return NextResponse.json(
        { error: 'Either uploadId or manualTitles required' },
        { status: 400 }
      )
    }

    // Generate recommendations
    const picks = await generateRecommendations(ownedBooks, amazonTag)

    // Create recommendation record
    const recommendation = await createRecommendation(uploadId, picks)

    return NextResponse.json({
      recommendationId: recommendation.id
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze books' },
      { status: 500 }
    )
  }
}