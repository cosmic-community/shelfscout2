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

// Cosmic AI Agent functions
async function visionDetectBooks(imageUrl: string) {
  try {
    // Use Cosmic AI Agent to detect books from image
    const response = await cosmic.ai.agent({
      messages: [
        {
          role: 'user',
          content: `Analyze this bookshelf image and extract all visible book titles and authors. For each book detected, provide the title, author (if visible), and a confidence score between 0 and 1. Return the results as a JSON array with objects containing: title_candidate, author_candidate (if visible), and confidence.`,
        },
      ],
      tools: [
        {
          type: 'vision_detect_books',
          image_url: imageUrl,
        },
      ],
    })

    // Parse the AI response
    if (response.choices && response.choices[0]?.message?.content) {
      const content = response.choices[0].message.content
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    // Fallback if parsing fails
    return []
  } catch (error) {
    console.error('Vision detection error:', error)
    throw new Error('Failed to analyze bookshelf image')
  }
}

async function normalizeBooks(candidates: any[]): Promise<OwnedBook[]> {
  try {
    const normalized: OwnedBook[] = []

    for (const candidate of candidates) {
      try {
        // Use Cosmic AI Agent to fetch metadata from Open Library and Google Books
        const response = await cosmic.ai.agent({
          messages: [
            {
              role: 'user',
              content: `Find detailed metadata for the book titled "${candidate.title_candidate}"${
                candidate.author_candidate ? ` by ${candidate.author_candidate}` : ''
              }. Look up ISBN-13, subjects/genres, publication year, and verified author name. Return as JSON with fields: title, author, isbn13, subjects (array), year.`,
            },
          ],
          tools: [
            {
              type: 'fetch_open_library',
              query: candidate.title_candidate,
            },
            {
              type: 'fetch_google_books',
              query: candidate.title_candidate,
            },
          ],
        })

        // Parse the response
        if (response.choices && response.choices[0]?.message?.content) {
          const content = response.choices[0].message.content
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const bookData = JSON.parse(jsonMatch[0])
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

    // Use Cosmic AI Agent to generate personalized recommendations
    const response = await cosmic.ai.agent({
      messages: [
        {
          role: 'user',
          content: `Based on these books owned by the user: ${ownedBooksDesc}

Analyze their reading preferences and recommend exactly 3 books they would enjoy. For each recommendation:
1. Choose a book that matches their taste but they likely don't own
2. Explain why it's a good match (2-3 sentences)
3. Include the genre(s)
4. Suggest one alternate book as a backup

Return as a JSON array with exactly 3 objects, each containing:
- title: string
- author: string
- reason: string (explanation of why it matches their taste)
- genres: string[] (array of genres)
- alt: object with {title: string, author: string, reason: string}

Make the recommendations diverse across different genres represented in their collection.`,
        },
      ],
      tools: [
        {
          type: 'llm_reason',
          context: `User's books: ${ownedBooksDesc}`,
        },
      ],
    })

    // Parse the AI response
    if (response.choices && response.choices[0]?.message?.content) {
      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0])

        // Add Amazon URLs to recommendations
        return recommendations.slice(0, 3).map((book: any) => ({
          title: book.title,
          author: book.author,
          reason: book.reason,
          genres: book.genres || [],
          amazon_url: buildAmazonLink(book.title, book.author, amazonTag),
          alt: {
            title: book.alt?.title || 'The Great Book',
            author: book.alt?.author || 'Unknown Author',
            reason:
              book.alt?.reason || 'A carefully selected alternate that matches your reading preferences.',
            amazon_url: buildAmazonLink(
              book.alt?.title || 'The Great Book',
              book.alt?.author || 'Unknown Author',
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

      console.log('Analyzing image:', upload.metadata.source_image.imgix_url)

      // Extract books from image using AI
      parsedTitles = await visionDetectBooks(upload.metadata.source_image.imgix_url)
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