import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import CosmicBadge from '@/components/CosmicBadge'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ShelfScout by Cosmic - Smart book picks from your bookshelf photo',
  description: 'Upload a photo of your books or paste a few titles. Cosmic AI recommends three great reads with one click Amazon links.',
  openGraph: {
    title: 'ShelfScout by Cosmic',
    description: 'Upload a photo of your books or paste a few titles. Cosmic AI recommends three great reads with one click Amazon links.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=630&fit=crop&auto=format',
        width: 1200,
        height: 630,
        alt: 'ShelfScout - Book Recommendations'
      }
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bucketSlug = process.env.COSMIC_BUCKET_SLUG as string

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script src="/dashboard-console-capture.js" />
      </head>
      <body>
        {children}
        <CosmicBadge bucketSlug={bucketSlug} />
      </body>
    </html>
  )
}