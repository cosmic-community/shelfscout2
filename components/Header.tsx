import Link from 'next/link'

interface HeaderProps {
  siteName: string
  showBackButton?: boolean
}

export default function Header({ siteName, showBackButton }: HeaderProps) {
  return (
    <header className="border-b border-border bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="text-2xl font-serif font-bold text-foreground hover:text-primary transition-colors"
          >
            {siteName}
          </Link>
          
          <nav className="flex items-center gap-6">
            {showBackButton && (
              <Link 
                href="/"
                className="text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                ← New Analysis
              </Link>
            )}
            <Link 
              href="/about"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              href="/privacy"
              className="text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}