import { getSettings } from '@/lib/cosmic-server'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Footer from '@/components/Footer'

export default async function HomePage() {
  const settings = await getSettings()

  return (
    <div className="min-h-screen flex flex-col">
      <Header siteName={settings.metadata.site_name} />
      <main className="flex-1">
        <Hero settings={settings} />
      </main>
      <Footer />
    </div>
  )
}