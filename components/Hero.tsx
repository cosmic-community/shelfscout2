import { Settings } from '@/types'
import UploadCard from './UploadCard'

interface HeroProps {
  settings: Settings
}

export default function Hero({ settings }: HeroProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
            {settings.metadata.hero_title}
          </h1>
          <p className="text-xl text-foreground/70 mb-8">
            {settings.metadata.hero_subtitle}
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <UploadCard sampleTitles={settings.metadata.sample_titles} />
        </div>
        
        {settings.metadata.sample_titles.length > 0 && (
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <p className="text-sm text-foreground/60 mb-3">
              Try these examples:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {settings.metadata.sample_titles.map((title, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}