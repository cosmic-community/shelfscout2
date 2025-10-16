import { NextRequest, NextResponse } from 'next/server'
import {
  getRecommendation,
  updateRecommendationPicks,
  getSettings,
} from '@/lib/cosmic-server'
import { buildAmazonLink } from '@/lib/utils'
import { cosmic } from '@/lib/cosmic'

async function generateAlternate(
  ownedBooks: any[],
  currentPicks: any[],
  slotIndex: number,
  amazonTag: string
) {
  try {
    // Build context about owned books
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

    // Build context about current picks
    const currentPicksDesc = currentPicks
      .map((pick, idx) => `${idx + 1}. ${pick.title} by ${pick.author}`)
      .join('; ')

    // Use Cosmic AI Agent to generate alternate recommendation
    const response = await cosmic.ai.agent({
      messages: [
        {
          role: 'user',
          content: `Based on these books owned by the user: ${ownedBooksDesc}

Current recommendations: ${currentPicksDesc}

Generate ONE alternate recommendation for slot ${slotIndex + 1} that:
1. Matches the user's reading preferences
2. Is different from the current recommendations
3. Would be a great substitute

Return as a JSON object with:
- title: string
- author: string
- reason: string (2-3 sentences explaining why it's a good match)

Only return the JSON object, no other text.`,
        },
      ],
      model: 'gpt-4',
    })

    // Parse the AI response
    if (response.choices && response.choices[0]?.message?.content) {
      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const alt = JSON.parse(jsonMatch[0])
        return {
          title: alt.title,
          author: alt.author,
          reason: alt.reason,
          amazon_url: buildAmazonLink(alt.title, alt.author, amazonTag),
        }
      }
    }

    throw new Error('Failed to parse AI response')
  } catch (error) {
    console.error('Alternate generation error:', error)
    // Fallback to preset alternates
    const alternates = [
      { title: 'The Night Circus', author: 'Erin Morgenstern' },
      { title: 'The Martian', author: 'Andy Weir' },
      { title: '21 Lessons for the 21st Century', author: 'Yuval Noah Harari' },
    ]

    const alt = alternates[slotIndex] || alternates[0]

    return {
      title: alt.title,
      author: alt.author,
      reason: 'A carefully selected alternate that matches your reading preferences.',
      amazon_url: buildAmazonLink(alt.title, alt.author, amazonTag),
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recId, slotIndex } = body

    if (!recId || slotIndex === undefined) {
      return NextResponse.json(
        { error: 'recId and slotIndex required' },
        { status: 400 }
      )
    }

    const recommendation = await getRecommendation(recId)
    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    const settings = await getSettings()
    const amazonTag = settings.metadata.amazon_tag

    // Get owned books from linked upload
    const ownedBooks = recommendation.metadata.upload?.metadata.owned_books || []
    const currentPicks = recommendation.metadata.picks

    // Generate alternate
    const alt = await generateAlternate(
      ownedBooks,
      currentPicks,
      slotIndex,
      amazonTag
    )

    // Update the picks with new alternate
    const updatedPicks = [...currentPicks]
    if (updatedPicks[slotIndex]) {
      updatedPicks[slotIndex].alt = alt
    }

    await updateRecommendationPicks(recId, updatedPicks)

    return NextResponse.json({ alt })
  } catch (error) {
    console.error('Alternate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate alternate' },
      { status: 500 }
    )
  }
}