import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-foreground/60">
            © {new Date().getFullYear()} ShelfScout. Powered by{' '}
            <a 
              href="https://www.cosmicjs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Cosmic
            </a>
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/privacy"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/about"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}