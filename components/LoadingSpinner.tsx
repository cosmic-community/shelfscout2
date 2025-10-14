export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <div className="space-y-3 text-center">
        <h3 className="text-lg font-serif font-semibold text-foreground">
          Analyzing your bookshelf...
        </h3>
        <div className="space-y-2 text-sm text-foreground/60">
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Detecting book titles
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></span>
            Normalizing metadata
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></span>
            Inferring preferences
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300"></span>
            Generating recommendations
          </p>
        </div>
      </div>
    </div>
  )
}