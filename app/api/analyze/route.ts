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
import { cosmic } from '@/lib/cosmic'

async function visionDetectBooks(imageUrl: string) {
  try {
    console.log('Analyzing bookshelf image with AI vision:', imageUrl)
    
    // Use Cosmic AI to detect books from image
    const response = await cosmic.ai.generateText({
      prompt: `You are analyzing a bookshelf image. Extract all visible book titles and authors from this image.

For each book you can identify:
1. Extract the title (required)
2. Extract the author if visible (optional)
3. Assign a confidence score from 0.0 to 1.0 based on how clearly you can read it

Return your response as a JSON array with this exact format:
[
  {
    "title_candidate": "Book Title Here",
    "author_candidate": "Author Name" or null,
    "confidence": 0.95
  }
]

Important:
- Only include books where you can clearly read at least part of the title
- If you can't read the author, set author_candidate to null
- Be conservative with confidence scores
- Return ONLY the JSON array, no other text`,
      media_url: imageUrl,
      max_tokens: 2000
    })

    console.log('AI vision response received')

    // Parse the AI response
    if (response.text) {
      console.log('AI response text:', response.text)
      
      // Try to extract JSON from the response
      const jsonMatch = response.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const books = JSON.parse(jsonMatch[0])
        console.log('Extracted books from image:', books)
        return books
      }
    }

    console.warn('No books detected in image - falling back to empty array')
    return []
  } catch (error) {
    console.error('Vision detection error:', error)
    throw new Error(`Failed to analyze bookshelf image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function normalizeBooks(candidates: any[]): Promise<OwnedBook[]> {
  try {
    const normalized: OwnedBook[] = []

    for (const candidate of candidates) {
      try {
        console.log('Normalizing book:', candidate.title_candidate)
        
        // Use Cosmic AI to fetch metadata from Open Library and Google Books
        const response = await cosmic.ai.generateText({
          prompt: `Find detailed metadata for the book titled "${candidate.title_candidate}"${
            candidate.author_candidate ? ` by ${candidate.author_candidate}` : ''
          }. 

Search Open Library and Google Books APIs for this book. Return as JSON with these fields:
{
  "title": "verified title",
  "author": "verified author name",
  "isbn13": "ISBN-13 if found" or null,
  "subjects": ["genre1", "genre2"],
  "year": publication_year or null
}

If you can't find exact data, use the original title and author provided, but try to infer likely genres based on the title.
Return ONLY the JSON object, no other text.`,
          max_tokens: 500
        })

        // Parse the response
        if (response.text) {
          const jsonMatch = response.text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const bookData = JSON.parse(jsonMatch[0])
            console.log('Normalized book data:', bookData)
            normalized.push({
              title: bookData.title || candidate.title_candidate,
              author: bookData.author || candidate.author_candidate,
              isbn13: bookData.isbn13,
              subjects: bookData.subjects || [],
              year: bookData.year,
            })
            continue
          }
        }

        // Fallback if parsing fails - use candidate data
        console.warn('Could not normalize book, using raw data:', candidate.title_candidate)
        normalized.push({
          title: candidate.title_candidate,
          author: candidate.author_candidate,
          isbn13: undefined,
          subjects: [],
          year: undefined,
        })
      } catch (error) {
        console.error(`Error normalizing book ${candidate.title_candidate}:`, error)
        // Add the book with minimal data
        normalized.push({
          title: candidate.title_candidate,
          author: candidate.author_candidate,
          isbn13: undefined,
          subjects: [],
          year: undefined,
        })
      }
    }

    return normalized
  } catch (error) {
    console.error('Book normalization error:', error)
    throw new Error('Failed to normalize book metadata')
  }
}

async function generateRecommendations(
  ownedBooks: OwnedBook[],
  amazonTag: string
): Promise<BookPick[]> {
  try {
    // Build a description of owned books
    const ownedBooksDesc = ownedBooks
      .map((book) => {
        const parts = [book.title]
        if (book.author) parts.push(`by ${book.author}`)
        if (book.subjects && book.subjects.length > 0) {
          parts.push(`(${book.subjects.join(', ')})`)
        }
        return parts.join(' ')
      })
      .join('; ')

    console.log('Generating recommendations based on:', ownedBooksDesc)

    // Use Cosmic AI to generate personalized recommendations
    const response = await cosmic.ai.generateText({
      prompt: `Based on these books owned by the user: ${ownedBooksDesc}

Analyze their reading preferences and recommend exactly 3 books they would enjoy. For each recommendation:
1. Choose a book that matches their taste but they likely don't own
2. Explain why it's a good match (2-3 sentences)
3. Include the genre(s)
4. Suggest one alternate book as a backup

Return as a JSON array with exactly 3 objects, each containing:
{
  "title": "string",
  "author": "string",
  "reason": "string (explanation of why it matches their taste)",
  "genres": ["genre1", "genre2"],
  "alt": {
    "title": "string",
    "author": "string",
    "reason": "string"
  }
}

Make the recommendations diverse across different genres represented in their collection.
Return ONLY the JSON array, no other text.`,
      max_tokens: 2000
    })

    // Parse the AI response
    if (response.text) {
      const jsonMatch = response.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0])
        console.log('Generated recommendations:', recommendations)

        // Add Amazon URLs to recommendations
        return recommendations.slice(0, 3).map((book: any) => ({
          title: book.title,
          author: book.author,
          reason: book.reason,
          genres: book.genres || [],
          amazon_url: buildAmazonLink(book.title, book.author, amazonTag),
          alt: {
            title: book.alt?.title || 'The Seven Husbands of Evelyn Hugo',
            author: book.alt?.author || 'Taylor Jenkins Reid',
            reason:
              book.alt?.reason || 'A captivating story that offers a different perspective on your interests.',
            amazon_url: buildAmazonLink(
              book.alt?.title || 'The Seven Husbands of Evelyn Hugo',
              book.alt?.author || 'Taylor Jenkins Reid',
              amazonTag
            ),
          },
        }))
      }
    }

    // Fallback if AI fails
    throw new Error('Failed to parse AI recommendations')
  } catch (error) {
    console.error('Recommendation generation error:', error)
    // Return sensible default recommendations
    const fallbackBooks = [
      {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        reason:
          'A thought-provoking exploration of choices and parallel lives that resonates with readers who enjoy philosophical fiction.',
        genres: ['Fiction', 'Contemporary'],
      },
      {
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        reason: 'An engaging science fiction adventure with humor and problem-solving that appeals to diverse readers.',
        genres: ['Science Fiction', 'Adventure'],
      },
      {
        title: 'Educated',
        author: 'Tara Westover',
        reason:
          'A compelling memoir about self-discovery and the transformative power of education.',
        genres: ['Memoir', 'Nonfiction'],
      },
    ]

    return fallbackBooks.map((book) => ({
      ...book,
      amazon_url: buildAmazonLink(book.title, book.author, amazonTag),
      alt: {
        title: 'The Seven Husbands of Evelyn Hugo',
        author: 'Taylor Jenkins Reid',
        reason: 'A captivating story that offers a different perspective on your interests.',
        amazon_url: buildAmazonLink(
          'The Seven Husbands of Evelyn Hugo',
          'Taylor Jenkins Reid',
          amazonTag
        ),
      },
    }))
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { uploadId, manualTitles } = body

    // Get settings for Amazon tag
    const settings = await getSettings()
    const amazonTag = settings.metadata.amazon_tag

    let ownedBooks: OwnedBook[]
    let parsedTitles: any[] = []

    if (uploadId) {
      // Image-based analysis
      const upload = await getUpload(uploadId)
      if (!upload) {
        return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
      }

      if (!upload.metadata.source_image) {
        return NextResponse.json({ error: 'No image in upload' }, { status: 400 })
      }

      // Handle source_image whether it's a string or object
      // When fetched from Cosmic with depth, file metafields become full objects
      const sourceImage = upload.metadata.source_image
      const imageUrl = typeof sourceImage === 'string' 
        ? sourceImage 
        : sourceImage.imgix_url

      console.log('Analyzing image:', imageUrl)

      // Extract books from image using AI
      parsedTitles = await visionDetectBooks(imageUrl)
      ownedBooks = await normalizeBooks(parsedTitles)

      // Update upload with parsed data
      await updateUpload(uploadId, {
        status: 'analyzed',
        parsed_titles: parsedTitles,
        owned_books: ownedBooks,
      })
    } else if (manualTitles && Array.isArray(manualTitles)) {
      // Manual entry analysis
      parsedTitles = manualTitles.map((title) => ({
        title_candidate: title,
        confidence: 1.0,
      }))
      ownedBooks = await normalizeBooks(parsedTitles)

      // Get IP for rate limiting
      const headersList = await headers()
      const ip =
        headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      const ipHash = hashIp(ip, process.env.SALT_SECRET || 'default-salt')

      // Create upload record for manual entry
      const { createUpload } = await import('@/lib/cosmic-server')
      const upload = await createUpload({ ipHash })
      await updateUpload(upload.id, {
        status: 'analyzed',
        parsed_titles: parsedTitles,
        owned_books: ownedBooks,
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
      recommendationId: recommendation.id,
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze books' },
      { status: 500 }
    )
  }
}