import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { recordClick } from '@/lib/cosmic-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recId, slotIndex, url } = body

    if (!recId || slotIndex === undefined || !url) {
      return NextResponse.json(
        { error: 'recId, slotIndex, and url required' },
        { status: 400 }
      )
    }

    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'unknown'

    await recordClick(recId, slotIndex, url, userAgent)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    )
  }
}