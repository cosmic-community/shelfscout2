import { NextRequest, NextResponse } from 'next/server'
import {
  getRecommendation,
  updateRecommendationPicks,
  getSettings,
} from '@/lib/cosmic-server'
import { buildAmazonLink } from '@/lib/utils'

async function generateAlternate(
  ownedBooks: any[],
  currentPicks: any[],
  slotIndex: number,
  amazonTag: string
) {
  // TODO: Implement Cosmic AI Agent llm_reason tool for alternate
  // For now, return mock alternate
  const alternates = [
    { title: 'The Night Circus', author: 'Erin Morgenstern' },
    { title: 'The Martian', author: 'Andy Weir' },
    { title: '21 Lessons for the 21st Century', author: 'Yuval Noah Harari' },
  ]

  const alt = alternates[slotIndex] || alternates[0]

  // Added: Ensure alt exists before using its properties
  if (!alt) {
    throw new Error('No alternate available')
  }

  return {
    title: alt.title,
    author: alt.author,
    reason: 'A carefully selected alternate that matches your reading preferences.',
    amazon_url: buildAmazonLink(alt.title, alt.author, amazonTag)
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