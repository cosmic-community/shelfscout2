import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header siteName="ShelfScout" showBackButton />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-6xl font-serif font-bold text-foreground mb-4">
            404
          </h1>
          <p className="text-xl text-foreground/70 mb-8">
            Page not found
          </p>
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}