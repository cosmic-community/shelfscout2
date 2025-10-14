import { getSettings } from '@/lib/cosmic-server'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function AboutPage() {
  const settings = await getSettings()

  return (
    <div className="min-h-screen flex flex-col">
      <Header siteName={settings.metadata.site_name} showBackButton />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: settings.metadata.about_body || '' }}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}