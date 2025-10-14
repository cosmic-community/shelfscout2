'use client'

import { useState } from 'react'
import { BookPick } from '@/types'

interface BookCardProps {
  pick: BookPick
  slotIndex: number
  recommendationId: string
}

export default function BookCard({ pick, slotIndex, recommendationId }: BookCardProps) {
  const [currentPick, setCurrentPick] = useState(pick)
  const [isSwapping, setIsSwapping] = useState(false)

  const handleClick = async () => {
    await fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recId: recommendationId,
        slotIndex,
        url: currentPick.amazon_url,
      }),
    })
    window.open(currentPick.amazon_url, '_blank', 'noopener,noreferrer')
  }

  const handleSwap = async () => {
    if (!currentPick.alt) return

    setIsSwapping(true)
    try {
      const response = await fetch('/api/alternate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recId: recommendationId,
          slotIndex,
        }),
      })

      if (response.ok) {
        const { alt } = await response.json()
        setCurrentPick({
          ...alt,
          alt: currentPick,
        })
      }
    } catch (error) {
      console.error('Swap error:', error)
    } finally {
      setIsSwapping(false)
    }
  }

  return (
    <div className="card flex flex-col h-full">
      <div className="flex-1">
        <h3 className="text-xl font-serif font-bold text-foreground mb-2">
          {currentPick.title}
        </h3>
        <p className="text-sm text-foreground/70 mb-4">
          by {currentPick.author}
        </p>
        <p className="text-sm text-foreground/80 mb-4">
          {currentPick.reason}
        </p>
        {currentPick.genres && currentPick.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {currentPick.genres.map((genre, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <button
          onClick={handleClick}
          className="btn-primary w-full"
        >
          Buy on Amazon
        </button>
        {currentPick.alt && (
          <button
            onClick={handleSwap}
            disabled={isSwapping}
            className="btn-secondary w-full disabled:opacity-50"
          >
            {isSwapping ? 'Swapping...' : 'Swap'}
          </button>
        )}
      </div>
    </div>
  )
}