import { createBucketClient } from '@cosmicjs/sdk'

// Extended type definition for Cosmic SDK with AI support
type CosmicClientWithAI = ReturnType<typeof createBucketClient> & {
  ai: {
    generateText: (options: {
      prompt?: string
      messages?: Array<{ role: string; content: string }>
      max_tokens?: number
      media_url?: string
      stream?: boolean
    }) => Promise<{
      text: string
      usage: {
        input_tokens: number
        output_tokens: number
      }
    }>
    generateImage: (options: {
      prompt: string
      folder?: string
      alt_text?: string
      metadata?: Record<string, any>
    }) => Promise<{
      media: {
        id: string
        name: string
        url: string
        imgix_url: string
      }
    }>
  }
}

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
}) as CosmicClientWithAI

// Validate environment variables
if (!process.env.COSMIC_BUCKET_SLUG) {
  throw new Error('COSMIC_BUCKET_SLUG environment variable is required')
}
if (!process.env.COSMIC_READ_KEY) {
  throw new Error('COSMIC_READ_KEY environment variable is required')
}
if (!process.env.COSMIC_WRITE_KEY) {
  throw new Error('COSMIC_WRITE_KEY environment variable is required')
}