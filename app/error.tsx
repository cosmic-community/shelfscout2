'use client'

import { useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      <Header siteName="ShelfScout" showBackButton />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
            Something went wrong
          </h2>
          <p className="text-foreground/70 mb-6">
            We encountered an error processing your request.
          </p>
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}