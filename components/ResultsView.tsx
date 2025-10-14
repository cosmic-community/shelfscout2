'use client'

import { Recommendation } from '@/types'
import BookCard from './BookCard'
import ShareBar from './ShareBar'

interface ResultsViewProps {
  recommendation: Recommendation
}

export default function ResultsView({ recommendation }: ResultsViewProps) {
  const picks = recommendation.metadata.picks

  if (!picks || picks.length === 0) {
    return (
      <div className="container mx-auto px-4">
        <div className="card text-center">
          <p className="text-foreground/60">No recommendations found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Your picks are ready
          </h1>
          <p className="text-lg text-foreground/70">
            Three carefully selected recommendations based on your reading preferences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {picks.map((pick, index) => (
            <BookCard
              key={index}
              pick={pick}
              slotIndex={index}
              recommendationId={recommendation.id}
            />
          ))}
        </div>

        <ShareBar recommendationId={recommendation.id} />
      </div>
    </div>
  )
}