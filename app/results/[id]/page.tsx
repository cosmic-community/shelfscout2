// app/results/[id]/page.tsx
import { getRecommendation } from '@/lib/cosmic-server'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import ResultsView from '@/components/ResultsView'
import Footer from '@/components/Footer'

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const recommendation = await getRecommendation(id)

  if (!recommendation) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header siteName="ShelfScout" showBackButton />
      <main className="flex-1 py-12">
        <ResultsView recommendation={recommendation} />
      </main>
      <Footer />
    </div>
  )
}