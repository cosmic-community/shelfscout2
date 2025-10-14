'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from './LoadingSpinner'

interface UploadCardProps {
  sampleTitles: string[]
}

export default function UploadCard({ sampleTitles }: UploadCardProps) {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [manualText, setManualText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!preview) return

    setIsProcessing(true)
    setError(null)

    try {
      // Convert base64 to blob
      const response = await fetch(preview)
      const blob = await response.blob()
      const file = new File([blob], 'bookshelf.jpg', { type: 'image/jpeg' })

      // Upload image
      const formData = new FormData()
      formData.append('image', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { uploadId } = await uploadRes.json()

      // Analyze
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      })

      if (!analyzeRes.ok) {
        throw new Error('Analysis failed')
      }

      const { recommendationId } = await analyzeRes.json()
      router.push(`/results/${recommendationId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsProcessing(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return

    setIsProcessing(true)
    setError(null)

    try {
      const titles = manualText
        .split(/[;\n]/)
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualTitles: titles }),
      })

      if (!analyzeRes.ok) {
        throw new Error('Analysis failed')
      }

      const { recommendationId } = await analyzeRes.json()
      router.push(`/results/${recommendationId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsProcessing(false)
    }
  }

  if (isProcessing) {
    return (
      <div className="card">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif font-semibold">
          {mode === 'upload' ? 'Upload Photo' : 'Enter Titles'}
        </h2>
        <button
          onClick={() => {
            setMode(mode === 'upload' ? 'manual' : 'upload')
            setPreview(null)
            setManualText('')
            setError(null)
          }}
          className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          {mode === 'upload' ? 'Type titles instead' : 'Upload photo instead'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {mode === 'upload' ? (
        <>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setPreview(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="btn-secondary"
                  >
                    Choose Different
                  </button>
                  <button onClick={handleUpload} className="btn-primary">
                    Analyze My Shelf
                  </button>
                </div>
              </div>
            ) : (
              <>
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-foreground/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-foreground/70 mb-4">
                  Drag and drop your bookshelf photo here, or
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  Choose Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Enter book titles, separated by semicolons or new lines&#10;&#10;Example:&#10;Pachinko; Dune; Sapiens"
            className="input min-h-[200px] mb-4 resize-none"
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualText.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze My Titles
          </button>
        </>
      )}
    </div>
  )
}